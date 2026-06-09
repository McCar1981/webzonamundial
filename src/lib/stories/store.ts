// src/lib/stories/store.ts
//
// Capa de datos (Supabase) del módulo Stories.
//
// Reparto de clientes, igual que en micro-predicciones:
//   - createSupabaseServerClient (RLS) → lectura PROPIA del usuario (qué vio,
//     sus interacciones) y creación de Stories propias (author_type='user').
//   - adminClient (service role) → operaciones que el usuario no puede
//     auto-otorgar: emitir Stories del sistema/narrativas, y mover los
//     contadores agregados (view_count, interaction_count, share_count).
//
// Las Stories del sistema las EMITE el backend (motor de generación), por eso
// viven en el cliente admin. Las vistas/interacciones del usuario pasan por RLS.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import {
  hasServiceRole,
  demoFeed,
  demoStory,
  demoCreateUserStory,
  demoMyStories,
  demoDeleteStory,
  demoGenKeys,
  demoCreateSystemStory,
} from "./demo";
import { storiesForSnapshot } from "./generator";
import { getFavCreator } from "@/lib/fantasy/store.server";
import { CREADORES } from "@/data/creadores";
import type { LiveSnapshot } from "@/lib/match-center/types";
import type {
  StoryRow,
  StoryViewRow,
  StoryDTO,
  StoryReelDTO,
  StoryType,
  StoryAuthorType,
  StoryMediaType,
  StoryWidget,
} from "./types";

const STORY_COLS =
  "id,type,author_id,author_type,league_id,media_type,media_url,overlay_text,widgets,template_id,template_data,related_match_id,community_slug,view_count,interaction_count,share_count,is_active,expires_at,created_at";

// ─── Mapeo fila → DTO ───────────────────────────────────────────────────────
function toDTO(row: StoryRow, seen?: boolean): StoryDTO {
  return {
    id: row.id,
    type: row.type,
    authorType: row.author_type,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    overlayText: row.overlay_text,
    widgets: Array.isArray(row.widgets) ? row.widgets : [],
    templateId: row.template_id,
    templateData: row.template_data ?? {},
    relatedMatchId: row.related_match_id,
    communitySlug: row.community_slug ?? null,
    viewCount: row.view_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    ...(seen === undefined ? {} : { seen }),
  };
}

// Nombre + foto de perfil reales del creador, por slug (community_slug de la
// Story de creador). Fuente de verdad: src/data/creadores.ts.
const CREADOR_BY_SLUG = new Map(CREADORES.map((c) => [c.slug, c]));

// Clave de agrupación del carrusel: las del mismo autor/grupo van en un reel.
// Las de creador se agrupan por su slug (community_slug) → una burbuja por
// creador con su nombre y foto.
function reelKey(row: StoryRow): string {
  switch (row.type) {
    case "creator":
      return `creator:${row.community_slug ?? row.author_id ?? "anon"}`;
    case "user":
      return row.author_id ?? "anon";
    case "league":
      return `league:${row.league_id ?? "?"}`;
    case "narrative":
      return "narrative";
    case "system":
    default:
      return "system";
  }
}

function reelLabel(type: StoryType): string {
  switch (type) {
    case "system":
      return "Sistema";
    case "narrative":
      return "Revista";
    case "league":
      return "Mi liga";
    case "creator":
      return "Creador";
    case "user":
    default:
      return "Tú";
  }
}

