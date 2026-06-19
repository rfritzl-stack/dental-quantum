"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FichaData {
  paciente: {
    id: string;
    rut: string;
    nombre: string;
    apellido: string;
    email: string | null;
    telefono: string | null;
    fecha_nacimiento: string | null;
    direccion: string | null;
    prevision: string | null;
    seguro_complementario: string | null;
    notas_generales: string | null;
    activo: boolean;
  };
  citas: {
    id: string;
    fecha_hora_inicio: string;
    estado: string;
    especialidad: { nombre: string };
    profesional: { nombre: string; apellido: string };
  }[];
  tratamientos: {
    id: string;
    nombre_tratamiento: string;
    descripcion: string | null;
    estado: string;
    sesiones_estimadas: number;
    sesiones_realizadas: number;
    costo_total: number;
    fecha_inicio: string | null;
    profesional: { nombre: string; apellido: string };
    especialidad: { nombre: string };
    sesiones: { id: string; numero_sesion: number; notas_clinicas: string | null; fecha_registro: string }[];
  }[];
  archivos: {
    id: string;
    tipo: string;
    url_storage: string;
    nombre_archivo: string;
    descripcion: string | null;
    fecha_subida: string;
    profesional: { nombre: string; apellido: string };
  }[];
  cobros: {
    id: string;
    concepto: string;
    monto: number;
    metodo_pago: string;
    estado: string;
    folio_boleta: string | null;
    fecha_emision: string | null;
  }[];
  formularios: {
    id: string;
    pdf_generado_url: string | null;
    estado: string;
    creado_en: string;
    formulario: { nombre_formulario: string; aseguradora: string };
  }[];
}

