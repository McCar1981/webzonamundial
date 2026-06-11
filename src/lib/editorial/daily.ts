// src/lib/editorial/daily.ts
//
// EDITORIAL DIARIO AUTOMÁTICO del Mundial 2026. Dos piezas al día generadas
// desde NUESTROS datos oficiales (calendario FIFA en data/calendario.ts,
// fichas BIBLIA y snapshots reales del Match Center) — nunca desde medios
// terceros, así que no hay riesgo de copyright ni de "contenido derivado":
//
//   1. PREVIA DEL DÍA   (cron daily-previa, mañana): los partidos de hoy con
//      horarios en España, claves de cada cruce (estrellas, ranking FIFA, DT)
//      y qué se juega cada grupo.
//   2. RESUMEN DE LA JORNADA (cron daily-resumen, mañana): los resultados de
//      ayer con goleadores, desde los snapshots FT reales del Match Center.
//
// Garantías (mismas que chronicle.ts):
//   - Cero invención: el LLM recibe un JSON de hechos verificados y tiene
//     prohibido salirse de él. Si el LLM falla, hay un constructor
//     DETERMINISTA de respaldo: la pieza se publica igual, solo con hechos.
//   - Idempotencia: slug fijo por fecha + candado del store de noticias.
//   - El día sin partidos (o sin resultados) simplemente no publica.

import Anthropic from "@anthropic-ai/sdk";
import { CALENDARIO, type Partido } from "@/data/calendario";
import { loadTeam } from "@/lib/biblia";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";
import { MATCHES } from "@/data/matches";
import type { LiveSnapshot } from "@/lib/match-center/types";
import {
  acquireStoreLock,
  readIngestStore,
  releaseStoreLock,
  writeIngestStore,
} from "@/lib/noticias-store";
import type { DraftNoticia } from "@/lib/noticias-ingest";
import type { NoticiaBlock } from "@/data/noticias";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const LOCK_TOKEN_PREFIX = "editorial-daily-";
const FALLBACK_HERO = "/img/heroes/ball-stadium-pitch.jpg";

/* ───────────────────────── Fechas (Europe/Madrid) ───────────────────────── */