// ─── Feed (carrusel) ────────────────────────────────────────────────────────
// Stories activas (no expiradas), agrupadas en reels. Si hay userId, marca qué
// stories ya vio para pintar el anillo "gastado".
export async function getFeed(userId?: string | null): Promise<StoryReelDTO[]> {
  // Local sin service role → datos demo en memoria (ver src/lib/stories/demo.ts).
  if (!hasServiceRole()) return demoFeed();

  const admin = adminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("stories")
    .select(STORY_COLS)
    .eq("is_active", true)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`stories.getFeed: ${error.message}`);
  const allRows = (data ?? []) as StoryRow[];

  // Scope de comunidad de creador (profiles.fav_creator):
  //   - USER y CREATOR solo se ven a los miembros de ESA comunidad. Quien no
  //     está con ningún creador (sin fav_creator) NO ve Stories de creador.
  //   - system/narrative/league son públicos.
  //   - Las Stories propias del usuario siempre se ven.
  let viewerCommunity: string | null = null;
  if (userId) {
    try {
      viewerCommunity = await getFavCreator(userId);
    } catch {
      viewerCommunity = null;
    }
  }
  const rows = allRows.filter((r) => {
    if (r.type === "user") {
      if (userId && r.author_id === userId) return true; // propias
      return r.community_slug != null && r.community_slug === viewerCommunity;
    }
    if (r.type === "creator") {
      // Solo a los miembros de la comunidad de ese creador.
      return r.community_slug != null && r.community_slug === viewerCommunity;
    }
    return true; // system/narrative/league públicos
  });

  // Qué stories ya vio el usuario (para el flag seen y el anillo del reel).
  let seenSet = new Set<string>();
  if (userId) {
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      const { data: views } = await admin
        .from("story_views")
        .select("story_id")
        .eq("user_id", userId)
        .in("story_id", ids);
      seenSet = new Set((views ?? []).map((v: { story_id: string }) => v.story_id));
    }
  }

  // Agrupar en reels preservando el orden (más reciente primero).
  const reels = new Map<string, StoryReelDTO>();
  for (const row of rows) {
    const key = reelKey(row);
    let reel = reels.get(key);
    if (!reel) {
      // Creador: nombre + foto de perfil reales desde src/data/creadores.ts.
      let label = reelLabel(row.type);
      let avatarUrl: string | null = null;
      if (row.type === "creator" && row.community_slug) {
        const c = CREADOR_BY_SLUG.get(row.community_slug);
        if (c) {
          label = c.nombre;
          avatarUrl = c.imagen;
        }
      }
      reel = {
        key,
        label,
        type: row.type,
        avatarUrl,
        stories: [],
        allSeen: true,
      };
      reels.set(key, reel);
    }
    const seen = userId ? seenSet.has(row.id) : undefined;
    reel.stories.push(toDTO(row, seen));
    if (!seen) reel.allSeen = false;
  }

  return Array.from(reels.values());
}

// ─── Story individual ───────────────────────────────────────────────────────
export async function getStory(
  storyId: string,
  userId?: string | null
): Promise<StoryDTO | null> {
  if (!hasServiceRole()) return demoStory(storyId);

  const admin = adminClient();
  const { data, error } = await admin
    .from("stories")
    .select(STORY_COLS)
    .eq("id", storyId)
    .maybeSingle();

  if (error) throw new Error(`stories.getStory: ${error.message}`);
  if (!data) return null;

  let seen: boolean | undefined;
  if (userId) {
    const { data: view } = await admin
      .from("story_views")
      .select("story_id")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .maybeSingle();
    seen = Boolean(view);
  }
  return toDTO(data as StoryRow, seen);
}

// ─── Registrar vista ────────────────────────────────────────────────────────
// Upsert idempotente por (story, usuario). El contador view_count solo sube en
// la PRIMERA vista de ese usuario (no se infla al reabrir la Story).
export interface RecordViewResult {
  ok: true;
  firstView: boolean;
  completed: boolean;
}

