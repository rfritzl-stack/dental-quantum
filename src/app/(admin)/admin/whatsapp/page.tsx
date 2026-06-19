"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WhatsappItem {
  id: string;
  paciente_nombre: string;
  paciente_telefono: string;
  mensaje_generado: string;
  estado_envio: string;
  agenda: {
    fecha_hora_inicio: string;
    especialidad: { nombre: string };
    profesional: { nombre: string; apellido: string };
  };
}

export default function AdminWhatsappPage() {
  // Por defecto, mañana
  const getMañanaStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [fecha, setFecha] = useState(getMañanaStr());
  const [lista, setLista] = useState<WhatsappItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLista = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/lista?fecha=${fecha}`);
      if (res.ok) {
        const d = await res.json();
        setLista(d.lista || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch("/api/whatsapp/lista", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado_envio: nuevoEstado }),
      });
      if (res.ok) {
        fetchLista();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyMessage = (texto: string) => {
    navigator.clipboard.writeText(texto);
    alert("Mensaje copiado al portapapeles.");
  };

  const handleOpenWhatsapp = (telefono: string, texto: string) => {
    // Sanitizar número de teléfono (debe ser formato wa.me/569...)
    let cleanFono = telefono.replace(/[^0-9kK]/g, "");
    if (!cleanFono.startsWith("56")) {
      cleanFono = `56${cleanFono}`;
    }
    const encodedText = encodeURIComponent(texto);
    window.open(`https://wa.me/${cleanFono}?text=${encodedText}`, "_blank");
  };

  // KPIs
  const total = lista.length;
  const confirmados = lista.filter((i) => i.estado_envio === "confirmado").length;
  const pendientes = lista.filter((i) => i.estado_envio === "pendiente").length;
  const cancelados = lista.filter((i) => i.estado_envio === "cancelado").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Módulo de Notificaciones WhatsApp (Fase 1)</h1>
          <p className="text-muted-foreground text-sm">Pregenera y envía recordatorios semi-manuales de citas clínicas.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Fecha de Citas:</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-40 text-xs" />
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400">Total Citados</div>
          <div className="text-xl font-bold text-brand-navy mt-1">{total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm text-center border-l-4 border-l-brand-turquoise">
          <div className="text-xs font-semibold text-slate-400">Confirmados</div>
          <div className="text-xl font-bold text-brand-turquoise mt-1">{confirmados}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm text-center border-l-4 border-l-brand-gold">
          <div className="text-xs font-semibold text-slate-400">Pendientes</div>
          <div className="text-xl font-bold text-brand-gold mt-1">{pendientes}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm text-center border-l-4 border-l-red-500">
          <div className="text-xs font-semibold text-slate-400">Cancelados</div>
          <div className="text-xl font-bold text-red-500 mt-1">{cancelados}</div>
        </div>
      </div>

      {/* Patient Cards List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted-foreground">Cargando lista de envíos...</div>
      ) : lista.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
          No se registran citas agendadas para el día seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lista.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-brand-navy">{item.paciente_nombre}</h3>
                    <div className="text-[10px] text-brand-turquoise font-semibold mt-0.5">{item.paciente_telefono}</div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {new Date(item.agenda.fecha_hora_inicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} hrs
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 mt-3 space-y-1">
                  <div>Especialidad: <span className="font-semibold text-slate-700">{item.agenda.especialidad.nombre}</span></div>
                  <div>Odontólogo: <span className="font-semibold text-slate-700">Dr(a). {item.agenda.profesional.nombre} {item.agenda.profesional.apellido}</span></div>
                </div>

                {/* Pre-written message box */}
                <div className="mt-3 bg-slate-50 border p-3 rounded-lg text-xs font-mono relative text-slate-600">
                  <div className="line-clamp-3 leading-relaxed">{item.mensaje_generado}</div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="border-t pt-3 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Estado Envío:</span>
                  <select
                    value={item.estado_envio}
                    onChange={(e) => handleUpdateEstado(item.id, e.target.value)}
                    className="border rounded text-[10px] p-1 bg-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="no_responde">No Responde</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleCopyMessage(item.mensaje_generado)}
                    className="text-[10px]"
                  >
                    📋 Copiar
                  </Button>
                  <Button
                    size="xs"
                    onClick={() => handleOpenWhatsapp(item.paciente_telefono, item.mensaje_generado)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]"
                  >
                    💬 WhatsApp Web
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
