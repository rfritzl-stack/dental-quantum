import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Especialidades Odontológicas | Clínica Dental Quantum",
  description: "Descubre las 13 especialidades de Clínica Dental Quantum, Vitacura. Implantología, ortodoncia, odontopediatría, sedación consciente y estética dental.",
};

const MOCK_ESPECIALIDADES = [
  {
    id: "1",
    nombre: "Implantología",
    slug: "implantologia",
    descripcion: "Reemplazo de piezas dentales perdidas con implantes de titanio.",
    precio_base: 450000,
    categoria: "rehabilitacion",
  },
  {
    id: "2",
    nombre: "Ortodoncia",
    slug: "ortodoncia",
    descripcion: "Corrección de la posición de los dientes y mordida con brackets o alineadores.",
    precio_base: 45000,
    categoria: "estetica",
  },
  {
    id: "3",
    nombre: "Odontopediatría",
    slug: "odontopediatria",
    descripcion: "Atención dental especializada y cercana para niños y bebés.",
    precio_base: 35000,
    categoria: "ninos",
  },
  {
    id: "4",
    nombre: "Periodoncia",
    slug: "periodoncia",
    descripcion: "Tratamiento de encías sangrantes, gingivitis y periodontitis.",
    precio_base: 40000,
    categoria: "prevencion",
  },
  {
    id: "5",
    nombre: "Endodoncia",
    slug: "endodoncia",
    descripcion: "Tratamiento de conductos para salvar dientes con caries profundas.",
    precio_base: 95000,
    categoria: "prevencion",
  },
  {
    id: "6",
    nombre: "Cirugía Oral",
    slug: "cirugia",
    descripcion: "Extracción de terceros molares (muelas del juicio) y cirugías complejas.",
    precio_base: 80000,
    categoria: "cirugia",
  },
  {
    id: "7",
    nombre: "Odontología Operatoria",
    slug: "operatoria",
    descripcion: "Restauración de caries con resinas estéticas y limpiezas dentales.",
    precio_base: 30000,
    categoria: "prevencion",
  },
  {
    id: "8",
    nombre: "Anestesia y Sedación",
    slug: "anestesia-y-sedacion",
    descripcion: "Tratamientos dentales sin dolor ni estrés con sedación consciente.",
    precio_base: 120000,
    categoria: "prevencion",
  },
  {
    id: "9",
    nombre: "Rehabilitación Oral",
    slug: "rehabilitacion-oral",
    descripcion: "Coronas, puentes y prótesis fijas o removibles de alta durabilidad.",
    precio_base: 220000,
    categoria: "rehabilitacion",
  },
  {
    id: "10",
    nombre: "Diseño de Sonrisa",
    slug: "diseno-de-sonrisa",
    descripcion: "Transformación estética dental completa con carillas de composite o porcelana.",
    precio_base: 350000,
    categoria: "estetica",
  },
  {
    id: "11",
    nombre: "Tratamiento de Bruxismo",
    slug: "bruxismo",
    descripcion: "Placas miorrelajantes para evitar el desgaste dental y dolor de mandíbula.",
    precio_base: 110000,
    categoria: "prevencion",
  },
  {
    id: "12",
    nombre: "Blanqueamiento Dental",
    slug: "blanqueamiento",
    descripcion: "Aclaramiento de tono dental en clínica con luz LED y gel activador.",
    precio_base: 150000,
    categoria: "estetica",
  },
  {
    id: "13",
    nombre: "Estética Facial",
    slug: "estetica-facial",
    descripcion: "Tratamientos rejuvenecedores complementarios como aplicación de bótox.",
    precio_base: 180000,
    categoria: "estetica",
  },
];

const CATEGORIAS_TIQUETAS: Record<string, string> = {
  estetica: "Estética",
  rehabilitacion: "Rehabilitación",
  prevencion: "Prevención & Cuidado",
  cirugia: "Cirugía",
  ninos: "Niños / Odontopediatría",
};

// Mapeo manual de categorías para mock si no se define en DB
function getCategoria(slug: string): string {
  const item = MOCK_ESPECIALIDADES.find((e) => e.slug === slug);
  return item ? item.categoria : "prevencion";
}

export default async function EspecialidadesHubPage() {
  let especialidades = MOCK_ESPECIALIDADES;

  try {
    const dbEsp = await prisma.especialidad.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    });
    if (dbEsp && dbEsp.length > 0) {
      especialidades = dbEsp.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        slug: e.slug,
        descripcion: e.descripcion || "",
        precio_base: e.precio_base,
        categoria: getCategoria(e.slug),
      }));
    }
  } catch (error) {
    console.warn("DB Connection failed, using mock data for especialidades hub:", error);
  }

  return (
    <div className="py-12 container mx-auto px-4 max-w-5xl space-y-12">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="font-heading text-4xl font-bold text-brand-navy">Especialidades</h1>
        <p className="text-muted-foreground">
          Ofrecemos 13 especialidades odontológicas y estéticas para resolver cualquier problema bucal en un solo lugar.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {especialidades.map((e) => (
          <div key={e.id} className="border border-border rounded-xl p-6 bg-white hover:shadow-lg transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-turquoise bg-brand-turquoise/10 px-2.5 py-1 rounded-full">
                {CATEGORIAS_TIQUETAS[e.categoria] || "Dental"}
              </span>
              <h3 className="font-heading text-xl font-bold text-brand-navy">{e.nombre}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {e.descripcion}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Desde</span>
                <span className="text-base font-bold text-brand-navy">
                  ${e.precio_base.toLocaleString("es-CL")}
                </span>
              </div>
              <Link href={`/especialidades/${e.slug}`}>
                <Button variant="outline" size="sm" className="text-xs border-brand-navy hover:bg-brand-navy hover:text-white transition-colors">
                  Ver Detalles
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
