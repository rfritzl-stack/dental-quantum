import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, telefono, especialidad_interes, mensaje, origen } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: "El campo nombre es obligatorio" },
        { status: 400 }
      );
    }

    // Guardar lead en base de datos
    const lead = await prisma.lead.create({
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
        especialidad_interes: especialidad_interes || null,
        mensaje: mensaje || null,
        origen: origen || "sitio_web",
        estado: "nuevo",
      },
    });

    // Enviar correo de notificación (simulado o real)
    await sendEmail({
      to: "contacto@dentalquantum.cl",
      subject: `Nuevo Lead: ${nombre} - ${especialidad_interes || "Consulta General"}`,
      html: `
        <h2>Nuevo contacto recibido desde el sitio web</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email || "No especificado"}</p>
        <p><strong>Teléfono:</strong> ${telefono || "No especificado"}</p>
        <p><strong>Especialidad de interés:</strong> ${especialidad_interes || "Consulta General"}</p>
        <p><strong>Mensaje:</strong> ${mensaje || "Sin mensaje"}</p>
        <hr/>
        <p>Este lead ha sido registrado automáticamente en el sistema operacional.</p>
      `,
      text: `Nuevo contacto recibido de ${nombre}. Email: ${email}. Teléfono: ${telefono}. Especialidad: ${especialidad_interes}. Mensaje: ${mensaje}.`,
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: message },
      { status: 500 }
    );
  }
}
