/**
 * Reader for the static registros seed (data/registros-seed.json).
 *
 * The seed is generated once by scripts/seed-registros.mjs and committed to
 * the repo. The /admin/registros dashboard reads from here on every render.
 *
 * If a real registration arrives via /api/registro it goes to KV (separate
 * store). The dashboard combines both sources at display time.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type RegistroSource =
  | "josecobo" | "svgiago" | "pimpeano" | "nachocp" | "nereita"
  | "elopi23" | "salvador" | "franbar"
  | "organic" | "instagram" | "tiktok";

export interface SeedRecord {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  pais: string;
  pais_nombre: string;
  fuente: string;
  fuente_tipo: "creator" | "organic" | "social";
  created_at: string;
}

export interface SeedFile {
  generatedAt: string;
  total: number;
  aggregates: {
    byCountry: Record<string, number>;
    bySource: Record<string, number>;
    byDay: Record<string, number>;
  };
  records: SeedRecord[];
}

const SEED_PATH = path.join(process.cwd(), "data", "registros-seed.json");

let cached: SeedFile | null = null;

export async function readSeed(): Promise<SeedFile> {
  if (cached) return cached;
  try {
    const raw = await fs.readFile(SEED_PATH, "utf-8");
    cached = JSON.parse(raw) as SeedFile;
    return cached;
  } catch (err) {
    console.error("[registros-seed] read failed", (err as Error).message);
    return {
      generatedAt: new Date().toISOString(),
      total: 0,
      aggregates: { byCountry: {}, bySource: {}, byDay: {} },
      records: [],
    };
  }
}

/* -------------------- Aggregations -------------------- */

export interface DashboardStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  topCountries: Array<{ code: string; name: string; count: number; pct: number }>;
  topSources: Array<{ id: string; type: string; count: number; pct: number }>;
  dailyTrend: Array<{ day: string; count: number }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  ES: "España", MX: "México", AR: "Argentina", CO: "Colombia",
  CL: "Chile", PE: "Perú", US: "Estados Unidos", VE: "Venezuela",
  UY: "Uruguay", EC: "Ecuador", GT: "Guatemala",
};

const SOURCE_LABELS: Record<string, { label: string; type: string }> = {
  josecobo: { label: "José Cobo", type: "Creador" },
  svgiago: { label: "SVGiago", type: "Creador" },
  pimpeano: { label: "Pimpeano", type: "Creador" },
  nachocp: { label: "Nacho CP", type: "Creador" },
  nereita: { label: "Nereita", type: "Creador" },
  elopi23: { label: "Elopi23", type: "Creador" },
  salvador: { label: "Salvador", type: "Creador" },
  franbar: { label: "Franbar", type: "Creador" },
  organic: { label: "Orgánico (web)", type: "Orgánico" },
  instagram: { label: "Instagram", type: "Social" },
  tiktok: { label: "TikTok", type: "Social" },
};

export function getSourceLabel(id: string): string {
  return SOURCE_LABELS[id]?.label || id;
}
export function getSourceType(id: string): string {
  return SOURCE_LABELS[id]?.type || "Otro";
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const seed = await readSeed();
  const total = seed.total;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStartStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const today = seed.aggregates.byDay[todayStr] || 0;
  const thisMonth = Object.entries(seed.aggregates.byDay)
    .filter(([day]) => day >= monthStartStr)
    .reduce((s, [, count]) => s + count, 0);
  const thisWeek = Object.entries(seed.aggregates.byDay)
    .filter(([day]) => new Date(day) >= sevenDaysAgo)
    .reduce((s, [, count]) => s + count, 0);

  const topCountries = Object.entries(seed.aggregates.byCountry)
    .map(([code, count]) => ({
      code,
      name: COUNTRY_NAMES[code] || code,
      count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const topSources = Object.entries(seed.aggregates.bySource)
    .map(([id, count]) => ({
      id,
      type: getSourceType(id),
      count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const dailyTrend = Object.entries(seed.aggregates.byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, count]) => ({ day, count }));

  return {
    total,
    today,
    thisWeek,
    thisMonth,
    topCountries,
    topSources,
    dailyTrend,
  };
}

/** Returns the most recent N records, sorted desc by created_at. */
export async function getRecentRegistros(limit = 50): Promise<SeedRecord[]> {
  const seed = await readSeed();
  return [...seed.records]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

/** Censor email for display: j***@gmail.com */
export function censorEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
}

/** Build a CSV (escaped) of all records, with a censored-email column. */
export async function buildCsv(): Promise<string> {
  const seed = await readSeed();
  const header = [
    "id",
    "email_censurado",
    "nombre",
    "apellido",
    "pais",
    "fuente",
    "fuente_tipo",
    "created_at",
  ].join(",");
  const rows = seed.records.map((r) =>
    [
      r.id,
      censorEmail(r.email),
      escapeCsv(r.nombre),
      escapeCsv(r.apellido),
      r.pais,
      r.fuente,
      r.fuente_tipo,
      r.created_at,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
