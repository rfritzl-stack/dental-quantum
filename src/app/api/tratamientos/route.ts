import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tratamientos = await prisma.tratamiento.findMany({
      orderBy: { creado_en: "desc" },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        profesional: { select: { nombre: true, apellido: true } },
        especialidad: { select: { nombre: true } },
      },
    });
    return NextResponse.json({ tratamientos });
  } catch (error) {
    console.error("Error in treatments API:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      paciente_id,
      profesional_id,
      especialidad_id,
      nombre_tratamiento,
      descripcion,
      sesiones_estimadas,
      costo_total,
      fecha_inicio,
    } = await request.json();

    if (!paciente_id || !profesional_id || !especialidad_id || !nombre_tratamiento || !sesiones_estimadas || !costo_total) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    const nuevo = await prisma.tratamiento.create({
      data: {
        paciente_id,
        profesional_id,
        especialidad_id,
        nombre_tratamiento,
        descripcion: descripcion || null,
        sesiones_estimadas: Number(sesiones_estimadas),
        costo_total: Number(costo_total),
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : new Date(),
        estado: "diagnostico",
      },
    });

    return NextResponse.json({ success: true, tratamiento: nuevo });
  } catch (error) {
    console.error("Error creating treatment plan:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, estado, sesiones_realizadas } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del tratamiento" }, { status: 400 });
    }

    const actualizado = await prisma.tratamiento.update({
      where: { id },
      data: {
        estado: estado || undefined,
        sesiones_realizadas: sesiones_realizadas !== undefined ? Number(sesiones_realizadas) : undefined,
      },
    });

    return NextResponse.json({ success: true, tratamiento: actualizado });
  } catch (error) {
    console.error("Error updating treatment:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}
