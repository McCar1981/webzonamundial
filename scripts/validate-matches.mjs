#!/usr/bin/env node
// scripts/validate-matches.mjs
//
// Compara src/data/matches.ts con el fixture oficial FIFA que el usuario
// pegue en docs/fixture-official-2026.md (o el path que pases con --src).
//
// El script:
//   1) NO modifica nada por defecto. Solo IMPRIME un reporte de discrepancias.
//   2) Con la flag --apply, escribe un patch en src/data/matches.fixed.ts
//      (NO sobrescribe el original — siempre genera un archivo nuevo para
//      que tú compares con git diff antes de mover).
//
// Formato esperado del .md oficial (líneas con datos, separador ` · ` o `|`):
//
//   1 · GA · J1 · 2026-06-11 · 13:00 · Estadio Azteca · Ciudad de México · MX · México vs Sudáfrica
//   2 · GA · J1 · 2026-06-11 · 12:00 · Mercedes-Benz Stadium · Atlanta · US · Corea del Sur vs República Checa
//   ...
//
//   Campos (separados por · o |):
//     [0] número del partido (1-104)
//     [1] grupo (GA..GL) o fase (R32, R16, QF, SF, THIRD, FINAL)
//     [2] jornada (J1/J2/J3) o "-" en KO
//     [3] fecha YYYY-MM-DD
//     [4] hora local HH:MM (24h)
//     [5] estadio
//     [6] ciudad/sede
//     [7] país sede (us/mx/ca)
//     [8] equipo local vs equipo visitante
//
// Líneas que empiecen con # o estén vacías → ignoradas (comentarios).
//
// Uso:
//   node scripts/validate-matches.mjs
//   node scripts/validate-matches.mjs --src docs/fixture-official-2026.md
//   node scripts/validate-matches.mjs --apply         # genera matches.fixed.ts
//   node scripts/validate-matches.mjs --only-groups   # solo valida grupos
//   node scripts/validate-matches.mjs --verbose       # imprime cada match

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const SRC = (() => {
  const i = args.indexOf("--src");
  return i >= 0 ? args[i + 1] : "docs/fixture-official-2026.md";
})();
const APPLY = args.includes("--apply");
const ONLY_GROUPS = args.includes("--only-groups");
const VERBOSE = args.includes("--verbose");

const MATCHES_TS_PATH = path.resolve("src/data/matches.ts");

/* -------------------------------------------------------------------------- */
/* Parseo del .md oficial                                                     */
/* -------------------------------------------------------------------------- */

const SEP_REGEX = /\s+[·|]\s+/g;

