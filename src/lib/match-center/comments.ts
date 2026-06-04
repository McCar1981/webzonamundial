// src/lib/match-center/comments.ts
//
// Almacén de comentarios en vivo del Match Center sobre Vercel KV. Cada partido
// tiene una lista capada (FIFO, más nuevo al frente) con TTL. Si KV no está
// configurado, degrada a vacío/no-op (no rompe el render ni el endpoint).

import { kv } from "@/lib/kv";

const PREFIX = "mc:comments:v1:";
const MAX = 200; // comentarios retenidos por partido
const TTL_SECONDS = 60 * 60 * 12; // 12h tras el último comentario

export interface MatchComment {
  id: string;
  uid: string; // id de usuario (moderación / evitar duplicados)
  name: string; // nombre mostrado (profile.username o fallback)
  country: string; // ISO-3166 alpha-2 lowercase, "" si desconocido
  avatar: string; // url de avatar, "" si ninguno
  text: string;
  ts: number; // epoch ms
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function key(matchId: number): string {
  return `${PREFIX}${matchId}`;
}

/** Lee los comentarios más recientes (orden: más nuevo primero). */
export async function getComments(matchId: number, limit = 60): Promise<MatchComment[]> {
  if (!isKvEnabled()) return [];
  try {
    const raw = await kv.lrange<MatchComment>(key(matchId), 0, Math.max(0, limit - 1));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Inserta un comentario al frente y capa la lista. */
export async function addComment(matchId: number, c: MatchComment): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    const k = key(matchId);
    await kv.lpush(k, c);
    await kv.ltrim(k, 0, MAX - 1);
    await kv.expire(k, TTL_SECONDS);
  } catch (err) {
    console.error("[mc-comments] addComment failed", (err as Error).message);
  }
}
