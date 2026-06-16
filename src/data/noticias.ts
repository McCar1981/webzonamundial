/**
 * Static noticias data — single source of truth for the news section
 * until the auto-ingest pipeline (Phase 2) takes over.
 *
 * Each item has a SEO-ready slug, a multi-paragraph body, an author,
 * tags, and an updatedAt date. Designed to render as a real article
 * page at /noticias/[slug] with full JSON-LD.
 *
 * Fase 2: every article is signed by Carlos Zamudio or Gabriel Venegas
 * (see `noticias-authors.ts`).
 */

import { AUTHORS, getAuthor, type AuthorId, type NoticiaAuthor as RegAuthor } from "./noticias-authors";

export type NoticiaCategory =
  | "analisis"
  | "datos"
  | "historia"
  | "sedes"
  | "selecciones"
  | "plataforma";

export type NoticiaAuthor = RegAuthor;

export interface Noticia {
  /** Stable numeric id (used for keys and analytics) */
  id: number;
  /** SEO slug — only lowercase, dashes, no accents */
  slug: string;
  /** Headline (≤120 chars) */
  title: string;
  /** Short pitch shown on cards + meta description fallback (≤300 chars) */
  excerpt: string;
  /** SEO meta description override (155-160 chars optimal) */
  seoDescription?: string;
  /** Editorial category */
  cat: NoticiaCategory;
  /** ISO publish date YYYY-MM-DD */
  date: string;
  /** ISO last-update date YYYY-MM-DD (defaults to date) */
  updatedAt?: string;
  /** Estimated reading time, minutes */
  readTime: number;
  /** ISO 3166-1 alpha-2 country flags relevant to the article */
  flags: string[];
  /** Free-form keyword tags for filtering, related lookups, JSON-LD */
  tags: string[];
  /** Whether the post should be promoted as a hero card */
  featured: boolean;
  /** Hero image URL (external or local) */
  realImage?: string;
  /** Caption shown under the hero image */
  imageCaption?: string;
  /** Photo credit */
  imageSource?: string;
  /** Author byline — must be a registered author id */
  authorId: AuthorId;
  /** Multi-paragraph body. Each entry is a markdown-ish block. */
  body: NoticiaBlock[];
  /** Optional canonical attribution URL (when article rewrites a source) */
  sourceUrl?: string;
  sourceName?: string;
  /** ISO timestamp de cuándo entró al sistema (drafts auto-ingeridos).
   *  Útil para mostrar "Hace X horas" con precisión real, sin depender
   *  de la fecha del medio (GNews trunca a YYYY-MM-DD). */
  ingestedAt?: string;
}

export type NoticiaBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title?: string; text: string };

const DEFAULT_AUTHOR: NoticiaAuthor = AUTHORS["carlos-zamudio"];

