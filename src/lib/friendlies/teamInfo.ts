// src/lib/friendlies/teamInfo.ts
//
// Puente entre los datos en vivo de api-football (nombres en INGLÉS: "France",
// "Ivory Coast") y las fichas BIBLIA (es) para los push de amistosos.
//   - esName(): traduce el nombre de la selección al español.
//   - favoritePhoto(): foto que acompaña al partido. Como no disponemos de fotos
//     de enfrentamientos anteriores, usamos la foto del jugador estrella de la
//     selección FAVORITA (mejor ranking FIFA). null si ninguna es resoluble.
// Server-only (lee data/teams via fs). El índice se construye una sola vez.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadTeam, listBibliaSlugs } from "@/lib/biblia";
import type { NationalTeam, Player } from "@/types/team";
import { flagEmoji, isoFromName } from "./flags";
import { buildNations, keepTeamPhoto, type Nation, type TeamLike } from "./photoFilter";

// Índice de naciones (las 48 fichas + externas), construido una vez. Sirve para
// filtrar el banco de fotos de equipo: descartar las fotos contaminadas por el
// scraper (foto del rival, otra selección o basura) y dejar solo las del país
// dueño. Ver photoFilter.ts y scripts/verify-team-photos.ts.
let nationsPromise: Promise<Nation[]> | null = null;
async function getNations(): Promise<Nation[]> {
  if (!nationsPromise) {
    nationsPromise = (async () => {
      const slugs = await listBibliaSlugs();
      const teams: TeamLike[] = [];
      for (const slug of slugs) {
        const t = await loadTeam(slug);
        if (t) teams.push({ slug: t.slug, name_es: t.name_es, name_en: t.name_en, name_local: t.name_local });
      }
      return buildNations(teams);
    })();
  }
  return nationsPromise;
}

/**
 * team_photos de una ficha YA FILTRADAS: descarta las que muestran a otra
 * selección o son basura (defensa permanente contra el scraper; equivale a la
 * limpieza manual del PR #189). Si todas caen, el motor usa el respaldo seguro
 * (retrato de un jugador del propio país, camiseta nacional).
 */
function cleanTeamPhotos(t: NationalTeam, nations: Nation[]): string[] {
  return (t.wc_2026?.team_photos ?? []).filter(
    (u): u is string => !!u && keepTeamPhoto(u, t.slug, nations),
  );
}

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
  seed = "",
): Promise<string | null> {
  if (!teamName || !playerName) return null;
  const idx = await getSquadIndex();
  const squad = idx.get(norm(teamName));
  if (!squad || squad.length === 0) return null;

  // Elige entre photo_url + galería del jugador (variedad), determinista por seed.
  const pick = (p: Player): string | null => {
    const imgs = [p.photo_url, ...(p.photos ?? [])].filter((u): u is string => !!u);
    if (imgs.length === 0) return null;
    const i = seed ? hashSeed(seed) % imgs.length : 0;
    return imgs[i] ?? null;
  };

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
      return pick(p);
    }
  }

  // 2) Por apellido (último token). Si solo uno coincide, ese.
  const bySurname = squad.filter(
    (p) => lastToken(p.full_name || "") === qSurname || lastToken(p.display_name || "") === qSurname,
  );
  if (bySurname.length === 1) return pick(bySurname[0]);

  // 3) Varios con el mismo apellido: desambiguar por nombre/inicial.
  if (bySurname.length > 1) {
    const refined = bySurname.filter((p) => {
      const f = firstToken(p.full_name || "");
      return qIsInitial ? f.startsWith(qFirst) : f === qFirst;
    });
    if (refined.length === 1) return pick(refined[0]);
  }

  return null;
}

