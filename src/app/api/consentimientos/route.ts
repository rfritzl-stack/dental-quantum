import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(request: Request) {
  try {
    const { paciente_id, profesional_id, firma_png, tipo_consentimiento } = await request.json();

    if (!paciente_id || !profesional_id || !firma_png || !tipo_consentimiento) {
      return NextResponse.json({ error: "Faltan parámetros requeridos de consentimiento" }, { status: 400 });
    }

    // 1. Obtener datos de paciente y profesional
    const paciente = await prisma.paciente.findUnique({ where: { id: paciente_id } });
    const profesional = await prisma.profesional.findUnique({ where: { id: profesional_id } });

    if (!paciente || !profesional) {
      return NextResponse.json({ error: "Paciente o Profesional no encontrado" }, { status: 404 });
    }

    // 2. Generar el PDF del Consentimiento con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 700]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Título
    page.drawText("CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DENTAL", {
      x: 40,
      y: 650,
      size: 13,
      font: fontBold,
      color: rgb(0.04, 0.12, 0.23),
    });
    page.drawText(tipo_consentimiento.toUpperCase(), {
      x: 40,
      y: 630,
      size: 11,
      font: fontBold,
      color: rgb(0, 0.77, 0.7),
    });

    // Cuerpo legal
    const bodyText = `Yo, ${paciente.nombre} ${paciente.apellido}, RUT ${paciente.rut}, en pleno uso de mis facultades, autorizo libremente al equipo clínico de la Clínica Dental Quantum, representado por el profesional Dr(a). ${profesional.nombre} ${profesional.apellido}, a realizar la prestación médica correspondiente a ${tipo_consentimiento}.

He sido informado detalladamente sobre los objetivos del procedimiento, los beneficios esperados, así como las posibles molestias, riesgos, complicaciones asociadas y tratamientos alternativos disponibles. He tenido la oportunidad de hacer preguntas y todas mis dudas han sido respondidas satisfactoriamente.

Comprendo que la medicina y la odontología no son ciencias exactas y que no se pueden garantizar resultados específicos del tratamiento. Me comprometo asimismo a seguir todas las indicaciones postoperatorias impartidas por mi dentista.

Autorizo que este documento sea firmado digitalmente en conformidad con la normativa chilena vigente.`;

    // Escribir texto formateado por párrafos
    const lines = bodyText.split("\n\n");
    let currentY = 580;
    lines.forEach((pText) => {
      // Ajuste de texto para evitar overflow derecho
      const words = pText.split(" ");
      let line = "";
      words.forEach((word) => {
        const testLine = line + word + " ";
        const testWidth = font.widthOfTextAtSize(testLine, 9);
        if (testWidth > 420) {
          page.drawText(line, { x: 40, y: currentY, size: 9, font });
          line = word + " ";
          currentY -= 14;
        } else {
          line = testLine;
        }
      });
      page.drawText(line, { x: 40, y: currentY, size: 9, font });
      currentY -= 25;
    });

    // Embed de la Firma (Base64 PNG)
    const base64Data = firma_png.replace(/^data:image\/png;base64,/, "");
    const imgBytes = Buffer.from(base64Data, "base64");
    const signatureImage = await pdfDoc.embedPng(imgBytes);

    // Dibujar firma del paciente
    page.drawText("FIRMA DEL PACIENTE:", { x: 40, y: 190, size: 8, font: fontBold });
    page.drawImage(signatureImage, {
      x: 40,
      y: 110,
      width: 140,
      height: 70,
    });
    page.drawLine({ start: { x: 40, y: 105 }, end: { x: 180, y: 105 }, color: rgb(0.5, 0.5, 0.5), thickness: 1 });
    page.drawText(`RUT: ${paciente.rut}`, { x: 40, y: 92, size: 8, font });
    page.drawText(`${paciente.nombre} ${paciente.apellido}`, { x: 40, y: 82, size: 8, font });

    // Firma del profesional (simulada)
    page.drawText("FIRMA PROFESIONAL:", { x: 300, y: 190, size: 8, font: fontBold });
    page.drawText("[FIRMADO DIGITALMENTE]", { x: 300, y: 140, size: 8, font: fontBold, color: rgb(0, 0.6, 0.5) });
    page.drawLine({ start: { x: 300, y: 105 }, end: { x: 440, y: 105 }, color: rgb(0.5, 0.5, 0.5), thickness: 1 });
    page.drawText(`RUT: ${profesional.email}`, { x: 300, y: 92, size: 8, font });
    page.drawText(`Dr(a). ${profesional.nombre} ${profesional.apellido}`, { x: 300, y: 82, size: 8, font });

    // Guardar archivo PDF en la carpeta public/storage/consentimientos
    const consentDir = path.join(process.cwd(), "public", "storage", "consentimientos");
    if (!fs.existsSync(consentDir)) {
      fs.mkdirSync(consentDir, { recursive: true });
    }

    const filename = `consentimiento_${paciente.rut.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}.pdf`;
    const relativeUrl = `/storage/consentimientos/${filename}`;
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(consentDir, filename), pdfBytes);

    // 3. Registrar en dq_archivos como un archivo del paciente
    const archivo = await prisma.archivo.create({
      data: {
        paciente_id,
        subido_por: profesional_id,
        tipo: "consentimiento",
        nombre_archivo: `Consentimiento_${tipo_consentimiento.replace(/\s+/g, "_")}.pdf`,
        url_storage: relativeUrl,
        descripcion: `Consentimiento informado firmado digitalmente para ${tipo_consentimiento}.`,
      },
    });

    return NextResponse.json({ success: true, archivo });
  } catch (error) {
    console.error("Error generating digital consent:", error);
    return NextResponse.json({ error: "Error interno en el servidor" }, { status: 500 });
  }
}
