// Reescribe la POSICIÓN de cada jugador del fantasy para que coincida con
// api-football: Goalkeeper→PO, Defender→DF, Midfielder→MC, Attacker→DL.
// Emparejado ESTRICTO por nombre (exacto / ≥2 tokens / apellido+inicial) para
// no confundir jugadores distintos. Los no emparejados se dejan igual.
// Edita src/data/fantasy-rosters.ts in place e imprime el changelog.
//
// Uso: API_SPORTS_KEY=xxx NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/apply-positions-apifootball.mjs

import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.API_SPORTS_KEY;
if (!KEY) { console.error("Falta API_SPORTS_KEY"); process.exit(1); }
const BASE = "https://v3.football.api-sports.io";

const SEARCH = {
  mexico: "Mexico", "corea-del-sur": "South Korea", sudafrica: "South Africa",
  "republica-checa": "Czech Republic", canada: "Canada", suiza: "Switzerland", qatar: "Qatar",
  bosnia: "Bosnia", brasil: "Brazil", marruecos: "Morocco", haiti: "Haiti",
  escocia: "Scotland", "estados-unidos": "USA", australia: "Australia", paraguay: "Paraguay",
  turquia: "Turkey", alemania: "Germany", curazao: "Curacao", "costa-de-marfil": "Ivory Coast",
  ecuador: "Ecuador", "paises-bajos": "Netherlands", japon: "Japan", tunez: "Tunisia",
  suecia: "Sweden", belgica: "Belgium", egipto: "Egypt", iran: "Iran",
  "nueva-zelanda": "New Zealand", espana: "Spain", "cabo-verde": "Cape Verde",
  "arabia-saudi": "Saudi Arabia", uruguay: "Uruguay", francia: "France", senegal: "Senegal",
  noruega: "Norway", irak: "Iraq", argentina: "Argentina", argelia: "Algeria",
  austria: "Austria", jordania: "Jordan", portugal: "Portugal", colombia: "Colombia",
  uzbekistan: "Uzbekistan", "rd-congo": "Congo DR", inglaterra: "England", croacia: "Croatia",
  ghana: "Ghana", panama: "Panama",
};
const FORCE_ID = {
  "republica-checa": 770, turquia: 777, ecuador: 2382, "costa-de-marfil": 1501,
  "corea-del-sur": 17, canada: 5529, noruega: 1090, australia: 20, alemania: 25,
  "paises-bajos": 1118, francia: 2, "arabia-saudi": 23, panama: 11, austria: 775,
};

const FILE = new URL("../src/data/fantasy-rosters.ts", import.meta.url);
const original = readFileSync(FILE, "utf8");
const head = original.slice(0, original.indexOf("export const FANTASY_ROSTERS"));
let body = original.slice(original.indexOf("export const FANTASY_ROSTERS"));

