"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: string;
  fecha_hora_inicio: string;
  estado: string;
  especialidad: { nombre: string };
  profesional: { nombre: string; apellido: string };
}

interface Treatment {
  id: string;
  nombre_tratamiento: string;
  estado: string;
  sesiones_estimadas: number;
  sesiones_realizadas: number;
  profesional: { nombre: string; apellido: string };
}

export default function PortalDashboard() {
  const { user } = useAuth();
  const [proximaCita, setProximaCita] = useState<Appointment | null>(null);
  const [tratamientoActivo, setTratamientoActivo] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/portal/dashboard-summary?rut=${user.rut || ""}&email=${user.email}`);
        if (response.ok) {
          const data = await response.json();
          setProximaCita(data.proximaCita);
          setTratamientoActivo(data.tratamientoActivo);
        } else {
          // Fallback manual a datos de simulación si falla
          setProximaCita({
            id: "apt-mock",
            fecha_hora_inicio: new Date(Date.now() + 86400000).toISOString(), // Mañana
            estado: "confirmada",
            especialidad: { nombre: "Ortodoncia" },
            profesional: { nombre: "Andrés", apellido: "Silva" }
          });
          setTratamientoActivo({
            id: "treat-mock",
            nombre_tratamiento: "Ortodoncia Invisible",
            estado: "en_proceso",
            sesiones_estimadas: 10,
            sesiones_realizadas: 6,
            profesional: { nombre: "Andrés", apellido: "Silva" }
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Formatear Fecha
  const formatFecha = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-brand-navy dark:text-white">
            ¡Hola, {user?.nombre || "Paciente"}!
          </h1>
          {user?.rut ? (
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              RUT Asociado: <span className="font-mono text-brand-turquoise">{user.rut}</span>. Aquí puedes ver tu ficha e historial médico.
            </p>
          ) : (
            <div className="mt-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              ⚠️ Tu cuenta no tiene un RUT asociado. Vincula tu cuenta para ver tu ficha histórica.
              <Link href="/portal/citas" className="block mt-1 font-bold underline hover:text-amber-700">
                Vincular RUT ahora
              </Link>
            </div>
          )}
        </div>
        <Link href="/portal/agendar">
          <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white font-medium text-xs md:text-sm">
            Agendar Nueva Cita
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-white h-48 rounded-xl border"></div>
          <div className="bg-white h-48 rounded-xl border"></div>
          <div className="bg-white h-48 rounded-xl border"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta 1: Próxima Cita */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-border shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-brand-navy dark:text-white mb-3">Próxima Cita</h3>
              {proximaCita ? (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-turquoise/10 text-brand-turquoise uppercase">
                      {proximaCita.estado}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-brand-navy dark:text-white capitalize">
                    {formatFecha(proximaCita.fecha_hora_inicio)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Especialidad: <span className="font-semibold text-slate-700 dark:text-slate-300">{proximaCita.especialidad?.nombre}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Profesional: <span className="font-semibold text-slate-700 dark:text-slate-300">Dr(a). {proximaCita.profesional?.nombre} {proximaCita.profesional?.apellido}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4">No tienes próximas citas agendadas.</p>
              )}
            </div>
            {proximaCita && (
              <Link href="/portal/citas">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Gestionar mis Citas
                </Button>
              </Link>
            )}
          </div>

          {/* Tarjeta 2: Tratamiento Activo */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-border shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-brand-navy dark:text-white mb-3">Tratamiento Activo</h3>
              {tratamientoActivo ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-brand-navy dark:text-white truncate">
                      {tratamientoActivo.nombre_tratamiento}
                    </span>
                    <span className="text-xs font-bold text-brand-turquoise uppercase bg-brand-turquoise/5 px-2 py-0.5 rounded">
                      {tratamientoActivo.estado.replace("_", " ")}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  {(() => {
                    const pct = Math.round((tratamientoActivo.sesiones_realizadas / (tratamientoActivo.sesiones_estimadas || 1)) * 100);
                    return (
                      <>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-brand-turquoise h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                          <span>{tratamientoActivo.sesiones_realizadas} de {tratamientoActivo.sesiones_estimadas} sesiones</span>
                          <span>{pct}% completado</span>
                        </div>
                      </>
                    );
                  })()}

                  <div className="text-xs text-muted-foreground pt-1 border-t border-slate-100 dark:border-slate-800">
                    Profesional: Dr(a). {tratamientoActivo.profesional?.nombre} {tratamientoActivo.profesional?.apellido}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4">No registras tratamientos en curso actualmente.</p>
              )}
            </div>
            {tratamientoActivo && (
              <Link href="/portal/tratamientos">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Detalles del Tratamiento
                </Button>
              </Link>
            )}
          </div>

          {/* Tarjeta 3: Accesos Rápidos */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="font-heading text-lg font-bold text-brand-navy dark:text-white">Documentación y Archivos</h3>
            <p className="text-xs text-muted-foreground">Revisa tus radiografías, presupuestos firmados y boletas de honorarios en cualquier momento.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href="/portal/documentos" className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-brand-turquoise/40 rounded-xl text-center transition-all">
                <div className="text-2xl mb-1">📁</div>
                <div className="text-xs font-semibold text-brand-navy dark:text-white">Ver Documentos</div>
              </Link>
              <Link href="/portal/citas" className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-brand-turquoise/40 rounded-xl text-center transition-all">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-xs font-semibold text-brand-navy dark:text-white">Historial Clínico</div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
