import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, rut, nombre, apellido, telefono } = await request.json();

    if (!rut || !nombre || !apellido) {
      return NextResponse.json({ error: "Parámetros obligatorios faltantes" }, { status: 400 });
    }

    // Buscar si el paciente ya existe por RUT
    let paciente = await prisma.paciente.findUnique({
      where: { rut },
    });

    if (paciente) {
      // Actualizar datos de contacto del paciente existente
      paciente = await prisma.paciente.update({
        where: { rut },
        data: {
          email: email ? email.toLowerCase() : paciente.email,
          telefono: telefono || paciente.telefono,
          nombre: nombre || paciente.nombre,
          apellido: apellido || paciente.apellido,
        },
      });
    } else {
      // Crear nuevo paciente
      paciente = await prisma.paciente.create({
        data: {
          rut,
          nombre,
          apellido,
          email: email ? email.toLowerCase() : null,
          telefono: telefono || null,
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
    console.error("Error registering patient:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
