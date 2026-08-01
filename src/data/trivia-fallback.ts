// src/data/trivia-fallback.ts
//
// Banco ESTÁTICO de preguntas de trivia, todas sobre hechos verificables y
// atemporales (historia de Mundiales, formato/sedes 2026, reglas). Se usa como
// red de seguridad cuando la generación con Claude no está disponible (falta de
// ANTHROPIC_API_KEY, error del modelo, o el cron diario aún no ha corrido), de
// modo que la trivia NUNCA se queda sin preguntas. El pipeline de IA sigue
// siendo la fuente principal; esto solo garantiza que el juego siempre carga.

import type { TriviaQuestion } from "@/lib/trivia/types";

export const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  {
    id: "fb-1",
    question: "¿Qué país ganó el primer Mundial de fútbol, en 1930?",
    options: ["Uruguay", "Argentina", "Brasil", "Italia"],
    correctIndex: 0,
    category: "historia",
    difficulty: "facil",
    explanation: "Uruguay lo ganó como anfitrión en 1930, venciendo a Argentina en la final.",
  },
  {
    id: "fb-2",
    question: "¿Quién marcó el gol de 'La Mano de Dios' en el Mundial de 1986?",
    options: ["Diego Maradona", "Jorge Valdano", "Gabriel Batistuta", "Mario Kempes"],
    correctIndex: 0,
    category: "historia",
    difficulty: "facil",
    explanation: "Maradona lo marcó con la mano ante Inglaterra en cuartos de México 86.",
  },
  {
    id: "fb-3",
    question: "¿Qué selección ha ganado más Mundiales en la historia?",
    options: ["Brasil", "Alemania", "Italia", "Argentina"],
    correctIndex: 0,
    category: "historia",
    difficulty: "facil",
    explanation: "Brasil acumula 5 títulos mundiales, más que ninguna otra selección.",
  },
  {
    id: "fb-4",
    question: "¿Qué selección ganó el Mundial de Catar 2022?",
    options: ["Argentina", "Francia", "Brasil", "Croacia"],
    correctIndex: 0,
    category: "historia",
    difficulty: "facil",
    explanation: "Argentina venció a Francia en penaltis tras un 3-3 en la final.",
  },
  {
    id: "fb-5",
    question: "¿Qué selección ganó el Mundial de Rusia 2018?",
    options: ["Francia", "Croacia", "Bélgica", "Inglaterra"],
    correctIndex: 0,
    category: "historia",
    difficulty: "media",
    explanation: "Francia ganó su segundo título al vencer 4-2 a Croacia en la final.",
  },
  {
    id: "fb-6",
    question: "¿Qué país ganó el Mundial de Sudáfrica 2010?",
    options: ["España", "Países Bajos", "Alemania", "Uruguay"],
    correctIndex: 0,
    category: "historia",
    difficulty: "media",
    explanation: "España ganó su primer Mundial con gol de Iniesta ante Países Bajos.",
  },
  {
    id: "fb-7",
    question: "¿Qué jugador ganó el Balón de Oro al mejor del Mundial 2022?",
    options: ["Lionel Messi", "Kylian Mbappé", "Luka Modric", "Neymar"],
    correctIndex: 0,
    category: "historia",
    difficulty: "media",
    explanation: "Messi fue elegido mejor jugador del torneo que coronó su carrera.",
  },
  {
    id: "fb-8",
    question: "¿Qué selección ganó el Mundial de 1966, disputado en su país?",
    options: ["Inglaterra", "Alemania", "Italia", "Portugal"],
    correctIndex: 0,
    category: "historia",
    difficulty: "dificil",
    explanation: "Inglaterra venció 4-2 a Alemania Federal en Wembley, su único título.",
  },
  {
    id: "fb-9",
    question: "¿Quién es el máximo goleador en la historia de los Mundiales?",
    options: ["Miroslav Klose", "Ronaldo Nazário", "Gerd Müller", "Just Fontaine"],
    correctIndex: 0,
    category: "historia",
    difficulty: "dificil",
    explanation: "El alemán Klose marcó 16 goles en cuatro Mundiales (2002-2014).",
  },
  {
    id: "fb-10",
    question: "¿Qué país organizó y ganó el Mundial de 1998?",
    options: ["Francia", "Brasil", "Italia", "Alemania"],
    correctIndex: 0,
    category: "historia",
    difficulty: "media",
    explanation: "Francia ganó su primer Mundial venciendo 3-0 a Brasil en la final.",
  },
  {
    id: "fb-11",
    question: "¿Quién tiene el récord de más goles en una sola edición de un Mundial?",
    options: ["Just Fontaine", "Sándor Kocsis", "Gerd Müller", "Ronaldo Nazário"],
    correctIndex: 0,
    category: "historia",
    difficulty: "experta",
    explanation: "El francés Just Fontaine marcó 13 goles en el Mundial de 1958.",
  },
  {
    id: "fb-12",
    question: "¿Qué portero es el único en ganar el Balón de Oro de un Mundial?",
    options: ["Oliver Kahn", "Lev Yashin", "Gianluigi Buffon", "Iker Casillas"],
    correctIndex: 0,
    category: "historia",
    difficulty: "experta",
    explanation: "El alemán Oliver Kahn fue el mejor jugador del Mundial 2002.",
  },
  // fb-13 … fb-18 (las de arriba, en futuro) están RETIRADAS: preguntaban por
  // el Mundial 2026 como si aún no hubiera pasado. Sus reemplazos llevan id
  // nuevo (fbm-*) porque addToBank deduplica por id: reescribir el texto sin
  // cambiar el id habría dejado la versión vieja congelada en el banco de KV.
  {
    id: "fbm-1",
    question: "¿En qué tres países se celebró el Mundial 2026?",
    options: [
      "EEUU, México y Canadá",
      "EEUU y México",
      "México y Canadá",
      "EEUU, Canadá y Brasil",
    ],
    correctIndex: 0,
    category: "historia",
    difficulty: "facil",
    explanation: "Fue el primer Mundial organizado por tres países anfitriones.",
  },
  {
    id: "fbm-2",
    question: "¿Cuántas selecciones participaron en el Mundial 2026?",
    options: ["48", "32", "24", "64"],
    correctIndex: 0,
    category: "historia",
    difficulty: "facil",
    explanation: "El torneo se amplió de 32 a 48 selecciones por primera vez.",
  },
  {
    id: "fbm-3",
    question: "¿Cuántos partidos se jugaron en el Mundial 2026?",
    options: ["104", "64", "80", "96"],
    correctIndex: 0,
    category: "historia",
    difficulty: "media",
    explanation: "Con 48 equipos el torneo pasó a 104 partidos en total.",
  },
  {
    id: "fbm-4",
    question: "¿En cuántos grupos se dividieron las 48 selecciones del Mundial 2026?",
    options: ["12", "8", "16", "6"],
    correctIndex: 0,
    category: "historia",
    difficulty: "media",
    explanation: "Fueron 12 grupos de 4 equipos en la fase de grupos.",
  },
  {
    id: "fbm-5",
    question: "¿En qué estadio se jugó el partido inaugural del Mundial 2026?",
    options: [
      "Estadio Azteca (Ciudad de México)",
      "MetLife Stadium (Nueva Jersey)",
      "SoFi Stadium (Los Ángeles)",
      "Estadio BBVA (Monterrey)",
    ],
    correctIndex: 0,
    category: "historia",
    difficulty: "dificil",
    explanation: "El Azteca acogió la inauguración el 11 de junio de 2026.",
  },
  {
    id: "fbm-6",
    question: "¿En qué estadio se disputó la final del Mundial 2026?",
    options: [
      "MetLife Stadium (Nueva Jersey)",
      "Estadio Azteca (México)",
      "SoFi Stadium (Los Ángeles)",
      "AT&T Stadium (Dallas)",
    ],
    correctIndex: 0,
    category: "historia",
    difficulty: "experta",
    explanation: "La final se jugó en el MetLife Stadium, cerca de Nueva York.",
  },
  {
    id: "fb-19",
    question: "¿De qué país es la selección apodada 'La Albiceleste'?",
    options: ["Argentina", "Uruguay", "Chile", "Colombia"],
    correctIndex: 0,
    category: "selecciones",
    difficulty: "facil",
    explanation: "El apodo viene de las franjas blancas y celestes de su camiseta.",
  },
  {
    id: "fb-20",
    question: "¿Cómo se apoda popularmente a la selección de Brasil?",
    options: ["La Canarinha", "La Roja", "Les Bleus", "La Azzurra"],
    correctIndex: 0,
    category: "selecciones",
    difficulty: "media",
    explanation: "'Canarinha' alude al amarillo canario de su camiseta.",
  },
  {
    id: "fb-21",
    question: "¿Cómo se conoce a la selección de Francia?",
    options: ["Les Bleus", "La Roja", "Azzurri", "Oranje"],
    correctIndex: 0,
    category: "selecciones",
    difficulty: "media",
    explanation: "'Les Bleus' (los azules) por el color de su camiseta.",
  },
  {
    id: "fb-22",
    question: "¿En qué Mundial se usaron por primera vez las tarjetas amarilla y roja?",
    options: ["México 1970", "Inglaterra 1966", "Alemania 1974", "Argentina 1978"],
    correctIndex: 0,
    category: "reglas",
    difficulty: "dificil",
    explanation: "Las tarjetas se introdujeron en el Mundial de México 1970.",
  },
  {
    id: "fb-23",
    question: "¿Cuántos jugadores de cada equipo hay en el campo al inicio de un partido?",
    options: ["11", "10", "12", "9"],
    correctIndex: 0,
    category: "reglas",
    difficulty: "facil",
    explanation: "Diez jugadores de campo más el portero, 11 en total.",
  },
  {
    id: "fb-24",
    question: "¿Cuánto dura cada tiempo reglamentario de un partido de fútbol?",
    options: ["45 minutos", "40 minutos", "50 minutos", "30 minutos"],
    correctIndex: 0,
    category: "reglas",
    difficulty: "media",
    explanation: "Dos tiempos de 45 minutos, más el añadido por el árbitro.",
  },

  /* ═══════════════════════════════════════════════════════════════════
     CLUBES Y LIGAS — el banco no tenía ni una sola pregunta de clubes:
     24 de 24 eran de selecciones. Si Claude no genera (sin API key, error
     del modelo o cron caído), la trivia de un producto de ligas servía
     únicamente preguntas de Mundiales. Todas son hechos consolidados, no
     dependen de la temporada en curso, y el orden pan-LATAM va primero.
     ═══════════════════════════════════════════════════════════════════ */
  {
    id: "fbc-1",
    question: "¿Qué club ha ganado más Copas Libertadores?",
    options: ["Independiente", "Boca Juniors", "Peñarol", "River Plate"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "media",
    explanation: "Independiente de Avellaneda suma 7, más que ningún otro club.",
  },
  {
    id: "fbc-2",
    question: "¿Qué club ecuatoriano ganó la Copa Libertadores en 2008?",
    options: ["LDU de Quito", "Barcelona SC", "Emelec", "Independiente del Valle"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "media",
    explanation: "LDU de Quito venció a Fluminense en la final: el único título ecuatoriano.",
  },
  {
    id: "fbc-3",
    question: "¿Cuál es el club con más títulos de liga en Ecuador?",
    options: ["Barcelona SC", "LDU de Quito", "Emelec", "El Nacional"],
    correctIndex: 0,
    category: "ligas",
    difficulty: "media",
    explanation: "Barcelona Sporting Club, de Guayaquil, encabeza el palmarés nacional.",
  },
  {
    id: "fbc-4",
    question: "¿Qué club colombiano ganó la Copa Libertadores en 1989 y 2016?",
    options: ["Atlético Nacional", "Millonarios", "América de Cali", "Junior"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "media",
    explanation: "Atlético Nacional de Medellín es el único bicampeón colombiano.",
  },
  {
    id: "fbc-5",
    question: "¿Cómo se llama el estadio de Boca Juniors?",
    options: ["La Bombonera", "El Monumental", "El Cilindro", "El Gasómetro"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "facil",
    explanation: "Alberto J. Armando, conocida como La Bombonera, en La Boca.",
  },
  {
    id: "fbc-6",
    question: "¿Qué dos clubes disputan el Superclásico argentino?",
    options: [
      "Boca Juniors y River Plate",
      "Racing e Independiente",
      "San Lorenzo y Huracán",
      "Vélez y Estudiantes",
    ],
    correctIndex: 0,
    category: "clubes",
    difficulty: "facil",
    explanation: "Boca y River: el clásico más famoso del fútbol argentino.",
  },
  {
    id: "fbc-7",
    question: "¿En qué club brasileño se consagró Pelé antes de ir a Estados Unidos?",
    options: ["Santos", "Flamengo", "Corinthians", "Palmeiras"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "facil",
    explanation: "Pelé jugó casi toda su carrera en el Santos, de 1956 a 1974.",
  },
  {
    id: "fbc-8",
    question: "¿Qué club brasileño juega de local en el Maracaná junto al Fluminense?",
    options: ["Flamengo", "Vasco da Gama", "Botafogo", "Palmeiras"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "media",
    explanation: "Flamengo y Fluminense comparten el Maracaná como estadio.",
  },
  {
    id: "fbc-9",
    question: "¿Qué club tiene más títulos en la historia de la Liga MX?",
    options: ["Club América", "Chivas de Guadalajara", "Cruz Azul", "Toluca"],
    correctIndex: 0,
    category: "ligas",
    difficulty: "media",
    explanation: "El América encabeza el palmarés del fútbol mexicano.",
  },
  {
    id: "fbc-10",
    question: "¿Cómo se apoda al Cruz Azul?",
    options: ["La Máquina", "El Rebaño", "Las Águilas", "Los Diablos"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "media",
    explanation: "La Máquina Celeste, apodo heredado de sus grandes equipos de los 70.",
  },
  {
    id: "fbc-11",
    question: "¿Qué club venezolano tiene más títulos de liga?",
    options: ["Caracas FC", "Deportivo Táchira", "Zamora FC", "Deportivo Lara"],
    correctIndex: 0,
    category: "ligas",
    difficulty: "dificil",
    explanation: "El Caracas FC lidera el palmarés del fútbol venezolano.",
  },
  {
    id: "fbc-12",
    question: "¿Qué club ha ganado más veces la Copa de Europa / Champions League?",
    options: ["Real Madrid", "Milan", "Liverpool", "Bayern Múnich"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "facil",
    explanation: "El Real Madrid es, con mucha diferencia, el más laureado del torneo.",
  },
  {
    id: "fbc-13",
    question: "¿Cómo se llama el clásico entre Real Madrid y FC Barcelona?",
    options: ["El Clásico", "El Derbi", "La Batalla", "El Superclásico"],
    correctIndex: 0,
    category: "ligas",
    difficulty: "facil",
    explanation: "El Clásico, el partido más visto del fútbol español.",
  },
  {
    id: "fbc-14",
    question: "¿Qué club inglés juega en Anfield?",
    options: ["Liverpool", "Everton", "Manchester United", "Arsenal"],
    correctIndex: 0,
    category: "clubes",
    difficulty: "facil",
    explanation: "Anfield es la casa del Liverpool desde 1892.",
  },
];

/**
 * Ids retirados del banco: preguntas que ya no deben servirse nunca más.
 *
 * addToBank deduplica por id, así que una pregunta mal formulada que ya entró
 * en KV se queda ahí para siempre por mucho que se corrija este fichero. El
 * cron diario las borra con removeFromBank antes de sembrar las nuevas.
 *
 * fb-13 … fb-18: preguntaban por el Mundial 2026 en FUTURO ("¿en qué estadio
 * se jugará la final?") doce días después de que el torneo terminara.
 * Reemplazadas por fbm-1 … fbm-6, en pasado.
 */
export const RETIRED_QUESTION_IDS: string[] = [
  "fb-13",
  "fb-14",
  "fb-15",
  "fb-16",
  "fb-17",
  "fb-18",
];
