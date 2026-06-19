"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Paciente {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  creado_en: string;
}

export default function AdminPacientesListPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPacientes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pacientes");
      if (response.ok) {
        const data = await response.json();
        setPacientes(data.pacientes || []);
      }
    } catch (e) {
      console.error("Error loading patients:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const filtered = pacientes.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      p.apellido.toLowerCase().includes(term) ||
      p.rut.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Pacientes y Fichas</h1>
          <p className="text-muted-foreground text-sm">Gestiona la base de datos de pacientes y accede a sus fichas clínicas.</p>
        </div>
        <Link href="/admin/pacientes/nuevo">
          <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold">
            + Nuevo Paciente
          </Button>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Buscar por Nombre, RUT o Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Cargando lista de pacientes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No se encontraron pacientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">RUT</th>
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filtered.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-medium">{paciente.rut}</td>
                    <td className="p-4 font-bold text-brand-navy">{paciente.nombre} {paciente.apellido}</td>
                    <td className="p-4">{paciente.email || "No registrado"}</td>
                    <td className="p-4">{paciente.telefono || "No registrado"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        paciente.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {paciente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/pacientes/${paciente.id}`}>
                        <Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">
                          📁 Ver Ficha
                        </Button>
                      </Link>
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