export function madridDateOf(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

function madridTimeOf(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** "jueves 11 de junio" — para titulares y prosa. */
function madridLongDate(dateISO: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateISO}T12:00:00Z`));
}

/** Partidos cuyo saque inicial cae en la fecha dada EN HORA ESPAÑOLA. */
export function partidosDeFechaMadrid(dateISO: string): Partido[] {
  return CALENDARIO.filter((p) => madridDateOf(p.fecha) === dateISO).sort((a, b) =>
    a.fecha.localeCompare(b.fecha),
  );
}

/* ───────────────────────── Datos de equipo (BIBLIA) ─────────────────────── */

interface TeamBrief {
  nombre: string;
  iso: string;
  ranking_fifa: number | null;
  estrella: string | null;
  estrella_por: string | null;
  dt: string | null;
  fotoEstrella: string | null;
}

async function teamBrief(slug: string): Promise<TeamBrief | null> {
  const t = await loadTeam(slug).catch(() => null);
  if (!t) return null;
  const star = t.wc_2026?.star_player;
  return {
    nombre: t.name_es,
    iso: t.iso,
    ranking_fifa: t.fifa_ranking?.current ?? null,
    estrella: star?.name ?? null,
    estrella_por: star?.reason ?? null,
    dt: t.wc_2026?.coach?.name ?? null,
    fotoEstrella: star?.photo_url ?? null,
  };
}

/* ───────────────────────── Publicación en el store ──────────────────────── */

/** Inserta el draft como noticia publicada, con candado e idempotencia. */
async function publishEditorialDraft(draft: DraftNoticia): Promise<"published" | "exists" | "lock_busy"> {
  const token = `${LOCK_TOKEN_PREFIX}${draft.slug}-${Date.now()}`;
  const locked = await acquireStoreLock(token);
  if (!locked) return "lock_busy";
  try {
    const store = await readIngestStore();
    if (store.drafts.some((d) => d.slug === draft.slug)) return "exists";
    store.drafts.push(draft);
    store.generatedAt = new Date().toISOString();
    await writeIngestStore(store);
    return "published";
  } finally {
    await releaseStoreLock(token);
  }
}

function wordsOf(blocks: NoticiaBlock[]): number {
  return blocks.reduce((sum, b) => {
    if (b.type === "list") return sum + b.items.join(" ").split(/\s+/).length;
    const text = (b as { text?: string }).text || "";
    return sum + text.split(/\s+/).filter(Boolean).length;
  }, 0);
}

/* ───────────────────────── LLM compartido ───────────────────────── */

interface LlmArticle {
  title: string;
  excerpt: string;
  seoDescription?: string;
  intro: string[];
  sections: Array<{ h2: string; paragraphs: string[] }>;
}

async function generateArticle(system: string, factsJson: unknown): Promise<LlmArticle | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const client = new Anthropic({ apiKey: key });
  const model = process.env.ANTHROPIC_MODEL_EDITORIAL || DEFAULT_MODEL;
  let resp;
  try {
    resp = await client.messages.create({
      model,
      max_tokens: 2600,
      temperature: 0.5,
      system,
      messages: [
        {
          role: "user",
          content: `Hechos verificados (JSON):\n${JSON.stringify(factsJson)}\n\nDevuelve SOLO el JSON pedido.`,
        },
      ],
    });
  } catch (err) {
    console.error("[editorial-daily] API error", (err as Error).message);
    return null;
  }
  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const raw = block.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  let parsed: LlmArticle;
  try {
    parsed = JSON.parse(raw) as LlmArticle;
  } catch {
    return null;
  }
  if (
    !parsed.title ||
    !parsed.excerpt ||
    !Array.isArray(parsed.intro) ||
    !Array.isArray(parsed.sections) ||
    parsed.sections.length === 0
  ) {
    return null;
  }
  return {
    title: String(parsed.title).slice(0, 110),
    excerpt: String(parsed.excerpt).slice(0, 290),
    seoDescription: parsed.seoDescription ? String(parsed.seoDescription).slice(0, 158) : undefined,
    intro: parsed.intro.map(String).filter(Boolean),
    sections: parsed.sections
      .filter((s) => s && s.h2 && Array.isArray(s.paragraphs))
      .map((s) => ({ h2: String(s.h2), paragraphs: s.paragraphs.map(String).filter(Boolean) })),
  };
}

function articleToBlocks(a: LlmArticle): NoticiaBlock[] {
  const blocks: NoticiaBlock[] = a.intro.map((text) => ({ type: "p", text }));
  for (const s of a.sections) {
    blocks.push({ type: "h2", text: s.h2 });
    for (const text of s.paragraphs) blocks.push({ type: "p", text });
  }
  return blocks;
}

/* ════════════════════════════ PREVIA DEL DÍA ════════════════════════════ */

const PREVIA_SYSTEM = `Eres redactor deportivo de ZonaMundial y escribes la PREVIA de los partidos del Mundial 2026 que se juegan hoy.

Recibes un JSON con los hechos verificados (partidos, horarios en España, estadios, grupos, jornada, ranking FIFA, jugador estrella y seleccionador de cada equipo). Es tu ÚNICA fuente: no inventes lesiones, declaraciones, historiales ni clasificaciones que no estén en el JSON.

ESTILO: español neutro, previa profesional con ritmo (qué está en juego, por qué ver cada partido). Sin emojis. Prohibido el lenguaje de apuestas ("apostar", "cuotas"); usa "favorito", "pronóstico". Di "Mundial 2026" o "el torneo", nunca marcas registradas.

ESTRUCTURA EXACTA del JSON de salida:
{
  "title": "Titular <=95 chars que incluya los equipos más potentes del día",
  "excerpt": "Entradilla <=220 chars",
  "seoDescription": "Meta description 120-155 chars con 'Mundial 2026' y la fecha",
  "intro": ["párrafo 1: qué trae el día (nº de partidos, lo más destacado)", "párrafo 2: contexto de la jornada"],
  "sections": [
    { "h2": "Equipo A - Equipo B (HH:MM, Grupo X)", "paragraphs": ["2-3 frases: qué se juega, duelo de estrellas, dato del ranking"] }
  ]
}
Una sección por partido, en orden de horario. 350-600 palabras en total. Cada frase debe apoyarse en el JSON.`;

export interface DailyResult {
  published: boolean;
  slug?: string;
  reason?: string;
  words?: number;
  llm: boolean;
}

export async function publishPreviaDelDia(dateISO: string): Promise<DailyResult> {
  const partidos = partidosDeFechaMadrid(dateISO);
  if (partidos.length === 0) return { published: false, reason: "sin_partidos", llm: false };

  const slug = `previa-mundial-${dateISO}`;
  const longDate = madridLongDate(dateISO);

  // Hechos verificados por partido
  const briefs = new Map<string, TeamBrief | null>();
  for (const p of partidos) {
    if (!briefs.has(p.homeSlug)) briefs.set(p.homeSlug, await teamBrief(p.homeSlug));
    if (!briefs.has(p.awaySlug)) briefs.set(p.awaySlug, await teamBrief(p.awaySlug));
  }
  const facts = {
    fecha: longDate,
    total_partidos: partidos.length,
    partidos: partidos.map((p) => {
      const h = briefs.get(p.homeSlug);
      const a = briefs.get(p.awaySlug);
      return {
        partido: `${h?.nombre ?? p.homeSlug} vs ${a?.nombre ?? p.awaySlug}`,
        hora_espana: madridTimeOf(p.fecha),
        grupo: p.grupo,
        jornada: p.jornada,
        estadio: p.estadio,
        ciudad: p.ciudad,
        local: h,
        visitante: a,
      };
    }),
  };

  const llmArticle = await generateArticle(PREVIA_SYSTEM, facts);
  let title: string;
  let excerpt: string;
  let seoDescription: string | undefined;
  let blocks: NoticiaBlock[];

  if (llmArticle) {
    title = llmArticle.title;
    excerpt = llmArticle.excerpt;
    seoDescription = llmArticle.seoDescription;
    blocks = articleToBlocks(llmArticle);
  } else {
    // Respaldo determinista: solo hechos, sin LLM.
    title = `Partidos del Mundial 2026 hoy, ${longDate}: horarios y claves`;
    excerpt = `${partidos.length === 1 ? "Un partido" : `${partidos.length} partidos`} del Mundial 2026 este ${longDate}: horarios en España, estadios y qué se juega cada selección.`;
    blocks = [
      {
        type: "p",
        text: `El Mundial 2026 sigue este ${longDate} con ${partidos.length === 1 ? "un partido" : `${partidos.length} partidos`} en juego. Repasamos los horarios en España, los estadios y las claves de cada cruce.`,
      },
    ];
    for (const p of partidos) {
      const h = briefs.get(p.homeSlug);
      const a = briefs.get(p.awaySlug);
      blocks.push({
        type: "h2",
        text: `${h?.nombre ?? p.homeSlug} - ${a?.nombre ?? p.awaySlug} (${madridTimeOf(p.fecha)}, Grupo ${p.grupo})`,
      });
      const datos: string[] = [];
      datos.push(
        `Jornada ${p.jornada} del Grupo ${p.grupo}, en el ${p.estadio} de ${p.ciudad}.`,
      );
      if (h?.ranking_fifa && a?.ranking_fifa)
        datos.push(`En el ranking FIFA: ${h.nombre} es ${h.ranking_fifa}º y ${a.nombre} es ${a.ranking_fifa}º.`);
      if (h?.estrella) datos.push(`La referencia local es ${h.estrella}${h.estrella_por ? ` (${h.estrella_por})` : ""}.`);
      if (a?.estrella) datos.push(`Por la visitante, atención a ${a.estrella}${a.estrella_por ? ` (${a.estrella_por})` : ""}.`);
      blocks.push({ type: "p", text: datos.join(" ") });
    }
  }

  // Bloques deterministas SIEMPRE presentes (valor útil sin riesgo):
  blocks.push({ type: "h2", text: "Horarios del día (hora peninsular española)" });
  blocks.push({
    type: "list",
    items: partidos.map((p) => {
      const h = briefs.get(p.homeSlug);
      const a = briefs.get(p.awaySlug);
      return `${madridTimeOf(p.fecha)} — ${h?.nombre ?? p.homeSlug} vs ${a?.nombre ?? p.awaySlug} · Grupo ${p.grupo} · ${p.estadio} (${p.ciudad})`;
    }),
  });
  blocks.push({
    type: "callout",
    title: "Síguelo en ZonaMundial",
    text: "Marcadores en vivo minuto a minuto en el Match Center, predicciones abiertas hasta el pitido inicial y crónica automática al final de cada partido.",
  });

  // Imagen de cabecera: estrella del primer partido (Wikimedia Commons) o estadio propio.
  const first = partidos[0];
  const hero =
    briefs.get(first.homeSlug)?.fotoEstrella ||
    briefs.get(first.awaySlug)?.fotoEstrella ||
    FALLBACK_HERO;

  const flags = Array.from(
    new Set(
      partidos.flatMap((p) => [briefs.get(p.homeSlug)?.iso, briefs.get(p.awaySlug)?.iso]),
    ),
  ).filter((f): f is string => !!f && /^[a-z]{2}$/.test(f));

  const draft: DraftNoticia = {
    slug,
    title,
    excerpt,
    seoDescription: seoDescription ?? excerpt.slice(0, 155),
    cat: "analisis",
    date: dateISO,
    updatedAt: dateISO,
    readTime: Math.max(2, Math.round(wordsOf(blocks) / 200)),
    flags: flags.slice(0, 8),
    tags: ["previa", "mundial 2026", `jornada`, "partidos de hoy"],
    featured: false,
    realImage: hero,
    imageCaption: undefined,
    imageSource: hero === FALLBACK_HERO ? undefined : "Wikimedia Commons",
    authorId: "gabriel-venegas", // firma "Redacción ZonaMundial"
    body: blocks,
    sourceName: "ZonaMundial · Calendario oficial del torneo",
    status: "published",
    sourceUrlHash: `editorial-previa-${dateISO}`,
    ingestedAt: new Date().toISOString(),
  };

  const res = await publishEditorialDraft(draft);
  return {
    published: res === "published",
    slug,
    reason: res === "published" ? undefined : res,
    words: wordsOf(blocks),
    llm: !!llmArticle,
  };
}

/* ═══════════════════════ RESUMEN DE LA JORNADA ═══════════════════════ */

const RESUMEN_SYSTEM = `Eres redactor deportivo de ZonaMundial y escribes el RESUMEN de la jornada de ayer del Mundial 2026.

Recibes un JSON con los hechos verificados de cada partido terminado (resultado final, goleadores con minuto, grupo). Es tu ÚNICA fuente: no inventes declaraciones, clasificaciones completas ni datos que no estén en el JSON.

ESTILO: español neutro, resumen ágil de jornada (qué dejó el día, sorpresas, nombres propios). Sin emojis. Nada de lenguaje de apuestas. Di "Mundial 2026" o "el torneo".

ESTRUCTURA EXACTA del JSON de salida:
{
  "title": "Titular <=95 chars con lo más destacado del día (incluye un resultado)",
  "excerpt": "Entradilla <=220 chars",
  "seoDescription": "Meta description 120-155 chars con 'Mundial 2026'",
  "intro": ["párrafo 1: el balance del día", "párrafo 2: el nombre propio o la sorpresa"],
  "sections": [
    { "h2": "Equipo A 2-1 Equipo B (Grupo X)", "paragraphs": ["2-3 frases sobre cómo se decidió, con los goleadores y minutos del JSON"] }
  ]
}
Una sección por partido. 300-550 palabras en total.`;

interface ResultadoDia {
  partido: Partido;
  homeName: string;
  awayName: string;
  score: [number, number];
  estado: string;
  goles: string[];
}

/** Mapea un Partido del calendario a su id numérico de matches.ts (i). */
function numericMatchId(p: Partido): number | null {
  const m = MATCHES.find(
    (m) => m.g === p.grupo && m.j === p.jornada && m.vn === p.estadio,
  );
  return m?.i ?? null;
}

function golesDe(snap: LiveSnapshot): string[] {
  return snap.events
    .filter((e) => e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal")
    .map((e) => {
      const equipo = e.side === "home" ? snap.meta.home.name : e.side === "away" ? snap.meta.away.name : "";
      const min = `${e.minute}${e.extra ? `+${e.extra}` : ""}'`;
      const tipo = e.type === "penalty_goal" ? " (p.)" : e.type === "own_goal" ? " (p.p.)" : "";
      return `${min} ${e.player ?? "Gol"}${tipo}${equipo ? ` — ${equipo}` : ""}`;
    });
}

