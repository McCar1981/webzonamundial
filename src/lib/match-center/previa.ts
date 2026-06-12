// src/lib/match-center/previa.ts
//
// PREVIA EDITORIAL POR PARTIDO, ~1 HORA ANTES DEL SAQUE. Para cada partido del
// Mundial se publica una previa profunda construida SOLO con datos reales:
//   - Fichas BIBLIA de ambas selecciones (data/teams/*.json): ranking FIFA,
//     seleccionador, capitán, estrella, estilo, fortalezas, debilidades, factor
//     X, pronóstico curado y la convocatoria (likely_squad) por líneas.
//   - Historial cara a cara real (api-football /headtohead vía getH2H).
//   - Forma reciente real de cada selección (KV del cron update-team-form).
//   - Calendario oficial (matches.ts): hora en España, estadio, fase, grupo.
//
// Garantías (idénticas a chronicle.ts / editorial daily):
//   - CERO invención. El LLM recibe un JSON de hechos verificados y tiene
//     prohibido salirse de él; hay respaldo DETERMINISTA si el LLM falla.
//   - HONESTIDAD sobre alineaciones: a 1 h del saque NO existe el XI confirmado
//     (api-football lo publica ~40 min antes). La previa habla de CONVOCADOS y
//     jugadores a seguir, NUNCA de un once titular inventado.
//   - Idempotencia: candado SETNX por partido en KV + dedupe por slug en el
//     store de noticias.
//
// La dispara el cron de recordatorios (cada 10 min) seleccionando los partidos
// cuyo saque cae a ~60 min: ver runMatchPrevias() + /api/cron/match-reminders.

import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@/lib/kv";
import { MATCHES, type Match } from "@/data/matches";
import { etToDate } from "@/lib/bracket/match-time";
import { buildMeta } from "@/lib/match-center/store";
import { matchHeroImage } from "@/lib/match-center/heroImage";
import { loadTeam, listBibliaTeamsBrief } from "@/lib/biblia";
import { getH2H } from "@/lib/ia-coach/team-h2h";
import { readTeamForm } from "@/lib/ia-coach/team-form";
import {
  acquireStoreLock,
  readIngestStore,
  releaseStoreLock,
  writeIngestStore,
} from "@/lib/noticias-store";
import type { DraftNoticia } from "@/lib/noticias-ingest";
import type { NoticiaBlock } from "@/data/noticias";
import type { MatchMeta } from "@/lib/match-center/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const LOCK_TOKEN_PREFIX = "previa-";
const FALLBACK_HERO = "/img/heroes/ball-stadium-pitch.jpg";

