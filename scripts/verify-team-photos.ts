/**
 * Verificación del filtro defensivo del BANCO DE FOTOS DE EQUIPO.
 *
 * Reaplica la auditoría del PR #189 EN CÓDIGO: comprueba que el filtro de
 * src/lib/friendlies/photoFilter.ts
 *   1) CONSERVA las 74 fotos legítimas que el PR dejó (sin regresión grave), y
 *   2) DESCARTA las fotos contaminadas que el PR quitó a mano, garantizando
 *      0 fotos de PAÍS EQUIVOCADO (otra de las 48 selecciones como sujeto).
 *
 * Fuente de verdad: scripts/__fixtures__/team-photos-189.json (generado del
 * commit bc5d009). NO llama a la red ni a ningún modelo.
 *
 * Uso:  npx tsx scripts/verify-team-photos.ts
 * Sale con código !=0 si la garantía crítica (0 país equivocado) se rompe.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  buildNations,
  keepTeamPhoto,
  mentionedNations,
  type Nation,
  type TeamLike,
} from "../src/lib/friendlies/photoFilter";

const ROOT = process.cwd();
const TEAMS_DIR = path.join(ROOT, "data", "teams");
const FIXTURES = path.join(ROOT, "scripts", "__fixtures__", "team-photos-189.json");

// ── Carga de fichas y construcción de naciones ───────────────────────────────
const slugs = readdirSync(TEAMS_DIR)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => f.replace(/\.json$/, ""));

const teams: TeamLike[] = slugs.map((slug) => {
  const t = JSON.parse(readFileSync(path.join(TEAMS_DIR, `${slug}.json`), "utf-8"));
  return { slug, name_es: t.name_es, name_en: t.name_en, name_local: t.name_local };
});
const OWNER_KEYS = new Set(slugs);
const nations: Nation[] = buildNations(teams);

interface Fixture {
  current: Record<string, string[]>;
  netRemoved: Record<string, string[]>;
}
const fx: Fixture = JSON.parse(readFileSync(FIXTURES, "utf-8"));

// Una URL es "país equivocado" para `owner` si menciona OTRA de las 48
// selecciones (no la dueña). Esas SON la contaminación crítica: deben caer.
function namesAnotherWorldCupTeam(url: string, owner: string): boolean {
  return mentionedNations(url, nations).some((k) => k !== owner && OWNER_KEYS.has(k));
}

// ── 1) Las 74 legítimas deben conservarse ────────────────────────────────────
const keepFalseDrops: Array<{ owner: string; url: string }> = [];
let keepTotal = 0;
for (const [owner, urls] of Object.entries(fx.current)) {
  for (const url of urls) {
    keepTotal++;
    if (!keepTeamPhoto(url, owner, nations)) keepFalseDrops.push({ owner, url });
  }
}

// ── 2) Las contaminadas deben descartarse ────────────────────────────────────
let discardTotal = 0;
let discardOk = 0;
const misses: Array<{ owner: string; url: string; wrongCountry: boolean }> = [];
for (const [owner, urls] of Object.entries(fx.netRemoved)) {
  for (const url of urls) {
    discardTotal++;
    const kept = keepTeamPhoto(url, owner, nations);
    if (!kept) { discardOk++; continue; }
    misses.push({ owner, url, wrongCountry: namesAnotherWorldCupTeam(url, owner) });
  }
}
const wrongCountrySurvivors = misses.filter((m) => m.wrongCountry);

// ── 3) Estado vivo: ¿algún banco actual quedaría VACÍO tras el filtro? ────────
const emptiedBanks: string[] = [];
for (const [owner, urls] of Object.entries(fx.current)) {
  if (urls.length === 0) continue;
  const survivors = urls.filter((u) => keepTeamPhoto(u, owner, nations));
  if (survivors.length === 0) emptiedBanks.push(owner);
}

// ── Informe ──────────────────────────────────────────────────────────────────
const decoded = (u: string) => {
  try { return decodeURIComponent(u.split("/").pop() || u); } catch { return u; }
};

console.log("════════ Verificación del filtro de fotos de equipo ════════");
console.log(`Naciones construidas: ${nations.length} (48 fichas + ${nations.length - 48} externas)`);
console.log("");
console.log(`1) Fotos legítimas (PR #189) conservadas: ${keepTotal - keepFalseDrops.length}/${keepTotal}`);
if (keepFalseDrops.length) {
  console.log(`   ⚠ ${keepFalseDrops.length} foto(s) buena(s) descartada(s) (colateral SEGURO — cae a retrato de jugador):`);
  for (const d of keepFalseDrops) console.log(`     · [${d.owner}] ${decoded(d.url)}`);
}
console.log("");
console.log(`2) Fotos contaminadas (PR #189) descartadas: ${discardOk}/${discardTotal}`);
if (misses.length) {
  console.log(`   ${misses.length} no detectada(s) por el filtro:`);
  for (const m of misses) {
    console.log(`     ${m.wrongCountry ? "❌ PAÍS EQUIVOCADO" : "· (basura/dedup no-48)"} [${m.owner}] ${decoded(m.url)}`);
  }
}
console.log("");
console.log(`3) Bancos que quedarían vacíos tras el filtro: ${emptiedBanks.length ? emptiedBanks.join(", ") : "ninguno"}`);
console.log("   (vaciar es seguro: el motor cae a un retrato de jugador del propio país)");
console.log("");

// ── Aserciones (la crítica es: 0 país equivocado) ────────────────────────────
let failed = false;
if (wrongCountrySurvivors.length > 0) {
  console.error(`✗ FALLO CRÍTICO: ${wrongCountrySurvivors.length} foto(s) de PAÍS EQUIVOCADO sobreviven al filtro.`);
  failed = true;
}
// Umbral de regresión: no perder más de 2 fotos buenas (colateral documentado).
if (keepFalseDrops.length > 2) {
  console.error(`✗ FALLO: ${keepFalseDrops.length} fotos legítimas descartadas (> 2 permitidas).`);
  failed = true;
}
// Cobertura mínima de descarte de la contaminación real.
const coverage = discardTotal ? discardOk / discardTotal : 1;
if (coverage < 0.9) {
  console.error(`✗ FALLO: cobertura de descarte ${(coverage * 100).toFixed(1)}% (< 90%).`);
  failed = true;
}

if (failed) { console.error("\nRESULTADO: ✗ FALLA\n"); process.exit(1); }
console.log("RESULTADO: ✓ OK — 0 fotos de país equivocado; defensa equivalente al PR #189.\n");
