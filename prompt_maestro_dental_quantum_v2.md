  
**PROMPT MAESTRO v2.0**

Plataforma Digital Integral

*Clínica Dental Quantum — Vitacura, Santiago de Chile*

Junio 2026

Contexto clínico: 1-2 profesionales • Vitacura • 13 especialidades

Sitio actual: www.dentalquantum.cl (Wix 2015, sin backend)

# **0\. CÓMO USAR ESTE PROMPT**

Este documento es un prompt maestro para ser entregado a un agente de desarrollo (Google Antigravity, Cursor, o similar) o a un equipo técnico. Contiene todas las decisiones de arquitectura, stack, flujos y reglas de negocio necesarias para construir el sistema completo sin ambigüedades.

**Reglas de uso:**

* Ejecutar las secciones en orden. Cada sección depende de las anteriores.

* No proponer tecnologías alternativas salvo conflicto técnico bloqueante documentado.

* Cada módulo tiene criterios de aceptación explícitos. No marcar como completo sin cumplirlos.

* Las restricciones absolutas (sección 12\) no son negociables.

# **1\. OBJETIVO MAESTRO Y ALCANCE**

Construir desde cero un ecosistema digital para Clínica Dental Quantum (Av. Kennedy 7100 Of. 706, Vitacura, Santiago), reemplazando el sitio Wix actual por una plataforma moderna con dos capas integradas:

* CAPA 1 — Sitio público: capta leads, genera necesidad de agendar, proyecta tecnología y confianza.

* CAPA 2 — Back-office operacional: gestiona pacientes, agenda, cobros, tratamientos, archivos, seguros y comunicación.

Ambas capas comparten la misma base de datos Supabase y autenticación. Son el mismo proyecto Next.js, con rutas protegidas para el back-office.

*⚠ Punto de partida de datos: la clínica NO tiene historial de pacientes en formato digital exportable. El sistema parte desde cero. El módulo de importación (sección 9\) existe para uso futuro.*

# **2\. STACK TÉCNICO DEFINITIVO**

Usar exactamente este stack. No sustituir componentes sin justificación técnica escrita.

## **2.1 Frontend**

* Next.js 14 con App Router y React Server Components

* TypeScript estricto (strict: true en tsconfig.json)

* Tailwind CSS 3 con configuración de diseño personalizada

* shadcn/ui para componentes base (botón, input, dialog, tabs, calendar, table)

* Framer Motion para animaciones de conversión en el sitio público

* React Hook Form \+ Zod para todos los formularios con validación end-to-end

* TanStack Query (React Query) para fetching y caché en cliente

* react-pdf para visualización de PDFs de formularios de seguros en navegador

## **2.2 Backend / API**

* Next.js API Routes (/app/api/...) para todos los endpoints

* Supabase como BaaS: PostgreSQL 15 \+ Row Level Security \+ Storage \+ Auth \+ Edge Functions

* Prisma ORM para migraciones tipadas y acceso a base de datos desde Next.js

* pdf-lib (npm) para llenado programático de campos en PDFs de seguros

* xlsx (SheetJS) para importación de Excel de pacientes

* marked o remark para importación de archivos .md

## **2.3 Infraestructura y Hosting**

* Vercel Pro para el frontend Next.js (CDN global, preview deploys, edge functions)

* Supabase Pro cloud, región us-east-1 (menor latencia desde Chile que sa-east-1)

* Cloudflare: DNS autoritativo \+ proxy \+ WAF básico gratuito

* Dominio: dentalquantum.cl — mantener, migrar DNS a Cloudflare

* SSL: Cloudflare Full Strict \+ certificado automático Vercel

* Cloudinary (plan free) para optimización de imágenes clínicas y fotografías

## **2.4 Integraciones externas**

* SII Chile API (REST) para registro y consulta de boletas electrónicas emitidas

* Google Calendar API v3 para sincronización bidireccional de agenda

* Resend para emails transaccionales (confirmaciones, avisos, documentos)

* Sentry para monitoreo de errores en producción

* Plausible Analytics (sin cookies, GDPR-compatible) para métricas del sitio público

## **2.5 Módulo WhatsApp — Fase 1 (semi-manual)**

En Fase 1 NO hay integración directa con WhatsApp API. El módulo genera listas y mensajes pregenerados para uso manual por la secretaria. Ver sección 8\.

## **2.6 Herramientas de desarrollo**

* pnpm como package manager

* ESLint \+ Prettier \+ Husky pre-commit hooks

* GitHub \+ GitHub Actions: CI/CD automático (lint → typecheck → test → deploy Vercel)

* Vitest para tests unitarios; Playwright para E2E críticos

# **3\. ARQUITECTURA DE BASE DE DATOS**

Todo en Supabase PostgreSQL 15\. Aplicar RLS en cada tabla. Usar UUID como PK en todas las tablas. Prefijo dq\_ en todas las tablas para evitar conflictos.

## **3.1 Tablas Core**

**\[ DQ\_PACIENTES \]**

* id uuid PK, rut text UNIQUE NOT NULL, nombre text, apellido text, email text, telefono text, fecha\_nacimiento date, sexo text, direccion text, prevision text, seguro\_complementario text, notas\_generales text, activo boolean DEFAULT true, creado\_en timestamptz DEFAULT now(), actualizado\_en timestamptz

