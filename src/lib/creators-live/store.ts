// src/lib/creators-live/store.ts
//
// Cache de creators en directo. El cron escribe, el endpoint p\u00fablico lee.
// As\u00ed las p\u00e1ginas responden en <50ms sin pegarle a Twitch en cada request.

import { kv } from "@vercel/kv";
import type { TwitchLiveStream } from "./twitch";

const KV_KEY = "creators:live:v1";
const TTL_SECONDS = 600; // 10 min, por si el cron falla los lives caducan.

export interface LiveCreator {
  slug: string;
  nombre: string;
  imagen: string;
  paisFlag: string;
  /** Username Twitch (lowercased). */
  twitchUser: string;
  /** Datos del stream. */
  title: string;
  gameName: string;
  thumbnailUrl: string;
  viewerCount: number;
  startedAt: string;
  /** URLs de redirecci\u00f3n. */
  perfilUrl: string;       // /creadores/[slug]
  twitchUrl: string;       // https://twitch.tv/...
}

export interface LiveStore {
  /** ISO timestamp de la \u00faltima actualizaci\u00f3n del cron. */
  updatedAt: string;
  /** Lista de creators actualmente en directo. */
  live: LiveCreator[];
}

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function readLiveStore(): Promise<LiveStore> {
  if (!isKvEnabled()) {
    return { updatedAt: new Date(0).toISOString(), live: [] };
  }
  try {
    const raw = await kv.get<LiveStore>(KV_KEY);
    if (raw && Array.isArray(raw.live)) return raw;
  } catch (err) {
    console.error("[creators-live] readLiveStore failed:", (err as Error).message);
  }
  return { updatedAt: new Date(0).toISOString(), live: [] };
}

export async function writeLiveStore(store: LiveStore): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(KV_KEY, store, { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[creators-live] writeLiveStore failed:", (err as Error).message);
  }
}

/** Util: combina un stream Twitch con el data del creator del repo. */
export function buildLiveCreator(opts: {
  creatorSlug: string;
  creatorNombre: string;
  creatorImagen: string;
  creatorPaisFlag: string;
  twitchUser: string;
  stream: TwitchLiveStream;
}): LiveCreator {
  return {
    slug: opts.creatorSlug,
    nombre: opts.creatorNombre,
    imagen: opts.creatorImagen,
    paisFlag: opts.creatorPaisFlag,
    twitchUser: opts.twitchUser.toLowerCase(),
    title: opts.stream.title,
    gameName: opts.stream.gameName,
    thumbnailUrl: opts.stream.thumbnailUrl,
    viewerCount: opts.stream.viewerCount,
    startedAt: opts.stream.startedAt,
    perfilUrl: `/creadores/${opts.creatorSlug}`,
    twitchUrl: `https://twitch.tv/${opts.twitchUser.toLowerCase()}`,
  };
}
