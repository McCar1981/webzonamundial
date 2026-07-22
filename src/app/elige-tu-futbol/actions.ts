"use server";

// Guarda las preferencias de fútbol del gate: ligas favoritas (fav_ligas,
// 2026-46) + club favorito (fav_club_*, 2026-45), en los setters ya existentes
// (server-authoritative: validan contra el catálogo y aplican RLS de fila
// propia). Devuelve un resultado para que el cliente muestre errores; la
// navegación a /app la hace el cliente tras el ok.

import { getCurrentUser } from "@/lib/auth-helpers";
import { setMisLigas } from "@/lib/ligas/mis-ligas";
import { addMiClub } from "@/lib/ligas/mi-club";
import { getCompetition } from "@/data/competitions";

export interface SaveClubInput {
  ligaSlug: string | null;
  clubId: number;
  clubName: string;
  clubLogo: string | null;
}
export interface SavePrefsResult {
  ok: boolean;
  error?: string;
}

export async function saveFootballPrefsAction(input: {
  ligas: string[];
  club: SaveClubInput | null;
}): Promise<SavePrefsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado" };

  // Solo slugs reales del catálogo (el setter lo re-valida igualmente).
  const ligas = Array.isArray(input.ligas)
    ? input.ligas.filter((s) => typeof s === "string" && !!getCompetition(s))
    : [];
  if (ligas.length === 0) return { ok: false, error: "Elige al menos una liga." };

  const club = input.club;
  if (!club || !Number.isInteger(club.clubId) || club.clubId <= 0 || !club.clubName?.trim()) {
    return { ok: false, error: "Elige tu club." };
  }

  const ligasRes = await setMisLigas(user.id, ligas);
  if (!ligasRes.ok) {
    return {
      ok: false,
      error:
        ligasRes.reason === "not_available"
          ? "Las preferencias aún no están disponibles. Inténtalo más tarde."
          : "No pudimos guardar tus ligas. Inténtalo de nuevo.",
    };
  }

  const clubRes = await addMiClub(user.id, {
    // El club conserva su liga de origen solo si es un slug válido del catálogo.
    ligaSlug: club.ligaSlug && getCompetition(club.ligaSlug) ? club.ligaSlug : null,
    clubId: club.clubId,
    clubName: club.clubName.trim().slice(0, 80),
    clubLogo: club.clubLogo || null,
  });
  if (!clubRes.ok) {
    return {
      ok: false,
      error:
        clubRes.reason === "not_available"
          ? "Las preferencias aún no están disponibles. Inténtalo más tarde."
          : "No pudimos guardar tu club. Inténtalo de nuevo.",
    };
  }

  return { ok: true };
}
