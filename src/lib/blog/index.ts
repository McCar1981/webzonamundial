// src/lib/blog/index.ts
// API pública del módulo blog: listado, búsqueda por slug, navegación.
// Todos los métodos respetan publishedAt — los posts programados a futuro
// quedan ocultos hasta que llegue su fecha.

import { POSTS } from "./posts";
import type { BlogPost, BlogCategory } from "./types";

function isPublic(p: BlogPost, now: Date = new Date()): boolean {
  return new Date(p.publishedAt).getTime() <= now.getTime();
}

/** Todos los posts publicados, ordenados:
 *  1. Posts fijados (pinned) primero, en orden de publishedAt descendente
 *     entre ellos.
 *  2. El resto por publishedAt descendente.
 */
export function getAllPosts(): BlogPost[] {
  const now = new Date();
  const visible = POSTS.filter((p) => isPublic(p, now));
  return visible.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/** Sólo en build/desarrollo: incluye también los pendientes (para preview interno). */
export function getAllPostsIncludingDrafts(): BlogPost[] {
  return [...POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  const p = POSTS.find((x) => x.slug === slug);
  if (!p) return null;
  if (!isPublic(p)) return null;
  return p;
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

/** Para la sección "Relacionados" al final de cada post. */
export function getRelatedPosts(post: BlogPost, max = 3): BlogPost[] {
  const all = getAllPosts().filter((p) => p.slug !== post.slug);
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

/** Slugs estáticos para generateStaticParams. */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export type { BlogPost, BlogCategory } from "./types";
export { CATEGORY_LABELS, CATEGORY_COLORS, EDITORIAL_AUTHOR } from "./types";
