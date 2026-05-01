// Manifiesto / Carta editorial de presentación de ZonaMundial.
// Pinned: siempre aparece primero en el hub, sin importar fechas.
// Foco: ZonaMundial es una APP/PLATAFORMA. La parte editorial es secundaria.
// Honestidad: existe Founders Pass premium y publicidad AdSense. Sin
// promesas absolutas que no podamos cumplir.

import type { BlogPost } from "@/lib/blog/types";

const post: BlogPost = {
  slug: "que-es-zona-mundial",
  title:
    "ZonaMundial: la app para vivir el Mundial 2026 desde dentro",
  description:
    "ZonaMundial es la plataforma del Mundial 2026: predicciones, fantasy, IA Coach, ligas privadas, trivia, streaming y comunidad. 12 módulos integrados en una sola app.",
  dek: "Predicciones en tiempo real, fantasy, ligas con tus amigos, IA Coach personal, trivia, streaming con creators y mucho más. Todo en una sola app, pensada para los 39 días más intensos del fútbol mundial.",
  // Portada propia subida por el equipo (mockup oficial de la app).
  ogImage: "/img/blog/portada-zona-mundial.png",
  ogImageCredit: {
    author: "ZonaMundial",
    license: "Material de marca propio",
    source: "ZonaMundial",
  },
  category: "guia",
  keywords: [
    "zonamundial",
    "zona mundial",
    "que es zonamundial",
    "zonamundial app",
    "app mundial 2026",
    "plataforma mundial 2026",
    "fantasy mundial 2026",
    "predicciones mundial 2026",
    "ia coach mundial",
    "ligas privadas mundial 2026",
  ],
  tags: ["ZonaMundial", "App", "Mundial 2026", "Plataforma"],
  // Fecha en el pasado para que sea siempre visible. pinned=true lo ancla.
  publishedAt: "2026-01-01T08:00:00+01:00",
  updatedAt: "2026-05-01T20:00:00+02:00",
  pinned: true,
  readingTime: 7,
  body: [
    {
      type: "p",
      text: "**ZonaMundial es la app para vivir el Mundial 2026 al máximo.** Predice partidos en tiempo real, monta tu fantasy, compite en ligas con tus amigos, recibe consejos de un IA Coach personal y debate con una comunidad global mientras los **104 partidos** del torneo se disputan entre **Estados Unidos, México y Canadá**. Todo en una sola plataforma, diseñada desde cero para que el espectador se convierta en protagonista.",
    },
    {
      type: "p",
      text: "Si has llegado a este artículo es probablemente porque alguien te recomendó la app o porque quieres saber **qué hace ZonaMundial diferente** del resto de plataformas que aparecen cada Mundial. La respuesta corta: **la pieza central es la app**, no el contenido editorial ni los rankings ni los foros. Aquí te explicamos qué puedes hacer dentro y cómo funciona el modelo.",
    },
    {
      type: "image",
      src: "/img/blog/portada-zona-mundial.png",
      alt: "Vista del módulo Fantasy de ZonaMundial con el partido México 1-0 Sudáfrica en directo",
      caption:
        "El módulo Fantasy en acción durante un partido en directo. La predicción del usuario lleva la ventaja sobre el marcador real.",
      credit: {
        author: "ZonaMundial",
        license: "Material de marca propio",
        source: "ZonaMundial",
      },
    },
    {
      type: "callout",
      variant: "gold",
      title: "TL;DR · LO ESENCIAL",
      text: "**12 módulos integrados** en una sola app: predicciones, fantasy, IA Coach, trivia, ligas privadas, streaming, álbum digital y más. **Plan base gratuito**. Plan **Founders Pass** opcional para quien quiera apoyar el proyecto y desbloquear extras (estadísticas avanzadas, sin publicidad, beta access).",
    },
    {
      type: "h2",
      text: "Qué puedes hacer dentro de ZonaMundial",
      id: "que-puedes-hacer",
    },
    {
      type: "p",
      text: "Dentro de la app conviven **12 módulos**, cada uno pensado para una forma distinta de vivir el Mundial. Puedes usarlos todos, alguno o ninguno. Lo importante es que se complementan: si juegas Fantasy, tus predicciones suman bonificaciones; si participas en Trivia, los datos del Match Center se quedan grabados en tu memoria; si estás en una Liga Privada, el resto de módulos aporta puntos a tu ranking entre amigos.",
    },
    {
      type: "image",
      src: "/img/blog/zonamundial-app-modulos.png",
      alt: "Vista del menú de módulos de la app ZonaMundial: Fantasy, Modo DT, Modo Carrera, Micro, Trivia, Impostor, Daily Word y Streaming",
      caption:
        "Menú lateral de módulos en ZonaMundial. Puedes activar o silenciar cualquiera según cómo quieras vivir el torneo.",
      credit: {
        author: "ZonaMundial",
        license: "Material de marca propio",
        source: "ZonaMundial",
      },
    },
    {
      type: "h3",
      text: "Los módulos principales",
      id: "modulos-principales",
    },
    {
      type: "table",
      caption: "Los 12 módulos que componen la app ZonaMundial.",
      headers: ["Módulo", "Para qué sirve"],
      rows: [
        ["**Match Center**", "Sigue los 104 partidos en vivo con stats, alineaciones y eventos minuto a minuto."],
        ["**Predicciones**", "8 tipos: resultado exacto, goleador, tarjetas, corners, MVP y más. Puntos en tiempo real."],
        ["**Fantasy Mundial**", "Arma tu 11 ideal con presupuesto. Ranking global y por liga. Cambios entre partidos."],
        ["**IA Coach**", "Analista personal: te sugiere alineaciones, predicciones y rotaciones según tu estilo."],
        ["**Modo Carrera**", "Progresa partido a partido con misiones y logros desbloqueables."],
        ["**Ligas Privadas**", "Compite con tu pandilla, oficina o familia con código de invitación."],
        ["**Trivia Mundial**", "Más de 2.000 preguntas sobre la historia y actualidad del torneo."],
        ["**Streaming + Creators**", "Sigue partidos comentados por nueve creadores ZonaMundial."],
        ["**Álbum Digital**", "Colecciona estampas digitales únicas de las 48 selecciones."],
        ["**Chat y Comunidad**", "Conversaciones por país, grupo, liga, partido o tema."],
        ["**Micro**", "Predicciones cortas dentro del propio partido en directo."],
        ["**Stories**", "Lo más viral del día en formato vertical de 24 horas."],
      ],
    },
    {
      type: "h2",
      text: "Cómo funciona el modelo: gratis y Founders Pass",
      id: "modelo",
    },
    {
      type: "p",
      text: "**El plan base de ZonaMundial es gratuito.** Incluye los 12 módulos completos: predicciones, fantasy, IA Coach, ligas privadas, trivia, streaming, todo. La forma en la que sostenemos el servicio gratuito es con **publicidad** (gestionada con estándares como Google AdSense) y con un **plan premium opcional** llamado **Founders Pass**.",
    },
    {
      type: "p",
      text: "Founders Pass es un **pago único** —no suscripción mensual— válido para todo el Mundial 2026, pensado para quien quiera apoyar el proyecto y desbloquear extras concretos: **navegación sin publicidad**, **estadísticas avanzadas** (xG, mapas de calor, comparativas), **beta access** a nuevas funcionalidades y un **sticker pack exclusivo** para WhatsApp e Instagram. Ningún módulo del juego está bloqueado tras el premium: las predicciones, el fantasy, el IA Coach y las ligas privadas funcionan igual de bien en ambos planes.",
    },
    {
      type: "callout",
      variant: "blue",
      title: "TRANSPARENCIA",
      text: "Mostramos **publicidad** en el plan gratuito para sostener el servicio sin cobrar a la mayoría de usuarios. **Cumplimos las normativas de privacidad** (GDPR/LGPD) y los términos de Google AdSense. Puedes consultar y borrar tus datos desde el panel de cuenta cuando quieras.",
    },
    {
      type: "h2",
      text: "BIBLIA Mundial 2026: la enciclopedia interna",
      id: "biblia",
    },
    {
      type: "p",
      text: "Una pieza diferencial de la app es **BIBLIA Mundial 2026**: una enciclopedia con **fichas detalladas de las 48 selecciones clasificadas**. Cada ficha incluye plantilla de 26 jugadores, capitán, máximo goleador, kit principal con visualización 3D, fixture personalizado, sede(s) base, datos históricos y un **once ideal** construido por nuestra redacción.",
    },
    {
      type: "p",
      text: "Los datos de BIBLIA alimentan al resto de módulos. Cuando el IA Coach te sugiere un cambio en tu fantasy, lo hace basándose en los datos de BIBLIA. Cuando juegas Trivia, las preguntas se generan a partir de BIBLIA. Es la base sobre la que todo lo demás funciona.",
    },
    {
      type: "cta",
      title: "Las 48 fichas BIBLIA",
      text: "Conoce a fondo a las selecciones del Mundial 2026: plantilla, táctica, kit, capitán y once ideal.",
      href: "/selecciones",
      label: "Explorar fichas",
    },
    {
      type: "h2",
      text: "Herramientas que ya están abiertas (sin login)",
      id: "herramientas",
    },
    {
      type: "p",
      text: "Mientras los módulos completos requieren registro, hay **tres herramientas anónimas** abiertas a cualquiera:",
    },
    {
      type: "ul",
      items: [
        "**[Calendario completo](/calendario)** — los 104 partidos con filtros por equipo, sede, fase y zona horaria. Descargable a Apple Calendar, Google Calendar y Outlook con un clic.",
        "**[Bracket Challenge](/bracket)** — predice el cuadro completo del Mundial 2026 con dos vistas (clásica y cósmica). Anónimo, se guarda en tu navegador.",
        "**[Mapa de sedes](/sedes)** — las 16 ciudades anfitrionas con datos de cada estadio, partidos asignados y cómo llegar.",
      ],
    },
    {
      type: "h2",
      text: "El blog editorial: contexto antes y durante el torneo",
      id: "blog",
    },
    {
      type: "p",
      text: "Aparte de la app, mantenemos un **blog editorial** con análisis, perfiles de selecciones, datos curiosos, historia y guías. Los artículos firman como **Editorial Zona Mundial** y están pensados para profundizar en preguntas concretas: quién es favorito, qué pasa con cada selección, cómo se reparten las sedes, qué jugador puede ser estrella del torneo. Si has llegado aquí, ya estás en el blog: échale un vistazo.",
    },
    {
      type: "h2",
      text: "Cómo empezar (sin compromiso)",
      id: "empezar",
    },
    {
      type: "p",
      text: "La forma más rápida de conocer ZonaMundial es **probarla**:",
    },
    {
      type: "ol",
      items: [
        "**Modo curioso**: descárgate el [calendario](/calendario), monta tu [bracket](/bracket) y lee artículos del [blog](/blog). Sin login, sin tarjeta.",
        "**Modo aficionado**: [pre-regístrate gratis](/registro) para asegurar tu nombre de usuario y acceder a todos los módulos cuando empiece el torneo.",
        "**Modo total**: cuando llegue junio, abre la app, predice partidos, monta tu fantasy, invita a tu pandilla a una liga privada y vive el Mundial desde dentro.",
      ],
    },
    {
      type: "cta",
      title: "Pre-regístrate gratis",
      text: "Asegura tu nombre de usuario y accede a la app cuando empiece el Mundial. Sin tarjeta, sin compromiso.",
      href: "/registro",
      label: "Crear cuenta",
    },
    {
      type: "divider",
    },
    {
      type: "p",
      text: "**ZonaMundial es la app para vivir el Mundial 2026.** El balón empezará a rodar el 11 de junio en el Estadio Azteca. Hasta entonces, hay 48 selecciones que estudiar, 104 partidos que predecir y miles de aficionados con los que cruzar opiniones. Te esperamos dentro.",
    },
    {
      type: "quote",
      text: "El Mundial no se mira. Se juega.",
      cite: "ZonaMundial",
    },
    {
      type: "faq",
      items: [
        {
          q: "¿Qué es ZonaMundial?",
          a: "**ZonaMundial es una app/plataforma** para vivir el Mundial 2026 desde dentro: predicciones, fantasy, IA Coach, ligas privadas, trivia, streaming con creators y comunidad. 12 módulos integrados en una sola plataforma.",
        },
        {
          q: "¿ZonaMundial es gratis?",
          a: "**El plan base es gratuito** e incluye los 12 módulos completos. Existe un plan opcional **Founders Pass** (pago único) para quien quiera apoyar el proyecto y desbloquear extras: navegación sin publicidad, estadísticas avanzadas, beta access y sticker pack exclusivo.",
        },
        {
          q: "¿Necesito registrarme para usar ZonaMundial?",
          a: "**No** para herramientas anónimas como el [calendario](/calendario), el [bracket challenge](/bracket) y el [mapa de sedes](/sedes). **Sí** para los módulos completos (predicciones competitivas, fantasy, ligas privadas, IA Coach, trivia con ranking).",
        },
        {
          q: "¿Cómo se sostiene el servicio gratuito?",
          a: "Con **publicidad** (gestionada con estándares como Google AdSense) y con el **Founders Pass** opcional. Cumplimos las normativas de privacidad GDPR/LGPD y los términos de AdSense.",
        },
        {
          q: "¿En qué dispositivos funciona ZonaMundial?",
          a: "**Funciona en cualquier dispositivo con navegador moderno** (móvil, tablet, ordenador). App nativa muy pronto en App Store y Google Play. Soporte multilingüe ES/EN ya activo.",
        },
        {
          q: "¿Qué es BIBLIA Mundial 2026?",
          a: "Es la **enciclopedia interna** con fichas detalladas de las 48 selecciones clasificadas: plantilla, capitán, máximo goleador, kit, fixture, datos históricos y once ideal. Alimenta al resto de módulos de la app.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "¿Qué es ZonaMundial?",
      a: "Una app/plataforma para vivir el Mundial 2026 con 12 módulos: predicciones, fantasy, IA Coach, ligas privadas, trivia, streaming y comunidad.",
    },
    {
      q: "¿ZonaMundial es gratis?",
      a: "Sí, el plan base es gratuito. Existe Founders Pass (premium opcional) para quien quiera apoyar el proyecto y desbloquear extras.",
    },
    {
      q: "¿Necesito registrarme para usar ZonaMundial?",
      a: "No para calendario, bracket y mapa de sedes. Sí para módulos completos (predicciones, fantasy, ligas privadas, IA Coach).",
    },
    {
      q: "¿Cómo se sostiene el servicio gratuito?",
      a: "Con publicidad (Google AdSense) y con el Founders Pass opcional. Cumplimos GDPR/LGPD y los términos de AdSense.",
    },
  ],
  related: [
    "calendario-mundial-2026-completo",
    "selecciones-clasificadas-mundial-2026",
    "quien-ganara-el-mundial-2026",
  ],
};

export default post;
