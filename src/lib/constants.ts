// ZonaMundial — Constantes globales
// src/lib/constants.ts

// ══════════════════════════════════════
// BRAND
// ══════════════════════════════════════
export const BRAND = {
  name: "ZonaMundial",
  slogan: "Your World Cup. Your rules.",
  domain: "zonamundial.app",
  email: "business.dev@sprintmarkt.com",
  company: "Sprintmarkt",
  location: "Valencia, España",
} as const;

export const COLORS = {
  bg: "#060B14",
  surface: "#0F1D32",
  surface2: "#0B1825",
  gold: "#c9a84c",
  goldLight: "#e8d48b",
  goldDark: "#a88a3d",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  border: "#1E293B",
} as const;

// ══════════════════════════════════════
// TORNEO
// ══════════════════════════════════════
export const TOURNAMENT = {
  name: "Copa del Mundo 2026",
  startDate: "2026-06-11",
  endDate: "2026-07-19",
  teams: 48,
  groups: 12,
  matches: 104,
  venues: 16,
  days: 39,
  countries: ["Estados Unidos", "México", "Canadá"],
} as const;

// ══════════════════════════════════════
// SEO
// ══════════════════════════════════════
export const SEO = {
  defaultTitle: "ZonaMundial — Predicciones, Fantasy y Engagement para el Mundial 2026",
  defaultTitleEn: "ZonaMundial — Predictions, Fantasy & Engagement for the 2026 World Cup",
  titleTemplate: "%s | ZonaMundial",
  defaultDescription: "Plataforma de predicciones, fantasy, trivia y streaming en español para la Copa del Mundo 2026. 48 selecciones, 104 partidos, 39 días de acción.",
  defaultDescriptionEn: "Predictions, fantasy, trivia and streaming platform for the 2026 World Cup. 48 teams, 104 matches, 39 days of action.",
  siteUrl: "https://zonamundial.app",
  ogImage: "https://zonamundial.app/img/og-image.png",
  locale: "es_ES",
  localeEn: "en_US",
  twitterHandle: "@zonamundial",
} as const;

// ══════════════════════════════════════
// LEGAL — Términos seguros
// ══════════════════════════════════════
// NUNCA usar: "FIFA", "World Cup™", "Copa Mundial FIFA™"
// SIEMPRE usar: "Copa del Mundo 2026", "Mundial 2026", "el torneo"
// NUNCA usar: "quinielas", "quiniela"
// SIEMPRE usar: "predicciones", "pronósticos"

export const SAFE_TERMS = {
  tournament: "Copa del Mundo 2026",
  tournamentShort: "Mundial 2026",
  predictions: "predicciones",
  app: "ZonaMundial",
} as const;

// ══════════════════════════════════════
// PRICING
// ══════════════════════════════════════
export const PRICING = {
  spain: { amount: 10, currency: "EUR", label: "€10" },
  latam: { amount: 8, currency: "USD", label: "$8 USD" },
  type: "pago único por torneo",
} as const;

// ══════════════════════════════════════
// EXTERNAL URLs
// ══════════════════════════════════════
export const FLAGS_CDN = "https://flagcdn.com";
export const flagUrl = (code: string, width: number = 40) =>
  `${FLAGS_CDN}/w${width}/${code}.png`;
