import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const paciente = await prisma.paciente.update({
      where: { id },
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email ? body.email.toLowerCase() : null,
        telefono: body.telefono || null,
        fecha_nacimiento: body.fecha_nacimiento ? new Date(body.fecha_nacimiento) : null,
        direccion: body.direccion || null,
        prevision: body.prevision || null,
        seguro_complementario: body.seguro_complementario || null,
        notas_generales: body.notas_generales || null,
        activo: body.activo !== undefined ? body.activo : true,
      },
    });

    return NextResponse.json({ success: true, paciente });
  } catch (error) {
    console.error("Error updating patient info:", error);
    return NextResponse.json({ error: "Error en el servidor al actualizar paciente" }, { status: 500 });
  }
}
