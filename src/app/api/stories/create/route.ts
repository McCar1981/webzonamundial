// POST /api/stories/create
//
// Crea una Story del usuario. Dos modos:
//   • Cromo:  { template_id, overlay_text, template_data?: { stickers? } }
//   • Foto:   { media_type: "image", media_url (data-URL), overlay_text?, template_data? }
//
// Validación de servidor (el cliente ya valida, pero la API es pública):
//   - media_url: solo data:image/* y con tope de tamaño (la foto va en base64;
//     sin tope, una llamada directa puede meter megabytes en la fila y reventar
//     el peso del feed).
//   - stickers: máx. 12; emoji corto o imagen SOLO de Giphy (https://media*.giphy.com),
//     posiciones/escala acotadas. Evita usar la Story para cargar URLs externas
//     arbitrarias (tracking de IPs de los espectadores / contenido remoto).
//   - template_data: lista blanca { stickers } — se descarta cualquier otra clave
//     (nadie puede colarse flags internos tipo auto/seed/gen_key).
//
// Gating premium: DELIBERADAMENTE desactivado por ahora — el Founders Pass está
// en reformulación y no se promociona; cuando relance, aplicar templatesForPlan.

import { NextResponse } from "next/server";
import { safeCurrentUser } from "@/lib/stories/current-user";
import { createUserStory } from "@/lib/stories/store";
import { getTemplate } from "@/lib/stories/templates";
import type { StorySticker } from "@/lib/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ~1.5M chars de data-URL ≈ 1,1 MB de imagen real. El cliente comprime a
// ~150-400 KB; esto es el techo duro para llamadas directas a la API.
const MAX_MEDIA_URL_CHARS = 1_500_000;
const MAX_OVERLAY_CHARS = 200;
const MAX_STICKERS = 12;

const GIPHY_URL_RE = /^https:\/\/media\d*\.giphy\.com\//;
const DATA_IMAGE_RE = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;

function clamp01(n: unknown): number | null {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.min(1, Math.max(0, v));
}

// Sanea la lista de stickers del cliente: descarta los malformados o con URL
// fuera de Giphy y acota posiciones/escala. Devuelve null si no hay lista.
function sanitizeStickers(raw: unknown): StorySticker[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: StorySticker[] = [];
  for (const item of raw.slice(0, MAX_STICKERS)) {
    if (!item || typeof item !== "object") continue;
    const st = item as Record<string, unknown>;
    const x = clamp01(st.x);
    const y = clamp01(st.y);
    if (x === null || y === null) continue;
    const scaleNum = Number(st.scale);
    const scale = Number.isFinite(scaleNum) ? Math.min(3, Math.max(0.2, scaleNum)) : 1;
    const id = String(st.id ?? "").slice(0, 16) || Math.random().toString(36).slice(2, 9);

    if (typeof st.url === "string" && st.url) {
      if (!GIPHY_URL_RE.test(st.url)) continue; // solo stickers de Giphy
      const w = clamp01(st.w) ?? 0.35;
      out.push({ id, url: st.url.slice(0, 500), w: Math.max(0.05, w), x, y, scale });
    } else if (typeof st.emoji === "string" && st.emoji.trim()) {
      out.push({ id, emoji: st.emoji.slice(0, 16), x, y, scale });
    }
  }
  return out.length ? out : null;
}

export async function POST(req: Request) {
  const user = await safeCurrentUser();
  // En local (sin auth) usamos un id demo para poder probar el flujo.
  const userId = user?.id ?? "demo-user";

  let body: {
    template_id?: string;
    overlay_text?: string;
    template_data?: Record<string, unknown>;
    media_type?: string;
    media_url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const isPhoto = body.media_type === "image";

  // Modo foto: requiere media_url (sin plantilla). Modo cromo: requiere plantilla.
  if (isPhoto) {
    const url = body.media_url ?? "";
    if (!url) {
      return NextResponse.json({ error: "missing_media" }, { status: 400 });
    }
    if (!DATA_IMAGE_RE.test(url)) {
      return NextResponse.json(
        { error: "invalid_media", detail: "La foto debe subirse desde el dispositivo (data-URL de imagen)." },
        { status: 400 }
      );
    }
    if (url.length > MAX_MEDIA_URL_CHARS) {
      return NextResponse.json(
        { error: "media_too_large", detail: "La foto es demasiado grande. Prueba con una de menor resolución." },
        { status: 413 }
      );
    }
  } else if (!body.template_id || !getTemplate(body.template_id)) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }

  const overlay = (body.overlay_text ?? "").trim().slice(0, MAX_OVERLAY_CHARS);
  // En foto el texto es opcional (puede ir solo con stickers); en cromo es obligatorio.
  if (!isPhoto && !overlay) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }

  // template_data en lista blanca: del cliente solo aceptamos stickers válidos.
  const stickers = sanitizeStickers(body.template_data?.stickers);
  const templateData: Record<string, unknown> = stickers ? { stickers } : {};

  try {
    const story = await createUserStory(userId, {
      templateId: isPhoto ? null : body.template_id ?? null,
      overlayText: overlay,
      mediaType: isPhoto ? "image" : "template",
      mediaUrl: isPhoto ? body.media_url ?? null : null,
      templateData,
    });
    return NextResponse.json({ ok: true, story }, { status: 201 });
  } catch (e) {
    // Devolvemos el motivo real del fallo (p. ej. columna media_url muy corta,
    // RLS, etc.) para no quedarnos con un "no se pudo crear" opaco.
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "create_failed", detail }, { status: 500 });
  }
}
