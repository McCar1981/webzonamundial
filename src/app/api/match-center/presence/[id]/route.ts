// src/app/api/match-center/presence/[id]/route.ts
//
// Heartbeat de presencia del "Estadio en Vivo": el cliente lo llama cada ~15s
// (y al reaccionar). Registra al espectador y, si reacted=true, suma al rugido;
// devuelve {viewers, roar}. ANÓNIMO permitido (más volumen para el rugido). Sin
// caché (no-store): es estado en vivo.

import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { heartbeat } from "@/lib/match-center/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// Rate-limit por IP (ventana fija de 1 min). El endpoint es ANÓNIMO, así que
// sin esto se podría inflar el contador/rugido y amplificar el gasto KV. Un
// usuario legítimo late ~3 veces/min; 15 da holgura para reacciones.
const RL_MAX = 15;
function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}
async function rateLimited(ip: string): Promise<boolean> {
  if (!kvEnabled() || !ip) return false;
  try {
    const key = `mc:presence:rl:${ip}:${Math.floor(Date.now() / 60_000)}`;
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, 90);
    return n > RL_MAX;
  } catch {
    return false; // fail-open: no bloquear si KV falla
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const matchId = parseInt(params.id, 10);
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  // Tope de tamaño del cuerpo (anti-DoS): el payload útil son <100 bytes.
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 1024) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (await rateLimited(ip)) {
    return NextResponse.json({ viewers: 0, roar: 0, limited: true }, { status: 429 });
  }

  let body: { anonId?: string; reacted?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* heartbeat sin cuerpo: solo lectura de agregados */
  }
  const agg = await heartbeat(matchId, body.anonId, body.reacted === true);
  return NextResponse.json(agg, { headers: { "Cache-Control": "no-store" } });
}
