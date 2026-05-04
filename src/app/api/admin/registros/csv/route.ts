/**
 * CSV export of registros for the admin dashboard.
 *
 * Auth: middleware already enforces /admin/* cookie. We re-verify here as
 * defense-in-depth (someone might hit /api/admin/* without going through
 * /admin/registros first).
 */

import { NextResponse } from "next/server";
import { isValidAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { buildCsv } from "@/lib/registros-seed";

export async function GET(req: Request) {
  const cookie = parseCookie(req.headers.get("cookie") || "")[ADMIN_COOKIE_NAME];
  if (!cookie || !(await isValidAdminCookie(cookie))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const csv = await buildCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zonamundial-registros-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function parseCookie(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  s.split(";").forEach((pair) => {
    const [k, ...rest] = pair.trim().split("=");
    if (k) out[k] = rest.join("=");
  });
  return out;
}

export const dynamic = "force-dynamic";
