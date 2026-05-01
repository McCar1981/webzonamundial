// Manifiesto / Carta editorial de presentación de ZonaMundial.
// Pinned: siempre aparece primero en el hub, sin importar fechas.
// Keywords: "zonamundial", "zona mundial app", "que es zonamundial",
// "plataforma mundial 2026", "fantasy mundial 2026 gratis".

import type { BlogPost } from "@/lib/blog/types";

const post: BlogPost = {
  slug: "que-es-zona-mundial",
  title:
    "ZonaMundial: la plataforma definitiva para vivir el Mundial 2026 (no es una app más)",
  description:
    "ZonaMundial es la plataforma gratuita de predicciones, fantasy, IA Coach y comunidad para el Mundial 2026. 12 módulos, 48 selecciones, 104 partidos, una sola misión: que el Mundial sea tuyo.",
  dek: "Si buscas vivir el Mundial 2026 con todos los sentidos —predicciones, fantasy, datos, comunidad, streaming—, has llegado al sitio correcto. Esta es nuestra carta de presentación, sin clickbait y sin atajos.",
  ogImage:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Estadio_Azteca1706p2.jpg/1280px-Estadio_Azteca1706p2.jpg",
  ogImageCredit: {
    author: "Carlos Valenzuela",
    license: "CC BY-SA 4.0",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Estadio_Azteca1706p2.jpg",
  },
  category: "guia",
  keywords: [
    "zonamundial",
    "zona mundial",
    "que es zonamundial",
    "zonamundial app",
    "plataforma mundial 2026",
    "fantasy mundial 2026 gratis",
    "predicciones mundial 2026 gratis",
    "ia coach mundial",
    "ranking mundial 2026 gratis",
    "ligas privadas mundial 2026",
  ],
  tags: ["ZonaMundial", "Manifiesto", "Mundial 2026", "Plataforma"],
  // Fecha en el pasado para que sea siempre visible. pinned=true lo ancla.
  publishedAt: "2026-01-01T08:00:00+01:00",
  updatedAt: "2026-05-01T12:00:00+02:00",
  pinned: true,
  readingTime: 8,
  body: [
    {
      type: "p",
      text: "Antes de que el balón eche a rodar el **11 de junio de 2026** en el Estadio Azteca, queremos dejar claro **qué es ZonaMundial**, por qué existimos y qué encontrarás aquí. No te vamos a vender humo: te vamos a contar exactamente lo que ofrecemos para que decidas si quieres formar parte del proyecto. Si después de leer esto te quedas, encantados. Si no, también: el fútbol está para disfrutarlo, no para forzar nada.",
    },
    {
      type: "p",
      text: "**ZonaMundial nace con una premisa sencilla**: el Mundial 2026 va a ser el más grande de la historia (104 partidos, 48 selecciones, 16 sedes, 39 días). Vivir esa locura solo con la televisión es perder la mitad del torneo. Por eso construimos una plataforma donde puedes **predecir, jugar, competir, analizar, ver, comentar y compartir** absolutamente todo lo que ocurra entre el silbato inaugural y el último penal de la final.",
    },
    {
      type: "callout",
      variant: "gold",
      title: "TL;DR · QUÉ ES ZONAMUNDIAL",
      text: "**Plataforma gratuita** de predicciones, fantasy, trivia, IA Coach, ligas privadas, streaming con creators y datos del Mundial 2026. **Sin tarjeta**, **sin anuncios intrusivos**, **sin letra pequeña**. 12 módulos en una sola app. 48 selecciones, 104 partidos, una sola misión: **que el Mundial sea tuyo**.",
    },
    {
      type: "h2",
      text: "Quiénes somos: una redacción y un equipo de producto",
      id: "quienes-somos",
    },
    {
      type: "p",
      text: "ZonaMundial está hecho por una redacción editorial de periodistas y analistas (firmamos como **Editorial Zona Mundial**) y un equipo de producto que construye y mantiene la plataforma desde 2024. Nos preparamos durante dos años para llegar al Mundial 2026 con un sistema robusto, datos verificados y herramientas que de verdad sirvan.",
    },
    {
      type: "p",
      text: "No somos una agregadora de contenidos. **No copiamos noticias de otros medios**: investigamos, escribimos, contrastamos. No somos casa de apuestas: el dinero no entra ni sale de la plataforma. No somos red social: aunque tenemos chat, ligas y micro-publicaciones, nuestro foco es el contenido y las herramientas.",
    },
    {
      type: "h2",
      text: "Los 12 módulos que componen la plataforma",
      id: "modulos",
    },
    {
      type: "p",
      text: "Llamamos *módulos* a las grandes funcionalidades que tienes a tu disposición desde el momento en que te registras (gratis). Están pensados para complementarse entre sí: si juegas Fantasy, las predicciones te dan ventaja; si participas en Trivia, los datos del Match Center se quedan en tu memoria; si estás en una Liga Privada, todo lo demás suma puntos.",
    },
    {
      type: "table",
      caption: "Los 12 módulos de ZonaMundial. Todos gratuitos en el plan base.",
      headers: ["Módulo", "Qué hace", "Para quién"],
      rows: [
        ["**Match Center**", "104 partidos en vivo con stats, alineaciones y eventos minuto a minuto", "Aficionado total"],
        ["**Predicciones**", "8 tipos: resultado exacto, goleador, tarjetas, corners, MVP y más", "Quien quiere medir su olfato"],
        ["**Fantasy Mundial**", "Arma tu 11 ideal con presupuesto. Ranking global y por liga", "Estratega táctico"],
        ["**IA Coach**", "Analista personal con IA: tácticas y recomendaciones por partido", "El que duda en cada elección"],
        ["**Modo Carrera**", "Progresa partido a partido con misiones y logros desbloqueables", "Jugador con metas"],
        ["**Ligas Privadas**", "Compite con tu pandilla, oficina o familia con código de invitación", "Grupos de amigos"],
        ["**Trivia Mundial**", "Más de 2.000 preguntas sobre la historia y actualidad del torneo", "Sabihondo del fútbol"],
        ["**Streaming + Creators**", "Sigue partidos comentados por creadores ZonaMundial", "Quien busca compañía"],
        ["**Álbum Digital**", "Colecciona estampas digitales únicas de las 48 selecciones", "Coleccionista nostálgico"],
        ["**Chat y Comunidad**", "Conversaciones por país, grupo, liga, partido o tema", "Quien quiere debatir"],
        ["**Micro-publicaciones**", "Comparte predicciones y reacciones en formato corto", "Activista digital"],
        ["**Stories**", "Lo más viral del día en formato vertical de 24 horas", "Quien va corriendo"],
      ],
    },
    {
      type: "callout",
      variant: "blue",
      title: "DECISIÓN DE PRODUCTO",
      text: "Cualquier módulo puedes activarlo o silenciarlo. Si solo quieres jugar a predicciones y nada más, perfecto. Si quieres todo, también. **No hay funcionalidades que se metan a la fuerza** en tu experiencia.",
    },
    {
      type: "h2",
      text: "La parte editorial: análisis y datos sin clickbait",
      id: "editorial",
    },
    {
      type: "p",
      text: "Aparte del producto, mantenemos una **redacción editorial activa** que publica contenido firmado por *Editorial Zona Mundial*. Nuestro compromiso es claro: **rigor, datos verificables, y cero clickbait**. No publicamos titulares engañosos. No exageramos. No inventamos rumores. Si una información no está confirmada, lo decimos. Si nos equivocamos, lo corregimos públicamente.",
    },
    {
      type: "p",
      text: "Publicamos **tres artículos a la semana** —martes, jueves y sábado— que cubren las grandes preguntas del Mundial 2026: análisis tácticos, perfiles de selecciones, datos curiosos, sedes, jugadores. Los artículos son largos (más de 5.000 caracteres en promedio), están pensados para profundizar, y siempre llevan FAQ con respuestas concretas.",
    },
    {
      type: "stat",
      items: [
        { value: "3", label: "Artículos por semana", sub: "Martes, Jueves, Sábado" },
        { value: "5K+", label: "Caracteres por artículo", sub: "Profundidad real" },
        { value: "104", label: "Partidos cubiertos", sub: "Todo el torneo" },
        { value: "48", label: "Fichas BIBLIA", sub: "Una por selección" },
      ],
    },
    {
      type: "h2",
      text: "BIBLIA Mundial 2026: la enciclopedia interna",
      id: "biblia",
    },
    {
      type: "p",
      text: "Una pieza clave de ZonaMundial es **BIBLIA Mundial 2026**, nuestra enciclopedia interna con **fichas detalladas de las 48 selecciones clasificadas**. Cada ficha incluye: plantilla completa de 26 jugadores, capitán, máximo goleador, biografía táctica, kit principal con visualización 3D, fixture personalizado, sede(s) base, datos históricos, datos de qualifying y un *11 ideal* construido por nuestra redacción.",
    },
    {
      type: "p",
      text: "Las **fichas BIBLIA son la base** sobre la que construimos análisis, predicciones y herramientas. Si quieres conocer a una selección a fondo, empieza por ahí. Y si tu selección aún no tiene ficha publicada, dinos: las vamos publicando por confederación según se van cerrando los datos definitivos.",
    },
    {
      type: "cta",
      title: "Las 48 fichas BIBLIA",
      text: "Conoce a fondo a las selecciones del Mundial 2026: plantilla, táctica, kit, capitán, máximo goleador y once ideal.",
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
      text: "Mientras los módulos completos requieren registro, hemos abierto **tres herramientas anónimas** que cualquiera puede usar sin crear cuenta:",
    },
    {
      type: "ul",
      items: [
        "**[Calendario completo](/calendario)** — los 104 partidos con filtros por equipo, sede, fase y zona horaria. Descargable a Apple Calendar, Google Calendar y Outlook con un clic. Recordatorios automáticos antes de cada kickoff.",
        "**[Bracket Challenge](/bracket)** — predice el cuadro completo del Mundial 2026 con dos vistas (clásica y cósmica). Comparte tu bracket y rétalo con amigos. Anónimo, se guarda en tu navegador.",
        "**[Mapa de sedes](/sedes)** — las 16 ciudades anfitrionas con datos de cada estadio, partidos asignados, capacidad y cómo llegar.",
      ],
    },
    {
      type: "h2",
      text: "Qué NO somos",
      id: "que-no-somos",
    },
    {
      type: "p",
      text: "Nos parece tan importante decir qué somos como qué **no** somos:",
    },
    {
      type: "ul",
      items: [
        "**No somos casa de apuestas**. No movemos dinero. Las predicciones son por puntos virtuales y diversión.",
        "**No somos red social**. Tenemos comunidad, pero el foco es el Mundial, no las relaciones interpersonales.",
        "**No somos agregadora**. Lo que publicamos lo escribimos nosotros, no lo copiamos.",
        "**No vendemos tus datos**. Política de privacidad clara y mínima recolección.",
        "**No somos pay-to-win**. El plan gratuito incluye TODAS las funcionalidades core. El plan premium solo añade comodidades (sin anuncios, estadísticas avanzadas, sticker pack exclusivo, beta access).",
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "PROMESA",
      text: "Si en algún momento descubres que estamos faltando a alguno de estos puntos, **escríbenos directamente al equipo editorial** y lo arreglamos. Tu confianza es lo único que tenemos.",
    },
    {
      type: "h2",
      text: "El Founders Pass: por qué premium existe",
      id: "founders-pass",
    },
    {
      type: "p",
      text: "Mantener un proyecto así cuesta dinero (servidores, datos en tiempo real, redacción editorial, derechos de imágenes). El **plan premium** —que llamamos *Founders Pass* mientras dure el Mundial 2026— es la fórmula con la que sostenemos el plan gratuito sin tener que llenar la app de anuncios molestos. Quien apoya, accede a:",
    },
    {
      type: "ul",
      items: [
        "**Cero anuncios** en toda la plataforma.",
        "**Estadísticas avanzadas** (xG, xA, mapas de calor, comparativas de jugadores).",
        "**Sticker pack** exclusivo del Mundial 2026 para WhatsApp e Instagram.",
        "**Beta access** a nuevas funcionalidades antes que el resto.",
        "**Insignia de Founders** visible en tu perfil para siempre.",
      ],
    },
    {
      type: "p",
      text: "Es un pago único —no suscripción mensual— válido para todo el torneo. Si nunca llegas a usar premium, no pasa nada: el 95% del valor de ZonaMundial está en el plan gratuito.",
    },
    {
      type: "h2",
      text: "Privacidad y datos: lo que hacemos con tu información",
      id: "privacidad",
    },
    {
      type: "p",
      text: "**Pedimos lo mínimo imprescindible** para que cada módulo funcione: un email para que puedas iniciar sesión, un nombre de usuario para mostrar en rankings y un país de origen para personalizar el contenido. Nada más es obligatorio. Datos opcionales (avatar, equipo favorito, fecha de nacimiento) los pides tú si quieres.",
    },
    {
      type: "p",
      text: "**No vendemos datos a terceros**. **No compartimos información con anunciantes** más allá de los identificadores anónimos estándar de Google AdSense (necesarios para sostener el modelo gratuito). Puedes borrar tu cuenta y todos tus datos desde el panel de cuenta en cualquier momento.",
    },
    {
      type: "h2",
      text: "Cómo empezar (sin compromiso)",
      id: "empezar",
    },
    {
      type: "p",
      text: "La forma más rápida de conocer ZonaMundial es **probarla**. Te dejamos tres caminos según tu nivel de compromiso:",
    },
    {
      type: "ol",
      items: [
        "**Modo curioso**: descárgate el [calendario](/calendario), monta tu [bracket](/bracket) y lee tres o cuatro [artículos editoriales](/blog). Sin login.",
        "**Modo aficionado**: [pre-regístrate gratis](/registro) para asegurar tu nombre de usuario y recibir el Founders Pass anticipado cuando empiece el torneo.",
        "**Modo compromiso total**: si te gusta lo que ves, sigue a Editorial Zona Mundial en redes sociales y comparte el proyecto. El boca a boca es lo que más nos ayuda.",
      ],
    },
    {
      type: "cta",
      title: "Pre-regístrate gratis",
      text: "Asegura tu nombre de usuario y accede a las herramientas en cuanto el Mundial empiece. Sin tarjeta, sin compromiso.",
      href: "/registro",
      label: "Crear cuenta",
    },
    {
      type: "h2",
      text: "Cómo contactar con el equipo",
      id: "contacto",
    },
    {
      type: "p",
      text: "Para temas editoriales, propuestas de colaboración, correcciones o feedback, escríbenos a **editorial@zonamundial.app**. Para soporte técnico (errores en la app, problemas de cuenta), usa el chat de soporte dentro de la plataforma o escribe a **soporte@zonamundial.app**.",
    },
    {
      type: "p",
      text: "También estamos en redes sociales. La cuenta principal es **@zonamundialapp** en Instagram, X, TikTok y YouTube. Las noticias importantes y los artículos nuevos los anunciamos primero ahí.",
    },
    {
      type: "divider",
    },
    {
      type: "p",
      text: "**Bienvenido a ZonaMundial**. Falta menos para que ruede el primer balón en el Azteca. Mientras tanto, hay 48 selecciones que estudiar, 104 partidos que predecir y miles de aficionados con los que cruzar opiniones. Te esperamos.",
    },
    {
      type: "quote",
      text: "El Mundial no se mira. Se juega.",
      cite: "Editorial Zona Mundial",
    },
    {
      type: "faq",
      items: [
        {
          q: "¿Qué es ZonaMundial?",
          a: "**ZonaMundial es una plataforma gratuita** de predicciones, fantasy, IA Coach, trivia, ligas privadas y comunidad para vivir el Mundial 2026. Combina contenido editorial firmado por *Editorial Zona Mundial* con 12 módulos interactivos para que cubras el torneo desde todos los ángulos.",
        },
        {
          q: "¿ZonaMundial es gratis?",
          a: "**Sí**, el plan base es 100% gratuito e incluye todas las funcionalidades core: predicciones, fantasy, trivia, IA Coach, ligas privadas, calendario, bracket y BIBLIA. El plan **Founders Pass** (premium opcional) añade comodidades como cero anuncios y estadísticas avanzadas, con un pago único válido para todo el torneo.",
        },
        {
          q: "¿Necesito registrarme para usar ZonaMundial?",
          a: "**No** para herramientas anónimas como el [calendario](/calendario), el [bracket challenge](/bracket) y el [mapa de sedes](/sedes). **Sí** para los módulos sociales (predicciones competitivas, fantasy, ligas privadas, IA Coach, trivia con ranking).",
        },
        {
          q: "¿Cómo se diferencia ZonaMundial de otras apps del Mundial?",
          a: "Por **profundidad** y **transparencia**. La mayoría son agregadores de noticias o casas de apuestas disfrazadas. Nosotros tenemos redacción editorial propia, BIBLIA con fichas detalladas de las 48 selecciones, IA Coach personalizado y un compromiso explícito de cero clickbait y cero venta de datos.",
        },
        {
          q: "¿En qué países está disponible ZonaMundial?",
          a: "**En todo el mundo hispanohablante e inglés**. Funciona en cualquier dispositivo con navegador moderno. App móvil nativa muy pronto en App Store y Google Play. Soporte multilingüe ES/EN ya activo.",
        },
        {
          q: "¿Quién está detrás de ZonaMundial?",
          a: "Una **redacción editorial** de periodistas y analistas deportivos (firmamos como *Editorial Zona Mundial*) y un **equipo de producto** que construye y mantiene la plataforma. Para colaboraciones o consultas: editorial@zonamundial.app.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "¿Qué es ZonaMundial?",
      a: "Plataforma gratuita de predicciones, fantasy, IA Coach, trivia y comunidad para vivir el Mundial 2026 con 12 módulos integrados.",
    },
    {
      q: "¿ZonaMundial es gratis?",
      a: "Sí. El plan base es gratuito e incluye todas las funcionalidades core. El plan Founders Pass (premium opcional) añade comodidades.",
    },
    {
      q: "¿Necesito registrarme para usar ZonaMundial?",
      a: "No para herramientas como calendario, bracket y mapa de sedes. Sí para módulos sociales (predicciones competitivas, fantasy, ligas privadas).",
    },
    {
      q: "¿Cómo se diferencia ZonaMundial de otras apps del Mundial?",
      a: "Tenemos redacción editorial propia, BIBLIA con fichas detalladas de las 48 selecciones, IA Coach personalizado y compromiso de cero clickbait.",
    },
  ],
  related: [
    "calendario-mundial-2026-completo",
    "selecciones-clasificadas-mundial-2026",
    "quien-ganara-el-mundial-2026",
  ],
};

export default post;
