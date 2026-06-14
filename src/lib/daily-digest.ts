// src/lib/daily-digest.ts
//
// Construye el contenido del email diario "Tu día en el Mundial" — partidos del
// día + noticias seleccionadas — para que el cron real (send-daily-digest) y el
// endpoint de prueba (admin/test-digest) compartan EXACTAMENTE la misma lógica.
//
// Frescura de las noticias (lo que pidió Carlos):
//   1. DEDUP: se excluyen los slugs enviados en el último digest (vía KV), así
//      no se repiten los mismos titulares día tras día.
//   2. PRIORIDAD por partido del día: las noticias que tocan a un equipo que
//      juega hoy (match por `flags`/ISO) suben arriba — la previa/crónica del
//      día primero, el resto por recencia. El sort es estable, así que dentro de
//      cada grupo se conserva el orden por fecha desc de getAllPublicNoticias.
//   3. FALLBACK defensivo: si el dedup deja muy pocas, se rellena con las más
//      recientes (aunque se repitan) para no mandar un bloque pelado.

import { MATCHES } from "@/data/matches";
import { etToDate } from "@/lib/bracket/match-time";
import { getAllPublicNoticias } from "@/lib/noticias-store";

/** Clave KV donde el cron guarda los slugs del último envío (para no repetir). */
export const DIGEST_LAST_SENT_KEY = "digest:lastSentSlugs";

export interface DigestFixture {
  home: string;
  homeFlag: string;
  away: string;
  awayFlag: string;
  time: string;
  group?: string;
}

export interface DigestArticle {
  title: string;
  slug: string;
  excerpt: string;
  image?: string | null;
  date: string;
  cat: string;
}

export interface DigestData {
  fixtures: DigestFixture[];
  fixturesAreToday: boolean;
  articles: DigestArticle[];
}

const madridDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
const madridTime = (d: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

export async function buildDigestData(opts?: {
  /** Slugs a excluir (los del último envío) para no repetir titulares. */
  excludeSlugs?: string[];
  /** Inyectable para tests; por defecto el instante actual. */
  now?: Date;
  /** Máximo de noticias en el email. */
  maxArticles?: number;
}): Promise<DigestData> {
  const now = opts?.now ?? new Date();
  const maxArticles = opts?.maxArticles ?? 5;
  const exclude = new Set(opts?.excludeSlugs ?? []);

  // ── Partidos del día — "hoy" en Europe/Madrid por el instante real del saque
  //    (etToDate convierte d+t en ET a un instante absoluto). Fallback: próximos.
  const todayStr = madridDate(now);
  const withDt = MATCHES.map((m) => ({ m, dt: etToDate(m.d, m.t) })).filter(
    (x) => x.dt !== null,
  ) as { m: (typeof MATCHES)[number]; dt: Date }[];
  let fixturesAreToday = true;
  let slate = withDt.filter(
    (x) =>
      madridDate(x.dt) === todayStr &&
      x.dt.getTime() >= now.getTime() - 2 * 60 * 60 * 1000,
  );
  if (slate.length === 0) {
    fixturesAreToday = false;
    const upcoming = withDt
      .filter((x) => x.dt.getTime() >= now.getTime())
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
    const nextDate = upcoming.length ? madridDate(upcoming[0].dt) : null;
    slate = nextDate
      ? upcoming.filter((x) => madridDate(x.dt) === nextDate)
      : [];
  }
  slate.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  const fixtures: DigestFixture[] = slate.slice(0, 8).map((x) => ({
    home: x.m.h,
    homeFlag: x.m.hf,
    away: x.m.a,
    awayFlag: x.m.af,
    time: madridTime(x.dt),
    group: x.m.g,
  }));

  // Banderas (ISO) de los equipos que juegan en el slate elegido.
  const matchFlags = new Set<string>();
  for (const x of slate) {
    matchFlags.add(x.m.hf.toLowerCase());
    matchFlags.add(x.m.af.toLowerCase());
  }

  // ── Selección de noticias: dedup + prioridad por partido del día ──
  const all = await getAllPublicNoticias(); // ya viene ordenado por fecha desc
  const touchesToday = (flags?: string[]) =>
    (flags ?? []).some((f) => matchFlags.has(String(f).toLowerCase()));

  const fresh = all.filter((n) => !exclude.has(n.slug));
  // Sort estable (ES2019+): las del día primero; dentro de cada grupo se conserva
  // el orden por fecha desc que ya trae getAllPublicNoticias.
  const sorted = [...fresh].sort(
    (a, b) => (touchesToday(b.flags) ? 1 : 0) - (touchesToday(a.flags) ? 1 : 0),
  );
  const chosen = sorted.slice(0, maxArticles);

  // Fallback: si el dedup dejó muy pocas y hay noticias, rellena con las más
  // recientes (aunque se repitan) para no enviar un bloque pelado.
  if (chosen.length < Math.min(3, all.length)) {
    const have = new Set(chosen.map((n) => n.slug));
    for (const n of all) {
      if (chosen.length >= maxArticles) break;
      if (!have.has(n.slug)) {
        chosen.push(n);
        have.add(n.slug);
      }
    }
  }

  const articles: DigestArticle[] = chosen.map((n) => ({
    title: n.title,
    slug: n.slug,
    excerpt: n.excerpt,
    image: n.realImage ?? null,
    date: n.date,
    cat: n.cat,
  }));

  return { fixtures, fixturesAreToday, articles };
}