/** Antelación objetivo de la previa, en minutos antes del saque. */
export const PREVIA_LEAD_MINUTES = 60;
/** Media-ventana (cron cada 10 min → ±8 cubre sin huecos; el dedup remata). */
export const PREVIA_WINDOW_MINUTES = 8;
const DEDUP_TTL_SEC = 6 * 60 * 60;

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function madridTime(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function madridDateISO(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ───────────────────────── Resolución de slug BIBLIA ─────────────────────── */
// El partido (matches.ts) trae el código de bandera (m.hf/m.af, p.ej. "mx",
// "gb-eng"), que coincide con el `iso` de la ficha BIBLIA. Construimos el índice
// iso→slug una vez (cacheado).
let _isoSlug: Promise<Record<string, string>> | null = null;
function isoToSlug(): Promise<Record<string, string>> {
  if (!_isoSlug) {
    _isoSlug = listBibliaTeamsBrief()
      .then((list) => {
        const map: Record<string, string> = {};
        for (const t of list) map[t.iso.toLowerCase()] = t.slug;
        return map;
      })
      .catch(() => ({}));
  }
  return _isoSlug;
}

/* ───────────────────────── Dossier de selección (BIBLIA) ─────────────────── */

interface SquadPlayer {
  display_name?: string;
  position?: string; // GK | DEF | MID | FWD
}
interface WcAnalysis {
  style?: string;
  strengths?: string[];
  weaknesses?: string[];
  x_factor?: { player?: string; reason?: string };
  prediction_text?: string;
}

interface Dossier {
  nombre: string;
  iso: string;
  ranking_fifa: number | null;
  dt: string | null;
  capitan: string | null;
  estrella: string | null;
  estrella_por: string | null;
  estilo: string | null;
  fortalezas: string[];
  debilidades: string[];
  factor_x: { jugador: string; motivo: string } | null;
  pronostico: string | null;
  convocados: { porteros: string[]; defensas: string[]; medios: string[]; delanteros: string[] };
  fotoEstrella: string | null;
}

async function dossier(slug: string | null): Promise<Dossier | null> {
  if (!slug) return null;
  const t = await loadTeam(slug).catch(() => null);
  if (!t) return null;
  const wc = (t.wc_2026 ?? {}) as Record<string, unknown>;
  const star = wc.star_player as { name?: string; reason?: string; photo_url?: string } | undefined;
  const captain = wc.captain as { name?: string } | undefined;
  const coach = wc.coach as { name?: string } | undefined;
  const analysis = (wc.analysis ?? {}) as WcAnalysis;
  const squad = (wc.likely_squad ?? []) as SquadPlayer[];
  const byLine = (pos: string) =>
    squad.filter((p) => p.position === pos).map((p) => p.display_name ?? "").filter(Boolean);
  const xf = analysis.x_factor;
  return {
    nombre: t.name_es,
    iso: t.iso,
    ranking_fifa: (t.fifa_ranking as { current?: number } | undefined)?.current ?? null,
    dt: coach?.name ?? null,
    capitan: captain?.name ?? null,
    estrella: star?.name ?? null,
    estrella_por: star?.reason ?? null,
    estilo: analysis.style ?? null,
    fortalezas: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [],
    debilidades: Array.isArray(analysis.weaknesses) ? analysis.weaknesses.slice(0, 5) : [],
    factor_x: xf?.player ? { jugador: xf.player, motivo: xf.reason ?? "" } : null,
    pronostico: analysis.prediction_text ?? null,
    convocados: {
      porteros: byLine("GK"),
      defensas: byLine("DEF"),
      medios: byLine("MID"),
      delanteros: byLine("FWD"),
    },
    fotoEstrella: star?.photo_url ?? null,
  };
}

/* ───────────────────────── Publicación en el store ──────────────────────── */

async function publishDraft(draft: DraftNoticia): Promise<"published" | "exists" | "lock_busy"> {
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

/* ───────────────────────── LLM (con respaldo determinista) ───────────────── */

interface LlmArticle {
  title: string;
  excerpt: string;
  seoDescription?: string;
  intro: string[];
  sections: Array<{ h2: string; paragraphs: string[] }>;
}

const PREVIA_SYSTEM = `Eres redactor deportivo de ZonaMundial y escribes la PREVIA de UN partido del Mundial 2026 que se juega dentro de aproximadamente una hora.

Recibes un JSON con hechos verificados de ambas selecciones (ranking FIFA, seleccionador, capitán, estrella, estilo de juego, fortalezas, debilidades, factor X, pronóstico curado y la lista de CONVOCADOS por líneas), el historial cara a cara real y la forma reciente. Es tu ÚNICA fuente.

REGLAS INNEGOCIABLES:
- No inventes NADA fuera del JSON: ni alineaciones titulares, ni lesiones, ni declaraciones, ni datos que no estén.
- ALINEACIONES: a esta hora NO hay once confirmado. Habla de "convocados" y "jugadores a seguir", NUNCA presentes un XI titular como confirmado. Puedes citar nombres de la lista de convocados.
- Si el historial cara a cara viene vacío, NO lo inventes: omítelo o di que no hay precedentes recientes.
- Español neutro, previa profesional con ritmo y análisis (qué se juega, cómo llega cada equipo, el duelo táctico, jugadores a seguir). Sin emojis. Prohibido el lenguaje de apuestas; usa "favorito", "pronóstico". Di "Mundial 2026" o "el torneo".

ESTRUCTURA EXACTA del JSON de salida:
{
  "title": "Titular <=95 chars con las dos selecciones",
  "excerpt": "Entradilla <=220 chars",
  "seoDescription": "Meta description 120-155 chars con 'Mundial 2026'",
  "intro": ["párrafo de apertura: el cruce, qué se juega, hora y sede"],
  "sections": [
    { "h2": "Lo que se juega", "paragraphs": ["..."] },
    { "h2": "<Local>: cómo llega", "paragraphs": ["estilo, fortalezas/debilidades, estrella y DT"] },
    { "h2": "<Visitante>: cómo llega", "paragraphs": ["idem"] },
    { "h2": "El duelo", "paragraphs": ["choque de estilos, factores X; cara a cara si hay datos"] },
    { "h2": "Jugadores a seguir", "paragraphs": ["nombres reales de los convocados a vigilar por su rol; recuerda que el once se confirma cerca del saque"] }
  ]
}
450-700 palabras en total. Cada frase debe apoyarse en el JSON.`;

async function generateArticle(facts: unknown): Promise<LlmArticle | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const client = new Anthropic({ apiKey: key });
  const model = process.env.ANTHROPIC_MODEL_EDITORIAL || DEFAULT_MODEL;
  let resp;
  try {
    resp = await client.messages.create({
      model,
      max_tokens: 3000,
      temperature: 0.5,
      system: PREVIA_SYSTEM,
      messages: [
        { role: "user", content: `Hechos verificados (JSON):\n${JSON.stringify(facts)}\n\nDevuelve SOLO el JSON pedido.` },
      ],
    });
  } catch (err) {
    console.error("[mc-previa] API error", (err as Error).message);
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
  if (!parsed.title || !parsed.excerpt || !Array.isArray(parsed.intro) || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
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

/* ───────────────────────── Respaldo determinista ────────────────────────── */

function deterministicBlocks(meta: MatchMeta, h: Dossier | null, a: Dossier | null, hora: string): NoticiaBlock[] {
  const blocks: NoticiaBlock[] = [];
  blocks.push({
    type: "p",
    text: `${meta.home.name} y ${meta.away.name} se ven las caras en el Mundial 2026 (${meta.phase}${meta.group ? `, Grupo ${meta.group}` : ""}), a las ${hora}h de España en ${meta.venue}${meta.city ? ` (${meta.city})` : ""}. Repasamos cómo llega cada selección.`,
  });
  for (const d of [h, a].filter((x): x is Dossier => !!x)) {
    blocks.push({ type: "h2", text: `${d.nombre}: cómo llega` });
    const linea: string[] = [];
    if (d.ranking_fifa) linea.push(`${d.nombre} ocupa el puesto ${d.ranking_fifa}º del ranking FIFA.`);
    if (d.dt) linea.push(`Dirige ${d.dt}.`);
    if (d.estilo) linea.push(d.estilo);
    if (linea.length) blocks.push({ type: "p", text: linea.join(" ") });
    if (d.fortalezas.length) blocks.push({ type: "list", items: d.fortalezas });
  }
  return blocks;
}

/* ───────────────────────── Generación + publicación ──────────────────────── */

export interface PreviaResult {
  published: boolean;
  slug?: string;
  reason?: string;
  llm?: boolean;
}

export async function maybePublishPrevia(matchId: number, kickoffISO: string): Promise<PreviaResult> {
  const meta = buildMeta(matchId);
  if (!meta) return { published: false, reason: "no_meta" };

  const slugMap = await isoToSlug();
  const homeSlug = slugMap[meta.home.flag?.toLowerCase()] ?? null;
  const awaySlug = slugMap[meta.away.flag?.toLowerCase()] ?? null;

  const [hd, ad] = await Promise.all([dossier(homeSlug), dossier(awaySlug)]);
  // Sin NINGUNA ficha BIBLIA no hay material real suficiente: mejor no publicar
  // una previa hueca (las 48 selecciones del Mundial sí tienen ficha; esto es
  // una guarda defensiva ante un flag sin mapear).
  if (!hd && !ad) return { published: false, reason: "no_biblia" };
  // H2H y forma reciente: best-effort, null-safe (nunca inventan).
  const [h2h, formHome, formAway] = await Promise.all([
    getH2H(meta.home.id, meta.away.id).catch(() => null),
    readTeamForm(meta.home.id).catch(() => null),
    readTeamForm(meta.away.id).catch(() => null),
  ]);

  const ko = new Date(kickoffISO);
  const hora = madridTime(ko);
  const dateISO = madridDateISO(ko);
  const slug = `previa-mundial-${slugify(meta.home.name)}-${slugify(meta.away.name)}-${dateISO}`;

  const caraACara =
    h2h && h2h.matches.length > 0
      ? {
          resumen: h2h.recordText,
          ultimos: h2h.matches.slice(0, 5).map((mm) => {
            const y = (mm.date || "").slice(0, 4);
            return `${y}: ${mm.homeTeam} ${mm.goalsHome ?? "?"}-${mm.goalsAway ?? "?"} ${mm.awayTeam}${mm.competition ? ` (${mm.competition})` : ""}`;
          }),
        }
      : null;

  const facts = {
    partido: `${meta.home.name} vs ${meta.away.name}`,
    fase: meta.phase,
    grupo: meta.group || null,
    estadio: meta.venue,
    ciudad: meta.city || null,
    hora_espana: hora,
    local: hd,
    visitante: ad,
    cara_a_cara: caraACara,
    forma_reciente: formHome || formAway
      ? { local: formHome?.summary ?? null, visitante: formAway?.summary ?? null }
      : null,
  };

  const article = await generateArticle(facts);
  let title: string;
  let excerpt: string;
  let seoDescription: string | undefined;
  let blocks: NoticiaBlock[];

  if (article) {
    title = article.title;
    excerpt = article.excerpt;
    seoDescription = article.seoDescription;
    blocks = articleToBlocks(article);
  } else {
    title = `Previa ${meta.home.name} - ${meta.away.name}: claves del partido del Mundial 2026`;
    excerpt = `Todo lo que hay que saber antes de ${meta.home.name} vs ${meta.away.name} en el Mundial 2026: cómo llega cada selección, estrellas y qué se juega.`;
    blocks = deterministicBlocks(meta, hd, ad, hora);
  }

  // Bloques deterministas SIEMPRE presentes (datos verificables, sin LLM):
  const datos: string[] = [
    `Hora: ${hora}h (España peninsular).`,
    `Sede: ${meta.venue}${meta.city ? ` (${meta.city})` : ""}.`,
    `Competición: ${meta.phase}${meta.group ? ` · Grupo ${meta.group}` : ""}.`,
  ];
  if (hd?.ranking_fifa && ad?.ranking_fifa)
    datos.push(`Ranking FIFA: ${hd.nombre} ${hd.ranking_fifa}º · ${ad.nombre} ${ad.ranking_fifa}º.`);
  if (caraACara?.resumen) datos.push(`Cara a cara: ${caraACara.resumen}`);
  if (formHome?.summary) datos.push(`Forma ${hd?.nombre ?? meta.home.name}: ${formHome.summary}`);
  if (formAway?.summary) datos.push(`Forma ${ad?.nombre ?? meta.away.name}: ${formAway.summary}`);
  blocks.push({ type: "h2", text: "Datos del partido" });
  blocks.push({ type: "list", items: datos });

  // Jugadores a seguir (nombres reales de la BIBLIA), sin presentar un XI.
  const aSeguir: string[] = [];
  for (const d of [hd, ad].filter((x): x is Dossier => !!x)) {
    const refs: string[] = [];
    if (d.estrella) refs.push(`${d.estrella} (estrella)`);
    if (d.capitan && d.capitan !== d.estrella) refs.push(`${d.capitan} (capitán)`);
    if (d.factor_x && d.factor_x.jugador !== d.estrella) refs.push(`${d.factor_x.jugador} (factor X)`);
    if (refs.length) aSeguir.push(`${d.nombre}: ${refs.join(", ")}.`);
  }
  if (aSeguir.length) {
    blocks.push({ type: "h2", text: "Jugadores a seguir" });
    blocks.push({ type: "list", items: aSeguir });
  }

  blocks.push({
    type: "callout",
    title: "Alineaciones",
    text: "Los onces oficiales se confirman unos 40 minutos antes del saque. Aquí repasamos convocados y claves, no un equipo titular cerrado. Sigue el partido minuto a minuto en el Match Center de ZonaMundial.",
  });

  let hero: string | undefined;
  try {
    hero = (await matchHeroImage(meta)) || undefined;
  } catch {
    hero = undefined;
  }
  hero = hd?.fotoEstrella || ad?.fotoEstrella || hero || FALLBACK_HERO;

  // Acepta también banderas compuestas (gb-eng, gb-sct) para no perder la de
  // Inglaterra/Escocia en la tarjeta de la noticia.
  const flags = [meta.home.flag, meta.away.flag].filter((f) => /^[a-z]{2}(-[a-z]{3})?$/.test(f));

  const draft: DraftNoticia = {
    slug,
    title,
    excerpt,
    seoDescription: seoDescription ?? excerpt.slice(0, 155),
    cat: "analisis",
    date: dateISO,
    updatedAt: dateISO,
    readTime: Math.max(2, Math.round(wordsOf(blocks) / 200)),
    flags,
    tags: ["previa", "mundial 2026", meta.home.name, meta.away.name],
    featured: false,
    realImage: hero,
    imageSource: hero && hero !== FALLBACK_HERO ? "Wikimedia Commons" : undefined,
    authorId: "gabriel-venegas", // "Redacción ZonaMundial"
    body: blocks,
    sourceName: "ZonaMundial · Fichas oficiales del torneo",
    status: "published",
    sourceUrlHash: `mc-previa-${matchId}-${dateISO}`,
    ingestedAt: new Date().toISOString(),
  };

  const res = await publishDraft(draft);
  return { published: res === "published", slug, reason: res === "published" ? undefined : res, llm: !!article };
}

/* ───────────────────────── Trigger por ventana (cron) ────────────────────── */

/** Reserva la previa de un partido (SETNX). true solo la primera vez. */
async function reservePrevia(matchId: number): Promise<boolean> {
  if (!kvEnabled()) return false; // sin KV no podemos dedup → no publicamos en bucle
  try {
    const ok = await kv.set(`mc:previa:${matchId}`, 1, { nx: true, ex: DEDUP_TTL_SEC });
    return ok === "OK";
  } catch {
    return false;
  }
}

/** Libera la reserva para permitir un reintento en la siguiente pasada del
 *  cron (solo en fallos TRANSITORIOS: lock del store ocupado o excepción). */
async function releasePrevia(matchId: number): Promise<void> {
  if (!kvEnabled()) return;
  try {
    await kv.del(`mc:previa:${matchId}`);
  } catch {
    /* el TTL acabará liberándolo */
  }
}

export interface PreviaRunResult {
  checked: number;
  due: number;
  published: number;
  skipped: number;
}

/**
 * Recorre el calendario y publica la previa de los partidos cuyo saque cae a
 * ~PREVIA_LEAD_MINUTES. Idempotente vía SETNX. Pensado para el cron por minutos.
 */
export async function runMatchPrevias(now: Date = new Date()): Promise<PreviaRunResult> {
  const result: PreviaRunResult = { checked: 0, due: 0, published: 0, skipped: 0 };
  const lowMs = (PREVIA_LEAD_MINUTES - PREVIA_WINDOW_MINUTES) * 60_000;
  const highMs = (PREVIA_LEAD_MINUTES + PREVIA_WINDOW_MINUTES) * 60_000;
  const slugMap = await isoToSlug();

  for (const m of MATCHES as Match[]) {
    if (m.i >= 9000) continue; // slots de prueba/amistosos: sin previa editorial
    const kickoff = etToDate(m.d, m.t);
    if (!kickoff) continue;
    result.checked += 1;
    const deltaMs = kickoff.getTime() - now.getTime();
    if (deltaMs < lowMs || deltaMs > highMs) continue;
    // Partidos cuyos equipos aún no se conocen (eliminatorias: hf/af="tbd" en
    // matches.ts) NO se pueden previsualizar sin inventar. Se saltan SIN
    // consumir el SETNX, para que la previa pueda generarse en una pasada futura
    // si el calendario llega a traer las selecciones reales.
    if (!slugMap[m.hf?.toLowerCase()] && !slugMap[m.af?.toLowerCase()]) continue;
    result.due += 1;
    if (!(await reservePrevia(m.i))) {
      result.skipped += 1;
      continue;
    }
    try {
      const r = await maybePublishPrevia(m.i, kickoff.toISOString());
      if (r.published) result.published += 1;
      // Fallo TRANSITORIO (lock del store ocupado): libera para reintentar en la
      // próxima pasada. "exists"/"no_meta" son terminales: no se reintentan.
      else if (r.reason === "lock_busy") await releasePrevia(m.i);
    } catch (err) {
      await releasePrevia(m.i);
      console.error("[mc-previa] publish failed", m.i, (err as Error).message);
    }
  }
  return result;
}
