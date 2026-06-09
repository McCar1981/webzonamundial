// src/app/api/modo-carrera/narrativa/route.ts
//
// POST /api/modo-carrera/narrativa → genera una entrada de narrativa (briefing,
// titular o rueda de prensa) a partir del contexto del DT que envía el cliente.
//
// No requiere sesión: la entrada se devuelve y el CLIENTE la añade a su
// CareerState (que se autoguarda en localStorage y, si hay sesión, en Supabase).
// Así funciona igual para invitados y usuarios logueados. Si no hay API key o la
// IA falla, el generador devuelve una versión por plantilla (nunca rompe).

import { NextResponse } from "next/server";
import { generateNarrative } from "@/lib/modo-carrera/narrative-generator";
import { templateEntry, type NarrativeContext } from "@/lib/modo-carrera/narrative";
import type { NarrativeKind } from "@/lib/modo-carrera/types";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isPaseDT } from "@/lib/pasedt/entitlement";
import { consumeNarrativeQuota } from "@/lib/modo-carrera/narrative-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const VALID_KINDS: NarrativeKind[] = ["briefing", "titular", "rueda_prensa", "evento"];

interface Body {
  kind?: NarrativeKind;
  context?: Partial<NarrativeContext>;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : fallback;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind;
  if (!kind || !VALID_KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }

  const ctx: NarrativeContext = {
    dtName: str(body.context?.dtName, "El nuevo DT"),
    philosophyName: str(body.context?.philosophyName, "su estilo"),
    nationName: str(body.context?.nationName, "su selección"),
    overall: num(body.context?.overall, 50),
    season: num(body.context?.season, 1),
    morale: num(body.context?.morale, 70),
    reputationTotal: num(body.context?.reputationTotal, 0),
  };

  // Cuota por COSTE marginal (tokens). Pase DT = ilimitada; usuario gratis y
  // invitado tienen cupo diario. Al agotarlo se sirve la versión por plantilla
  // (sin tokens): el DT nunca se queda sin contenido, solo sin IA.
  const user = await getCurrentUser();
  const paseDT = user?.email ? await isPaseDT(user.email, user.id) : false;
  const quota = await consumeNarrativeQuota({ userId: user?.id ?? null, paseDT });

  const entry = quota.allowed ? await generateNarrative(kind, ctx) : templateEntry(kind, ctx);
  return NextResponse.json(
    {
      ok: true,
      entry,
      ai: quota.allowed,
      exceeded: quota.exceeded,
      remaining: quota.remaining,
      paseDT,
      generatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
