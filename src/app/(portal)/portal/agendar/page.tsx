"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Validar RUT
function validarRut(rut: string): boolean {
  const cleanRut = rut.replace(/[^0-9kK]/g, "");
  if (cleanRut.length < 2) return false;
  const cuerpo = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toLowerCase();
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const dvr = 11 - (suma % 11);
  const dvEsperado = dvr === 11 ? "0" : dvr === 10 ? "k" : String(dvr);
  return dv === dvEsperado;
}



export default function PortalAgendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Data states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState<string[]>([]);
  
  // Selection states
  const [especialidadId, setEspecialidadId] = useState("");
  const [profesionalId, setProfesionalId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hora, setHora] = useState("");
  
  // Patient states
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [primeraVez] = useState(false);
  const [comoEncontro] = useState("portal");
  const [comentario, setComentario] = useState("");

  // Status states
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [successData, setSuccessData] = useState<any | null>(null);

  // Cargar datos y prellenar con el usuario autenticado
  useEffect(() => {
    async function loadData() {
      try {
        const [espRes, profRes] = await Promise.all([
          fetch("/api/especialidades"),
          fetch("/api/profesionales")
        ]);
        if (espRes.ok && profRes.ok) {
          const espList = await espRes.json();
          const profList = await profRes.json();
          setEspecialidades(espList);
          setProfesionales(profList);
        }
      } catch (err) {
        console.error("Error loading wizard data", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setRut(user.rut || "");
      const nameParts = user.nombre.split(" ");
      setNombre(nameParts[0] || "");
      setApellido(nameParts.slice(1).join(" ") || "");
      setEmail(user.email || "");
      
      // Buscar teléfono si está en la sesión (opcional)
      const fetchTelefono = async () => {
        try {
          const res = await fetch(`/api/auth/profile?email=${user.email}`);
          if (res.ok) {
            const profile = await res.json();
            if (profile.telefono) setTelefono(profile.telefono);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchTelefono();
    }
  }, [user]);

  // Cargar slots
  useEffect(() => {
    if (!profesionalId || !selectedDate || !especialidadId) {
      setSlotsDisponibles([]);
      return;
    }
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const fechaStr = `${year}-${month}-${day}`;

    async function loadSlots() {
      setSlotsLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(
          `/api/disponibilidad?profesional_id=${profesionalId}&fecha=${fechaStr}&especialidad_id=${especialidadId}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlotsDisponibles(data.slots || []);
        } else {
          setSlotsDisponibles([]);
        }
      } catch (err) {
        console.error("Error loading slots", err);
        setSlotsDisponibles([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    loadSlots();
  }, [profesionalId, selectedDate, especialidadId]);

  const handleSelectEspecialidad = (id: string) => {
    setEspecialidadId(id);
    setHora("");
    const selectedEsp = especialidades.find((e) => e.id === id);
    if (selectedEsp && profesionalId) {
      const prof = profesionales.find((p) => p.id === profesionalId);
      if (prof && !prof.especialidades.includes(selectedEsp.slug)) {
        setProfesionalId("");
      }
    }
    setStep(2);
  };

  const selectedEspObj = especialidades.find((e) => e.id === especialidadId);
  const profesionalesFiltrados = selectedEspObj
    ? profesionales.filter((p) => p.especialidades.includes(selectedEspObj.slug))
    : [];

  const handleAdvanceToContact = () => {
    if (!especialidadId || !profesionalId || !selectedDate || !hora) {
      setErrorMsg("Por favor complete la selección de profesional, fecha y hora");
      return;
    }
    setErrorMsg("");
    setStep(3);
  };

  const handleAdvanceToSummary = () => {
    if (!rut || !nombre || !apellido || !email || !telefono) {
      setErrorMsg("Por favor complete todos los datos requeridos");
      return;
    }
    if (!validarRut(rut)) {
      setErrorMsg("El RUT ingresado no es válido (ej: 12345678-9)");
      return;
    }
    setErrorMsg("");
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setErrorMsg("");
    const year = selectedDate!.getFullYear();
    const month = String(selectedDate!.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate!.getDate()).padStart(2, "0");
    const fechaStr = `${year}-${month}-${day}`;

    try {
      const res = await fetch("/api/agendas/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidad_id: especialidadId,
          profesional_id: profesionalId,
          fecha: fechaStr,
          hora,
          paciente_rut: rut,
          paciente_nombre: nombre,
          paciente_apellido: apellido,
          paciente_email: email,
          paciente_telefono: telefono,
          primera_vez: primeraVez,
          como_encontro: comoEncontro,
          comentario,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al procesar el agendamiento");
      }
      setSuccessData(data);
      setStep(5);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexión al servidor";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const currentProfObj = profesionales.find((p) => p.id === profesionalId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          ⚠️ {errorMsg}
        </div>
      )}
      {step <= 4 && (
        <div className="flex justify-between items-center max-w-lg mx-auto border-b border-border pb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                  step === s
                    ? "bg-brand-turquoise text-brand-navy border-brand-turquoise"
                    : step > s
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "bg-white text-muted-foreground border-border"
                )}
              >
                {s}
              </div>
              <span className={cn("text-xs font-semibold hidden md:inline", step === s ? "text-brand-navy" : "text-muted-foreground")}>
                {s === 1 ? "Especialidad" : s === 2 ? "Fecha y Hora" : s === 3 ? "Tus Datos" : "Confirmación"}
              </span>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-white">Nueva Reserva Online</h2>
            <p className="text-muted-foreground text-xs">Escoge la especialidad para tu cita.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {especialidades.map((esp) => (
              <div
                key={esp.id}
                onClick={() => handleSelectEspecialidad(esp.id)}
                className="border border-border rounded-xl p-4 hover:border-brand-turquoise/60 hover:shadow bg-white dark:bg-slate-800 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-brand-navy dark:text-white">{esp.nombre}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{esp.descripcion}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Duración: {esp.duracion_minutos} min</span>
                  <span className="font-bold text-brand-navy dark:text-white">${esp.precio_base.toLocaleString("es-CL")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <Button variant="ghost" onClick={() => setStep(1)} size="sm">
              ← Especialidades
            </Button>
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white">{selectedEspObj?.nombre}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Profesional</label>
              <div className="space-y-2">
                {profesionalesFiltrados.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProfesionalId(p.id);
                      setHora("");
                    }}
                    className={cn(
                      "p-3 border rounded-xl cursor-pointer transition-all bg-white dark:bg-slate-800 flex items-center gap-3",
                      profesionalId === p.id ? "border-brand-turquoise bg-brand-turquoise/5" : "border-border"
                    )}
                  >
                    <div
                      className="size-3 rounded-full border flex items-center justify-center"
                      style={{ borderColor: p.color_agenda }}
                    >
                      {profesionalId === p.id && <div className="size-1.5 rounded-full" style={{ backgroundColor: p.color_agenda }} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-navy dark:text-white">Dr(a). {p.nombre} {p.apellido}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Fecha</label>
              <div className="border border-border rounded-xl bg-white dark:bg-slate-800 p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setHora("");
                  }}
                  disabled={(date) => {
                    const day = date.getDay();
                    const isWeekend = day === 0 || day === 6;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return isWeekend || date < today;
                  }}
                  className="rounded-md border-0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Módulo Horario</label>
              {!profesionalId || !selectedDate ? (
                <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground bg-white dark:bg-slate-800">
                  Seleccione profesional y fecha.
                </div>
              ) : slotsLoading ? (
                <div className="p-6 text-center text-xs text-brand-turquoise font-medium bg-white dark:bg-slate-800 border rounded-xl">
                  Calculando disponibilidad...
                </div>
              ) : slotsDisponibles.length === 0 ? (
                <div className="p-6 border border-dashed border-red-200 text-red-600 rounded-xl text-center text-xs bg-red-50/50">
                  Sin horas disponibles.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {slotsDisponibles.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setHora(slot)}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg border transition-all",
                        hora === slot ? "bg-brand-gold text-white border-brand-gold" : "bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {hora && (
                <div className="pt-2">
                  <Button onClick={handleAdvanceToContact} className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white text-xs">
                    Confirmar Horario ({hora} hrs) →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <Button variant="ghost" onClick={() => setStep(2)} size="sm">
              ← Volver
            </Button>
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white">Confirma tus Datos</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Nombre</label>
                <input type="text" disabled value={nombre} className="w-full border rounded-lg p-2.5 bg-slate-100 dark:bg-slate-700 text-muted-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Apellido</label>
                <input type="text" disabled value={apellido} className="w-full border rounded-lg p-2.5 bg-slate-100 dark:bg-slate-700 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">RUT</label>
                <input type="text" disabled value={rut} className="w-full border rounded-lg p-2.5 bg-slate-100 dark:bg-slate-700 text-muted-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Teléfono de contacto *</label>
                <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 1234 5678" className="w-full border rounded-lg p-2.5" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Motivo / Síntomas (Opcional)</label>
              <textarea
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Indique brevemente el motivo..."
                className="w-full border rounded-lg p-2.5 text-xs resize-none"
              />
            </div>
          </div>

          <Button onClick={handleAdvanceToSummary} className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white text-xs mt-3">
            Ver Resumen →
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <Button variant="ghost" onClick={() => setStep(3)} size="sm">
              ← Editar
            </Button>
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white">Resumen</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Prestación:</span>
                <span className="font-bold text-brand-navy dark:text-white">{selectedEspObj?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profesional:</span>
                <span className="font-bold text-brand-navy dark:text-white">Dr(a). {currentProfObj?.nombre} {currentProfObj?.apellido}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha y hora:</span>
                <span className="font-bold text-brand-navy dark:text-white">
                  {selectedDate?.toLocaleDateString("es-CL", { day: "numeric", month: "long" })} a las {hora} hrs
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-400">Copago Referencial:</span>
                <span className="font-bold text-brand-gold">${selectedEspObj?.precio_base.toLocaleString("es-CL")}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold text-xs mt-2"
          >
            {loading ? "Confirmando Cita..." : "Agendar y Confirmar Cita"}
          </Button>
        </div>
      )}

      {step === 5 && successData && (
        <div className="space-y-6 max-w-md mx-auto text-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-border shadow-xl">
          <div className="size-12 bg-brand-turquoise/20 rounded-full flex items-center justify-center text-xl text-brand-navy mx-auto">
            ✓
          </div>
          <h2 className="font-heading text-xl font-bold text-brand-navy dark:text-white">¡Cita Agendada!</h2>
          <p className="text-muted-foreground text-xs">Hemos enviado el comprobante a tu email.</p>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl text-left text-xs space-y-1.5">
            <div>• Profesional: Dr(a). {currentProfObj?.nombre} {currentProfObj?.apellido}</div>
            <div>• Fecha: {successData.fecha}</div>
            <div>• Hora: {successData.hora} hrs</div>
            <div>• Ubicación: Av. Kennedy 7100, Of. 706, Vitacura</div>
          </div>
          <Button onClick={() => router.push("/portal/dashboard")} className="w-full bg-brand-navy text-white text-xs">
            Ir a mi Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
