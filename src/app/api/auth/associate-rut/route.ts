import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, rut } = await request.json();

    if (!email || !rut) {
      return NextResponse.json({ error: "Email y RUT son obligatorios" }, { status: 400 });
    }

    // 1. Buscar si ya existe el paciente por RUT
    let paciente = await prisma.paciente.findUnique({
      where: { rut },
    });

    if (paciente) {
      // Si el paciente ya tiene otro email registrado, actualizarlo al actual
      paciente = await prisma.paciente.update({
        where: { rut },
        data: {
          email: email.toLowerCase(),
        },
      });
    } else {
      // Si no existe, crear un registro básico de paciente con este RUT y email
      paciente = await prisma.paciente.create({
        data: {
          rut,
          email: email.toLowerCase(),
          nombre: "Paciente",
          apellido: "Nuevo",
          activo: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      paciente: {
        id: paciente.id,
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        rut: paciente.rut,
        email: paciente.email,
      },
    });
  } catch (error) {
    console.error("Error associating RUT to account:", error);
    return NextResponse.json({ error: "Error en el servidor al asociar el RUT" }, { status: 500 });
  }
}
