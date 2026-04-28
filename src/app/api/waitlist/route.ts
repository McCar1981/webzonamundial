import { NextRequest, NextResponse } from "next/server";
import { addRegistro, getCount } from "@/lib/registros-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
  Waitlist endpoint — lightweight email-only signup.

  - GET  /api/waitlist  -> { count: number }
  - POST /api/waitlist  -> { ok: true, count, alreadyRegistered }
                         | { ok: false, error }

  Backed by the unified registros-store (Vercel KV in prod, fs in dev).
  Shares the email pool with /api/registro, so the count is consistent
  across both flows.
*/

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET() {
  const count = await getCount();
  return NextResponse.json({ count });
}

export async function POST(req: NextRequest) {
  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email requerido" },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Email inválido" },
      { status: 400 }
    );
  }

  const result = await addRegistro({
    email,
    ip: getClientIp(req),
    kind: "waitlist",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyRegistered: result.alreadyRegistered,
    count: result.total,
  });
}
