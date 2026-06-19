"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/portal");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-turquoise mx-auto"></div>
          <p className="text-xs text-muted-foreground">Cargando tu portal clínico...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const navItems = [
    { href: "/portal/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/portal/citas", label: "Mis Citas", icon: "📅" },
    { href: "/portal/tratamientos", label: "Tratamientos", icon: "🦷" },
    { href: "/portal/documentos", label: "Documentos", icon: "📁" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white dark:bg-slate-800 flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          <Link href="/portal/dashboard" className="font-heading text-xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
            <span className="text-brand-turquoise">✦</span> Quantum
          </Link>
          <div className="mt-8 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-brand-navy bg-slate-100 dark:text-white dark:bg-slate-700 font-semibold"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-brand-navy dark:hover:bg-slate-700/50 dark:hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-brand-turquoise/20 rounded-full flex items-center justify-center font-bold text-brand-navy">
              {user.nombre.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-brand-navy dark:text-white truncate">{user.nombre}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <Button
            onClick={() => signOut()}
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs border-slate-200"
          >
            🚪 Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white dark:bg-slate-800 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Nav Link */}
            <div className="flex md:hidden gap-4 font-heading text-lg font-bold text-brand-navy dark:text-white items-center">
              <span className="text-brand-turquoise">✦</span> Quantum
            </div>
            <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white hidden md:block">
              Portal del Paciente
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/portal/agendar">
              <Button size="sm" className="bg-brand-gold hover:bg-brand-gold/90 text-white font-medium shadow-sm text-xs md:text-sm">
                Nueva Cita Online
              </Button>
            </Link>
            {/* Mobile logout */}
            <Button
              onClick={() => signOut()}
              variant="outline"
              size="sm"
              className="md:hidden border-slate-200 text-xs px-2"
            >
              🚪 Salir
            </Button>
          </div>
        </header>

        {/* Mobile menu bar */}
        <div className="flex md:hidden bg-white dark:bg-slate-800 border-b border-border justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-brand-turquoise font-semibold"
                    : "text-muted-foreground hover:text-brand-navy"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
