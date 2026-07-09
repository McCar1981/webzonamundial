// src/lib/ligas/mis-ligas.ts
//
// "Mis ligas": las ligas favoritas del usuario (migración 2026-46, columna
// profiles.fav_ligas jsonb = array de slugs del catálogo). Mismo patrón que
// mi-club: cliente autenticado (RLS de fila propia) y fail-soft si la columna
// aún no existe (42703).

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCompetition } from "@/data/competitions";
import { isMissingTable, isMissingColumn } from "./predictions";

const MAX_LIGAS = 8; // suficiente para un fan multi-liga; evita "seleccionar todo"

export async function getMisLigas(userId: string): Promise<string[]> {
  const supa = createSupabaseServerClient();

  // SEMILLA: si el usuario aún no eligió ligas pero SÍ tiene club ("Mi Club",
  // migración 2026-45), la liga de su club cuenta como su liga elegida — no se
  // le pregunta dos veces por lo mismo. fav_ligas explícito (2026-46) manda.
  const { data, error } = await supa
    .from("profiles")
    .select("fav_ligas,fav_liga_slug")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (!isMissingColumn(error)) return [];
    // 2026-46 sin aplicar: probamos solo con la liga del club (2026-45).
    const legacy = await supa.from("profiles").select("fav_liga_slug").eq("id", userId).maybeSingle();
    const slug = (legacy.data as { fav_liga_slug?: string | null } | null)?.fav_liga_slug;
    return slug && getCompetition(slug) ? [slug] : [];
  }
  if (!data) return [];

  const row = data as { fav_ligas: unknown; fav_liga_slug: string | null };
  const explicit = Array.isArray(row.fav_ligas)
    ? row.fav_ligas.filter((s): s is string => typeof s === "string" && !!getCompetition(s)).slice(0, MAX_LIGAS)
    : [];
  if (explicit.length) return explicit;
  return row.fav_liga_slug && getCompetition(row.fav_liga_slug) ? [row.fav_liga_slug] : [];
}

export type SetMisLigasResult = { ok: boolean; reason?: "not_available" | "error" };

export async function setMisLigas(userId: string, slugs: string[]): Promise<SetMisLigasResult> {
  // Server-side: solo slugs reales del catálogo, sin duplicados, con tope.
  const clean = [...new Set(slugs.filter((s) => typeof s === "string" && !!getCompetition(s)))].slice(0, MAX_LIGAS);
  const supa = createSupabaseServerClient();
  const { error } = await supa
    .from("profiles")
    .update({ fav_ligas: clean.length ? clean : null })
    .eq("id", userId);
  if (!error) return { ok: true };
  if (isMissingTable(error) || isMissingColumn(error)) return { ok: false, reason: "not_available" };
  console.error("[mis-ligas] set failed:", error.message);
  return { ok: false, reason: "error" };
}
