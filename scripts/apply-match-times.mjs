#!/usr/bin/env node
// scripts/apply-match-times.mjs
//
// Lee docs/fixture-times-2026.md y actualiza SOLO el campo `t` (hora)
// de cada partido en src/data/matches.ts. Marca todas las horas como ET
// con un comentario en el header del archivo.
//
// NO toca: fecha, sede, equipos, flags, etc. Solo la hora.
//
// Uso:
//   node scripts/apply-match-times.mjs            # dry-run, no modifica
//   node scripts/apply-match-times.mjs --apply    # escribe en matches.ts
//
// Formato del .md (líneas relevantes):
//   1: 15:00        (con número de partido)
//   2 · 12:00
//   3 = 12:00
//   15:00           (sin número, asumimos orden 1..104)
//
// Líneas con # vacías, o sin patrón HH:MM, se ignoran.

import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");

const SRC_MD = path.resolve("docs/fixture-times-2026.md");
const SRC_TS = path.resolve("src/data/matches.ts");

if (!fs.existsSync(SRC_MD)) {
  console.error(`✗ No encontré ${SRC_MD}`);
  process.exit(1);
}
if (!fs.existsSync(SRC_TS)) {
  console.error(`✗ No encontré ${SRC_TS}`);
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* Parse las 104 horas del .md                                                */
/* -------------------------------------------------------------------------- */

function parseHours() {
  const txt = fs.readFileSync(SRC_MD, "utf8");
  const lines = txt.split(/\r?\n/);

  // Captura "5 · 18:00" o "5: 18:00" o "5 = 18:00" o solo "18:00"
  const reWithNum = /^\s*(\d+)\s*[·:=|\-]\s*(\d{1,2}):(\d{2})\s*$/;
  const reJustTime = /^\s*(\d{1,2}):(\d{2})\s*$/;

  const explicit = new Map();
  const sequence = [];
  let insideCodeFence = false;
  let insideHoursMarker = false;

  for (const lineRaw of lines) {
    const line = lineRaw.trim();

    // Toggle markers: solo procesamos líneas entre BEGIN HOURS y END HOURS
    if (line.includes("BEGIN HOURS")) {
      insideHoursMarker = true;
      continue;
    }
    if (line.includes("END HOURS")) {
      insideHoursMarker = false;
      continue;
    }

    // Si hay marcadores BEGIN/END, solo procesamos lo que está dentro.
    // Si NO los hay (futuro uso flexible), procesamos todo.
    const hasMarkers = lines.some((l) => l.includes("BEGIN HOURS"));
    if (hasMarkers && !insideHoursMarker) continue;

    // Detecta bloques de código ```
    if (line.startsWith("```")) {
      insideCodeFence = !insideCodeFence;
      continue;
    }
    if (insideCodeFence) continue;

    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("|")) continue;
    if (line.startsWith(">")) continue;
    if (line.startsWith("<!--")) continue;
    if (line.startsWith("-") && !/^\-?\s*\d/.test(line)) continue;

    let m = line.match(reWithNum);
    if (m) {
      const idx = parseInt(m[1], 10);
      const h = m[2].padStart(2, "0");
      const min = m[3];
      if (idx >= 1 && idx <= 104) {
        explicit.set(idx, `${h}:${min}`);
      }
      continue;
    }
    m = line.match(reJustTime);
    if (m) {
      const h = m[1].padStart(2, "0");
      const min = m[2];
      sequence.push(`${h}:${min}`);
      continue;
    }
  }

  // Si hay explícitas, prioriza explícitas
  if (explicit.size > 0) {
    return { mode: "explicit", explicit };
  }
  if (sequence.length > 0) {
    return { mode: "sequence", sequence };
  }
  return { mode: "empty" };
}

const parsed = parseHours();
if (parsed.mode === "empty") {
  console.error(
    "✗ No encontré ninguna hora en docs/fixture-times-2026.md.\n" +
      "  Pega las 104 horas entre las marcas BEGIN HOURS / END HOURS.",
  );
  process.exit(1);
}

