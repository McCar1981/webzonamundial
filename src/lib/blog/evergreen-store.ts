// src/lib/blog/evergreen-store.ts
//
// Persistencia de las piezas PERENNES (Track B): previas de grupo y guías de
// selección generadas a partir de un dossier de datos verificados.
//
// Diseño (paralelo a store.ts pero SEPARADO):
//  - Key propia en KV: `blog:evergreen:v1`.
//  - SIN rotación FIFO: el evergreen es un catálogo estable (18 piezas), no un
//    feed que crece sin fin. Se hace upsert por slug (regenerar = reemplazar).
//  - Se fusiona en src/lib/blog/index.ts junto a los static + auto posts.

import { kv } from "@vercel/kv";
import { unstable_noStore as noStore } from "next/cache";
import type { BlogPost } from "./types";

const KV_KEY = "blog:evergreen:v1";

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/** Lee todas las piezas perennes de KV. Sin KV (dev local) devuelve []. Nunca lanza. */
export async function readEvergreenPosts(): Promise<BlogPost[]> {
  if (!isKvEnabled()) return [];
  // KV lee vía fetch; sin esto Next cachea la respuesta (Data Cache) y devuelve
  // un snapshot rancio, lo que rompe el read-modify-write del upsert (lost
  // updates) y hace que las piezas recién escritas den 404 en sus páginas.
  noStore();
  try {
    const raw = await kv.get<BlogPost[]>(KV_KEY);
    if (!Array.isArray(raw)) return [];
    return raw;
  } catch (err) {
    console.error("[blog/evergreen-store] read failed:", (err as Error).message);
    return [];
  }
}

/**
 * Upsert por slug: si la pieza ya existe la reemplaza (regenerar la actualiza),
 * si no, la añade. Devuelve si fue update o insert y el total resultante.
 */
export async function upsertEvergreenPost(post: BlogPost): Promise<{
  updated: boolean;
  total: number;
}> {
  if (!isKvEnabled()) {
    console.warn("[blog/evergreen-store] KV not configured, post NOT persisted");
    return { updated: false, total: 0 };
  }
  try {
    const existing = await readEvergreenPosts();
    const idx = existing.findIndex((p) => p.slug === post.slug);
    let merged: BlogPost[];
    let updated: boolean;
    if (idx >= 0) {
      merged = [...existing];
      merged[idx] = post;
      updated = true;
    } else {
      merged = [...existing, post];
      updated = false;
    }
    await kv.set(KV_KEY, merged);
    return { updated, total: merged.length };
  } catch (err) {
    console.error("[blog/evergreen-store] upsert failed:", (err as Error).message);
    return { updated: false, total: 0 };
  }
}

/**
 * Sobrescribe el array completo de piezas perennes. Lo usa la auditoría de
 * calidad para persistir flags `noindex` sin duplicar entradas.
 */
export async function writeEvergreenPosts(posts: BlogPost[]): Promise<boolean> {
  if (!isKvEnabled()) {
    console.warn("[blog/evergreen-store] KV not configured, write skipped");
    return false;
  }
  try {
    await kv.set(KV_KEY, posts);
    return true;
  } catch (err) {
    console.error("[blog/evergreen-store] write failed:", (err as Error).message);
    return false;
  }
}
