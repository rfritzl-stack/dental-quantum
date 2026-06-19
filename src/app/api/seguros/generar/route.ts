import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(request: Request) {
  try {
    const { paciente_id, profesional_id, datos_formulario } = await request.json();

    if (!paciente_id || !datos_formulario) {
      return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400 });
    }

    // 1. Obtener datos del paciente
    const paciente = await prisma.paciente.findUnique({
      where: { id: paciente_id },
    });

    if (!paciente) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // 2. Ruta de la plantilla copiada
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "FORMULARIO_REEMBOLSOS_GASTOS_DENTALES.pdf"
    );

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Plantilla PDF del seguro no encontrada." }, { status: 404 });
    }

    // 3. Cargar el PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Intentamos prellenar usando AcroForm de pdf-lib por si tiene campos interactivos
    const form = pdfDoc.getForm();
    let filledWithAcroFields = false;

    try {
      const fields = form.getFields();
      if (fields.length > 0) {
        // Mapear campos comunes si existen
        fields.forEach((field) => {
          const name = field.getName().toLowerCase();
          if (name.includes("nombre") || name.includes("name")) {
            form.getTextField(field.getName()).setText(`${paciente.nombre} ${paciente.apellido}`);
          } else if (name.includes("rut") || name.includes("id")) {
            form.getTextField(field.getName()).setText(paciente.rut);
          } else if (name.includes("email") || name.includes("correo")) {
            form.getTextField(field.getName()).setText(paciente.email || "");
          } else if (name.includes("telefono") || name.includes("phone")) {
            form.getTextField(field.getName()).setText(paciente.telefono || "");
          } else if (name.includes("prevision")) {
            form.getTextField(field.getName()).setText(paciente.prevision || "");
          }
        });
        
        // Llenar campos específicos del formulario enviados
        Object.entries(datos_formulario).forEach(([key, val]) => {
          try {
            const f = form.getTextField(key);
            if (f) f.setText(String(val));
          } catch {
            // Ignorar si no existe
          }
        });
        
        // Aplanar formulario para que no sea editable
        form.flatten();
        filledWithAcroFields = true;
      }
    } catch (e) {
      console.warn("Fallo prellenado AcroForm, aplicando overlay de texto:", e);
    }

    // 4. Si el PDF no tiene campos interactivos, dibujamos el texto encima en coordenadas estimadas (Overlay de texto)
    if (!filledWithAcroFields) {
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Dibujar datos del paciente en el PDF
      firstPage.drawText(`${paciente.nombre} ${paciente.apellido}`, { x: 90, y: 520, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
      firstPage.drawText(paciente.rut, { x: 90, y: 502, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
      firstPage.drawText(paciente.email || "No registrado", { x: 90, y: 485, size: 8, font, color: rgb(0.1, 0.1, 0.1) });
      firstPage.drawText(paciente.telefono || "No registrado", { x: 300, y: 485, size: 8, font, color: rgb(0.1, 0.1, 0.1) });
      firstPage.drawText(paciente.prevision || "Particular", { x: 300, y: 502, size: 8, font, color: rgb(0.1, 0.1, 0.1) });

      // Dibujar campos del formulario ingresados por la secretaria
      if (datos_formulario.tratamiento_realizado) {
        firstPage.drawText(datos_formulario.tratamiento_realizado, { x: 90, y: 430, size: 9, font });
      }
      if (datos_formulario.monto_total) {
        firstPage.drawText(`$${Number(datos_formulario.monto_total).toLocaleString()}`, { x: 90, y: 412, size: 9, font });
      }
      if (datos_formulario.diagnostico) {
        firstPage.drawText(datos_formulario.diagnostico, { x: 90, y: 380, size: 9, font });
      }
      if (datos_formulario.clinica_nombre) {
        firstPage.drawText(datos_formulario.clinica_nombre, { x: 90, y: 310, size: 9, font });
      }
      
      // Firma profesional (Simulada si se selecciona)
      firstPage.drawText("Clínica Dental Quantum", { x: 260, y: 155, size: 8, font });
      firstPage.drawText("Dr. Andrés Silva", { x: 260, y: 140, size: 8, font });
      firstPage.drawText("[Firmado Clínicamente]", { x: 260, y: 125, size: 8, font, color: rgb(0, 0.6, 0.5) });
    }

    // 5. Guardar el PDF completo
    const finalDir = path.join(process.cwd(), "public", "storage", "reembolsos");
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    const filename = `reembolso_${paciente.rut.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}.pdf`;
    const relativeUrl = `/storage/reembolsos/${filename}`;
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(finalDir, filename), pdfBytes);

    // 6. Registrar en dq_formularios_seguros (si no existe plantilla base, creamos una de control)
    let plantilla = await prisma.formularioSeguro.findFirst({
      where: { aseguradora: "MetLife" },
    });

    if (!plantilla) {
      plantilla = await prisma.formularioSeguro.create({
        data: {
          aseguradora: "MetLife",
          nombre_formulario: "Formulario de Reembolso Gastos Dentales",
          pdf_template_url: "/templates/FORMULARIO_REEMBOLSOS_GASTOS_DENTALES.pdf",
          subido_por: profesional_id || "s-1",
        },
      });
    }

    // Registrar el formulario generado
    const formularioGenerado = await prisma.formularioGenerado.create({
      data: {
        formulario_id: plantilla.id,
        paciente_id,
        pdf_generado_url: relativeUrl,
        estado: "completo",
        datos_completados: datos_formulario,
        creado_por: profesional_id || "s-1",
      },
    });

    return NextResponse.json({ success: true, formulario: formularioGenerado });
  } catch (error) {
    console.error("Error generating insurance PDF:", error);
    return NextResponse.json({ error: "Error en el servidor al generar formulario de reembolso" }, { status: 500 });
  }
}
