"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface Tratamiento {
  id: string;
  nombre_tratamiento: string;
  estado: string;
  sesiones_estimadas: number;
  sesiones_realizadas: number;
  costo_total: number;
  paciente: { id: string; nombre: string; apellido: string };
  profesional: { nombre: string; apellido: string };
  especialidad: { nombre: string };
}

const ESTADOS = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "plan_aprobado", label: "Plan Aprobado" },
  { value: "en_proceso", label: "En Proceso" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "completado", label: "Completado" },
];

export default function AdminTratamientosKanbanPage() {
  const { user } = useAuth();
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTratamientos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tratamientos");
      if (res.ok) {
        const d = await res.json();
        setTratamientos(d.tratamientos || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTratamientos();
  }, []);

  const handleMoveState = async (id: string, nuevoEstado: string) => {
    if (user?.role === "recepcionista") {
      alert("Acceso denegado: Únicamente Dentistas y Administradores pueden modificar los estados de tratamiento.");
      return;
    }

    try {
      const res = await fetch("/api/tratamientos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });
      if (res.ok) {
        fetchTratamientos();
      } else {
        alert("Error al actualizar estado.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-muted-foreground">Cargando tablero...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Tablero de Tratamientos (Kanban)</h1>
          <p className="text-muted-foreground text-sm">Monitorea el avance de los planes activos en la clínica.</p>
        </div>
        {user?.role === "recepcionista" && (
          <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded border border-amber-200 font-semibold">
            Modo Consulta (Solo Lectura)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {ESTADOS.map((col) => {
          const items = tratamientos.filter((t) => t.estado === col.value);
          return (
            <div key={col.value} className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 min-w-[200px]">
              <div className="flex justify-between items-center border-b pb-2 border-slate-300">
                <span className="font-heading text-xs font-bold uppercase text-brand-navy tracking-wider">{col.label}</span>
                <span className="bg-brand-navy text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{items.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-muted-foreground italic">Vacío</div>
                ) : (
                  items.map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between hover:shadow transition-all">
                      <div>
                        <div className="text-[10px] font-bold text-brand-turquoise uppercase">{t.especialidad.nombre}</div>
                        <h4 className="font-heading font-bold text-xs text-brand-navy mt-1">
                          {t.nombre_tratamiento}
                        </h4>
                        
                        <div className="text-[10px] text-slate-600 font-semibold mt-2">
                          Paciente: {t.paciente.nombre} {t.paciente.apellido}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          Dentista: Dr(a). {t.profesional.nombre} {t.profesional.apellido}
                        </div>
                      </div>

                      <div className="border-t pt-2 mt-2 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Sesiones:</span>
                          <span className="font-bold text-slate-700">{t.sesiones_realizadas} / {t.sesiones_estimadas}</span>
                        </div>

                        {/* Move actions (Only for Dentista/Admin) */}
                        {user?.role !== "recepcionista" && (
                          <div className="flex justify-between gap-1 mt-1">
                            {/* Prev button */}
                            {ESTADOS.findIndex((e) => e.value === col.value) > 0 ? (
                              <Button
                                size="xs"
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-5"
                                onClick={() => {
                                  const idx = ESTADOS.findIndex((e) => e.value === col.value);
                                  handleMoveState(t.id, ESTADOS[idx - 1].value);
                                }}
                              >
                                ◀
                              </Button>
                            ) : <div />}

                            <Link href={`/admin/pacientes/${t.paciente.id}`}>
                              <Button size="xs" variant="ghost" className="text-[9px] px-1 py-0 h-5">Ficha</Button>
                            </Link>

                            {/* Next button */}
                            {ESTADOS.findIndex((e) => e.value === col.value) < ESTADOS.length - 1 ? (
                              <Button
                                size="xs"
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-5"
                                onClick={() => {
                                  const idx = ESTADOS.findIndex((e) => e.value === col.value);
                                  handleMoveState(t.id, ESTADOS[idx + 1].value);
                                }}
                              >
                                ▶
                              </Button>
                            ) : <div />}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
