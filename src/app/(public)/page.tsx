import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative">
      {/* HERO SECTION */}
      <section className="bg-brand-navy text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,196,180,0.15),transparent_45%)]" />
        <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 max-w-xl">
            <span className="text-brand-turquoise font-semibold tracking-wider uppercase text-xs">
              Tecnología Dental de Vanguardia
            </span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Diseñamos tu sonrisa con precisión y cuidado
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              En Clínica Dental Quantum combinamos profesionales acreditados, sedación consciente y tecnología de última generación en Vitacura.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/agendar">
                <Button size="lg" className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-lg text-base h-12 px-8 w-full sm:w-auto">
                  Agenda tu Hora
                </Button>
              </Link>
              <Link href="/quienes-somos">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white text-base h-12 px-8 w-full sm:w-auto">
                  Conoce al Equipo
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative h-[450px] rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
            {/* Visual representation placeholder */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-navy via-brand-navy/60 to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center relative z-20">
              <div className="space-y-4">
                <div className="text-5xl text-brand-turquoise">✦</div>
                <h3 className="font-heading text-2xl font-bold">Instalaciones de Primer Nivel</h3>
                <p className="text-gray-300 text-sm max-w-md">
                  Boxes equipados con la última tecnología de radiología digital y sedación consciente para tu total tranquilidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS SECTION */}
      <section className="bg-brand-navy border-t border-white/10 py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-turquoise">+2.000</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Pacientes Felices</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-turquoise">10 Años</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">De Experiencia</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-turquoise">5.0 ★</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Google Reviews</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-turquoise">13</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Especialidades</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY QUANTUM */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-navy">
              ¿Por qué elegir Clínica Dental Quantum?
            </h2>
            <p className="text-muted-foreground">
              Nos enfocamos en entregar una experiencia cómoda, segura y altamente profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-border rounded-xl p-8 hover:shadow-xl transition-shadow space-y-4">
              <div className="text-brand-turquoise text-3xl font-semibold">01</div>
              <h3 className="font-heading text-xl font-bold text-brand-navy">Sedación Consciente</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Olvídate del miedo al dentista. Contamos con protocolos de sedación con óxido nitroso para un tratamiento relajado y libre de estrés.
              </p>
            </div>
            <div className="border border-border rounded-xl p-8 hover:shadow-xl transition-shadow space-y-4">
              <div className="text-brand-turquoise text-3xl font-semibold">02</div>
              <h3 className="font-heading text-xl font-bold text-brand-navy">Tecnología Avanzada</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Utilizamos scanners digitales, radiología en 3D de baja radiación y materiales biocompatibles certificados para garantizar precisión.
              </p>
            </div>
            <div className="border border-border rounded-xl p-8 hover:shadow-xl transition-shadow space-y-4">
              <div className="text-brand-turquoise text-3xl font-semibold">03</div>
              <h3 className="font-heading text-xl font-bold text-brand-navy">Especialistas Acreditados</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Todos nuestros odontólogos cuentan con certificaciones universitarias en sus respectivas áreas y registro de la Superintendencia de Salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE FORM SECTION */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <div className="bg-brand-navy p-10 md:p-12 text-white flex flex-col justify-between space-y-8">
              <div>
                <h3 className="font-heading text-2xl font-bold mb-4">¿Tienes dudas o quieres realizar una consulta?</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Completa el formulario y una de nuestras ejecutivas te contactará en minutos para asesorarte o agendar tu evaluación.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📍 Av. Kennedy 7100, Vitacura</p>
                <p>📞 (56-2) 2953 9291</p>
                <p>✉ contacto@dentalquantum.cl</p>
              </div>
            </div>
            <div className="p-10 md:p-12 space-y-6">
              <h4 className="font-heading text-lg font-bold text-brand-navy">Solicita Información</h4>
              <form className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Nombre Completo</label>
                  <input type="text" placeholder="Ej: Juan Pérez" className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Teléfono Móvil</label>
                  <input type="tel" placeholder="Ej: +56 9 1234 5678" className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Especialidad de Interés</label>
                  <select className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-turquoise bg-white">
                    <option value="">Selecciona una opción</option>
                    <option value="implantologia">Implantología</option>
                    <option value="ortodoncia">Ortodoncia</option>
                    <option value="odontopediatria">Odontopediatría</option>
                    <option value="estetica">Estética Dental</option>
                    <option value="general">Consulta General / Otro</option>
                  </select>
                </div>
                <Button type="button" className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md py-3 text-sm rounded-lg">
                  Enviar Solicitud
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP FAB */}
      <a
        href="https://wa.me/56929539291?text=Hola,%20quisiera%20consultar%20por%20horas%20disponibles"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA56] text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
        aria-label="Contactar por WhatsApp"
      >
        <svg className="size-6 fill-current" viewBox="0 0 24 24">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.928 9.928 0 0 0 4.808 1.239h.005c5.507 0 9.99-4.478 9.99-9.984a9.99 9.99 0 0 0-9.993-9.893zm4.866 14.123c-.267.755-1.545 1.385-2.128 1.472-.516.078-1.19.146-3.414-.775-2.844-1.177-4.68-4.07-4.823-4.26-.142-.19-1.157-1.54-1.157-2.93 0-1.39.73-2.071 1.012-2.37.283-.298.616-.37.822-.37.206 0 .412.002.592.01.185.008.434-.073.678.514.25.602.853 2.08.927 2.23.074.15.124.323.025.52-.1.198-.148.32-.294.49-.147.173-.308.384-.44.515-.148.148-.303.31-.13.606.173.296.769 1.267 1.65 2.05.173.153.333.303.5.425.167.123.327.206.505.283.178.077.38.07.525-.098.146-.168.618-.72.784-.967.167-.247.33-.207.55-.125.222.083 1.408.665 1.65.786.242.12.403.18.463.283.06.1.06.58-.207 1.336z"/>
        </svg>
      </a>
    </div>
  );
}
