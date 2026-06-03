// src/lib/evergreen/dossier.ts
//
// Track B — Contenido perenne analítico fundamentado SOLO en datos que ya
// existen en el repo + forma reciente verificable de api-football (vía KV).
//
// Un "dossier" es un bloque de texto con HECHOS verificados (rankings, palmarés,
// calendario, forma reciente, camino al Mundial). Es a la vez:
//   1. El material que recibe el redactor (generator.ts) — solo puede usar esto.
//   2. El sourceText que recibe el crítico — para verificar precisión factual.
//
// NADA en el dossier se inventa: todo sale de src/data/selecciones.ts,
// src/data/matches.ts, src/data/grupos-editorial.ts, data/teams/*.json y la
// forma reciente cacheada en KV (src/lib/ia-coach/team-form.ts).

import {
  getSeleccionesByGrupo,
  getSeleccionBySlug,
  GRUPOS,
  type Seleccion,
} from "@/data/selecciones";
import { MATCHES } from "@/data/matches";
import { GRUPOS_EDITORIAL } from "@/data/grupos-editorial";
import { readTeamForm } from "@/lib/ia-coach/team-form";

// JSONs ricos de las 6 selecciones con guía inicial (anfitrionas + top FIFA).
import espana from "../../../data/teams/espana.json";
import argentina from "../../../data/teams/argentina.json";
import francia from "../../../data/teams/francia.json";
import mexico from "../../../data/teams/mexico.json";
import canada from "../../../data/teams/canada.json";
import estadosUnidos from "../../../data/teams/estados-unidos.json";

/* ---------- slug → ISO3 (clave de la forma reciente en KV) ---------- */
// Las claves coinciden con API_FOOTBALL_TEAM_IDS (team-form.ts). Las que no
// tienen ID api-football (irak, rd-congo) se omiten: la forma es opcional.
const SLUG_TO_ISO3: Record<string, string> = {
  mexico: "MEX", "corea-del-sur": "KOR", sudafrica: "ZAF", "republica-checa": "CZE",
  canada: "CAN", suiza: "SUI", qatar: "QAT", bosnia: "BIH",
  brasil: "BRA", marruecos: "MAR", haiti: "HAI", escocia: "SCO",
  "estados-unidos": "USA", australia: "AUS", paraguay: "PAR", turquia: "TUR",
  alemania: "GER", curazao: "CUW", "costa-de-marfil": "CIV", ecuador: "ECU",
  "paises-bajos": "NED", japon: "JPN", tunez: "TUN", suecia: "SWE",
  belgica: "BEL", egipto: "EGY", iran: "IRN", "nueva-zelanda": "NZL",
  espana: "ESP", "cabo-verde": "CPV", "arabia-saudi": "KSA", uruguay: "URU",
  francia: "FRA", senegal: "SEN", noruega: "NOR",
  argentina: "ARG", argelia: "ALG", austria: "AUT", jordania: "JOR",
  portugal: "POR", uzbekistan: "UZB", colombia: "COL",
  inglaterra: "ENG", croacia: "CRO", ghana: "GHA", panama: "PAN",
};

/** Selecciones con guía perenne inicial (Track B v1): 3 anfitrionas + 3 top FIFA. */
export const GUIDE_SLUGS = [
  "mexico",
  "canada",
  "estados-unidos",
  "argentina",
  "espana",
  "francia",
] as const;

const TEAM_JSON: Record<string, unknown> = {
  espana,
  argentina,
  francia,
  mexico,
  canada,
  "estados-unidos": estadosUnidos,
};

async function formLine(slug: string): Promise<string | null> {
  const iso3 = SLUG_TO_ISO3[slug];
  if (!iso3) return null;
  const form = await readTeamForm(iso3);
  if (!form || form.matches.length === 0) return null;
  return form.summary;
}

function groupFixtures(letra: string) {
  return MATCHES.filter(
    (m) => m.g === letra.toUpperCase() && m.p === "Fase de grupos",
  ).sort((a, b) => a.j - b.j || a.d.localeCompare(b.d));
}

function teamFactLine(s: Seleccion): string {
  const host = s.esAnfitrion ? ", anfitriona" : "";
  const rank = s.rankingFIFA ? `nº ${s.rankingFIFA} FIFA` : "sin ranking";
  return `${s.nombre} (${rank}, ${s.confederacion}${host}; ${s.mundiales} Mundiales, mejor: ${s.mejorResultado})`;
}

export interface DossierResult {
  /** slug sugerido para la pieza (el redactor puede ajustarlo). */
  slug: string;
  /** título orientativo. */
  title: string;
  /** texto con SOLO hechos verificados (material + sourceText del crítico). */
  dossier: string;
}

