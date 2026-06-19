import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get("fecha"); // YYYY-MM-DD

    if (!fechaStr) {
      return NextResponse.json({ error: "Falta el parámetro fecha" }, { status: 400 });
    }

    const [year, month, day] = fechaStr.split("-").map(Number);
    const dateQuery = new Date(year, month - 1, day);

    // 1. Consultar si ya existen registros en dq_whatsapp_lista para este día
    let listaEnvios = await prisma.whatsappLista.findMany({
      where: {
        fecha_cita: dateQuery,
      },
      include: {
        agenda: {
          include: {
            especialidad: { select: { nombre: true } },
            profesional: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    // 2. Si no existen registros en la lista de WhatsApp, pero sí existen citas agendadas, poblamos la lista en tiempo real
    if (listaEnvios.length === 0) {
      const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dateEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

      const agendas = await prisma.agenda.findMany({
        where: {
          fecha_hora_inicio: {
            gte: dateStart,
            lte: dateEnd,
          },
          estado: {
            notIn: ["cancelada", "no_show"],
          },
        },
        include: {
          paciente: true,
          especialidad: true,
          profesional: true,
        },
      });

      // Insertar masivamente
      for (const agenda of agendas) {
        const horaStr = new Date(agenda.fecha_hora_inicio).toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const msg = `Hola ${agenda.paciente.nombre}, le recordamos que tiene una hora agendada en Clínica Dental Quantum el ${fechaStr} a las ${horaStr} hrs con el Dr(a). ${agenda.profesional.apellido} (${agenda.especialidad.nombre}). Clínica ubicada en Av. Kennedy 7100 Of. 706, Vitacura. Por favor confírmenos su asistencia respondiendo este mensaje. Si necesita reagendar: (56-2) 2953 9291`;

        await prisma.whatsappLista.create({
          data: {
            agenda_id: agenda.id,
            paciente_nombre: `${agenda.paciente.nombre} ${agenda.paciente.apellido}`,
            paciente_telefono: agenda.paciente.telefono || "+56912345678",
            mensaje_generado: msg,
            fecha_cita: dateQuery,
            estado_envio: "pendiente",
          },
        });
      }

      // Re-consultar la lista actualizada
      listaEnvios = await prisma.whatsappLista.findMany({
        where: {
          fecha_cita: dateQuery,
        },
        include: {
          agenda: {
            include: {
              especialidad: { select: { nombre: true } },
              profesional: { select: { nombre: true, apellido: true } },
            },
          },
        },
      });
    }

    return NextResponse.json({ lista: listaEnvios });
  } catch (error) {
    console.error("Error loading whatsapp list:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, estado_envio } = await request.json();

    if (!id || !estado_envio) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    const actualizado = await prisma.whatsappLista.update({
      where: { id },
      data: {
        estado_envio,
        enviado_en: estado_envio !== "pendiente" ? new Date() : null,
      },
    });

    // Si el estado es "confirmado", podemos actualizar también el estado en la tabla dg_agendas
    if (actualizado.estado_envio === "confirmado") {
      await prisma.agenda.update({
        where: { id: actualizado.agenda_id },
        data: { estado: "confirmada" },
      });
    } else if (actualizado.estado_envio === "cancelado") {
      await prisma.agenda.update({
        where: { id: actualizado.agenda_id },
        data: { estado: "cancelada" },
      });
    }

    return NextResponse.json({ success: true, item: actualizado });
  } catch (error) {
    console.error("Error updating whatsapp list status:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
