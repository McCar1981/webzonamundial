// src/app/api/predictions/pulse/route.ts
//
// GET /api/predictions/pulse → pulso de actividad de la comunidad para la banda
// "En directo": partido más jugado (con nombres de selecciones), predicciones
// cambiadas hoy y predicciones creadas hoy. Solo lectura, no requiere auth.

import { NextResponse } from "next/server";
import { getActivityPulse } from "@/lib/predictions/store";
import { getMatchMeta } from "@/lib/predictions/match-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pulse = await getActivityPulse();

  let most_played: {
    match_id: string;
    count: number;
    home_team: string;
    away_team: string;
    home_flag: string;
    away_flag: string;
  } | null = null;

  if (pulse.most_played) {
    const meta = getMatchMeta(pulse.most_played.match_id);
    if (meta) {
      most_played = {
        match_id: meta.match_id,
        count: pulse.most_played.count,
        home_team: meta.home_team,
        away_team: meta.away_team,
        home_flag: meta.home_flag,
        away_flag: meta.away_flag,
      };
    }
  }

  return NextResponse.json({
    most_played,
    changed_today: pulse.changed_today,
    predictions_today: pulse.predictions_today,
    updated_at: new Date().toISOString(),
  });
}
