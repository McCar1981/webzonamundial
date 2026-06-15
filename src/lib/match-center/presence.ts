// src/lib/match-center/presence.ts
//
// "ESTADIO EN VIVO": presencia colectiva por partido, todo sobre Vercel KV con
// disciplina de coste (Upstash es sensible):
//   - ESPECTADORES AHORA: set de anonId con TTL corto (ventana deslizante). El
//     heartbeat hace sadd+expire; el conteo es scard. El TTL (45s) acota el set
//     a los concurrentes recientes, así que no crece sin límite.
//   - RUGIDO: contadores por CUBO de 5s (incr+expire 20s). El nivel es la suma
//     de los últimos cubos. Las reacciones individuales NO se persisten una a
//     una (se animan en cliente); solo cuenta el VOLUMEN agregado → barato.
//   - Anti-spam: cooldown por anonId (SET NX EX 1s) antes de contar una reacción.
//
// Pensado para un único endpoint POST que hace heartbeat y DEVUELVE los
// agregados en la misma llamada (1 round-trip por viewer cada ~15s).

import { kv } from "@/lib/kv";

const VIEWERS_TTL = 60; // > 2x el intervalo de heartbeat del cliente (~22s)
const ROAR_BUCKET_MS = 5_000;
const ROAR_WINDOW_BUCKETS = 3; // ~15s de rugido reciente
const ROAR_TTL = 20;
const ROAR_CAP = 60; // reacciones/~15s que saturan el medidor (rugido = 1.0)

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

const viewersKey = (id: number) => `mc:viewers:${id}`;
const roarKey = (id: number, bucket: number) => `mc:roar:${id}:${bucket}`;
const cooldownKey = (anonId: string) => `mc:rxcd:${anonId}`;

/** anonId del cliente: "anon-..." o un id de usuario. Validación laxa. */
function safeId(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).slice(0, 64);
  return /^[a-zA-Z0-9_-]{6,64}$/.test(s) ? s : null;
}

export interface PresenceAgg {
  viewers: number;
  /** 0..1, intensidad del rugido reciente. */
  roar: number;
}

async function readAggregates(matchId: number): Promise<PresenceAgg> {
  if (!kvEnabled()) return { viewers: 0, roar: 0 };
  const now = Date.now();
  const curBucket = Math.floor(now / ROAR_BUCKET_MS);
  const buckets = Array.from({ length: ROAR_WINDOW_BUCKETS }, (_, i) => curBucket - i);
  try {
    // 2 comandos (scard + 1 MGET de todos los cubos) en vez de 1+N gets.
    const [viewers, counts] = await Promise.all([
      kv.scard(viewersKey(matchId)),
      kv.mget<(number | null)[]>(...buckets.map((b) => roarKey(matchId, b))),
    ]);
    const total = (counts ?? []).reduce((s, c) => s + (Number(c) || 0), 0);
    return {
      viewers: Number(viewers) || 0,
      roar: Math.max(0, Math.min(1, total / ROAR_CAP)),
    };
  } catch {
    return { viewers: 0, roar: 0 };
  }
}

/** Heartbeat de un espectador (+ reacción opcional). Devuelve los agregados. */
export async function heartbeat(
  matchId: number,
  anonRaw: string | undefined,
  reacted: boolean,
): Promise<PresenceAgg> {
  if (!kvEnabled()) return { viewers: 0, roar: 0 };
  const anon = safeId(anonRaw);
  if (anon) {
    try {
      await kv.sadd(viewersKey(matchId), anon);
      await kv.expire(viewersKey(matchId), VIEWERS_TTL);
    } catch {
      /* no crítico */
    }
    if (reacted) {
      try {
        // Cooldown: cuenta como mucho 1 reacción por segundo y persona.
        const ok = await kv.set(cooldownKey(anon), 1, { nx: true, ex: 1 });
        if (ok === "OK") {
          const bucket = Math.floor(Date.now() / ROAR_BUCKET_MS);
          await kv.incr(roarKey(matchId, bucket));
          await kv.expire(roarKey(matchId, bucket), ROAR_TTL);
        }
      } catch {
        /* no crítico */
      }
    }
  }
  return readAggregates(matchId);
}
