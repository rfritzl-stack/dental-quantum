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

    // 1. Archivos Clínicos
    const archivos = await prisma.archivo.findMany({
      where: { paciente_id: paciente.id },
      orderBy: { fecha_subida: "desc" },
    });

    // 2. Formularios Generados
    const formularios = await prisma.formularioGenerado.findMany({
      where: { paciente_id: paciente.id },
      orderBy: { creado_en: "desc" },
      include: {
        formulario: {
          select: {
            nombre_formulario: true,
            aseguradora: true,
          },
        },
      },
    });

    // 3. Boletas Electrónicas (a través de los cobros del paciente)
    const boletas = await prisma.boletaSii.findMany({
      where: {
        cobro: {
          paciente_id: paciente.id,
        },
      },
      orderBy: {
        fecha_emision: "desc",
      },
    });

    return NextResponse.json({
      archivos,
      formularios,
      boletas,
    });
  } catch (error) {
    console.error("Error in portal documents API:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
