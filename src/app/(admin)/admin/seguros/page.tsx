"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Paciente {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  prevision: string | null;
}

export default function AdminSegurosPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isRecepcionista = user?.role === "recepcionista";
  
  const initialPacienteId = searchParams.get("paciente_id");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteId, setPacienteId] = useState(initialPacienteId || "");
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Form Fields
  const [trataRealizado, setTrataRealizado] = useState("Tratamiento de Operatoria Dental");
  const [montoTotal, setMontoTotal] = useState("45000");
  const [diagnostico, setDiagnostico] = useState("Caries dentinaria profunda en piezas 4 y 5");
  const [clinicaNombre, setClinicaNombre] = useState("Clínica Dental Quantum");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    const fetchPacientes = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/pacientes");
        if (res.ok) {
          const d = await res.json();
          setPacientes(d.pacientes || []);
          if (initialPacienteId) {
            const found = (d.pacientes || []).find((p: Paciente) => p.id === initialPacienteId);
            if (found) setSelectedPaciente(found);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, [initialPacienteId]);

  const handlePacienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPacienteId(val);
    setPdfUrl("");
    const found = pacientes.find((p) => p.id === val) || null;
    setSelectedPaciente(found);
  };

  const handleGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecepcionista) {
      alert("Acceso denegado: Únicamente Dentistas y Administradores pueden generar o modificar formularios de reembolso.");
      return;
    }
    if (!pacienteId) {
      alert("Por favor seleccione un paciente.");
      return;
    }

    setGenerating(true);
    setPdfUrl("");
    try {
      const res = await fetch("/api/seguros/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: pacienteId,
          profesional_id: user?.id || "s-1",
          datos_formulario: {
            tratamiento_realizado: trataRealizado,
            monto_total: montoTotal,
            diagnostico: diagnostico,
            clinica_nombre: clinicaNombre,
          },
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setPdfUrl(d.formulario.pdf_generado_url);
        alert("Formulario prellenado generado con éxito.");
      } else {
        alert("Error al generar el formulario.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Formularios de Reembolso Dental</h1>
          <p className="text-muted-foreground text-sm">Prellena y compila solicitudes de seguros complementarios.</p>
        </div>
        {isRecepcionista && (
          <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded border border-amber-200 font-semibold">
            Modo Consulta (Solo Lectura)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Form: Filling fields */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-brand-navy border-b pb-2 text-sm">
            Paso 1: Datos de la Solicitud
          </h3>

          <form onSubmit={handleGeneratePDF} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Seleccione el Paciente
              </label>
              {loading ? (
                <div className="text-xs text-muted-foreground">Cargando pacientes...</div>
              ) : (
                <select
                  value={pacienteId}
                  onChange={handlePacienteChange}
                  className="w-full border rounded p-2 text-xs bg-white focus:outline-none focus:border-brand-turquoise"
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} ({p.rut})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedPaciente && (
              <div className="bg-slate-50 p-4 rounded-lg border text-xs space-y-1.5 text-slate-600">
                <div className="font-bold text-brand-navy">Campos que se prellenarán automáticamente:</div>
                <div>• Nombre Paciente: <span className="font-semibold text-slate-700">{selectedPaciente.nombre} {selectedPaciente.apellido}</span></div>
                <div>• RUT Paciente: <span className="font-semibold text-slate-700">{selectedPaciente.rut}</span></div>
                <div>• Previsión: <span className="font-semibold text-slate-700">{selectedPaciente.prevision || "Particular"}</span></div>
                <div>• Email: <span className="font-semibold text-slate-700">{selectedPaciente.email || "No registrado"}</span></div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Diagnóstico Clínico
              </label>
              <Input
                required
                disabled={isRecepcionista}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Detalle diagnóstico clínico..."
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Tratamiento Clínico Realizado
              </label>
              <Input
                required
                disabled={isRecepcionista}
                value={trataRealizado}
                onChange={(e) => setTrataRealizado(e.target.value)}
                placeholder="Ej: Obturaciones estéticas composite en piezas..."
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Costo / Monto Total del Tratamiento ($)
              </label>
              <Input
                type="number"
                required
                disabled={isRecepcionista}
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Nombre de la Clínica
              </label>
              <Input
                required
                disabled={isRecepcionista}
                value={clinicaNombre}
                onChange={(e) => setClinicaNombre(e.target.value)}
                className="text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={generating || !pacienteId || isRecepcionista}
              className="w-full bg-brand-gold text-white font-semibold text-xs py-3 h-10 mt-2"
            >
              {isRecepcionista
                ? "Modo Consulta (Solo Lectura)"
                : (generating ? "Procesando y Prefirmando PDF..." : "Generar Formulario Prellenado")
              }
            </Button>
          </form>

          {pdfUrl && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs space-y-2 mt-4">
              <div className="font-bold">✓ Formulario de seguro generado con éxito</div>
              <p>Puedes descargar el PDF completo y firmado para enviarlo al paciente o a su aseguradora.</p>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9">
                  📥 Descargar Formulario PDF
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Right Preview Panel: PDF template representation */}
        <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[450px]">
          <h3 className="font-heading font-bold text-slate-500 text-sm mb-4">Vista Previa del Documento</h3>
          
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[500px] border border-slate-300 rounded shadow-sm bg-white"
            />
          ) : (
            <div className="text-center space-y-2 text-slate-400">
              <div className="text-5xl">📄</div>
              <p className="text-xs max-w-xs mx-auto">
                Seleccione un paciente y haga clic en &quot;Generar&quot; para ver y descargar el formulario completo prellenado en esta sección.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
