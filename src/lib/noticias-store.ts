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
import type { DraftNoticia } from "./noticias-ingest";

interface IngestStore {
  generatedAt: string;
  drafts: DraftNoticia[];
}

const KV_KEY = "noticias:ingested-store";
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
    const raw = await kv.get<IngestStore>(KV_KEY);
    if (raw && Array.isArray(raw.drafts)) return raw;
  } catch (err) {
    console.error("[store] KV read failed", (err as Error).message);
  }
  return { generatedAt: new Date().toISOString(), drafts: [] };
}

async function writeToKv(store: IngestStore): Promise<void> {
  try {
    await kv.set(KV_KEY, store);
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
  };
}

/** Returns ALL noticias visible to the public site (static + auto-published). */
export async function getAllPublicNoticias(): Promise<Noticia[]> {
  const store = await readIngestStore();
  const published = store.drafts
    .filter((d) => d.status === "published")
    .map(draftToNoticia);

  // Dedup by slug (static wins over auto)
  const seen = new Set<string>(STATIC_NOTICIAS.map((n) => n.slug));
  const merged: Noticia[] = [...STATIC_NOTICIAS];
  for (const n of published) {
    if (seen.has(n.slug)) continue;
    seen.add(n.slug);
    merged.push(n);
  }

  // Sort by date desc
  merged.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
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
