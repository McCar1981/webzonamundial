// src/lib/stories/templates.ts
//
// Catálogo de templates para que el USUARIO cree su propia Story (tipo cromo,
// compartible a RRSS y al feed de la app). Es estático: define el diseño visual
// (gradiente, emoji, layout) y qué placeholders rellena el usuario o se leen de
// otros módulos (predicciones, carrera, fantasy) en SOLO LECTURA.
//
// Mantener simple (Stories como Instagram/WhatsApp): el usuario elige plantilla,
// la previsualiza y la publica/comparte.

export type StoryTemplateCategory = "match_event" | "daily" | "narrative" | "user" | "league";

export interface UserStoryTemplate {
  id: string;
  name: string;
  category: StoryTemplateCategory;
  emoji: string;
  /** Gradiente de fondo del cromo (CSS background). */
  gradient: string;
  /** Texto por defecto / ejemplo del overlay. */
  defaultText: string;
  /** Solo en plan premium (free = los 3 básicos). */
  premium: boolean;
  /** De qué módulo se podrían leer datos (solo lectura) para autollenar. */
  dataSource?: "predictions" | "career" | "fantasy" | "ranking" | null;
}

export const USER_TEMPLATES: UserStoryTemplate[] = [
  {
    id: "mi_prediccion",
    name: "Mi Predicción",
    category: "user",
    emoji: "🎯",
    gradient: "linear-gradient(135deg,#22c55e,#15803d)",
    defaultText: "Mi predicción: España 2 - 1 Brasil",
    premium: false,
    dataSource: "predictions",
  },
  {
    id: "mi_resultado",
    name: "Mi Resultado",
    category: "user",
    emoji: "✅",
    gradient: "linear-gradient(135deg,#06b6d4,#0e7490)",
    defaultText: "Acerté 6/8 en España vs Brasil",
    premium: false,
    dataSource: "predictions",
  },
  {
    id: "mi_racha",
    name: "Mi Racha",
    category: "user",
    emoji: "🔥",
    gradient: "linear-gradient(135deg,#ef4444,#b91c1c)",
    defaultText: "🔥 12 aciertos seguidos",
    premium: false,
    dataSource: "predictions",
  },
  {
    id: "mi_ficha_dt",
    name: "Mi Ficha DT",
    category: "user",
    emoji: "🪪",
    gradient: "linear-gradient(135deg,#a855f7,#7e22ce)",
    defaultText: "DT Nivel 12 · Rating 87",
    premium: true,
    dataSource: "career",
  },
  {
    id: "mi_equipo_fantasy",
    name: "Mi Equipo Fantasy",
    category: "user",
    emoji: "⚽",
    gradient: "linear-gradient(135deg,#f59e0b,#b45309)",
    defaultText: "Mi once para la jornada",
    premium: true,
    dataSource: "fantasy",
  },
  {
    id: "mi_momento",
    name: "Mi Momento",
    category: "user",
    emoji: "🌟",
    gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    defaultText: "¡Mi momento épico del Mundial!",
    premium: true,
    dataSource: null,
  },
  {
    id: "reto_amigo",
    name: "Reto a Amigo",
    category: "user",
    emoji: "🤝",
    gradient: "linear-gradient(135deg,#0ea5e9,#0369a1)",
    defaultText: "Te reto a unirte a mi liga",
    premium: true,
    dataSource: null,
  },
];

export function getTemplate(id: string): UserStoryTemplate | null {
  return USER_TEMPLATES.find((t) => t.id === id) ?? null;
}

/** Templates disponibles según plan (free = solo los 3 básicos no-premium). */
export function templatesForPlan(isPremium: boolean): UserStoryTemplate[] {
  return isPremium ? USER_TEMPLATES : USER_TEMPLATES.filter((t) => !t.premium);
}
