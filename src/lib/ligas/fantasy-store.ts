// src/lib/ligas/fantasy-store.ts
//
// Lado usuario del Fantasy de Zona de Ligas: guardar/leer TU once de la jornada.
// Cliente de servidor AUTENTICADO (RLS: cada quien ve/crea solo lo suyo). La
// puntuación y el abono los hace el cron con service role.
//
// Fail-soft: si la migración 2026-43 aún no está aplicada (tabla ausente, 42P01),
// devuelve "not_available" en vez de reventar.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Position } from "./fantasy";

export interface SquadPick {
  id: number;
  pos: Position;
  teamId: number;
  name: string;
}

export interface UserFantasyPick {
  players: SquadPick[];
  captainId: number | null;
}

export type SaveFantasyResult = { ok: boolean; reason?: "exists" | "not_available" | "error" };

export async function saveFantasyPick(
  userId: string,
  competitionSlug: string,
  round: string,
  players: SquadPick[],
  captainId: number | null,
): Promise<SaveFantasyResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("liga_fantasy_picks").insert({
    user_id: userId,
    competition_slug: competitionSlug,
    round,
    players,
    captain_id: captainId,
  });
  if (!error) return { ok: true };
  const code = (error as { code?: string }).code;
  if (code === "23505") return { ok: false, reason: "exists" }; // ya tiene once esta jornada
  if (code === "42P01") return { ok: false, reason: "not_available" };
  console.error("[liga-fantasy] savePick failed:", error.message);
  return { ok: false, reason: "error" };
}

export async function getUserFantasyPick(
  userId: string,
  competitionSlug: string,
  round: string,
): Promise<UserFantasyPick | null> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("liga_fantasy_picks")
    .select("players,captain_id")
    .eq("user_id", userId)
    .eq("competition_slug", competitionSlug)
    .eq("round", round)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { players?: SquadPick[]; captain_id?: number | null };
  return { players: row.players ?? [], captainId: row.captain_id ?? null };
}
