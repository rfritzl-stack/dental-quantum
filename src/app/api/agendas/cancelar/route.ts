import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: Request) {
  try {
    const { agendaId } = await request.json();

    if (!agendaId) {
      return NextResponse.json({ error: "Falta el parámetro agendaId" }, { status: 400 });
    }

    // 1. Obtener la cita
    const agenda = await prisma.agenda.findUnique({
      where: { id: agendaId },
    });

    if (!agenda) {
      return NextResponse.json({ error: "La cita no existe" }, { status: 404 });
    }

    if (agenda.estado === "cancelada") {
      return NextResponse.json({ error: "La cita ya se encuentra cancelada" }, { status: 400 });
    }

    // 2. Validar regla de 24 horas si viene desde el portal (opcional, validamos por seguridad)
    const ahora = new Date();
    const fechaCita = new Date(agenda.fecha_hora_inicio);
    const diferenciaMs = fechaCita.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    // Si es del portal del paciente, forzamos la regla de 24h
    // (en el back-office de administración, la secretaria sí podría cancelarla con menos de 24h si el paciente llama,
    // por lo que podemos pasar un parámetro "override" o simplemente verificar el origen)
    const { searchParams } = new URL(request.url);
    const forceRule = searchParams.get("admin") !== "true";

    if (forceRule && diferenciaHoras < 24) {
      return NextResponse.json(
        { error: "Las citas solo pueden cancelarse con 24 horas de anticipación." },
        { status: 400 }
      );
    }

    // 3. Cancelar en base de datos
    const agendaActualizada = await prisma.agenda.update({
      where: { id: agendaId },
      data: {
        estado: "cancelada",
      },
    });

    // 4. Cancelar en Google Calendar (simulado/stub)
    if (agenda.google_event_id) {
      try {
        const profesional = await prisma.profesional.findUnique({
          where: { id: agenda.profesional_id },
        });
        await deleteGoogleCalendarEvent({
          eventId: agenda.google_event_id,
          organizerEmail: profesional?.calendario_google_id || profesional?.email || "",
        });
      } catch (err) {
        console.error("Error al cancelar evento en Google Calendar:", err);
      }
    }

    return NextResponse.json({
      success: true,
      agenda: agendaActualizada,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
