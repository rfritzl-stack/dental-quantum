import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MOCK_PROFESIONALES = [
  {
    id: "p1",
    nombre: "Andrés",
    apellido: "Silva",
    especialidades: ["implantologia", "cirugia", "rehabilitacion-oral", "diseno-de-sonrisa", "anestesia-y-sedacion", "operatoria", "blanqueamiento", "bruxismo"],
  },
  {
    id: "p2",
    nombre: "Claudia",
    apellido: "Toledo",
    especialidades: ["ortodoncia", "odontopediatria", "periodoncia", "endodoncia", "operatoria", "blanqueamiento", "estetica-facial", "bruxismo"],
  },
];

export async function GET() {
  try {
    const list = await prisma.profesional.findMany({
      where: { activo: true },
    });
    if (list && list.length > 0) {
      return NextResponse.json(list);
    }
  } catch {
    console.warn("DB connection failed, serving mock professionals for API");
  }
  return NextResponse.json(MOCK_PROFESIONALES);
}
