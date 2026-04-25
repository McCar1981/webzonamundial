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
    id: 100,
    slug: "rodrygo-goes-lesion-mundial-2026",
    title: "¡BOMBA! Rodrygo Goes se pierde el Mundial 2026 por una grave lesión",
    excerpt:
      "El delantero del Real Madrid sufrió una grave lesión jugando ante el Getafe. Rotura del menisco y del ligamento cruzado anterior de la rodilla derecha. Tendrá 8 meses de recuperación y se pierde el sueño de jugar con Brasil.",
    seoDescription:
      "Rodrygo Goes se pierde el Mundial 2026: rotura de menisco y cruzado, 8 meses de baja. Cómo afecta a Brasil y qué jugadores entran en la lista de Ancelotti.",
    cat: "selecciones",
    date: "2026-03-02",
    updatedAt: "2026-03-04",
    readTime: 4,
    flags: ["br"],
    tags: ["Rodrygo", "Brasil", "Real Madrid", "Lesiones", "Mundial 2026"],
    featured: true,
    realImage:
      "https://media.cnn.com/api/v1/images/stellar/prod/gettyimages-2264605162.jpg?q=w_1160,c_fill/f_webp",
    imageCaption: "Rodrygo Goes durante un partido con el Real Madrid",
    imageSource: "Getty Images vía CNN",
    authorId: "carlos-zamudio",
    body: [
      {
        type: "p",
        text: "Las pruebas médicas no dieron lugar a dudas: Rodrygo Goes sufrió rotura completa del ligamento cruzado anterior y del menisco interno de la rodilla derecha tras una entrada fortuita en la primera mitad del Real Madrid–Getafe. El club blanco confirmó esta mañana que el delantero será operado en las próximas 48 horas y que el plazo estimado de baja es de ocho meses.",
      },
      {
        type: "h2",
        text: "Qué significa para Brasil",
      },
      {
        type: "p",
        text: "Rodrygo era una pieza fija en los planes de Carlo Ancelotti como seleccionador de la Canarinha. El italiano lo había situado en el extremo izquierdo del esquema 4-2-3-1, complementando a Vinicius por la banda contraria y dejando a Endrick como referencia ofensiva. La ausencia obliga a reconsiderar la lista que se hará pública el próximo 15 de mayo.",
      },
      {
        type: "h2",
        text: "Posibles relevos en la lista",
      },
      {
        type: "list",
        items: [
          "Antony (Manchester United) — opción natural por banda derecha si Vinicius cambia de lado",
          "Pedro (Flamengo) — vuelve a estar en órbita tras un gran inicio de temporada en el Brasileirão",
          "Estêvão Willian (Palmeiras / Chelsea) — el comodín joven que ha enamorado a Ancelotti",
          "Neymar Jr. (Santos) — la opción más mediática, en plena recuperación física",
        ],
      },
      {
        type: "h3",
        text: "Reacción del jugador",
      },
      {
        type: "quote",
        text: "Estoy destrozado. Llevaba meses soñando con jugar el Mundial en mi continente. Solo me queda apoyar al grupo y volver más fuerte.",
        cite: "Rodrygo Goes, vía Instagram",
      },
      {
        type: "p",
        text: "El tiempo apremia. La fase de grupos arranca el 11 de junio y Brasil debutará seis días después contra Marruecos en el AT&T Stadium de Dallas. Ancelotti tendrá que tomar decisiones rápidas, pero la línea editorial del cuerpo técnico es clara: priorizar continuidad táctica sobre nombres.",
      },
      {
        type: "callout",
        title: "Lo que viene",
        text: "Brasil presentará la lista preliminar el 15 de mayo y la definitiva el 4 de junio. Antes, todavía hay tres jornadas de Liga, semifinales de Champions y un amistoso ante Croacia que pueden mover el equilibrio.",
      },
    ],
  },
  {
    id: 101,
    slug: "neymar-regreso-brasil-mundial-2026",
    title: "Neymar podría volver a la Canarinha por la lesión de Rodrygo",
    excerpt:
      "La ausencia de Rodrygo abre una ventana para el regreso de Neymar. El astro del Santos viene de marcar un doblete en el Brasileirao y Ancelotti podría reconsiderar su convocatoria.",
    seoDescription:
      "Neymar suena con fuerza para volver a Brasil tras la lesión de Rodrygo. Ancelotti reconsidera su llamado para el Mundial 2026 después del doblete con el Santos.",
    cat: "selecciones",
    date: "2026-03-04",
    readTime: 5,
    flags: ["br"],
    tags: ["Neymar", "Brasil", "Santos", "Ancelotti", "Mundial 2026"],
    featured: true,
    realImage:
      "https://images.ctfassets.net/3mv54pzvptwz/7Jj4ryLGJazS8pDUlCK2Vg/10b71577e0270c8158d669b5fca17aa9/54331642772_05fa9ffe6b_o_dentro.jpg",
    imageCaption: "Neymar Jr. durante un partido con el Santos",
    imageSource: "FIFA via Getty Images",
    authorId: "carlos-zamudio",
    body: [
      {
        type: "p",
        text: "La conversación volvió a abrirse en la concentración brasileña. Tras conocerse la baja de Rodrygo, fuentes próximas a la CBF confirmaron que el cuerpo técnico de Carlo Ancelotti ha incluido a Neymar en la prelista ampliada de candidatos al Mundial 2026.",
      },
      {
        type: "h2",
        text: "Forma física: el termómetro",
      },
      {
        type: "p",
        text: "Neymar lleva tres meses sin parones físicos en el Santos, club al que regresó como apuesta personal. El doblete frente al Palmeiras del fin de semana —incluido un golazo de tijera— es la mejor noticia para el clan del jugador, que ha enviado mensajes públicos al seleccionador.",
      },
      {
        type: "list",
        items: [
          "Minutos disputados los últimos 90 días: 1.247",
          "Goles + asistencias en Brasileirão 2026: 7 + 5",
          "Sprints máximos por partido: 18 (top-3 de la liga)",
          "Sesiones perdidas por molestias: 0",
        ],
      },
      {
        type: "h2",
        text: "El factor Ancelotti",
      },
      {
        type: "p",
        text: "Ancelotti ha repetido en varias entrevistas que su lista será meritocrática. Sin embargo, el italiano también ha admitido que en torneos cortos «la jerarquía pesa». Neymar, con 128 partidos internacionales y 79 goles, encarna esa jerarquía.",
      },
      {
        type: "quote",
        text: "Si Ney llega bien, está. No vamos a dejar fuera a un futbolista de su nivel por sentimentalismo, pero tampoco por prejuicio.",
        cite: "Carlo Ancelotti, en rueda de prensa",
      },
      {
        type: "p",
        text: "El llamado se confirmaría definitivamente el 15 de mayo, cuando la federación anuncie la prelista de 35 nombres antes de la convocatoria final.",
      },
    ],
  },
  {
    id: 102,
    slug: "zidane-seleccionador-francia-post-mundial-2026",
    title: "Zinedine Zidane será el DT de Francia después del Mundial 2026",
    excerpt:
      "El presidente de la Federación Francesa confirmó que ya tienen elegido al sucesor de Didier Deschamps. Zidane tomará las riendas tras la Copa del Mundo.",
    seoDescription:
      "Zinedine Zidane sustituirá a Deschamps al frente de Francia tras el Mundial 2026. La FFF lo confirma: contrato de 4 años y plenos poderes deportivos.",
    cat: "selecciones",
    date: "2026-03-23",
    readTime: 6,
    flags: ["fr"],
    tags: ["Zidane", "Francia", "Deschamps", "FFF", "Mundial 2026"],
    featured: true,
    realImage:
      "https://blob.postadeportes.com/images/2026/03/23/zinedine-zidane-ya-tiene-fecha-para-dirigir-a-francia-97eaf274-focus-0.2-0.41-1479-828.webp",
    imageCaption: "Zinedine Zidane",
    imageSource: "Posta Deportes",
    authorId: "gabriel-venegas",
    body: [
      {
        type: "p",
        text: "Lo que era un secreto a voces ya es oficial. La Federación Francesa de Fútbol (FFF) confirmó este viernes que Zinedine Zidane sustituirá a Didier Deschamps al frente de Les Bleus a partir del 1 de agosto de 2026, una vez concluido el Mundial.",
      },
      {
        type: "h2",
        text: "Cuatro años y plenos poderes",
      },
      {
        type: "p",
        text: "El contrato presentado en la sede de la FFF en Saint-Denis tiene una duración de cuatro años (hasta el Mundial 2030, que organizarán España, Portugal y Marruecos) e incluye —según ha confirmado L'Équipe— plena autonomía deportiva: Zidane elige cuerpo técnico, plan táctico y participa en la planificación de centros de tecnificación.",
      },
      {
        type: "h2",
        text: "El legado de Deschamps",
      },
      {
        type: "list",
        items: [
          "138 partidos como seleccionador (récord histórico)",
          "Campeón del Mundo 2018",
          "Subcampeón del Mundo 2022 y de la Eurocopa 2016",
          "Mejor balance ofensivo entre todos los seleccionadores en torneos cortos",
        ],
      },
      {
        type: "p",
        text: "El propio Deschamps reconoció que «era el momento de pasar el testigo» y confirmó que no continuará ligado a la FFF en ningún rol de asesor o director técnico, dejando vía libre a Zidane.",
      },
      {
        type: "quote",
        text: "Volver a vestir el chándal de Francia, ahora desde el banquillo, es el último paso de un viaje que empezó hace 30 años. Solo pido respeto al proceso.",
        cite: "Zinedine Zidane, en su presentación",
      },
      {
        type: "h3",
        text: "Reacciones desde el vestuario",
      },
      {
        type: "p",
        text: "Kylian Mbappé, capitán y referente del equipo, fue de los primeros en publicar un mensaje de bienvenida en redes. Antoine Griezmann, en una entrevista con TF1, calificó la elección de «inevitable» y «merecida». Eduardo Camavinga, ex pupilo de Zidane en el Real Madrid, describió la noticia como «un sueño hecho realidad».",
      },
    ],
  },
  {
    id: 103,
    slug: "cristiano-ronaldo-recuperacion-madrid-portugal-mundial",
    title: "Cristiano Ronaldo se recupera en Madrid: 'Mejorando cada día'",
    excerpt:
      "El astro portugués no pudo decir presente en los amistosos de marzo y se recupera en Madrid de su lesión. A sus 41 años, el Bicho busca llegar en forma al Mundial 2026.",
    seoDescription:
      "Cristiano Ronaldo, 41 años, se recupera en Madrid de cara al Mundial 2026. Plan de readaptación, expectativas con Portugal y rol con Roberto Martínez.",
    cat: "selecciones",
    date: "2026-03-24",
    readTime: 5,
    flags: ["pt"],
    tags: ["Cristiano Ronaldo", "Portugal", "Mundial 2026", "Lesiones"],
    featured: false,
    realImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/800px-Cristiano_Ronaldo_2018.jpg",
    imageCaption: "Cristiano Ronaldo con Portugal en 2018",
    imageSource: "Wikimedia Commons",
    authorId: "gabriel-venegas",
    body: [
      {
        type: "p",
        text: "Cristiano Ronaldo dejó la concentración portuguesa el pasado 17 de marzo y desde entonces realiza su recuperación en una clínica privada de Madrid junto a su preparador de confianza, Bruno Carvalho. La FPF informó que el delantero del Al-Nassr se reincorporará al grupo el 12 de mayo.",
      },
      {
        type: "h2",
        text: "El parte médico",
      },
      {
        type: "p",
        text: "Se trata de una rotura de baja afectación en el sóleo de la pierna derecha. La lesión, sufrida en un entrenamiento, no requiere cirugía y los tiempos de recuperación oscilan entre 4 y 6 semanas. Cristiano publicó este lunes una historia en Instagram: «mejorando cada día» sobre una sesión de fisioterapia.",
      },
      {
        type: "h2",
        text: "El plan de Roberto Martínez",
      },
      {
        type: "list",
        items: [
          "Carga progresiva con dos sesiones diarias de gimnasio",
          "Vuelta al césped sin balón el 28 de abril",
          "Sesiones grupales con la selección desde el 12 de mayo",
          "Decisión definitiva sobre la lista para el 4 de junio",
        ],
      },
      {
        type: "p",
        text: "Roberto Martínez ha repetido en privado que cuenta con CR7 «si llega al 100% y acepta un rol de impacto en partidos importantes». La idea del seleccionador es que el portugués sea suplente de inicio en algunas eliminatorias, dejando el peso ofensivo a Bernardo Silva, Diogo Jota y João Félix.",
      },
      {
        type: "quote",
        text: "El Mundial 2026 puede ser el último. Lo será, casi con seguridad. Voy a llegar en condiciones de aportar lo que se espera de mí.",
        cite: "Cristiano Ronaldo, entrevista con A Bola",
      },
    ],
  },
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
    realImage:
      "https://media.elcomercio.com/wp-content/uploads/2025/12/lionel-messi-2-1024x683.jpg",
    imageCaption: "Lionel Messi con el Inter de Miami",
    imageSource: "El Comercio",
    authorId: "carlos-zamudio",
    body: [
      {
        type: "p",
        text: "Lionel Messi llega al Mundial 2026 con un factor inédito en su carrera: jugará la cita más importante de la temporada en su ciudad de residencia. Desde julio de 2023 reside en Miami con su familia, y la mayoría de los partidos de Argentina en la fase de grupos se disputarán a menos de tres horas de vuelo.",
      },
      {
        type: "h2",
        text: "Calendario de la Albiceleste",
      },
      {
        type: "list",
        items: [
          "Argentina vs Marruecos — 13 junio, MetLife Stadium (Nueva York)",
          "Argentina vs Camerún — 19 junio, Hard Rock Stadium (Miami)",
          "Argentina vs Australia — 24 junio, AT&T Stadium (Dallas)",
        ],
      },
      {
        type: "p",
        text: "El partido frente a Camerún en Miami se ha vendido como una semifinal en términos comerciales: las entradas se agotaron en menos de 30 minutos. Messi vivirá una de las experiencias más particulares de su carrera al disputar un partido de Mundial en su ciudad.",
      },
      {
        type: "h2",
        text: "Inter Miami y la gestión física",
      },
      {
        type: "p",
        text: "Javier Mascherano, técnico de Inter Miami, ya anunció que no dará descanso a Leo en mayo: la franquicia tiene compromisos clave en MLS y la directiva considera contraproducente apartarlo del rodaje. Messi, sin embargo, sí tendrá libre las dos semanas previas al Mundial para preparar la concentración con la selección.",
      },
      {
        type: "callout",
        title: "Dato clave",
        text: "Messi acumula 14 Mundiales jugados con Argentina y es el único futbolista en haber disputado 5 ediciones distintas. Si juega los 7 partidos hasta la final, alcanzará los 30 minutos disputados en Mundiales: récord absoluto.",
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
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Jordan_national_football_team.jpg/800px-Jordan_national_football_team.jpg",
    imageCaption: "Selección de Jordania",
    imageSource: "Wikimedia Commons",
    authorId: "gabriel-venegas",
    body: [
      {
        type: "p",
        text: "Jordania disputará en junio el primer Mundial de su historia. Los hijos del rey Abdalá II celebraron su clasificación tras vencer a Irak por 2-1 en Ammán, en un partido que el país recordará durante décadas.",
      },
      {
        type: "h2",
        text: "Un proyecto de 24 años",
      },
      {
        type: "p",
        text: "El programa de desarrollo arrancó en 2002 con la creación de la academia Shabab Al-Ordon. Hoy, 24 años después, ese trabajo está dando sus frutos: 8 jugadores del actual XI titular son egresados directos del programa, y el seleccionador Hussein Ammouta ha construido un equipo joven —media de 24,3 años— con identidad clara: bloque medio, salida desde atrás y transiciones.",
      },
      {
        type: "h2",
        text: "Las estrellas a seguir",
      },
      {
        type: "list",
        items: [
          "Mousa Al-Tamari (Montpellier) — extremo izquierdo, capitán y goleador",
          "Yazan Al-Naimat (Al-Ahli) — '9' móvil, 14 goles en clasificación",
          "Noor Al-Rawabdeh (Al-Faisaly) — mediocentro creativo, motor del juego",
          "Yazan Al-Arab (Al-Wehdat) — central de futuro, ya en órbita europea",
        ],
      },
      {
        type: "p",
        text: "El sorteo emparejó a Jordania con España, Marruecos y Costa Rica en el grupo F. La sensación interna del cuerpo técnico es que cualquier resultado positivo será histórico, pero internamente apuntan a colarse entre los terceros mejor clasificados.",
      },
      {
        type: "quote",
        text: "No vamos solo a participar. Vamos a representar a 11 millones de jordanos y a recordar al mundo que el fútbol árabe ya juega en otra liga.",
        cite: "Hussein Ammouta, seleccionador de Jordania",
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
