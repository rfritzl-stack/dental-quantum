"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Cita {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  motivo_consulta: string | null;
  especialidad: { nombre: string };
  profesional: { nombre: string; apellido: string };
}

export default function PortalCitasPage() {
  const { user, associateRut } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [rutInput, setRutInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCitas = async () => {
    if (!user?.rut) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/portal/citas?rut=${user.rut}`);
      if (response.ok) {
        const data = await response.json();
        setCitas(data.citas || []);
      } else {
        // Fallback demo
        setCitas([
          {
            id: "cita-1",
            fecha_hora_inicio: new Date(Date.now() + 86400000).toISOString(),
            fecha_hora_fin: new Date(Date.now() + 86400000 + 1800000).toISOString(),
            estado: "confirmada",
            motivo_consulta: "Control de brackets mensual",
            especialidad: { nombre: "Ortodoncia" },
            profesional: { nombre: "Andrés", apellido: "Silva" }
          },
          {
            id: "cita-2",
            fecha_hora_inicio: new Date(Date.now() - 500000000).toISOString(),
            fecha_hora_fin: new Date(Date.now() - 500000000 + 3600000).toISOString(),
            estado: "realizada",
            motivo_consulta: "Limpieza e inspección de rutina",
            especialidad: { nombre: "Odontología Operatoria" },
            profesional: { nombre: "Claudia", apellido: "Toledo" }
          }
        ]);
      }
    } catch (err) {
      console.error("Error fetching patient appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLinkRut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutInput) return;
    setLinking(true);
    setMessage(null);
    const res = await associateRut(rutInput);
    setLinking(false);
    if (res.success) {
      setMessage({ type: "success", text: "¡Tu cuenta ha sido vinculada correctamente!" });
      setTimeout(() => {
        fetchCitas();
      }, 1000);
    } else {
      setMessage({ type: "error", text: res.error || "No se pudo vincular el RUT." });
    }
  };

  const handleCancelCita = async (citaId: string, fechaInicioStr: string) => {
    // Regla de corte: verificar si falta más de 24 horas
    const ahora = new Date();
    const fechaCita = new Date(fechaInicioStr);
    const diferenciaMs = fechaCita.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras < 24) {
      alert("Lo sentimos, las citas solo pueden ser canceladas con un mínimo de 24 horas de anticipación. Por favor, comunícate con la clínica por teléfono.");
      return;
    }

    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agendas/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agendaId: citaId }),
      });

      if (response.ok) {
        alert("Cita cancelada con éxito.");
        fetchCitas();
      } else {
        alert("Error al cancelar la cita. Por favor intenta nuevamente.");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Error en el servidor al intentar cancelar.");
    }
  };

  const formatFecha = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!user?.rut) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-white">Vincular Ficha Histórica</h2>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Ingresa tu RUT para conectar tu cuenta con tus citas, diagnósticos y radiografías históricas de la clínica.
          </p>
        </div>

        <form onSubmit={handleLinkRut} className="space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg text-xs md:text-sm font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30"
                  : "bg-red-50 text-red-800 dark:bg-red-950/30"
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              RUT del Paciente (con guión y DV)
            </label>
            <Input
              required
              placeholder="12.345.678-9"
              value={rutInput}
              onChange={(e) => setRutInput(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={linking}
            className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold"
          >
            {linking ? "Vinculando..." : "Asociar mi Ficha"}
          </Button>
        </form>
      </div>
    );
  }

  const futuras = citas.filter((c) => new Date(c.fecha_hora_inicio) >= new Date() && c.estado !== "cancelada");
  const pasadas = citas.filter((c) => new Date(c.fecha_hora_inicio) < new Date() || c.estado === "cancelada");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">Mis Citas</h1>
        <p className="text-muted-foreground text-sm">Gestiona tus próximas horas médicas y revisa el historial clínico.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white h-24 rounded-xl border"></div>
          <div className="bg-white h-24 rounded-xl border"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Citas Futuras */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white border-b pb-2">
              Próximas Citas
            </h2>
            {futuras.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border text-center text-xs md:text-sm text-muted-foreground">
                No tienes citas programadas para los próximos días.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {futuras.map((cita) => (
                  <div key={cita.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-turquoise/10 text-brand-turquoise uppercase">
                          {cita.estado}
                        </span>
                        <span className="text-xs text-muted-foreground">ID: {cita.id.slice(0, 8)}</span>
                      </div>
                      <h4 className="font-heading font-bold text-brand-navy dark:text-white text-base mt-2 capitalize">
                        {formatFecha(cita.fecha_hora_inicio)}
                      </h4>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <div>Especialidad: <span className="font-semibold text-slate-700 dark:text-slate-300">{cita.especialidad.nombre}</span></div>
                        <div>Profesional: <span className="font-semibold text-slate-700 dark:text-slate-300">Dr(a). {cita.profesional.nombre} {cita.profesional.apellido}</span></div>
                        {cita.motivo_consulta && (
                          <div className="italic bg-slate-50 dark:bg-slate-900 p-2 rounded mt-2 text-slate-600 dark:text-slate-400">
                            Motivo: &quot;{cita.motivo_consulta}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t pt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelCita(cita.id, cita.fecha_hora_inicio)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Cancelar Cita
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Citas */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white border-b pb-2">
              Historial y Citas Pasadas
            </h2>
            {pasadas.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aún no registras citas pasadas en nuestro sistema.</p>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-border">
                      <tr>
                        <th className="p-4">Fecha e Inicio</th>
                        <th className="p-4">Profesional</th>
                        <th className="p-4">Especialidad</th>
                        <th className="p-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-slate-600 dark:text-slate-400">
                      {pasadas.map((cita) => (
                        <tr key={cita.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold capitalize">{formatFecha(cita.fecha_hora_inicio)}</td>
                          <td className="p-4">Dr(a). {cita.profesional.nombre} {cita.profesional.apellido}</td>
                          <td className="p-4">{cita.especialidad.nombre}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              cita.estado === "realizada"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                : cita.estado === "cancelada"
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800"
                                : "bg-red-50 text-red-700 dark:bg-red-950/20"
                            }`}>
                              {cita.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
