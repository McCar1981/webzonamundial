import { League, Feature, StepItem } from "./types";

export const LEAGUES: League[] = [
  {
    name: "Premier League",
    code: "GB",
    color: "#2952a3",
    accent: "#4a7cff",
    icon: "[o]",
    games: 380,
  },
  {
    name: "LaLiga",
    code: "ES",
    color: "#ffc266",
    accent: "#ffd699",
    icon: "[*]",
    games: 380,
  },
  {
    name: "Serie A",
    code: "IT",
    color: "#1a3a5c",
    accent: "#4a7cff",
    icon: "[IT]",
    games: 380,
  },
  {
    name: "Bundesliga",
    code: "DE",
    color: "#be185d",
    accent: "#ec4899",
    icon: "[●]",
    games: 306,
  },
  {
    name: "Liga MX",
    code: "MX",
    color: "#10824a",
    accent: "#22c55e",
    icon: "[MX]",
    games: 480,
  },
  {
    name: "CONMEBOL Libertadores",
    code: "AR",
    color: "#4a1a6f",
    accent: "#b570f0",
    icon: "[T]",
    games: 125,
  },
];

export const FEATURES: Feature[] = [
  {
    id: "duelos",
    icon: "swords",
    title: "Duelos Directos",
    desc: "Desafía a tus amigos en competencias cabeza a cabeza. Apuestas reales, recompensas dinámicas.",
    badge: "Nuevo",
  },
  {
    id: "achievements",
    icon: "trophy",
    title: "Logros Granulares",
    desc: "Logros por liga, equipo, jugador. Insignias con narrativa. Recompensas escalonadas.",
    badge: "Popular",
  },
  {
    id: "minijuegos",
    icon: "gamepad",
    title: "Minijuegos Liga-Específicos",
    desc: "Penales, remates, predicciones. Cada liga tiene mecánicas únicas. Premios diarios.",
  },
  {
    id: "rankings",
    icon: "globe",
    title: "Clasificaciones Globales Dinámicas",
    desc: "Compite contra el mundo. Multi-dimensión: Predictor, Fantasía, Coleccionista, Duelista.",
    badge: "Destacado",
  },
  {
    id: "stats",
    icon: "chart",
    title: "Panel de Estadísticas en Vivo Premium",
    desc: "Estadísticas en vivo. xG, posesión, mapas de calor. Análisis de IA en tiempo real.",
  },
  {
    id: "predictions",
    icon: "coins",
    title: "Torneo de Predicciones",
    desc: "Torneo de predicciones con premios reales. Rake comunitario. Clasificaciones globales.",
    badge: "Premium",
  },
];

export const STEPS: StepItem[] = [
  {
    number: 1,
    icon: "shirt",
    title: "Elige Tu Equipo Favorito",
    desc: "Personaliza tu experiencia. Acceso a duelos, predicciones, logros temáticos. Comunidad por equipo.",
    stat: 50,
    suffix: "+ Equipos",
  },
  {
    number: 2,
    icon: "gamepad",
    title: "Participa en Minijuegos Diarios",
    desc: "Juega en cada fecha. 8 minijuegos diferentes. Gana puntos, sube en ranking, desbloquea cosmetics.",
    stat: 8,
    suffix: " Minijuegos",
  },
  {
    number: 3,
    icon: "medal",
    title: "Sube en Rankings Globales",
    desc: "Compite contra otros jugadores. Premios semanales y de temporada. Construye tu reputación.",
    stat: 6,
    suffix: " Categorías de Rankings",
  },
];
