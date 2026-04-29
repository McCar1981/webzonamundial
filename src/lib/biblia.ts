/**
 * BIBLIA Mundial 2026 — loader de fichas.
 *
 * Carga el JSON oficial de una selección desde data/teams/[slug].json.
 * Si no existe, devuelve null (la página fallback usa el sistema viejo).
 *
 * Como los JSON viven en /data (fuera de src/), los importamos via
 * fs en build-time. Next.js App Router los inlinea en el bundle estático.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { NationalTeam } from "@/types/team";

const TEAMS_DIR = path.join(process.cwd(), "data", "teams");

export async function loadTeam(slug: string): Promise<NationalTeam | null> {
  const file = path.join(TEAMS_DIR, `${slug}.json`);
  if (!existsSync(file)) return null;
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as NationalTeam;
  } catch (err) {
    console.error(`[biblia] failed to read ${slug}.json:`, (err as Error).message);
    return null;
  }
}

/** Lista los slugs que tienen ficha BIBLIA disponible (para SSG). */
export async function listBibliaSlugs(): Promise<string[]> {
  const fs = await import("node:fs/promises");
  try {
    const files = await fs.readdir(TEAMS_DIR);
    return files
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

/**
 * Devuelve los datos mínimos de TODAS las fichas BIBLIA (slug, name_es, iso)
 * en el orden alfabético del slug. Sirve para construir navegación
 * anterior/siguiente y grids de selección.
 */
export async function listBibliaTeamsBrief(): Promise<
  Array<{ slug: string; name: string; iso: string }>
> {
  const slugs = await listBibliaSlugs();
  const result: Array<{ slug: string; name: string; iso: string }> = [];
  for (const slug of slugs) {
    const team = await loadTeam(slug);
    if (team) {
      result.push({ slug: team.slug, name: team.name_es, iso: team.iso });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Calcula prev/next en el orden alfabético de la lista BIBLIA. */
export async function getTeamNavigation(
  currentSlug: string
): Promise<{ prev: { slug: string; name: string; iso: string } | null; next: { slug: string; name: string; iso: string } | null }> {
  const teams = await listBibliaTeamsBrief();
  const idx = teams.findIndex((t) => t.slug === currentSlug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? teams[idx - 1] : null,
    next: idx < teams.length - 1 ? teams[idx + 1] : null,
  };
}
