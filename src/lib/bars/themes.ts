// src/lib/bars/themes.ts
//
// Catálogo de temas visuales PREDEFINIDOS para las páginas públicas de los bares.
// Viven en código (no en BD): son estáticos y el bar solo SELECCIONA uno, no lo
// edita. Cada tema controla un set acotado de tokens para que el dueño pueda
// personalizar el aspecto sin poder romper la UI ni elegir combinaciones
// ilegibles (todos los contrastes están validados a mano).
//
// Aunque ZonaMundial usa azul marino + dorado, las páginas de bar NO dependen de
// esa paleta: la conexión con ZM se mantiene por "Powered by ZonaMundial", los
// CTAs inteligentes y el perfil unificado, no por el color.

export interface BarTheme {
  id: string;
  name: string;
  bg: string;          // fondo principal de la página
  surface: string;     // fondo de cards / paneles
  surface2: string;    // fondo de elementos anidados (barras de progreso, chips)
  border: string;      // borde sutil de cards
  primary: string;     // color de acento principal (botones, destacados)
  primaryInk: string;  // color del texto SOBRE el primary (contraste garantizado)
  secondary: string;   // acento secundario
  text: string;        // texto principal
  textMuted: string;   // texto secundario
  buttonRadius: number; // px — estilo de botones del tema
  cardRadius: number;   // px — estilo de cards del tema
}

export const BAR_THEMES: Record<string, BarTheme> = {
  "deportivo-oscuro": {
    id: "deportivo-oscuro", name: "Deportivo oscuro",
    bg: "#0A0E14", surface: "#121821", surface2: "#0C1118", border: "rgba(255,255,255,0.08)",
    primary: "#22c55e", primaryInk: "#04210f", secondary: "#38bdf8",
    text: "#E6EBF2", textMuted: "#8a94a6", buttonRadius: 10, cardRadius: 14,
  },
  "estadio-premium": {
    id: "estadio-premium", name: "Estadio premium",
    bg: "#060B14", surface: "#0F1D32", surface2: "#0B1825", border: "rgba(255,255,255,0.07)",
    primary: "#c9a84c", primaryInk: "#1a1206", secondary: "#e8d48b",
    text: "#E2E8F0", textMuted: "#94A3B8", buttonRadius: 12, cardRadius: 16,
  },
  "pub-clasico": {
    id: "pub-clasico", name: "Pub clásico",
    bg: "#1A1410", surface: "#241B14", surface2: "#1C140E", border: "rgba(214,178,120,0.16)",
    primary: "#b6843f", primaryInk: "#211405", secondary: "#d9b779",
    text: "#F1E7D6", textMuted: "#a8957d", buttonRadius: 8, cardRadius: 10,
  },
  "latino-festivo": {
    id: "latino-festivo", name: "Latino festivo",
    bg: "#1B0E22", surface: "#2A1636", surface2: "#1F1029", border: "rgba(255,255,255,0.10)",
    primary: "#f97316", primaryInk: "#2a0f02", secondary: "#facc15",
    text: "#FBEFFA", textMuted: "#b89cc4", buttonRadius: 14, cardRadius: 18,
  },
  "minimal-blanco": {
    id: "minimal-blanco", name: "Minimal blanco",
    bg: "#F6F7F9", surface: "#FFFFFF", surface2: "#EEF1F5", border: "rgba(15,23,42,0.10)",
    primary: "#111827", primaryInk: "#FFFFFF", secondary: "#2563eb",
    text: "#0F172A", textMuted: "#64748B", buttonRadius: 10, cardRadius: 14,
  },
  "rojo-energia": {
    id: "rojo-energia", name: "Rojo energía",
    bg: "#140709", surface: "#211012", surface2: "#19090C", border: "rgba(255,255,255,0.08)",
    primary: "#ef4444", primaryInk: "#2a0606", secondary: "#fbbf24",
    text: "#F8E9EA", textMuted: "#b08a8d", buttonRadius: 10, cardRadius: 12,
  },
  "verde-campo": {
    id: "verde-campo", name: "Verde campo",
    bg: "#08160E", surface: "#10231A", surface2: "#0B1A12", border: "rgba(255,255,255,0.08)",
    primary: "#16a34a", primaryInk: "#04210f", secondary: "#a3e635",
    text: "#E6F2EA", textMuted: "#85a392", buttonRadius: 12, cardRadius: 14,
  },
  "dorado-campeon": {
    id: "dorado-campeon", name: "Dorado campeón",
    bg: "#0D0B06", surface: "#1A160C", surface2: "#120F08", border: "rgba(201,168,76,0.20)",
    primary: "#e8d48b", primaryInk: "#1a1206", secondary: "#c9a84c",
    text: "#F4ECD6", textMuted: "#a99a72", buttonRadius: 12, cardRadius: 16,
  },
};

export const DEFAULT_THEME_ID = "deportivo-oscuro";

export function getTheme(id: string | null | undefined): BarTheme {
  return (id && BAR_THEMES[id]) || BAR_THEMES[DEFAULT_THEME_ID];
}

export function themeList(): BarTheme[] {
  return Object.values(BAR_THEMES);
}
