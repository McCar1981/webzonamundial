// src/lib/friendlies/teamInfo.ts
//
// Puente entre los datos en vivo de api-football (nombres en INGLÉS: "France",
// "Ivory Coast") y las fichas BIBLIA (es) para los push de amistosos.
//   - esName(): traduce el nombre de la selección al español.
//   - favoritePhoto(): foto que acompaña al partido. Como no disponemos de fotos
//     de enfrentamientos anteriores, usamos la foto del jugador estrella de la
//     selección FAVORITA (mejor ranking FIFA). null si ninguna es resoluble.
// Server-only (lee data/teams via fs). El índice se construye una sola vez.

import { loadTeam, listBibliaSlugs } from "@/lib/biblia";
import type { NationalTeam } from "@/types/team";
import { flagEmoji, isoFromName } from "./flags";

export interface TeamInfo {
  name_es: string;
  iso: string;
  rank: number | null;
  /** Foto del jugador estrella (acción reciente), si se resuelve. */
  photo: string | null;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Foto del jugador estrella de una ficha (busca su entrada en la convocatoria). */
function starPhoto(team: NationalTeam): string | null {
  const wc = team.wc_2026;
  const starName = wc?.star_player?.name;
  if (!starName) return null;
  if (wc.star_player.photo_url) return wc.star_player.photo_url;
  const target = norm(starName);
  const squad = wc.likely_squad ?? [];
  const hit = squad.find((p) => {
    const full = norm(p.full_name || "");
    const disp = norm(p.display_name || "");
    return full === target || disp === target || full.includes(target) || target.includes(disp);
  });
  return hit?.photo_url || null;
}

// Índice multillave (name_en / name_es / name_local / slug) -> info, una sola vez.
let indexPromise: Promise<Map<string, TeamInfo>> | null = null;
async function getIndex(): Promise<Map<string, TeamInfo>> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const map = new Map<string, TeamInfo>();
      const slugs = await listBibliaSlugs();
      for (const slug of slugs) {
        const t = await loadTeam(slug);
        if (!t) continue;
        const info: TeamInfo = {
          name_es: t.name_es,
          iso: t.iso,
          rank: t.fifa_ranking?.current ?? null,
          photo: starPhoto(t),
        };
        for (const key of [t.name_en, t.name_es, t.name_local, slug]) {
          if (key) map.set(norm(key), info);
        }
      }
      return map;
    })();
  }
  return indexPromise;
}

/** Info BIBLIA de una selección a partir de su nombre (en cualquier idioma). */
export async function teamInfo(name: string): Promise<TeamInfo | null> {
  if (!name) return null;
  const idx = await getIndex();
  return idx.get(norm(name)) ?? null;
}

/** Nombre en español de la selección; el original si no hay ficha. */
export async function esName(name: string): Promise<string> {
  const info = await teamInfo(name);
  return info?.name_es ?? name;
}

/**
 * Emoji de la bandera de la selección, para el título del push. ISO de la ficha
 * BIBLIA (las 48 del Mundial); si no hay ficha (rival no clasificado), del mapa
 * por nombre inglés de api-football. "" si no se resuelve.
 */
export async function teamFlagEmoji(name: string): Promise<string> {
  const info = await teamInfo(name);
  const iso = info?.iso || isoFromName(name);
  return flagEmoji(iso);
}

/**
 * Foto que acompaña al partido: la del jugador estrella de la selección de
 * mejor ranking FIFA (la "favorita"). Si solo una selección tiene foto, esa.
 * null si ninguna es resoluble (el llamador usará un respaldo).
 */
export async function favoritePhoto(
  homeName: string,
  awayName: string,
): Promise<string | null> {
  const [h, a] = await Promise.all([teamInfo(homeName), teamInfo(awayName)]);
  const hp = h?.photo ?? null;
  const ap = a?.photo ?? null;
  if (hp && !ap) return hp;
  if (ap && !hp) return ap;
  if (!hp && !ap) return null;
  // Ambas tienen foto: gana la de mejor ranking (número menor).
  const hr = h?.rank ?? Number.POSITIVE_INFINITY;
  const ar = a?.rank ?? Number.POSITIVE_INFINITY;
  return hr <= ar ? hp : ap;
}
