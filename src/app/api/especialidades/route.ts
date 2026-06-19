import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MOCK_ESPECIALIDADES = [
  { id: "e1", nombre: "Implantología", slug: "implantologia", duracion_minutos: 60, precio_base: 450000 },
  { id: "e2", nombre: "Ortodoncia", slug: "ortodoncia", duracion_minutos: 30, precio_base: 45000 },
  { id: "e3", nombre: "Odontopediatría", slug: "odontopediatria", duracion_minutos: 30, precio_base: 35000 },
  { id: "e4", nombre: "Periodoncia", slug: "periodoncia", duracion_minutos: 45, precio_base: 40000 },
  { id: "e5", nombre: "Endodoncia", slug: "endodoncia", duracion_minutos: 60, precio_base: 95000 },
  { id: "e6", nombre: "Cirugía Oral", slug: "cirugia", duracion_minutos: 60, precio_base: 80000 },
  { id: "e7", nombre: "Odontología Operatoria", slug: "operatoria", duracion_minutos: 30, precio_base: 30000 },
  { id: "e8", nombre: "Anestesia y Sedación", slug: "anestesia-y-sedacion", duracion_minutos: 60, precio_base: 120000 },
  { id: "e9", nombre: "Rehabilitación Oral", slug: "rehabilitacion-oral", duracion_minutos: 60, precio_base: 220000 },
  { id: "e10", nombre: "Diseño de Sonrisa", slug: "diseno-de-sonrisa", duracion_minutos: 90, precio_base: 350000 },
  { id: "e11", nombre: "Tratamiento de Bruxismo", slug: "bruxismo", duracion_minutos: 45, precio_base: 110000 },
  { id: "e12", nombre: "Blanqueamiento Dental", slug: "blanqueamiento", duracion_minutos: 60, precio_base: 150000 },
  { id: "e13", nombre: "Estética Facial", slug: "estetica-facial", duracion_minutos: 45, precio_base: 180000 },
];

export async function GET() {
  try {
    const list = await prisma.especialidad.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    });
    if (list && list.length > 0) {
      return NextResponse.json(list);
    }
  } catch {
    console.warn("DB connection failed, serving mock specialties for API");
  }
  return NextResponse.json(MOCK_ESPECIALIDADES);
}