**\[ DQ\_PROFESIONALES \]**

* id uuid PK, nombre text, apellido text, especialidades text\[\], email text, calendario\_google\_id text, color\_agenda text, activo boolean, horario\_base jsonb, creado\_en timestamptz

**\[ DQ\_ESPECIALIDADES \]**

* id uuid PK, nombre text, slug text UNIQUE, descripcion text, descripcion\_larga text, duracion\_minutos int, precio\_base int, icono\_slug text, activa boolean, orden int

**\[ DQ\_AGENDAS \]**

* id uuid PK, paciente\_id uuid FK → dq\_pacientes, profesional\_id uuid FK → dq\_profesionales, especialidad\_id uuid FK → dq\_especialidades, fecha\_hora\_inicio timestamptz NOT NULL, fecha\_hora\_fin timestamptz NOT NULL, estado text CHECK (estado IN ('pendiente','confirmada','en\_curso','realizada','cancelada','no\_show')), motivo\_consulta text, notas\_recepcion text, google\_event\_id text, creado\_en timestamptz, actualizado\_en timestamptz

**\[ DQ\_TRATAMIENTOS \]**

* id uuid PK, paciente\_id uuid FK, profesional\_id uuid FK, especialidad\_id uuid FK, nombre\_tratamiento text, descripcion text, fecha\_inicio date, fecha\_fin\_estimada date, sesiones\_estimadas int, sesiones\_realizadas int DEFAULT 0, estado text CHECK (estado IN ('diagnostico','plan\_aprobado','en\_proceso','mantenimiento','completado','suspendido')), plan\_detalle jsonb, costo\_total int, creado\_en timestamptz

**\[ DQ\_SESIONES \]**

* id uuid PK, tratamiento\_id uuid FK, agenda\_id uuid FK, numero\_sesion int, notas\_clinicas text, hallazgos text, proxima\_accion text, fecha\_registro timestamptz DEFAULT now()

**\[ DQ\_COBROS \]**

* id uuid PK, paciente\_id uuid FK, agenda\_id uuid FK NULLABLE, tratamiento\_id uuid FK NULLABLE, concepto text, monto int NOT NULL, metodo\_pago text CHECK (metodo IN ('pos\_fisico','transferencia','efectivo','seguro')), estado text CHECK (estado IN ('pendiente','pagado','anulado')), folio\_boleta text, numero\_boleta\_sii text, fecha\_emision timestamptz, datos\_pos jsonb, creado\_en timestamptz

**\[ DQ\_BOLETAS\_SII \]**

* id uuid PK, cobro\_id uuid FK, rut\_emisor text, rut\_receptor text, razon\_social\_receptor text, folio int, tipo\_dte int DEFAULT 39, monto\_neto int, iva int, monto\_total int, xml\_sii text, pdf\_url text, estado\_sii text, timbre text, fecha\_emision timestamptz, creado\_en timestamptz

**\[ DQ\_ARCHIVOS \]**

* id uuid PK, paciente\_id uuid FK, tratamiento\_id uuid FK NULLABLE, tipo text CHECK (tipo IN ('radiografia','fotografia','consentimiento','documento','resultado')), url\_storage text NOT NULL, nombre\_archivo text, descripcion text, subido\_por uuid FK → dq\_profesionales, fecha\_subida timestamptz DEFAULT now()

**\[ DQ\_FORMULARIOS\_SEGUROS \]**

* id uuid PK, aseguradora text NOT NULL, nombre\_formulario text, version text, pdf\_template\_url text, campos\_mapeados jsonb, activo boolean DEFAULT true, subido\_por uuid FK, fecha\_subida timestamptz

**\[ DQ\_FORMULARIOS\_GENERADOS \]**

* id uuid PK, formulario\_id uuid FK → dq\_formularios\_seguros, paciente\_id uuid FK, cobro\_id uuid FK NULLABLE, datos\_completados jsonb, pdf\_generado\_url text, estado text CHECK (estado IN ('borrador','completo','enviado')), creado\_por uuid FK, creado\_en timestamptz

**\[ DQ\_WHATSAPP\_LISTA \]**

* id uuid PK, agenda\_id uuid FK, paciente\_nombre text, paciente\_telefono text, mensaje\_generado text, fecha\_cita date, estado\_envio text DEFAULT 'pendiente', enviado\_en timestamptz NULLABLE, creado\_en timestamptz

**\[ DQ\_LEADS \]**

* id uuid PK, nombre text, email text, telefono text, especialidad\_interes text, mensaje text, origen text, estado text DEFAULT 'nuevo', notas text, creado\_en timestamptz

**\[ DQ\_AUDIT\_LOG \]**

* id uuid PK, usuario\_id uuid, accion text, tabla\_afectada text, registro\_id uuid, datos\_anteriores jsonb, datos\_nuevos jsonb, ip text, creado\_en timestamptz DEFAULT now()

## **3.2 Reglas RLS**

* PACIENTE: SELECT en sus propios registros via auth.uid() \= paciente.supabase\_uid

* PROFESIONAL: SELECT/UPDATE en agendas y tratamientos donde profesional\_id \= su id

* RECEPCIONISTA: SELECT/INSERT/UPDATE en agendas, cobros, pacientes, leads. Sin acceso a notas\_clinicas

