import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

const MOCK_ESPECIALIDADES_DETALLE: Record<string, {
  nombre: string;
  descripcion: string;
  descripcion_larga: string;
  duracion_minutos: number;
  precio_base: number;
  categoria: string;
  beneficios: string[];
  pasos: string[];
  faqs: { q: string; a: string }[];
}> = {
  implantologia: {
    nombre: "Implantología",
    descripcion: "Reemplazo de piezas dentales perdidas con implantes de titanio.",
    descripcion_larga: "La implantología dental es la especialidad dedicada al reemplazo de dientes perdidos mediante la colocación de implantes de titanio integrados en el hueso maxilar o mandibular, sobre los cuales se fijan coronas o prótesis definitivas de aspecto natural.",
    duracion_minutos: 60,
    precio_base: 450000,
    categoria: "Rehabilitación",
    beneficios: [
      "Recupera la masticación y el habla natural.",
      "Evita el desplazamiento de dientes vecinos.",
      "Resultados estéticos idénticos a los dientes reales.",
      "Durabilidad a largo plazo con correcta higiene.",
    ],
    pasos: [
      "Evaluación y Scanner 3D para análisis óseo.",
      "Cirugía menor de inserción del implante de titanio.",
      "Período de osteointegración (fijación al hueso, 3-6 meses).",
      "Confección y cementación de la corona definitiva.",
    ],
    faqs: [
      { q: "¿Duele la colocación de un implante?", a: "No, la cirugía se realiza bajo anestesia local potente o sedación consciente. Las molestias postoperatorias son leves y se controlan con analgésicos comunes." },
      { q: "¿Cuánto dura un implante de titanio?", a: "Con una buena higiene dental y controles semestrales, los implantes pueden durar más de 20 años o incluso de por vida." }
    ]
  },
  ortodoncia: {
    nombre: "Ortodoncia",
    descripcion: "Corrección de la posición de los dientes y mordida con brackets o alineadores.",
    descripcion_larga: "Especialidad dedicada a corregir la malposición de los dientes y las alteraciones de la mordida. Ofrecemos tratamientos con brackets metálicos tradicionales, estéticos (cerámica o zafiro) y sistemas de alineadores invisibles de última generación.",
    duracion_minutos: 30,
    precio_base: 45000,
    categoria: "Estética",
    beneficios: [
      "Alineación perfecta para una sonrisa estética.",
      "Mejora la función masticatoria y previene desgastes.",
      "Facilita la higiene reduciendo el riesgo de caries y sarro.",
      "Opción de brackets imperceptibles u ortodoncia invisible."
    ],
    pasos: [
      "Estudio de ortodoncia completo (radiografías, fotos y modelos).",
      "Planificación digital del caso.",
      "Instalación de brackets o entrega de primeros alineadores.",
      "Controles mensuales de ajuste de fuerzas."
    ],
    faqs: [
      { q: "¿Cuál es la diferencia entre brackets e Invisalign?", a: "Los brackets son fijos y requieren ajustes metálicos. Los alineadores Invisalign son plásticos, transparentes, removibles para comer y prácticamente imperceptibles." },
      { q: "¿Cuánto dura un tratamiento promedio?", a: "La mayoría de los casos se resuelven entre 12 y 24 meses, dependiendo de la complejidad de la maloclusión." }
    ]
  }
};

const DEFAULT_MOCK = {
  nombre: "Tratamiento Dental",
  descripcion: "Tratamiento dental especializado en Clínica Dental Quantum.",
  descripcion_larga: "Tratamiento dental con tecnología de vanguardia y profesionales acreditados en Vitacura, Santiago de Chile.",
  duracion_minutos: 45,
  precio_base: 40000,
  categoria: "Odontología",
  beneficios: [
    "Atención personalizada por especialistas acreditados.",
    "Protocolos estrictos de bioseguridad.",
    "Uso de tecnología dental avanzada."
  ],
  pasos: [
    "Evaluación inicial y diagnóstico.",
    "Planificación del tratamiento.",
    "Ejecución clínica del procedimiento."
  ],
  faqs: [
    { q: "¿Cuáles son las formas de pago?", a: "Aceptamos tarjetas de crédito, débito, efectivo y transferencias electrónicas. Ofrecemos facilidades de pago para tratamientos complejos." }
  ]
};

// Generar rutas estáticas para compilación
export async function generateStaticParams() {
  return [
    { slug: "implantologia" },
    { slug: "ortodoncia" },
    { slug: "odontopediatria" },
    { slug: "periodoncia" },
    { slug: "endodoncia" },
    { slug: "cirugia" },
    { slug: "operatoria" },
    { slug: "anestesia-y-sedacion" },
    { slug: "rehabilitacion-oral" },
    { slug: "diseno-de-sonrisa" },
    { slug: "bruxismo" },
    { slug: "blanqueamiento" },
    { slug: "estetica-facial" }
  ];
}