// localizar cada bloque de equipo: slug + rango [start,end) del contenido del array
const entryRe = /(?:"([a-z0-9-]+)"|([a-z0-9-]+))\s*:\s*r\(\[/g;
const blocks = [];
let m;
while ((m = entryRe.exec(body))) {
  const slug = m[1] || m[2];
  const start = entryRe.lastIndex;
  const end = body.indexOf("])", start);
  blocks.push({ slug, start, end });
}

const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&apos;|&#39;/g, " ").replace(/[.''`-]/g, " ").replace(/\s+/g, " ").trim();
const toks = (s) => norm(s).split(" ").filter(Boolean);
const surname = (s) => { const t = toks(s); return t.length ? t[t.length - 1] : ""; };
const initial = (s) => { const t = toks(s); return t.length ? t[0][0] : ""; };
const findMatch = (name, api) => {
  const na = norm(name), A = toks(name), surA = surname(name), iniA = initial(name);
  for (const p of api) if (norm(p.name) === na) return p;
  for (const p of api) { const B = toks(p.name); let c = 0; for (const t of A) if (B.includes(t)) c++; if (c >= 2) return p; }
  for (const p of api) {
    const B = toks(p.name);
    if (surA && surA === surname(p.name)) {
      if (iniA && iniA === initial(p.name)) return p;
      if (A.length === 1 || B.length === 1) return p;
    }
  }
  return null;
};

async function api(path) {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": KEY }, cache: "no-store" }); if (r.ok) return r.json(); } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 700));
  }
  return null;
}
const BAD = /\b(W|women|u-?\d+|olympic|youth|amateur|futsal|beach)\b/i;
async function resolveTeamId(name) {
  const d = await api(`/teams?search=${encodeURIComponent(name)}`);
  if (!d?.response?.length) return null;
  let nat = d.response.filter((x) => x.team?.national && !BAD.test(x.team.name || ""));
  if (!nat.length) nat = d.response.filter((x) => x.team?.national);
  return (nat.length ? nat : d.response)[0]?.team?.id ?? null;
}
async function squad(id) { const d = await api(`/players/squads?team=${id}`); const r = d?.response?.[0]; return r ? r.players : []; }

const CLASS_TO_POS = { Goalkeeper: "PO", Defender: "DF", Midfielder: "MC", Attacker: "DL" };

const changes = [];
const unmatched = [];
const noData = [];

for (const b of blocks) {
  const slug = b.slug;
  if (!(slug in SEARCH)) continue;
  const id = FORCE_ID[slug] ?? (await resolveTeamId(SEARCH[slug]));
  if (!id) { noData.push(`${slug}(sin id)`); continue; }
  const ap = await squad(id);
  if (!ap.length) { noData.push(`${slug}(squad vacío #${id})`); continue; }

  let chunk = body.slice(b.start, b.end);
  const tuples = [...chunk.matchAll(/\[\s*"(PO|DF|MC|DL)"\s*,\s*"([^"]+)"/g)];
  let localUnmatched = 0;
  for (const t of tuples) {
    const curPos = t[1], name = t[2];
    const match = findMatch(name, ap);
    if (!match) { localUnmatched++; continue; }
    const newPos = CLASS_TO_POS[match.position];
    if (!newPos || newPos === curPos) continue;
    // reemplazo puntual dentro del bloque (nombre único por equipo)
    const needle = `"${curPos}", "${name}"`;
    const repl = `"${newPos}", "${name}"`;
    if (chunk.includes(needle)) {
      chunk = chunk.replace(needle, repl);
      changes.push({ slug, name, from: curPos, to: newPos, api: match.position });
    }
  }
  if (localUnmatched) unmatched.push(`${slug}:${localUnmatched}`);
  // splice de vuelta (recalcular offsets: trabajamos sobre body acumulando longitud delta)
  body = body.slice(0, b.start) + chunk + body.slice(b.end);
  const delta = chunk.length - (b.end - b.start);
  for (const nb of blocks) { if (nb.start > b.start) { nb.start += delta; nb.end += delta; } }
  b.end += delta;
}

writeFileSync(FILE, head + body, "utf8");

const LABEL = { PO: "PO/portero", DF: "DF/defensa", MC: "MC/medio", DL: "DL/delantero" };
console.log(`\n===== POSICIONES REALINEADAS A API-FOOTBALL =====`);
console.log(`Cambios aplicados: ${changes.length}\n`);
for (const c of changes) console.log(`  ${c.slug}: ${c.name}  ${c.from} → ${c.to}  (api: ${c.api})`);
console.log(`\nNo emparejados (sin tocar): ${unmatched.join(", ") || "0"}`);
if (noData.length) console.log(`Equipos sin datos API (sin tocar): ${noData.join(", ")}`);

// distribución global del pool tras los cambios
const finalBody = head + body;
const all = [...finalBody.matchAll(/\[\s*"(PO|DF|MC|DL)"\s*,/g)].map((x) => x[1]);
const dist = all.reduce((a, p) => ((a[p] = (a[p] || 0) + 1), a), {});
console.log(`\nDistribución global del pool: PO=${dist.PO||0} DF=${dist.DF||0} MC=${dist.MC||0} DL=${dist.DL||0} (total ${all.length})`);
