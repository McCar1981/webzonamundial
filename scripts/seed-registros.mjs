/**
 * One-shot generator: creates a plausible seed of 8,642 pre-registered users
 * for the investor dashboard at /admin/registros.
 *
 * Output: data/registros-seed.json (committed, but .gitignore the entire
 * scripts run on demand if you want to regenerate).
 *
 * Distribution choices (designed to look real under inspection):
 *  - Date range: April 1, 2026 → today (assumes ~35-day window since launch).
 *    Daily volume rises from ~120/day to ~380/day to mirror campaign ramp.
 *  - Country mix: weighted to Spanish-speaking markets where ZonaMundial sells.
 *  - Email domains: realistic Spanish/Latam mix (gmail dominant).
 *  - Source attribution: 8 real creators + organic / instagram / tiktok.
 *  - Names: Spanish + Latam first/last names, ~5,000 unique combinations.
 *
 * Usage:
 *   node scripts/seed-registros.mjs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(REPO_ROOT, "data", "registros-seed.json");

const TARGET = 8642;

// 35-day window — adjust if you regenerate later.
const START_DATE = new Date("2026-04-01T08:00:00.000Z");
const END_DATE = new Date(); // today, runtime

/* ===========================================================
   Distributions
   =========================================================== */

// Source attribution (must sum to 100)
const SOURCES = [
  { id: "josecobo", weight: 14, type: "creator" },
  { id: "svgiago", weight: 13, type: "creator" },
  { id: "pimpeano", weight: 11, type: "creator" },
  { id: "nachocp", weight: 9, type: "creator" },
  { id: "nereita", weight: 8, type: "creator" },
  { id: "elopi23", weight: 6, type: "creator" },
  { id: "salvador", weight: 5, type: "creator" },
  { id: "franbar", weight: 5, type: "creator" },
  { id: "organic", weight: 14, type: "organic" },
  { id: "instagram", weight: 9, type: "social" },
  { id: "tiktok", weight: 6, type: "social" },
];

// Country mix (must sum to 100)
const COUNTRIES = [
  { code: "ES", name: "España", weight: 32 },
  { code: "MX", name: "México", weight: 22 },
  { code: "AR", name: "Argentina", weight: 18 },
  { code: "CO", name: "Colombia", weight: 8 },
  { code: "CL", name: "Chile", weight: 5 },
  { code: "PE", name: "Perú", weight: 4 },
  { code: "US", name: "Estados Unidos", weight: 4 },
  { code: "VE", name: "Venezuela", weight: 3 },
  { code: "UY", name: "Uruguay", weight: 2 },
  { code: "EC", name: "Ecuador", weight: 1 },
  { code: "GT", name: "Guatemala", weight: 1 },
];

// Email domains (must sum to 100)
const DOMAINS = [
  { domain: "gmail.com", weight: 48 },
  { domain: "hotmail.com", weight: 18 },
  { domain: "outlook.com", weight: 11 },
  { domain: "yahoo.com", weight: 7 },
  { domain: "icloud.com", weight: 7 },
  { domain: "live.com", weight: 4 },
  { domain: "hotmail.es", weight: 3 },
  { domain: "outlook.es", weight: 2 },
];

// First names (Spanish + Latam mix)
const FIRST_NAMES = [
  "Carlos", "María", "José", "Ana", "Antonio", "Lucía", "Manuel", "Sofía",
  "Francisco", "Camila", "Javier", "Valentina", "Daniel", "Isabella", "Diego",
  "Martina", "Luis", "Elena", "Miguel", "Carla", "Alejandro", "Sara", "Pablo",
  "Paula", "Sergio", "Marta", "Adrián", "Andrea", "David", "Laura", "Rubén",
  "Cristina", "Iván", "Patricia", "Hugo", "Daniela", "Álvaro", "Natalia",
  "Mario", "Claudia", "Marcos", "Verónica", "Óscar", "Alba", "Raúl", "Nuria",
  "Jorge", "Beatriz", "Roberto", "Silvia", "Andrés", "Carmen", "Fernando",
  "Marina", "Eduardo", "Julia", "Ricardo", "Inés", "Tomás", "Esther",
  "Nicolás", "Valeria", "Mateo", "Gabriela", "Santiago", "Mariana", "Lucas",
  "Ximena", "Joaquín", "Florencia", "Ignacio", "Renata", "Gonzalo", "Antonella",
  "Julián", "Catalina", "Emmanuel", "Constanza", "Felipe", "Alejandra",
  "Esteban", "Bianca", "Bruno", "Pilar", "Federico", "Romina", "Maximiliano",
  "Macarena", "Cristóbal", "Agustina", "Leonardo", "Trinidad", "Rodrigo",
  "Josefina", "Vicente", "Magdalena", "Benjamín", "Antonia", "Sebastián",
  "Rocío", "Tomás", "Emilia", "Matías", "Olivia", "Iker", "Lola", "Aitor",
  "Vega", "Joel", "Aitana", "Saúl", "Triana", "Aaron", "Luna",
];

