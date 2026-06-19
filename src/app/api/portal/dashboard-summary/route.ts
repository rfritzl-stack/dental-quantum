import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const rut = searchParams.get("rut");

    if (!email && !rut) {
      return NextResponse.json({ error: "Se requiere email o rut del paciente" }, { status: 400 });
    }

    // 1. Encontrar el paciente
    let paciente = null;
    if (rut) {
      paciente = await prisma.paciente.findUnique({
        where: { rut },
      });
    }

    if (!paciente && email) {
      paciente = await prisma.paciente.findFirst({
        where: { email: email.toLowerCase() },
      });
    }

    if (!paciente) {
      return NextResponse.json({ error: "Paciente no registrado" }, { status: 404 });
    }

    // 2. Buscar próxima cita
    const ahora = new Date();
    const proximaCita = await prisma.agenda.findFirst({
      where: {
        paciente_id: paciente.id,
        fecha_hora_inicio: {
          gte: ahora,
        },
        estado: {
          notIn: ["cancelada", "no_show"],
        },
      },
      orderBy: {
        fecha_hora_inicio: "asc",
      },
      include: {
        especialidad: {
          select: { nombre: true },
        },
        profesional: {
          select: { nombre: true, apellido: true },
        },
      },
    });

    // 3. Buscar tratamiento activo
    const tratamientoActivo = await prisma.tratamiento.findFirst({
      where: {
        paciente_id: paciente.id,
        estado: {
          in: ["diagnostico", "plan_aprobado", "en_proceso", "mantenimiento"],
        },
      },
      orderBy: {
        creado_en: "desc",
      },
      include: {
        profesional: {
          select: { nombre: true, apellido: true },
        },
      },
    });

    return NextResponse.json({
      proximaCita,
      tratamientoActivo,
    });
  } catch (error) {
    console.error("Error in dashboard summary API:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