* ADMIN: ALL en todas las tablas

* ANON (público): INSERT solo en dq\_leads

# **4\. MÓDULO 1 — SITIO PÚBLICO: DISEÑO Y ESTRUCTURA COMPLETA**

## **4.1 Identidad Visual**

* Paleta primaria: Blanco clínico \#FFFFFF \+ Azul marino \#0B1F3A \+ Turquesa \#00C4B4

* Acento CTA: Dorado \#D4900A para botones de acción principal (agenda, contacto)

* Tipografía: Inter (cuerpo) \+ Sora o Clash Display (títulos grandes hero)

* Estilo visual: premium, limpio, tecnológico pero cálido — no frío ni excesivamente clínico

* Imágenes: fotografía real de la clínica y profesionales. Prohibido stock genérico dental.

* Mobile-first: el 70%+ del tráfico dental en Chile es desde teléfono móvil

## **4.2 Mapa de Sitio Completo**

Implementar exactamente estas rutas públicas:

1. / — Home

2. /quienes-somos — El equipo y la clínica

3. /especialidades — Hub de todas las especialidades

4. /especialidades/implantologia — Landing individual (repetir para las 13 especialidades)

5. /especialidades/ortodoncia

6. /especialidades/odontopediatria

7. /especialidades/periodoncia

8. /especialidades/endodoncia

9. /especialidades/cirugia

10. /especialidades/operatoria

11. /especialidades/anestesia-y-sedacion

12. /especialidades/rehabilitacion-oral

13. /especialidades/diseno-de-sonrisa

14. /especialidades/bruxismo

15. /especialidades/blanqueamiento

16. /especialidades/estetica-facial

17. /testimonios — Casos reales y Google Reviews

18. /agendar — Wizard de agendamiento online

19. /contacto — Formulario, mapa, teléfonos

20. /blog — Índice de artículos educativos (MDX)

21. /blog/\[slug\] — Artículo individual

22. /portal — Login de pacientes

23. /portal/dashboard — Resumen del paciente autenticado

24. /portal/citas — Próximas citas e historial

25. /portal/tratamientos — Estado y progreso

26. /portal/documentos — Archivos, radiografías, formularios

27. /portal/agendar — Agendar nueva hora desde el portal

28. /privacidad — Política de privacidad (Ley 19.628)

29. /terminos — Términos de uso

## **4.3 Especificación Detallada por Página**

### **HOME (/)**

* HERO: video loop de fondo (instalaciones/sonrisas) o imagen de alta calidad. Headline emocional principal. Subheadline con propuesta de valor. CTA primario: botón dorado ‘Agenda tu hora’. CTA secundario: ‘Conoce nuestro equipo’. Animación Framer Motion al cargar.

* BARRA SOCIAL PROOF: contador animado — \+2.000 pacientes | 10 años | 5 estrellas Google | 13 especialidades. Fondo oscuro contrasta con hero.

* POR QUÉ QUANTUM: 3 cards con ícono animado, título y descripción breve. Diferenciadores: Sedación consciente, Tecnología de última generación, Equipo acreditado en cada especialidad.

* ESPECIALIDADES: grid 3x4 o 4x4 responsive. Cada card: ícono SVG, nombre especialidad, descripción 1 línea, precio referencial desde $XX.XXX, botón ‘Ver más’. Hover con escala y sombra.

* ANTES/DESPUÉS: sección con slider comparador (react-compare-slider) de casos reales con consentimiento. Mínimo 3 casos: implantes, ortodoncia, diseño de sonrisa.

* TESTIMONIOS: carrusel automático (auto-scroll pausable) con foto circular, nombre, tratamiento realizado, texto y 5 estrellas. Mínimo 8 testimonios reales.

* CTA CENTRAL: banda de color con texto grande y botón de agenda. Fondo turquesa o azul marino.

* FORMULARIO LEAD RÁPIDO: nombre \+ teléfono \+ especialidad de interés \+ botón. Sin login. Guarda en dq\_leads. Confirmación por email automático (Resend).

* MAPA \+ DATOS: Google Maps embebido con pin en Av. Kennedy 7100, Of. 706, Vitacura. Teléfonos, email, horario.

* WhatsApp FAB: botón flotante verde WhatsApp en mobile siempre visible. Abre chat directo con mensaje pre-llenado.

### **QUIÉNES SOMOS (/quienes-somos)**

* Historia de la clínica: timeline visual desde fundación (2015) hasta hoy con hitos.

* Misión, visión y valores en cards visuales.

* Cards de profesionales: foto profesional, nombre, título, especialidades, formación académica, acreditaciones. Botón ‘Agendar con \[nombre\]’ directo al wizard.

* Instalaciones: galería de fotos de la clínica (sala de espera, boxes, equipamiento). Lightbox al hacer clic.

* Certificaciones y acreditaciones: logos con tooltips explicativos.

### **ESPECIALIDADES HUB (/especialidades)**

* Grid visual de las 13 especialidades con imagen de fondo, nombre, descripción breve y precio referencial.

* Filtro por categoría: Estética | Rehabilitación | Prevención | Cirugía | Niños.

* CTA en cada card: ‘Quiero saber más’ → landing individual.

### **LANDING INDIVIDUAL DE ESPECIALIDAD (/especialidades/\[slug\])**

