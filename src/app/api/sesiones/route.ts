import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { tratamiento_id, agenda_id, numero_sesion, notas_clinicas, hallazgos, proxima_accion } = await request.json();

    if (!tratamiento_id || !numero_sesion) {
      return NextResponse.json({ error: "Tratamiento ID y Número de sesión son requeridos" }, { status: 400 });
    }

    // 1. Crear sesión en dq_sesiones
    const sesion = await prisma.sesion.create({
      data: {
        tratamiento_id,
        agenda_id: agenda_id || undefined,
        numero_sesion: Number(numero_sesion),
        notas_clinicas: notas_clinicas || null,
        hallazgos: hallazgos || null,
        proxima_accion: proxima_accion || null,
      },
    });

    // 2. Incrementar número de sesiones realizadas en el tratamiento
    const tratamiento = await prisma.tratamiento.findUnique({
      where: { id: tratamiento_id },
    });

    if (tratamiento) {
      const realizadasActuales = tratamiento.sesiones_realizadas;
      const nuevasRealizadas = Math.max(realizadasActuales, Number(numero_sesion));
      await prisma.tratamiento.update({
        where: { id: tratamiento_id },
        data: {
          sesiones_realizadas: nuevasRealizadas,
          estado: nuevasRealizadas >= tratamiento.sesiones_estimadas ? "completado" : "en_proceso",
        },
      });
    }

    return NextResponse.json({ success: true, sesion });
  } catch (error) {
    console.error("Error creating clinical session:", error);
    return NextResponse.json({ error: "Error en el servidor al registrar sesión" }, { status: 500 });
  }
}
