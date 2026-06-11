// src/lib/match-center/chronicle.ts
//
// CRÓNICA IA AUTOMÁTICA: al pitido final de cada partido del Match Center se
// redacta una crónica editorial (Claude) usando EXCLUSIVAMENTE los datos
// reales del snapshot (marcador, eventos, estadísticas) y se autopublica en la
// sección de noticias. Cada partido del Mundial se convierte así en un
// artículo SEO instantáneo sin intervención manual.
//
// Garantías:
//   - Cero invención: el prompt prohíbe cualquier dato fuera del JSON y la
//     fuente es el feed real (api-football) ya validado por el Match Center.
//   - Idempotencia: candado SETNX por partido en KV; si la generación falla,
//     el candado se libera y la siguiente pasada del cron reintenta.
//   - Concurrencia: la escritura usa el lock del store de noticias (mismo
//     mecanismo que el pipeline de ingesta).
//
// La dispara el cron match-center-poll cuando un snapshot llega en estado
// terminal (FT/AET/PEN). Modelo editorial: claude-sonnet-4-6 (prosa de más
// calidad que el haiku del relator); override con ANTHROPIC_MODEL_CHRONICLE.

import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@/lib/kv";
import {
  acquireStoreLock,
  readIngestStore,
  releaseStoreLock,
  writeIngestStore,
} from "@/lib/noticias-store";
import type { DraftNoticia } from "@/lib/noticias-ingest";
import type { NoticiaBlock } from "@/data/noticias";
import { matchHeroImage } from "./heroImage";
import type { LiveSnapshot, MatchEvent } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const FLAG_PREFIX = "mc:chronicle:v1:";
const FLAG_TTL_S = 7 * 24 * 60 * 60;
const LOCK_TOKEN_PREFIX = "chronicle-";

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EVENT_ES: Record<string, string> = {
  goal: "gol",
  penalty_goal: "gol de penalti",
  own_goal: "gol en propia puerta",
  penalty_miss: "penalti fallado",
  yellow: "tarjeta amarilla",
  second_yellow: "segunda amarilla (expulsión)",
  red: "tarjeta roja",
  sub: "sustitución",
  var: "revisión del VAR",
};

function sideName(snap: LiveSnapshot, side: MatchEvent["side"]): string {
  if (side === "home") return snap.meta.home.name;
  if (side === "away") return snap.meta.away.name;
  return "neutral";
}

/** Datos compactos y 100% reales que recibe el redactor. */
function compactFacts(snap: LiveSnapshot) {
  const m = snap.meta;
  return {
    partido: `${m.home.name} vs ${m.away.name}`,
    fase: m.phase + (m.group ? ` · Grupo ${m.group}` : ""),
    estadio: m.venue || null,
    ciudad: m.city || null,
    resultado_final: `${m.home.name} ${snap.score[0] ?? 0}-${snap.score[1] ?? 0} ${m.away.name}`,
    estado: snap.status,
    eventos: snap.events
      .filter((e) => EVENT_ES[e.type])
      .map((e) => ({
        minuto: `${e.minute}${e.extra ? `+${e.extra}` : ""}`,
        tipo: EVENT_ES[e.type],
        equipo: sideName(snap, e.side),
        jugador: e.player ?? null,
        asistencia: e.assist ?? null,
        entra: e.playerIn ?? null,
      })),
    estadisticas: {
      posesion: snap.stats.possession,
      tiros: snap.stats.shots,
      tiros_a_puerta: snap.stats.shotsOn,
      corneres: snap.stats.corners,
      faltas: snap.stats.fouls,
      amarillas: snap.stats.yellow,
      rojas: snap.stats.red,
      xg: snap.stats.xg,
    },
  };
}

const SYSTEM_PROMPT = `Eres redactor deportivo de ZonaMundial y escribes la crónica de un partido que ACABA de terminar.

Recibes un JSON con TODOS los hechos verificados del partido (resultado, eventos con minuto y protagonista, estadísticas). Es tu ÚNICA fuente.

REGLAS INNEGOCIABLES:
- No inventes NADA que no esté en el JSON: ni declaraciones, ni historia previa, ni clasificaciones, ni datos de contexto. Si un dato no está, no lo menciones.
- Español neutro, tono de crónica profesional con ritmo (estilo agencia con chispa), sin emojis ni signos raros.
- 5 a 7 párrafos, 300-420 palabras en total.
- El primer párrafo cuenta el qué y el cómo del resultado. El desarrollo sigue la cronología de los goles y momentos clave (usa los minutos). Cierra con una lectura apoyada en las estadísticas (posesión, tiros, xG).
- Titular de máximo 95 caracteres que INCLUYA el resultado (ej. "Portugal remonta y tumba 2-1 a Nigeria en Leiria").
- Entradilla (excerpt) de máximo 220 caracteres.

Devuelve SOLO un JSON válido: {"title":"...","excerpt":"...","paragraphs":["...","..."]}`;

