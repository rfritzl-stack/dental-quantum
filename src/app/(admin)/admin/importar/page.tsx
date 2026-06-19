"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface PacienteRaw {
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  prevision: string;
}

interface ImportStat {
  total: number;
  importados: number;
  duplicados: number;
  errores: number;
}

interface ValidationError {
  rut: string;
  nombre?: string;
  error: string;
}

// Validar RUT (Módulo 11)
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

export default function AdminImportarPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"excel" | "markdown" | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Excel Mappings
  const [headers, setHeaders] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [mappings, setMappings] = useState({
    rut: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    prevision: "",
  });

  // Standardized Data
  const [parsedData, setParsedData] = useState<PacienteRaw[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Execution states
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStat | null>(null);
  const [apiErrors, setApiErrors] = useState<ValidationError[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // 2. Process uploaded file (Excel vs MD)
  const processFile = (file: File) => {
    setFile(file);
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "md") {
      setFileType("markdown");
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseMarkdownFile(text);
      };
      reader.readAsText(file);
    } else if (["xlsx", "xls", "csv"].includes(extension || "")) {
      setFileType("excel");
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (json.length > 0) {
          const rowKeys = Object.keys(json[0]);
          setHeaders(rowKeys);
          setExcelRows(json);
          autoSuggestMappings(rowKeys);
          setStep(2); // Avanzar a Mapeo
        } else {
          alert("El archivo Excel está vacío.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Formato de archivo no soportado. Suba un archivo .xlsx, .csv o .md");
      setFile(null);
    }
  };

  // Auto suggest mapping based on header names
  const autoSuggestMappings = (keys: string[]) => {
    const suggest = (keyName: string, matches: string[]) => {
      return keys.find((k) => matches.some((m) => k.toLowerCase().includes(m))) || "";
    };

    setMappings({
      rut: suggest("rut", ["rut", "run", "identificador", "documento", "id"]),
      nombre: suggest("nombre", ["nombre", "name", "nombres"]),
      apellido: suggest("apellido", ["apellido", "last name", "apellidos"]),
      email: suggest("email", ["email", "correo", "mail", "contacto"]),
      telefono: suggest("telefono", ["telefono", "celular", "fono", "phone", "movil"]),
      prevision: suggest("prevision", ["prevision", "previsión", "isapre", "fonasa", "seguro"]),
    });
  };

  // Parse Markdown section structure
  const parseMarkdownFile = (text: string) => {
    const sections = text.split(/(?=##\s+)/);
    const list: PacienteRaw[] = [];

    sections.forEach((sect) => {
      const lines = sect.split("\n");
      const headerLine = lines[0] || "";
      if (!headerLine.startsWith("##")) return;

      const title = headerLine.replace(/^##\s+/, "").replace(/Paciente\s+/i, "").trim();
      const nameParts = title.split(/\s+/);
      const nombre = nameParts[0] || "";
      const apellido = nameParts.slice(1).join(" ") || "";

      let rut = "";
      let email = "";
      let telefono = "";
      let prevision = "";

      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (/^[-*]\s+rut:/i.test(cleanLine)) {
          rut = cleanLine.replace(/^[-*]\s+rut:\s*/i, "").trim();
        } else if (/^[-*]\s+email:/i.test(cleanLine)) {
          email = cleanLine.replace(/^[-*]\s+email:\s*/i, "").trim();
        } else if (/^[-*]\s+tel[eé]fono:/i.test(cleanLine)) {
          telefono = cleanLine.replace(/^[-*]\s+tel[eé]fono:\s*/i, "").trim();
        } else if (/^[-*]\s+previsi[oó]n:/i.test(cleanLine)) {
          prevision = cleanLine.replace(/^[-*]\s+previsi[oó]n:\s*/i, "").trim();
        }
      });

      if (rut) {
        list.push({ rut, nombre, apellido, email, telefono, prevision });
      }
    });

    setParsedData(list);
    validatePatients(list);
    setStep(3); // Avanzar directamente a Validación para Markdown
  };

  // 3. Process Excel mapping to Standardized Data
  const handleApplyMappings = () => {
    if (!mappings.rut) {
      alert("Es obligatorio mapear la columna del RUT.");
      return;
    }

    const list: PacienteRaw[] = excelRows.map((row) => ({
      rut: row[mappings.rut] ? String(row[mappings.rut]).trim() : "",
      nombre: mappings.nombre && row[mappings.nombre] ? String(row[mappings.nombre]).trim() : "",
      apellido: mappings.apellido && row[mappings.apellido] ? String(row[mappings.apellido]).trim() : "",
      email: mappings.email && row[mappings.email] ? String(row[mappings.email]).trim() : "",
      telefono: mappings.telefono && row[mappings.telefono] ? String(row[mappings.telefono]).trim() : "",
      prevision: mappings.prevision && row[mappings.prevision] ? String(row[mappings.prevision]).trim() : "",
    }));

    setParsedData(list);
    validatePatients(list);
    setStep(3); // Avanzar a Validación
  };

  // 4. Client side validation check
  const validatePatients = (list: PacienteRaw[]) => {
    const errors: ValidationError[] = [];
    list.forEach((p, idx) => {
      const rowNum = idx + 1;
      if (!p.rut) {
        errors.push({ rut: `Fila ${rowNum}`, error: "Fila sin RUT" });
      } else if (!validarRut(p.rut)) {
        errors.push({ rut: p.rut, nombre: `${p.nombre} ${p.apellido}`.trim(), error: "RUT inválido (Módulo 11)" });
      }

      if (p.rut && !p.nombre) {
        errors.push({ rut: p.rut, nombre: p.rut, error: "Paciente sin Nombre" });
      }
    });
    setValidationErrors(errors);
  };

  // 5. POST to backend API for batch insert
  const handleExecuteImport = async () => {
    setImporting(true);
    setApiErrors([]);
    setProgress(30);

    try {
      const res = await fetch("/api/admin/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacientes: parsedData }),
      });

      setProgress(80);
      if (res.ok) {
        const d = await res.json();
        setStats(d.stats);
        setApiErrors(d.errors || []);
        setStep(4); // Completado
      } else {
        alert("Ocurrió un error en el servidor al importar los registros.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red.");
    } finally {
      setProgress(100);
      setImporting(false);
    }
  };

  const resetImporter = () => {
    setStep(1);
    setFile(null);
    setFileType(null);
    setHeaders([]);
    setExcelRows([]);
    setParsedData([]);
    setValidationErrors([]);
    setStats(null);
    setApiErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-navy">Importador de Pacientes</h1>
          <p className="text-muted-foreground text-sm">Carga masiva de datos históricos en formato Excel o Markdown.</p>
        </div>
        <Link href="/admin/pacientes">
          <Button variant="ghost" size="sm">← Volver a Fichas</Button>
        </Link>
      </div>

      {/* Stepper progress */}
      {step <= 3 && (
        <div className="flex justify-between items-center max-w-md mx-auto py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                  step === s
                    ? "bg-brand-turquoise text-brand-navy border-brand-turquoise"
                    : step > s
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "bg-white text-muted-foreground border-slate-200"
                }`}
              >
                {s}
              </div>
              <span className={`text-xs font-semibold ${step === s ? "text-brand-navy font-bold" : "text-muted-foreground"}`}>
                {s === 1 ? "Archivo" : s === 2 ? "Mapeo" : "Validación"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Upload File */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver ? "border-brand-turquoise bg-brand-turquoise/5" : "border-slate-300 hover:border-brand-turquoise bg-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.md"
              className="hidden"
            />
            <div className="text-5xl mb-4">📥</div>
            <h3 className="font-heading font-bold text-brand-navy text-sm md:text-base">
              Arrastra tu archivo aquí o haz clic para buscar
            </h3>
            <p className="text-muted-foreground text-xs mt-2 max-w-md mx-auto">
              Soporta planillas de cálculo Excel (<strong>.xlsx</strong>, <strong>.csv</strong>) y archivos de notas estructurados en Markdown (<strong>.md</strong>).
            </p>
          </div>

          <div className="bg-slate-50 border p-4 rounded-xl text-xs text-slate-600 space-y-2">
            <div className="font-bold text-brand-navy">Formato de ejemplo sugerido para Markdown (.md):</div>
            <pre className="bg-white p-3 border rounded text-[10px] overflow-x-auto text-slate-800 font-mono">
{`## Paciente Juan Pérez
- RUT: 19876543-2
- Email: juan@perez.cl
- Teléfono: +56987654321
- Previsión: Colmena`}
            </pre>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping (Only for Excel) */}
      {step === 2 && fileType === "excel" && (
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-heading font-bold text-brand-navy text-base">
              Paso 2: Mapear Columnas de Excel
            </h3>
            {file && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border">
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Asocia las columnas detectadas en tu archivo con los campos obligatorios y opcionales de la ficha de pacientes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-brand-navy uppercase block mb-1">RUT del Paciente *</label>
              <select
                value={mappings.rut}
                onChange={(e) => setMappings({ ...mappings, rut: e.target.value })}
                className="w-full border rounded p-2 bg-white font-semibold"
              >
                <option value="">-- Seleccionar Columna --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bold text-brand-navy uppercase block mb-1">Nombres</label>
              <select
                value={mappings.nombre}
                onChange={(e) => setMappings({ ...mappings, nombre: e.target.value })}
                className="w-full border rounded p-2 bg-white"
              >
                <option value="">-- No mapear --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bold text-brand-navy uppercase block mb-1">Apellidos</label>
              <select
                value={mappings.apellido}
                onChange={(e) => setMappings({ ...mappings, apellido: e.target.value })}
                className="w-full border rounded p-2 bg-white"
              >
                <option value="">-- No mapear --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bold text-brand-navy uppercase block mb-1">Email</label>
              <select
                value={mappings.email}
                onChange={(e) => setMappings({ ...mappings, email: e.target.value })}
                className="w-full border rounded p-2 bg-white"
              >
                <option value="">-- No mapear --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bold text-brand-navy uppercase block mb-1">Teléfono</label>
              <select
                value={mappings.telefono}
                onChange={(e) => setMappings({ ...mappings, telefono: e.target.value })}
                className="w-full border rounded p-2 bg-white"
              >
                <option value="">-- No mapear --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bold text-brand-navy uppercase block mb-1">Previsión / Seguro</label>
              <select
                value={mappings.prevision}
                onChange={(e) => setMappings({ ...mappings, prevision: e.target.value })}
                className="w-full border rounded p-2 bg-white"
              >
                <option value="">-- No mapear --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t justify-end">
            <Button variant="outline" size="sm" onClick={resetImporter}>Cancelar</Button>
            <Button className="bg-brand-gold text-white text-xs font-semibold" onClick={handleApplyMappings}>
              Aplicar Mapeo y Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Validation */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-heading font-bold text-brand-navy text-base">
                Paso 3: Validar Pacientes ({parsedData.length} registros)
              </h3>
              {file && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Archivo: {file.name}
                </span>
              )}
            </div>
            {validationErrors.length > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded">
                ⚠️ {validationErrors.length} advertencias
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                ✓ Todo válido
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            A continuación se muestra el listado procesado. Los registros con RUTs erróneos serán identificados con advertencias y podrás omitirlos o re-importar el archivo corregido.
          </p>

          {/* Validation Warnings List */}
          {validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-1.5 max-h-[150px] overflow-y-auto">
              <div className="font-bold">⚠️ Se detectaron algunas inconsistencias:</div>
              {validationErrors.map((err, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="font-semibold">{err.rut}:</span>
                  <span>{err.error} {err.nombre ? `(${err.nombre})` : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Grid Preview List */}
          <div className="border rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b sticky top-0">
                <tr>
                  <th className="p-3">RUT</th>
                  <th className="p-3">Nombres y Apellidos</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Previsión</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-600">
                {parsedData.map((p, idx) => {
                  const hasRutError = !p.rut || !validarRut(p.rut);
                  return (
                    <tr key={idx} className={hasRutError ? "bg-red-50/40 text-red-900" : "hover:bg-slate-50/50"}>
                      <td className="p-3 font-semibold font-mono">
                        {p.rut || <span className="italic text-red-500">Sin RUT</span>}
                      </td>
                      <td className="p-3 font-medium">
                        {p.nombre || p.apellido ? `${p.nombre} ${p.apellido}` : <span className="italic text-slate-400">Sin Registrar</span>}
                      </td>
                      <td className="p-3">{p.email || "-"}</td>
                      <td className="p-3">{p.telefono || "-"}</td>
                      <td className="p-3">{p.prevision || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-4 border-t justify-between items-center">
            <Button variant="outline" size="sm" onClick={resetImporter}>Volver a subir</Button>
            
            {importing ? (
              <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-brand-turquoise h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            ) : (
              <Button 
                className="bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold text-xs py-2 h-9" 
                onClick={handleExecuteImport}
              >
                Importar {parsedData.length} Pacientes ✓
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Completed summary */}
      {step === 4 && stats && (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-xl space-y-6 text-center max-w-xl mx-auto">
          <div className="size-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto border border-emerald-100 font-bold shadow-sm">
            ✓
          </div>
          <h2 className="font-heading text-xl font-bold text-brand-navy">¡Importación Masiva Completada!</h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            El procesamiento de datos finalizó. Los nuevos pacientes han sido registrados exitosamente en el back-office.
          </p>

          <div className="grid grid-cols-3 gap-4 border rounded-xl p-4 bg-slate-50 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Importados</span>
              <div className="text-2xl font-bold text-emerald-600">{stats.importados}</div>
            </div>
            <div className="space-y-1 border-x px-2">
              <span className="text-slate-400 font-medium">Duplicados Omitidos</span>
              <div className="text-2xl font-bold text-brand-gold">{stats.duplicados}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Errores</span>
              <div className="text-2xl font-bold text-red-500">{stats.errores}</div>
            </div>
          </div>

          {/* API Errors list */}
          {apiErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-left text-xs space-y-1.5 max-h-[150px] overflow-y-auto">
              <div className="font-bold">🚨 Errores durante la inserción:</div>
              {apiErrors.map((err, idx) => (
                <div key={idx}>
                  • <strong>{err.rut}</strong> {err.nombre ? `(${err.nombre})` : ""}: {err.error}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" size="sm" onClick={resetImporter}>Importar otro archivo</Button>
            <Link href="/admin/pacientes">
              <Button className="bg-brand-navy text-white text-xs">Ver Listado de Pacientes</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
