// Audita la POSICIÓN de cada jugador del fantasy contra api-football.
// Empareja por nombre y compara la clase de posición:
//   PO↔Goalkeeper  DF↔Defender  MC↔Midfielder  DL↔Attacker
// Solo lectura. Uso: API_SPORTS_KEY=xxx NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/audit-positions-apifootball.mjs

import { readFileSync } from "node:fs";

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
// IDs absolutos masculinos confirmados (la búsqueda falla/ambigua en estos).
const FORCE_ID = {
  "republica-checa": 770, turquia: 777, ecuador: 2382, "costa-de-marfil": 1501,
  "corea-del-sur": 17, canada: 5529, noruega: 1090, australia: 20, alemania: 25,
  "paises-bajos": 1118,
};

// ── parse fantasy con posiciones ────────────────────────────────────────────
const src = readFileSync(new URL("../src/data/fantasy-rosters.ts", import.meta.url), "utf8");
const body = src.slice(src.indexOf("export const FANTASY_ROSTERS"));
const entryRe = /(?:"([a-z0-9-]+)"|([a-z0-9-]+))\s*:\s*r\(\[/g;
const rosters = {};
let m;
while ((m = entryRe.exec(body))) {
  const slug = m[1] || m[2];
  const from = entryRe.lastIndex;
  const close = body.indexOf("])", from);
  const chunk = body.slice(from, close);
  rosters[slug] = [...chunk.matchAll(/\[\s*"(PO|DF|MC|DL)"\s*,\s*"([^"]+)"/g)].map((x) => ({ pos: x[1], name: x[2] }));
}

// ── normalización + emparejado por nombre ────────────────────────────────────
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&apos;|&#39;/g, " ").replace(/[.''`-]/g, " ").replace(/\s+/g, " ").trim();
const toks = (s) => norm(s).split(" ").filter(Boolean);
const surname = (s) => { const t = toks(s); return t.length ? t[t.length - 1] : ""; };
const initial = (s) => { const t = toks(s); return t.length ? t[0][0] : ""; };
// devuelve el jugador de api que mejor empareja con `name`, o null.
// Reglas estrictas para NO confundir con otro jugador (p.ej. un portero que
// comparte apellido o nombre): exige apellido idéntico + inicial idéntica, o
// ≥2 tokens en común, o coincidencia exacta. Esto descarta colisiones tipo
// "Jordan" Henderson↔Pickford o los tres "Mendy"/"Diouf" de Senegal.
const findMatch = (name, apiPlayers) => {
  const na = norm(name), A = toks(name), surA = surname(name), iniA = initial(name);
  // 1) exacto
  for (const p of apiPlayers) if (norm(p.name) === na) return p;
  // 2) ≥2 tokens en común (nombre+apellido)
  for (const p of apiPlayers) {
    const B = toks(p.name); let c = 0; for (const t of A) if (B.includes(t)) c++;
    if (c >= 2) return p;
  }
  // 3) apellido idéntico + (inicial idéntica  ó  un lado es solo apellido)
  for (const p of apiPlayers) {
    const B = toks(p.name);
    if (surA && surA === surname(p.name)) {
      if (iniA && iniA === initial(p.name)) return p;
      if (A.length === 1 || B.length === 1) return p;
    }
  }
  return null;
};

// ── api-football ──────────────────────────────────────────────────────────────
async function api(path) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": KEY }, cache: "no-store" });
      if (r.ok) return r.json();
    } catch { /* reintento */ }
    await new Promise((res) => setTimeout(res, 600));
  }
  return null;
}
const BAD = /\b(W|women|u-?\d+|olympic|youth|amateur|futsal|beach)\b/i;
async function resolveTeamId(name) {
  const d = await api(`/teams?search=${encodeURIComponent(name)}`);
  if (!d?.response?.length) return null;
  let nat = d.response.filter((x) => x.team?.national && !BAD.test(x.team.name || ""));
  if (!nat.length) nat = d.response.filter((x) => x.team?.national);
  const pick = (nat.length ? nat : d.response)[0];
  return pick?.team?.id ?? null;
}
async function squad(id) {
  const d = await api(`/players/squads?team=${id}`);
  const r = d?.response?.[0];
  return r ? r.players : [];
}

// PO↔Goalkeeper DF↔Defender MC↔Midfielder DL↔Attacker
const CLASS = { PO: "Goalkeeper", DF: "Defender", MC: "Midfielder", DL: "Attacker" };
const FANTASY_LABEL = { PO: "portero", DF: "defensa", MC: "medio", DL: "delantero" };
// gravedad: GK vs no-GK = grave; DEF↔FWD = grave; DEF↔MID / MID↔FWD = ambiguo
const severity = (fp, ap) => {
  if (fp === "Goalkeeper" || ap === "Goalkeeper") return fp === ap ? null : "GRAVE";
  if ((fp === "Defender" && ap === "Attacker") || (fp === "Attacker" && ap === "Defender")) return "GRAVE";
  if (fp === ap) return null;
  return "ambiguo";
};

const slugs = Object.keys(SEARCH);
const graves = [], ambiguos = [], noMatch = [], teamErr = [];
for (const slug of slugs) {
  const fantasy = rosters[slug];
  if (!fantasy) continue;
  const id = FORCE_ID[slug] ?? (await resolveTeamId(SEARCH[slug]));
  if (!id) { teamErr.push(`${slug} (sin id)`); continue; }
  const ap = await squad(id);
  if (!ap.length) { teamErr.push(`${slug} (squad vacío #${id})`); continue; }
  let unmatched = 0;
  for (const fp of fantasy) {
    const match = findMatch(fp.name, ap);
    if (!match) { unmatched++; continue; }
    const want = CLASS[fp.pos];
    const sev = severity(want, match.position);
    if (sev === "GRAVE") graves.push({ slug, name: fp.name, fantasy: FANTASY_LABEL[fp.pos], real: match.position, api: match.name });
    else if (sev === "ambiguo") ambiguos.push({ slug, name: fp.name, fantasy: FANTASY_LABEL[fp.pos], real: match.position, api: match.name });
  }
  if (unmatched) noMatch.push(`${slug}:${unmatched}`);
}

console.log(`\n========= AUDITORÍA DE POSICIONES =========`);
console.log(`GRAVES (portero mal puesto, o defensa↔delantero): ${graves.length}`);
for (const g of graves) console.log(`  ✗ ${g.slug}: ${g.name} → fantasy="${g.fantasy}" / api="${g.real}"`);
console.log(`\nAMBIGUOS (medio↔delantero, defensa↔medio — criterio discutible): ${ambiguos.length}`);
for (const a of ambiguos) console.log(`  ~ ${a.slug}: ${a.name} → fantasy="${a.fantasy}" / api="${a.real}"`);
console.log(`\nNo emparejados por nombre (no auditables): ${noMatch.join(", ") || "0"}`);
if (teamErr.length) console.log(`Equipos sin datos: ${teamErr.join(", ")}`);
