/**
 * Unified noticias loader.
 *
 * Combines static curated articles (src/data/noticias.ts) with the
 * published drafts from the auto-ingest pipeline.
 *
 * Storage backend:
 *  - Production: Vercel KV (Redis managed). Persists across deployments
 *    and lambda invocations, which is what makes autopublish work.
 *  - Local dev: filesystem JSON at data/noticias-ingested.json. Same
 *    interface, no KV credentials needed.
 *
 * The backend is auto-detected: if KV_URL is set, KV wins. Otherwise we
 * fall back to filesystem.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { kv } from "@vercel/kv";
import {
  NOTICIAS as STATIC_NOTICIAS,
  type Noticia,
  type NoticiaCategory,
} from "@/data/noticias";
import { isAllowedNoticiaImage } from "./noticias-image-policy";
import type { DraftNoticia } from "./noticias-ingest";

interface IngestStore {
  generatedAt: string;
  drafts: DraftNoticia[];
}

const KV_KEY = "noticias:ingested-store";
// Bumped to force a clean slate. Older format had stale articles (cycling,
// short bodies) we couldn't evict due to KV cache propagation issues.
const KV_KEY_VERSIONED = "noticias:ingested-store:v3";
const FALLBACK_PATH = path.join(process.cwd(), "data", "noticias-ingested.json");

function isKvEnabled(): boolean {
  // Vercel KV connection injects KV_REST_API_URL when "Connect Project" is run.
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export function getStorePath(): string {
  return isKvEnabled() ? `kv:${KV_KEY}` : FALLBACK_PATH;
}

/* ---------- KV adapter ---------- */

async function readFromKv(): Promise<IngestStore> {
  try {
    const raw = await kv.get<IngestStore>(KV_KEY_VERSIONED);
    if (raw && Array.isArray(raw.drafts)) return raw;
  } catch (err) {
    console.error("[store] KV read failed", (err as Error).message);
  }
  return { generatedAt: new Date().toISOString(), drafts: [] };
}

async function writeToKv(store: IngestStore): Promise<void> {
  try {
    await kv.set(KV_KEY_VERSIONED, store);
    // Also delete the old un-versioned key (one-time migration cleanup)
    await kv.del(KV_KEY).catch(() => {});
  } catch (err) {
    console.error("[store] KV write failed", (err as Error).message);
    throw err;
  }
}

/* ---------- Filesystem adapter ---------- */

async function readFromFs(): Promise<IngestStore> {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, "utf-8");
    return JSON.parse(raw) as IngestStore;
  } catch {
    return { generatedAt: new Date().toISOString(), drafts: [] };
  }
}

async function writeToFs(store: IngestStore): Promise<void> {
  await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
  await fs.writeFile(FALLBACK_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/* ---------- Public API ---------- */

export async function readIngestStore(): Promise<IngestStore> {
  return isKvEnabled() ? readFromKv() : readFromFs();
}

export async function writeIngestStore(store: IngestStore): Promise<void> {
  return isKvEnabled() ? writeToKv(store) : writeToFs(store);
}

/* ---------- Lock distribuido ---------- */
//
// El store es un único blob (lee-modifica-escribe). Si dos invocaciones del
// cron (p.ej. la programada horaria + un run manual) corren a la vez, ambas
// leen el mismo blob, lo modifican y lo reescriben: el segundo write pisa al
// primero y se PIERDEN publicadas (lost update). Esto drenaba el conteo.
//
// Solución: un lock NX en KV. Solo una ingesta tiene el lock a la vez; las
// demás se saltan el tick (no es grave: el cron horario reintenta). TTL alto
// para que, si una invocación muere sin liberar, el lock expire solo.

const LOCK_KEY = "noticias:ingested-store:lock";
// TTL por encima del presupuesto de trabajo del cron (~50s) + margen, para que
// un crash no deje el lock colgado más de lo necesario.
const LOCK_TTL_MS = 90_000;

/**
 * Intenta adquirir el lock. Devuelve true si lo consiguió (o si KV está
 * deshabilitado: en dev con FS no hay concurrencia entre lambdas).
 * Fail-open ante error de infra: preferimos arriesgar una carrera rara a
 * bloquear toda la ingesta por un fallo transitorio de KV.
 */
export async function acquireStoreLock(
  token: string,
  ttlMs = LOCK_TTL_MS,
): Promise<boolean> {
  if (!isKvEnabled()) return true;
  try {
    const res = await kv.set(LOCK_KEY, token, { nx: true, px: ttlMs });
    return res === "OK";
  } catch (err) {
    console.error("[store] lock acquire failed", (err as Error).message);
    return true; // fail-open
  }
}

/**
 * Libera el lock SOLO si seguimos siendo los dueños (comparando el token), para
 * no borrar por error un lock que ya expiró y readquirió otra invocación.
 */
export async function releaseStoreLock(token: string): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    const current = await kv.get<string>(LOCK_KEY);
    if (current === token) await kv.del(LOCK_KEY);
  } catch (err) {
    console.error("[store] lock release failed", (err as Error).message);
  }
}

