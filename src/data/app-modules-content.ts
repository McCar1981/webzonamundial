// src/data/app-modules-content.ts
// Contenido específico de cada módulo de la app: comparativa Free vs
// Founders Pass + FAQ con preguntas reales que la gente busca en Google.
//
// Este contenido alimenta las landings /app/[slug] desde un único sitio.
// Si quieres cambiar la copy, lo haces aquí y se actualiza en la landing.

import type { CompareRow } from "@/components/app-modules/ModuleFreeVsFounders";
import type { FAQItem } from "@/components/app-modules/ModuleFAQ";

export interface ModuleContent {
  slug: string;
  label: string;
  /** Frase corta para meta description y cards. */
  shortPitch: string;
  /** Comparativa Free vs Founders. */
  compare: CompareRow[];
  /** FAQ específica del módulo (3-5 preguntas). */
  faq: FAQItem[];
  /** Keywords objetivo para meta. */
  keywords?: string[];
}

export const MODULE_CONTENT: Record<string, ModuleContent> = {
  predicciones: {
    slug: "predicciones",
    label: "Predicciones",
    shortPitch:
      "Predice los 104 partidos del Mundial 2026: marcador exacto, ganador, goleadores y MVP. Puntos en tiempo real y ranking global.",
    compare: [
      { feature: "Predicciones de los 104 partidos", free: true, founders: true },
      { feature: "Tipos de predicción (resultado, ganador, goleador)", free: "8 tipos", founders: "8 tipos" },
      { feature: "Ranking global", free: true, founders: true },
      { feature: "Estadísticas avanzadas (xG, mapas de calor)", free: false, founders: true },
      { feature: "Sin publicidad mientras juegas", free: false, founders: true },
      { feature: "Insignia Founders en tu perfil", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Cuántos puntos vale acertar el resultado exacto?",
        a: "10 puntos por marcador exacto, 5 puntos por ganador correcto con diferencia de goles, 3 puntos por solo el ganador, 2 por empate sin marcador exacto. Hay bonificaciones por goleador correcto y MVP del partido.",
      },
      {
        q: "¿Hasta cuándo puedo cambiar mi predicción?",
        a: "Puedes editar tu predicción hasta 15 minutos antes del kickoff de cada partido. Después se bloquea automáticamente.",
      },
      {
        q: "¿Las predicciones de eliminatorias valen más?",
        a: "Sí. Los puntos se multiplican por fase: x1 grupos, x2 cuartos, x3 semis, x4 final. También hay bonus por bracket completo correcto y por racha perfecta.",
      },
      {
        q: "¿Es gratis predecir?",
        a: "Sí. Las predicciones son completamente gratis en el plan base. El Founders Pass añade estadísticas avanzadas y navegación sin publicidad.",
      },
    ],
    keywords: ["predicciones mundial 2026", "quiniela mundial 2026", "pronosticos mundial 2026"],
  },

  fantasy: {
    slug: "fantasy",
    label: "Fantasy Mundial",
    shortPitch:
      "Arma tu 11 ideal con los mejores jugadores del Mundial 2026 dentro de un presupuesto de créditos. Capitán doble, cambios entre jornadas y ranking global.",
    compare: [
      { feature: "Armar XI con presupuesto de créditos", free: true, founders: true },
      { feature: "Capitán → puntos x2", free: true, founders: true },
      { feature: "Cambios entre jornadas", free: "3 cambios", founders: "Ilimitados" },
      { feature: "Ligas privadas con amigos", free: true, founders: true },
      { feature: "Comparador avanzado de jugadores", free: false, founders: true },
      { feature: "Predicciones IA Coach integradas", free: "Limitadas", founders: "Ilimitadas" },
      { feature: "Sin publicidad", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Cuánto presupuesto tengo para armar mi equipo?",
        a: "Empiezas con 100 créditos para armar tu XI ideal. Cada jugador tiene un valor en créditos según su nivel y rendimiento esperado. Lautaro, Mbappé o Yamal son caros; jugadores de selecciones secundarias son más baratos.",
      },
      {
        q: "¿Cómo se ganan puntos en Fantasy?",
        a: "Gol +5, asistencia +3, valla cero (porteros y defensas) +4, MVP del partido +2, cada minuto jugado +0,1. Tarjeta amarilla -1, roja -3. El capitán dobla todos los puntos.",
      },
      {
        q: "¿Puedo crear una liga con mis amigos?",
        a: "Sí. Crea una liga privada con un código de invitación, compártelo por WhatsApp y compite solo contra ellos en una tabla aparte de la global.",
      },
      {
        q: "¿Cuándo puedo hacer cambios en mi equipo?",
        a: "Las ventanas de cambio se abren entre jornadas. En el plan Free tienes 3 cambios por jornada; con Founders Pass son ilimitados.",
      },
    ],
    keywords: ["fantasy mundial 2026", "fantasy futbol mundial", "armar equipo mundial 2026"],
  },

  "ia-coach": {
    slug: "ia-coach",
    label: "IA Coach",
    shortPitch:
      "Tu analista personal con IA. Recibe recomendaciones tácticas, predicciones razonadas y consejos de fantasy basados en datos reales del Mundial.",
    compare: [
      { feature: "Consultas al IA Coach", free: "10/día", founders: "Ilimitadas" },
      { feature: "Recomendaciones de fantasy", free: true, founders: true },
      { feature: "Análisis táctico previo a partidos", free: "1/día", founders: "Ilimitado" },
      { feature: "Comparador de jugadores con IA", free: false, founders: true },
      { feature: "Predicciones razonadas con justificación", free: "Resumen", founders: "Detallado" },
    ],
    faq: [
      {
        q: "¿Qué tipo de preguntas puedo hacerle al IA Coach?",
        a: "Cualquiera relacionada con el Mundial 2026: '¿Quién es mejor titular en mi fantasy entre Mbappé y Vinicius esta jornada?', '¿Cuál es el partido con más probabilidad de over 2.5?', 'Hazme un resumen del Argentina-Francia'. El IA combina datos de BIBLIA, partidos previos y rendimientos en clubes.",
      },
      {
        q: "¿En qué se basa la IA?",
        a: "El modelo usa datos de la BIBLIA Mundial 2026, estadísticas de las clasificatorias, rendimiento en clubes durante 2024-25, alineaciones probables y resultados de partidos amistosos. Los datos se actualizan diariamente.",
      },
      {
        q: "¿La IA es gratis?",
        a: "Sí. El plan Free incluye 10 consultas al día. Con Founders Pass son ilimitadas y desbloqueas el modo análisis profundo con justificación detallada.",
      },
      {
        q: "¿Sustituye al consejo humano?",
        a: "No. El IA Coach es un complemento. Combina sus recomendaciones con tu intuición y los análisis editoriales del blog para tomar mejores decisiones.",
      },
    ],
    keywords: ["ia coach mundial", "inteligencia artificial mundial 2026", "analista futbol ia"],
  },

  trivia: {
    slug: "trivia",
    label: "Trivia Mundial",
    shortPitch:
      "Más de 2.000 preguntas sobre la historia y actualidad del Mundial. Modos rápido, torneo y categorías. Ranking diario, semanal y global.",
    compare: [
      { feature: "Banco de preguntas", free: "1.000+", founders: "2.000+" },
      { feature: "Modo rápido (30s/preg)", free: true, founders: true },
      { feature: "Modo torneo", free: true, founders: true },
      { feature: "Categorías (jugadores, finales, sedes)", free: "5", founders: "12" },
      { feature: "Ranking diario/semanal/global", free: true, founders: true },
      { feature: "Sin publicidad mientras juegas", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Cuánto duran las partidas?",
        a: "Modo rápido: 10 preguntas con 30 segundos cada una. Modo torneo: rondas eliminatorias contra otros usuarios. Categorías: 20 preguntas sin tiempo límite.",
      },
      {
        q: "¿Las preguntas se repiten?",
        a: "El sistema rota dinámicamente entre las 2.000+ preguntas, así que la probabilidad de repetir en partidas seguidas es muy baja.",
      },
      {
        q: "¿Puedo competir contra mis amigos?",
        a: "Sí. Crea una sala privada con código de invitación o únete a la sala global donde 100 jugadores responden las mismas preguntas en directo.",
      },
    ],
    keywords: ["trivia mundial 2026", "preguntas mundial futbol", "quiz mundial 2026"],
  },

  matchcenter: {
    slug: "matchcenter",
    label: "Match Center",
    shortPitch:
      "Sigue los 104 partidos en directo: alineaciones, goles, tarjetas, sustituciones y stats minuto a minuto. La cabina del Mundial en tu pantalla.",
    compare: [
      { feature: "Eventos en vivo (goles, tarjetas, cambios)", free: true, founders: true },
      { feature: "Alineaciones confirmadas", free: true, founders: true },
      { feature: "Stats básicas (posesión, tiros)", free: true, founders: true },
      { feature: "Stats avanzadas (xG, xA, mapas de calor)", free: false, founders: true },
      { feature: "Comparador histórico de equipos", free: false, founders: true },
      { feature: "Sin publicidad durante el directo", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿La información es en tiempo real?",
        a: "Sí. Los eventos se actualizan con un retraso máximo de 30 segundos respecto al directo televisivo. Usamos feed oficial vía API-Football.",
      },
      {
        q: "¿Qué son las stats avanzadas?",
        a: "xG (Expected Goals) mide la calidad de cada ocasión, xA (Expected Assists) la calidad de los pases que llevaron a tiro, y los mapas de calor muestran zonas de actividad de cada jugador.",
      },
      {
        q: "¿Funciona si no veo el partido por TV?",
        a: "Sí. Match Center es independiente: puedes seguir cualquier partido del Mundial completo solo desde la app, sin necesidad de retransmisión televisiva.",
      },
    ],
    keywords: ["match center mundial", "partidos directo mundial 2026", "estadisticas en vivo mundial"],
  },

  ligas: {
    slug: "ligas",
    label: "Ligas Privadas",
    shortPitch:
      "Compite contra tus amigos, oficina o familia. Crea una liga, comparte código de invitación y mide quién la pega más en predicciones, fantasy y trivia.",
    compare: [
      { feature: "Crear liga privada", free: "Hasta 1 liga", founders: "Hasta 10 ligas" },
      { feature: "Miembros por liga", free: "20", founders: "Ilimitado" },
      { feature: "Mezclar puntos de Predicciones + Fantasy + Trivia", free: true, founders: true },
      { feature: "Retos personalizables", free: false, founders: true },
      { feature: "Compartir progreso por WhatsApp", free: true, founders: true },
    ],
    faq: [
      {
        q: "¿Cómo invito a mis amigos?",
        a: "Cuando creas la liga te generamos un código de 6 caracteres. Comparte por WhatsApp, email o redes y todos los que se unan con ese código entran a tu liga.",
      },
      {
        q: "¿Cómo se calcula la puntuación de una liga?",
        a: "Suma de puntos de cada miembro en Predicciones + Fantasy + Trivia. La tabla se actualiza en tiempo real conforme se juegan los partidos.",
      },
      {
        q: "¿Puedo expulsar a alguien de mi liga?",
        a: "Sí, el creador de la liga es admin y puede expulsar miembros, cambiar el nombre de la liga o cerrarla cuando quiera.",
      },
    ],
    keywords: ["liga privada mundial 2026", "competicion amigos mundial", "porra mundial oficina"],
  },

  rankings: {
    slug: "rankings",
    label: "Rankings",
    shortPitch:
      "Tu posición global en tiempo real. Compite por país, por liga, por amigos. Insignias, niveles y reconocimiento por tus aciertos.",
    compare: [
      { feature: "Ranking global", free: true, founders: true },
      { feature: "Ranking por país", free: true, founders: true },
      { feature: "Ranking por liga privada", free: true, founders: true },
      { feature: "Histórico de tus posiciones", free: "Última semana", founders: "Todo el Mundial" },
      { feature: "Insignia Founders permanente", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Cómo se calcula mi posición?",
        a: "Suma total de puntos de todos los módulos donde participas: Predicciones + Fantasy + Trivia. Se actualiza en tiempo real cuando se juega cada partido.",
      },
      {
        q: "¿Hay premios para los primeros del ranking?",
        a: "No. ZonaMundial es un juego 100% gratuito y sin premios en metálico ni de ningún tipo: se compite por puntos, insignias y el pique sano del ranking. Los miembros del Founders Pass tienen acceso a un ranking exclusivo aparte.",
      },
    ],
    keywords: ["ranking mundial 2026", "clasificacion predicciones mundial", "tabla aciertos mundial"],
  },

  streaming: {
    slug: "streaming",
    label: "Streaming + Creators",
    shortPitch:
      "Sigue los partidos comentados por nueve creators de fútbol oficiales de ZonaMundial. Chat sincronizado y reacciones en directo.",
    compare: [
      { feature: "Acceso a streams de creators", free: true, founders: true },
      { feature: "Chat en directo durante stream", free: true, founders: true },
      { feature: "Stickers y emojis del Mundial", free: "Pack básico", founders: "Pack premium" },
      { feature: "Bonus exclusivos de creators", free: false, founders: true },
      { feature: "Sin anuncios pre-stream", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Quiénes son los nueve creators?",
        a: "Anunciaremos la lista oficial antes del 11 de junio. Son creadores con audiencia en YouTube, Twitch y TikTok especializados en fútbol y selecciones.",
      },
      {
        q: "¿Se ven los partidos en la app?",
        a: "No retransmitimos los partidos directamente (los derechos los tienen las TVs locales). Los creators comentan EN PARALELO mientras tú ves el partido por tu canal habitual.",
      },
    ],
    keywords: ["streaming mundial 2026", "creators futbol mundial", "comentar partidos mundial"],
  },

  album: {
    slug: "album",
    label: "Álbum Digital",
    shortPitch:
      "Colecciona estampas digitales únicas de los 48 selecciones, momentos icónicos y jugadores estrella. Trading entre usuarios.",
    compare: [
      { feature: "Estampas básicas (banderas, jugadores)", free: "100", founders: "100" },
      { feature: "Packs de estampas al registrarte", free: "1 pack/día", founders: "3 packs/día" },
      { feature: "Trading con otros usuarios", free: true, founders: true },
      { feature: "Estampas Founders exclusivas (numeradas)", free: false, founders: true },
      { feature: "Recompensas extra al completar el álbum", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Cómo consigo estampas?",
        a: "Cada día se desbloquea un pack gratuito (3 si tienes Founders Pass). También ganas estampas extra al completar misiones diarias o llegar a niveles del Modo Carrera.",
      },
      {
        q: "¿Puedo intercambiar repetidas con otros usuarios?",
        a: "Sí. Sistema de trading con confirmación mutua. Sin dinero real involucrado: solo cambio de estampas.",
      },
      {
        q: "¿Las estampas son NFTs o algo así?",
        a: "No. Son digitales y solo viven dentro de la app. No hay blockchain ni venta a terceros.",
      },
    ],
    keywords: ["album digital mundial 2026", "estampas mundial 2026", "coleccion mundial digital"],
  },

  chat: {
    slug: "chat",
    label: "Chat y Comunidad",
    shortPitch:
      "Sala de chat por país, partido, grupo o liga privada. Reacciones, encuestas instantáneas y moderación contra el spam.",
    compare: [
      { feature: "Chat global y por partido", free: true, founders: true },
      { feature: "Chat por país", free: true, founders: true },
      { feature: "Chat por liga privada", free: true, founders: true },
      { feature: "Reacciones avanzadas y stickers", free: "Básicos", founders: "Pack completo" },
      { feature: "Insignia Founders en tus mensajes", free: false, founders: true },
      { feature: "Crear encuestas instantáneas", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Hay moderación?",
        a: "Sí. Filtro automático de palabras ofensivas + sistema de reportes. Mensajes con amenazas o insultos graves se borran automáticamente y el usuario es advertido.",
      },
      {
        q: "¿Puedo silenciar a alguien?",
        a: "Sí. Cualquier usuario puede silenciar a otro: dejarás de ver sus mensajes en cualquier sala. Sin que la otra persona lo sepa.",
      },
    ],
    keywords: ["chat mundial 2026", "comunidad futbol mundial", "foro mundial 2026"],
  },

  micro: {
    slug: "micro",
    label: "Micro-predicciones",
    shortPitch:
      "Jugadas relámpago durante el partido en vivo: ¿gol en los próximos minutos?, ¿se marca el penalti?, ¿cae tarjeta? Eliges en segundos y se resuelve solo con datos reales.",
    compare: [
      { feature: "Micro-predicciones en vivo en cada partido", free: true, founders: true },
      { feature: "Recompensas en Fútcoins y XP (billetera única)", free: true, founders: true },
      { feature: "Modo Fantasma (práctica, solo XP)", free: true, founders: true },
      { feature: "Insignia Founders visible", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿En qué se diferencia de las Predicciones normales?",
        a: "Las Predicciones se hacen antes del partido; las micro-predicciones se juegan DURANTE el directo sobre lo que está a punto de pasar, y se resuelven en minutos con los eventos oficiales del partido.",
      },
      {
        q: "¿Qué pasa si la jugada se anula (VAR, penalti repetido…)?",
        a: "La micro-predicción se anula con ella: no cuenta como fallo. Solo resuelven las jugadas con desenlace real confirmado por los datos del partido.",
      },
    ],
    keywords: ["micro predicciones mundial 2026", "predicciones en vivo mundial 2026"],
  },

  "modo-carrera": {
    slug: "modo-carrera",
    label: "Modo Carrera",
    shortPitch:
      "Niveles, misiones, logros desbloqueables y skin de perfil. Vivir el Mundial como un videojuego: cuanto más juegues, más subes.",
    compare: [
      { feature: "Niveles del 1 al 100", free: true, founders: true },
      { feature: "Misiones diarias y semanales", free: true, founders: true },
      { feature: "Logros desbloqueables", free: "30+", founders: "50+" },
      { feature: "Skin de perfil exclusiva Founders", free: false, founders: true },
      { feature: "XP boost x2 en partidas", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Cómo gano XP?",
        a: "Cada predicción acertada, cada estampa nueva, cada partida de trivia, cada compañero invitado a una liga te da XP. Las misiones diarias multiplican el ratio.",
      },
      {
        q: "¿Sirve para algo subir nivel?",
        a: "Sí. Desbloqueas logros visibles en tu perfil, skins exclusivas según el rango y bonificaciones en otros módulos (más estampas en el álbum, prioridad en torneos de trivia).",
      },
    ],
    keywords: ["modo carrera mundial 2026", "gamificacion futbol", "logros mundial 2026"],
  },

  stories: {
    slug: "stories",
    label: "Stories",
    shortPitch:
      "El feed visual del Mundial en formato vertical 24h. Lo más viral del día, jugadas destacadas y reacciones de la comunidad.",
    compare: [
      { feature: "Ver stories del día", free: true, founders: true },
      { feature: "Publicar stories propias", free: "1/día", founders: "10/día" },
      { feature: "Stickers y filtros del Mundial", free: "Básicos", founders: "Premium" },
      { feature: "Stories destacadas en home", free: false, founders: true },
    ],
    faq: [
      {
        q: "¿Las stories desaparecen a las 24h?",
        a: "Sí, igual que en otras redes sociales. Excepto las marcadas como destacadas, que persisten en tu perfil.",
      },
      {
        q: "¿Puedo ver quién ha visto mi story?",
        a: "Sí. Lista de visualizaciones disponible para el creador, sin contadores de tiempo de visualización (mantenemos privacidad).",
      },
    ],
    keywords: ["stories mundial 2026", "feed visual mundial 2026"],
  },
};

export function getModuleContent(slug: string): ModuleContent | null {
  return MODULE_CONTENT[slug] ?? null;
}
