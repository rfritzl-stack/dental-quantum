import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pacientes = await prisma.paciente.findMany({
      orderBy: { apellido: "asc" },
    });
    return NextResponse.json({ pacientes });
  } catch (error) {
    console.error("Error in patients list API:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { rut, nombre, apellido, email, telefono, fecha_nacimiento, prevision, seguro_complementario } = await request.json();

    if (!rut || !nombre || !apellido) {
      return NextResponse.json({ error: "RUT, Nombre y Apellido son requeridos" }, { status: 400 });
    }

    const existe = await prisma.paciente.findUnique({
      where: { rut },
    });

    if (existe) {
      return NextResponse.json({ error: "Ya existe un paciente registrado con este RUT" }, { status: 400 });
    }

    const nuevo = await prisma.paciente.create({
      data: {
        rut,
        nombre,
        apellido,
        email: email ? email.toLowerCase() : null,
        telefono: telefono || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        prevision: prevision || null,
        seguro_complementario: seguro_complementario || null,
        activo: true,
      },
    });

    return NextResponse.json({ success: true, paciente: nuevo });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}