const FINISHED = new Set(["FT", "AET", "PEN"]);

export async function publishResumenJornada(dateISO: string): Promise<DailyResult> {
  const partidos = partidosDeFechaMadrid(dateISO);
  if (partidos.length === 0) return { published: false, reason: "sin_partidos", llm: false };

  const ids = partidos
    .map((p) => ({ p, id: numericMatchId(p) }))
    .filter((x): x is { p: Partido; id: number } => x.id !== null);
  if (ids.length === 0) return { published: false, reason: "sin_ids", llm: false };

  const snaps = await getLastSnapshotsBulk(ids.map((x) => x.id));
  const resultados: ResultadoDia[] = [];
  for (let i = 0; i < ids.length; i++) {
    const snap = snaps[i];
    if (!snap || !FINISHED.has(snap.status)) continue;
    resultados.push({
      partido: ids[i].p,
      homeName: snap.meta.home.name,
      awayName: snap.meta.away.name,
      score: [snap.score[0] ?? 0, snap.score[1] ?? 0],
      estado: snap.status,
      goles: golesDe(snap),
    });
  }
  if (resultados.length === 0) return { published: false, reason: "sin_resultados", llm: false };

  const slug = `resumen-mundial-${dateISO}`;
  const longDate = madridLongDate(dateISO);

  const facts = {
    fecha: longDate,
    partidos_terminados: resultados.length,
    resultados: resultados.map((r) => ({
      resultado: `${r.homeName} ${r.score[0]}-${r.score[1]} ${r.awayName}`,
      estado: r.estado,
      grupo: r.partido.grupo,
      jornada: r.partido.jornada,
      estadio: r.partido.estadio,
      goles: r.goles,
    })),
  };

  const llmArticle = await generateArticle(RESUMEN_SYSTEM, facts);
  let title: string;
  let excerpt: string;
  let seoDescription: string | undefined;
  let blocks: NoticiaBlock[];

  if (llmArticle) {
    title = llmArticle.title;
    excerpt = llmArticle.excerpt;
    seoDescription = llmArticle.seoDescription;
    blocks = articleToBlocks(llmArticle);
  } else {
    title = `Resumen del Mundial 2026, ${longDate}: todos los resultados`;
    excerpt = `Así quedó la jornada del ${longDate} en el Mundial 2026: resultados y goleadores de los ${resultados.length === 1 ? "partido disputado" : `${resultados.length} partidos disputados`}.`;
    blocks = [
      {
        type: "p",
        text: `La jornada del ${longDate} dejó ${resultados.length === 1 ? "un partido resuelto" : `${resultados.length} partidos resueltos`} en el Mundial 2026. Esto es lo que pasó, con los goleadores de cada encuentro.`,
      },
    ];
    for (const r of resultados) {
      blocks.push({
        type: "h2",
        text: `${r.homeName} ${r.score[0]}-${r.score[1]} ${r.awayName} (Grupo ${r.partido.grupo})`,
      });
      blocks.push({
        type: "p",
        text:
          r.goles.length > 0
            ? `Goles: ${r.goles.join(" · ")}. Jornada ${r.partido.jornada} del Grupo ${r.partido.grupo}, disputado en ${r.partido.estadio} (${r.partido.ciudad}).`
            : `Sin goles en ${r.partido.estadio} (${r.partido.ciudad}), jornada ${r.partido.jornada} del Grupo ${r.partido.grupo}.`,
      });
    }
  }

  blocks.push({ type: "h2", text: "Todos los resultados del día" });
  blocks.push({
    type: "list",
    items: resultados.map(
      (r) =>
        `${r.homeName} ${r.score[0]}-${r.score[1]} ${r.awayName} · Grupo ${r.partido.grupo}${r.estado !== "FT" ? ` (${r.estado})` : ""}`,
    ),
  });
  blocks.push({
    type: "callout",
    title: "Las crónicas, partido a partido",
    text: "Cada encuentro del Mundial tiene su crónica completa en la sección de noticias de ZonaMundial, publicada automáticamente al pitido final con los datos oficiales.",
  });

  const flags = Array.from(
    new Set(resultados.flatMap((r) => [r.partido.homeSlug, r.partido.awaySlug])),
  );
  const briefFirst = await teamBrief(resultados[0].partido.homeSlug);

  const draft: DraftNoticia = {
    slug,
    title,
    excerpt,
    seoDescription: seoDescription ?? excerpt.slice(0, 155),
    cat: "analisis",
    date: madridDateOf(new Date()),
    updatedAt: madridDateOf(new Date()),
    readTime: Math.max(2, Math.round(wordsOf(blocks) / 200)),
    flags: (await Promise.all(flags.slice(0, 8).map(async (s) => (await teamBrief(s))?.iso)))
      .filter((f): f is string => !!f && /^[a-z]{2}$/.test(f)),
    tags: ["resumen", "mundial 2026", "resultados"],
    featured: false,
    realImage: briefFirst?.fotoEstrella || FALLBACK_HERO,
    imageSource: briefFirst?.fotoEstrella ? "Wikimedia Commons" : undefined,
    authorId: "gabriel-venegas", // firma "Redacción ZonaMundial"
    body: blocks,
    sourceName: "ZonaMundial · Resultados oficiales del Match Center",
    status: "published",
    sourceUrlHash: `editorial-resumen-${dateISO}`,
    ingestedAt: new Date().toISOString(),
  };

  const res = await publishEditorialDraft(draft);
  return {
    published: res === "published",
    slug,
    reason: res === "published" ? undefined : res,
    words: wordsOf(blocks),
    llm: !!llmArticle,
  };
}
