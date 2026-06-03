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

/* ---------- helpers para el dossier monográfico de selección ---------- */

function name(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && typeof (v as { name?: unknown }).name === "string") {
    return (v as { name: string }).name;
  }
  return "";
}

function hostStr(host: unknown): string {
  const c = (host as { countries?: unknown })?.countries;
  if (Array.isArray(c)) return c.map(String).join("/");
  return name(host);
}

function recordLine(r: unknown): string {
  if (!r || typeof r !== "object") return "";
  const o = r as Record<string, unknown>;
  const parts = [o.result, o.opponent ? `vs ${name(o.opponent)}` : "", o.competition, o.date]
    .filter(Boolean)
    .map(String);
  return parts.join(" · ");
}

function holderLine(r: unknown): string {
  if (!r || typeof r !== "object") return "";
  const o = r as Record<string, unknown>;
  if (!o.name) return "";
  return `${o.name}${o.value != null ? ` (${o.value})` : ""}`;
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

/**
 * Dossier de una GUÍA DE SELECCIÓN (solo para GUIDE_SLUGS).
 *
 * Es una MONOGRAFÍA de una sola selección: aprovecha la riqueza de los JSON de
 * data/teams/*.json (historia Mundial a Mundial, récords históricos, partidos
 * icónicos, plantel probable + XI, estilo y análisis, cultura de afición,
 * curiosidades verificadas). Sustancia única que NO aparece en la previa de
 * grupo — así la pieza no es un duplicado de aquella.
 */
export async function buildTeamDossier(slug: string): Promise<DossierResult> {
  const s = getSeleccionBySlug(slug);
  if (!s) throw new Error(`Selección desconocida: ${slug}`);
  const raw = TEAM_JSON[slug] as Record<string, any> | undefined;
  if (!raw) throw new Error(`Sin JSON de datos para: ${slug}`);

  const w = raw.wc_2026 ?? {};
  const q = w.qualifying ?? {};
  const st = q.stats ?? {};
  const coach = name(w.coach) || q.coach_during_qualifying || "(no disponible)";
  const captain = name(w.captain) || "(no disponible)";
  const star = name(w.star_player) || "(no disponible)";
  const fed = raw.federation ?? {};
  const fifaRank = raw.fifa_ranking?.current ?? s.rankingFIFA ?? "(s/d)";
  const hist = raw.history ?? {};
  const records = raw.records ?? {};
  const fan = raw.fan_culture ?? {};
  const analysis = w.analysis ?? {};

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

  // Recorrido Mundial a Mundial (compacto: año — sede — resultado — DT).
  // SIN las narrativas largas del JSON (pueden traer ruido); solo datos limpios.
  const byWc: unknown[] = Array.isArray(hist.by_world_cup) ? hist.by_world_cup : [];
  const wcHistoryBlock = byWc
    .map((e) => {
      const o = e as Record<string, unknown>;
      const dt = o.coach ? ` — DT ${o.coach}` : "";
      return `- ${o.year}: ${hostStr(o.host)} — ${o.result}${dt}`;
    })
    .join("\n");

  // Partidos icónicos (referencia editorial; narrativa curada del JSON).
  const iconic: unknown[] = Array.isArray(raw.iconic_matches) ? raw.iconic_matches : [];
  const iconicBlock = iconic
    .slice(0, 5)
    .map((e) => {
      const o = e as Record<string, unknown>;
      const narr = typeof o.narrative === "string" ? o.narrative : "";
      return `- ${o.title} (${o.competition ?? ""}, ${o.date ?? ""}) — ${o.score ?? ""} vs ${name(o.opponent)}: ${narr}`;
    })
    .join("\n");

  // Curiosidades SOLO verificadas.
  const curios: unknown[] = Array.isArray(raw.curiosities) ? raw.curiosities : [];
  const curiosBlock = curios
    .filter((c) => {
      const stt = String((c as { status?: unknown })?.status ?? "");
      return stt === "validated" || stt === "verified";
    })
    .slice(0, 6)
    .map((c) => `- ${(c as { text?: string }).text ?? ""}`)
    .join("\n");

  // Plantel probable (26) + XI titular reconstruido por player_id.
  const squad: unknown[] = Array.isArray(w.likely_squad) ? w.likely_squad : [];
  const squadById = new Map<string, string>();
  for (const p of squad) {
    const o = p as Record<string, unknown>;
    if (typeof o.id === "string") squadById.set(o.id, String(o.display_name ?? o.full_name ?? o.id));
  }
  const squadBlock = squad
    .map((p) => {
      const o = p as Record<string, unknown>;
      const club = name(o.club);
      return `- ${o.display_name ?? o.full_name} (${o.detailed_position ?? o.position}${club ? `, ${club}` : ""})`;
    })
    .join("\n");

  const xi = w.starting_xi ?? {};
  const xiPlayers: unknown[] = Array.isArray(xi.players) ? xi.players : [];
  const xiNames = xiPlayers
    .map((p) => squadById.get(String((p as { player_id?: unknown }).player_id ?? "")) || "")
    .filter(Boolean);
  const xiBlock = xiNames.length
    ? `Posible XI (${xi.formation ?? "—"}): ${xiNames.join(", ")}`
    : "(XI no disponible)";

  // Análisis editorial (estilo/fortalezas/debilidades/factor X). Reescribir, no copiar.
  const strengths: string[] = Array.isArray(analysis.strengths) ? analysis.strengths.map(String) : [];
  const weaknesses: string[] = Array.isArray(analysis.weaknesses) ? analysis.weaknesses.map(String) : [];
  const xFactor = analysis.x_factor ?? {};
  const analysisBlock = [
    analysis.style ? `Estilo de juego: ${analysis.style}` : "",
    strengths.length ? `Fortalezas:\n${strengths.map((x) => `  · ${x}`).join("\n")}` : "",
    weaknesses.length ? `Debilidades:\n${weaknesses.map((x) => `  · ${x}`).join("\n")}` : "",
    xFactor.player ? `Factor X: ${xFactor.player}${xFactor.reason ? ` — ${xFactor.reason}` : ""}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const baseCamp = w.base_camp ?? {};
  const baseCampLine = baseCamp.facility_name || baseCamp.city
    ? `${baseCamp.facility_name ?? ""}${baseCamp.city ? ` (${baseCamp.city}${baseCamp.country ? `, ${baseCamp.country}` : ""})` : ""}`
    : "(no disponible)";

  const stadium = fan.home_stadium ?? {};
  const rival = fan.main_rival ?? {};
  const chants: string[] = Array.isArray(fan.famous_chants) ? fan.famous_chants.map(String) : [];
  const fanBlock = [
    stadium.name ? `Estadio habitual: ${stadium.name}${stadium.city ? ` (${stadium.city})` : ""}${stadium.capacity ? `, aforo ${stadium.capacity}` : ""}` : "",
    rival.name ? `Gran rival: ${rival.name}${rival.story ? ` — ${rival.story}` : ""}` : "",
    chants.length ? `Cánticos: ${chants.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const dossier = `DATOS VERIFICADOS — Monografía de ${s.nombre} para el Mundial 2026
(Esta es una guía de UNA selección, NO una previa de grupo: el foco es el recorrido, el plantel y la identidad de ${s.nombre}.)

IDENTIDAD:
- Nombre: ${raw.name_es ?? s.nombre}; apodos: ${(raw.nicknames ?? []).join(", ") || "—"}
- Confederación: ${s.confederacion}; ranking FIFA: nº ${fifaRank}
- Federación: ${fed.name ?? "—"} (fundada ${fed.founded ?? "—"})
- Anfitriona 2026: ${s.esAnfitrion ? "sí" : "no"}; Grupo 2026: ${s.grupo}

PALMARÉS E HISTORIA MUNDIALISTA:
- Primera participación: ${hist.first_appearance ?? "—"}
- Participaciones (incluido 2026): ${hist.appearances_count_with_2026 ?? s.mundiales}
- Presencia consecutiva desde: ${hist.consecutive_streak_since ?? "—"}
- Títulos: ${hist.titles ?? 0}${Array.isArray(hist.titles_years) && hist.titles_years.length ? ` (${hist.titles_years.join(", ")})` : ""}
- Mejor resultado: ${hist.best_result ?? s.mejorResultado}

RECORRIDO MUNDIAL A MUNDIAL (datos limpios; año — sede — resultado — DT):
${wcHistoryBlock || "(no disponible)"}

RÉCORDS HISTÓRICOS:
- Mayor goleada: ${recordLine(records.biggest_win) || "—"}
- Peor derrota: ${recordLine(records.worst_loss) || "—"}
- Más internacionalidades: ${holderLine(records.most_capped) || "—"}
- Máximo goleador histórico: ${holderLine(records.top_scorer_history) || "—"}
- Debut más precoz: ${holderLine(records.youngest_debut) || "—"}

PARTIDOS ICÓNICOS (referencia editorial; reescribe con tus palabras, no copies literal):
${iconicBlock || "(no disponible)"}

CAMINO AL MUNDIAL 2026:
- Clasificó vía: ${w.qualified_via ?? "—"}
- Stats de clasificación: ${statsLine}
- Resumen: ${qualifyingSummary || "(no disponible)"}

PLANTEL Y CUERPO TÉCNICO 2026:
- Seleccionador: ${coach}; Capitán: ${captain}; Jugador estrella: ${star}
- Sede de concentración: ${baseCampLine}
- ${xiBlock}
- Convocatoria probable:
${squadBlock || "(no disponible)"}

ESTILO Y ANÁLISIS (referencia editorial; reescribe, no copies literal):
${analysisBlock || "(no disponible)"}

CULTURA DE AFICIÓN:
${fanBlock || "(no disponible)"}

CURIOSIDADES VERIFICADAS:
${curiosBlock || "(no disponible)"}

FORMA RECIENTE VERIFICABLE (api-football, últimos 5):
${form ? `- ${form}` : "(sin datos de forma disponibles)"}

CALENDARIO DE ${s.nombre.toUpperCase()} EN FASE DE GRUPOS (situarse; secundario, NO es el foco):
${fixtures || "(calendario no disponible)"}`;

  return {
    slug: `guia-${slug}-mundial-2026`,
    title: `${s.nombre} en el Mundial 2026: guía completa`,
    dossier,
  };
}