function normalizeTeam(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLine(line, idx) {
  // Limpia y separa
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  // Ignora markdown: tablas, headings, code fences, HTML comments
  if (
    trimmed.startsWith("|") ||
    trimmed.startsWith(">") ||
    trimmed.startsWith("```") ||
    trimmed.startsWith("<!--") ||
    trimmed.startsWith("---")
  ) {
    return null;
  }
  // Líneas que empiezan con dígito (número de partido) son las únicas
  // que tratamos como data. Cualquier otra cosa se ignora silenciosamente.
  if (!/^\d/.test(trimmed)) return null;

  const parts = trimmed.split(SEP_REGEX).map((s) => s.trim());
  if (parts.length < 9) {
    return { error: `línea ${idx + 1}: solo ${parts.length} campos, se esperan 9. "${trimmed}"` };
  }

  const [num, phaseRaw, jornadaRaw, dateRaw, timeRaw, stadiumRaw, cityRaw, countryRaw, teamsRaw] =
    parts;

  // Validaciones
  const n = parseInt(num, 10);
  if (Number.isNaN(n)) return { error: `línea ${idx + 1}: número de partido inválido "${num}"` };

  const phase = phaseRaw.toUpperCase().trim();
  let phaseId;
  let group = null;
  if (phase.match(/^G[A-L]$/)) {
    phaseId = "Fase de grupos";
    group = phase.charAt(1);
  } else if (phase === "R32") phaseId = "Dieciseisavos";
  else if (phase === "R16") phaseId = "Octavos de final";
  else if (phase === "QF") phaseId = "Cuartos de final";
  else if (phase === "SF") phaseId = "Semifinal";
  else if (phase === "THIRD") phaseId = "Tercer puesto";
  else if (phase === "FINAL") phaseId = "FINAL";
  else return { error: `línea ${idx + 1}: fase desconocida "${phaseRaw}"` };

  const jornada = jornadaRaw.match(/^J(\d)$/)?.[1];
  const j = jornada ? parseInt(jornada, 10) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw))
    return { error: `línea ${idx + 1}: fecha inválida "${dateRaw}"` };
  if (!/^\d{2}:\d{2}$/.test(timeRaw))
    return { error: `línea ${idx + 1}: hora inválida "${timeRaw}"` };

  const country = countryRaw.toLowerCase();
  if (!["us", "mx", "ca"].includes(country))
    return { error: `línea ${idx + 1}: país sede inválido "${countryRaw}"` };

  const teamsParts = teamsRaw.split(/\s+vs\s+/i).map((s) => s.trim());
  if (teamsParts.length !== 2)
    return { error: `línea ${idx + 1}: equipos inválidos "${teamsRaw}"` };

  return {
    i: n,
    p: phaseId,
    g: group,
    j,
    d: dateRaw,
    t: timeRaw,
    vn: stadiumRaw,
    vc: cityRaw,
    vf: country,
    h: teamsParts[0],
    a: teamsParts[1],
    hNorm: normalizeTeam(teamsParts[0]),
    aNorm: normalizeTeam(teamsParts[1]),
  };
}