* Generadas dinámicamente desde la tabla dq\_especialidades vía generateStaticParams.

* Estructura de cada landing: hero con imagen, descripción completa, beneficios (lista visual), ¿en qué consiste el tratamiento? (paso a paso), precios referenciales, FAQs (5-8 preguntas, schema FAQ para SEO), testimonios filtrados por esta especialidad, profesional que la realiza, CTA de agenda.

* Schema.org: MedicalProcedure para cada especialidad.

### **TESTIMONIOS (/testimonios)**

* Grid de testimonios con filtro por especialidad.

* Integración Google Places API para mostrar reviews reales en tiempo real.

* Casos documentados con foto antes/después, descripción del tratamiento y duración.

### **BLOG (/blog y /blog/\[slug\])**

* Artículos en formato MDX guardados en /content/blog/.

* Índice con filtro por categoría: cuidado bucal, ortodoncia, implantes, estética, noticias.

* Cada artículo: metadata (título, descripción, fecha, categoría, imagen OG), contenido MDX, CTA al final apuntando a especialidad relacionada.

* Mínimo 6 artículos iniciales para lanzamiento.

### **CONTACTO (/contacto)**

* Formulario: nombre, teléfono, email, mensaje, especialidad de interés. Guarda en dq\_leads.

* Google Maps embebido. Datos completos de contacto.

* Horarios de atención.

## **4.4 SEO Técnico**

* generateMetadata dinámico por página en Next.js App Router

* Schema.org: LocalBusiness, Dentist, MedicalOrganization, FAQPage, MedicalProcedure por especialidad

* next-sitemap para sitemap.xml y robots.txt automáticos

* Open Graph y Twitter Cards con imagen personalizada por página

* Core Web Vitals objetivo: LCP \< 2.5s, CLS \< 0.1 en mobile

* next/image para todas las imágenes con lazy loading y formatos AVIF/WebP

* Canonical URLs en todas las páginas

# **5\. MÓDULO 2 — AGENDAMIENTO ONLINE**

## **5.1 Flujo del Wizard (/agendar)**

Wizard de 4 pasos con persistencia en React state \+ sessionStorage. Cada paso valida antes de avanzar.

30. PASO 1 — Especialidad: grid visual de las 13 especialidades con duración y precio referencial. Selección obligatoria.

31. PASO 2 — Profesional \+ Fecha/Hora: selector de profesional (si hay más de uno disponible para esa especialidad). Calendario visual con días disponibles resaltados. Al seleccionar día, mostrar slots horarios disponibles en grid. Slots de 30 o 60 min según especialidad.

32. PASO 3 — Datos del paciente: RUT (con validación de dígito verificador chileno), nombre, apellido, teléfono, email, primera vez sí/no, cómo nos encontró (dropdown), comentario opcional. Checkbox de aceptación de términos y política de privacidad (Ley 19.628) con timestamp e IP guardados.

33. PASO 4 — Confirmación: resumen completo de la cita. Botón ‘Confirmar hora’. Al confirmar: crear registro en dq\_agendas, crear evento en Google Calendar del profesional, enviar email de confirmación al paciente (Resend), agregar a dq\_whatsapp\_lista para lista del día, mostrar pantalla de éxito con número de cita y botón ‘Añadir a Google Calendar’.

## **5.2 Motor de Disponibilidad**

* Tabla dq\_disponibilidad\_base: profesional\_id, dia\_semana (0-6), hora\_inicio time, hora\_fin time, duracion\_slot\_minutos int. Cargada por admin.

* Tabla dq\_bloqueos: profesional\_id, fecha\_inicio timestamptz, fecha\_fin timestamptz, motivo text. Para vacaciones, licencias, horas bloqueadas manualmente.

* Endpoint GET /api/disponibilidad?profesional=X\&fecha=Y\&especialidad=Z: calcula slots libres restando agendas existentes y bloqueos activos.

* Regla de corte: no mostrar slots con menos de 2 horas de anticipación (configurable en env var AGENDA\_MINUTOS\_ANTICIPACION).

* Sincronización Google Calendar: al crear agenda → crear evento en Google Calendar del profesional. Al cancelar → eliminar evento. Webhook de Google Calendar → /api/webhooks/google-calendar para detectar cambios externos.

## **5.3 Gestión de Agenda desde Back-office**

* Vista semanal estilo calendario (tipo Google Calendar) filtrable por profesional.

* La secretaria puede: crear citas manualmente, mover citas (drag & drop), cancelar con motivo, marcar como no-show, agregar bloqueos (vacaciones, horas reservadas).

* Configuración de horario base por profesional: días de la semana, hora inicio/fin, duración de slots. Más excepciones puntuales (días específicos con horario diferente).

# **6\. MÓDULO 3 — COBROS, POS FÍSICO Y BOLETAS ELECTRÓNICAS SII**

## **6.1 Contexto del flujo de cobro**

La clínica usa terminal POS físico para cobro en el local y emite boletas electrónicas directamente al SII (sin intermediario). El sistema NO procesa pagos online con tarjeta. El módulo de cobros registra y consolida la información generada por esos dos canales.

## **6.2 Registro de Cobro desde POS Físico**

Flujo para la secretaria al cerrar una atención:

34. Seleccionar paciente y cita asociada.

