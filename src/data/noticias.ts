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
        text: "Las pruebas médicas no dieron lugar a dudas: Rodrygo Goes sufrió rotura completa del ligamento cruzado anterior y del menisco interno de la rodilla derecha tras una entrada fortuita en la primera mitad del Real Madrid–Getafe. El club blanco confirmó esta mañana que el delantero será operado en las próximas 48 horas en una clínica privada de Madrid y que el plazo estimado de baja es de ocho meses, lo que lo deja fuera de manera definitiva del Mundial 2026.",
      },
      {
        type: "p",
        text: "La noticia ha caído como un mazazo en Brasil. Rodrygo, de 25 años, vivía su mejor momento futbolístico tras una temporada con números sobresalientes en LaLiga y Champions, y se había convertido en un fijo del once que Carlo Ancelotti perfilaba para encarar la cita norteamericana. La lesión añade un capítulo más a una temporada marcada por las ausencias prolongadas en la Canarinha, que ha tenido que reorganizar su delantera en varias ocasiones durante los últimos seis meses.",
      },
      {
        type: "h2",
        text: "Qué significa para Brasil",
      },
      {
        type: "p",
        text: "Rodrygo era una pieza fija en los planes de Carlo Ancelotti como seleccionador de la Canarinha. El italiano lo había situado en el extremo izquierdo del esquema 4-2-3-1, complementando a Vinicius por la banda contraria y dejando a Endrick como referencia ofensiva en la punta. Su capacidad para asociarse en espacios reducidos, atacar al primer toque y aparecer como falso interior lo convertía en el comodín perfecto para un sistema con muchas variaciones tácticas.",
      },
      {
        type: "p",
        text: "La ausencia obliga a reconsiderar la lista que se hará pública el próximo 15 de mayo. Brasil pierde a un jugador que aportaba versatilidad en tres posiciones distintas (extremo izquierdo, extremo derecho y mediapunta), y eso impacta especialmente en partidos donde se necesite cerrar el campo sin perder profundidad por bandas. Ancelotti tendrá que repensar también si mantiene a Vinicius como referencia única en la izquierda o si abre la puerta a un perfil distinto.",
      },
      {
        type: "h2",
        text: "Posibles relevos en la lista",
      },
      {
        type: "list",
        items: [
          "Antony (Manchester United) — opción natural por banda derecha si Vinicius cambia de lado. Conoce el sistema y ha jugado bajo presión en escenarios europeos exigentes.",
          "Pedro (Flamengo) — vuelve a estar en órbita tras un gran inicio de temporada en el Brasileirão. Un '9' de área, distinto perfil al de Endrick.",
          "Estêvão Willian (Palmeiras / Chelsea) — el comodín joven que ha enamorado a Ancelotti. Aporta verticalidad y desborde por la derecha.",
          "Neymar Jr. (Santos) — la opción más mediática, en plena recuperación física. Su llamado depende de cómo llegue al cierre del Brasileirão.",
          "Raphinha (Barcelona) — un nombre que vuelve al debate, especialmente si Ancelotti busca un extremo con experiencia europea de máximo nivel.",
        ],
      },
      {
        type: "h2",
        text: "El precedente histórico",
      },
      {
        type: "p",
        text: "Brasil llega al Mundial 2026 con un historial de bajas de última hora que ha dejado huella en cada edición. En 2014, el país perdió a Neymar en el infausto partido ante Colombia; en 2018, Marcelo y Casemiro acumularon problemas físicos; en 2022, Neymar volvió a sufrir una lesión clave en la fase de grupos. La salud del grupo siempre ha sido un factor decisivo en el rendimiento en Mundiales, y la baja de Rodrygo, ocho meses antes del torneo, abre dudas sobre cómo gestionar la carga del resto del plantel hasta junio.",
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
        text: "El tiempo apremia. La fase de grupos arranca el 11 de junio y Brasil debutará seis días después contra Marruecos en el AT&T Stadium de Dallas. Ancelotti tendrá que tomar decisiones rápidas, pero la línea editorial del cuerpo técnico es clara: priorizar continuidad táctica sobre nombres. La selección tiene un proyecto de juego instalado y el italiano no quiere reformar el sistema por una baja, por dolorosa que sea.",
      },
      {
        type: "callout",
        title: "Lo que viene",
        text: "Brasil presentará la lista preliminar el 15 de mayo y la definitiva el 4 de junio. Antes, todavía hay tres jornadas de Liga, semifinales de Champions y un amistoso ante Croacia que pueden mover el equilibrio. Rodrygo ya está en Madrid preparando su operación; volverá a los terrenos de juego en torno a noviembre de 2026.",
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
        text: "La conversación volvió a abrirse en la concentración brasileña. Tras conocerse la baja de Rodrygo, fuentes próximas a la CBF confirmaron que el cuerpo técnico de Carlo Ancelotti ha incluido a Neymar en la prelista ampliada de candidatos al Mundial 2026, una decisión que parecía improbable hace solo seis meses pero que la realidad del calendario y de las lesiones ha terminado imponiendo.",
      },
      {
        type: "p",
        text: "El '10' del Santos vive una segunda juventud futbolística desde su regreso al fútbol brasileño en 2024. Lejos del foco mediático del Al-Hilal, donde apenas pudo jugar por culpa de varias lesiones graves, ha encontrado en su club de origen una válvula de escape que le ha permitido recuperar tono físico, ritmo competitivo y, sobre todo, esa sonrisa que parecía haber perdido. Para muchos, su nivel actual es el más estable que se le ha visto en cinco años.",
      },
      {
        type: "h2",
        text: "Forma física: el termómetro",
      },
      {
        type: "p",
        text: "Neymar lleva tres meses sin parones físicos en el Santos, club al que regresó como apuesta personal y emocional. El doblete frente al Palmeiras del fin de semana —incluido un golazo de tijera— es la mejor noticia para el clan del jugador, que ha enviado mensajes públicos al seleccionador en los últimos días subrayando que el delantero está disponible y disponible bien. El cuerpo médico del Santos ha sido el primero en avalar la condición física, algo que pesa en el cuerpo técnico de la Canarinha.",
      },
      {
        type: "list",
        items: [
          "Minutos disputados los últimos 90 días: 1.247",
          "Goles + asistencias en Brasileirão 2026: 7 + 5",
          "Sprints máximos por partido: 18 (top-3 de la liga)",
          "Sesiones perdidas por molestias: 0",
          "Nivel de pulsaciones máximas en partido: 192 (rango óptimo para su edad)",
        ],
      },
      {
        type: "h2",
        text: "El factor Ancelotti",
      },
      {
        type: "p",
        text: "Ancelotti ha repetido en varias entrevistas que su lista será meritocrática. Sin embargo, el italiano también ha admitido que en torneos cortos «la jerarquía pesa». Neymar, con 128 partidos internacionales y 79 goles, encarna esa jerarquía. La pregunta no es si Neymar puede aportar — eso parece probado — sino qué rol específico tendría en un equipo donde Vinicius es el referente ofensivo y donde la generación de Endrick, Estêvão y Pedro presiona con fuerza por minutos.",
      },
      {
        type: "p",
        text: "Las opciones más realistas pasan por usar a Neymar como mediapunta entre líneas o como '9' falso en partidos donde Brasil necesite generar superioridad técnica frente a rivales que cierren espacios. En ningún caso se le ve como titular indiscutible para todos los partidos, pero su presencia podría ser decisiva en momentos puntuales del torneo, especialmente en la fase eliminatoria si Brasil llega a octavos como cabeza de serie.",
      },
      {
        type: "h2",
        text: "El precedente y la herida abierta",
      },
      {
        type: "p",
        text: "Para Neymar, el Mundial 2026 representa también una redención. Ha jugado tres ediciones (2014, 2018, 2022) y en todas se quedó sin la final. La de 2014 acabó con la imagen del país hundido tras el 7-1 ante Alemania y con él en la grada por una lesión. En 2018, una eliminación contra Bélgica en cuartos. En 2022, una despedida en penaltis ante Croacia que volvió a marcar su historia. A los 34 años, esta es probablemente la última oportunidad real de levantar el trofeo.",
      },
      {
        type: "quote",
        text: "Si Ney llega bien, está. No vamos a dejar fuera a un futbolista de su nivel por sentimentalismo, pero tampoco por prejuicio.",
        cite: "Carlo Ancelotti, en rueda de prensa",
      },
      {
        type: "p",
        text: "El llamado se confirmaría definitivamente el 15 de mayo, cuando la federación anuncie la prelista de 35 nombres antes de la convocatoria final. Hasta entonces, Santos juega ocho partidos más y Neymar tiene que mantener el nivel físico y futbolístico que ha exhibido en las últimas semanas. Cualquier recaída cerraría la puerta de manera definitiva.",
      },
      {
        type: "callout",
        title: "Lo que viene",
        text: "Prelista de 35 jugadores el 15 de mayo. Convocatoria definitiva de 26 el 4 de junio. Si entra, Neymar viajará al Mundial con el reto de demostrar que el regreso al Santos fue la mejor decisión de su carrera.",
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
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80&auto=format&fit=crop",
    imageCaption: "Estadio iluminado, contexto del Mundial 2026",
    imageSource: "Unsplash",
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
        type: "quote",
        text: "No vamos solo a participar. Vamos a representar a 11 millones de jordanos y a recordar al mundo que el fútbol árabe ya juega en otra liga.",
        cite: "Hussein Ammouta, seleccionador de Jordania",
      },
      {
        type: "p",
        text: "Las palabras del seleccionador resumen el espíritu con el que la selección llega a Norteamérica. Más allá del resultado deportivo, el solo hecho de estar en el Mundial implica un salto institucional para la federación jordana, que tendrá que gestionar derechos televisivos, patrocinios, logística internacional y atención mediática a niveles nunca antes vistos en su historia. Un éxito en cualquiera de esos planos será un triunfo a futuro, independientemente del marcador en los partidos.",
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
