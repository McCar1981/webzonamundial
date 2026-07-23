// src/lib/noticias-club-targets.ts
//
// Clubes SEGUIDOS por los usuarios → objetivos de las queries dirigidas del
// ingest de noticias ("publicación rápida solo para el club elegido"). Agrega
// los `fav_clubes` (jsonb multi, migración 2026-53) + `fav_club_name` (legacy)
// de profiles con service-role, cuenta popularidad y cachea 6 h en KV — el
// ingest corre cada hora y la lista de clubes seguidos cambia despacio.
//
// Coste GNews: cada tick añade NEWS_CLUB_QUERIES_PER_TICK (def. 2) búsquedas
// rotando por la lista → +~48 requests/día. La rotación por hora cubre hasta
// 24 clubes distintos cada 12 h con el default.

import { createClient } from "@supabase/supabase-js";
import { kv } from "@/lib/kv";
import { clubMatchTerms } from "@/lib/ligas/noticias-personal";
import type { ExtraQuery } from "./noticias-ingest";

const KEY = "noticias:clubtargets:v1";
const TTL_S = 6 * 60 * 60;
const MAX_TARGETS = 24;

type ProfileRow = { fav_clubes?: unknown; fav_club_name?: string | null };

/** Nombres de club seguidos, ordenados por nº de seguidores (desc). Fail-soft []. */
export async function getFollowedClubNames(): Promise<string[]> {
  try {
    const cached = await kv.get<string[]>(KEY);
    if (Array.isArray(cached)) return cached;
  } catch {
    // sin KV: seguimos a la BD
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  try {
    const supa = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    let rows: ProfileRow[] = [];
    const multi = await supa
      .from("profiles")
      .select("fav_clubes,fav_club_name")
      .or("fav_clubes.not.is.null,fav_club_name.not.is.null")
      .limit(3000);
    if (!multi.error) {
      rows = (multi.data ?? []) as ProfileRow[];
    } else {
      // fav_clubes aún sin migrar: solo la columna legacy de club único.
      const legacy = await supa
        .from("profiles")
        .select("fav_club_name")
        .not("fav_club_name", "is", null)
        .limit(3000);
      rows = (legacy.data ?? []) as ProfileRow[];
    }

    const count = new Map<string, number>();
    for (const r of rows) {
      const names = new Set<string>();
      if (Array.isArray(r.fav_clubes)) {
        for (const c of r.fav_clubes) {
          const n = (c as { name?: unknown })?.name;
          if (typeof n === "string" && n.trim()) names.add(n.trim());
        }
      }
      if (typeof r.fav_club_name === "string" && r.fav_club_name.trim()) names.add(r.fav_club_name.trim());
      for (const n of names) count.set(n, (count.get(n) ?? 0) + 1);
    }

    const sorted = [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([n]) => n)
      .slice(0, MAX_TARGETS);
    try {
      await kv.set(KEY, sorted, { ex: TTL_S });
    } catch {
      // caché best-effort
    }
    return sorted;
  } catch {
    return [];
  }
}

/**
 * Queries dirigidas de este tick: rota por la lista según la hora para cubrir
 * todos los clubes a lo largo del día. El término de búsqueda es el "core" de
 * prensa si es seguro ("Carabobo"), o el nombre completo si es ambiguo
 * ("Barcelona SC"). El draft resultante queda TAGGEADO con el nombre completo
 * → match garantizado en el feed personal.
 */
export function clubQueriesForTick(names: string[], hourSeed: number, perTick: number): ExtraQuery[] {
  if (!names.length || perTick <= 0) return [];
  const out: ExtraQuery[] = [];
  const n = Math.min(perTick, names.length);
  for (let i = 0; i < n; i++) {
    const name = names[(hourSeed * perTick + i) % names.length];
    const terms = clubMatchTerms(name);
    const t = terms[terms.length - 1] ?? name; // core si existe; si no, completo
    out.push({ label: `club:${name}`, q: `"${t}" AND fútbol`, tags: [name] });
  }
  return out;
}