/** Dossier de una PREVIA DE GRUPO (A-L). */
export async function buildGroupDossier(letra: string): Promise<DossierResult> {
  const L = letra.toUpperCase();
  const grupo = GRUPOS[L];
  if (!grupo) throw new Error(`Grupo desconocido: ${letra}`);
  const teams = getSeleccionesByGrupo(L);
  const ed = GRUPOS_EDITORIAL[L];
  const fixtures = groupFixtures(L);

  const forms = await Promise.all(
    teams.map(async (t) => ({ nombre: t.nombre, form: await formLine(t.slug) })),
  );
  const formBlock = forms
    .filter((f) => f.form)
    .map((f) => `- ${f.nombre}: ${f.form}`)
    .join("\n");

  const fixturesBlock = fixtures
    .map(
      (m) =>
        `- J${m.j}: ${m.h} vs ${m.a} — ${m.d} ${m.t} ET, ${m.vn} (${m.vc})`,
    )
    .join("\n");

  const teamsBlock = teams.map((t) => `- ${teamFactLine(t)}`).join("\n");

  const editorialBlock = ed
    ? [
        `Contexto: ${ed.contexto}`,
        `Favoritos: ${ed.favoritos}`,
        `Debutante/sorpresa: ${ed.debutante_o_sorpresa}`,
        `Partido estrella: ${ed.partido_estrella}`,
        `Pronóstico de la redacción: ${ed.pronostico}`,
        ed.curiosidad ? `Curiosidad: ${ed.curiosidad}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "(sin análisis editorial disponible)";

  const dossier = `DATOS VERIFICADOS — ${grupo.nombre} del Mundial 2026

SELECCIONES DEL GRUPO:
${teamsBlock}

FORMA RECIENTE VERIFICABLE (api-football, últimos 5):
${formBlock || "(sin datos de forma disponibles)"}

CALENDARIO DE FASE DE GRUPOS (horas en ET de EE.UU.):
${fixturesBlock || "(calendario no disponible)"}

ANÁLISIS EDITORIAL DE REFERENCIA (de la redacción de ZonaMundial; reescribe con tus palabras, no copies literal):
${editorialBlock}`;

  return {
    slug: `previa-grupo-${L.toLowerCase()}-mundial-2026`,
    title: `Previa del ${grupo.nombre} del Mundial 2026`,
    dossier,
  };
}

/** Dossier de una GUÍA DE SELECCIÓN (solo para GUIDE_SLUGS). */
export async function buildTeamDossier(slug: string): Promise<DossierResult> {
  const s = getSeleccionBySlug(slug);
  if (!s) throw new Error(`Selección desconocida: ${slug}`);
  const raw = TEAM_JSON[slug] as Record<string, any> | undefined;
  if (!raw) throw new Error(`Sin JSON de datos para: ${slug}`);

  const w = raw.wc_2026 ?? {};
  const q = w.qualifying ?? {};
  const st = q.stats ?? {};
  const coach = w.coach?.name ?? q.coach_during_qualifying ?? "(no disponible)";
  const captain = w.captain?.name ?? "(no disponible)";
  const star = w.star_player?.name ?? "(no disponible)";
  const fed = raw.federation ?? {};
  const fifaRank = raw.fifa_ranking?.current ?? s.rankingFIFA ?? "(s/d)";

  const form = await formLine(slug);

  const fixtures = groupFixtures(s.grupo)
    .filter((m) => m.h === s.nombre || m.a === s.nombre)
    .map((m) => `- ${m.h} vs ${m.a} — ${m.d} ${m.t} ET, ${m.vn} (${m.vc})`)
    .join("\n");

  const qualifyingSummary =
    typeof w.qualifying_summary === "string" ? w.qualifying_summary : "";

  const statsLine =
    Object.keys(st).length > 0
      ? `PJ ${st.played} · ${st.won}V ${st.drawn}E ${st.lost}D · ${st.goals_for} GF / ${st.goals_against} GC · ${st.points} pts`
      : "(stats de clasificación no disponibles)";

  const dossier = `DATOS VERIFICADOS — Guía de ${s.nombre} para el Mundial 2026

IDENTIDAD:
- Nombre: ${raw.name_es ?? s.nombre}; apodos: ${(raw.nicknames ?? []).join(", ") || "—"}
- Confederación: ${s.confederacion}; ranking FIFA: nº ${fifaRank}
- Federación: ${fed.name ?? "—"} (fundada ${fed.founded ?? "—"})
- Anfitriona 2026: ${s.esAnfitrion ? "sí" : "no"}
- Grupo 2026: ${s.grupo}

HISTORIA MUNDIALISTA:
- Participaciones: ${s.mundiales}; mejor resultado: ${s.mejorResultado}

CAMINO AL MUNDIAL 2026:
- Clasificó vía: ${w.qualified_via ?? "—"}
- Stats de clasificación: ${statsLine}
- Resumen: ${qualifyingSummary || "(no disponible)"}

PLANTEL Y CUERPO TÉCNICO:
- Seleccionador: ${coach}
- Capitán: ${captain}
- Jugador estrella: ${star}

FORMA RECIENTE VERIFICABLE (api-football, últimos 5):
${form ? `- ${form}` : "(sin datos de forma disponibles)"}

CALENDARIO EN FASE DE GRUPOS (horas en ET de EE.UU.):
${fixtures || "(calendario no disponible)"}`;

  return {
    slug: `guia-${slug}-mundial-2026`,
    title: `${s.nombre} en el Mundial 2026: guía completa`,
    dossier,
  };
}
