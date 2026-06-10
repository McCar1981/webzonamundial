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
  /** Guía del overlay. Se muestra como PLACEHOLDER en el editor, nunca se
   *  pre-rellena ni publica: el usuario escribe su texto real (regla: nada de
   *  datos inventados en el feed). */
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
    defaultText: "Escribe tu predicción para el próximo partido…",
    premium: false,
    dataSource: "predictions",
  },
  {
    id: "mi_resultado",
    name: "Mi Resultado",
    category: "user",
    emoji: "✅",
    gradient: "linear-gradient(135deg,#06b6d4,#0e7490)",
    defaultText: "Cuenta cómo te fue con tus predicciones…",
    premium: false,
    dataSource: "predictions",
  },
  {
    id: "mi_racha",
    name: "Mi Racha",
    category: "user",
    emoji: "🔥",
    gradient: "linear-gradient(135deg,#ef4444,#b91c1c)",
    defaultText: "Presume tu racha real de aciertos…",
    premium: false,
    dataSource: "predictions",
  },
  {
    id: "mi_ficha_dt",
    name: "Mi Ficha DT",
    category: "user",
    emoji: "🪪",
    gradient: "linear-gradient(135deg,#a855f7,#7e22ce)",
    defaultText: "Comparte tu nivel y rating de DT…",
    premium: true,
    dataSource: "career",
  },
  {
    id: "mi_equipo_fantasy",
    name: "Mi Equipo Fantasy",
    category: "user",
    emoji: "⚽",
    gradient: "linear-gradient(135deg,#f59e0b,#b45309)",
    defaultText: "Presenta tu once fantasy…",
    premium: true,
    dataSource: "fantasy",
  },
  {
    id: "mi_momento",
    name: "Mi Momento",
    category: "user",
    emoji: "🌟",
    gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    defaultText: "Comparte tu momento del Mundial…",
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
