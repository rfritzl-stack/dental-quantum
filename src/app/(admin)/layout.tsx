"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/portal");
      } else if (user.role === "paciente") {
        router.push("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto"></div>
          <p className="text-xs text-muted-foreground">Verificando credenciales administrativas...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role === "paciente") {
    return null; // Will redirect
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/pacientes", label: "Pacientes y Fichas", icon: "👥" },
    { href: "/admin/tratamientos", label: "Kanban Tratamientos", icon: "🦷" },
    { href: "/admin/whatsapp", label: "Módulo WhatsApp", icon: "💬" },
    { href: "/admin/cobros", label: "Cobros y Boletas", icon: "💵" },
    { href: "/admin/seguros", label: "Formularios de Seguros", icon: "📋" },
    { href: "/admin/importar", label: "Importación de Datos", icon: "📥" },
    { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-border bg-brand-navy text-white flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          <Link href="/admin" className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <span className="text-brand-turquoise">✦</span> Quantum Admin
          </Link>
          
          <div className="mt-8 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-white bg-white/10 font-semibold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-brand-gold rounded-full flex items-center justify-center font-bold text-white">
              {user.nombre.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{user.nombre}</div>
              <div className="text-[10px] text-gray-400 capitalize truncate">{user.role}</div>
            </div>
          </div>
          <Button
            onClick={() => signOut()}
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs border-white/10 text-white bg-transparent hover:bg-white/10 hover:text-white"
          >
            🚪 Salir del Sistema
          </Button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sistema Operacional</span>
            <span className="h-4 w-px bg-slate-200" />
            <span className="text-xs text-brand-turquoise bg-brand-turquoise/10 px-2.5 py-1 rounded-full font-bold">Fase 4 Activa</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            <span>Sesión: <span className="font-bold text-brand-navy capitalize">{user.role}</span></span>
          </div>
        </header>

        {/* Mobile menu bar */}
        <div className="flex md:hidden bg-brand-navy justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center text-[10px] font-medium transition-colors ${
                  isActive ? "text-brand-turquoise font-semibold" : "text-gray-300"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