interface ChronicleDraftContent {
  title: string;
  excerpt: string;
  paragraphs: string[];
}

async function generateChronicle(
  snap: LiveSnapshot,
): Promise<ChronicleDraftContent | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const client = new Anthropic({ apiKey: key });
  const model = process.env.ANTHROPIC_MODEL_CHRONICLE || DEFAULT_MODEL;

  const resp = await client.messages.create({
    model,
    max_tokens: 1600,
    temperature: 0.6,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Hechos del partido (JSON):\n${JSON.stringify(compactFacts(snap))}\n\nDevuelve SOLO el JSON pedido.`,
      },
    ],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const raw = block.text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/```\s*$/, "");
  let parsed: ChronicleDraftContent;
  try {
    parsed = JSON.parse(raw) as ChronicleDraftContent;
  } catch {
    return null;
  }
  if (
    !parsed.title ||
    !parsed.excerpt ||
    !Array.isArray(parsed.paragraphs) ||
    parsed.paragraphs.length < 3
  ) {
    return null;
  }
  return {
    title: String(parsed.title).slice(0, 120),
    excerpt: String(parsed.excerpt).slice(0, 300),
    paragraphs: parsed.paragraphs.map((p) => String(p)).filter(Boolean),
  };
}

/** Inserta la crónica como noticia PUBLICADA en el store de ingesta. */
async function publishDraft(snap: LiveSnapshot, content: ChronicleDraftContent): Promise<boolean> {
  const m = snap.meta;
  const today = new Date().toISOString().slice(0, 10);
  const slug = `cronica-${slugify(m.home.name)}-${slugify(m.away.name)}-${today}`;
  const words = content.paragraphs.join(" ").split(/\s+/).length;

  let realImage: string | undefined;
  try {
    realImage = (await matchHeroImage(m)) || undefined;
  } catch {
    realImage = undefined;
  }

  const body: NoticiaBlock[] = content.paragraphs.map((p) => ({ type: "p", text: p }));
  const draft: DraftNoticia = {
    slug,
    title: content.title,
    excerpt: content.excerpt,
    seoDescription: content.excerpt.slice(0, 158),
    cat: "analisis",
    date: today,
    readTime: Math.max(2, Math.round(words / 200)),
    flags: [m.home.flag, m.away.flag].filter((f) => /^[a-z]{2}$/.test(f)),
    tags: ["crónica", "en vivo", "mundial 2026", m.home.name, m.away.name],
    featured: false,
    realImage,
    authorId: "carlos-zamudio",
    body,
    sourceName: "ZonaMundial · Match Center",
    sourceUrlHash: `mc-chronicle-${snap.matchId}-${today}`,
    ingestedAt: new Date().toISOString(),
    status: "published",
  };

  const token = `${LOCK_TOKEN_PREFIX}${snap.matchId}-${Date.now()}`;
  const locked = await acquireStoreLock(token);
  if (!locked) return false;
  try {
    const store = await readIngestStore();
    if (store.drafts.some((d) => d.slug === slug)) return true; // ya publicada
    store.drafts.push(draft);
    store.generatedAt = new Date().toISOString();
    await writeIngestStore(store);
    return true;
  } finally {
    await releaseStoreLock(token);
  }
}

/**
 * Punto de entrada para el cron: publica la crónica de un partido TERMINADO
 * una sola vez. Devuelve true si la publicó en esta pasada.
 */
export async function maybePublishChronicle(snap: LiveSnapshot): Promise<boolean> {
  // Sin eventos no hay partido que contar (y los slots de prueba sin datos
  // tampoco): mejor ninguna crónica que una vacía.
  if (!snap.events || snap.events.length === 0) return false;
  if (!process.env.ANTHROPIC_API_KEY) return false;

  // Candado de idempotencia entre pasadas/instancias del cron.
  const flagKey = `${FLAG_PREFIX}${snap.matchId}`;
  if (kvEnabled()) {
    try {
      const res = await kv.set(flagKey, "1", { nx: true, ex: FLAG_TTL_S });
      if (res !== "OK") return false; // otra pasada ya la está haciendo / hecha
    } catch {
      /* sin KV: seguimos; el dedupe por slug del store nos cubre */
    }
  }

  try {
    const content = await generateChronicle(snap);
    if (!content) throw new Error("generation_failed");
    const ok = await publishDraft(snap, content);
    if (!ok) throw new Error("publish_failed");
    console.log(`[mc-chronicle] publicada crónica de ${snap.meta.home.name}-${snap.meta.away.name}`);
    return true;
  } catch (err) {
    console.error("[mc-chronicle] failed", snap.matchId, (err as Error).message);
    // Libera el candado para que la siguiente pasada del cron reintente.
    if (kvEnabled()) {
      try {
        await kv.del(flagKey);
      } catch {
        /* noop */
      }
    }
    return false;
  }
}
