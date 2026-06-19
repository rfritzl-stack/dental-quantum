"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface KPI {
  citasHoy: number;
  citasHoyDetalle: string;
  ingresosHoy: number;
  ingresosHoyDetalle: string;
  leadsNuevos: number;
  noShowRate: number;
}

interface TimelineItem {
  id: string;
  hora: string;
  paciente: string;
  tratamiento: string;
  profesional: string;
  estado: string;
}

interface AlertItem {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
}

interface ChartItem {
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const d = await res.json();
        setKpis(d.kpis);
        setTimeline(d.timeline);
        setAlerts(d.alerts);
        setChartData(d.chartData);
      }
    } catch (e) {
      console.error("Error loading dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 text-red-800 border-red-100 dark:bg-red-950/20 dark:text-red-300";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300";
      default:
        return "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-300";
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "confirmada":
      case "realizada":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "pendiente":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "cancelada":
      case "no_show":
        return "bg-slate-50 text-slate-500 border border-slate-100 opacity-60";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-100";
    }
  };

  const getTimelineBorder = (estado: string) => {
    switch (estado) {
      case "confirmada":
      case "realizada":
        return "border-emerald-400";
      case "pendiente":
        return "border-brand-gold";
      case "cancelada":
      case "no_show":
        return "border-slate-300 opacity-60";
      default:
        return "border-brand-turquoise";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white h-28 rounded-xl border border-border"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white h-80 rounded-xl border"></div>
          <div className="bg-white h-80 rounded-xl border"></div>
        </div>
      </div>
    );
  }

  const chartTotal = chartData.reduce((acc, c) => acc + c.value, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-brand-navy">Resumen Operativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Control diario de Clínica Dental Quantum.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pacientes/nuevo">
            <Button variant="outline" className="text-xs">👥 Nuevo Paciente</Button>
          </Link>
          <Link href="/admin/whatsapp">
            <Button className="bg-brand-turquoise hover:bg-brand-turquoise/90 text-brand-navy font-semibold text-xs">💬 Confirmaciones</Button>
          </Link>
          <Link href="/admin/importar">
            <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold text-xs">📥 Importar Datos</Button>
          </Link>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-2 hover:shadow transition-shadow">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Citas del Día</span>
          <div className="text-3xl font-bold text-brand-navy">{kpis?.citasHoy || 0} Citas</div>
          <p className="text-[11px] text-slate-500 font-medium">{kpis?.citasHoyDetalle}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-2 hover:shadow transition-shadow">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ingresos de Hoy</span>
          <div className="text-3xl font-bold text-brand-navy">${kpis?.ingresosHoy.toLocaleString("es-CL") || 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">{kpis?.ingresosHoyDetalle}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-2 hover:shadow transition-shadow">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Leads Nuevos</span>
          <div className="text-3xl font-bold text-brand-turquoise">{kpis?.leadsNuevos || 0} Leads</div>
          <p className="text-[11px] text-slate-500 font-medium">Pendientes de gestión en la clínica</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-2 hover:shadow transition-shadow">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tasa No-Show (Mes)</span>
          <div className="text-3xl font-bold text-red-500">{kpis?.noShowRate || 0}%</div>
          <p className="text-[11px] text-slate-500 font-medium">Citas no asistidas sobre el total mensual</p>
        </div>
      </div>

      {/* ALERTS AND TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline of Appointments */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-heading text-lg font-bold text-brand-navy">Agenda de Hoy</h3>
            <span className="text-xs text-muted-foreground font-semibold">
              {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              No hay citas programadas para el día de hoy.
            </div>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {timeline.map((cita) => (
                <div 
                  key={cita.id} 
                  className={`flex items-center gap-4 p-3 border-l-4 ${getTimelineBorder(cita.estado)} bg-slate-50 rounded-r-lg hover:bg-slate-100 transition-colors`}
                >
                  <div className="text-xs font-bold text-brand-navy w-24">{cita.hora}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-brand-navy truncate">{cita.paciente}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{cita.tratamiento} • {cita.profesional}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusBadge(cita.estado)}`}>
                    {cita.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Alerts */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-brand-navy border-b pb-2">Alertas del Sistema</h3>
            {alerts.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold text-center">
                ✓ Todo en orden, sin alertas pendientes.
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 border rounded-lg text-xs space-y-1 ${getAlertStyle(alert.type)}`}>
                    <div className="font-bold">
                      {alert.type === "warning" ? "⚠️" : alert.type === "error" ? "🚨" : "ℹ️"} {alert.title}
                    </div>
                    <p className="opacity-90">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ocupación por Especialidad */}
          <div className="space-y-4 pt-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
              Distribución de Especialidades
            </h3>
            <div className="space-y-3">
              {chartData.map((item, idx) => {
                const percent = chartTotal > 0 ? Math.round((item.value / chartTotal) * 100) : 0;
                // Colores dinámicos para barras
                const colors = ["bg-brand-turquoise", "bg-brand-gold", "bg-brand-navy", "bg-indigo-500", "bg-emerald-500"];
                const color = colors[idx % colors.length];

                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 truncate max-w-[150px]">{item.name}</span>
                      <span className="text-slate-500 font-bold">{item.value} citas ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
