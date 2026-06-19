import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cobros = await prisma.cobro.findMany({
      orderBy: { creado_en: "desc" },
      include: {
        paciente: { select: { nombre: true, apellido: true, rut: true } },
      },
    });
    return NextResponse.json({ cobros });
  } catch (error) {
    console.error("Error fetching billing list:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { paciente_id, agenda_id, tratamiento_id, concepto, monto, metodo_pago, estado, datos_pos } = await request.json();

    if (!paciente_id || !concepto || !monto || !metodo_pago || !estado) {
      return NextResponse.json({ error: "Faltan parámetros requeridos de cobro" }, { status: 400 });
    }

    const cobro = await prisma.cobro.create({
      data: {
        paciente_id,
        agenda_id: agenda_id || null,
        tratamiento_id: tratamiento_id || null,
        concepto,
        monto: Number(monto),
        metodo_pago,
        estado,
        datos_pos: datos_pos || null,
      },
    });

    return NextResponse.json({ success: true, cobro });
  } catch (error) {
    console.error("Error registering payment:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}
