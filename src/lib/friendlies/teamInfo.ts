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
import type { NationalTeam, Player } from "@/types/team";
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

// Índice nombre de selección (cualquier idioma) -> convocatoria, una sola vez.
// Permite resolver la foto del jugador concreto de un evento (goleador/expulsado).
let squadIndexPromise: Promise<Map<string, Player[]>> | null = null;
async function getSquadIndex(): Promise<Map<string, Player[]>> {
  if (!squadIndexPromise) {
    squadIndexPromise = (async () => {
      const map = new Map<string, Player[]>();
      const slugs = await listBibliaSlugs();
      for (const slug of slugs) {
        const t = await loadTeam(slug);
        if (!t) continue;
        const squad = t.wc_2026?.likely_squad ?? [];
        for (const key of [t.name_en, t.name_es, t.name_local, slug]) {
          if (key) map.set(norm(key), squad);
        }
      }
      return map;
    })();
  }
  return squadIndexPromise;
}

/**
 * Foto del jugador concreto de un evento, cruzando el nombre que da api-football
 * (p.ej. "D. Lukebakio") con la convocatoria BIBLIA (p.ej. "Dodi Lukebakio").
 * Conservador: si hay ambigüedad o no hay foto, devuelve null (el llamador usará
 * la foto del partido como respaldo). Así evitamos mostrar a OTRO jugador.
 */
export async function playerPhoto(
  teamName: string,
  playerName: string,
): Promise<string | null> {
  if (!teamName || !playerName) return null;
  const idx = await getSquadIndex();
  const squad = idx.get(norm(teamName));
  if (!squad || squad.length === 0) return null;

  const q = norm(playerName);
  const qTokens = q.split(/\s+/).filter(Boolean);
  if (qTokens.length === 0) return null;
  const qSurname = qTokens[qTokens.length - 1];
  const qFirst = qTokens[0].replace(/\./g, "");
  const qIsInitial = qFirst.length <= 1;

  const lastToken = (s: string): string => {
    const t = norm(s).split(/\s+/).filter(Boolean);
    return t[t.length - 1] ?? "";
  };
  const firstToken = (s: string): string =>
    norm(s).split(/\s+/).filter(Boolean)[0] ?? "";

  // 1) Coincidencia exacta de nombre completo o display.
  for (const p of squad) {
    if (norm(p.full_name || "") === q || norm(p.display_name || "") === q) {
      return p.photo_url || null;
    }
  }

  // 2) Por apellido (último token). Si solo uno coincide, ese.
  const bySurname = squad.filter(
    (p) => lastToken(p.full_name || "") === qSurname || lastToken(p.display_name || "") === qSurname,
  );
  if (bySurname.length === 1) return bySurname[0].photo_url || null;

  // 3) Varios con el mismo apellido: desambiguar por nombre/inicial.
  if (bySurname.length > 1) {
    const refined = bySurname.filter((p) => {
      const f = firstToken(p.full_name || "");
      return qIsInitial ? f.startsWith(qFirst) : f === qFirst;
    });
    if (refined.length === 1) return refined[0].photo_url || null;
  }

  return null;
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