// Índice nombre de selección -> pool de imágenes (image_pool curado + fotos de
// la convocatoria + foto del jugador estrella), una sola vez. Da variedad a los
// push usando lo que ya tenemos de Wikimedia Commons en BIBLIA.
let poolIndexPromise: Promise<Map<string, string[]>> | null = null;
async function getPoolIndex(): Promise<Map<string, string[]>> {
  if (!poolIndexPromise) {
    poolIndexPromise = (async () => {
      const map = new Map<string, string[]>();
      const slugs = await listBibliaSlugs();
      const nations = await getNations();
      for (const slug of slugs) {
        const t = await loadTeam(slug);
        if (!t) continue;
        const imgs: string[] = [];
        for (const u of cleanTeamPhotos(t, nations)) imgs.push(u);
        for (const u of t.wc_2026?.image_pool ?? []) if (u) imgs.push(u);
        for (const p of t.wc_2026?.likely_squad ?? []) {
          if (p.photo_url) imgs.push(p.photo_url);
          for (const u of p.photos ?? []) if (u) imgs.push(u);
        }
        const sp = t.wc_2026?.star_player?.photo_url;
        if (sp) imgs.push(sp);
        const uniq = [...new Set(imgs)];
        for (const key of [t.name_en, t.name_es, t.name_local, slug]) {
          if (key) map.set(norm(key), uniq);
        }
      }
      return map;
    })();
  }
  return poolIndexPromise;
}

/** Hash estable de un string -> entero no negativo (para elegir de forma
 *  determinista pero "aleatoria" del pool, sin parpadear entre re-sondeos). */
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Imagen variada de una selección (pool curado + convocatoria). Se usa como
 * respaldo cuando no se resuelve la foto del jugador concreto, para no mostrar
 * siempre al favorito. Determinista por `seed` (p.ej. el id del evento) para que
 * el mismo aviso muestre siempre la misma imagen. null si el país no tiene fotos.
 */
export async function countryImage(name: string, seed = ""): Promise<string | null> {
  if (!name) return null;
  const idx = await getPoolIndex();
  const imgs = idx.get(norm(name));
  if (!imgs || imgs.length === 0) return null;
  const i = seed ? hashSeed(seed) % imgs.length : Math.floor(Math.random() * imgs.length);
  return imgs[i] ?? null;
}

// Índice nombre de selección -> fotos de EQUIPO con camiseta nacional
// (team_photos: grupo/once/celebración; + image_pool curado si lo hubiera). Para
// los push de contexto (previa, alineaciones, descanso, final) preferimos estas
// al retrato suelto de un jugador. Camiseta nacional garantizada (scraper).
let atmosphereIndexPromise: Promise<Map<string, string[]>> | null = null;
async function getAtmosphereIndex(): Promise<Map<string, string[]>> {
  if (!atmosphereIndexPromise) {
    atmosphereIndexPromise = (async () => {
      const map = new Map<string, string[]>();
      const slugs = await listBibliaSlugs();
      const nations = await getNations();
      for (const slug of slugs) {
        const t = await loadTeam(slug);
        if (!t) continue;
        const imgs = [
          ...new Set([
            ...cleanTeamPhotos(t, nations),
            ...(t.wc_2026?.image_pool ?? []),
          ].filter(Boolean)),
        ];
        for (const key of [t.name_en, t.name_es, t.name_local, slug]) {
          if (key) map.set(norm(key), imgs);
        }
      }
      return map;
    })();
  }
  return atmosphereIndexPromise;
}

// Índice nombre de selección -> SOLO team_photos (grupo/once/celebración, camiseta
// nacional). Para ALINEACIONES (foto del favorito) y FINAL (foto del ganador).
let teamPhotosIndexPromise: Promise<Map<string, string[]>> | null = null;
async function getTeamPhotosIndex(): Promise<Map<string, string[]>> {
  if (!teamPhotosIndexPromise) {
    teamPhotosIndexPromise = (async () => {
      const map = new Map<string, string[]>();
      const slugs = await listBibliaSlugs();
      const nations = await getNations();
      for (const slug of slugs) {
        const t = await loadTeam(slug);
        if (!t) continue;
        const imgs = [...new Set(cleanTeamPhotos(t, nations))];
        for (const key of [t.name_en, t.name_es, t.name_local, slug]) {
          if (key) map.set(norm(key), imgs);
        }
      }
      return map;
    })();
  }
  return teamPhotosIndexPromise;
}