35. Ingresar monto cobrado, método de pago (POS físico | transferencia | efectivo | seguro complementario).

36. Si fue POS físico: ingresar el número de autorización del comprobante, últimos 4 dígitos de tarjeta, banco (datos del voucher físico). Guardar en campo datos\_pos jsonb.

37. Si fue transferencia: ingresar número de operación bancaria.

38. Guardar cobro en dq\_cobros con estado ‘pagado’.

39. Generar boleta electrónica (ver 6.3).

## **6.3 Integración Boleta Electrónica SII**

La clínica emite boletas de honorarios (tipo DTE 39\) directamente al SII. El sistema debe:

* Conectar a la API REST del SII usando certificado digital de la empresa (RUT y clave privada del contribuyente).

* Endpoint POST /api/boletas/emitir: recibe cobro\_id, construye el XML DTE 39, firma con certificado, envía a SII, guarda respuesta (folio, timbre, PDF) en dq\_boletas\_sii.

* Obtener folio desde el CAF (Código de Autorización de Folios) ya obtenido por la clínica en SII.cl. Guardar CAFs en Supabase Storage (acceso solo admin).

* Generar PDF de la boleta con el timbre electrónico (código QR del SII) usando pdf-lib.

* Guardar PDF en Supabase Storage y URL en dq\_boletas\_sii.pdf\_url.

* Enviar boleta al email del paciente automáticamente vía Resend.

* Vista de historial de boletas emitidas con filtro por fecha, profesional, monto. Descarga individual de PDF.

*⚠ El certificado digital del SII NUNCA debe estar en el código. Guardar en Supabase Vault o en variable de entorno cifrada en Vercel. El desarrollador debe solicitar al dueño de la clínica el archivo .p12 y la clave.*

*⚠ Ambiente de pruebas SII: usar https://maullin.sii.cl para desarrollo. Producción: https://palena.sii.cl. La URL debe ser configurable vía env var SII\_ENVIRONMENT.*

## **6.4 Pagos con Seguro Complementario**

* Método de pago ‘seguro’ en dq\_cobros: registrar aseguradora, número de póliza del paciente, monto cubierto y monto copago del paciente.

* Asociar automáticamente el cobro al formulario de seguro generado (dq\_formularios\_generados) si existe.

* Boleta: emitir a nombre del paciente por el monto total; el cobro al seguro es externo al sistema.

# **7\. MÓDULO 4 — FORMULARIOS DE SEGUROS COMPLEMENTARIOS**

## **7.1 Contexto**

Los seguros complementarios de salud (Consalud, Banmédica, Colmena, Cruz Blanca, Vida Cámara, MetLife, etc.) requieren que el paciente presente un formulario de reembolso completado con los datos de la prestación médica. La secretaria gestiona este proceso. El sistema permite cargar y prellenar estos formularios.

## **7.2 Carga de Plantillas PDF**

La secretaria o admin puede cargar nuevas plantillas en cualquier momento:

40. Ir a Back-office → Seguros → Plantillas → Nueva plantilla.

41. Ingresar: nombre de la aseguradora, nombre del formulario, versión, subir archivo PDF original.

42. El sistema analiza el PDF con pdf-lib para detectar campos de formulario rellenables (AcroForm). Si el PDF tiene campos, mapearlos automáticamente. Si es PDF escaneado sin campos, mostrar advertencia: ‘Este PDF no tiene campos rellenables. Será necesario usar la versión con campos AcroForm o aplanar los datos encima del PDF.’

43. El admin mapea manualmente los campos del formulario a los datos del sistema mediante un editor de mapeo: campo\_pdf\_id → fuente\_dato (ej: paciente.nombre, cobro.monto, prestacion.codigo).

44. Guardar plantilla en dq\_formularios\_seguros con campos\_mapeados jsonb.

## **7.3 Generación de Formulario Prellenado**

Desde la ficha del paciente o desde un cobro:

45. Seleccionar ‘Generar formulario de seguro’.

46. Elegir aseguradora y plantilla de formulario.

47. El sistema prellenará automáticamente todos los campos mapeados con datos del paciente y del cobro.

48. La secretaria completa los campos que faltan directamente en la interfaz (formulario web side-by-side con preview del PDF).

49. Vista previa del PDF prellenado en tiempo real con react-pdf.

50. Botón ‘Generar PDF final’: aplica los datos al PDF original con pdf-lib, guarda en Supabase Storage, guarda registro en dq\_formularios\_generados.

51. Opciones de salida: descargar PDF, enviar por email al paciente, imprimir.

## **7.4 Campos estándar del sistema para mapeo**

El sistema expone estos campos para mapeo en plantillas:

* paciente.rut, paciente.nombre\_completo, paciente.fecha\_nacimiento, paciente.seguro\_poliza

* profesional.nombre\_completo, profesional.rut, profesional.especialidad

* prestacion.codigo\_sii, prestacion.descripcion, prestacion.fecha, prestacion.monto

* cobro.monto\_total, cobro.monto\_copago, cobro.metodo\_pago, cobro.folio\_boleta

* clinica.nombre, clinica.rut, clinica.direccion, clinica.telefono

# **8\. MÓDULO 5 — COMUNICACIÓN WHATSAPP (FASE 1: SEMI-MANUAL)**