export async function recordView(
  userId: string,
  storyId: string,
  completed: boolean
): Promise<{ ok: false; error: "not_found" } | RecordViewResult> {
  // Demo local: la vista no persiste, pero respondemos ok para que el visor fluya.
  if (!hasServiceRole()) {
    return demoStory(storyId)
      ? { ok: true, firstView: true, completed }
      : { ok: false, error: "not_found" };
  }

  const admin = adminClient();

  const { data: story } = await admin
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .maybeSingle();
  if (!story) return { ok: false, error: "not_found" };

  const { data: existing } = await admin
    .from("story_views")
    .select("id,completed")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();

  const firstView = !existing;

  if (firstView) {
    await admin.from("story_views").insert({
      story_id: storyId,
      user_id: userId,
      completed,
      viewed_at: new Date().toISOString(),
    });
    // Incremento atómico del contador agregado.
    await admin.rpc("increment_story_counter", {
      p_story_id: storyId,
      p_column: "view_count",
      p_delta: 1,
    });
  } else if (completed && !(existing as { completed: boolean }).completed) {
    await admin
      .from("story_views")
      .update({ completed: true, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);
  }

  return { ok: true, firstView, completed };
}

// ─── Interactuar con widget ─────────────────────────────────────────────────
// Guarda la respuesta a un widget (encuesta/micro-reto) en la vista del usuario.
// interaction_count solo sube la PRIMERA vez que el usuario interactúa con la Story.
export async function recordInteraction(
  userId: string,
  storyId: string,
  widgetId: string,
  answer: unknown
): Promise<
  { ok: false; error: "not_found" } | { ok: true; firstInteraction: boolean }
> {
  // Demo local: no persiste, pero respondemos ok para que el widget responda.
  if (!hasServiceRole()) {
    return demoStory(storyId)
      ? { ok: true, firstInteraction: true }
      : { ok: false, error: "not_found" };
  }

  const admin = adminClient();

  const { data: story } = await admin
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .maybeSingle();
  if (!story) return { ok: false, error: "not_found" };

  const { data: existing } = await admin
    .from("story_views")
    .select("id,widget_interacted,interaction_data")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const newData = {
    ...((existing as { interaction_data?: Record<string, unknown> } | null)
      ?.interaction_data ?? {}),
    [widgetId]: answer,
  };

  const wasInteracted = Boolean(
    (existing as { widget_interacted?: boolean } | null)?.widget_interacted
  );
  const firstInteraction = !wasInteracted;

  if (!existing) {
    await admin.from("story_views").insert({
      story_id: storyId,
      user_id: userId,
      completed: false,
      widget_interacted: true,
      interaction_data: newData,
      viewed_at: nowIso,
    });
    await admin.rpc("increment_story_counter", {
      p_story_id: storyId,
      p_column: "view_count",
      p_delta: 1,
    });
  } else {
    await admin
      .from("story_views")
      .update({
        widget_interacted: true,
        interaction_data: newData,
        updated_at: nowIso,
      })
      .eq("id", (existing as { id: string }).id);
  }

  if (firstInteraction) {
    await admin.rpc("increment_story_counter", {
      p_story_id: storyId,
      p_column: "interaction_count",
      p_delta: 1,
    });
  }

  return { ok: true, firstInteraction };
}

// ─── Crear Story del sistema/narrativa (service role) ───────────────────────
// La emite el motor de generación automática. NO pasa por RLS (no es del usuario).
export interface CreateSystemStoryInput {
  type: Extract<StoryType, "system" | "narrative">;
  mediaType?: StoryMediaType;
  mediaUrl?: string | null;
  overlayText?: string | null;
  widgets?: StoryWidget[];
  templateId?: string | null;
  templateData?: Record<string, unknown>;
  relatedMatchId?: string | null;
  /** TTL en horas (default 24). */
  ttlHours?: number;
}

export async function createSystemStory(
  input: CreateSystemStoryInput
): Promise<StoryDTO> {
  // Local sin service role → la Story se emite en memoria (motor demo).
  if (!hasServiceRole()) {
    return demoCreateSystemStory(
      input.overlayText ?? null,
      input.widgets ?? [],
      input.relatedMatchId ?? null,
      input.templateData ?? {}
    );
  }

  const admin = adminClient();
  const ttl = input.ttlHours ?? 24;
  const expiresAt = new Date(Date.now() + ttl * 3600 * 1000).toISOString();
  const authorType: StoryAuthorType = "system";

  const { data, error } = await admin
    .from("stories")
    .insert({
      type: input.type,
      author_id: null,
      author_type: authorType,
      media_type: input.mediaType ?? "template",
      media_url: input.mediaUrl ?? null,
      overlay_text: input.overlayText ?? null,
      widgets: input.widgets ?? [],
      template_id: input.templateId ?? null,
      template_data: input.templateData ?? {},
      related_match_id: input.relatedMatchId ?? null,
      is_active: true,
      expires_at: expiresAt,
    })
    .select(STORY_COLS)
    .single();

  if (error) throw new Error(`stories.createSystemStory: ${error.message}`);
  return toDTO(data as StoryRow);
}

// ─── Motor automático: claves ya emitidas (dedup) ──────────────────────────
// Devuelve los gen_key de las Stories del sistema activas, para no re-emitir la
// misma previa/gol en cada pasada del motor.
export async function existingGenKeys(): Promise<Set<string>> {
  if (!hasServiceRole()) return demoGenKeys();

  const admin = adminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("stories")
    .select("template_data")
    .eq("type", "system")
    .eq("is_active", true)
    .gt("expires_at", nowIso)
    .limit(500);
  if (error) throw new Error(`stories.existingGenKeys: ${error.message}`);
  const keys = (data ?? [])
    .map((r) => String((r as { template_data?: { gen_key?: unknown } }).template_data?.gen_key ?? ""))
    .filter(Boolean);
  return new Set(keys);
}

// ─── Motor automático: emitir Stories del sistema desde snapshots ───────────
// Recibe snapshots del Match Center (SOLO LECTURA, resueltos por el disparador)
// y emite las Stories nuevas (previa/gol) que aún no existan. Idempotente por
// gen_key: correr el motor dos veces no duplica.
export async function runSystemGeneration(
  snapshots: LiveSnapshot[]
): Promise<{ created: number; keys: string[] }> {
  const existing = await existingGenKeys();
  const keys: string[] = [];
  let created = 0;

  for (const snap of snapshots) {
    const inputs = storiesForSnapshot(snap, existing);
    for (const input of inputs) {
      await createSystemStory(input);
      const key = String((input.templateData as { gen_key?: unknown } | undefined)?.gen_key ?? "");
      if (key) {
        existing.add(key); // evita duplicar dentro de la misma pasada
        keys.push(key);
      }
      created++;
    }
  }

  return { created, keys };
}

// ─── Crear Story del USUARIO (RLS: author_type='user') ──────────────────────
// El usuario publica su propia Story (tipo cromo). Pasa por RLS: solo puede
// insertar con su propio author_id. TTL 24h como las demás.
export interface CreateUserStoryInput {
  /** Plantilla (cromo) o null si es una foto subida. */
  templateId: string | null;
  overlayText: string;
  /** "template" (cromo) | "image" (foto del usuario). */
  mediaType?: StoryMediaType;
  /** URL/data-url de la foto cuando mediaType="image". */
  mediaUrl?: string | null;
  templateData?: Record<string, unknown>;
}

export async function createUserStory(
  userId: string,
  input: CreateUserStoryInput
): Promise<StoryDTO> {
  const mediaType: StoryMediaType = input.mediaType ?? "template";
  const mediaUrl = input.mediaUrl ?? null;

  if (!hasServiceRole()) {
    return demoCreateUserStory(input.overlayText, input.templateId, input.templateData ?? {}, mediaType, mediaUrl);
  }

  const supabase = createSupabaseServerClient();
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  // Comunidad del autor: la del creador con el que se registró (read-only).
  let community: string | null = null;
  try {
    community = await getFavCreator(userId);
  } catch {
    community = null;
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({
      type: "user",
      author_id: userId,
      author_type: "user",
      media_type: mediaType,
      media_url: mediaUrl,
      overlay_text: input.overlayText,
      widgets: [],
      template_id: input.templateId,
      template_data: input.templateData ?? {},
      community_slug: community,
      is_active: true,
      expires_at: expiresAt,
    })
    .select(STORY_COLS)
    .single();

  if (error) throw new Error(`stories.createUserStory: ${error.message}`);
  return toDTO(data as StoryRow);
}

// ─── Mis Stories publicadas ─────────────────────────────────────────────────
export async function getMyStories(userId: string): Promise<StoryDTO[]> {
  if (!hasServiceRole()) return demoMyStories();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_COLS)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`stories.getMyStories: ${error.message}`);
  return (data ?? []).map((r) => toDTO(r as StoryRow));
}

