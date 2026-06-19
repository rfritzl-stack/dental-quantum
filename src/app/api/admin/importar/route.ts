import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { pacientes } = await request.json();
    if (!pacientes || !Array.isArray(pacientes)) {
      return NextResponse.json({ error: "Parámetro 'pacientes' es requerido y debe ser una lista." }, { status: 400 });
    }

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: Array<{ rut: string; error: string; nombre?: string }> = [];

    // Validar RUT (Módulo 11)
    const validarRut = (rut: string): boolean => {
      const cleanRut = rut.replace(/[^0-9kK]/g, "");
      if (cleanRut.length < 2) return false;
      const cuerpo = cleanRut.slice(0, -1);
      const dv = cleanRut.slice(-1).toLowerCase();
      let suma = 0;
      let multiplicador = 2;
      for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
      }
      const dvr = 11 - (suma % 11);
      const dvEsperado = dvr === 11 ? "0" : dvr === 10 ? "k" : String(dvr);
      return dv === dvEsperado;
    };

    // Procesar cada paciente uno a uno para control fino de errores
    for (const p of pacientes) {
      if (!p.rut) {
        errorCount++;
        errors.push({ rut: "S/RUT", error: "RUT vacío", nombre: `${p.nombre || ""} ${p.apellido || ""}`.trim() });
        continue;
      }

      // Normalizar RUT quitando puntos, pero manteniendo guión si es necesario (el validador lo limpia)
      const cleanRut = p.rut.trim().replace(/\./g, "");

      if (!validarRut(cleanRut)) {
        errorCount++;
        errors.push({ rut: cleanRut, error: "RUT inválido", nombre: `${p.nombre || ""} ${p.apellido || ""}`.trim() });
        continue;
      }

      try {
        // Verificar duplicados por RUT
        const existing = await prisma.paciente.findUnique({
          where: { rut: cleanRut },
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        // Crear paciente en base de datos
        await prisma.paciente.create({
          data: {
            rut: cleanRut,
            nombre: p.nombre || null,
            apellido: p.apellido || null,
            email: p.email || null,
            telefono: p.telefono || null,
            prevision: p.prevision || null,
            activo: true,
          },
        });
        successCount++;
      } catch (err) {
        console.error(`Error importing patient with RUT ${cleanRut}:`, err);
        errorCount++;
        errors.push({
          rut: cleanRut,
          error: err instanceof Error ? err.message : "Error de inserción",
          nombre: `${p.nombre || ""} ${p.apellido || ""}`.trim()
        });
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: pacientes.length,
        importados: successCount,
        duplicados: duplicateCount,
        errores: errorCount,
      },
      errors,
    });
  } catch (error) {
    console.error("Error in import API:", error);
    return NextResponse.json({ error: "Error interno del servidor al procesar la importación." }, { status: 500 });
  }
}