function parseOfficial(srcPath) {
  if (!fs.existsSync(srcPath)) {
    console.error(`✗ No existe el archivo de fixture oficial: ${srcPath}`);
    console.error(`  Crea uno con el formato descrito en la cabecera del script.`);
    process.exit(1);
  }
  const txt = fs.readFileSync(srcPath, "utf8");
  const lines = txt.split(/\r?\n/);
  const out = [];
  const errs = [];
  lines.forEach((line, idx) => {
    const parsed = parseLine(line, idx);
    if (!parsed) return;
    if (parsed.error) {
      errs.push(parsed.error);
      return;
    }
    out.push(parsed);
  });
  if (errs.length) {
    console.error(`⚠ Se encontraron ${errs.length} errores de formato en ${srcPath}:`);
    errs.slice(0, 10).forEach((e) => console.error("  - " + e));
    if (errs.length > 10) console.error(`  ... (y ${errs.length - 10} más)`);
    process.exit(1);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Carga matches.ts actuales                                                  */
/* -------------------------------------------------------------------------- */

function loadCurrentMatches() {
  const txt = fs.readFileSync(MATCHES_TS_PATH, "utf8");
  const start = txt.indexOf("MATCHES: Match[] = [");
  const arrStart = txt.indexOf("[", start);
  const after = txt.indexOf("PHASE_COLORS", arrStart);
  const end = txt.lastIndexOf("];", after);
  const arrStr = txt
    .slice(arrStart, end + 1)
    .replace(/\/\/[^\n]*\n/g, "\n")
    .replace(/,\s*\]/g, "]");
  // eslint-disable-next-line no-eval
  const arr = eval(arrStr);
  return arr.map((m) => ({
    ...m,
    hNorm: normalizeTeam(m.h),
    aNorm: normalizeTeam(m.a),
  }));
}

/* -------------------------------------------------------------------------- */
/* Diff                                                                       */
/* -------------------------------------------------------------------------- */

function diffFields(current, official) {
  const out = [];
  const check = (field, label) => {
    if (String(current[field]) !== String(official[field])) {
      out.push(`${label}: "${current[field]}" → "${official[field]}"`);
    }
  };
  check("d", "fecha");
  check("t", "hora");
  check("vn", "estadio");
  check("vc", "ciudad");
  check("vf", "país sede");
  check("p", "fase");
  // teams: compara normalizado (ignora tildes/case)
  if (current.hNorm !== official.hNorm) {
    out.push(`local: "${current.h}" → "${official.h}"`);
  }
  if (current.aNorm !== official.aNorm) {
    out.push(`visitante: "${current.a}" → "${official.a}"`);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Reporte                                                                    */
/* -------------------------------------------------------------------------- */

function buildReport(current, official) {
  const byI = new Map(current.map((m) => [m.i, m]));
  const officialByI = new Map(official.map((m) => [m.i, m]));

  const ok = [];
  const changed = [];
  const missingInCurrent = [];
  const missingInOfficial = [];

  for (const o of official) {
    if (ONLY_GROUPS && o.p !== "Fase de grupos") continue;
    const c = byI.get(o.i);
    if (!c) {
      missingInCurrent.push(o);
      continue;
    }
    const diffs = diffFields(c, o);
    if (diffs.length === 0) {
      ok.push(o);
    } else {
      changed.push({ i: o.i, current: c, official: o, diffs });
    }
  }

  for (const c of current) {
    if (ONLY_GROUPS && c.p !== "Fase de grupos") continue;
    if (!officialByI.has(c.i)) missingInOfficial.push(c);
  }

  return { ok, changed, missingInCurrent, missingInOfficial };
}

function printReport(report) {
  console.log("");
  console.log("═".repeat(78));
  console.log(" REPORTE DE VALIDACIÓN — fixture oficial vs src/data/matches.ts");
  if (ONLY_GROUPS) console.log(" (solo fase de grupos)");
  console.log("═".repeat(78));

  console.log("");
  console.log(`✓ Partidos correctos:        ${report.ok.length}`);
  console.log(`⚠ Partidos con diferencias:  ${report.changed.length}`);
  console.log(`+ Faltan en matches.ts:      ${report.missingInCurrent.length}`);
  console.log(`- Sobran en matches.ts:      ${report.missingInOfficial.length}`);

  if (report.changed.length > 0) {
    console.log("");
    console.log("─── DIFERENCIAS DETECTADAS ───");
    report.changed.forEach((c) => {
      console.log(
        `\n  #${String(c.i).padStart(3, "0")}  ${c.official.p}  ${c.official.d} ${c.official.t}  ${c.official.h} vs ${c.official.a}`,
      );
      c.diffs.forEach((d) => console.log("        • " + d));
    });
  }

  if (report.missingInCurrent.length > 0) {
    console.log("\n─── FALTAN EN matches.ts (presentes en fixture oficial) ───");
    report.missingInCurrent.forEach((m) =>
      console.log(`  + #${m.i}  ${m.p}  ${m.d} ${m.t}  ${m.h} vs ${m.a}`),
    );
  }

  if (report.missingInOfficial.length > 0) {
    console.log("\n─── SOBRAN en matches.ts (NO están en fixture oficial) ───");
    report.missingInOfficial.forEach((m) =>
      console.log(`  - #${m.i}  ${m.p}  ${m.d} ${m.t}  ${m.h} vs ${m.a}`),
    );
  }

  console.log("\n" + "═".repeat(78));
  if (report.changed.length === 0 && report.missingInCurrent.length === 0) {
    console.log(" ✓ matches.ts coincide con el fixture oficial.");
  } else {
    console.log(" ⚠ Hay discrepancias. Revisa arriba. Con --apply se genera");
    console.log("   src/data/matches.fixed.ts con todos los partidos corregidos.");
  }
  console.log("═".repeat(78) + "\n");
}

/* -------------------------------------------------------------------------- */
/* Patch / apply                                                              */
/* -------------------------------------------------------------------------- */

function writeFixed(official) {
  const out = ["// AUTOGENERADO por scripts/validate-matches.mjs",
    "// Revisa con git diff antes de mover a matches.ts.",
    "",
    "export interface Match {",
    "  i: number;",
    "  g: string;",
    "  p: string;",
    "  j: number;",
    "  h: string;",
    "  hf: string;",
    "  a: string;",
    "  af: string;",
    "  d: string;",
    "  t: string;",
    "  vn: string;",
    "  vc: string;",
    "  vf: string;",
    "}",
    "",
    "export const MATCHES: Match[] = [",
  ];

  // El .md trae h/a como nombres pero NO flagcodes. Los recuperamos
  // del matches.ts original si los teams coinciden por nombre normalizado.
  const current = loadCurrentMatches();
  const flagByName = new Map();
  for (const m of current) {
    flagByName.set(m.hNorm, m.hf);
    flagByName.set(m.aNorm, m.af);
  }

  const sorted = [...official].sort((a, b) => a.i - b.i);
  sorted.forEach((m) => {
    const hf = flagByName.get(m.hNorm) || "??";
    const af = flagByName.get(m.aNorm) || "??";
    out.push(
      `  { "i": ${m.i}, "g": "${m.g ?? ""}", "p": "${m.p}", "j": ${m.j ?? 0}, ` +
        `"h": "${m.h}", "hf": "${hf}", "a": "${m.a}", "af": "${af}", ` +
        `"d": "${m.d}", "t": "${m.t}", "vn": "${m.vn}", "vc": "${m.vc}", "vf": "${m.vf}" },`,
    );
  });

  out.push("];");
  out.push("");

  const dst = path.resolve("src/data/matches.fixed.ts");
  fs.writeFileSync(dst, out.join("\n"), "utf8");

  // Reporta los flags faltantes (??)
  const missingFlags = sorted.filter(
    (m) => !flagByName.has(m.hNorm) || !flagByName.has(m.aNorm),
  );
  if (missingFlags.length) {
    console.log("\n⚠ Equipos sin flagcode auto-detectado (rellena a mano '??' en matches.fixed.ts):");
    missingFlags.forEach((m) => {
      const hfOk = flagByName.has(m.hNorm);
      const afOk = flagByName.has(m.aNorm);
      console.log(
        `  #${m.i}  ${hfOk ? "" : `h="${m.h}" `}${afOk ? "" : `a="${m.a}"`}`,
      );
    });
  }

  console.log(`\n✓ Generado: ${dst}`);
  console.log("  Próximos pasos:");
  console.log("    1. git diff src/data/matches.ts src/data/matches.fixed.ts");
  console.log("    2. Si todo OK: mv src/data/matches.fixed.ts src/data/matches.ts");
  console.log("    3. (o reemplaza solo los partidos cuestionados manualmente)");
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

console.log(`\nLeyendo fixture oficial desde: ${SRC}`);
const official = parseOfficial(SRC);
console.log(`✓ Parseados ${official.length} partidos del fixture oficial.`);

console.log(`Leyendo data actual: ${MATCHES_TS_PATH}`);
const current = loadCurrentMatches();
console.log(`✓ Cargados ${current.length} partidos de matches.ts.`);

if (VERBOSE) {
  console.log("\n--- 5 primeros partidos OFICIALES ---");
  official.slice(0, 5).forEach((m) => console.log(JSON.stringify(m, null, 0)));
  console.log("\n--- 5 primeros partidos ACTUALES ---");
  current.slice(0, 5).forEach((m) => console.log(JSON.stringify(m, null, 0)));
}

const report = buildReport(current, official);
printReport(report);

if (APPLY) {
  if (report.changed.length === 0 && report.missingInCurrent.length === 0) {
    console.log("Nada que aplicar — todo coincide.\n");
  } else {
    writeFixed(official);
  }
}
