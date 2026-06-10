// GET /api/stories/[id]/results?widget_id=<id>
//
// Resultados agregados de un widget (encuesta/micro-reto): conteo por opción.
// Lo usa el visor para pintar los % cuando el usuario YA había votado antes
// (al votar en caliente, los resultados llegan en la respuesta de /interact).
// Datos agregados y anónimos: no expone quién votó qué.

import { NextResponse } from "next/server";
import { widgetResults } from "@/lib/stories/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const widgetId = new URL(req.url).searchParams.get("widget_id");
  if (!widgetId) {
    return NextResponse.json({ error: "missing_widget_id" }, { status: 400 });
  }
  const results = await widgetResults(params.id, widgetId);
  return NextResponse.json({ ok: true, results });
}