## **8.1 Diseño del módulo**

En Fase 1 no hay integración directa con WhatsApp Business API. El módulo genera automáticamente la lista de pacientes y mensajes pre-redactados que la secretaria copiará y enviará manualmente por WhatsApp Web o su teléfono.

El módulo está diseñado para ser reemplazado en Fase 2 por la API de Twilio sin cambiar la estructura de datos.

## **8.2 Pantalla principal del módulo**

* Ruta: /admin/whatsapp

* Vista predeterminada: pacientes con cita MAÑANA (fecha actual \+ 1 día).

* Selector de fecha: la secretaria puede cambiar la fecha para ver cualquier día.

* La lista se genera automáticamente al entrar a la vista y se refresca si hay cambios en la agenda.

## **8.3 Lista de pacientes del día**

Para cada cita del día seleccionado, mostrar una tarjeta con:

* Nombre completo del paciente

* Teléfono (con formato \+56 9 XXXX XXXX). Botón que abre WhatsApp Web directamente: https://wa.me/56XXXXXXXXX

* Hora de la cita

* Especialidad y profesional

* Mensaje pre-redactado (ver 8.4) con botón ‘Copiar mensaje’ (navigator.clipboard.writeText)

* Estado de envío: selector manual con opciones Pendiente | Confirmado | No responde | Cancelado. Al marcar, actualiza dq\_whatsapp\_lista.estado\_envio y registra timestamp.

## **8.4 Mensaje pre-redactado automático**

El sistema genera este mensaje automáticamente para cada paciente:

Hola \[NOMBRE\], le recordamos que tiene una hora agendada en Clínica Dental Quantum

mañana \[DIA\] \[FECHA\] a las \[HORA\] con \[DR/DRA. APELLIDO\] (\[ESPECIALIDAD\]).

Clínica ubicada en Av. Kennedy 7100 Of. 706, Vitacura.

Por favor confírmenos su asistencia respondiendo este mensaje.

Si necesita reagendar: (56-2) 2953 9291

* El mensaje es editable por la secretaria antes de copiar (campo de texto prellenado editable).

* El admin puede modificar la plantilla base del mensaje en Configuración → Plantilla WhatsApp.

## **8.5 Resumen del día**

* Contador en la parte superior: X pacientes | Y confirmados | Z pendientes | W cancelados.

* Botón ‘Exportar lista del día’: descarga CSV con nombre, teléfono, hora, especialidad.

* Botón ‘Copiar lista completa’: copia todos los mensajes en bloque para enviar desde el telófono.

## **8.6 Preparación para Fase 2 (Twilio)**

* La tabla dq\_whatsapp\_lista ya tiene estructura compatible con envío automático.

* Al activar Fase 2: agregar env var TWILIO\_ACCOUNT\_SID, TWILIO\_AUTH\_TOKEN, TWILIO\_WHATSAPP\_NUMBER.

* Reemplazar el botón ‘Copiar mensaje’ por ‘Enviar automáticamente’ que llama a /api/whatsapp/send.

* Los templates de mensaje ya estarán pre-aprobados en este punto.

# **9\. MÓDULO 6 — GESTIÓN DE PACIENTES, TRATAMIENTOS Y ARCHIVOS**

## **9.1 Ficha Clínica Digital**

Ruta: /admin/pacientes/\[id\]. La ficha tiene tabs:

* TAB DATOS: información personal, RUT, contacto, previsión, seguro complementario. Editable inline.

* TAB CITAS: historial completo de citas con estado, profesional, especialidad. Filtro por rango de fechas.

* TAB TRATAMIENTOS: tratamientos activos e históricos. Ver 9.2.

* TAB ARCHIVOS: radiografías, fotografías, consentimientos. Ver 9.3.

* TAB COBROS: historial de pagos, boletas emitidas, saldo pendiente.

* TAB FORMULARIOS: formularios de seguros generados para este paciente.

* TAB NOTAS: notas clínicas por sesión con editor de texto enriquecido (Tiptap).

## **9.2 Gestión de Tratamientos**

* Crear tratamiento: asociar a paciente \+ profesional \+ especialidad \+ número estimado de sesiones \+ costo total \+ descripción del plan.

* Vista Kanban en /admin/tratamientos: columnas por estado (Diagnóstico → Plan Aprobado → En Proceso → Mantenimiento → Completado). Cards con nombre del paciente, especialidad, progreso (X/Y sesiones), dentista.

* Al realizar una cita asociada a un tratamiento: crear sesión en dq\_sesiones con notas, hallazgos y próxima acción.

* Barra de progreso visual: sesiones realizadas / sesiones estimadas.

* Alerta: si el tratamiento está ‘En Proceso’ y no hay cita agendada en los próximos 30 días, mostrar alerta en dashboard.

* Exportar resumen de tratamiento a PDF (pdf-lib): incluye plan, sesiones realizadas, notas, profesional, fechas.

## **9.3 Almacenamiento de Archivos Clínicos**

* Buckets Supabase Storage: radiografias/ | fotografias/ | consentimientos/ | documentos/

* Naming: {paciente\_id}/{fecha}\_{tipo}\_{id\_archivo}.{ext}

* RLS Storage: solo el paciente autenticado y profesionales con acceso pueden descargar sus archivos.

