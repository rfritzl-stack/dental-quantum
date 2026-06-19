import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(request: Request) {
  try {
    const { cobroId } = await request.json();

    if (!cobroId) {
      return NextResponse.json({ error: "Falta el ID del cobro" }, { status: 400 });
    }

    // 1. Obtener datos del cobro
    const cobro = await prisma.cobro.findUnique({
      where: { id: cobroId },
      include: {
        paciente: true,
      },
    });

    if (!cobro) {
      return NextResponse.json({ error: "El cobro no existe" }, { status: 404 });
    }

    // Verificar si ya existe una boleta emitida para este cobro
    const boletaExistente = await prisma.boletaSii.findFirst({
      where: { cobro_id: cobroId },
    });

    if (boletaExistente) {
      return NextResponse.json({ success: true, boleta: boletaExistente });
    }

    // 2. Determinar el folio correlativo
    const ultimaBoleta = await prisma.boletaSii.findFirst({
      orderBy: { folio: "desc" },
    });
    const siguienteFolio = ultimaBoleta ? ultimaBoleta.folio + 1 : 1001;

    // 3. Calcular montos (para boletas de honorarios / DTE 39 exenta de IVA en prestaciones médicas)
    const total = cobro.monto;
    const neto = total; // Prestaciones dentales en Chile suelen ser exentas de IVA
    const iva = 0;

    // 4. Crear el archivo PDF de la boleta con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]); // Formato boleta térmica / pequeña
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Dibujar membrete
    page.drawText("CLÍNICA DENTAL QUANTUM", { x: 30, y: 550, size: 14, font: fontBold, color: rgb(0.04, 0.12, 0.23) });
    page.drawText("R.U.T.: 76.543.210-K", { x: 30, y: 535, size: 10, font: font });
    page.drawText("Av. Kennedy 7100 Of. 706, Vitacura", { x: 30, y: 520, size: 8, font: font });
    page.drawText("Tel: (56-2) 2953 9291", { x: 30, y: 510, size: 8, font: font });

    // Cuadro de Folio (Boleta Electrónica)
    page.drawRectangle({
      x: 230,
      y: 505,
      width: 140,
      height: 60,
      borderColor: rgb(0.83, 0.56, 0.04), // Dorado
      borderWidth: 2,
    });
    page.drawText("BOLETA ELECTRÓNICA", { x: 238, y: 545, size: 9, font: fontBold, color: rgb(0.83, 0.56, 0.04) });
    page.drawText(`N° ${siguienteFolio}`, { x: 275, y: 525, size: 14, font: fontBold, color: rgb(0.83, 0.56, 0.04) });
    page.drawText("S.I.I. - SANTIAGO ORIENTE", { x: 242, y: 512, size: 8, font: font });

    // Fecha
    const fechaEmision = new Date();
    page.drawText(`Fecha Emisión: ${fechaEmision.toLocaleDateString("es-CL")}`, { x: 30, y: 470, size: 9, font: font });

    // Receptor / Paciente
    page.drawText("RECEPTOR:", { x: 30, y: 440, size: 10, font: fontBold });
    page.drawText(`Nombre: ${cobro.paciente.nombre} ${cobro.paciente.apellido}`, { x: 30, y: 425, size: 9, font: font });
    page.drawText(`R.U.T.: ${cobro.paciente.rut}`, { x: 30, y: 410, size: 9, font: font });
    page.drawText(`Email: ${cobro.paciente.email || "No registrado"}`, { x: 30, y: 395, size: 9, font: font });

    // Detalle
    page.drawRectangle({ x: 30, y: 220, width: 340, height: 150, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 });
    page.drawLine({ start: { x: 30, y: 345 }, end: { x: 370, y: 345 }, color: rgb(0.9, 0.9, 0.9), thickness: 1 });
    
    page.drawText("Detalle de Prestación", { x: 40, y: 353, size: 9, font: fontBold });
    page.drawText("Monto", { x: 320, y: 353, size: 9, font: fontBold });

    // Detalle Cobro
    page.drawText(cobro.concepto, { x: 40, y: 325, size: 9, font: font });
    page.drawText(`$${total.toLocaleString("es-CL")}`, { x: 310, y: 325, size: 9, font: font });

    // Totales
    page.drawText(`Monto Neto Exento:`, { x: 200, y: 195, size: 9, font: font });
    page.drawText(`$${neto.toLocaleString("es-CL")}`, { x: 310, y: 195, size: 9, font: fontBold });

    page.drawText(`I.V.A. (0%):`, { x: 200, y: 180, size: 9, font: font });
    page.drawText(`$0`, { x: 310, y: 180, size: 9, font: font });

    page.drawText(`TOTAL:`, { x: 200, y: 160, size: 10, font: fontBold, color: rgb(0.04, 0.12, 0.23) });
    page.drawText(`$${total.toLocaleString("es-CL")}`, { x: 310, y: 160, size: 11, font: fontBold, color: rgb(0.04, 0.12, 0.23) });

    // Timbre Electrónico SII Simulado (QR o código de barra)
    page.drawRectangle({ x: 30, y: 40, width: 120, height: 90, color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawText("TIMBRE ELECTRÓNICO", { x: 40, y: 115, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
    page.drawText("SII - CHILE DTE 39", { x: 45, y: 105, size: 7, font: font, color: rgb(0.5, 0.5, 0.5) });
    // Pequeñas líneas simulando código QR / Barras
    for (let i = 0; i < 7; i++) {
      page.drawLine({
        start: { x: 45 + i * 14, y: 55 },
        end: { x: 45 + i * 14, y: 95 },
        color: rgb(0.2, 0.2, 0.2),
        thickness: i % 2 === 0 ? 3 : 1
      });
    }
    page.drawText("Verifique validez en sii.cl", { x: 42, y: 45, size: 6, font: font, color: rgb(0.6, 0.6, 0.6) });

    // Leyenda legal
    page.drawText("Agradecemos su preferencia.", { x: 200, y: 65, size: 8, font: font });
    page.drawText("Este documento es una representación impresa", { x: 200, y: 55, size: 7, font: font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText("de una boleta electrónica.", { x: 200, y: 45, size: 7, font: font, color: rgb(0.5, 0.5, 0.5) });

    // Guardar PDF en disco
    const boletaDir = path.join(process.cwd(), "public", "storage", "boletas");
    if (!fs.existsSync(boletaDir)) {
      fs.mkdirSync(boletaDir, { recursive: true });
    }

    const filename = `boleta_${siguienteFolio}.pdf`;
    const relativeUrl = `/storage/boletas/${filename}`;
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(boletaDir, filename), pdfBytes);

    // 5. Registrar boleta en base de datos
    const boleta = await prisma.boletaSii.create({
      data: {
        cobro_id: cobroId,
        rut_emisor: "76.543.210-K",
        rut_receptor: cobro.paciente.rut,
        razon_social_receptor: `${cobro.paciente.nombre} ${cobro.paciente.apellido}`,
        folio: siguienteFolio,
        monto_neto: neto,
        iva: iva,
        monto_total: total,
        pdf_url: relativeUrl,
        xml_sii: "<dte>simulado</dte>",
        estado_sii: "aceptado",
        fecha_emision: fechaEmision,
      },
    });

    // 6. Actualizar el folio en el cobro original
    await prisma.cobro.update({
      where: { id: cobroId },
      data: {
        folio_boleta: String(siguienteFolio),
        numero_boleta_sii: String(siguienteFolio),
        fecha_emision: fechaEmision,
      },
    });

    return NextResponse.json({ success: true, boleta });
  } catch (error) {
    console.error("Error generating electronic boleta:", error);
    return NextResponse.json({ error: "Error en el servidor al emitir boleta" }, { status: 500 });
  }
}
