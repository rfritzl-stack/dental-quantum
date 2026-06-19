import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

// Función de validación de RUT Chileno
function validarRut(rut: string): boolean {
  const cleanRut = rut.replace(/[^0-9kK]/g, "");
  if (cleanRut.length < 2) return false;

  const cuerpo = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toLowerCase();

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvr = 11 - (suma % 11);
  const dvEsperado = dvr === 11 ? "0" : dvr === 10 ? "k" : String(dvr);

  return dv === dvEsperado;
}

// Función para normalizar el formato del RUT (12345678-9)
function normalizarRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return rut;
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1).toLowerCase();
  return `${cuerpo}-${dv}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      especialidad_id,
      profesional_id,
      fecha, // YYYY-MM-DD
      hora, // HH:MM
      paciente_rut,
      paciente_nombre,
      paciente_apellido,
      paciente_email,
      paciente_telefono,
      primera_vez,
      como_encontro,
      comentario,
    } = body;

    // 1. Validaciones básicas de campos
    if (
      !especialidad_id ||
      !profesional_id ||
      !fecha ||
      !hora ||
      !paciente_rut ||
      !paciente_nombre ||
      !paciente_apellido ||
      !paciente_email ||
      !paciente_telefono
    ) {
      return NextResponse.json(
        { error: "Todos los campos de contacto y selección de hora son obligatorios" },
        { status: 400 }
      );
    }

    // 2. Validar RUT
    if (!validarRut(paciente_rut)) {
      return NextResponse.json(
        { error: "El RUT ingresado no es válido" },
        { status: 400 }
      );
    }

    const rutNormalizado = normalizarRut(paciente_rut);

    // 3. Buscar especialidad y profesional
    const especialidad = await prisma.especialidad.findUnique({
      where: { id: especialidad_id },
    });
    const profesional = await prisma.profesional.findUnique({
      where: { id: profesional_id },
    });

    if (!especialidad || !profesional) {
      return NextResponse.json(
        { error: "Especialidad o Profesional no encontrados" },
        { status: 404 }
      );
    }

    // 4. Calcular rango de fecha/hora
    const [year, month, day] = fecha.split("-").map(Number);
    const [startHour, startMin] = hora.split(":").map(Number);
    
    const fechaHoraInicio = new Date(year, month - 1, day, startHour, startMin, 0, 0);
    const duracion = especialidad.duracion_minutos || 30;
    const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracion * 60000);

    // 5. Registrar o actualizar Paciente
    let paciente = await prisma.paciente.findUnique({
      where: { rut: rutNormalizado },
    });

    if (paciente) {
      // Actualizar datos de contacto si ya existe
      paciente = await prisma.paciente.update({
        where: { id: paciente.id },
        data: {
          nombre: paciente_nombre,
          apellido: paciente_apellido,
          email: paciente_email,
          telefono: paciente_telefono,
          activo: true,
        },
      });
    } else {
      // Crear nuevo paciente
      paciente = await prisma.paciente.create({
        data: {
          rut: rutNormalizado,
          nombre: paciente_nombre,
          apellido: paciente_apellido,
          email: paciente_email,
          telefono: paciente_telefono,
          activo: true,
        },
      });
    }

    // 6. Crear la Cita (dq_agendas)
    const agenda = await prisma.agenda.create({
      data: {
        paciente_id: paciente.id,
        profesional_id: profesional.id,
        especialidad_id: especialidad.id,
        fecha_hora_inicio: fechaHoraInicio,
        fecha_hora_fin: fechaHoraFin,
        estado: "pendiente",
        motivo_consulta: comentario || `Primera consulta: ${primera_vez ? "Sí" : "No"}. Encontrado vía: ${como_encontro || "No especificado"}`,
        notas_recepcion: `Origen: Sitio Web. Cómo encontró: ${como_encontro || "No especificado"}`,
      },
    });

    // 7. Insertar en la lista de WhatsApp (Fase 1: Semi-manual)
    const diaSemanaNombre = fechaHoraInicio.toLocaleDateString("es-CL", { weekday: "long" });
    const fechaFormateada = fechaHoraInicio.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaFormateada = hora;

    const mensajeGenerado = `Hola ${paciente_nombre}, le recordamos que tiene una hora agendada en Clínica Dental Quantum mañana ${diaSemanaNombre} ${fechaFormateada} a las ${horaFormateada} con el Dr/Dra. ${profesional.apellido} (${especialidad.nombre}). Clínica ubicada en Av. Kennedy 7100 Of. 706, Vitacura. Por favor confírmenos su asistencia respondiendo este mensaje. Si necesita reagendar: (56-2) 2953 9291`;

    await prisma.whatsappLista.create({
      data: {
        agenda_id: agenda.id,
        paciente_nombre: `${paciente_nombre} ${paciente_apellido}`,
        paciente_telefono,
        mensaje_generado: mensajeGenerado,
        fecha_cita: fechaHoraInicio,
        estado_envio: "pendiente",
      },
    });

    // 8. Sincronizar con Google Calendar (Simulado o real)
    const calendarSummary = `Cita Odontológica: ${paciente_nombre} ${paciente_apellido}`;
    const calendarDescription = `Paciente: ${paciente_nombre} ${paciente_apellido}\nRUT: ${rutNormalizado}\nTeléfono: ${paciente_telefono}\nEspecialidad: ${especialidad.nombre}\nComentario: ${comentario || "Ninguno"}`;
    
    const calResult = await createGoogleCalendarEvent({
      summary: calendarSummary,
      description: calendarDescription,
      startDateTime: fechaHoraInicio,
      endDateTime: fechaHoraFin,
      organizerEmail: profesional.calendario_google_id || profesional.email,
    });

    if (calResult.success && calResult.eventId) {
      // Actualizar evento en db
      await prisma.agenda.update({
        where: { id: agenda.id },
        data: { google_event_id: calResult.eventId },
      });
    }

    // 9. Enviar email de confirmación al paciente (Simulado o real)
    await sendEmail({
      to: paciente_email,
      subject: `Cita Confirmada - Clínica Dental Quantum`,
      html: `
        <div style="font-family: sans-serif; color: #0B1F3A; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="color: #00C4B4; border-bottom: 2px solid #00C4B4; padding-bottom: 8px;">Cita Agendada con Éxito</h2>
          <p>Estimado/a <strong>${paciente_nombre} ${paciente_apellido}</strong>,</p>
          <p>Confirmamos que su hora ha sido reservada correctamente en nuestro sistema. A continuación se detallan los datos de su cita:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Dentista</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dr/Dra. ${profesional.nombre} ${profesional.apellido}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Especialidad</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${especialidad.nombre}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Fecha</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${fechaFormateada} (${diaSemanaNombre})</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Hora</td>
              <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${horaFormateada} hrs</td>
            </tr>
          </table>

          <div style="background-color: #fef3c7; border-left: 4px solid #D4900A; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 14px;">
            <strong>Dirección de la Clínica:</strong><br/>
            Av. Kennedy 7100, Oficina 706, Vitacura, Santiago.<br/>
            Fono: (56-2) 2953 9291
          </div>

          <p style="font-size: 13px; color: #64748b;">
            * Si necesita reagendar o cancelar su cita, le solicitamos hacerlo con al menos 24 horas de anticipación llamando a nuestro teléfono de contacto.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="text-align: center; font-weight: bold; font-size: 14px; color: #0B1F3A;">Clínica Dental Quantum</p>
        </div>
      `,
      text: `Hola ${paciente_nombre}. Tu cita de ${especialidad.nombre} con el Dr/Dra. ${profesional.apellido} está reservada para el ${fechaFormateada} a las ${horaFormateada} hrs en Av. Kennedy 7100 Of. 706, Vitacura.`,
    });

    return NextResponse.json(
      {
        success: true,
        agendaId: agenda.id,
        pacienteId: paciente.id,
        fecha: fechaFormateada,
        hora: horaFormateada,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Error interno al agendar la hora", details: message },
      { status: 500 }
    );
  }
}