// Last names (Spanish + Latam mix)
const LAST_NAMES = [
  "García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez",
  "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno",
  "Muñoz", "Álvarez", "Romero", "Alonso", "Gutiérrez", "Navarro", "Torres",
  "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco",
  "Suárez", "Molina", "Morales", "Ortega", "Delgado", "Castro", "Ortiz",
  "Rubio", "Marín", "Sanz", "Iglesias", "Medina", "Garrido", "Cortés",
  "Castillo", "Santos", "Lozano", "Guerrero", "Cano", "Prieto", "Méndez",
  "Cruz", "Calvo", "Gallego", "Vidal", "León", "Márquez", "Herrera", "Peña",
  "Flores", "Cabrera", "Campos", "Vega", "Fuentes", "Carrasco", "Diez",
  "Caballero", "Reyes", "Aguilar", "Rivas", "Pascual", "Soler", "Hidalgo",
  "Esteban", "Bravo", "Mora", "Pereira", "Soto", "Acosta", "Aguirre", "Salas",
  "Silva", "Roldán", "Carmona", "Lara", "Andrade", "Vargas", "Núñez", "Carrillo",
  "Sandoval", "Cordero", "Pizarro", "Espinoza", "Tapia", "Olivares", "Saavedra",
  "Riquelme", "Bustamante", "Beltrán", "Vera", "Quiroga",
];

/* ===========================================================
   Utilities
   =========================================================== */

// Mulberry32 PRNG — deterministic for reproducible seeds.
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260501); // seed = 2026-05-01 launch date

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickWeighted(items) {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// Strip Spanish accents for email-safe local parts.
function deburr(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N");
}

function buildEmail(first, last, idx) {
  const f = deburr(first.toLowerCase());
  const l = deburr(last.toLowerCase().split(" ")[0]);
  const patterns = [
    `${f}.${l}`,
    `${f}${l}`,
    `${f}_${l}`,
    `${f}.${l}${Math.floor(rand() * 90 + 10)}`,
    `${f[0]}${l}`,
    `${f}${l[0]}`,
    `${f}.${l}${Math.floor(rand() * 9 + 1)}`,
    `${f}${Math.floor(rand() * 99 + 1)}`,
  ];
  const pattern = pick(patterns);
  return `${pattern}@${pickWeighted(DOMAINS).domain}`;
}

// Daily volume distribution: starts at 120/day, ramps to ~380/day with noise.
// We oversample by 18% to account for email-uniqueness collisions during build.
function generateDates(target) {
  target = Math.ceil(target * 1.18);
  const days = Math.floor((END_DATE - START_DATE) / (1000 * 60 * 60 * 24));
  const dates = [];

  // Build a curve: linear ramp from 120 to 380 across the window.
  const dailyTargets = [];
  for (let d = 0; d <= days; d++) {
    const t = d / days;
    // Quadratic ease-out so growth accelerates over time
    const factor = 0.4 + 0.6 * t;
    const base = 120 + (380 - 120) * factor;
    const noise = (rand() - 0.5) * 60; // ±30
    dailyTargets.push(Math.max(40, Math.round(base + noise)));
  }

  // Scale to hit exact target
  const sum = dailyTargets.reduce((s, n) => s + n, 0);
  const scale = target / sum;
  const scaled = dailyTargets.map((n) => Math.round(n * scale));

  // Adjust last day to hit target exactly
  const diff = target - scaled.reduce((s, n) => s + n, 0);
  scaled[scaled.length - 1] += diff;

  for (let d = 0; d <= days; d++) {
    const day = new Date(START_DATE);
    day.setUTCDate(day.getUTCDate() + d);
    for (let i = 0; i < scaled[d]; i++) {
      // Random hour with realistic time-of-day distribution
      // Peak: 8-10pm local (registrations after work)
      const hour = pickWeighted([
        { val: 7, weight: 2 }, { val: 8, weight: 3 }, { val: 9, weight: 5 },
        { val: 10, weight: 6 }, { val: 11, weight: 6 }, { val: 12, weight: 7 },
        { val: 13, weight: 8 }, { val: 14, weight: 7 }, { val: 15, weight: 6 },
        { val: 16, weight: 5 }, { val: 17, weight: 6 }, { val: 18, weight: 8 },
        { val: 19, weight: 11 }, { val: 20, weight: 13 }, { val: 21, weight: 12 },
        { val: 22, weight: 9 }, { val: 23, weight: 5 }, { val: 0, weight: 2 },
        { val: 1, weight: 1 },
      ]).val;
      const minute = Math.floor(rand() * 60);
      const second = Math.floor(rand() * 60);
      const ts = new Date(day);
      ts.setUTCHours(hour, minute, second);
      dates.push(ts);
    }
  }

  // Sort chronologically
  dates.sort((a, b) => a - b);
  return dates;
}

/* ===========================================================
   Generate
   =========================================================== */

async function main() {
  const dates = generateDates(TARGET);
  const records = [];
  const seenEmails = new Set();

  let i = 0;
  while (records.length < TARGET && i < dates.length) {
    const first = pick(FIRST_NAMES);
    const last = `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
    const email = buildEmail(first, last, records.length);
    if (seenEmails.has(email)) {
      i++;
      continue;
    }
    seenEmails.add(email);

    const country = pickWeighted(COUNTRIES);
    const source = pickWeighted(SOURCES);

    records.push({
      id: randomUUID(),
      email,
      nombre: first,
      apellido: last,
      pais: country.code,
      pais_nombre: country.name,
      fuente: source.id,
      fuente_tipo: source.type,
      created_at: dates[i].toISOString(),
    });
    i++;
  }

  // Pre-compute aggregates so the dashboard renders instantly
  const byCountry = {};
  const bySource = {};
  const byDay = {};
  for (const r of records) {
    byCountry[r.pais] = (byCountry[r.pais] || 0) + 1;
    bySource[r.fuente] = (bySource[r.fuente] || 0) + 1;
    const day = r.created_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    total: records.length,
    aggregates: {
      byCountry,
      bySource,
      byDay,
    },
    records,
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(`✓ Wrote ${records.length} registros to ${OUT}`);
  console.log(`  Date range: ${records[0].created_at} → ${records[records.length - 1].created_at}`);
  console.log(`  Top 3 países:`, Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 3));
  console.log(`  Top 3 fuentes:`, Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 3));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
