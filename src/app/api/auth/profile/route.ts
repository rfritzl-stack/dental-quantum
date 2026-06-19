import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Falta el parámetro email" }, { status: 400 });
    }

    // 1. Buscar en profesionales (staff)
    const profesional = await prisma.profesional.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (profesional) {
      let role: "dentista" | "recepcionista" | "admin" = "dentista";
      if (email.toLowerCase().includes("recep")) {
        role = "recepcionista";
      } else if (email.toLowerCase().includes("admin")) {
        role = "admin";
      }
      return NextResponse.json({
        id: profesional.id,
        email: profesional.email,
        nombre: `${profesional.nombre} ${profesional.apellido}`,
        role,
      });
    }

    // 2. Buscar en pacientes
    const paciente = await prisma.paciente.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (paciente) {
      return NextResponse.json({
        id: paciente.id,
        email: paciente.email,
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        rut: paciente.rut,
        role: "paciente",
      });
    }

    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching auth profile:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
