// Cruza FANTASY_ROSTERS (src/data/fantasy-rosters.ts) contra las plantillas
// actuales de api-football (/players/squads). Resuelve el ID de cada selección
// nacional por búsqueda y filtra national:true. Solo lectura / análisis.
//
// Uso:  API_SPORTS_KEY=xxxx node scripts/verify-rosters-apifootball.mjs
// (TLS del host requiere a veces NODE_TLS_REJECT_UNAUTHORIZED=0)

import { readFileSync } from "node:fs";

const KEY = process.env.API_SPORTS_KEY;
if (!KEY) { console.error("Falta API_SPORTS_KEY"); process.exit(1); }
const BASE = "https://v3.football.api-sports.io";

// ── slug → nombre de búsqueda en api-football (selección nacional) ──────────
const SEARCH = {
  mexico: "Mexico", "corea-del-sur": "Korea Republic", sudafrica: "South Africa",
  "republica-checa": "Czechia", canada: "Canada", suiza: "Switzerland", qatar: "Qatar",
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

// IDs absolutos masculinos confirmados para los que la búsqueda falla/ambigua.
const FORCE_ID = {
  "republica-checa": 770,  // Czech Republic (24=Polonia ✗)
  turquia: 777,            // Türkiye (21=Dinamarca ✗)
  ecuador: 2382,           // Ecuador
  "costa-de-marfil": 1501, // Ivory Coast
  "corea-del-sur": 17,     // South Korea sénior (10177=U23 ✗)
  canada: 5529,            // Canadá masculino (22=Irán ✗, 1717=W ✗)
  noruega: 1090,           // Noruega (búsqueda no la muestra)
  australia: 20,           // Australia
  alemania: 25,            // Germany
};

// ── 1. Parsear FANTASY_ROSTERS ──────────────────────────────────────────────
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
  const names = [...chunk.matchAll(/\[\s*"(?:PO|DF|MC|DL)"\s*,\s*"([^"]+)"/g)].map((x) => x[1]);
  rosters[slug] = names;
}

// ── 2. Normalizador + matcher laxo (igual criterio que audit-rosters) ───────
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&apos;|&#39;/g, " ").replace(/[.''`-]/g, " ").replace(/\s+/g, " ").trim();
const toks = (s) => norm(s).split(" ").filter(Boolean);
// surname = último token "largo" (≥3), inicial = primera letra del primer token
const surname = (s) => { const t = toks(s); return t.length ? t[t.length - 1] : ""; };
const initial = (s) => { const t = toks(s); return t.length ? t[0][0] : ""; };
// ¿el nombre `a` (de un lado) está representado en la lista `list` del otro?
// Maneja "J. Tah" ↔ "Jonathan Tah": mismo apellido + (misma inicial o un lado es inicial).
const existsIn = (a, list) => {
  const na = norm(a), A = toks(a), surA = surname(a), iniA = initial(a);
  return list.some((b) => {
    if (norm(b) === na) return true;
    const B = toks(b);
    let common = 0; for (const t of A) if (B.includes(t)) common++;
    if (common >= 2) return true;
    const surB = surname(b);
    if (surA && surA === surB) {
      // apellido idéntico: confirmar con inicial del nombre (o si algún lado solo tiene apellido)
      if (A.length === 1 || B.length === 1) return true;
      if (iniA && iniA === initial(b)) return true;
      if (surA.length >= 5) return true; // apellido largo distintivo
    }
    if (common === 1) { const sh = A.find((t) => B.includes(t)); if (sh && sh.length >= 5) return true; }
    return false;
  });
};

// ── 3. api-football helpers ─────────────────────────────────────────────────
async function api(path) {
  const r = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": KEY }, cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}
// Excluir femeninas / juveniles / olímpicas: queremos la absoluta masculina.
const BAD = /\b(W|women|u-?\d+|olympic|youth|amateur|futsal|beach)\b/i;
async function resolveTeamId(name) {
  const d = await api(`/teams?search=${encodeURIComponent(name)}`);
  if (!d?.response?.length) return null;
  let nat = d.response.filter((x) => x.team?.national && !BAD.test(x.team.name || ""));
  if (!nat.length) nat = d.response.filter((x) => x.team?.national);
  if (!nat.length) nat = d.response.filter((x) => !BAD.test(x.team?.name || ""));
  const pick = (nat.length ? nat : d.response)[0];
  return pick?.team ? { id: pick.team.id, name: pick.team.name } : null;
}
async function squad(id) {
  const d = await api(`/players/squads?team=${id}`);
  const r = d?.response?.[0];
  return r ? r.players.map((p) => p.name) : [];
}

// ── 4. Recorrer las 48 ──────────────────────────────────────────────────────
const slugs = Object.keys(SEARCH);
const report = [];
let unresolved = [];
for (const slug of slugs) {
  const fantasy = rosters[slug];
  if (!fantasy) { report.push({ slug, err: "sin roster fantasy" }); continue; }
  let team = FORCE_ID[slug] ? { id: FORCE_ID[slug], name: SEARCH[slug] } : await resolveTeamId(SEARCH[slug]);
  if (!team) { unresolved.push(slug); report.push({ slug, err: "no se resolvió team id" }); continue; }
  const off = await squad(team.id);
  if (off.length === 0) { report.push({ slug, team: `${team.name}#${team.id}`, err: "squad vacío" }); continue; }
  // Ausentes: en api-football pero NO en fantasy → candidatos a añadir
  const missing = off.filter((n) => !existsIn(n, fantasy));
  // Sobrantes: en fantasy pero NO en api-football → posible desactualizado
  const extra = fantasy.filter((n) => !existsIn(n, off));
  report.push({ slug, team: `${team.name}#${team.id}`, fN: fantasy.length, oN: off.length, missing, extra, off });
}

// ── 5. Imprimir ──────────────────────────────────────────────────────────────
const withDiff = report.filter((r) => !r.err && (r.missing?.length || r.extra?.length));
console.log(`\nResueltas: ${report.filter((r) => !r.err).length}/${slugs.length}. Con diferencias: ${withDiff.length}`);
if (unresolved.length) console.log(`No resueltas: ${unresolved.join(", ")}`);
console.log(`\nNOTA: /players/squads = plantilla "actual" del club nacional en api-football; aproxima a la convocatoria pero no es la lista oficial WC.\n`);
for (const r of report.filter((x) => x.err)) console.log(`!! ${r.slug}: ${r.err}${r.team ? " ("+r.team+")" : ""}`);
for (const r of withDiff) {
  console.log(`\n=== ${r.slug} → ${r.team} (fantasy ${r.fN} vs api ${r.oN}) ===`);
  if (r.missing.length) console.log(`  EN API, FALTAN en fantasy: ${r.missing.join(", ")}`);
  if (r.extra.length) console.log(`  EN FANTASY, no en api: ${r.extra.join(", ")}`);
}