* Upload desde ficha: drag & drop o selección de archivo. Máximo 20MB por archivo. Tipos permitidos: jpg, png, webp, pdf, dcm (DICOM dental).

* Compresión automática de imágenes via Cloudinary antes de guardar (max 2MB output).

* Vista galería en ficha del paciente: miniaturas con lightbox. Para PDFs, visor inline con react-pdf.

* Consentimientos informados: formulario digital con campo de firma libre (canvas HTML5). Al guardar: capturar firma como PNG, generar PDF con datos \+ firma con pdf-lib, guardar en bucket consentimientos/.

## **9.4 Importación de Datos (Excel / .md)**

Ruta: /admin/importar. Para carga inicial o futura de datos históricos:

* Upload de archivo Excel (.xlsx o .csv) o Markdown (.md).

* Para Excel: usar SheetJS para parsear. El sistema detecta columnas automáticamente y muestra preview de mapeo: columna Excel → campo en dq\_pacientes. La secretaria corrige el mapeo si es necesario.

* Para Markdown: parsear con marked. Asumir formato: cada paciente como sección H2 con datos como lista. Mostrar preview antes de importar.

* Validación pre-import: verificar RUT con dígito verificador, detectar duplicados por RUT, mostrar errores por fila.

* Importación en lote con barra de progreso. Al finalizar: resumen de registros importados, omitidos (duplicados) y con errores.

* Los registros importados quedan con estado activo=true y sin supabase\_uid (no pueden hacer login hasta que se registren vía portal).

# **10\. MÓDULO 7 — PORTAL DEL PACIENTE**

## **10.1 Autenticación**

* Login con email \+ contraseña (Supabase Auth).

* Magic link por email como alternativa (sin recordar contraseña).

* En el primer acceso, el paciente ingresa su RUT para vincular su cuenta Supabase a su registro en dq\_pacientes.

* Registro público habilitado: cualquier persona puede crear cuenta en /portal.

## **10.2 Funcionalidades del Portal**

* /portal/dashboard: próxima cita destacada, estado de tratamiento activo, últimos documentos, acceso rápido a agendar.

* /portal/citas: próximas citas con opción de cancelar (hasta 24h antes). Historial de citas pasadas con fecha, profesional, especialidad y notas visibles del profesional.

* /portal/tratamientos: card por tratamiento con nombre, estado visual (progress bar), sesiones realizadas, próxima sesión, profesional a cargo.

* /portal/documentos: lista de archivos disponibles (radiografías, fotografías, consentimientos, formularios de seguro generados). Descarga directa.

* /portal/agendar: wizard completo de agendamiento (mismo de /agendar público) pero con datos prellenados del paciente autenticado.

# **11\. MÓDULO 8 — BACK-OFFICE ADMINISTRATIVO**

## **11.1 Roles y Permisos**

* ADMIN: acceso total. Configuración del sistema, usuarios, plantillas de seguros, plantilla WhatsApp, horarios base, importación.

* DENTISTA: su agenda, sus pacientes, sus tratamientos, notas clínicas, archivos clínicos.

* RECEPCIONISTA: agenda de todos, fichas de pacientes (sin notas clínicas), cobros, leads, módulo WhatsApp, formularios de seguros.

## **11.2 Dashboard Principal (/admin)**

* KPIs del día: citas confirmadas, en espera de confirmación, canceladas, no-show.

* Ingresos del día: total cobrado desglosado por método de pago.

* Agenda del día: vista timeline por profesional con estado de cada cita (color por estado).

* Leads nuevos: contador con acceso rápido a lista.

* Alertas: tratamientos sin seguimiento, citas sin confirmar (WhatsApp pendiente).

* Gráficos mensuales (Recharts): ingresos por semana, ocupación de agenda por especialidad, tasa no-show.

## **11.3 Gestión de Leads**

* Tabla con columnas: nombre, teléfono, especialidad, origen, estado, fecha. Paginada.

* Filtros: por estado, origen, especialidad, rango de fechas.

* Acción: convertir lead en paciente \+ agendar hora en un flujo unificado.

## **11.4 Configuración del Sistema (/admin/configuracion)**

* Datos de la clínica (nombre, RUT, dirección, teléfonos, email, logo).

* Gestión de profesionales: crear, editar, activar/desactivar.

* Horarios base por profesional \+ bloqueos.

* Plantilla de mensaje WhatsApp (texto editable con variables).

* CAFs del SII: subir archivos CAF (XML) para emisión de boletas.

* Especialidades: editar descripciones, precios, duración de slots.

# **12\. SEGURIDAD, PRIVACIDAD Y CUMPLIMIENTO LEGAL**

* Ley 19.628 (Protección de Datos Personales Chile): checkbox obligatorio en todos los formularios públicos con texto de política de privacidad. Guardar timestamp, IP y texto de la política aceptada en cada registro de consentimiento.

* HTTPS obligatorio en toda la plataforma (Vercel \+ Cloudflare Full Strict).

* Supabase RLS: cada rol accede solo a sus datos. NUNCA exponer service\_role key en frontend ni en código del repositorio.

* Variables de entorno sensibles: SUPABASE\_SERVICE\_KEY, SII\_CERT\_B64, SII\_CERT\_PASS, GOOGLE\_CLIENT\_SECRET, RESEND\_API\_KEY — solo en Vercel Environment Variables (Encrypted). Nunca en .env commiteado.

