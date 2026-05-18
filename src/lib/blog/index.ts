// src/lib/blog/index.ts
// API pública del módulo blog: listado, búsqueda por slug, navegación.
// Todos los métodos respetan publishedAt — los posts programados a futuro
// quedan ocultos hasta que llegue su fecha.
//
// FUENTES DE POSTS (fusionados):
//   1. Estáticos editoriales: src/content/blog/*.ts (commit en git, 13 piezas
//      curadas manualmente).
//   2. Auto-generados por IA: Vercel KV vía src/lib/blog/store.ts (el cron
//      `/api/cron/generate-blog-post` los crea cada 2 días).
//
// Si dos posts tienen el mismo slug, el estático tiene prioridad (es lo que
// vive en git y es revisado por humanos).

import { POSTS } from "./posts";
import { readAutoPosts } from "./store";
import type { BlogPost, BlogCategory } from "./types";

function isPublic(p: BlogPost, now: Date = new Date()): boolean {
  return new Date(p.publishedAt).getTime() <= now.getTime();
}

/**
 * Combina los posts estáticos del repo con los auto-generados en KV.
 * Estáticos ganan en conflicto de slug.
 */
async function getCombinedPosts(): Promise<BlogPost[]> {
  const auto = await readAutoPosts();
  const staticSlugs = new Set(POSTS.map((p) => p.slug));
  const filteredAuto = auto.filter((p) => !staticSlugs.has(p.slug));
  return [...POSTS, ...filteredAuto];
}

/** Todos los posts publicados, ordenados:
 *  1. Posts fijados (pinned) primero, en orden de publishedAt descendente
 *     entre ellos.
 *  2. El resto por publishedAt descendente.
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const now = new Date();
  const all = await getCombinedPosts();
  const visible = all.filter((p) => isPublic(p, now));
  return visible.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/** Sólo en build/desarrollo: incluye también los pendientes (para preview interno). */
export async function getAllPostsIncludingDrafts(): Promise<BlogPost[]> {
  const all = await getCombinedPosts();
  return all.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  // Prioridad estáticos: el slug puede coincidir en ambos sources.
  const staticPost = POSTS.find((x) => x.slug === slug);
  if (staticPost) {
    return isPublic(staticPost) ? staticPost : null;
  }
  const auto = await readAutoPosts();
  const autoPost = auto.find((x) => x.slug === slug);
  if (!autoPost) return null;
  return isPublic(autoPost) ? autoPost : null;
}

export async function getPostsByCategory(category: BlogCategory): Promise<BlogPost[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.category === category);
}

/** Para la sección "Relacionados" al final de cada post. */
export async function getRelatedPosts(post: BlogPost, max = 3): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  const all = allPosts.filter((p) => p.slug !== post.slug);
  // Si el post define explícitos, esos primero
  if (post.related && post.related.length > 0) {
    const explicit = post.related
      .map((slug) => all.find((p) => p.slug === slug))
      .filter((x): x is BlogPost => Boolean(x));
    if (explicit.length >= max) return explicit.slice(0, max);
    const remaining = all.filter((p) => !explicit.find((e) => e.slug === p.slug));
    return [...explicit, ...remaining].slice(0, max);
  }
  // Por defecto: misma categoría, luego cualquiera por fecha
  const sameCategory = all.filter((p) => p.category === post.category);
  const others = all.filter((p) => p.category !== post.category);
  return [...sameCategory, ...others].slice(0, max);
}

/** Slugs para generateStaticParams. Async porque incluye los auto de KV. */
export async function getAllSlugs(): Promise<string[]> {
  const all = await getAllPosts();
  return all.map((p) => p.slug);
}

export type { BlogPost, BlogCategory } from "./types";
export { CATEGORY_LABELS, CATEGORY_COLORS, EDITORIAL_AUTHOR } from "./types";