/** Convert a published draft into the public Noticia shape. */
function draftToNoticia(d: DraftNoticia, idx: number): Noticia {
  return {
    id: 1_000_000 + idx, // synthetic id range to avoid collision with static
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    seoDescription: d.seoDescription,
    cat: d.cat as NoticiaCategory,
    date: d.date,
    updatedAt: d.updatedAt,
    readTime: d.readTime,
    flags: d.flags,
    tags: d.tags,
    featured: d.featured,
    realImage: d.realImage,
    imageCaption: d.imageCaption,
    imageSource: d.imageSource,
    authorId: d.authorId,
    body: d.body,
    sourceUrl: d.sourceUrl,
    sourceName: d.sourceName,
    ingestedAt: d.ingestedAt,
  };
}

/** Returns ALL noticias visible to the public site (static + auto-published). */
export async function getAllPublicNoticias(): Promise<Noticia[]> {
  const store = await readIngestStore();
  const published = store.drafts
    .filter((d) => d.status === "published")
    .map(draftToNoticia);

  // Mapeo slug → ingestedAt para tiebreaker. GNews trunca a YYYY-MM-DD así
  // que muchas noticias del mismo día comparten `date` — usamos ingestedAt
  // (timestamp ISO de cuándo entraron al sistema) para que las más recientes
  // queden arriba aunque compartan fecha de publicación con otras.
  const ingestedAtBySlug = new Map<string, string>();
  for (const d of store.drafts) {
    if (d.ingestedAt) ingestedAtBySlug.set(d.slug, d.ingestedAt);
  }

  // Dedup by slug (static wins over auto)
  const seen = new Set<string>(STATIC_NOTICIAS.map((n) => n.slug));
  const merged: Noticia[] = [...STATIC_NOTICIAS];
  for (const n of published) {
    if (seen.has(n.slug)) continue;
    seen.add(n.slug);
    merged.push(n);
  }

  // Política de copyright: las imágenes que no vengan de una fuente con
  // licencia conocida (propias, Commons, flagcdn, api-sports) se descartan
  // aquí, en el ÚNICO punto de lectura pública — cubre artículo, listado,
  // relacionados, JSON-LD y RSS, incluidas las piezas ya almacenadas en KV
  // con hotlinks a CDNs de otros medios.
  for (let i = 0; i < merged.length; i++) {
    const n = merged[i];
    if (n.realImage && !isAllowedNoticiaImage(n.realImage)) {
      merged[i] = {
        ...n,
        realImage: undefined,
        imageCaption: undefined,
        imageSource: undefined,
      };
    }
  }

  // Sort por "freshness desde el punto de vista del lector":
  //  - Primario: ingestedAt (cuándo entró al sistema). Refleja el orden en
  //    que el lector vio aparecer la noticia. Las que no tienen ingestedAt
  //    (drafts viejos sin el campo + STATIC_NOTICIAS) van al final del bloque
  //    de su date.
  //  - Si ambos comparten ingestedAt o ninguno lo tiene, usa `date` desc.
  //  - Última desambiguación: orden alfabético por slug para estabilidad.
  //
  // Antes el sort era date-first con ingestedAt como tiebreaker, pero GNews
  // devuelve `date = publishedAt del medio` (no la fecha real de ingesta), así
  // que múltiples ingest ticks del mismo día empataban en `date` y el primero
  // se quedaba arriba durante horas.
  merged.sort((a, b) => {
    const aIng = ingestedAtBySlug.get(a.slug);
    const bIng = ingestedAtBySlug.get(b.slug);
    // Las que tienen ingestedAt van SIEMPRE antes que las que no.
    if (aIng && !bIng) return -1;
    if (!aIng && bIng) return 1;
    if (aIng && bIng) {
      const cmp = bIng.localeCompare(aIng);
      if (cmp !== 0) return cmp;
    }
    // Tiebreaker: date
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.slug.localeCompare(b.slug);
  });
  return merged;
}

export async function getNoticiaBySlugPublic(slug: string): Promise<Noticia | undefined> {
  const all = await getAllPublicNoticias();
  return all.find((n) => n.slug === slug);
}

export async function getAllPublicSlugs(): Promise<string[]> {
  const all = await getAllPublicNoticias();
  return all.map((n) => n.slug);
}

export async function getRelatedNoticiasPublic(
  current: Noticia,
  limit = 4,
): Promise<Noticia[]> {
  const all = await getAllPublicNoticias();
  const others = all.filter((n) => n.slug !== current.slug);
  const scored = others.map((n) => {
    const tagOverlap = n.tags.filter((t) => current.tags.includes(t)).length;
    const catBoost = n.cat === current.cat ? 2 : 0;
    return { n, score: tagOverlap * 3 + catBoost };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.n.date).getTime() - new Date(a.n.date).getTime();
  });
  return scored.slice(0, limit).map((s) => s.n);
}