/**
 * Foto de EQUIPO de una selección (grupo/once/celebración, camiseta nacional,
 * horizontal). Para ALINEACIONES (favorito) y FINAL (ganador). Determinista por
 * `seed`.
 *
 * IMPORTANTE: si la ficha no tiene team_photos limpias, devuelve null — y NO cae
 * al retrato de un jugador. Esos retratos suelen ser verticales y/o de camiseta
 * de CLUB (la imagen oficial P18 de Wikidata), y el push de "¡Gana X!" mostraba
 * a un jugador con la camiseta del AC Milan. Mejor sin imagen que con una mala:
 * el llamador (push) deja el aviso sin foto cuando esto devuelve null.
 */
export async function teamPhoto(name: string, seed = ""): Promise<string | null> {
  if (!name) return null;
  const idx = await getTeamPhotosIndex();
  const imgs = idx.get(norm(name));
  if (imgs && imgs.length > 0) {
    const i = seed ? hashSeed(seed) % imgs.length : Math.floor(Math.random() * imgs.length);
    return imgs[i] ?? null;
  }
  return null;
}

/**
 * Imagen de AMBIENTE de una selección (image_pool curado: equipo/afición/acción).
 * Para los avisos de contexto (previa, alineaciones, inicio, descanso, final).
 * Si la ficha aún no tiene image_pool, cae a la galería amplia (countryImage),
 * para no quedarse sin imagen. Determinista por `seed`.
 */
export async function countryAtmosphere(name: string, seed = ""): Promise<string | null> {
  if (!name) return null;
  const idx = await getAtmosphereIndex();
  const imgs = idx.get(norm(name));
  if (imgs && imgs.length > 0) {
    const i = seed ? hashSeed(seed) % imgs.length : Math.floor(Math.random() * imgs.length);
    return imgs[i] ?? null;
  }
  return countryImage(name, seed);
}

/**
 * Imagen de ambiente del partido: la de la selección FAVORITA (mejor ranking).
 * Para previas y resúmenes cuando no hay un protagonista concreto. null si
 * ninguna se resuelve (el llamador usará un respaldo).
 */
