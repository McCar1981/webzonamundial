// src/lib/cromos/achievements.ts
//
// Catálogo de logros del álbum. Datos puros, sin dependencias de servidor,
// para poder importarse tanto en servidor como en cliente.

export interface Achievement {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  emoji: string;
}

export interface AchievementView extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
}

export const ALBUM_ACHIEVEMENTS: Achievement[] = [
  {
    id: "primer_cromo",
    name: { es: "Primer cromo", en: "First sticker" },
    description: { es: "Obtén tu primer cromo", en: "Get your first sticker" },
    emoji: "🃏",
  },
  {
    id: "primer_legendario",
    name: { es: "Primer legendario", en: "First legendary" },
    description: { es: "Obtén tu primer cromo legendario", en: "Get your first legendary sticker" },
    emoji: "👑",
  },
  {
    id: "completa_partidos",
    name: { es: "Todos los partidos", en: "All matches" },
    description: { es: "Completa la categoría Partidos", en: "Complete the Matches category" },
    emoji: "⚽",
  },
  {
    id: "completa_edicion_especial",
    name: { es: "Edición especial", en: "Special edition" },
    description: { es: "Completa la Edición Especial", en: "Complete the Special Edition" },
    emoji: "⭐",
  },
  {
    id: "completa_grupos",
    name: { es: "Todos los grupos", en: "All groups" },
    description: { es: "Completa la categoría Grupos", en: "Complete the Groups category" },
    emoji: "🗂️",
  },
  {
    id: "completa_sedes",
    name: { es: "Todas las sedes", en: "All venues" },
    description: { es: "Completa la categoría Sedes", en: "Complete the Venues category" },
    emoji: "🏟️",
  },
  {
    id: "completa_legendarios",
    name: { es: "Leyendas", en: "Legends" },
    description: { es: "Completa todos los cromos legendarios", en: "Complete all legendary stickers" },
    emoji: "🏆",
  },
  {
    id: "mitad_album",
    name: { es: "Mitad del álbum", en: "Half album" },
    description: { es: "Obtén 75 cromos", en: "Get 75 stickers" },
    emoji: "📒",
  },
  {
    id: "album_completo",
    name: { es: "Álbum completo", en: "Complete album" },
    description: { es: "Obtén los 150 cromos", en: "Get all 150 stickers" },
    emoji: "🌟",
  },
];
