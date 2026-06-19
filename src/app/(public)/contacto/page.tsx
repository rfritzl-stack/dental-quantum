"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [mensaje, setMensaje] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      setErrorMessage("El nombre es obligatorio");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          especialidad_interes: especialidad,
          mensaje,
          origen: "formulario_contacto",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar la consulta");
      }

      setStatus("success");
      setNombre("");
      setEmail("");
      setTelefono("");
      setEspecialidad("");
      setMensaje("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al conectar con el servidor";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  return (
    <div className="py-12 container mx-auto px-4 max-w-5xl space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="font-heading text-4xl font-bold text-brand-navy">Contacto</h1>
        <p className="text-muted-foreground">
          Estamos ubicados en Vitacura, a pasos del Parque Araucano. Escríbenos o llámanos directamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Info & Map */}
        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-6">
            <h3 className="font-heading text-xl font-bold text-brand-navy">Información de Atención</h3>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <strong>Dirección:</strong><br/>
                  Av. Kennedy 7100, Oficina 706, Piso 7.<br/>
                  Vitacura, Santiago de Chile. (Edificio Kennedy Plaza)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📞</span>
                <div>
                  <strong>Teléfono Clínico:</strong><br/>
                  (56-2) 2953 9291
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✉</span>
                <div>
                  <strong>Email:</strong><br/>
                  contacto@dentalquantum.cl
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">⏰</span>
                <div>
                  <strong>Horarios:</strong><br/>
                  Lunes a Jueves: 09:00 - 13:00 y 14:00 - 18:00 hrs.<br/>
                  Viernes: 09:00 - 13:00 y 14:00 - 17:00 hrs.<br/>
                  Sábado y Domingo: Cerrado.
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps embed */}
          <div className="h-72 w-full rounded-2xl overflow-hidden border border-border shadow-sm">
            <iframe
              title="Ubicación Clínica Dental Quantum"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.4137266155605!2d-70.56942738480164!3d-33.39958348078865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662c95781a7b4db%3A0xc4f5e7f1fdf96e8e!2sAv.%20Presidente%20Kennedy%207100%2C%20Vitacura%2C%20Regi%C3%B3n%20Metropolitana!5e0!3m2!1ses-419!2scl!4v1620000000000!5m2!1ses-419!2scl"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-border shadow-sm space-y-6">
          <h3 className="font-heading text-xl font-bold text-brand-navy">Envíanos un Mensaje</h3>
          
          {status === "success" ? (
            <div className="p-6 bg-brand-turquoise/10 text-brand-navy rounded-xl border border-brand-turquoise/20 space-y-3">
              <div className="text-2xl">🎉</div>
              <h4 className="font-bold text-base">¡Mensaje Enviado!</h4>
              <p className="text-sm">
                Hemos registrado tu consulta correctamente. Una de nuestras coordinadoras se pondrá en contacto contigo en breve.
              </p>
              <Button onClick={() => setStatus("idle")} variant="outline" size="sm" className="mt-2 text-xs border-brand-turquoise/40 text-brand-navy">
                Enviar otro mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sofía Martínez"
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: sofia@correo.com"
                    className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +56 9 1234 5678"
                    className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Especialidad de Interés</label>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="implantologia">Implantología</option>
                  <option value="ortodoncia">Ortodoncia</option>
                  <option value="odontopediatria">Odontopediatría</option>
                  <option value="periodoncia">Periodoncia</option>
                  <option value="endodoncia">Endodoncia</option>
                  <option value="estetica">Estética Dental / Facial</option>
                  <option value="otro">Consulta General / Otro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Mensaje o Consulta</label>
                <textarea
                  rows={4}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Detalla tu consulta aquí..."
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50 resize-none"
                />
              </div>

              <div className="text-slate-400 text-[10px] leading-relaxed">
                Al enviar este formulario, usted acepta que Clínica Dental Quantum procese sus datos para responder a su consulta, en conformidad con la Ley 19.628 de Protección de Datos Personales en Chile.
              </div>

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md py-3 text-sm rounded-lg"
              >
                {status === "loading" ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