export async function favoriteAtmosphere(
  homeName: string,
  awayName: string,
  seed = "",
): Promise<string | null> {
  const [h, a] = await Promise.all([teamInfo(homeName), teamInfo(awayName)]);
  const hr = h?.rank ?? Number.POSITIVE_INFINITY;
  const ar = a?.rank ?? Number.POSITIVE_INFINITY;
  const first = hr <= ar ? homeName : awayName;
  const second = hr <= ar ? awayName : homeName;
  return (await countryAtmosphere(first, seed)) || (await countryAtmosphere(second, seed));
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

// ── MOTOR DE TIPOLOGÍA POR SITUACIÓN (reglas de Carlos, 2026-06-07) ──────────
// PREVIA → jugador más importante (valor de mercado). ALINEACIONES → equipo
// favorito. GOL/TARJETA → jugador concreto (playerPhoto). MEDIO TIEMPO → estadio.
// FINAL → celebración del ganador. Todas las fotos son horizontales y de
// camiseta nacional (garantizado por el scraper).

/** Elige una imagen del jugador (photo_url + galería), determinista por seed. */
function pickPlayerImage(p: Player, seed = ""): string | null {
  const imgs = [p.photo_url, ...(p.photos ?? [])].filter((u): u is string => !!u);
  if (imgs.length === 0) return null;
  const i = seed ? hashSeed(seed) % imgs.length : 0;
  return imgs[i] ?? null;
}

/**
 * PREVIA: foto del JUGADOR MÁS IMPORTANTE del partido, medido por valor de
 * mercado (market_value_eur) entre las dos convocatorias. Si nadie tiene valor,
 * cae al jugador estrella de la favorita (favoritePhoto). Determinista por seed.
 */
export async function topValuePhoto(
  homeName: string,
  awayName: string,
  seed = "",
): Promise<string | null> {
  const idx = await getSquadIndex();
  const squads = [idx.get(norm(homeName)), idx.get(norm(awayName))];
  let best: Player | null = null;
  let bestVal = -1;
  for (const squad of squads) {
    for (const p of squad ?? []) {
      const v = p.market_value_eur ?? 0;
      if (v > bestVal && pickPlayerImage(p)) { bestVal = v; best = p; }
    }
  }
  if (best && bestVal > 0) {
    const photo = pickPlayerImage(best, seed);
    if (photo) return photo;
  }
  return favoritePhoto(homeName, awayName);
}

/**
 * ALINEACIONES: foto de EQUIPO de la selección FAVORITA (mejor ranking FIFA).
 * Cae a la del rival y, en último término, a la imagen de ambiente del favorito.
 */
export async function favoriteTeamPhoto(
  homeName: string,
  awayName: string,
  seed = "",
): Promise<string | null> {
  const [h, a] = await Promise.all([teamInfo(homeName), teamInfo(awayName)]);
  const hr = h?.rank ?? Number.POSITIVE_INFINITY;
  const ar = a?.rank ?? Number.POSITIVE_INFINITY;
  const first = hr <= ar ? homeName : awayName;
  const second = hr <= ar ? awayName : homeName;
  return (await teamPhoto(first, seed)) || (await teamPhoto(second, seed));
}

/**
 * FINAL: foto de EQUIPO (celebración) de la selección GANADORA. El llamador pasa
 * el nombre del ganador. Si no hay team_photos, cae a su imagen de ambiente.
 */
export async function winnerTeamPhoto(
  winnerName: string,
  seed = "",
): Promise<string | null> {
  if (!winnerName) return null;
  return teamPhoto(winnerName, seed);
}

// ── BANCO DE ESTADIOS (MEDIO TIEMPO) ────────────────────────────────────────
interface StadiumEntry { key: string; commons: string; city: string; country_iso: string; aliases: string[]; photos: string[]; }
let stadiumIndexPromise: Promise<{ byAlias: Map<string, StadiumEntry>; all: StadiumEntry[] }> | null = null;
async function getStadiumIndex() {
  if (!stadiumIndexPromise) {
    stadiumIndexPromise = (async () => {
      const byAlias = new Map<string, StadiumEntry>();
      let all: StadiumEntry[] = [];
      try {
        const file = path.join(process.cwd(), "data", "stadiums.json");
        all = JSON.parse(await readFile(file, "utf-8")) as StadiumEntry[];
        for (const s of all) {
          for (const a of [s.commons, s.city, ...(s.aliases ?? [])]) {
            if (a) byAlias.set(norm(a), s);
          }
        }
      } catch { /* sin banco de estadios: el llamador usará respaldo */ }
      return { byAlias, all };
    })();
  }
  return stadiumIndexPromise;
}

/**
 * MEDIO TIEMPO: foto del ESTADIO donde se juega. Casa el texto del partido
 * (meta.venue, p.ej. "AT&T Stadium" o "MetLife Stadium") contra los alias del
 * banco (nombre comercial, nombre Mundial, ciudad). Determinista por seed.
 * null si el estadio no está en el banco (p.ej. amistosos fuera de las sedes);
 * el llamador caerá a la imagen de ambiente.
 */
export async function stadiumPhoto(venue: string, seed = ""): Promise<string | null> {
  if (!venue) return null;
  const { byAlias } = await getStadiumIndex();
  const v = norm(venue);
  let entry = byAlias.get(v);
  if (!entry) {
    // coincidencia parcial: el texto contiene un alias o viceversa
    for (const [alias, s] of byAlias) {
      if (alias.length >= 4 && (v.includes(alias) || alias.includes(v))) { entry = s; break; }
    }
  }
  if (!entry || entry.photos.length === 0) return null;
  const i = seed ? hashSeed(seed) % entry.photos.length : Math.floor(Math.random() * entry.photos.length);
  return entry.photos[i] ?? null;
}
