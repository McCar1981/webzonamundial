// src/lib/match-center/heroImage.ts
//
// Resuelve la FOTOGRAFÍA que acompaña a un partido en la página interna del
// Match Center (PreMatchHero). Regla: SIEMPRE debe haber una foto.
//   1. Foto del jugador estrella de la selección local (p.ej. Cristiano Ronaldo
//      en Portugal). Si no, la del estrella de la visitante.
//   2. Si ninguna selección tiene foto resoluble, cae a una imagen de estadio
//      genérica empaquetada en /public.
// Server-only: lee las fichas BIBLIA de data/teams via fs.

import { loadTeam, listBibliaSlugs } from "@/lib/biblia";
import type { NationalTeam } from "@/types/team";
import type { MatchMeta } from "./types";

// Imagen de respaldo: garantiza que SIEMPRE haya una foto aunque no haya estrella.
// Estadio real con balón en el césped (neutral, sirve para cualquier partido).
const FALLBACK_IMAGE = "/img/heroes/ball-stadium-pitch.jpg";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Índice iso(flagcdn) -> slug de ficha, construido una sola vez (datos estáticos).
let isoIndexPromise: Promise<Record<string, string>> | null = null;
async function isoToSlug(): Promise<Record<string, string>> {
  if (!isoIndexPromise) {
    isoIndexPromise = (async () => {
      const slugs = await listBibliaSlugs();
      const map: Record<string, string> = {};
      for (const slug of slugs) {
        const team = await loadTeam(slug);
        if (team?.iso) map[team.iso.toLowerCase()] = slug;
      }
      return map;
    })();
  }
  return isoIndexPromise;
}

/** Foto del jugador estrella de una ficha (busca su entrada en la convocatoria). */
function starPhoto(team: NationalTeam): string | null {
  const wc = team.wc_2026;
  const starName = wc?.star_player?.name;
  if (!starName) return null;
  // El propio star_player puede traer foto.
  if (wc.star_player.photo_url) return wc.star_player.photo_url;
  // Si no, la buscamos en la convocatoria por nombre.
  const target = norm(starName);
  const squad = wc.likely_squad ?? [];
  const hit = squad.find((p) => {
    const full = norm(p.full_name || "");
    const disp = norm(p.display_name || "");
    return full === target || disp === target || full.includes(target) || target.includes(disp);
  });
  return hit?.photo_url || null;
}

async function teamStarPhotoByFlag(flag: string): Promise<string | null> {
  const idx = await isoToSlug();
  const slug = idx[flag.toLowerCase()];
  if (!slug) return null;
  const team = await loadTeam(slug);
  if (!team) return null;
  return starPhoto(team);
}

/**
 * Devuelve la URL de la foto que acompaña al partido. Nunca null: si no hay
 * estrella resoluble en ninguna selección, devuelve la imagen de respaldo.
 */
export async function matchHeroImage(meta: MatchMeta): Promise<string> {
  const home = await teamStarPhotoByFlag(meta.home.flag);
  if (home) return home;
  const away = await teamStarPhotoByFlag(meta.away.flag);
  if (away) return away;
  return FALLBACK_IMAGE;
}
