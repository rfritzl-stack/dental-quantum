import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profesionalId = searchParams.get("profesional_id");
    const fechaStr = searchParams.get("fecha"); // YYYY-MM-DD
    const especialidadId = searchParams.get("especialidad_id");

    if (!profesionalId || !fechaStr || !especialidadId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: profesional_id, fecha, especialidad_id" },
        { status: 400 }
      );
    }

    // 1. Obtener la especialidad para conocer la duración en minutos
    const especialidad = await prisma.especialidad.findUnique({
      where: { id: especialidadId },
    });

    if (!especialidad || !especialidad.activa) {
      return NextResponse.json({ error: "Especialidad no válida o inactiva" }, { status: 404 });
    }

    const duracion = especialidad.duracion_minutos || 30;

    // 2. Obtener el profesional
    const profesional = await prisma.profesional.findUnique({
      where: { id: profesionalId },
    });

    if (!profesional || !profesional.activo) {
      return NextResponse.json({ error: "Profesional no disponible" }, { status: 404 });
    }

    // Verificar si el profesional atiende la especialidad
    if (!profesional.especialidades.includes(especialidad.slug)) {
      return NextResponse.json(
        { error: "El profesional no atiende esta especialidad" },
        { status: 400 }
      );
    }

    // 3. Determinar el día de la semana de la fecha solicitada
    // Usamos el desglose de fecha para evitar desfases de zona horaria (UTC vs Local)
    const [year, month, day] = fechaStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0: Domingo, 1: Lunes, etc.

    // 4. Obtener horarios base del profesional para este día de la semana
    const horarioBaseRaw = profesional.horario_base;
    if (!horarioBaseRaw || !Array.isArray(horarioBaseRaw)) {
      return NextResponse.json({ slots: [] }); // Sin horario base
    }

    // Filtrar horarios que correspondan a este día de la semana
    const turnosHoy = (horarioBaseRaw as Array<{ day: number; start: string; end: string }>).filter((t) => t.day === dayOfWeek);
    if (turnosHoy.length === 0) {
      return NextResponse.json({ slots: [] }); // No atiende este día
    }

    // 5. Generar slots candidatos para cada rango
    const slotsCandidatos: { start: Date; end: Date; label: string }[] = [];

    turnosHoy.forEach((turno) => {
      const [startHour, startMin] = turno.start.split(":").map(Number);
      const [endHour, endMin] = turno.end.split(":").map(Number);

      const startRange = new Date(year, month - 1, day, startHour, startMin, 0, 0);
      const endRange = new Date(year, month - 1, day, endHour, endMin, 0, 0);

      let currentSlotStart = new Date(startRange);

      while (currentSlotStart.getTime() + duracion * 60000 <= endRange.getTime()) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + duracion * 60000);
        
        // Formatear etiqueta (HH:MM)
        const hourLabel = String(currentSlotStart.getHours()).padStart(2, "0");
        const minLabel = String(currentSlotStart.getMinutes()).padStart(2, "0");
        
        slotsCandidatos.push({
          start: new Date(currentSlotStart),
          end: new Date(currentSlotEnd),
          label: `${hourLabel}:${minLabel}`,
        });

        // Avanzar el slot según la duración de la especialidad
        currentSlotStart = new Date(currentSlotEnd);
      }
    });

    // 6. Consultar agendas existentes para este profesional en la fecha indicada
    const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dateEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

    const agendasExistentes = await prisma.agenda.findMany({
      where: {
        profesional_id: profesionalId,
        fecha_hora_inicio: {
          gte: dateStart,
        },
        fecha_hora_fin: {
          lte: dateEnd,
        },
        estado: {
          notIn: ["cancelada", "no_show"],
        },
      },
    });

    // 7. Consultar bloqueos existentes para este profesional
    const bloqueos = await prisma.bloqueo.findMany({
      where: {
        profesional_id: profesionalId,
        OR: [
          {
            fecha_inicio: {
              lte: dateEnd,
            },
            fecha_fin: {
              gte: dateStart,
            },
          },
        ],
      },
    });

    // 8. Filtrar los slots candidatos cruzándolos con agendas, bloqueos y límite de anticipación
    const cutoffMinutos = Number(process.env.AGENDA_MINUTOS_ANTICIPACION) || 120; // 2 horas de anticipación
    const ahora = new Date();
    const limiteFuturo = new Date(ahora.getTime() + cutoffMinutos * 60000);

    const slotsDisponibles = slotsCandidatos.filter((slot) => {
      // Regla de corte: El slot debe estar en el futuro por más de X minutos
      if (slot.start.getTime() < limiteFuturo.getTime()) {
        return false;
      }

      // Comprobar colisión con citas existentes
      const colisionCita = agendasExistentes.some((cita) => {
        const citaStart = new Date(cita.fecha_hora_inicio).getTime();
        const citaEnd = new Date(cita.fecha_hora_fin).getTime();
        const slotStart = slot.start.getTime();
        const slotEnd = slot.end.getTime();

        // Traslape de tiempo
        return slotStart < citaEnd && slotEnd > citaStart;
      });

      if (colisionCita) return false;

      // Comprobar colisión con bloqueos
      const colisionBloqueo = bloqueos.some((bloqueo) => {
        const bloqStart = new Date(bloqueo.fecha_inicio).getTime();
        const bloqEnd = new Date(bloqueo.fecha_fin).getTime();
        const slotStart = slot.start.getTime();
        const slotEnd = slot.end.getTime();

        return slotStart < bloqEnd && slotEnd > bloqStart;
      });

      if (colisionBloqueo) return false;

      return true;
    });

    // Retornar lista de horas disponibles
    return NextResponse.json({
      slots: slotsDisponibles.map((s) => s.label),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in availability engine:", error);
    return NextResponse.json(
      { error: "Error al calcular la disponibilidad", details: message },
      { status: 500 }
    );
  }
}