console.log(`✓ Parseadas en modo "${parsed.mode}":`);
if (parsed.mode === "explicit") {
  console.log(`  ${parsed.explicit.size} horas explícitas (con número de partido)`);
  if (parsed.explicit.size < 104) {
    const missing = [];
    for (let i = 1; i <= 104; i++) if (!parsed.explicit.has(i)) missing.push(i);
    console.log(`  ⚠ Faltan ${missing.length} partidos: ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "..." : ""}`);
  }
} else {
  console.log(`  ${parsed.sequence.length} horas secuenciales (orden 1..N)`);
  if (parsed.sequence.length !== 104) {
    console.log(`  ⚠ Esperaba 104, recibí ${parsed.sequence.length}. Solo se aplicarán las primeras.`);
  }
}

/* -------------------------------------------------------------------------- */
/* Carga matches.ts                                                           */
/* -------------------------------------------------------------------------- */

const tsTxt = fs.readFileSync(SRC_TS, "utf8");
const arrStart = tsTxt.indexOf("MATCHES: Match[] = [");
const arrBracketStart = tsTxt.indexOf("[", arrStart);
const phaseColorIdx = tsTxt.indexOf("PHASE_COLORS", arrBracketStart);
const arrBracketEnd = tsTxt.lastIndexOf("];", phaseColorIdx);

const head = tsTxt.slice(0, arrBracketStart + 1);
const arrBody = tsTxt.slice(arrBracketStart + 1, arrBracketEnd);
const tail = tsTxt.slice(arrBracketEnd);

// Parse y reemplaza partido a partido, preservando comentarios y orden.
// Regex que captura una línea de partido: encuentra `"i":N` ... hasta el `}`.
const matchLineRe =
  /(\{\s*"i":\s*)(\d+)([^}]*?"t":\s*")(\d{1,2}:\d{2})("[^}]*?\})/g;

let updatedCount = 0;
let unchangedCount = 0;
const sequenceArr = parsed.mode === "sequence" ? parsed.sequence : null;
let seqIdx = 0;

const newBody = arrBody.replace(matchLineRe, (full, p1, iStr, p3, oldT, p5) => {
  const i = parseInt(iStr, 10);
  let newT;
  if (parsed.mode === "explicit") {
    newT = parsed.explicit.get(i);
  } else {
    newT = sequenceArr?.[seqIdx];
    seqIdx++;
  }
  if (!newT) return full;
  if (newT === oldT) {
    unchangedCount++;
    return full;
  }
  updatedCount++;
  return `${p1}${iStr}${p3}${newT}${p5}`;
});

console.log(`\n→ Cambios calculados:`);
console.log(`  • ${updatedCount} partidos con hora distinta a aplicar`);
console.log(`  • ${unchangedCount} partidos ya tenían la hora correcta`);

if (!APPLY) {
  console.log(`\n[DRY RUN] No se ha escrito nada. Para aplicar:`);
  console.log(`  node scripts/apply-match-times.mjs --apply`);
  process.exit(0);
}

/* -------------------------------------------------------------------------- */
/* Aplica                                                                     */
/* -------------------------------------------------------------------------- */

// Añade comentario al inicio del archivo indicando que las horas son ET
const TIMEZONE_NOTE = `// ⏰ HORARIOS: todas las horas del campo "t" están en Eastern Time (ET) de
//    EE.UU. Fuente: FIFA Match Schedule v17 (10/04/2026).
//    Para convertir a la zona horaria del usuario, usar el helper
//    src/lib/bracket/match-time.ts (Intl.DateTimeFormat).
`;

let finalTxt = head + newBody + tail;
if (!finalTxt.includes("HORARIOS: todas las horas")) {
  finalTxt = TIMEZONE_NOTE + finalTxt;
}

fs.writeFileSync(SRC_TS, finalTxt, "utf8");
console.log(`\n✓ Escrito ${SRC_TS}`);
console.log(`  Verifica con: git diff src/data/matches.ts`);