export default function AdminPacienteFichaPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [data, setData] = useState<FichaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Datos
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [prevision, setPrevision] = useState("");
  const [seguroComplementario, setSeguroComplementario] = useState("");
  const [notasGenerales, setNotasGenerales] = useState("");
  const [updating, setUpdating] = useState(false);

  // New Cita
  const [especialidades, setEspecialidades] = useState<{ id: string; nombre: string }[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [espSel, setEspSel] = useState("");
  const [profSel, setProfSel] = useState("");
  const [fechaSel, setFechaSel] = useState("");
  const [horaSel, setHoraSel] = useState("");
  const [slotsDisp, setSlotsDisp] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // New Treatment (Only Dentist/Admin)
  const [treatName, setTreatName] = useState("");
  const [treatDesc, setTreatDesc] = useState("");
  const [treatEsp, setTreatEsp] = useState("");
  const [treatProf, setTreatProf] = useState("");
  const [treatSessions, setTreatSessions] = useState(1);
  const [treatCost, setTreatCost] = useState(100000);
  const [treatLoading, setTreatLoading] = useState(false);

  // Log Session (Only Dentist/Admin)
  const [selTreatForSession, setSelTreatForSession] = useState("");
  const [sessNum, setSessNum] = useState(1);
  const [sessNotes, setSessNotes] = useState("");
  const [sessAction, setSessAction] = useState("");
  const [sessLoading, setSessLoading] = useState(false);

  // File Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("radiografia");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Record Payment
  const [payConcept, setPayConcept] = useState("");
  const [payAmount, setPayAmount] = useState(30000);
  const [payMethod, setPayMethod] = useState("pos_fisico");
  const [posAuth, setPosAuth] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState<Record<string, boolean>>({});

  // Consent Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [consentType, setConsentType] = useState("Consentimiento para Operatoria");
  const [consentLoading, setConsentLoading] = useState(false);

  const fetchFicha = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pacientes/${id}/ficha`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        // Pre-fill edit inputs
        setNombre(d.paciente.nombre);
        setApellido(d.paciente.apellido);
        setEmail(d.paciente.email || "");
        setTelefono(d.paciente.telefono || "");
        setPrevision(d.paciente.prevision || "");
        setSeguroComplementario(d.paciente.seguro_complementario || "");
        setNotasGenerales(d.paciente.notas_generales || "");
      } else {
        setErrorMsg("Error al cargar la ficha clínica.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFicha();
    
    // Load specialties & professionals for selection
    const loadSelectData = async () => {
      try {
        const [espRes, profRes] = await Promise.all([
          fetch("/api/especialidades"),
          fetch("/api/profesionales")
        ]);
        if (espRes.ok && profRes.ok) {
          setEspecialidades(await espRes.json());
          setProfesionales(await profRes.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSelectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load slots for new booking
  useEffect(() => {
    if (!profSel || !fechaSel || !espSel) {
      setSlotsDisp([]);
      return;
    }
    const fetchSlots = async () => {
      try {
        const res = await fetch(
          `/api/disponibilidad?profesional_id=${profSel}&fecha=${fechaSel}&especialidad_id=${espSel}`
        );
        if (res.ok) {
          const d = await res.json();
          setSlotsDisp(d.slots || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSlots();
  }, [profSel, fechaSel, espSel]);

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono,
          prevision,
          seguro_complementario: seguroComplementario,
          notas_generales: notasGenerales,
        }),
      });
      if (res.ok) {
        alert("Datos de paciente actualizados.");
        fetchFicha();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!espSel || !profSel || !fechaSel || !horaSel) {
      alert("Complete todos los campos para agendar.");
      return;
    }
    setBookingLoading(true);
    try {
      const res = await fetch("/api/agendas/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidad_id: espSel,
          profesional_id: profSel,
          fecha: fechaSel,
          hora: horaSel,
          paciente_rut: data?.paciente.rut,
          paciente_nombre: data?.paciente.nombre,
          paciente_apellido: data?.paciente.apellido,
          paciente_email: data?.paciente.email,
          paciente_telefono: data?.paciente.telefono,
          primera_vez: false,
        }),
      });
      if (res.ok) {
        alert("Cita agendada con éxito.");
        fetchFicha();
        setEspSel("");
        setProfSel("");
        setFechaSel("");
        setHoraSel("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCreateTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === "recepcionista") {
      alert("Acceso denegado: Únicamente Dentistas y Administradores pueden crear planes de tratamiento.");
      return;
    }
    setTreatLoading(true);
    try {
      const res = await fetch("/api/tratamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: id,
          profesional_id: treatProf,
          especialidad_id: treatEsp,
          nombre_tratamiento: treatName,
          descripcion: treatDesc,
          sesiones_estimadas: treatSessions,
          costo_total: treatCost,
        }),
      });
      if (res.ok) {
        alert("Plan de tratamiento creado.");
        fetchFicha();
        setTreatName("");
        setTreatDesc("");
        setTreatProf("");
        setTreatEsp("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTreatLoading(false);
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === "recepcionista") {
      alert("Acceso denegado: Únicamente Dentistas y Administradores pueden registrar notas clínicas.");
      return;
    }
    setSessLoading(true);
    try {
      const res = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tratamiento_id: selTreatForSession,
          numero_sesion: sessNum,
          notas_clinicas: sessNotes,
          proxima_accion: sessAction,
        }),
      });
      if (res.ok) {
        alert("Sesión clínica registrada.");
        fetchFicha();
        setSessNotes("");
        setSessAction("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSessLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("paciente_id", id as string);
      fd.append("profesional_id", user?.id || "");
      fd.append("tipo", uploadType);
      fd.append("descripcion", uploadDesc);

      const res = await fetch("/api/archivos", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        alert("Archivo clínico subido con éxito.");
        fetchFicha();
        setUploadFile(null);
        setUploadDesc("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      const res = await fetch("/api/cobros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: id,
          concepto: payConcept,
          monto: payAmount,
          metodo_pago: payMethod,
          estado: "pagado",
          datos_pos: payMethod === "pos_fisico" ? { autorizacion: posAuth } : null,
        }),
      });
      if (res.ok) {
        alert("Pago registrado.");
        fetchFicha();
        setPayConcept("");
        setPosAuth("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPayLoading(false);
    }
  };

  const handleEmitBoleta = async (cobroId: string) => {
    setBillingLoading(prev => ({ ...prev, [cobroId]: true }));
    try {
      const res = await fetch("/api/boletas/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cobroId }),
      });
      if (res.ok) {
        alert("Boleta electrónica emitida con éxito.");
        fetchFicha();
      } else {
        alert("Error al emitir boleta en el SII.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBillingLoading(prev => ({ ...prev, [cobroId]: false }));
    }
  };

  // Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveConsent = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL("image/png");

    setConsentLoading(true);
    try {
      const res = await fetch("/api/consentimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: id,
          profesional_id: user?.id || "",
          firma_png: signatureDataUrl,
          tipo_consentimiento: consentType,
        }),
      });

      if (res.ok) {
        alert("Consentimiento firmado y guardado con éxito.");
        clearCanvas();
        fetchFicha();
      } else {
        alert("Error al generar consentimiento.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConsentLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-sm text-muted-foreground">Cargando ficha...</div>;
  if (errorMsg || !data) return <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">{errorMsg || "Ficha no disponible."}</div>;

  const totalCobrado = data.cobros.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-brand-navy">
              Ficha Clínica: {data.paciente.nombre} {data.paciente.apellido}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">{data.paciente.rut}</span>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Registros clínicos y facturación.</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/admin/pacientes")} size="sm">
          ← Volver a Pacientes
        </Button>
      </div>

      <Tabs defaultValue="datos" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="datos" className="text-xs">Datos Personales</TabsTrigger>
          <TabsTrigger value="citas" className="text-xs">Agenda y Citas</TabsTrigger>
          <TabsTrigger value="tratamientos" className="text-xs">Tratamientos y Notas</TabsTrigger>
          <TabsTrigger value="archivos" className="text-xs">Visores y Archivos</TabsTrigger>
          <TabsTrigger value="cobros" className="text-xs">Cobros y SII</TabsTrigger>
          <TabsTrigger value="seguros" className="text-xs">Seguros Complementarios</TabsTrigger>
          <TabsTrigger value="consentimiento" className="text-xs">Firma Consentimiento</TabsTrigger>
        </TabsList>

        {/* TAB 1: DATOS PERSONALES */}
        <TabsContent value="datos" className="space-y-4">
          <form onSubmit={handleUpdatePatient} className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Información del Paciente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Nombres</label>
                <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Apellidos</label>
                <Input required value={apellido} onChange={(e) => setApellido(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Teléfono</label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Previsión</label>
                <Input value={prevision} onChange={(e) => setPrevision(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Seguro Complementario</label>
                <Input value={seguroComplementario} onChange={(e) => setSeguroComplementario(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Notas Clínicas Generales (Alergias, Fármacos)</label>
              <textarea
                rows={3}
                value={notasGenerales}
                onChange={(e) => setNotasGenerales(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-xs resize-none"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={updating} className="bg-brand-gold text-white font-semibold">
                {updating ? "Guardando..." : "Actualizar Ficha"}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TAB 2: CITAS Y AGENDA */}
        <TabsContent value="citas" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Historial de Horas Reservadas</h3>
            {data.citas.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay registros de citas.</p>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-3">Fecha y Hora</th>
                      <th className="p-3">Especialidad</th>
                      <th className="p-3">Profesional</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-600">
                    {data.citas.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-semibold">{new Date(c.fecha_hora_inicio).toLocaleString("es-CL")}</td>
                        <td className="p-3">{c.especialidad.nombre}</td>
                        <td className="p-3">Dr(a). {c.profesional.nombre} {c.profesional.apellido}</td>
                        <td className="p-3 uppercase font-bold text-[10px]">{c.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateBooking} className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-3">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Agendar Nueva Hora</h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Especialidad</label>
              <select value={espSel} onChange={(e) => setEspSel(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white">
                <option value="">Seleccione</option>
                {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Profesional</label>
              <select value={profSel} onChange={(e) => setProfSel(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white">
                <option value="">Seleccione</option>
                {profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Fecha</label>
              <Input type="date" value={fechaSel} onChange={(e) => setFechaSel(e.target.value)} />
            </div>
            {slotsDisp.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Hora</label>
                <select value={horaSel} onChange={(e) => setHoraSel(e.target.value)} className="w-full border rounded-lg p-2 text-xs bg-white">
                  <option value="">Seleccione hora</option>
                  {slotsDisp.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="pt-2">
              <Button type="submit" disabled={bookingLoading} className="w-full bg-brand-gold text-white font-semibold text-xs">
                {bookingLoading ? "Guardando..." : "Registrar Reserva"}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TAB 3: TRATAMIENTOS Y NOTAS */}
        <TabsContent value="tratamientos" className="space-y-6">
          {/* Restricción visual de Recepcionista */}
          {user?.role === "recepcionista" && (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs border border-amber-200">
              ℹ️ Estás visualizando la ficha como <strong>Recepcionista (Solo Lectura)</strong>. Únicamente los Dentistas y Administradores pueden crear tratamientos o registrar evoluciones clínicas.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Planes de Tratamiento Activos</h3>
              {data.tratamientos.length === 0 ? (
                <p className="text-xs text-muted-foreground">No registra tratamientos.</p>
              ) : (
                <div className="space-y-4">
                  {data.tratamientos.map((t) => (
                    <div key={t.id} className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-3">
                      <div className="flex justify-between items-start border-b pb-2">
                        <div>
                          <h4 className="font-heading font-bold text-brand-navy">{t.nombre_tratamiento}</h4>
                          <p className="text-[11px] text-muted-foreground">{t.descripcion}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-turquoise/15 text-brand-turquoise uppercase">
                          {t.estado}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                        <div>Copago Total: <span className="font-bold text-slate-700">${t.costo_total.toLocaleString()}</span></div>
                        <div>Sesiones: <span className="font-bold text-slate-700">{t.sesiones_realizadas} / {t.sesiones_estimadas}</span></div>
                      </div>

                      {/* Sesiones logged */}
                      <div className="pt-2">
                        <h5 className="font-bold text-[11px] uppercase text-brand-navy tracking-wider mb-2">Evoluciones Clínicas</h5>
                        {t.sesiones.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground italic">Ninguna sesión registrada aún.</p>
                        ) : (
                          <div className="space-y-2 border-l-2 pl-3 text-xs">
                            {t.sesiones.map((s) => (
                              <div key={s.id}>
                                <div className="font-bold text-brand-navy">Sesión #{s.numero_sesion} — {new Date(s.fecha_registro).toLocaleDateString()}</div>
                                <p className="text-slate-600 italic">&quot;{s.notas_clinicas}&quot;</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Forms to add Treatments and Sessions (Only Dentistas/Admins) */}
            {user?.role !== "recepcionista" && (
              <div className="space-y-6">
                {/* Crear Tratamiento */}
                <form onSubmit={handleCreateTreatment} className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-3">
                  <h3 className="font-heading font-bold text-brand-navy border-b pb-2 text-sm">Nuevo Plan de Tratamiento</h3>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</label>
                    <Input required placeholder="Ej: Implantes maxilares" value={treatName} onChange={(e) => setTreatName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción</label>
                    <textarea rows={2} placeholder="Detalles del plan..." value={treatDesc} onChange={(e) => setTreatDesc(e.target.value)} className="w-full border rounded p-2 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Especialidad</label>
                    <select value={treatEsp} onChange={(e) => setTreatEsp(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white">
                      <option value="">Seleccione</option>
                      {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Odontólogo a cargo</label>
                    <select value={treatProf} onChange={(e) => setTreatProf(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white">
                      <option value="">Seleccione</option>
                      {profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Sesiones Est.</label>
                      <Input type="number" value={treatSessions} onChange={(e) => setTreatSessions(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Costo Total ($)</label>
                      <Input type="number" value={treatCost} onChange={(e) => setTreatCost(Number(e.target.value))} />
                    </div>
                  </div>
                  <Button type="submit" disabled={treatLoading} className="w-full bg-brand-gold text-white font-semibold text-xs mt-2">
                    Crear Plan
                  </Button>
                </form>

                {/* Registrar Evolución */}
                {data.tratamientos.length > 0 && (
                  <form onSubmit={handleLogSession} className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-3">
                    <h3 className="font-heading font-bold text-brand-navy border-b pb-2 text-sm">Registrar Evolución</h3>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Tratamiento</label>
                      <select value={selTreatForSession} onChange={(e) => setSelTreatForSession(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white">
                        <option value="">Seleccione plan</option>
                        {data.tratamientos.map((t) => <option key={t.id} value={t.id}>{t.nombre_tratamiento}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <label className="col-span-2 text-[10px] font-bold uppercase text-muted-foreground">N° Sesión</label>
                      <Input type="number" value={sessNum} onChange={(e) => setSessNum(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Notas Clínicas</label>
                      <textarea rows={3} placeholder="Notas del procedimiento..." value={sessNotes} onChange={(e) => setSessNotes(e.target.value)} className="w-full border rounded p-2 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Próxima Acción</label>
                      <Input placeholder="Ej: Control en 2 semanas" value={sessAction} onChange={(e) => setSessAction(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={sessLoading} className="w-full bg-brand-navy text-white text-xs mt-2">
                      Registrar Evolución
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: VISOR Y ARCHIVOS CLINICOS */}
        <TabsContent value="archivos" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Archivos del Paciente</h3>
            {data.archivos.length === 0 ? (
              <p className="text-xs text-muted-foreground">No registras archivos clínicos.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.archivos.map((arch) => (
                  <div key={arch.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-2xl">📁</span>
                      <h4 className="font-bold text-xs text-brand-navy mt-1 truncate">{arch.nombre_archivo}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{arch.descripcion}</p>
                      <div className="text-[9px] text-muted-foreground mt-2">
                        Subido por: Dr(a). {arch.profesional.nombre} {arch.profesional.apellido} • {new Date(arch.fecha_subida).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end border-t pt-2 mt-2">
                      <a href={arch.url_storage} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" className="text-[10px] px-2 py-0.5">Ver</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleFileUpload} className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-3">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Subir Archivo Clínico</h3>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Archivo</label>
              <Input type="file" required onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Tipo</label>
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white">
                <option value="radiografia">Radiografía</option>
                <option value="fotografia">Fotografía Clínica</option>
                <option value="consentimiento">Consentimiento Firmado</option>
                <option value="documento">Presupuesto / Documento</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Descripción</label>
              <Input placeholder="Ej: Control de mordida lateral" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} />
            </div>
            <Button type="submit" disabled={uploadLoading} className="w-full bg-brand-gold text-white font-semibold text-xs mt-2">
              {uploadLoading ? "Subiendo..." : "Subir Archivo"}
            </Button>
          </form>
        </TabsContent>

        {/* TAB 5: COBROS Y EMISION BOLETA SII */}
        <TabsContent value="cobros" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-heading font-bold text-brand-navy">Cobros y Caja</h3>
              <div className="text-xs font-bold bg-brand-turquoise/15 text-brand-turquoise px-3 py-1 rounded">
                Recaudación Total: ${totalCobrado.toLocaleString()}
              </div>
            </div>
            
            {data.cobros.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay registros de transacciones.</p>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Medio</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Boleta SII</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-600">
                    {data.cobros.map((cob) => (
                      <tr key={cob.id}>
                        <td className="p-3">
                          <div className="font-semibold">{cob.concepto}</div>
                          {cob.fecha_emision && <div className="text-[10px] text-muted-foreground">{new Date(cob.fecha_emision).toLocaleDateString()}</div>}
                        </td>
                        <td className="p-3 capitalize">{cob.metodo_pago.replace("_", " ")}</td>
                        <td className="p-3 font-semibold">${cob.monto.toLocaleString()}</td>
                        <td className="p-3">
                          {cob.folio_boleta ? (
                            <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              N° {cob.folio_boleta}
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded font-bold">Sin Emitir</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {cob.folio_boleta ? (
                            <a href={`/storage/boletas/boleta_${cob.folio_boleta}.pdf`} target="_blank" rel="noopener noreferrer">
                              <Button size="xs" variant="outline" className="text-[10px]">Descargar</Button>
                            </a>
                          ) : (
                            <Button
                              size="xs"
                              disabled={billingLoading[cob.id]}
                              onClick={() => handleEmitBoleta(cob.id)}
                              className="bg-brand-gold text-white text-[10px]"
                            >
                              {billingLoading[cob.id] ? "Emitiendo..." : "Emitir DTE"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <form onSubmit={handleRecordPayment} className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-3">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2 text-sm">Registrar Pago en Caja</h3>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Concepto</label>
              <Input required placeholder="Ej: Pago de ortodoncia mensual" value={payConcept} onChange={(e) => setPayConcept(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Monto Recibido ($)</label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Medio de Pago</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white">
                <option value="pos_fisico">POS Tarjeta Débito/Crédito</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="seguro">Seguro Médico Copago</option>
              </select>
            </div>
            {payMethod === "pos_fisico" && (
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Código Autorización Voucher</label>
                <Input required placeholder="Ej: 123456" value={posAuth} onChange={(e) => setPosAuth(e.target.value)} />
              </div>
            )}
            <Button type="submit" disabled={payLoading} className="w-full bg-brand-gold text-white font-semibold text-xs mt-2">
              {payLoading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </form>
        </TabsContent>

        {/* TAB 6: FORMULARIOS DE SEGUROS COMPLEMENTARIOS */}
        <TabsContent value="seguros" className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-heading font-bold text-brand-navy">Formularios de Reembolso Dental</h3>
              <Link href={`/admin/seguros?paciente_id=${id}`}>
                <Button className="bg-brand-gold text-white font-semibold text-xs">
                  Generar Formulario Prellenado
                </Button>
              </Link>
            </div>

            {data.formularios.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No registras formularios de reembolsos generados para este paciente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.formularios.map((form) => (
                  <div key={form.id} className="p-4 border rounded-xl flex justify-between items-center gap-4 bg-slate-50">
                    <div>
                      <h4 className="font-bold text-brand-navy text-xs">{form.formulario.nombre_formulario}</h4>
                      <div className="text-[10px] text-muted-foreground mt-1">Aseguradora: {form.formulario.aseguradora}</div>
                      <div className="text-[9px] text-muted-foreground mt-1">Creado: {formatFecha(form.creado_en)}</div>
                    </div>
                    {form.pdf_generado_url && (
                      <a href={form.pdf_generado_url} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" className="text-[10px]">Descargar</Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 7: FIRMA DIGITAL CONSENTIMIENTO INFORMADO */}
        <TabsContent value="consentimiento" className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4 max-w-lg mx-auto">
            <h3 className="font-heading font-bold text-brand-navy border-b pb-2">Firma Digital del Paciente</h3>
            <p className="text-xs text-muted-foreground">
              El paciente debe dibujar su firma libremente en el recuadro inferior para generar y estampar el consentimiento informado.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Procedimiento Clínico</label>
              <select value={consentType} onChange={(e) => setConsentType(e.target.value)} className="w-full border rounded p-1.5 text-xs bg-white">
                <option value="Consentimiento para Operatoria">Operatoria Dental (Resinas/Caries)</option>
                <option value="Consentimiento para Implantología">Cirugía de Implante Dental</option>
                <option value="Consentimiento para Endodoncia">Endodoncia (Tratamiento de Conducto)</option>
                <option value="Consentimiento para Ortodoncia">Ortodoncia (Brackets/Alineadores)</option>
              </select>
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                className="cursor-crosshair w-full block bg-white"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button size="xs" variant="outline" onClick={clearCanvas}>Limpiar Panel</Button>
              <Button
                size="xs"
                disabled={consentLoading}
                onClick={handleSaveConsent}
                className="bg-brand-gold text-white font-semibold"
              >
                {consentLoading ? "Guardando..." : "Firmar Consentimiento"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const formatFecha = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
};