export const NOTICIAS: Noticia[] = [
  {
    id: 104,
    slug: "messi-mundial-casa-estados-unidos-inter-miami",
    title: "Messi jugará el Mundial 'en casa' en Estados Unidos",
    excerpt:
      "El crack argentino reside en Miami desde hace 3 años y jugará el Mundial en territorio norteamericano. Inter Miami no dará descanso a Leo previo al torneo.",
    seoDescription:
      "Messi vivirá el Mundial 2026 desde Miami: cómo afecta su residencia en EE. UU. al calendario de la Albiceleste y al plan físico con el Inter Miami.",
    cat: "selecciones",
    date: "2026-03-22",
    readTime: 4,
    flags: ["ar", "us"],
    tags: ["Messi", "Argentina", "Inter Miami", "Mundial 2026", "MLS"],
    featured: true,
    authorId: "carlos-zamudio",
    body: [
      {
        type: "p",
        text: "Lionel Messi llega al Mundial 2026 con un factor inédito en su carrera: jugará la cita más importante de la temporada en su ciudad de residencia. Desde julio de 2023 reside en Miami con su familia, y la mayoría de los partidos de Argentina en la fase de grupos se disputarán a menos de tres horas de vuelo de su domicilio. Es la primera vez en cinco Mundiales disputados que el rosarino disputará un torneo en su lugar de vida cotidiana, un detalle aparentemente menor pero con consecuencias importantes en términos físicos, mentales y logísticos.",
      },
      {
        type: "p",
        text: "El factor 'casa' no es despreciable. La rutina mantenida durante semanas, el sueño en su propia cama, la familia presente y el entorno conocido son variables que en torneos cortos pueden marcar la diferencia. Entrenadores como Marcelo Bielsa o el propio Lionel Scaloni han subrayado en distintas oportunidades el peso emocional de jugar 'cerca de casa', y para Messi, con 38 años, todo lo que reduzca el estrés ambiental es una ventaja en estado puro.",
      },
      {
        type: "h2",
        text: "Calendario de la Albiceleste",
      },
      {
        type: "list",
        items: [
          "Argentina vs Marruecos — 13 junio, MetLife Stadium (Nueva York). Debut frente al verdugo del Mundial 2022 en cuartos.",
          "Argentina vs Camerún — 19 junio, Hard Rock Stadium (Miami). Partido en su ciudad, ya considerado evento estelar.",
          "Argentina vs Australia — 24 junio, AT&T Stadium (Dallas). Cierre de fase de grupos, posiblemente con la clasificación ya cerrada.",
          "Posible octavo de final — 28-30 junio, sede según primera o segunda posición del grupo C.",
        ],
      },
      {
        type: "p",
        text: "El partido frente a Camerún en Miami se ha vendido como una semifinal en términos comerciales: las entradas se agotaron en menos de 30 minutos y el mercado secundario alcanzó precios récord. Messi vivirá una de las experiencias más particulares de su carrera al disputar un partido de Mundial en su ciudad, con su familia en la grada y con un público mayoritariamente argentino-americano que llevará el partido casi al estatus de visita 'local' encubierta.",
      },
      {
        type: "h2",
        text: "Inter Miami y la gestión física",
      },
      {
        type: "p",
        text: "Javier Mascherano, técnico de Inter Miami, ya anunció que no dará descanso a Leo en mayo: la franquicia tiene compromisos clave en MLS y la directiva considera contraproducente apartarlo del rodaje. La conversación con Scaloni ha sido fluida y se ha llegado a un acuerdo: Messi tendrá libre las dos últimas semanas antes de la concentración con la selección, lo que le permitirá llegar al primer entrenamiento sin la fatiga de un fin de semana de partido.",
      },
      {
        type: "p",
        text: "El plan físico es probablemente el aspecto más sensible del proceso. A 38 años, Messi necesita un equilibrio fino entre minutos en MLS para mantener ritmo competitivo y descansos para preservar las articulaciones. El cuerpo médico de Argentina trabaja en estrecha coordinación con el del Inter Miami desde febrero, compartiendo datos GPS, ritmo cardíaco y carga interna semana a semana.",
      },
      {
        type: "h2",
        text: "El reto deportivo: defender la corona",
      },
      {
        type: "p",
        text: "Argentina llega a Norteamérica como vigente campeón del Mundo, con la responsabilidad histórica de revalidar el título. Solo dos selecciones lo han logrado consecutivamente: Italia (1934-1938) y Brasil (1958-1962). Repetir sería poner a Messi en un escalón aún superior dentro de la conversación del mejor futbolista de la historia, y emparentarlo con leyendas como Pelé o Maradona en términos de impacto duradero.",
      },
      {
        type: "callout",
        title: "Dato clave",
        text: "Messi acumula 26 partidos jugados en Mundiales con Argentina y es el único futbolista en haber disputado cinco ediciones distintas. Si juega los 7 partidos hasta la final, alcanzará los 33 partidos disputados en Mundiales: récord absoluto de todos los tiempos.",
      },
    ],
  },
  {
    id: 105,
    slug: "jordania-debut-mundial-2026-historia",
    title: "Jordania hace historia: debutará en un Mundial",
    excerpt:
      "Los árabes llegan al Mundial 2026 en el mejor momento de su historia futbolística. Clasificaron por primera vez tras un proyecto que comenzó en 2002.",
    seoDescription:
      "Jordania debutará en el Mundial 2026: las claves del proyecto futbolístico árabe que les llevó por primera vez en la historia a la Copa del Mundo.",
    cat: "selecciones",
    date: "2026-03-25",
    readTime: 5,
    flags: ["jo", "ar"],
    tags: ["Jordania", "Mundial 2026", "AFC", "Debut"],
    featured: false,
    realImage:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80&auto=format&fit=crop",
    imageCaption: "Aficionados celebrando una clasificación histórica",
    imageSource: "Unsplash",
    authorId: "gabriel-venegas",
    body: [
      {
        type: "p",
        text: "Jordania disputará en junio el primer Mundial de su historia. La clasificación quedó sellada tras vencer a Irak por 2-1 en Ammán, un resultado que desató una celebración nacional sin precedentes y que pone fin a más de cuatro décadas intentando llegar a la cita futbolística más importante del planeta. La afición tomó las calles de la capital durante toda la madrugada, con caravanas de coches, banderas y un ambiente que recordó al de pequeñas naciones que han debutado en torneos internacionales.",
      },
      {
        type: "p",
        text: "La hazaña tiene un componente simbólico que va más allá del puro resultado deportivo. Jordania, una nación de 11 millones de habitantes ubicada en el corazón de Oriente Medio, llega al Mundial 2026 representando a una región históricamente postergada en el fútbol mundial y al mismo tiempo confirmando un cambio profundo en la geopolítica deportiva del balompié árabe, que en los últimos años ha invertido recursos sustanciales en infraestructura, formación y profesionalización.",
      },
      {
        type: "h2",
        text: "Un proyecto de 24 años con paciencia y método",
      },
      {
        type: "p",
        text: "El programa de desarrollo arrancó en 2002 con la creación de la academia Shabab Al-Ordon, una iniciativa impulsada directamente por la Casa Real que buscaba dotar al país de una cantera estable y formadora. Veinticuatro años después, el trabajo está dando sus frutos: ocho jugadores del actual once titular son egresados directos del programa, lo que demuestra que la apuesta por la base ha sido la decisión correcta y que la federación supo resistir la tentación del cortoplacismo.",
      },
      {
        type: "p",
        text: "El seleccionador Hussein Ammouta ha construido un equipo joven —con una media de 24,3 años— y con identidad clara: bloque medio, salida desde atrás y transiciones rápidas para aprovechar la velocidad de sus extremos. El esquema 4-2-3-1 que utiliza con regularidad permite tanto cerrar el centro del campo ante rivales superiores como liberar a sus dos referencias ofensivas. Ammouta, marroquí de nacimiento y con paso por equipos del Magreb, conoce a fondo el fútbol árabe y aporta a la selección una organización táctica que rara vez se había visto en Jordania.",
      },
      {
        type: "h2",
        text: "Las estrellas que llevan al equipo al Mundial",
      },
      {
        type: "list",
        items: [
          "Mousa Al-Tamari (Montpellier) — extremo izquierdo, capitán y goleador. Lleva años jugando en Europa y aporta el desborde y la pegada que el equipo necesita en zonas decisivas.",
          "Yazan Al-Naimat (Al-Ahli) — '9' móvil con 14 goles en clasificación. Es el máximo artillero histórico de la selección y la principal amenaza dentro del área.",
          "Noor Al-Rawabdeh (Al-Faisaly) — mediocentro creativo y motor del juego. Encargado de conectar líneas y ralentizar el juego cuando hace falta.",
          "Yazan Al-Arab (Al-Wehdat) — central de futuro, ya en órbita europea. Lectura defensiva precoz y proyección con balón. Varios clubes europeos siguen su evolución.",
          "Anas Bani Yaseen (Al-Wehdat) — pareja en el eje de la defensa. La experiencia que necesita la zaga en partidos de máxima exigencia.",
        ],
      },
      {
        type: "h2",
        text: "El grupo F: España, Marruecos y Costa Rica",
      },
      {
        type: "p",
        text: "El sorteo emparejó a Jordania con España, Marruecos y Costa Rica en el grupo F. La realidad es que la lógica del fútbol coloca a Jordania como cuarta cabeza del grupo, pero el cuerpo técnico no se da por vencido y maneja un objetivo realista pero ambicioso: cualquier resultado positivo será histórico, y el plan interno apunta a competir hasta el último minuto en cada partido para colarse entre los terceros mejor clasificados, una posibilidad real con el formato ampliado a 48 selecciones que abre la puerta a 8 plazas para terceros.",
      },
      {
        type: "p",
        text: "El debut será frente a España el 14 de junio en el SoFi Stadium de Los Ángeles, un escenario inédito para los jordanos. El segundo encuentro contra Marruecos —al que ven como rival decisivo para sus aspiraciones— se disputará en el AT&T Stadium de Dallas, y el cierre ante Costa Rica tendrá lugar en el Estadio Akron de Guadalajara. La logística del viaje es uno de los desafíos: tres ciudades, dos países distintos, una variabilidad climática enorme entre la costa californiana y el centro de México.",
      },
      {
        type: "p",
        text: "El espíritu con el que la selección llega a Norteamérica va más allá del resultado deportivo. El solo hecho de estar en el Mundial implica un salto institucional para la federación jordana, que tendrá que gestionar derechos televisivos, patrocinios, logística internacional y atención mediática a niveles nunca antes vistos en su historia. Un éxito en cualquiera de esos planos será un triunfo a futuro, independientemente del marcador en los partidos.",
      },
      {
        type: "callout",
        title: "Lo que viene",
        text: "Jordania jugará dos amistosos preparatorios en mayo —ante Túnez y Corea del Sur— para afinar la convocatoria definitiva, que se anunciará el 4 de junio. El debut frente a España será el 14 de junio. Para muchos jordanos, ese día será inolvidable.",
      },
    ],
  },
];

/* ------------------------------------------------------------------- */
/* Helpers                                                             */
/* ------------------------------------------------------------------- */

export function getNoticiaBySlug(slug: string): Noticia | undefined {
  return NOTICIAS.find((n) => n.slug === slug);
}

export function getAllNoticiaSlugs(): string[] {
  return NOTICIAS.map((n) => n.slug);
}

export function getRelatedNoticias(current: Noticia, limit = 3): Noticia[] {
  // Score by tag overlap, then category match, then recency
  const others = NOTICIAS.filter((n) => n.slug !== current.slug);
  const scored = others.map((n) => {
    const tagOverlap = n.tags.filter((t) => current.tags.includes(t)).length;
    const catBoost = n.cat === current.cat ? 2 : 0;
    return { n, score: tagOverlap * 3 + catBoost };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.n.date).getTime() - new Date(a.n.date).getTime();
  });
  return scored.slice(0, limit).map((s) => s.n);
}

export function getNoticiasSorted(): Noticia[] {
  return [...NOTICIAS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export const DEFAULT_NOTICIA_AUTHOR = DEFAULT_AUTHOR;
