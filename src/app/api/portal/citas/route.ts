import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rut = searchParams.get("rut");

    if (!rut) {
      return NextResponse.json({ error: "Se requiere el RUT del paciente" }, { status: 400 });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { rut },
    });

    if (!paciente) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const citas = await prisma.agenda.findMany({
      where: {
        paciente_id: paciente.id,
      },
      orderBy: {
        fecha_hora_inicio: "desc",
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

    return NextResponse.json({ citas });
  } catch (error) {
    console.error("Error in portal appointments API:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
