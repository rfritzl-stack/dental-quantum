"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PortalLoginPage() {
  const { signIn, signUp, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [email, setEmail] = useState("");
  
  // Registro Paciente
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage({ type: "error", text: "El correo electrónico es obligatorio." });
      return;
    }

    if (isRegister) {
      if (!rut || !nombre || !apellido) {
        setMessage({ type: "error", text: "El RUT, Nombre y Apellido son obligatorios." });
        return;
      }
      const res = await signUp(email, rut, nombre, apellido, telefono);
      if (res.success) {
        setMessage({ type: "success", text: "¡Registro exitoso! Redirigiendo al portal..." });
        setTimeout(() => {
          router.push("/portal/dashboard");
        }, 1500);
      } else {
        setMessage({ type: "error", text: res.error || "Falló el registro." });
      }
    } else {
      const res = await signIn(email, isStaff);
      if (res.success) {
        setMessage({ type: "success", text: "¡Acceso concedido! Redirigiendo..." });
        setTimeout(() => {
          if (isStaff) {
            router.push("/admin");
          } else {
            router.push("/portal/dashboard");
          }
        }, 1500);
      } else {
        setMessage({ type: "error", text: res.error || "Correo no válido." });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl border border-border shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl font-extrabold text-brand-navy dark:text-white flex items-center justify-center gap-2">
            <span className="text-brand-turquoise">✦</span> Quantum
          </div>
          <h2 className="mt-6 text-xl md:text-2xl font-heading font-bold text-slate-900 dark:text-white">
            {isRegister
              ? "Crea tu cuenta de Paciente"
              : isStaff
              ? "Acceso del Personal Clínico"
              : "Acceso a tu Portal de Paciente"}
          </h2>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground">
            {isRegister
              ? "¿Ya tienes una cuenta?"
              : isStaff
              ? "¿Eres paciente?"
              : "¿Primera vez aquí?"}{" "}
            <button
              onClick={() => {
                setMessage(null);
                if (isStaff) {
                  setIsStaff(false);
                  setIsRegister(false);
                } else {
                  setIsRegister(!isRegister);
                }
              }}
              className="font-medium text-brand-turquoise hover:text-brand-turquoise/80 underline"
            >
              {isRegister
                ? "Inicia Sesión"
                : isStaff
                ? "Acceso Pacientes"
                : "Regístrate ahora"}
            </button>
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {message && (
            <div
              className={`p-3 rounded-lg text-xs md:text-sm font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-3">
            {isRegister && (
              <>
                <div>
                  <label htmlFor="nombre" className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nombre *
                  </label>
                  <Input
                    id="nombre"
                    type="text"
                    required
                    placeholder="Juan"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-xs font-semibold text-muted-foreground mb-1">
                    Apellido *
                  </label>
                  <Input
                    id="apellido"
                    type="text"
                    required
                    placeholder="Pérez"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="rut" className="block text-xs font-semibold text-muted-foreground mb-1">
                    RUT (con guión y dígito verificador) *
                  </label>
                  <Input
                    id="rut"
                    type="text"
                    required
                    placeholder="12.345.678-9"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="telefono" className="block text-xs font-semibold text-muted-foreground mb-1">
                    Teléfono
                  </label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-muted-foreground mb-1">
                Correo Electrónico *
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={isStaff ? "nombre@dentalquantum.cl" : "correo@paciente.cl"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md"
            >
              {loading
                ? "Cargando..."
                : isRegister
                ? "Crear Cuenta"
                : isStaff
                ? "Acceder al Panel Clínico"
                : "Ingresar al Portal"}
            </Button>
          </div>
        </form>

        {/* Staff Toggle Link */}
        {!isRegister && !isStaff && (
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setMessage(null);
                setIsStaff(true);
              }}
              className="text-xs text-muted-foreground hover:text-brand-navy hover:underline"
            >
              🔐 ¿Eres parte del personal clínico? Accede aquí
            </button>
          </div>
        )}

        {/* Demo Users Tip */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-lg mt-4 text-[10px] md:text-xs text-muted-foreground space-y-1">
          <div className="font-bold text-slate-700 dark:text-slate-300">Modo Demo Local Activo:</div>
          <div>• Paciente Demo: <span className="font-mono text-brand-turquoise">demo@paciente.cl</span></div>
          <div>• Odontólogo (Dr. Silva): <span className="font-mono text-brand-turquoise">asilva@dentalquantum.cl</span></div>
          <div>• Recepcionista: <span className="font-mono text-brand-turquoise">recepcion@dentalquantum.cl</span></div>
          <div>• Administrador: <span className="font-mono text-brand-turquoise">admin@dentalquantum.cl</span></div>
        </div>
      </div>
    </div>
  );
}
