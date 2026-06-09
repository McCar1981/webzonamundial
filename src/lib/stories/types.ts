// src/lib/stories/types.ts
//
// Tipos compartidos del módulo Stories. Espejo de las tablas de
// scripts/sql/2026-19-stories.sql + los contratos de widget que consume el visor.

export type StoryType = "creator" | "system" | "user" | "narrative" | "league";
export type StoryAuthorType = "creator" | "system" | "user";
export type StoryMediaType = "image" | "video" | "template";

// ─── Widgets interactivos ──────────────────────────────────────────────────
// Cada Story puede llevar un array de widgets (encuesta, predicción rápida,
// micro-reto, CTA…). El discriminador es `kind`. Se guardan en stories.widgets.
export type StoryWidgetKind =
  | "poll" // encuesta 2-4 opciones, resultados en vivo
  | "quick_prediction" // enlace directo a predecir un partido
  | "micro_challenge" // mini predicción SÍ/NO resuelta post-partido
  | "cta"; // botón a premium / liga / registro

export interface PollOption {
  key: string;
  label: string;
}

export interface PollWidget {
  kind: "poll";
  id: string;
  question: string;
  options: PollOption[];
  /** Conteo por opción (lo agrega el backend al servir). */
  results?: Record<string, number>;
}

export interface QuickPredictionWidget {
  kind: "quick_prediction";
  id: string;
  label: string;
  matchId: string;
}

export interface MicroChallengeWidget {
  kind: "micro_challenge";
  id: string;
  question: string;
  /** Resultado correcto, conocido solo tras el partido. */
  correctOption?: "yes" | "no" | null;
}

export interface CtaWidget {
  kind: "cta";
  id: string;
  label: string;
  /** Deep link interno o externo: /premium, /app/ligas/<id>, etc. */
  href: string;
}

export type StoryWidget =
  | PollWidget
  | QuickPredictionWidget
  | MicroChallengeWidget
  | CtaWidget;

// ─── Stickers (foto tipo IG) ────────────────────────────────────────────────
// El usuario pega stickers (emoji) sobre su foto. Posición relativa 0..1 al
// contenedor para que escale igual en el editor y en el visor. Se guardan en
// template_data.stickers.
export interface StorySticker {
  id: string;
  /** Emoji (sticker simple). Presente si NO es un sticker de imagen. */
  emoji?: string;
  /** URL de imagen del sticker (p.ej. Giphy). Si está, se renderiza <img>. */
  url?: string;
  /** Ancho relativo 0..1 del contenedor (solo stickers de imagen). */
  w?: number;
  x: number; // 0..1 (izquierda→derecha)
  y: number; // 0..1 (arriba→abajo)
  scale?: number; // multiplicador de tamaño (default 1)
}

// ─── Fila de la tabla stories ──────────────────────────────────────────────
export interface StoryRow {
  id: string;
  type: StoryType;
  author_id: string | null;
  author_type: StoryAuthorType;
  league_id: string | null;
  media_type: StoryMediaType;
  media_url: string | null;
  overlay_text: string | null;
  widgets: StoryWidget[];
  template_id: string | null;
  template_data: Record<string, unknown>;
  related_match_id: string | null;
  community_slug: string | null;
  view_count: number;
  interaction_count: number;
  share_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

// ─── Fila de la tabla story_views ──────────────────────────────────────────
export interface StoryViewRow {
  id: string;
  story_id: string;
  user_id: string;
  completed: boolean;
  widget_interacted: boolean;
  interaction_data: Record<string, unknown>;
  shared_to: string | null;
  viewed_at: string;
  updated_at: string;
}

// ─── DTOs de la API ─────────────────────────────────────────────────────────
// Lo que el visor necesita por Story (sin exponer columnas internas).
export interface StoryDTO {
  id: string;
  type: StoryType;
  authorType: StoryAuthorType;
  mediaType: StoryMediaType;
  mediaUrl: string | null;
  overlayText: string | null;
  widgets: StoryWidget[];
  templateId: string | null;
  templateData: Record<string, unknown>;
  relatedMatchId: string | null;
  /** Comunidad del creador a la que pertenece (Stories de usuario). */
  communitySlug?: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  /** Solo presente con sesión: si el usuario ya la vio/completó/interactuó. */
  seen?: boolean;
}

// Una "burbuja" del carrusel: agrupa las Stories de un mismo autor/grupo.
export interface StoryReelDTO {
  /** Clave de agrupación: author_id, "system", league_id, "narrative". */
  key: string;
  label: string;
  type: StoryType;
  /** Avatar/imagen de la burbuja. */
  avatarUrl: string | null;
  stories: StoryDTO[];
  /** TRUE si TODAS las stories del reel ya fueron vistas por el usuario. */
  allSeen: boolean;
  /** TRUE si el reel es del propio usuario (puede eliminar sus Stories). */
  isMine?: boolean;
}
