"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

// Normalizar RUT
function normalizarRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return rut;
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1).toLowerCase();
  return `${cuerpo}-${dv}`;
}

export default function AgendarWizardPage() {
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
  const [primeraVez, setPrimeraVez] = useState(true);
  const [comoEncontro, setComoEncontro] = useState("");
  const [comentario, setComentario] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [successData, setSuccessData] = useState<any | null>(null);

  // Cargar especialidades y profesionales
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

    // Recuperar datos de sessionStorage si existen
    const savedRut = sessionStorage.getItem("dq_rut");
    const savedNombre = sessionStorage.getItem("dq_nombre");
    const savedApellido = sessionStorage.getItem("dq_apellido");
    const savedEmail = sessionStorage.getItem("dq_email");
    const savedTelefono = sessionStorage.getItem("dq_telefono");

    if (savedRut) setRut(savedRut);
    if (savedNombre) setNombre(savedNombre);
    if (savedApellido) setApellido(savedApellido);
    if (savedEmail) setEmail(savedEmail);
    if (savedTelefono) setTelefono(savedTelefono);
  }, []);

  // Cargar slots cuando cambie profesional, fecha o especialidad
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

  // Manejar selección de especialidad
  const handleSelectEspecialidad = (id: string) => {
    setEspecialidadId(id);
    setHora("");
    // Si el profesional seleccionado previamente no atiende esta especialidad, limpiarlo
    const selectedEsp = especialidades.find((e) => e.id === id);
    if (selectedEsp && profesionalId) {
      const prof = profesionales.find((p) => p.id === profesionalId);
      if (prof && !prof.especialidades.includes(selectedEsp.slug)) {
        setProfesionalId("");
      }
    }
    setStep(2);
  };

  // Filtrar profesionales por especialidad seleccionada
  const selectedEspObj = especialidades.find((e) => e.id === especialidadId);
  const profesionalesFiltrados = selectedEspObj
    ? profesionales.filter((p) => p.especialidades.includes(selectedEspObj.slug))
    : [];

  // Ir a paso de datos de contacto
  const handleAdvanceToContact = () => {
    if (!especialidadId || !profesionalId || !selectedDate || !hora) {
      setErrorMsg("Por favor complete la selección de profesional, fecha y hora");
      return;
    }
    setErrorMsg("");
    setStep(3);
  };

  // Validar datos de contacto y pasar al resumen
  const handleAdvanceToSummary = () => {
    if (!rut || !nombre || !apellido || !email || !telefono) {
      setErrorMsg("Por favor complete todos los datos requeridos");
      return;
    }
    if (!validarRut(rut)) {
      setErrorMsg("El RUT ingresado no es válido (ej: 12345678-9)");
      return;
    }
    if (!aceptaTerminos) {
      setErrorMsg("Debe aceptar los términos de la política de privacidad");
      return;
    }

    setErrorMsg("");
    
    // Guardar en sessionStorage para agilizar reservas futuras
    sessionStorage.setItem("dq_rut", rut);
    sessionStorage.setItem("dq_nombre", nombre);
    sessionStorage.setItem("dq_apellido", apellido);
    sessionStorage.setItem("dq_email", email);
    sessionStorage.setItem("dq_telefono", telefono);

    setStep(4);
  };

  // Procesar reserva final
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
      setStep(5); // Pantalla de éxito
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexión al servidor";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const currentProfObj = profesionales.find((p) => p.id === profesionalId);

  return (
    <div className="py-12 container mx-auto px-4 max-w-4xl space-y-8">
      {/* Wizard Progress Indicator */}
      {step <= 4 && (
        <div className="flex justify-between items-center max-w-lg mx-auto border-b border-border pb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                  step === s
                    ? "bg-brand-turquoise text-brand-navy border-brand-turquoise"
                    : step > s
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "bg-white text-muted-foreground border-border"
                )}
              >
                {s}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold hidden md:inline",
                  step === s ? "text-brand-navy font-bold" : "text-muted-foreground"
                )}
              >
                {s === 1
                  ? "Especialidad"
                  : s === 2
                  ? "Fecha y Hora"
                  : s === 3
                  ? "Tus Datos"
                  : "Confirmación"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: SELECT SPECIALTY */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-2xl font-bold text-brand-navy">Selecciona la Especialidad</h2>
            <p className="text-muted-foreground text-sm">Escoge el tipo de tratamiento que requieres iniciar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {especialidades.map((esp) => (
              <div
                key={esp.id}
                onClick={() => handleSelectEspecialidad(esp.id)}
                className="border border-border rounded-xl p-5 hover:border-brand-turquoise/60 hover:shadow-md cursor-pointer transition-all bg-white flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-brand-navy">{esp.nombre}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {esp.descripcion || "Consulta especializada en la clínica."}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Duración: {esp.duracion_minutos || 30} min</span>
                  <span className="font-bold text-brand-navy">${esp.precio_base.toLocaleString("es-CL")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PROF & DATE & TIME */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <Button variant="ghost" onClick={() => setStep(1)} size="sm">
              ← Cambiar Especialidad ({selectedEspObj?.nombre})
            </Button>
            <h2 className="font-heading text-xl font-bold text-brand-navy">Fecha y Profesional</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Select Professional */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                Profesional Clínico
              </label>
              <div className="space-y-2">
                {profesionalesFiltrados.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProfesionalId(p.id);
                      setHora("");
                    }}
                    className={cn(
                      "p-4 border rounded-xl cursor-pointer transition-all bg-white flex items-center gap-3",
                      profesionalId === p.id
                        ? "border-brand-turquoise bg-brand-turquoise/5"
                        : "border-border hover:border-slate-300"
                    )}
                  >
                    <div
                      className="size-4 rounded-full border flex items-center justify-center"
                      style={{ borderColor: p.color_agenda || "#0B1F3A" }}
                    >
                      {profesionalId === p.id && (
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: p.color_agenda || "#0B1F3A" }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-brand-navy">
                        Dr/Dra. {p.nombre} {p.apellido}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Especialista Acreditado</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Date Selector */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                Selecciona la Fecha
              </label>
              <div className="border border-border rounded-xl bg-white p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setHora("");
                  }}
                  disabled={(date) => {
                    // Deshabilitar fines de semana y días pasados
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

            {/* Column 3: Slots Selector */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                Módulos Disponibles
              </label>
              
              {!profesionalId || !selectedDate ? (
                <div className="p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground bg-white">
                  Seleccione un odontólogo y una fecha para calcular horas disponibles.
                </div>
              ) : slotsLoading ? (
                <div className="p-8 text-center text-xs text-brand-turquoise font-medium bg-white border border-border rounded-xl">
                  Calculando disponibilidad...
                </div>
              ) : slotsDisponibles.length === 0 ? (
                <div className="p-8 border border-dashed border-red-200 text-red-600 rounded-xl text-center text-xs bg-red-50/50">
                  Sin horas disponibles para la fecha seleccionada. Pruebe otro día.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto pr-1">
                  {slotsDisponibles.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setHora(slot)}
                      className={cn(
                        "py-2.5 text-xs font-bold rounded-lg border transition-all",
                        hora === slot
                          ? "bg-brand-gold text-white border-brand-gold shadow-md"
                          : "bg-white border-border hover:border-slate-300 text-brand-navy"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {hora && (
                <div className="pt-4">
                  <Button
                    onClick={handleAdvanceToContact}
                    className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold shadow-md py-3 rounded-lg"
                  >
                    Confirmar Horario ({hora} hrs) →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONTACT FORM */}
      {step === 3 && (
        <div className="space-y-6 max-w-xl mx-auto bg-white p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <Button variant="ghost" onClick={() => setStep(2)} size="sm">
              ← Volver
            </Button>
            <h2 className="font-heading text-xl font-bold text-brand-navy">Datos de Contacto</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">RUT Paciente *</label>
              <input
                type="text"
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej: 12.345.678-9 o 12345678-9"
                className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
              />
              <span className="text-[10px] text-muted-foreground block mt-0.5">Sin puntos, con guión y dígito verificador.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María Paz"
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej: Echeverría"
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: maria@correo.com"
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Teléfono Móvil *</label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +56 9 1234 5678"
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50"
                />
              </div>
            </div>

            <div className="flex gap-4 items-center py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">¿Primera vez en la clínica?</span>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={primeraVez === true} onChange={() => setPrimeraVez(true)} /> Sí
                </label>
                <label className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={primeraVez === false} onChange={() => setPrimeraVez(false)} /> No
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">¿Cómo nos encontró?</label>
              <select
                value={comoEncontro}
                onChange={(e) => setComoEncontro(e.target.value)}
                className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50 bg-white"
              >
                <option value="">Seleccione una opción</option>
                <option value="google">Búsqueda en Google</option>
                <option value="redes">Redes Sociales (Instagram/Facebook)</option>
                <option value="recomendacion">Recomendado por un amigo/familiar</option>
                <option value="convenio">Seguro / Convenio corporativo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Motivo de consulta / Comentario</label>
              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Detalle algún síntoma o requerimiento especial..."
                className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-slate-50 resize-none"
              />
            </div>

            {/* Checkbox Ley 19.628 */}
            <div className="flex items-start gap-2.5 py-2">
              <input
                id="terms"
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-relaxed cursor-pointer select-none">
                Acepto la política de privacidad de Clínica Dental Quantum. Declaro estar en conocimiento de que mis datos de salud serán protegidos en estricta conformidad con la Ley 19.628 sobre Protección de la Vida Privada en Chile.
              </label>
            </div>
          </div>

          <Button
            onClick={handleAdvanceToSummary}
            className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md py-3 rounded-lg mt-4"
          >
            Revisar Resumen de Cita →
          </Button>
        </div>
      )}

      {/* STEP 4: SUMMARY & CONFIRM */}
      {step === 4 && (
        <div className="space-y-6 max-w-lg mx-auto bg-white p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <Button variant="ghost" onClick={() => setStep(3)} size="sm">
              ← Editar Datos
            </Button>
            <h2 className="font-heading text-xl font-bold text-brand-navy">Confirmar tu Reserva</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase text-brand-turquoise tracking-wider">Detalles de la Cita</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-slate-400">Tratamiento</span>
                <span className="col-span-2 font-bold text-brand-navy">{selectedEspObj?.nombre}</span>
                
                <span className="font-medium text-slate-400">Dentista</span>
                <span className="col-span-2 font-bold text-brand-navy">Dr/Dra. {currentProfObj?.nombre} {currentProfObj?.apellido}</span>

                <span className="font-medium text-slate-400">Fecha</span>
                <span className="col-span-2 font-bold text-brand-navy">
                  {selectedDate?.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                </span>

                <span className="font-medium text-slate-400">Hora</span>
                <span className="col-span-2 font-bold text-brand-navy">{hora} hrs</span>

                <span className="font-medium text-slate-400">Arancel Estimado</span>
                <span className="col-span-2 font-bold text-brand-gold">
                  ${selectedEspObj?.precio_base.toLocaleString("es-CL")}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase text-brand-turquoise tracking-wider">Paciente</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-slate-400">RUT</span>
                <span className="col-span-2 font-semibold text-brand-navy">{normalizarRut(rut)}</span>

                <span className="font-medium text-slate-400">Nombre</span>
                <span className="col-span-2 font-semibold text-brand-navy">{nombre} {apellido}</span>

                <span className="font-medium text-slate-400">Email</span>
                <span className="col-span-2 font-semibold text-brand-navy">{email}</span>

                <span className="font-medium text-slate-400">Fono</span>
                <span className="col-span-2 font-semibold text-brand-navy">{telefono}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md py-3 rounded-lg mt-4 h-12"
          >
            {loading ? "Reservando tu Hora..." : "¡Confirmar Reserva!"}
          </Button>
        </div>
      )}

      {/* STEP 5: SUCCESS SCREEN */}
      {step === 5 && successData && (
        <div className="space-y-6 max-w-md mx-auto text-center bg-white p-8 rounded-2xl border border-border shadow-xl">
          <div className="size-16 bg-brand-turquoise/20 rounded-full flex items-center justify-center text-3xl text-brand-navy mx-auto">
            ✓
          </div>
          
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-brand-navy">¡Cita Reservada Exitosamente!</h2>
            <p className="text-muted-foreground text-sm">Su hora ha quedado registrada. Le enviamos un correo con los detalles.</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-left space-y-2 text-xs md:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Paciente</span>
              <span className="font-bold text-brand-navy">{nombre} {apellido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Fecha</span>
              <span className="font-bold text-brand-navy">{successData.fecha}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Hora</span>
              <span className="font-bold text-brand-navy">{successData.hora} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Ubicación</span>
              <span className="font-bold text-brand-navy">Av. Kennedy 7100, Of. 706</span>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs leading-relaxed text-left border-l-4 border-brand-gold">
            <strong>Importante:</strong> Si necesita reprogramar o cancelar su hora, por favor contáctenos con al menos 24 horas de anticipación llamando al <strong>(56-2) 2953 9291</strong>.
          </div>

          <div className="pt-2 flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">Volver al Inicio</Button>
            </Link>
            <Button
              onClick={() => {
                // Generar archivo .ics básico para el calendario del usuario
                const year = selectedDate!.getFullYear();
                const month = String(selectedDate!.getMonth() + 1).padStart(2, "0");
                const day = String(selectedDate!.getDate()).padStart(2, "0");
                const [h, m] = hora.split(":");
                const start = `${year}${month}${day}T${h}${m}00`;
                const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Cita Clínica Quantum (${selectedEspObj?.nombre})\nDTSTART:${start}\nDURATION:PT60M\nLOCATION:Av. Kennedy 7100 Of. 706 Vitacura\nDESCRIPTION:Cita dental con Dr/Dra. ${currentProfObj?.apellido}\nEND:VEVENT\nEND:VCALENDAR`;
                const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "cita_quantum.ics";
                a.click();
              }}
              className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white"
            >
              Añadir a Calendario
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
