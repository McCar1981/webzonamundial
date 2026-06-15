import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getPublicCodeInfo } from "@/lib/signup-codes/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validación PÚBLICA de un código de captación. Devuelve solo datos no
// sensibles (si es válido y cuántas Fútcoins de bienvenida da) para que el
// formulario de /registro-codigo enseñe el bono antes de registrarse.
// NO expone el dueño del código ni los importes que recibe.

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

const RATE_WINDOW_S = 60;
const RATE_MAX = 30; // 30 comprobaciones/min por IP — sobra para teclear.

async function rateOk(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return true;
  try {
    const key = `codigo:validar:rate:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, RATE_WINDOW_S);
    return count <= RATE_MAX;
  } catch {
    return true; // read-only y solo expone datos públicos: fail-open.
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  if (!(await rateOk(getClientIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const info = await getPublicCodeInfo(code);
  return NextResponse.json({
    valid: info.valid,
    code: info.code,
    label: info.label,
    rewardNewUser: info.rewardNewUser,
  });
}
