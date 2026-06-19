"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseMock, mockUsers, supabase } from "./supabase";

interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rut?: string;
  role: "paciente" | "dentista" | "recepcionista" | "admin";
}

interface AuthContextType {
  user: AuthUser | null;
  role: "paciente" | "dentista" | "recepcionista" | "admin" | null;
  loading: boolean;
  signIn: (email: string, isStaff?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, rut: string, nombre: string, apellido: string, telefono: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  associateRut: (rut: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isSupabaseMock) {
          // Leer de localStorage en modo mock
          const storedUser = localStorage.getItem("quantum_session");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          // Supabase real session check
          const { data: { session } } = await supabase!.auth.getSession();
          if (session) {
            // Obtener rol y datos extendidos
            const userEmail = session.user.email;
            // Buscar si es staff o paciente en base de datos
            const response = await fetch(`/api/auth/profile?email=${userEmail}`);
            if (response.ok) {
              const profile = await response.json();
              setUser(profile);
            } else {
              // Si no existe perfil en DB, crear un paciente por defecto
              setUser({
                id: session.user.id,
                email: userEmail || "",
                nombre: session.user.user_metadata?.nombre || "Usuario Nuevo",
                role: "paciente",
              });
            }
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, isStaff = false) => {
    setLoading(true);
    try {
      if (isSupabaseMock) {
        // Buscar en los mock users
        const usersList = isStaff ? mockUsers.staff : mockUsers.pacientes;
        const matched = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (matched) {
          const sessionUser: AuthUser = {
            id: matched.id,
            email: matched.email,
            nombre: matched.nombre,
            rut: "rut" in matched ? (matched as { rut: string }).rut : undefined,
            role: matched.role as "paciente" | "dentista" | "recepcionista" | "admin",
          };
          localStorage.setItem("quantum_session", JSON.stringify(sessionUser));
          setUser(sessionUser);
          setLoading(false);
          return { success: true };
        } else {
          setLoading(false);
          return { success: false, error: "Usuario no registrado en la base demo" };
        }
      } else {
        // Iniciar sesión con Supabase Auth (Magic Link por simplicidad si no se configura contraseña)
        const { error } = await supabase!.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/portal/dashboard`,
          },
        });
        setLoading(false);
        if (error) return { success: false, error: error.message };
        return { success: true, error: "Se ha enviado un enlace de acceso a tu correo." };
      }
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión";
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, rut: string, nombre: string, apellido: string, telefono: string) => {
    setLoading(true);
    try {
      if (isSupabaseMock) {
        // Guardar paciente en mock
        const newPatient: AuthUser = {
          id: `p-${Date.now()}`,
          email,
          nombre: `${nombre} ${apellido}`,
          rut,
          role: "paciente",
        };
        // También llamar a la API local de registro de paciente
        const res = await fetch("/api/auth/register-patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, rut, nombre, apellido, telefono }),
        });

        if (!res.ok) {
          const errData = await res.json();
          setLoading(false);
          return { success: false, error: errData.error || "Error al crear el paciente en base de datos" };
        }

        localStorage.setItem("quantum_session", JSON.stringify(newPatient));
        setUser(newPatient);
        setLoading(false);
        return { success: true };
      } else {
        // Registro real con Supabase
        const { data, error } = await supabase!.auth.signUp({
          email,
          password: "password123", // Contraseña temporal simplificada para registro
          options: {
            data: { nombre, apellido },
          },
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        // Crear registro en base de datos PostgreSQL mediante API
        const res = await fetch("/api/auth/register-patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, rut, nombre, apellido, telefono, supabase_uid: data.user?.id }),
        });

        if (!res.ok) {
          const errData = await res.json();
          setLoading(false);
          return { success: false, error: errData.error || "Cuenta creada en Auth, pero falló enlace en base de datos" };
        }

        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Error al registrarse";
      return { success: false, error: errorMessage };
    }
  };

  const associateRut = async (rut: string) => {
    if (!user) return { success: false, error: "No hay usuario autenticado" };
    setLoading(true);
    try {
      const res = await fetch("/api/auth/associate-rut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email, rut }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setLoading(false);
        return { success: false, error: errData.error || "No se pudo asociar el RUT" };
      }

      const updatedUser = { ...user, rut };
      if (isSupabaseMock) {
        localStorage.setItem("quantum_session", JSON.stringify(updatedUser));
      }
      setUser(updatedUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Error al asociar el RUT";
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    if (isSupabaseMock) {
      localStorage.removeItem("quantum_session");
      setUser(null);
    } else {
      await supabase!.auth.signOut();
      setUser(null);
    }
    router.push("/portal");
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, loading, signIn, signUp, signOut, associateRut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
