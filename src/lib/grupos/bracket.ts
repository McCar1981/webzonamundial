// src/lib/grupos/bracket.ts
//
// Resuelve los SLOTS del cuadro eliminatorio (1A, 2A, 1B, 2B…) a la selección
// REAL en cuanto cada grupo cierra (todos sus partidos terminados), leyendo la
// clasificación en vivo con el mismo motor de desempates FIFA que /grupos.
//
// Así el cuadro de dieciseisavos vuelca los clasificados según se juegan los
// resultados, sin esperar a que se actualice el fixture oficial.
//
// LÍMITE consciente: los slots de MEJORES TERCEROS ("3CEFHI"…) NO se resuelven
// aquí — su asignación a cada hueco la fija una tabla oficial de la FIFA según
// qué grupos aporten tercero. Esos se quedan como etiqueta de posición hasta
// que el fixture oficial los rellene. Server-only (getLastSnapshotsBulk → KV).

import { MATCHES } from "@/data/matches";
import { getSeleccionesByGrupo } from "@/data/selecciones";
import { FINISHED_STATUSES, type LiveMap } from "@/lib/calendario/live";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";
import { standingsOrder, type TeamMeta } from "@/lib/grupos/standings";

export interface ResolvedTeam {
  nombre: string;
  flagCode: string;
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

/**
 * Mapa slot→selección real para los grupos YA CERRADOS. Solo incluye "1X" y
 * "2X" de los grupos cuyos 6 partidos han terminado (orden final inequívoco).
 */
export async function resolveKnockoutTeams(): Promise<Record<string, ResolvedTeam>> {
  const groupMatchIds = MATCHES.filter((m) => m.p === "Fase de grupos").map((m) => m.i);
  const snaps = await getLastSnapshotsBulk(groupMatchIds);

  // getLastSnapshotsBulk devuelve {status, score}; standings.ts consume {s, sc, el}.
  const live: LiveMap = {};
  for (const id of groupMatchIds) {
    const s = snaps[id];
    if (s && s.status) live[id] = { s: s.status, sc: (s.score ?? [0, 0]) as [number, number], el: 0 };
  }

  const out: Record<string, ResolvedTeam> = {};
  for (const letra of GROUPS) {
    const gm = MATCHES.filter((m) => m.g === letra && m.p === "Fase de grupos");
    const decided = gm.length > 0 && gm.every((m) => !!live[m.i] && FINISHED_STATUSES.has(live[m.i].s));
    if (!decided) continue;

    const teams: TeamMeta[] = getSeleccionesByGrupo(letra).map((s) => ({
      flagCode: s.flagCode, nombre: s.nombre, rankingFIFA: s.rankingFIFA,
    }));
    const { ordered } = standingsOrder(letra, teams, live);
    if (ordered[0]) out[`1${letra}`] = { nombre: ordered[0].nombre, flagCode: ordered[0].flagCode };
    if (ordered[1]) out[`2${letra}`] = { nombre: ordered[1].nombre, flagCode: ordered[1].flagCode };
  }
  return out;
}
