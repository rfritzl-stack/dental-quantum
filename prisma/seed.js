const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando la siembra de base de datos (seeding)...");

  // 1. Limpiar datos existentes (opcional pero útil en desarrollo)
  await prisma.lead.deleteMany({});
  await prisma.sesion.deleteMany({});
  await prisma.agenda.deleteMany({});
  await prisma.tratamiento.deleteMany({});
  await prisma.cobro.deleteMany({});
  await prisma.archivo.deleteMany({});
  await prisma.formularioGenerado.deleteMany({});
  await prisma.formularioSeguro.deleteMany({});
  await prisma.whatsappLista.deleteMany({});
  await prisma.paciente.deleteMany({});
  await prisma.profesional.deleteMany({});
  await prisma.especialidad.deleteMany({});

  console.log("Tablas limpiadas.");

  // 2. Crear Especialidades
  const especialidadesData = [
    {
      nombre: "Implantología",
      slug: "implantologia",
      descripcion: "Reemplazo de piezas dentales perdidas con implantes de titanio.",
      descripcion_larga: "La implantología dental es la especialidad dedicada al reemplazo de dientes perdidos mediante la colocación de implantes de titanio integrados en el hueso maxilar o mandibular, sobre los cuales se fijan coronas o prótesis definitivas de aspecto natural.",
      duracion_minutos: 60,
      precio_base: 450000,
      icono_slug: "implant",
      activa: true,
      orden: 1,
    },
    {
      nombre: "Ortodoncia",
      slug: "ortodoncia",
      descripcion: "Corrección de la posición de los dientes y mordida con brackets o alineadores.",
      descripcion_larga: "Especialidad dedicada a corregir la malposición de los dientes y las alteraciones de la mordida. Ofrecemos tratamientos con brackets metálicos tradicionales, estéticos (cerámica o zafiro) y sistemas de alineadores invisibles de última generación.",
      duracion_minutos: 30,
      precio_base: 45000,
      icono_slug: "brackets",
      activa: true,
      orden: 2,
    },
    {
      nombre: "Odontopediatría",
      slug: "odontopediatria",
      descripcion: "Atención dental especializada y cercana para niños y bebés.",
      descripcion_larga: "Cuidado de la salud bucal de niños y adolescentes. Nos enfocamos en la prevención y tratamientos en un ambiente adaptado, utilizando técnicas lúdicas para evitar el miedo al dentista desde la infancia.",
      duracion_minutos: 30,
      precio_base: 35000,
      icono_slug: "child",
      activa: true,
      orden: 3,
    },
    {
      nombre: "Periodoncia",
      slug: "periodoncia",
      descripcion: "Tratamiento de encías sangrantes, gingivitis y periodontitis.",
      descripcion_larga: "Diagnóstico y tratamiento de las enfermedades que afectan a las encías y los tejidos de soporte del diente. Especialistas en detener la gingivitis y periodontitis (pérdida de hueso) para salvar tus piezas dentales.",
      duracion_minutos: 45,
      precio_base: 40000,
      icono_slug: "gums",
      activa: true,
      orden: 4,
    },
    {
      nombre: "Endodoncia",
      slug: "endodoncia",
      descripcion: "Tratamiento de conductos para salvar dientes con caries profundas.",
      descripcion_larga: "Procedimiento comúnmente conocido como tratamiento de conducto. Permite salvar piezas dentales cuya pulpa (nervio) se encuentra dañada o infectada debido a caries profundas o traumatismos, aliviando el dolor por completo.",
      duracion_minutos: 60,
      precio_base: 95000,
      icono_slug: "root",
      activa: true,
      orden: 5,
    },
    {
      nombre: "Cirugía Oral",
      slug: "cirugia",
      descripcion: "Extracción de terceros molares (muelas del juicio) y cirugías complejas.",
      descripcion_larga: "Cirugías de cavidad bucal, incluyendo la extracción compleja de muelas del juicio impactadas, fenestraciones para ortodoncia, biopsias y regularizaciones de reborde óseo, bajo anestesia local o sedación.",
      duracion_minutos: 60,
      precio_base: 80000,
      icono_slug: "surgery",
      activa: true,
      orden: 6,
    },
    {
      nombre: "Odontología Operatoria",
      slug: "operatoria",
      descripcion: "Restauración de caries con resinas estéticas y limpiezas dentales.",
      descripcion_larga: "Especialidad enfocada en restaurar la salud de las piezas dentales afectadas por caries, fracturas o desgastes, utilizando resinas compuestas de alta estética y biocompatibilidad que se mimetizan con el diente.",
      duracion_minutos: 30,
      precio_base: 30000,
      icono_slug: "tooth",
      activa: true,
      orden: 7,
    },
    {
      nombre: "Anestesia y Sedación",
      slug: "anestesia-y-sedacion",
      descripcion: "Tratamientos dentales sin dolor ni estrés con sedación consciente.",
      descripcion_larga: "Protocolos avanzados de sedación consciente con óxido nitroso o sedación intravenosa supervisada por anestesiólogo, ideal para pacientes con fobia dental, ansiedad o tratamientos extensos.",
      duracion_minutos: 60,
      precio_base: 120000,
      icono_slug: "shield",
      activa: true,
      orden: 8,
    },
    {
      nombre: "Rehabilitación Oral",
      slug: "rehabilitacion-oral",
      descripcion: "Coronas, puentes y prótesis fijas o removibles de alta durabilidad.",
      descripcion_larga: "Restauración integral de la función masticatoria y la estética mediante coronas sobre implantes, puentes fijos, carillas de porcelana y prótesis parciales o completas removibles de alta gama.",
      duracion_minutos: 60,
      precio_base: 220000,
      icono_slug: "crown",
      activa: true,
      orden: 9,
    },
    {
      nombre: "Diseño de Sonrisa",
      slug: "diseno-de-sonrisa",
      descripcion: "Transformación estética dental completa con carillas de composite o porcelana.",
      descripcion_larga: "Estudio estético computarizado de tu rostro para diseñar una sonrisa perfecta y armónica. Realizado mediante carillas de composite de alta gama o carillas cerámicas ultrafinas sin desgaste dentario.",
      duracion_minutos: 90,
      precio_base: 350000,
      icono_slug: "sparkles",
      activa: true,
      orden: 10,
    },
    {
      nombre: "Tratamiento de Bruxismo",
      slug: "bruxismo",
      descripcion: "Placas miorrelajantes para evitar el desgaste dental y dolor de mandíbula.",
      descripcion_larga: "Confección de planos de alivio oclusal (placas miorrelajantes) rígidas hechas a medida para proteger los dientes del desgaste nocturno, relajar la musculatura maxilar y disminuir dolores de cabeza y cuello.",
      duracion_minutos: 45,
      precio_base: 110000,
      icono_slug: "shield-alert",
      activa: true,
      orden: 11,
    },
    {
      nombre: "Blanqueamiento Dental",
      slug: "blanqueamiento",
      descripcion: "Aclaramiento de tono dental en clínica con luz LED y gel activador.",
      descripcion_larga: "Procedimiento estético que aclara varios tonos el color de tus dientes en una sola sesión en clínica, utilizando geles aclaradores de peróxido de hidrógeno activados por luz fría, sin dañar el esmalte.",
      duracion_minutos: 60,
      precio_base: 150000,
      icono_slug: "sun",
      activa: true,
      orden: 12,
    },
    {
      nombre: "Estética Facial",
      slug: "estetica-facial",
      descripcion: "Tratamientos rejuvenecedores complementarios como aplicación de bótox.",
      descripcion_larga: "Tratamientos estéticos complementarios a tu sonrisa, incluyendo la aplicación de toxina botulínica (bótox) para arrugas de expresión y bruxismo muscular, y rellenos con ácido hialurónico.",
      duracion_minutos: 45,
      precio_base: 180000,
      icono_slug: "user",
      activa: true,
      orden: 13,
    },
  ];

  const especialidadesMap = {};
  for (const esp of especialidadesData) {
    const created = await prisma.especialidad.create({ data: esp });
    especialidadesMap[created.slug] = created.id;
  }
  console.log("13 especialidades creadas exitosamente.");

  // 3. Crear Profesionales
  // Horarios de atención: Lunes a Viernes de 09:00 a 13:00 y de 14:00 a 18:00
  const horarioBaseComun = [
    { day: 1, start: "09:00", end: "13:00" },
    { day: 1, start: "14:00", end: "18:00" },
    { day: 2, start: "09:00", end: "13:00" },
    { day: 2, start: "14:00", end: "18:00" },
    { day: 3, start: "09:00", end: "13:00" },
    { day: 3, start: "14:00", end: "18:00" },
    { day: 4, start: "09:00", end: "13:00" },
    { day: 4, start: "14:00", end: "18:00" },
    { day: 5, start: "09:00", end: "13:00" },
    { day: 5, start: "14:00", end: "17:00" }
  ];

  const prof1 = await prisma.profesional.create({
    data: {
      nombre: "Andrés",
      apellido: "Silva",
      email: "asilva@dentalquantum.cl",
      especialidades: ["implantologia", "cirugia", "rehabilitacion-oral", "diseno-de-sonrisa", "anestesia-y-sedacion", "operatoria", "blanqueamiento", "bruxismo"],
      color_agenda: "#0B1F3A",
      activo: true,
      horario_base: horarioBaseComun,
      calendario_google_id: "asilva_cal@gmail.com"
    }
  });

  const prof2 = await prisma.profesional.create({
    data: {
      nombre: "Claudia",
      apellido: "Toledo",
      email: "ctoledo@dentalquantum.cl",
      especialidades: ["ortodoncia", "odontopediatria", "periodoncia", "endodoncia", "operatoria", "blanqueamiento", "estetica-facial", "bruxismo"],
      color_agenda: "#00C4B4",
      activo: true,
      horario_base: horarioBaseComun,
      calendario_google_id: "ctoledo_cal@gmail.com"
    }
  });

  console.log("Profesionales creados:");
  console.log(`- Dr. Andrés Silva (ID: ${prof1.id})`);
  console.log(`- Dra. Claudia Toledo (ID: ${prof2.id})`);

  console.log("¡Siembra de datos (seeding) completada con éxito!");
}

main()
  .catch((e) => {
    console.error("Error durante el seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