* .gitignore estricto: .env, .env.local, .env.production, archivos CAF del SII, certificados .p12.

* Rate limiting en endpoints públicos (/api/leads, /api/agendas/crear): Upstash Redis \+ @upstash/ratelimit middleware.

* Tabla dq\_audit\_log: registrar toda acción sobre datos de pacientes (quién, qué, cuándo, desde qué IP).

* Backup automático: Supabase Pro incluye backup diario con 7 días de retención.

*⚠ El certificado digital del SII es un activo crítico. Almacenar como base64 en variable de entorno cifrada. Nunca en Storage público ni en el repositorio.*

# **13\. PLAN DE IMPLEMENTACIÓN POR FASES**

## **FASE 1 — Semanas 1-3: Fundación**

* Setup: repositorio GitHub, proyecto Vercel, proyecto Supabase, Cloudflare DNS.

* Migraciones Prisma: esquema completo de base de datos con todas las tablas.

* Autenticación: Supabase Auth con roles (admin, dentista, recepcionista, paciente).

* Layout base del sitio público: nav, footer, páginas estáticas (inicio, quiénes somos, contacto).

* CI/CD: GitHub Actions → lint \+ typecheck \+ deploy automático a Vercel.

## **FASE 2 — Semanas 4-6: Captación y Agendamiento**

* Home completo con todas las secciones de marketing y animaciones.

* Landings de especialidades (hub \+ 13 páginas individuales dinámicas).

* Wizard de agendamiento completo con disponibilidad en tiempo real.

* Integración Google Calendar bidireccional.

* Formulario de contacto \+ captura de leads.

* Blog con MDX (6 artículos iniciales).

## **FASE 3 — Semanas 7-9: Operaciones Clínicas**

* Módulo de cobros \+ integración SII (boletas electrónicas).

* Módulo WhatsApp semi-manual (lista \+ mensajes copiables).

* Ficha clínica completa: notas, tratamientos, Kanban, archivos.

* Módulo de seguros complementarios: upload de plantillas \+ prellenado.

* Portal del paciente completo.

## **FASE 4 — Semanas 10-12: Consolidación y Lanzamiento**

* Back-office admin: dashboard, KPIs, gráficos, gestión de leads.

* Módulo de importación Excel/.md.

* SEO técnico completo: metadata, schema, sitemap, OG.

* Tests E2E Playwright: flujo de agendamiento, emisión de boleta, generación de formulario de seguro.

* Optimización Core Web Vitals: objetivo LCP \< 2.5s en mobile.

* Capacitación equipo clínico: 2 sesiones prácticas.

* Migración DNS definitiva de Wix a Vercel \+ Cloudflare.

# **14\. COSTOS DE INFRAESTRUCTURA (ESTIMADO MENSUAL)**

* Vercel Pro: USD 20/mes

* Supabase Pro: USD 25/mes (8GB DB, 100GB Storage, backups diarios)

* Cloudflare: USD 0 (plan gratuito suficiente para esta escala)

* Cloudinary: USD 0 (plan gratuito 25GB suficiente)

* Resend: USD 0 (plan gratuito hasta 3.000 emails/mes) o USD 20 si se supera

* Upstash Redis (rate limiting): USD 0 (plan gratuito suficiente)

* Sentry: USD 0 (plan gratuito)

* Plausible Analytics: USD 9/mes (opcional, puede omitirse en Fase 1\)

**TOTAL INFRAESTRUCTURA: USD 45-74/mes. Sin costo variable por transacciones (no hay Transbank online).**

*⚠ Costos SII: la emisión de boletas electrónicas al SII no tiene costo adicional si se usa la API directa del SII (sin intermediarios como Bsale o Defontana).*

# **15\. RESTRICCIONES ABSOLUTAS Y CRITERIOS DE ÉXITO**

## **Restricciones absolutas**

* No usar WordPress, Elementor ni Wix Headless.

* No almacenar certificado digital del SII en el repositorio bajo ninguna circunstancia.

* No procesar pagos con tarjeta en el sistema (el POS físico es externo al software).

* No enviar datos de pacientes a servicios externos sin consentimiento explícito registrado.

* No usar WidthType.PERCENTAGE en tablas docx (esto es una nota interna del generador, ignorar en producción).

## **Criterios de aceptación por módulo**

* Sitio público: Lighthouse score ≥ 90 en Performance, Accessibility, SEO en mobile.

* Agendamiento: el paciente puede agendar una hora completa en menos de 3 minutos sin asistencia.

* Cobros SII: la boleta electrónica se emite y envía al paciente en menos de 30 segundos tras el cobro.

* WhatsApp: la secretaria puede copiar y enviar los mensajes del día siguiente en menos de 5 minutos.

* Formularios seguros: prellenado de un formulario en menos de 2 minutos, con PDF descargable.

* Portal paciente: el paciente puede ver sus citas, tratamientos y documentos sin ayuda.

* Importación: carga de 500 registros de pacientes desde Excel en menos de 2 minutos.

**FIN DEL PROMPT MAESTRO v2.0**

*Clínica Dental Quantum — Vitacura, Santiago de Chile*

15 secciones • 8 módulos • 4 fases • Junio 2026