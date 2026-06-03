// src/lib/blog/store.ts
//
// Persistencia de posts generados por IA. Los posts editoriales humanos
// siguen viviendo en src/content/blog/*.ts (código fuente versionado).
// Los posts generados por el cron viven en Vercel KV — así no hace falta
// commit + deploy cada 2 días, ni tocar el repo.
//
// Diseño:
//  - Una sola key en KV: `blog:auto-posts:v1` con array de BlogPost serializados.
//  - LIMIT 50 posts auto (rotación FIFO para no crecer indefinidamente).
//  - Las funciones públicas de src/lib/blog/index.ts fusionan static + KV
//    transparentemente.

import { kv } from "@vercel/kv";
import type { BlogPost } from "./types";

const KV_KEY = "blog:auto-posts:v1";
const MAX_AUTO_POSTS = 50;

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/**
 * Lee todos los posts auto-generados de KV. Si no hay KV configurado
 * (dev local) devuelve []. Nunca lanza.
 */
export async function readAutoPosts(): Promise<BlogPost[]> {
  if (!isKvEnabled()) return [];
  try {
    const raw = await kv.get<BlogPost[]>(KV_KEY);
    if (!Array.isArray(raw)) return [];
    return raw;
  } catch (err) {
    console.error("[blog/store] readAutoPosts failed:", (err as Error).message);
    return [];
  }
}

/**
 * Añade un post nuevo al store. Mantiene los últimos MAX_AUTO_POSTS por
 * publishedAt descendente. Idempotente por slug: si ya existe, no duplica.
 */
export async function appendAutoPost(post: BlogPost): Promise<{
  added: boolean;
  total: number;
}> {
  if (!isKvEnabled()) {
    console.warn("[blog/store] KV not configured, post NOT persisted");
    return { added: false, total: 0 };
  }
  try {
    const existing = await readAutoPosts();
    if (existing.some((p) => p.slug === post.slug)) {
      return { added: false, total: existing.length };
    }
    const merged = [post, ...existing]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, MAX_AUTO_POSTS);
    await kv.set(KV_KEY, merged);
    return { added: true, total: merged.length };
  } catch (err) {
    console.error("[blog/store] appendAutoPost failed:", (err as Error).message);
    return { added: false, total: 0 };
  }
}

/**
 * Sobrescribe el array completo de posts auto en KV. Lo usa la auditoría de
 * calidad (audit-blog) para persistir flags `noindex` sin duplicar entradas.
 * Respeta el tope MAX_AUTO_POSTS por publishedAt descendente.
 */
export async function writeAutoPosts(posts: BlogPost[]): Promise<boolean> {
  if (!isKvEnabled()) {
    console.warn("[blog/store] KV not configured, writeAutoPosts skipped");
    return false;
  }
  try {
    const sorted = [...posts]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, MAX_AUTO_POSTS);
    await kv.set(KV_KEY, sorted);
    return true;
  } catch (err) {
    console.error("[blog/store] writeAutoPosts failed:", (err as Error).message);
    return false;
  }
}

/**
 * Devuelve los slugs ya usados (estáticos + auto) — el generador lo usa
 * para no proponer temas duplicados.
 */
export async function getAllUsedSlugs(): Promise<Set<string>> {
  // Importar dinámicamente para evitar cicl ode módulos cuando el store
  // se carga desde el cron.
  const { POSTS } = await import("./posts");
  const slugs = new Set<string>(POSTS.map((p) => p.slug));
  const auto = await readAutoPosts();
  for (const p of auto) slugs.add(p.slug);
  return slugs;
}

/**
 * Devuelve un sample de títulos recientes (estáticos + auto) para que el
 * generador IA evite proponer temas parecidos a los últimos publicados.
 */
export async function getRecentTitles(limit = 20): Promise<string[]> {
  const { POSTS } = await import("./posts");
  const auto = await readAutoPosts();
  const all = [...POSTS, ...auto]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, limit);
  return all.map((p) => p.title);
}
