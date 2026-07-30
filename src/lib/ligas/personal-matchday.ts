// Modelo puro de la Jornada Personal.
//
// Convierte los mini-feeds por liga en una sola agenda ordenada por utilidad:
// primero lo que está en vivo, después lo que se juega hoy y, si hoy está vacío,
// los próximos partidos. No usa React, navegador, red ni credenciales.

export interface PersonalMatchdayTeam {
  id: number;
  name: string;
  logo: string;
}

export interface PersonalMatchdayFixture {
  fixtureId: number;
  kickoff: string;
  status: string;
  elapsed: number | null;
  home: PersonalMatchdayTeam;
  away: PersonalMatchdayTeam;
  score: { home: number | null; away: number | null };
}

export interface PersonalMatchdayFeed {
  slug: string;
  name: string;
  short: string;
  live: PersonalMatchdayFixture[];
  upcoming: PersonalMatchdayFixture[];
}

export type PersonalMatchdayMode = "live" | "today" | "upcoming" | "empty";

export interface PersonalMatchdayItem extends PersonalMatchdayFixture {
  competitionSlug: string;
  competitionName: string;
  competitionShort: string;
}

export interface PersonalMatchdayModel {
  mode: PersonalMatchdayMode;
  fixtures: PersonalMatchdayItem[];
  liveCount: number;
  todayCount: number;
  competitionCount: number;
}

const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

function normalizedStatus(status: string): string {
  return String(status || "").trim().toUpperCase();
}

function isLive(status: string): boolean {
  return LIVE.has(normalizedStatus(status));
}

function dateKey(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { ...options, timeZone: "UTC" }).formatToParts(date);
  }
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function kickoffTime(item: PersonalMatchdayItem): number {
  const value = Date.parse(item.kickoff);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

/**
 * Construye una agenda transversal y deduplicada. `timeZone` debe ser una zona
 * IANA (p. ej. Europe/Madrid); así "hoy" respeta el calendario del aficionado.
 */
export function buildPersonalMatchday(
  feeds: PersonalMatchdayFeed[],
  now: Date = new Date(),
  timeZone = "UTC",
  limit = 5,
): PersonalMatchdayModel {
  const byFixture = new Map<number, PersonalMatchdayItem>();

  for (const feed of feeds) {
    for (const fixture of [...feed.live, ...feed.upcoming]) {
      if (!Number.isInteger(fixture.fixtureId) || fixture.fixtureId <= 0) continue;
      if (FINISHED.has(normalizedStatus(fixture.status))) continue;
      const item: PersonalMatchdayItem = {
        ...fixture,
        competitionSlug: feed.slug,
        competitionName: feed.name,
        competitionShort: feed.short,
      };
      const previous = byFixture.get(fixture.fixtureId);
      if (!previous || (isLive(item.status) && !isLive(previous.status))) {
        byFixture.set(fixture.fixtureId, item);
      }
    }
  }

  const all = [...byFixture.values()];
  const todayKey = dateKey(now, timeZone);
  const live = all.filter((item) => isLive(item.status)).sort((a, b) => kickoffTime(a) - kickoffTime(b));
  const today = all
    .filter((item) => !isLive(item.status) && dateKey(item.kickoff, timeZone) === todayKey)
    .sort((a, b) => kickoffTime(a) - kickoffTime(b));
  const upcoming = all
    .filter((item) => !isLive(item.status))
    .sort((a, b) => kickoffTime(a) - kickoffTime(b));

  const safeLimit = Math.max(1, Math.floor(limit) || 1);
  const mode: PersonalMatchdayMode =
    live.length > 0 ? "live" : today.length > 0 ? "today" : upcoming.length > 0 ? "upcoming" : "empty";
  const fixtures =
    mode === "live"
      ? [...live, ...today].slice(0, safeLimit)
      : mode === "today"
        ? today.slice(0, safeLimit)
        : mode === "upcoming"
          ? upcoming.slice(0, safeLimit)
          : [];

  return {
    mode,
    fixtures,
    liveCount: live.length,
    todayCount: live.filter((item) => dateKey(item.kickoff, timeZone) === todayKey).length + today.length,
    competitionCount: new Set(all.map((item) => item.competitionSlug)).size,
  };
}
