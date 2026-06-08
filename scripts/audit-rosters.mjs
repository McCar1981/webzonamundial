import { readFileSync, readdirSync } from "node:fs";

// ── 1. Parsear FANTASY_ROSTERS (textual) ──────────────────────────────────
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

// ── 2. Normalizador de nombres para comparar ─────────────────────────────
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.''`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Apellido(s) clave: ultimas 1-2 palabras, para emparejar "Lee Kang-In" vs "Kang-in Lee" aprox.
const lastTokens = (s) => {
  const t = norm(s).split(" ").filter(Boolean);
  return new Set(t);
};
const tokenOverlap = (a, b) => {
  const A = lastTokens(a), B = lastTokens(b);
  let common = 0;
  for (const x of A) if (B.has(x)) common++;
  return common;
};
// ¿el nombre `n` del fantasy aparece en la lista de la ficha?
const existsIn = (n, list) => {
  const nn = norm(n);
  if (list.some((x) => norm(x) === nn)) return true;
  // match laxo: ≥2 tokens en común, o 1 token largo (apellido) en común
  return list.some((x) => {
    const ov = tokenOverlap(n, x);
    if (ov >= 2) return true;
    if (ov === 1) {
      const shared = [...lastTokens(n)].find((t) => lastTokens(x).has(t));
      return shared && shared.length >= 5;
    }
    return false;
  });
};

// ── 3. Leer fichas BIBLIA (data/teams) → likely_squad ─────────────────────
const teamsDir = new URL("../data/teams/", import.meta.url);
const files = readdirSync(teamsDir).filter((f) => f.endsWith(".json"));

let totalMissing = 0, totalExtra = 0, teamsWithIssues = 0;
const report = [];

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  const fantasy = rosters[slug];
  if (!fantasy) continue;
  let ficha;
  try {
    ficha = JSON.parse(readFileSync(new URL(file, teamsDir), "utf8"));
  } catch {
    continue;
  }
  const wc = ficha.wc_2026 || {};
  const ls = Array.isArray(wc.likely_squad) ? wc.likely_squad : [];
  if (ls.length === 0) continue;
  const fichaNames = ls.map((p) => p.display_name || p.full_name).filter(Boolean);

  // Ausentes: en la ficha pero NO en el fantasy
  const missing = fichaNames.filter((fn) => !existsIn(fn, fantasy));
  // Sobrantes: en el fantasy pero NO en la ficha (posible nombre viejo / mal escrito)
  const extra = fantasy.filter((fn) => !existsIn(fn, fichaNames));

  if (missing.length || extra.length) {
    teamsWithIssues++;
    totalMissing += missing.length;
    totalExtra += extra.length;
    report.push({
      slug,
      status: wc.squad_announced_status,
      date: wc.squad_announced_date,
      fantasyN: fantasy.length,
      fichaN: fichaNames.length,
      missing,
      extra,
    });
  }
}

report.sort((a, b) => b.missing.length + b.extra.length - (a.missing.length + a.extra.length));
console.log(`Fichas comparadas con likely_squad. Selecciones con diferencias: ${teamsWithIssues}`);
console.log(`Total ausentes (en ficha, NO en fantasy): ${totalMissing}`);
console.log(`Total sobrantes (en fantasy, NO en ficha): ${totalExtra}\n`);
console.log("NOTA: la ficha 'likely_squad' es una lista probable, no es la oficial; sirve de pista.\n");

for (const r of report) {
  console.log(`\n=== ${r.slug} (fantasy ${r.fantasyN} vs ficha ${r.fichaN}) [${r.status}/${r.date}] ===`);
  if (r.missing.length) console.log(`  AUSENTES en fantasy: ${r.missing.join(", ")}`);
  if (r.extra.length) console.log(`  SOBRANTES en fantasy: ${r.extra.join(", ")}`);
}
