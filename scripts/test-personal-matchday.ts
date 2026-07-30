/**
 * Test determinista de la priorización de Jornada Personal.
 *
 * No usa navegador, red, API-Football ni credenciales.
 */

import assert from "node:assert/strict";
import {
  buildPersonalMatchday,
  type PersonalMatchdayFeed,
  type PersonalMatchdayFixture,
} from "../src/lib/ligas/personal-matchday";

function fixture(id: number, kickoff: string, status = "NS"): PersonalMatchdayFixture {
  return {
    fixtureId: id,
    kickoff,
    status,
    elapsed: status === "2H" ? 67 : null,
    home: { id: id * 10, name: `Local ${id}`, logo: "" },
    away: { id: id * 10 + 1, name: `Visitante ${id}`, logo: "" },
    score: { home: status === "2H" ? 1 : null, away: status === "2H" ? 0 : null },
  };
}

const feeds: PersonalMatchdayFeed[] = [
  {
    slug: "liga-mx",
    name: "Liga MX",
    short: "Liga MX",
    live: [fixture(1, "2026-07-30T18:00:00Z", "2H")],
    upcoming: [
      fixture(1, "2026-07-30T18:00:00Z"), // duplicado: debe ganar la versión live
      fixture(2, "2026-07-30T21:00:00Z"),
      // 22:30 UTC ya es 00:30 del día siguiente en Madrid.
      fixture(3, "2026-07-30T22:30:00Z"),
    ],
  },
  {
    slug: "laliga",
    name: "LaLiga",
    short: "LaLiga",
    live: [],
    upcoming: [fixture(4, "2026-07-31T19:00:00Z")],
  },
];

function main() {
  const now = new Date("2026-07-30T12:00:00Z");
  const live = buildPersonalMatchday(feeds, now, "Europe/Madrid");

  assert.equal(live.mode, "live");
  assert.deepEqual(live.fixtures.map((item) => item.fixtureId), [1, 2]);
  assert.equal(live.fixtures[0].status, "2H");
  assert.equal(live.liveCount, 1);
  assert.equal(live.todayCount, 2);
  assert.equal(live.competitionCount, 2);

  const upcoming = buildPersonalMatchday(
    feeds.map((feed) => ({ ...feed, live: [], upcoming: feed.upcoming.filter((item) => item.fixtureId > 2) })),
    now,
    "Europe/Madrid",
  );
  assert.equal(upcoming.mode, "upcoming");
  assert.deepEqual(upcoming.fixtures.map((item) => item.fixtureId), [3, 4]);

  const empty = buildPersonalMatchday([], now, "Europe/Madrid");
  assert.equal(empty.mode, "empty");

  console.log("Personal matchday: 9 checks OK.");
}

main();
