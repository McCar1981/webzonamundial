import { NextRequest, NextResponse } from "next/server";
import { listRegistros, getRealCount } from "@/lib/registros-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Admin export endpoint — full registros dump.

  Auth: requires `ADMIN_TOKEN` env var. Send via either:
    - Header:  Authorization: Bearer <token>
    - Query:   /api/admin/registros?token=<token>     (use only over HTTPS)

  Output formats:
    - JSON (default):  /api/admin/registros
    - CSV:             /api/admin/registros?format=csv

  Returns 503 if ADMIN_TOKEN is not configured (refuses to serve unprotected).
*/

function checkAuth(request: NextRequest): { ok: boolean; reason?: string } {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return { ok: false, reason: "not_configured" };
  }

  const auth = request.headers.get("authorization") || "";
  const headerToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const queryToken = request.nextUrl.searchParams.get("token") || "";
  const provided = headerToken || queryToken;

  if (!provided || provided !== token) {
    return { ok: false, reason: "unauthorized" };
  }
  return { ok: true };
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const auth = checkAuth(request);
  if (!auth.ok) {
    if (auth.reason === "not_configured") {
      return NextResponse.json(
        { error: "ADMIN_TOKEN no configurado en el servidor" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format")?.toLowerCase();
  const records = await listRegistros();
  const realCount = await getRealCount();

  if (format === "csv") {
    const header = ["id", "email", "nombre", "creador", "kind", "fecha", "ip"];
    const lines = [header.join(",")];
    for (const r of records) {
      lines.push(
        [r.id, r.email, r.nombre, r.creador, r.kind, r.fecha, r.ip]
          .map(csvEscape)
          .join(",")
      );
    }
    const csv = lines.join("\n");
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registros-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      realCount,
      total: records.length,
      records,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
