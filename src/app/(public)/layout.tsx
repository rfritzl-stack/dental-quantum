import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold text-brand-navy flex items-center gap-2">
            <span className="text-brand-turquoise">✦</span> Quantum
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/quienes-somos" className="hover:text-brand-navy transition-colors">
              Quiénes Somos
            </Link>
            <Link href="/especialidades" className="hover:text-brand-navy transition-colors">
              Especialidades
            </Link>
            <Link href="/testimonios" className="hover:text-brand-navy transition-colors">
              Testimonios
            </Link>
            <Link href="/blog" className="hover:text-brand-navy transition-colors">
              Blog
            </Link>
            <Link href="/contacto" className="hover:text-brand-navy transition-colors">
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/portal">
              <Button variant="ghost" size="sm">Portal Paciente</Button>
            </Link>
            <Link href="/agendar">
              <Button size="sm" className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md">
                Agendar Hora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-brand-navy text-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading text-lg font-bold mb-4 text-brand-turquoise">✦ Clínica Dental Quantum</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Tecnología y especialización para sonrisas sanas. Ubicados en el corazón de Vitacura, Santiago.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-brand-gold uppercase tracking-wider">Especialidades</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Implantología</li>
              <li>Ortodoncia</li>
              <li>Estética Dental</li>
              <li>Odontopediatría</li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-brand-gold uppercase tracking-wider">Contacto</h4>
            <p className="text-sm text-gray-300">
              Av. Kennedy 7100, Of. 706<br />
              Vitacura, Santiago de Chile
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Fono: (56-2) 2953 9291
            </p>
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold mb-4 text-brand-gold uppercase tracking-wider">Portal</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/portal" className="hover:text-brand-turquoise">Iniciar Sesión</Link></li>
              <li><Link href="/agendar" className="hover:text-brand-turquoise">Agendar Online</Link></li>
              <li><Link href="/privacidad" className="hover:text-brand-turquoise">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Clínica Dental Quantum. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
