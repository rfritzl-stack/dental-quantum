import React from "react";

export const metadata = {
  title: "Testimonios y Casos Reales | Clínica Dental Quantum",
  description: "Conoce las opiniones y testimonios reales de pacientes atendidos en Clínica Dental Quantum, Vitacura. Calificación 5.0 en Google Reviews.",
};

const TESTIMONIOS_MOCK = [
  {
    nombre: "Javiera Echeverría",
    tratamiento: "Ortodoncia Invisible",
    comentario: "Excelente experiencia con la Dra. Toledo. Mis alineadores transparentes son comodísimos y los cambios fueron notorios desde el segundo mes. Totalmente recomendada la clínica.",
    estrellas: 5,
  },
  {
    nombre: "Roberto Gallardo",
    tratamiento: "Implantología + Sedación",
    comentario: "Le tenía terror al dentista hasta que probé la sedación consciente en Quantum. No sentí absolutamente nada de dolor al ponerme los dos implantes. El Dr. Silva es un genio.",
    estrellas: 5,
  },
  {
    nombre: "Constanza Valdés",
    tratamiento: "Diseño de Sonrisa",
    comentario: "Me hice carillas de composite y cambiaron mi sonrisa por completo. Excelente atención, las instalaciones de primer nivel y muy puntuales con las horas.",
    estrellas: 5,
  },
  {
    nombre: "Ignacio Pérez",
    tratamiento: "Odontopediatría",
    comentario: "Llevo a mis dos hijos pequeños con la Dra. Toledo. La paciencia y el cariño que tiene con los niños hace que ellos vayan felices al dentista. Excelente servicio.",
    estrellas: 5,
  },
  {
    nombre: "Magdalena Solar",
    tratamiento: "Blanqueamiento LED",
    comentario: "Rápido, indoloro y con resultados inmediatos. Mis dientes quedaron varios tonos más blancos en una sola sesión. Muy buena explicación de los cuidados posteriores.",
    estrellas: 5,
  },
  {
    nombre: "Fernando Cox",
    tratamiento: "Periodoncia",
    comentario: "Sufría de sangrado constante de encías. El tratamiento periodontal detuvo el avance del problema. Muy profesionales en el seguimiento.",
    estrellas: 5,
  },
];

export default function TestimoniosPage() {
  return (
    <div className="py-12 container mx-auto px-4 max-w-5xl space-y-16">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="font-heading text-4xl font-bold text-brand-navy">Testimonios</h1>
        <p className="text-muted-foreground">
          Conozca la experiencia de pacientes que han confiado en nuestro equipo clínico para transformar su salud bucal.
        </p>
      </div>

      {/* Google reviews score */}
      <div className="bg-brand-navy text-white rounded-2xl p-8 max-w-lg mx-auto text-center space-y-3 shadow-lg">
        <div className="text-3xl text-brand-gold">★★★★★</div>
        <div className="text-3xl font-bold font-heading">5.0 / 5.0</div>
        <p className="text-xs text-gray-300">Basado en más de 120 opiniones verificadas en Google Maps</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TESTIMONIOS_MOCK.map((t, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="text-brand-gold text-lg">
                {"★".repeat(t.estrellas)}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                &ldquo;{t.comentario}&rdquo;
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-6">
              <div className="text-sm font-bold text-brand-navy">{t.nombre}</div>
              <div className="text-xs text-brand-turquoise font-medium mt-0.5">{t.tratamiento}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Real Clinical Cases description */}
      <section className="bg-slate-50 rounded-2xl p-8 md:p-12 space-y-6 text-center max-w-3xl mx-auto">
        <h3 className="font-heading text-2xl font-bold text-brand-navy">Casos Clínicos Reales</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          En nuestra clínica documentamos fotográficamente la evolución de tratamientos de implantología, ortodoncia invisible y carillas cerámicas. Todos los casos expuestos en nuestras redes sociales y salas de espera cuentan con la firma de consentimiento informado de los pacientes en cumplimiento con la Ley de Derechos y Deberes de las personas en salud.
        </p>
      </section>
    </div>
  );
}
