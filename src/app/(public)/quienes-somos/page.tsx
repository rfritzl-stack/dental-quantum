import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Quiénes Somos | Clínica Dental Quantum",
  description: "Conoce a nuestro equipo de odontólogos especialistas acreditados de Clínica Dental Quantum. Trayectoria y tecnología de punta en Vitacura, Santiago.",
};

// Datos de fallback si no hay conexión a base de datos
const MOCK_PROFESIONALES = [
  {
    id: "1",
    nombre: "Andrés",
    apellido: "Silva",
    especialidades: ["implantologia", "cirugia", "rehabilitacion-oral"],
    email: "asilva@dentalquantum.cl",
    color_agenda: "#0B1F3A",
  },
  {
    id: "2",
    nombre: "Claudia",
    apellido: "Toledo",
    especialidades: ["ortodoncia", "odontopediatria", "periodoncia"],
    email: "ctoledo@dentalquantum.cl",
    color_agenda: "#00C4B4",
  },
];

const ESPECIALIDAD_NOMBRES: Record<string, string> = {
  implantologia: "Implantología",
  cirugia: "Cirugía Oral",
  "rehabilitacion-oral": "Rehabilitación Oral",
  ortodoncia: "Ortodoncia",
  odontopediatria: "Odontopediatría",
  periodoncia: "Periodoncia",
  endodoncia: "Endodoncia",
  "anestesia-y-sedacion": "Anestesia y Sedación",
  operatoria: "Operatoria",
  "diseno-de-sonrisa": "Diseño de Sonrisa",
  bruxismo: "Bruxismo",
  blanqueamiento: "Blanqueamiento",
  "estetica-facial": "Estética Facial",
};

export default async function QuienesSomosPage() {
  let profesionales = MOCK_PROFESIONALES;

  try {
    const dbProf = await prisma.profesional.findMany({
      where: { activo: true },
    });
    if (dbProf && dbProf.length > 0) {
      profesionales = dbProf.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        especialidades: p.especialidades,
        email: p.email,
        color_agenda: p.color_agenda || "#0B1F3A",
      }));
    }
  } catch (error) {
    console.warn("DB Connection failed, using mock data for quienes-somos page:", error);
  }

  return (
    <div className="space-y-16 py-12">
      {/* Intro */}
      <section className="container mx-auto px-4 max-w-4xl text-center space-y-6">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-navy">Quiénes Somos</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          En Clínica Dental Quantum nos dedicamos a entregar salud y estética bucal de alta complejidad. Fundada en 2015 en Vitacura, nacimos con el propósito de reunir a los mejores especialistas bajo un concepto tecnológico, cercano y seguro.
        </p>
      </section>

      {/* Timeline */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-brand-navy mb-12">Nuestra Historia</h2>
          <div className="relative border-l-2 border-slate-200 ml-4 md:ml-32 space-y-8">
            <div className="relative pl-6">
              <div className="absolute size-4 bg-brand-turquoise rounded-full -left-[9px] top-1.5" />
              <span className="font-heading font-bold text-brand-gold text-lg">2015</span>
              <h3 className="font-bold text-brand-navy mt-1">Fundación y Primer Box</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Iniciamos operaciones en Av. Kennedy con un solo box clínico enfocado en odontología general e implantología básica.
              </p>
            </div>
            <div className="relative pl-6">
              <div className="absolute size-4 bg-brand-turquoise rounded-full -left-[9px] top-1.5" />
              <span className="font-heading font-bold text-brand-gold text-lg">2019</span>
              <h3 className="font-bold text-brand-navy mt-1">Expansión de Especialidades</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Sumamos el área de ortodoncia e incorporamos nuestro primer equipo de radiografía panorámica digital para diagnósticos rápidos en clínica.
              </p>
            </div>
            <div className="relative pl-6">
              <div className="absolute size-4 bg-brand-turquoise rounded-full -left-[9px] top-1.5" />
              <span className="font-heading font-bold text-brand-gold text-lg">2023</span>
              <h3 className="font-bold text-brand-navy mt-1">Certificación en Sedación</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Obtenemos la acreditación sanitaria para aplicar sedación consciente por óxido nitroso, revolucionando la experiencia de pacientes con fobia o ansiedad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <div className="border border-border rounded-xl p-8 space-y-4 bg-white shadow-sm">
          <div className="text-3xl">🎯</div>
          <h3 className="font-heading text-xl font-bold text-brand-navy">Nuestra Misión</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Entregar tratamientos odontológicos integrales y de alta complejidad con tecnología avanzada, priorizando la seguridad del paciente y garantizando un ambiente confortable y libre de dolor.
          </p>
        </div>
        <div className="border border-border rounded-xl p-8 space-y-4 bg-white shadow-sm">
          <div className="text-3xl">👁️</div>
          <h3 className="font-heading text-xl font-bold text-brand-navy">Nuestra Visión</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ser reconocidos en el sector oriente de Santiago como la clínica dental líder en innovación tecnológica y experiencia del paciente, destacando por la calidad humana y ética de nuestros profesionales.
          </p>
        </div>
      </section>

      {/* Team Cards */}
      <section className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-brand-navy mb-12">Equipo Médico</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {profesionales.map((prof) => (
            <div key={prof.id} className="border border-border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-4 bg-brand-navy" style={{ backgroundColor: prof.color_agenda }} />
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-navy">Dr/Dra. {prof.nombre} {prof.apellido}</h3>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                    Odontólogo/a Especialista
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-gold tracking-wider">Especialidades</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {prof.especialidades.map((slug) => (
                      <span key={slug} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {ESPECIALIDAD_NOMBRES[slug] || slug}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground pt-2 border-t border-slate-100">
                  📧 {prof.email}
                </div>

                <Link href={`/agendar?profesional_id=${prof.id}`} className="block pt-2">
                  <Button className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white text-xs py-2 rounded-lg">
                    Agendar con Dr/Dra. {prof.apellido}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
