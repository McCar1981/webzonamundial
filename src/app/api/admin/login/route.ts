import { NextResponse } from "next/server";
import { buildAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  let body: { password?: string; next?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const password = (body.password || "").trim();

  // H-001-04: fail-closed. Comparación en tiempo constante vía timingSafeEqual.
  let match = false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    match = a.length === b.length && require("crypto").timingSafeEqual(a, b);
  } catch {
    match = false;
  }
  if (!match) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const cookie = await buildAdminCookie(24);
  if (!cookie) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }
  const res = NextResponse.json({ ok: true, next: body.next || "/admin/panel" });
  res.cookies.set(ADMIN_COOKIE_NAME, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}

export const dynamic = "force-dynamic";
