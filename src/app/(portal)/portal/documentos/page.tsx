"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface Archivo {
  id: string;
  tipo: string;
  url_storage: string;
  nombre_archivo: string;
  descripcion: string | null;
  fecha_subida: string;
}

interface Formulario {
  id: string;
  pdf_generado_url: string | null;
  estado: string;
  creado_en: string;
  formulario: { nombre_formulario: string; aseguradora: string };
}

interface Boleta {
  id: string;
  folio: number;
  pdf_url: string | null;
  monto_total: number;
  fecha_emision: string;
}

export default function PortalDocumentosPage() {
  const { user } = useAuth();
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.rut) {
      setLoading(false);
      return;
    }

    const fetchDocumentos = async () => {
      try {
        const response = await fetch(`/api/portal/documentos?rut=${user.rut}`);
        if (response.ok) {
          const data = await response.json();
          setArchivos(data.archivos || []);
          setFormularios(data.formularios || []);
          setBoletas(data.boletas || []);
        } else {
          // Fallback demo
          setArchivos([
            {
              id: "arch-1",
              tipo: "radiografia",
              url_storage: "/assets/sample-xray.jpg",
              nombre_archivo: "Radiografia_Panoramica_Control.jpg",
              descripcion: "Radiografía dental panorámica de control anual.",
              fecha_subida: "2026-03-10T11:00:00Z"
            }
          ]);
          setFormularios([
            {
              id: "form-1",
              pdf_generado_url: "/storage/reembolsos/formulario_metlife.pdf",
              estado: "completo",
              creado_en: "2026-03-10T11:30:00Z",
              formulario: { nombre_formulario: "Formulario de Reembolso Gastos Dentales", aseguradora: "MetLife" }
            }
          ]);
          setBoletas([
            {
              id: "bol-1",
              folio: 1045,
              pdf_url: "/storage/boletas/boleta_1045.pdf",
              monto_total: 45000,
              fecha_emision: "2026-03-10T11:35:00Z"
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentos();
  }, [user]);

  const formatFecha = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  };

  if (!user?.rut) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border text-center text-xs md:text-sm text-muted-foreground">
        Por favor vincula tu RUT en la sección &quot;Mis Citas&quot; para descargar tus radiografías y boletas.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">Mis Documentos</h1>
        <p className="text-muted-foreground text-sm">Descarga tus radiografías, boletas de honorarios y formularios médicos.</p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white h-32 rounded-xl border"></div>
          <div className="bg-white h-32 rounded-xl border"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna 1: Radiografías y Archivos Clínicos */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white border-b pb-2">
              Radiografías y Archivos Clínicos
            </h2>
            {archivos.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No registras archivos clínicos subidos.</p>
            ) : (
              <div className="space-y-3">
                {archivos.map((arch) => (
                  <div key={arch.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-border shadow-sm flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📁</span>
                        <div className="font-bold text-brand-navy dark:text-white text-sm truncate">
                          {arch.nombre_archivo}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{arch.descripcion || "Sin descripción"}</p>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        Subido el: {formatFecha(arch.fecha_subida)} • Tipo: <span className="uppercase font-semibold">{arch.tipo}</span>
                      </div>
                    </div>
                    <a href={arch.url_storage} download target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs">
                        Descargar
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna 2: Boletas y Reembolsos */}
          <div className="space-y-6">
            {/* Boletas */}
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white border-b pb-2">
                Boletas Electrónicas (DTE)
              </h2>
              {boletas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No se registran boletas electrónicas emitidas.</p>
              ) : (
                <div className="space-y-3">
                  {boletas.map((bol) => (
                    <div key={bol.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-border shadow-sm flex justify-between items-center gap-4">
                      <div>
                        <div className="font-bold text-brand-navy dark:text-white text-sm">
                          Boleta de Honorarios N° {bol.folio}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Monto: <span className="font-semibold text-slate-700 dark:text-slate-300">${bol.monto_total.toLocaleString("es-CL")}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Emitida: {formatFecha(bol.fecha_emision)}
                        </div>
                      </div>
                      {bol.pdf_url ? (
                        <a href={bol.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs">
                            Ver PDF DTE
                          </Button>
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Procesando...</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formularios de Reembolso */}
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white border-b pb-2">
                Formularios de Reembolso Generados
              </h2>
              {formularios.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No registras formularios de reembolso creados.</p>
              ) : (
                <div className="space-y-3">
                  {formularios.map((form) => (
                    <div key={form.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-border shadow-sm flex justify-between items-center gap-4">
                      <div className="min-w-0">
                        <div className="font-bold text-brand-navy dark:text-white text-sm truncate">
                          {form.formulario.nombre_formulario}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Aseguradora: <span className="font-semibold text-slate-700 dark:text-slate-300">{form.formulario.aseguradora}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Creado el: {formatFecha(form.creado_en)}
                        </div>
                      </div>
                      {form.pdf_generado_url ? (
                        <a href={form.pdf_generado_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs">
                            Descargar PDF
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">Borrador</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
