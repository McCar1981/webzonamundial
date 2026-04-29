// Sincroniza group_2026 + schedule de un equipo BIBLIA desde
// src/data/matches.ts (la fuente de verdad del calendario web).
//
// Uso: node scripts/sync-fixtures.mjs <slug>
//
// Idempotente: si los datos ya están correctos, no hace cambios.

import { readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2];
if (!slug) {
  console.error("Uso: node scripts/sync-fixtures.mjs <slug>");
  process.exit(1);
}

// Mapa nombre matches.ts → ISO 2-letter (algunos nombres llevan abreviatura)
const NAME_TO_ISO = {
  "México": "mx",
  "Sudáfrica": "za",
  "Corea del Sur": "kr",
  "Rep. Checa": "cz",
  "Canadá": "ca",
  "Qatar": "qa",
  "Bosnia": "ba",
  "Suiza": "ch",
  "Brasil": "br",
  "Haití": "ht",
  "Marruecos": "ma",
  "Escocia": "gb-sct",
  "EE.UU.": "us",
  "Estados Unidos": "us",
  "Australia": "au",
  "Paraguay": "py",
  "Turquía": "tr",
  "Alemania": "de",
  "C. de Marfil": "ci",
  "Costa de Marfil": "ci",
  "Curazao": "cw",
  "Ecuador": "ec",
  "P. Bajos": "nl",
  "Países Bajos": "nl",
  "Túnez": "tn",
  "Japón": "jp",
  "Suecia": "se",
  "Bélgica": "be",
  "N. Zelanda": "nz",
  "Nueva Zelanda": "nz",
  "Egipto": "eg",
  "Irán": "ir",
  "España": "es",
  "Cabo Verde": "cv",
  "Uruguay": "uy",
  "A. Saudí": "sa",
  "Arabia Saudí": "sa",
  "Arabia Saudita": "sa",
  "Argentina": "ar",
  "Argelia": "dz",
  "Austria": "at",
  "Jordania": "jo",
  "Inglaterra": "gb-eng",
  "Francia": "fr",
  "Croacia": "hr",
  "Portugal": "pt",
  "Noruega": "no",
  "Senegal": "sn",
  "Túnez": "tn",
  "RD Congo": "cd",
  "Ghana": "gh",
  "Sudáfrica": "za",
  "Colombia": "co",
  "Italia": "it",
  "Uzbekistán": "uz",
  "Irak": "iq",
  "Panamá": "pa",
  "Curazao": "cw",
};

// ISO → slug BIBLIA
const ISO_TO_SLUG = {
  ar: "argentina", br: "brasil", co: "colombia", ec: "ecuador",
  py: "paraguay", uy: "uruguay", es: "espana", ma: "marruecos",
  mx: "mexico", us: "estados-unidos", ca: "canada", pa: "panama",
  cw: "curazao", ht: "haiti", "gb-eng": "inglaterra", fr: "francia",
  hr: "croacia", pt: "portugal", no: "noruega", de: "alemania",
  nl: "paises-bajos", be: "belgica", at: "austria", ch: "suiza",
  "gb-sct": "escocia", tr: "turquia", ba: "bosnia", se: "suecia",
  cz: "chequia", tn: "tunez", eg: "egipto", dz: "argelia",
  gh: "ghana", cv: "cabo-verde", za: "sudafrica", ci: "costa-de-marfil",
  sn: "senegal", cd: "rd-congo", jp: "japon", ir: "iran",
  uz: "uzbekistan", kr: "corea-del-sur", jo: "jordania", au: "australia",
  qa: "qatar", sa: "arabia-saudi", iq: "irak", nz: "nueva-zelanda",
};

function loadMatchesFromTS() {
  const ts = readFileSync("src/data/matches.ts", "utf-8");
  // Extrae el array MATCHES de matches.ts. Cada línea es un objeto JSON.
  const matchLine = /\{ "i": \d+, .*? \}/g;
  const matches = [];
  for (const line of ts.split("\n")) {
    const m = line.match(matchLine);
    if (m) {
      try {
        const obj = JSON.parse(m[0]);
        matches.push(obj);
      } catch {
        // skip
      }
    }
  }
  return matches;
}

const teamPath = `data/teams/${slug}.json`;
const team = JSON.parse(readFileSync(teamPath, "utf-8"));
const teamIso = team.iso;
const matches = loadMatchesFromTS();

// 1) Identificar grupo del equipo
const ownMatches = matches.filter(
  (m) => m.hf === teamIso || m.af === teamIso
).filter((m) => m.g); // solo fase de grupos

if (ownMatches.length === 0) {
  console.error(`Sin partidos para ${slug} (${teamIso}) en matches.ts`);
  process.exit(0);
}

const groupLetter = ownMatches[0].g;
console.error(`\n=== ${slug.toUpperCase()} (${teamIso}) — Grupo ${groupLetter} ===\n`);

// 2) Construir teams del grupo (4 equipos)
const groupAllMatches = matches.filter((m) => m.g === groupLetter);
const teamsInGroup = new Map();
for (const m of groupAllMatches) {
  if (!teamsInGroup.has(m.hf)) teamsInGroup.set(m.hf, m.h);
  if (!teamsInGroup.has(m.af)) teamsInGroup.set(m.af, m.a);
}
const groupTeams = Array.from(teamsInGroup.entries()).map(([iso, name]) => ({
  iso,
  name,
  fifa_rank: null,
  is_seed: iso === teamIso ? team.wc_2026?.group_2026?.teams?.find((t) => t.iso === iso)?.is_seed : undefined,
}));

// 3) Construir schedule del equipo
const ownGroupMatches = ownMatches.filter((m) => m.g);
const schedule = ownGroupMatches.map((m) => {
  const isHome = m.hf === teamIso;
  const opponent = isHome
    ? { iso: m.af, name: m.a }
    : { iso: m.hf, name: m.h };
  return {
    matchday: m.j,
    opponent,
    date: m.d,
    kickoff_local: m.t,
    venue: {
      stadium: m.vn,
      city: m.vc,
      country_iso: m.vf,
    },
    status: "scheduled",
  };
});

// 4) Inyectar
team.wc_2026.group_2026 = {
  letter: groupLetter,
  label: team.wc_2026.group_2026?.label ?? `Grupo ${groupLetter}`,
  teams: groupTeams,
  notes: team.wc_2026.group_2026?.notes ?? "Datos del sorteo confirmados según /grupos de zonamundial.app.",
};
team.wc_2026.schedule = schedule;

writeFileSync(teamPath, JSON.stringify(team, null, 2) + "\n");

console.error(`Grupo ${groupLetter}:`);
groupTeams.forEach((t) => {
  console.error(`  - ${t.name} (${t.iso})`);
});
console.error(`\nSchedule (${schedule.length} partidos):`);
schedule.forEach((s) => {
  console.error(
    `  J${s.matchday}: vs ${s.opponent.name.padEnd(15)} ${s.date} ${s.kickoff_local} · ${s.venue.stadium} · ${s.venue.city}`
  );
});
console.error(`\n→ Guardado en ${teamPath}\n`);