// Generación de metadatos dinámicos
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  let nombre = slug.charAt(0).toUpperCase() + slug.slice(1);

  try {
    const dbEsp = await prisma.especialidad.findUnique({ where: { slug } });
    if (dbEsp) nombre = dbEsp.nombre;
  } catch {}

  return {
    title: `${nombre} | Clínica Dental Quantum Vitacura`,
    description: `Tratamiento de ${nombre} en Clínica Dental Quantum. Especialistas altamente calificados, tecnología avanzada y sedación en Vitacura, Santiago.`,
  };
}

export default async function EspecialidadLandingPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  let data = MOCK_ESPECIALIDADES_DETALLE[slug] || {
    ...DEFAULT_MOCK,
    nombre: slug.charAt(0).toUpperCase() + slug.slice(1).replace("-", " ")
  };

  try {
    const dbEsp = await prisma.especialidad.findUnique({
      where: { slug },
    });
    if (dbEsp) {
      const manualDetail = MOCK_ESPECIALIDADES_DETALLE[slug] || DEFAULT_MOCK;
      data = {
        nombre: dbEsp.nombre,
        descripcion: dbEsp.descripcion || dbEsp.nombre,
        descripcion_larga: dbEsp.descripcion_larga || dbEsp.descripcion || "",
        duracion_minutos: dbEsp.duracion_minutos,
        precio_base: dbEsp.precio_base,
        categoria: manualDetail.categoria,
        beneficios: manualDetail.beneficios,
        pasos: manualDetail.pasos,
        faqs: manualDetail.faqs,
      };
    }
  } catch {
    console.warn(`Database connection failed, serving mock data for specialty landing ${slug}`);
  }

  // Schema.org MedicalProcedure JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": data.nombre,
    "description": data.descripcion,
    "procedureType": {
      "@type": "MedicalProcedureType",
      "name": "Surgical"
    },
    "bodyLocation": "Mouth",
    "provider": {
      "@type": "Dentist",
      "name": "Clínica Dental Quantum",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Av. Kennedy 7100 Of. 706",
        "addressLocality": "Vitacura",
        "addressRegion": "Santiago",
        "addressCountry": "CL"
      }
    }
  };

  return (
    <div className="py-12 space-y-16">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="container mx-auto px-4 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2 space-y-4">
          <span className="text-xs font-bold text-brand-turquoise uppercase bg-brand-turquoise/10 px-2.5 py-1 rounded-full">
            {data.categoria}
          </span>
          <h1 className="font-heading text-4xl font-bold text-brand-navy">{data.nombre}</h1>
          <p className="text-slate-600 leading-relaxed text-sm md:text-base">
            {data.descripcion_larga}
          </p>
          <div className="pt-2 flex gap-4">
            <Link href={`/agendar?especialidad_id=${slug}`}>
              <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow-md">
                Agendar Evaluación
              </Button>
            </Link>
            <Link href="/contacto">
              <Button variant="outline">Resolver Dudas</Button>
            </Link>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor de Referencia</span>
          <span className="text-3xl font-extrabold text-brand-navy block">${data.precio_base.toLocaleString("es-CL")}</span>
          <span className="text-xs text-muted-foreground block">Duración: ~{data.duracion_minutos} minutos</span>
          <div className="text-[10px] text-gray-400 italic">Precios finales pueden variar sujeto a evaluación clínica.</div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-heading text-2xl font-bold text-brand-navy text-center mb-8">Beneficios del Tratamiento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.beneficios.map((b, idx) => (
              <div key={idx} className="flex gap-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                <span className="text-brand-turquoise text-lg">✔</span>
                <p className="text-slate-700 text-sm">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Paso a paso */}
      <section className="container mx-auto px-4 max-w-3xl space-y-8">
        <h2 className="font-heading text-2xl font-bold text-brand-navy text-center">¿En qué consiste el tratamiento?</h2>
        <div className="relative border-l-2 border-slate-200 pl-6 space-y-6">
          {data.pasos.map((p, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[31px] top-0.5 size-4 bg-brand-navy rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                {idx + 1}
              </div>
              <p className="text-slate-700 text-sm font-medium">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-3xl space-y-8">
        <h2 className="font-heading text-2xl font-bold text-brand-navy text-center">Preguntas Frecuentes</h2>
        <div className="space-y-6">
          {data.faqs.map((f, idx) => (
            <div key={idx} className="border border-border p-5 rounded-xl space-y-2 bg-white shadow-sm">
              <h4 className="font-heading font-bold text-brand-navy text-sm md:text-base">¿{f.q}</h4>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 max-w-3xl text-center space-y-4">
        <h3 className="font-heading text-xl md:text-2xl font-bold text-brand-navy">¿Listo para sonreír con confianza?</h3>
        <p className="text-muted-foreground text-sm">Reserva tu hora de evaluación online en pocos pasos.</p>
        <Link href={`/agendar?especialidad_id=${slug}`} className="inline-block mt-2">
          <Button size="lg" className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold px-8 h-12 shadow-md">
            Agenda tu Hora Online
          </Button>
        </Link>
      </section>
    </div>
  );
}
