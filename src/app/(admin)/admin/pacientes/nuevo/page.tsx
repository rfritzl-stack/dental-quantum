"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminNuevoPacientePage() {
  const router = useRouter();
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [prevision, setPrevision] = useState("");
  const [seguroComplementario, setSeguroComplementario] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut || !nombre || !apellido) {
      setErrorMsg("RUT, Nombre y Apellido son obligatorios.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rut,
          nombre,
          apellido,
          email,
          telefono,
          fecha_nacimiento: fechaNacimiento || null,
          prevision,
          seguro_complementario: seguroComplementario,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/admin/pacientes");
      } else {
        setErrorMsg(data.error || "Ocurrió un error al registrar el paciente.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-navy">Registrar Nuevo Paciente</h1>
          <p className="text-muted-foreground text-xs">Crea un registro de ficha clínica para un nuevo paciente.</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/admin/pacientes")} size="sm">
          ← Volver
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Nombre *</label>
            <Input required placeholder="Ej: Juan" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Apellido *</label>
            <Input required placeholder="Ej: Pérez" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">RUT *</label>
          <Input required placeholder="Ej: 12345678-9" value={rut} onChange={(e) => setRut(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Email</label>
            <Input type="email" placeholder="Ej: juan@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Teléfono</label>
            <Input placeholder="Ej: +56 9 1234 5678" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Fecha de Nacimiento</label>
          <Input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Previsión</label>
            <select
              value={prevision}
              onChange={(e) => setPrevision(e.target.value)}
              className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-brand-turquoise bg-white"
            >
              <option value="">Seleccione previsión</option>
              <option value="Fonasa">Fonasa</option>
              <option value="Isapre Banmédica">Banmédica</option>
              <option value="Isapre Consalud">Consalud</option>
              <option value="Isapre Colmena">Colmena</option>
              <option value="Isapre Cruz Blanca">Cruz Blanca</option>
              <option value="Isapre Nueva Masvida">Nueva Masvida</option>
              <option value="Particular">Particular / Ninguna</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Seguro Complementario</label>
            <Input placeholder="Ej: MetLife, Bupa, Consorcio" value={seguroComplementario} onChange={(e) => setSeguroComplementario(e.target.value)} />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold">
            {loading ? "Registrando..." : "Crear Ficha de Paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
