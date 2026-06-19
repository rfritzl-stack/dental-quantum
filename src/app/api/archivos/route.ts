import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pacienteId = formData.get("paciente_id") as string;
    const profesionalId = formData.get("profesional_id") as string;
    const tipo = formData.get("tipo") as string; // 'radiografia','fotografia','consentimiento','documento','resultado'
    const descripcion = formData.get("descripcion") as string;

    if (!file || !pacienteId || !profesionalId || !tipo) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // 1. Crear directorios locales en public para guardar el archivo físicamente
    const uploadDir = path.join(process.cwd(), "public", "storage", tipo);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitizar nombre de archivo
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);

    // Escribir archivo localmente
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/storage/${tipo}/${safeName}`;

    // 2. Guardar registro en la base de datos
    const archivo = await prisma.archivo.create({
      data: {
        paciente_id: pacienteId,
        subido_por: profesionalId,
        tipo,
        nombre_archivo: file.name,
        url_storage: relativeUrl,
        descripcion: descripcion || null,
      },
    });

    return NextResponse.json({ success: true, archivo });
  } catch (error) {
    console.error("Error uploading clinical file:", error);
    return NextResponse.json({ error: "Error en el servidor al subir archivo" }, { status: 500 });
  }
}
