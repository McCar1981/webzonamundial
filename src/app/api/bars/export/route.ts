// src/app/api/bars/export/route.ts
//
// GET /api/bars/export → CSV del ranking de la porra del bar del usuario.
//                        Gating por plan.exportParticipants (premium).
//                        Exporta clasificación (posición, nombre, puntos),
//                        NO correos ni datos personales sensibles.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBarByOwner, barLeaderboard } from "@/lib/bars/store";
import { getPlan } from "@/lib/bars/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bar = await getBarByOwner(user.id);
  if (!bar) return NextResponse.json({ error: "bar_not_found" }, { status: 404 });

  const plan = getPlan(bar.plan_id);
  if (!plan.exportParticipants) {
    return NextResponse.json(
      { error: "plan_limit", message: "Exportar participantes está disponible en el plan Mundial Completo o superior." },
      { status: 403 }
    );
  }

  const rows = await barLeaderboard(bar);
  const header = ["Posicion", "Participante", "Puntos totales", "Puntos prediccion", "Puntos bracket"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push([r.position, r.display_name, r.points, r.match_points, r.bracket_points].map(csvCell).join(","));
  }
  // BOM para que Excel reconozca UTF-8 (acentos en nombres).
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";

  const date = new Date().toISOString().slice(0, 10);
  const filename = `ranking-${bar.slug}-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
