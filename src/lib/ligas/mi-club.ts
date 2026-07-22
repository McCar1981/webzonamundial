// src/lib/ligas/mi-club.ts
//
// Clubes favoritos del usuario en Zona de Ligas. Antes era UNO solo; ahora son
// VARIOS (migración 2026-53: array jsonb `fav_clubes`). Igual que ya se siguen
// varias ligas. Lado usuario con el cliente AUTENTICADO (RLS de fila propia).
//
// Compatibilidad: se mantienen las columnas singulares fav_club_* como "club
// primario" (= el primero del array), así el gate y cualquier lectura antigua
// siguen funcionando. Fail-soft: si `fav_clubes` aún no existe (42703) se lee el
// club único legacy; si no existe ninguna columna, devuelve vacío/not_available.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingTable, isMissingColumn } from "./predictions";

export interface MiClub {
  ligaSlug: string | null;
  clubId: number;
  clubName: string;
  clubLogo: string | null;
}

type ClubJson = { id: number; name: string; logo: string | null; slug: string | null };

export const MAX_CLUBES = 8;

function toMiClub(c: ClubJson): MiClub {
  return { ligaSlug: c.slug ?? null, clubId: c.id, clubName: c.name, clubLogo: c.logo ?? null };
}
function toJson(c: MiClub): ClubJson {
  return { id: c.clubId, name: c.clubName, logo: c.clubLogo ?? null, slug: c.ligaSlug ?? null };
}

type LegacyRow = { fav_liga_slug: string | null; fav_club_id: number | null; fav_club_name: string | null; fav_club_logo: string | null };

function legacyClub(row: LegacyRow): MiClub[] {
  return row.fav_club_id && row.fav_club_name
    ? [{ ligaSlug: row.fav_liga_slug ?? null, clubId: row.fav_club_id, clubName: row.fav_club_name, clubLogo: row.fav_club_logo ?? null }]
    : [];
}

/** Todos los clubes seguidos por el usuario (vacío si ninguno o sin columnas). */
export async function getMisClubes(userId: string): Promise<MiClub[]> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("profiles")
    .select("fav_liga_slug,fav_club_id,fav_club_name,fav_club_logo,fav_clubes")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // fav_clubes aún no existe (migración 2026-53 sin aplicar): leer club único.
    if (isMissingColumn(error)) {
      const legacy = await supa
        .from("profiles")
        .select("fav_liga_slug,fav_club_id,fav_club_name,fav_club_logo")
        .eq("id", userId)
        .maybeSingle();
      return legacy.data ? legacyClub(legacy.data as LegacyRow) : [];
    }
    return [];
  }
  if (!data) return [];

  const row = data as LegacyRow & { fav_clubes: ClubJson[] | null };
  const arr = Array.isArray(row.fav_clubes) ? row.fav_clubes : null;
  if (arr && arr.length) {
    return arr.filter((c) => c && typeof c.id === "number" && c.id > 0 && !!c.name).map(toMiClub);
  }
  return legacyClub(row); // sin backfill todavía: el club único, si lo hay
}

/** El club primario (el primero) — compat con lecturas de un solo club. */
export async function getMiClub(userId: string): Promise<MiClub | null> {
  const clubs = await getMisClubes(userId);
  return clubs[0] ?? null;
}

export type SetMiClubResult = { ok: boolean; reason?: "not_available" | "error" };

async function writeClubes(userId: string, clubs: MiClub[]): Promise<SetMiClubResult> {
  const supa = createSupabaseServerClient();
  const primary = clubs[0] ?? null;
  // El primario también va a las columnas singulares (gate / lecturas legacy).
  const singular = {
    fav_liga_slug: primary?.ligaSlug ?? null,
    fav_club_id: primary?.clubId ?? null,
    fav_club_name: primary?.clubName ?? null,
    fav_club_logo: primary?.clubLogo ?? null,
  };
  const { error } = await supa
    .from("profiles")
    .update({ fav_clubes: clubs.map(toJson), ...singular })
    .eq("id", userId);
  if (!error) return { ok: true };

  // SEGURIDAD DE DESPLIEGUE: si `fav_clubes` aún no existe (migración 2026-53 sin
  // aplicar), NO rompemos — degradamos a club ÚNICO escribiendo solo las columnas
  // singulares (el club primario). Así el gate y "añadir club" siguen funcionando
  // (como antes, un club) hasta que se aplique la migración; luego pasa a multi.
  if (isMissingColumn(error)) {
    const legacy = await supa.from("profiles").update(singular).eq("id", userId);
    if (!legacy.error) return { ok: true };
    if (isMissingTable(legacy.error) || isMissingColumn(legacy.error)) return { ok: false, reason: "not_available" };
    console.error("[mi-club] legacy write failed:", legacy.error.message);
    return { ok: false, reason: "error" };
  }
  if (isMissingTable(error)) return { ok: false, reason: "not_available" };
  console.error("[mi-club] write failed:", error.message);
  return { ok: false, reason: "error" };
}

/** Añade un club a la lista (dedupe por id, tope MAX_CLUBES). Idempotente. */
export async function addMiClub(
  userId: string,
  club: { ligaSlug: string | null; clubId: number; clubName: string; clubLogo: string | null },
): Promise<SetMiClubResult> {
  const current = await getMisClubes(userId);
  if (current.some((c) => c.clubId === club.clubId)) return { ok: true }; // ya seguido
  if (current.length >= MAX_CLUBES) return { ok: false, reason: "error" };
  return writeClubes(userId, [...current, club]);
}

/** Fija la lista COMPLETA de clubes (dedupe por id, tope MAX_CLUBES). Para el
 *  onboarding (guardar de una vez la selección del wizard). */
export async function setMisClubes(userId: string, clubs: MiClub[]): Promise<SetMiClubResult> {
  const seen = new Set<number>();
  const clean: MiClub[] = [];
  for (const c of clubs) {
    if (c.clubId > 0 && !!c.clubName && !seen.has(c.clubId)) {
      seen.add(c.clubId);
      clean.push(c);
      if (clean.length >= MAX_CLUBES) break;
    }
  }
  return writeClubes(userId, clean);
}

/** Quita un club de la lista por id. */
export async function removeMiClub(userId: string, clubId: number): Promise<SetMiClubResult> {
  const current = await getMisClubes(userId);
  const next = current.filter((c) => c.clubId !== clubId);
  if (next.length === current.length) return { ok: true }; // no estaba
  return writeClubes(userId, next);
}

/** Vacía TODOS los clubes. */
export async function clearMiClub(userId: string): Promise<SetMiClubResult> {
  return writeClubes(userId, []);
}
