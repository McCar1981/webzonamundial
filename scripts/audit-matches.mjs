// Audita src/data/matches.ts buscando bugs de duplicados.
// En fase de grupos cada equipo juega exactamente UNA vez contra
// cada uno de los otros 3 — si detectamos pares que se repiten,
// algo está mal.

import { readFileSync } from "node:fs";

const ts = readFileSync("src/data/matches.ts", "utf-8");
const matchLine = /\{ "i": \d+, .*? \}/g;
const matches = [];
for (const line of ts.split("\n")) {
  const m = line.match(matchLine);
  if (m) {
    try { matches.push(JSON.parse(m[0])); } catch {}
  }
}

const groups = {};
for (const m of matches) {
  if (!m.g) continue; // solo fase de grupos
  if (!groups[m.g]) groups[m.g] = [];
  groups[m.g].push(m);
}

console.log("=== AUDITORÍA matches.ts ===\n");
let bugCount = 0;

for (const [letter, gms] of Object.entries(groups).sort()) {
  // Recolectar todos los equipos
  const teams = new Set();
  for (const m of gms) {
    teams.add(m.hf);
    teams.add(m.af);
  }
  const teamList = Array.from(teams);

  // Generar todos los pares esperados (4 equipos = 6 pares)
  const expectedPairs = new Set();
  for (let i = 0; i < teamList.length; i++) {
    for (let j = i + 1; j < teamList.length; j++) {
      const [a, b] = [teamList[i], teamList[j]].sort();
      expectedPairs.add(`${a}-${b}`);
    }
  }

  // Recolectar pares que SÍ están
  const actualPairs = new Map();
  for (const m of gms) {
    const [a, b] = [m.hf, m.af].sort();
    const key = `${a}-${b}`;
    if (!actualPairs.has(key)) actualPairs.set(key, []);
    actualPairs.get(key).push({ j: m.j, i: m.i, h: m.h, a: m.a, d: m.d });
  }

  console.log(`Grupo ${letter} — ${teamList.join(", ")} (${gms.length} partidos, esperado 6)`);

  // Pares duplicados
  for (const [pair, occurs] of actualPairs) {
    if (occurs.length > 1) {
      bugCount++;
      console.log(`  ⚠️ DUPLICADO: ${pair} aparece ${occurs.length} veces`);
      occurs.forEach(o => console.log(`     · J${o.j} i=${o.i} ${o.h} vs ${o.a} ${o.d}`));
    }
  }
  // Pares faltantes
  for (const expected of expectedPairs) {
    if (!actualPairs.has(expected)) {
      bugCount++;
      console.log(`  ⚠️ FALTA: ${expected} no aparece en ningún partido`);
    }
  }
  console.log();
}

console.log(`Total de bugs detectados: ${bugCount}`);
