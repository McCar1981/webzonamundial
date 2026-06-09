// GET/POST /api/stories/admin/purge
//
// PURGA TOTAL del feed de Stories + DIAGNÓSTICO.
//
// Regla de Carlos: el feed solo debe contener contenido REAL y contrastado.
// Cualquier fila vieja de prueba/seed/motor que haya quedado en la tabla
// `public.stories` debe poder borrarse de un tirón. Este endpoint:
//   1. Cuenta lo que hay AHORA, desglosado por type y por origen
//      (seed / auto-motor / manual), para saber exactamente qué había.
//   2. Borra TODO de `public.stories` (cascada a story_views por la FK).
//   3. Vuelve a contar para confirmar que quedó en 0.
//
// Es idempotente: si ya está vacío, no rompe; responde counts en 0.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET} o
// ?secret=XXX. En producción CRON_SECRET SIEMPRE está, así que queda protegido.

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/predictions/admin";
import { hasServiceRole } from "@/lib/stories/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // local sin secret
  const auth = req.headers.get("authorization");
  const headerOk = auth === `Bearer ${expected}`;
  const queryOk = new URL(req.url).searchParams.get("secret") === expected;
  return headerOk || queryOk;
}

type Diag = {
  total: number;
  byType: Record<string, number>;
  bySeed: number;
  byAuto: number;
  byManual: number;
};

// Lee filas ligeras (id, type, template_data) y arma el desglose.
async function diagnose(db: ReturnType<typeof adminClient>): Promise<Diag> {
  const { data, error } = await db
    .from("stories")
    .select("id, type, template_data");
  if (error) throw new Error(`diagnose failed: ${error.message}`);
  const rows = (data ?? []) as Array<{ id: string; type: string; template_data: unknown }>;
  const byType: Record<string, number> = {};
  let bySeed = 0;
  let byAuto = 0;
  let byManual = 0;
  for (const r of rows) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
    const td = (r.template_data ?? {}) as Record<string, unknown>;
    if (td.seed === true || td.seed === "true") bySeed += 1;
    else if (td.auto === true || td.auto === "true") byAuto += 1;
    else byManual += 1;
  }
  return { total: rows.length, byType, bySeed, byAuto, byManual };
}

async function run() {
  // En producción (Vercel con service role) manda Supabase. En local sin key
  // no hay DB que purgar: el feed local es demo en memoria.
  if (!hasServiceRole()) {
    return {
      ok: false,
      mode: "demo",
      message:
        "Sin SUPABASE_SERVICE_ROLE_KEY: entorno local en modo demo. No hay tabla real que purgar; el feed local es en memoria.",
    };
  }

  const db = adminClient();

  // 1) Foto ANTES.
  const before = await diagnose(db);

  // 2) Borrado total. `neq id imposible` = match todas las filas sin un WHERE
  //    que el cliente rechace por seguridad.
  const { error: delErr } = await db
    .from("stories")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) {
    return { ok: false, mode: "live", before, error: delErr.message };
  }

  // 3) Foto DESPUÉS (debe ser 0).
  const after = await diagnose(db);

  return {
    ok: true,
    mode: "live",
    deleted: before.total - after.total,
    before,
    after,
  };
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}
