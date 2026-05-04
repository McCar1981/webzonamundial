import { NextResponse } from "next/server";
import { buildAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: Request) {
  let body: { password?: string; next?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const password = (body.password || "").trim();
  const expected = process.env.ADMIN_PASSWORD || "zm-admin-dev-only";

  if (password !== expected) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const cookie = await buildAdminCookie(24);
  const res = NextResponse.json({ ok: true, next: body.next || "/admin/registros" });
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
