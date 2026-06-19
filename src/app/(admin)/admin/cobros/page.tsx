"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Cobro {
  id: string;
  concepto: string;
  monto: number;
  metodo_pago: string;
  estado: string;
  folio_boleta: string | null;
  fecha_emision: string | null;
  paciente: { nombre: string; apellido: string; rut: string };
}

export default function AdminCobrosDashboardPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payMethodFilter, setPayMethodFilter] = useState("");

  const fetchCobros = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cobros");
      if (res.ok) {
        const d = await res.json();
        setCobros(d.cobros || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCobros();
  }, []);

  const filtered = cobros.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      c.concepto.toLowerCase().includes(term) ||
      c.paciente.nombre.toLowerCase().includes(term) ||
      c.paciente.apellido.toLowerCase().includes(term) ||
      c.paciente.rut.toLowerCase().includes(term);

    const matchesMethod = payMethodFilter ? c.metodo_pago === payMethodFilter : true;
    return matchesSearch && matchesMethod;
  });

  // KPIs
  const totalRecaudado = cobros.reduce((acc, curr) => acc + curr.monto, 0);
  const totalPOS = cobros.filter((c) => c.metodo_pago === "pos_fisico").reduce((acc, curr) => acc + curr.monto, 0);
  const totalTransferencia = cobros.filter((c) => c.metodo_pago === "transferencia").reduce((acc, curr) => acc + curr.monto, 0);
  const totalEfectivo = cobros.filter((c) => c.metodo_pago === "efectivo").reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy">Cobros y Caja General</h1>
        <p className="text-muted-foreground text-sm">Control e historial de pagos y facturación DTE de boletas.</p>
      </div>

      {/* Billing KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400">Recaudación Total</div>
          <div className="text-xl font-bold text-brand-navy mt-1">${totalRecaudado.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm text-center border-l-4 border-l-brand-turquoise">
          <div className="text-xs font-semibold text-slate-400">Total Tarjetas (POS)</div>
          <div className="text-xl font-bold text-brand-turquoise mt-1">${totalPOS.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm text-center border-l-4 border-l-brand-gold">
          <div className="text-xs font-semibold text-slate-400">Transferencias</div>
          <div className="text-xl font-bold text-brand-gold mt-1">${totalTransferencia.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm text-center border-l-4 border-l-slate-400">
          <div className="text-xs font-semibold text-slate-400">Efectivo</div>
          <div className="text-xl font-bold text-slate-700 mt-1">${totalEfectivo.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex gap-4 flex-wrap justify-between items-center">
          {/* Filters */}
          <div className="flex gap-3 max-w-lg flex-1">
            <Input
              placeholder="Buscar por Paciente, RUT o Concepto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
            <select
              value={payMethodFilter}
              onChange={(e) => setPayMethodFilter(e.target.value)}
              className="border rounded px-2 text-xs bg-white w-48"
            >
              <option value="">Todos los medios</option>
              <option value="pos_fisico">POS Tarjetas</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="seguro">Seguro</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-xs text-muted-foreground">Cargando cobros...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">No se registran cobros con los filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                <tr>
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Concepto</th>
                  <th className="p-4">Medio de Pago</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4">Boleta SII</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-600">
                {filtered.map((cob) => (
                  <tr key={cob.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-brand-navy">{cob.paciente.nombre} {cob.paciente.apellido}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cob.paciente.rut}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700">{cob.concepto}</div>
                      {cob.fecha_emision && <div className="text-[10px] text-slate-400">{new Date(cob.fecha_emision).toLocaleDateString()}</div>}
                    </td>
                    <td className="p-4 capitalize">{cob.metodo_pago.replace("_", " ")}</td>
                    <td className="p-4 font-bold text-brand-navy">${cob.monto.toLocaleString()}</td>
                    <td className="p-4">
                      {cob.folio_boleta ? (
                        <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          N° {cob.folio_boleta}
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded font-bold">Pendiente</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {cob.folio_boleta ? (
                        <a href={`/storage/boletas/boleta_${cob.folio_boleta}.pdf`} target="_blank" rel="noopener noreferrer">
                          <Button size="xs" variant="outline" className="text-[10px]">Ver DTE</Button>
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Emisión en Ficha</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
