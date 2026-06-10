// src/lib/ia-coach/debate-context.ts
//
// Bloque compacto de datos REALES del campeón que defiende el usuario, para
// anclar al Retador (Modo 5). Sin esto, el Debate respondía solo con el
// conocimiento interno del modelo y podía inventar rankings, lesiones o formas.
// Barato (~150 tokens) y best-effort: si algo falta, degrada sin romper el chat.

import { promises as fs } from "node:fs";
import path from "node:path";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { readTeamForm, formatTeamFormForPrompt } from "./team-form";

interface TeamJsonLite {
  fifa_ranking?: { current?: number };
  wc_2026?: {
    coach?: { name?: string; nationality?: string };
    star_player?: { name?: string; club?: string };
  };
}

/** Devuelve un bloque markdown con datos reales del campeón, o null si no hay id. */
export async function buildDebateChampionContext(
  championId: string,
): Promise<string | null> {
  const team = TEAM_BY_ID[championId];
  if (!team) return null;

  const lines: string[] = [];
  lines.push(`- Grupo Mundial 2026: ${team.group} · Confederación: ${team.confed}`);

  // Perfil estático (ranking FIFA, DT, estrella). Best-effort: si no hay ficha,
  // seguimos con grupo + forma.
  try {
    const txt = await fs.readFile(
      path.join(process.cwd(), "data", "teams", `${team.slug}.json`),
      "utf8",
    );
    const j = JSON.parse(txt) as TeamJsonLite;
    if (typeof j.fifa_ranking?.current === "number") {
      lines.push(`- Ranking FIFA: #${j.fifa_ranking.current}`);
    }
    if (j.wc_2026?.coach?.name) {
      lines.push(
        `- DT: ${j.wc_2026.coach.name}${j.wc_2026.coach.nationality ? ` (${j.wc_2026.coach.nationality})` : ""}`,
      );
    }
    if (j.wc_2026?.star_player?.name) {
      lines.push(
        `- Estrella: ${j.wc_2026.star_player.name}${j.wc_2026.star_player.club ? ` (${j.wc_2026.star_player.club})` : ""}`,
      );
    }
  } catch {
    /* sin ficha profunda: seguimos */
  }

  // Forma reciente (KV, alimentada por el cron). formatTeamFormForPrompt ya
  // devuelve líneas con prefijo "- Forma reciente...".
  const form = await readTeamForm(championId);
  if (form && form.matches.length > 0) {
    lines.push(formatTeamFormForPrompt(form));
  }

  return lines.join("\n");
}
