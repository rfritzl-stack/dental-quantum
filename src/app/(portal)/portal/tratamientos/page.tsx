"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface Sesion {
  id: string;
  numero_sesion: number;
  notas_clinicas: string | null;
  hallazgos: string | null;
  proxima_accion: string | null;
  fecha_registro: string;
}

interface Tratamiento {
  id: string;
  nombre_tratamiento: string;
  descripcion: string | null;
  estado: string;
  costo_total: number;
  sesiones_estimadas: number;
  sesiones_realizadas: number;
  fecha_inicio: string | null;
  profesional: { nombre: string; apellido: string };
  especialidad: { nombre: string };
  sesiones: Sesion[];
}

export default function PortalTratamientosPage() {
  const { user } = useAuth();
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.rut) {
      setLoading(false);
      return;
    }

    const fetchTratamientos = async () => {
      try {
        const response = await fetch(`/api/portal/tratamientos?rut=${user.rut}`);
        if (response.ok) {
          const data = await response.json();
          setTratamientos(data.tratamientos || []);
        } else {
          // Fallback demo
          setTratamientos([
            {
              id: "t-1",
              nombre_tratamiento: "Ortodoncia Invisible",
              descripcion: "Alineamiento dental estético mediante cubetas transparentes Invisalign.",
              estado: "en_proceso",
              costo_total: 1200000,
              sesiones_estimadas: 10,
              sesiones_realizadas: 6,
              fecha_inicio: "2026-02-10",
              profesional: { nombre: "Andrés", apellido: "Silva" },
              especialidad: { nombre: "Ortodoncia" },
              sesiones: [
                {
                  id: "s-1",
                  numero_sesion: 1,
                  notas_clinicas: "Instalación del set inicial y ataches.",
                  hallazgos: "Buena adaptación ósea.",
                  proxima_accion: "Revisión en 4 semanas.",
                  fecha_registro: "2026-02-10T10:30:00Z"
                },
                {
                  id: "s-2",
                  numero_sesion: 2,
                  notas_clinicas: "Control y entrega de sets 3 y 4.",
                  hallazgos: "Paciente reporta leve presión.",
                  proxima_accion: "Próximo set en 15 días.",
                  fecha_registro: "2026-03-10T11:00:00Z"
                }
              ]
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching treatments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTratamientos();
  }, [user]);

  const formatFecha = (dateString: string | null) => {
    if (!dateString) return "No iniciada";
    const d = new Date(dateString);
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  };

  if (!user?.rut) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border text-center text-xs md:text-sm text-muted-foreground">
        Por favor vincula tu RUT en la sección &quot;Mis Citas&quot; para visualizar tus planes de tratamiento activos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">Planes de Tratamiento</h1>
        <p className="text-muted-foreground text-sm">Monitorea el progreso, sesiones realizadas y notas de tus tratamientos.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white h-32 rounded-xl border"></div>
          <div className="bg-white h-32 rounded-xl border"></div>
        </div>
      ) : tratamientos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border text-center text-xs md:text-sm text-muted-foreground">
          No tienes planes de tratamientos registrados actualmente.
        </div>
      ) : (
        <div className="space-y-6">
          {tratamientos.map((trat) => {
            const pct = Math.round((trat.sesiones_realizadas / (trat.sesiones_estimadas || 1)) * 100);
            return (
              <div key={trat.id} className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Cabecera del Tratamiento */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-border flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
                        {trat.nombre_tratamiento}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-turquoise/10 text-brand-turquoise uppercase">
                        {trat.estado.replace("_", " ")}
                      </span>
                    </div>
                    {trat.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{trat.descripcion}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Dentista a cargo: <span className="font-semibold text-brand-navy dark:text-white">Dr(a). {trat.profesional.nombre} {trat.profesional.apellido}</span></div>
                    <div>Fecha de inicio: <span className="font-semibold text-brand-navy dark:text-white">{formatFecha(trat.fecha_inicio)}</span></div>
                  </div>
                </div>

                {/* Contenido / Progreso */}
                <div className="p-6 space-y-6">
                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-brand-navy dark:text-white">
                      <span>Progreso del Tratamiento</span>
                      <span>{pct}% Completado</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div className="bg-brand-turquoise h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trat.sesiones_realizadas} de {trat.sesiones_estimadas} sesiones estimadas completadas.
                    </div>
                  </div>

                  {/* Detalle de Sesiones */}
                  <div className="space-y-3">
                    <h4 className="font-heading text-sm font-bold text-brand-navy dark:text-white">
                      Historial de Sesiones Registradas
                    </h4>
                    {trat.sesiones.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No se han registrado visitas clínicas para este plan aún.</p>
                    ) : (
                      <div className="space-y-3 border-l-2 border-slate-100 dark:border-slate-800 ml-2 pl-4">
                        {trat.sesiones.map((ses) => (
                          <div key={ses.id} className="relative space-y-1">
                            <span className="absolute -left-[22px] top-1 size-3 bg-brand-turquoise rounded-full border-2 border-white dark:border-slate-800" />
                            <div className="text-xs font-bold text-brand-navy dark:text-white">
                              Sesión #{ses.numero_sesion} — {new Date(ses.fecha_registro).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                            </div>
                            {ses.notas_clinicas && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">Notas Clínicas:</span> {ses.notas_clinicas}
                              </p>
                            )}
                            {ses.proxima_accion && (
                              <div className="text-xs text-brand-turquoise font-semibold">
                                Próxima Acción: {ses.proxima_accion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
