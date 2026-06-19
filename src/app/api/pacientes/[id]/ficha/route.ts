import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    // 1. Obtener datos del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id },
    });

    if (!paciente) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // 2. Obtener citas
    const citas = await prisma.agenda.findMany({
      where: { paciente_id: id },
      orderBy: { fecha_hora_inicio: "desc" },
      include: {
        especialidad: { select: { nombre: true } },
        profesional: { select: { nombre: true, apellido: true } },
      },
    });

    // 3. Obtener tratamientos
    const tratamientos = await prisma.tratamiento.findMany({
      where: { paciente_id: id },
      orderBy: { creado_en: "desc" },
      include: {
        profesional: { select: { nombre: true, apellido: true } },
        especialidad: { select: { nombre: true } },
        sesiones: { orderBy: { numero_sesion: "asc" } },
      },
    });

    // 4. Obtener archivos
    const archivos = await prisma.archivo.findMany({
      where: { paciente_id: id },
      orderBy: { fecha_subida: "desc" },
      include: {
        profesional: { select: { nombre: true, apellido: true } },
      },
    });

    // 5. Obtener cobros
    const cobros = await prisma.cobro.findMany({
      where: { paciente_id: id },
      orderBy: { creado_en: "desc" },
    });

    // 6. Obtener formularios de seguros generados
    const formularios = await prisma.formularioGenerado.findMany({
      where: { paciente_id: id },
      orderBy: { creado_en: "desc" },
      include: {
        formulario: { select: { nombre_formulario: true, aseguradora: true } },
      },
    });

    return NextResponse.json({
      paciente,
      citas,
      tratamientos,
      archivos,
      cobros,
      formularios,
    });
  } catch (error) {
    console.error("Error in clinical record API:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
