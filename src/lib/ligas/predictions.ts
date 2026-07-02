// src/lib/ligas/predictions.ts
//
// Capa de datos (lado usuario) de las predicciones 1X2 de Zona de Ligas. Usa el
// cliente de servidor AUTENTICADO (respeta RLS: cada quien ve/crea solo lo suyo).
// La resolución y el abono de Fútcoins los hace el cron con service role.
//
// TODO fail-soft: si la migración 2026-42 aún no está aplicada (tabla ausente,
// código Postgres 42P01), las funciones devuelven un estado "not_available" en
// vez de reventar — así este código puede vivir en prod dormido hasta que se
// aplique el SQL, sin romper nada.

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LigaPick = "home" | "draw" | "away";

export function isMissingTable(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: string }).code === "42P01";
}

export type SavePickResult = { ok: boolean; reason?: "exists" | "not_available" | "error" };

export async function savePick(
  userId: string,
  fixtureId: number,
  competitionSlug: string,
  pick: LigaPick,
  kickoffIso: string,
): Promise<SavePickResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("liga_predictions").insert({
    user_id: userId,
    fixture_id: fixtureId,
    competition_slug: competitionSlug,
    pick,
    kickoff: kickoffIso,
  });
  if (!error) return { ok: true };
  if ((error as { code?: string }).code === "23505") return { ok: false, reason: "exists" }; // unique_violation
  if (isMissingTable(error)) return { ok: false, reason: "not_available" };
  console.error("[liga-predictions] savePick failed:", error.message);
  return { ok: false, reason: "error" };
}

export async function getUserPick(userId: string, fixtureId: number): Promise<LigaPick | null> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("liga_predictions")
    .select("pick")
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId)
    .maybeSingle();
  if (error) return null; // incluye tabla ausente: la UI cae a la encuesta anónima
  return (data as { pick?: LigaPick } | null)?.pick ?? null;
}
