// ZonaMundial — Datos de creadores confirmados
// src/lib/data/creators.ts
// Fuente: Sportfield Agency (roster confirmado)
// NOTA: Joaco López excluido por situación legal

export interface Creator {
  code: string;
  name: string;
  handle: string;
  followers: string;
  followersNum: number;
  platforms: string[];
  market: "ES" | "LATAM" | "ES+LATAM";
  color: string;
  colorSecondary: string;
  bio: string;
  level: "N1" | "N2" | "N3" | "N4";
}

export const CREATORS: Creator[] = [
  {
    code: "cobo",
    name: "José Cobo",
    handle: "@josecobo",
    followers: "4.7M",
    followersNum: 4700000,
    platforms: ["TikTok", "Instagram", "YouTube"],
    market: "ES+LATAM",
    color: "#DC2626",
    colorSecondary: "#FFFFFF",
    bio: "Creador de contenido de fútbol con la comunidad más grande del roster",
    level: "N2",
  },
  {
    code: "svgiago",
    name: "SVGiago",
    handle: "@svgiago",
    followers: "2.5M",
    followersNum: 2500000,
    platforms: ["TikTok", "Instagram"],
    market: "ES+LATAM",
    color: "#22C55E",
    colorSecondary: "#FFFFFF",
    bio: "Análisis táctico y contenido viral de fútbol",
    level: "N3",
  },
  {
    code: "pimpeano",
    name: "Pimpeano",
    handle: "@pimpeano",
    followers: "2.3M",
    followersNum: 2300000,
    platforms: ["TikTok", "Instagram", "YouTube"],
    market: "LATAM",
    color: "#3B82F6",
    colorSecondary: "#FFFFFF",
    bio: "Humor y fútbol para toda Latinoamérica",
    level: "N3",
  },
  {
    code: "nachocp",
    name: "Nacho CP",
    handle: "@nachocp",
    followers: "1.6M",
    followersNum: 1600000,
    platforms: ["TikTok", "Instagram"],
    market: "ES",
    color: "#F59E0B",
    colorSecondary: "#000000",
    bio: "Predicciones y análisis en la comunidad española",
    level: "N3",
  },
  {
    code: "nereita",
    name: "Nereita",
    handle: "@nereita",
    followers: "500K",
    followersNum: 500000,
    platforms: ["Instagram", "TikTok"],
    market: "ES",
    color: "#EC4899",
    colorSecondary: "#FFFFFF",
    bio: "Fútbol femenino y cultura mundialista",
    level: "N2",
  },
  {
    code: "elopi23",
    name: "Elopi23",
    handle: "@elopi23",
    followers: "300K",
    followersNum: 300000,
    platforms: ["TikTok", "Instagram"],
    market: "ES",
    color: "#8B5CF6",
    colorSecondary: "#FFFFFF",
    bio: "Reacciones en directo y contenido dinámico",
    level: "N1",
  },
  {
    code: "salvador",
    name: "Salvador",
    handle: "@salvador",
    followers: "300K",
    followersNum: 300000,
    platforms: ["TikTok", "YouTube"],
    market: "LATAM",
    color: "#06B6D4",
    colorSecondary: "#FFFFFF",
    bio: "Datos, estadísticas y análisis profundo",
    level: "N1",
  },
  {
    code: "franbar",
    name: "Franbar",
    handle: "@franbar",
    followers: "130K",
    followersNum: 130000,
    platforms: ["Instagram", "TikTok"],
    market: "ES",
    color: "#F97316",
    colorSecondary: "#FFFFFF",
    bio: "Predicciones y comunidad local",
    level: "N1",
  },
];

// Total combinado
export const TOTAL_FOLLOWERS = "15.1M";
export const TOTAL_CREATORS = CREATORS.length; // 8 (+ más en proceso de confirmación)

// Helper
export const getCreator = (code: string) =>
  CREATORS.find((c) => c.code === code);
