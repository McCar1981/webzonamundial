// src/lib/ligas/mi-club.ts
//
// "Mi club": la liga y el club favoritos del usuario (migración 2026-45). Lado
// usuario con el cliente AUTENTICADO (RLS de fila propia, mismo patrón que el
// onboarding). Fail-soft: si las columnas aún no existen (42703) devuelve
// null/not_available sin romper nada.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingTable, isMissingColumn } from "./predictions";

export interface MiClub {
  ligaSlug: string | null;
  clubId: number;
  clubName: string;
  clubLogo: string | null;
}

export async function getMiClub(userId: string): Promise<MiClub | null> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("profiles")
    .select("fav_liga_slug,fav_club_id,fav_club_name,fav_club_logo")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null; // incluye columnas ausentes
  const row = data as { fav_liga_slug: string | null; fav_club_id: number | null; fav_club_name: string | null; fav_club_logo: string | null };
  if (!row.fav_club_id || !row.fav_club_name) return null;
  return {
    ligaSlug: row.fav_liga_slug ?? null,
    clubId: row.fav_club_id,
    clubName: row.fav_club_name,
    clubLogo: row.fav_club_logo ?? null,
  };
}

export type SetMiClubResult = { ok: boolean; reason?: "not_available" | "error" };

export async function setMiClub(
  userId: string,
  club: { ligaSlug: string | null; clubId: number; clubName: string; clubLogo: string | null },
): Promise<SetMiClubResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa
    .from("profiles")
    .update({
      fav_liga_slug: club.ligaSlug,
      fav_club_id: club.clubId,
      fav_club_name: club.clubName,
      fav_club_logo: club.clubLogo,
    })
    .eq("id", userId);
  if (!error) return { ok: true };
  if (isMissingTable(error) || isMissingColumn(error)) return { ok: false, reason: "not_available" };
  console.error("[mi-club] set failed:", error.message);
  return { ok: false, reason: "error" };
}

export async function clearMiClub(userId: string): Promise<SetMiClubResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa
    .from("profiles")
    .update({ fav_liga_slug: null, fav_club_id: null, fav_club_name: null, fav_club_logo: null })
    .eq("id", userId);
  if (!error) return { ok: true };
  if (isMissingTable(error) || isMissingColumn(error)) return { ok: false, reason: "not_available" };
  return { ok: false, reason: "error" };
}