// ─── Eliminar Story propia ──────────────────────────────────────────────────
export async function deleteStory(
  userId: string,
  storyId: string
): Promise<{ ok: boolean }> {
  if (!hasServiceRole()) return { ok: demoDeleteStory(storyId) };

  const supabase = createSupabaseServerClient();
  // RLS garantiza que solo borra las suyas; añadimos el filtro por claridad.
  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId)
    .eq("author_id", userId);
  return { ok: !error };
}

// ─── Registrar compartido a RRSS ────────────────────────────────────────────
// Sube share_count (vía service role) y guarda shared_to en la vista del usuario.
export async function recordShare(
  userId: string,
  storyId: string,
  sharedTo: string
): Promise<{ ok: boolean }> {
  if (!hasServiceRole()) return { ok: Boolean(demoStory(storyId)) };

  const admin = adminClient();
  const { data: story } = await admin
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .maybeSingle();
  if (!story) return { ok: false };

  await admin.rpc("increment_story_counter", {
    p_story_id: storyId,
    p_column: "share_count",
    p_delta: 1,
  });

  // Marca shared_to en la vista del usuario (upsert ligero).
  const { data: existing } = await admin
    .from("story_views")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    await admin
      .from("story_views")
      .update({ shared_to: sharedTo, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);
  } else {
    await admin.from("story_views").insert({
      story_id: storyId,
      user_id: userId,
      shared_to: sharedTo,
      viewed_at: new Date().toISOString(),
    });
  }
  return { ok: true };
}

// ─── Mis vistas (RLS, opcional para "Momentos") ─────────────────────────────
export async function myViews(): Promise<StoryViewRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("story_views")
    .select("*")
    .order("viewed_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`stories.myViews: ${error.message}`);
  return (data ?? []) as StoryViewRow[];
}
