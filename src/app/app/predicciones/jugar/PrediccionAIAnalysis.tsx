"use client";

// Ayudante IA por partido para Predicciones (equivalente al "Análisis Coach IA"
// del bracket). Pide al endpoint /api/ia-coach/analyze una lectura del partido
// — probabilidades, marcador sugerido, confianza, factores, jugadores — para
// AYUDAR al usuario a decidir qué tendencia pronosticar. Botón "Aplicar
// sugerencia" que pre-rellena Resultado Exacto + Ganador (y Over/Under de goles
// si la línea coincide). Decisión final del usuario.
//
// Reusa la MISMA caché del bracket: construye el BracketMatch canónico
// (id "G-{grupo}-{pi}", equipos en el orden del motor) y traduce la salida a la
// orientación local/visitante de la página de predicciones. Solo iconos SVG.

import { useEffect, useState } from "react";
import { Brain, Coins, Sparkles, Wand2 } from "lucide-react";
import type { Match } from "@/data/matches";
import { BRACKET_TEAMS, GROUPS, TEAM_BY_ID } from "@/lib/bracket/teams";
import type { BracketMatch } from "@/lib/bracket/types";
import type {
  IACoachAnalysis,
  IACoachResponse,
  IACoachErrorResponse,
} from "@/lib/ia-coach/types";
import { FUN_FACTS } from "@/lib/ia-coach/fun-facts";
import { handleProRequired } from "@/lib/pro/paywall-client";

const BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const GREEN = "#22c55e", PURPLE = "#a78bfa";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

/** Sugerencia ya traducida a la orientación local/visitante de la página. */
export interface AISuggestion {
  exactScore: { home_goals: number; away_goals: number };
  winner: "home" | "draw" | "away";
  overUnder: { line: number; choice: "over" | "under" } | null;
}

// Round-robin de 4 equipos (índices 0-3) — réplica de GROUP_PAIRS en
// src/lib/bracket/engine.ts (no se exporta allí). Define el id canónico
// "G-{grupo}-{pi}" y el orden local/visitante de cada partido del bracket.
const GROUP_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2],
];
const ISO_TO_TEAM = new Map(BRACKET_TEAMS.map((t) => [t.iso, t]));

interface Bridge {
  id: string;
  bracketMatch: BracketMatch;
  canonHomeId: string;
  canonAwayId: string;
  predHomeId: string;
  predAwayId: string;
  /** true si el local del bracket es el visitante de la página (orden invertido). */
  flip: boolean;
}

/** Cruza un Match de predicciones con el BracketMatch canónico de su grupo. */
function buildBridge(m: Match): Bridge | null {
  const homeT = ISO_TO_TEAM.get(m.hf);
  const awayT = ISO_TO_TEAM.get(m.af);
  if (!homeT || !awayT || homeT.group !== awayT.group) return null;
  const group = homeT.group;
  const gi = GROUPS.indexOf(group as (typeof GROUPS)[number]);
  const teams = BRACKET_TEAMS.filter((t) => t.group === group);
  const iH = teams.indexOf(homeT);
  const iA = teams.indexOf(awayT);
  const pi = GROUP_PAIRS.findIndex(
    ([x, y]) => (x === iH && y === iA) || (x === iA && y === iH),
  );
  if (pi < 0) return null;
  const [p0, p1] = GROUP_PAIRS[pi];
  const canonHome = teams[p0];
  const canonAway = teams[p1];
  const id = `G-${group}-${pi}`;
  return {
    id,
    bracketMatch: {
      id,
      phase: "GROUP",
      groupIdx: gi,
      a: canonHome.id,
      b: canonAway.id,
      slotIdx: gi * 6 + pi,
      slotTotal: 72,
    },
    canonHomeId: canonHome.id,
    canonAwayId: canonAway.id,
    predHomeId: homeT.id,
    predAwayId: awayT.id,
    flip: canonHome.id !== homeT.id,
  };
}

interface Props {
  match: Match;
  /** Aplica la sugerencia a los módulos (Resultado exacto, Ganador, Over/Under). */
  onApply: (s: AISuggestion) => void | Promise<void>;
}

export default function PrediccionAIAnalysis({ match, onApply }: Props) {
  const [bridge] = useState(() => buildBridge(match));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IACoachAnalysis | null>(null);
  const [cached, setCached] = useState(false);

  // Si el partido no se puede cruzar con el bracket (datos incompletos),
  // simplemente no ofrecemos el ayudante: nunca mostramos algo roto.
  if (!bridge) return null;

  async function requestAnalysis() {
    if (!bridge) return;
    if (loading || analysis) { setOpen(true); return; }
    setLoading(true);
    setError(null);
    setOpen(true);
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 65_000);
    try {
      const r = await fetch("/api/ia-coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: bridge.id, match: bridge.bracketMatch }),
        signal: ac.signal,
      });
      const data = (await r.json()) as IACoachResponse | IACoachErrorResponse;
      // Cuota IA del plan Free agotada: abre el paywall global.
      if (data.ok === false && handleProRequired(data, "ia_coach_daily")) setError("Has usado tu consulta IA gratuita de hoy.");
      else if (data.ok === false) setError(humanError(data.error));
      else if (data.ok === true) { setAnalysis(data.analysis); setCached(data.cached); }
      else setError("Respuesta inválida del servidor.");
    } catch (err) {
      const e = err as Error;
      setError(e.name === "AbortError"
        ? "El análisis está tardando más de lo normal. Vuelve a intentarlo."
        : "No se pudo conectar con el Coach. Inténtalo de nuevo.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  if (!open && !analysis) {
    return (
      <button
        type="button"
        onClick={requestAnalysis}
        disabled={loading}
        aria-label="Pedir una idea al Coach IA para este partido"
        style={{
          width: "100%", cursor: "pointer", marginBottom: 14,
          background: "linear-gradient(135deg, rgba(167,139,250,0.16), rgba(201,168,76,0.10))",
          border: `1px solid ${PURPLE}55`, borderRadius: 14, color: "#fff",
          padding: "12px 14px", display: "flex", alignItems: "center", gap: 11,
          textAlign: "left",
        }}
      >
        <span style={{ display: "inline-flex", flexShrink: 0, width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", background: "rgba(167,139,250,0.18)", border: `1px solid ${PURPLE}55` }}>
          <Brain size={18} color={PURPLE} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: 13.5 }}>
            {loading ? "Analizando…" : "¿Dudas? Pide una idea a la IA"}
          </span>
          <span style={{ display: "block", color: MID, fontSize: 11.5, marginTop: 2 }}>
            Probabilidades, marcador sugerido y factores clave del partido.
          </span>
        </span>
        <Sparkles size={16} color={GOLD2} style={{ flexShrink: 0, marginLeft: "auto" }} />
      </button>
    );
  }

  return (
    <section
      aria-live="polite"
      style={{ background: BG2, border: CARD_BORDER, borderRadius: 16, padding: "14px 15px", marginBottom: 14 }}
    >
      <style>{"@keyframes pai-spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: PURPLE }}>
          <Brain size={15} color={PURPLE} /> Análisis Coach IA
        </span>
        {cached && (
          <span style={{ fontSize: 10, fontWeight: 800, color: MID, border: CARD_BORDER, borderRadius: 99, padding: "2px 8px" }}>Caché</span>
        )}
      </div>

      {loading && <LoadingState />}

      {error && (
        <div style={{ background: BG3, border: CARD_BORDER, borderRadius: 12, padding: "12px 14px", color: MID, fontSize: 13 }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setAnalysis(null); setOpen(false); void requestAnalysis(); }}
            style={{ marginTop: 10, cursor: "pointer", background: "transparent", color: GOLD2, border: `1px solid ${GOLD}55`, borderRadius: 8, fontWeight: 700, fontSize: 12.5, padding: "6px 12px" }}
          >
            Reintentar
          </button>
        </div>
      )}

      {analysis && !loading && (
        <AnalysisBody analysis={analysis} match={match} bridge={bridge} onApply={onApply} />
      )}
    </section>
  );
}

function LoadingState() {
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  useEffect(() => {
    const id = setInterval(() => setFactIdx((i) => (i + 1) % FUN_FACTS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 2px" }}>
      <span aria-hidden style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: `2.5px solid ${BG3}`, borderTopColor: PURPLE, animation: "pai-spin .8s linear infinite" }} />
      <p style={{ margin: 0, color: MID, fontSize: 12.5, lineHeight: 1.45 }}>
        Analizando el partido…<br />
        <span key={factIdx} style={{ color: DIM, fontSize: 11.5 }}>
          <strong style={{ color: GOLD2 }}>¿Sabías que…?</strong> {FUN_FACTS[factIdx]}
        </span>
      </p>
    </div>
  );
}

function AnalysisBody({ analysis, match, bridge, onApply }: {
  analysis: IACoachAnalysis;
  match: Match;
  bridge: Bridge;
  onApply: Props["onApply"];
}) {
  const [applying, setApplying] = useState(false);

  // Marcador sugerido en orientación CANÓNICA (a=canonHome, b=canonAway).
  const [sa, sb] = (analysis.scoreSuggestion || "0-0").split("-");
  const canonScoreA = clampGoals(parseInt(sa ?? "0", 10));
  const canonScoreB = clampGoals(parseInt(sb ?? "0", 10));

  // Traduce a la orientación LOCAL/VISITANTE de la página.
  const homeGoals = bridge.flip ? canonScoreB : canonScoreA;
  const awayGoals = bridge.flip ? canonScoreA : canonScoreB;
  const homeProb = bridge.flip ? analysis.probabilities.away : analysis.probabilities.home;
  const awayProb = bridge.flip ? analysis.probabilities.home : analysis.probabilities.away;
  const drawProb = analysis.probabilities.draw;

  // Ganador derivado del marcador sugerido (mantiene coherencia entre módulos).
  const winner: AISuggestion["winner"] =
    homeGoals > awayGoals ? "home" : homeGoals < awayGoals ? "away" : "draw";

  const homeColor = TEAM_BY_ID[bridge.predHomeId]?.color || GOLD;
  const awayColor = TEAM_BY_ID[bridge.predAwayId]?.color || GOLD;

  // Resuelve un código de equipo (3 letras) a su nombre legible en la página.
  const teamName = (code: string): string => {
    const c = (code || "").toUpperCase();
    if (c === bridge.predHomeId) return match.h;
    if (c === bridge.predAwayId) return match.a;
    return TEAM_BY_ID[c]?.name ?? code;
  };

  const confLabel = { baja: "Confianza baja", media: "Confianza media", alta: "Confianza alta" } as const;
  const confColor = { baja: DIM, media: GOLD2, alta: GREEN } as const;

  const suggestion: AISuggestion = {
    exactScore: { home_goals: homeGoals, away_goals: awayGoals },
    winner,
    overUnder: analysis.overUnder
      ? { line: analysis.overUnder.line, choice: analysis.overUnder.pick }
      : null,
  };

  const xg = analysis.xgEstimate
    ? (bridge.flip
        ? { home: analysis.xgEstimate.away, away: analysis.xgEstimate.home }
        : analysis.xgEstimate)
    : null;

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1.3 }}>
        {analysis.verdict}
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 11, color: DIM, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Marcador sugerido</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: GOLD2, fontVariantNumeric: "tabular-nums" }}>{homeGoals}–{awayGoals}</span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: confColor[analysis.confidence], border: `1px solid ${confColor[analysis.confidence]}55`, background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: "3px 10px" }}>
          {confLabel[analysis.confidence]}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        <ProbBar label={match.h} value={homeProb} highlight={winner === "home"} color={homeColor} />
        <ProbBar label="Empate" value={drawProb} highlight={winner === "draw"} color="#94a3b8" />
        <ProbBar label={match.a} value={awayProb} highlight={winner === "away"} color={awayColor} />
      </div>

      <div style={{ color: "#c7d0e0", fontSize: 13, lineHeight: 1.55 }}>
        {analysis.analysis.split(/\n\n+/).map((p, i) => (
          <p key={i} style={{ margin: i === 0 ? "0 0 8px" : "8px 0" }}>{p}</p>
        ))}
      </div>

      {analysis.keyFactors.length > 0 && (
        <Block title="Factores clave">
          <ul style={{ margin: 0, paddingLeft: 18, color: "#c7d0e0", fontSize: 12.5, lineHeight: 1.55 }}>
            {analysis.keyFactors.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </Block>
      )}

      {analysis.watchPlayer && (
        <Block title="Jugador a seguir">
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>
            {analysis.watchPlayer.name}
            <span style={{ color: GOLD2, fontWeight: 700, fontSize: 11.5, marginLeft: 8 }}>{teamName(analysis.watchPlayer.team)}</span>
          </div>
          <p style={{ margin: "4px 0 0", color: MID, fontSize: 12.5, lineHeight: 1.5 }}>{analysis.watchPlayer.reason}</p>
        </Block>
      )}

      {(xg || analysis.overUnder || analysis.firstGoalWindow) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginTop: 12 }}>
          {xg && (
            <ModelCard label="Goles esperados (xG)" value={`${xg.home.toFixed(1)} – ${xg.away.toFixed(1)}`} sub={`${match.h} / ${match.a}`} />
          )}
          {analysis.overUnder && (
            <ModelCard
              label="Línea de goles"
              value={`${analysis.overUnder.pick === "over" ? "Over" : "Under"} ${analysis.overUnder.line.toFixed(1)}`}
              sub={analysis.overUnder.reason}
            />
          )}
          {analysis.firstGoalWindow && (
            <ModelCard label="Primer gol" value={analysis.firstGoalWindow} />
          )}
        </div>
      )}

      {analysis.topScorers && analysis.topScorers.length > 0 && (
        <Block title="Candidatos a marcar">
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
            {analysis.topScorers.map((s, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>
                  {s.name}<span style={{ color: GOLD2, fontWeight: 700, fontSize: 11, marginLeft: 6 }}>{teamName(s.team)}</span>
                </span>
                <span style={{ color: DIM, fontSize: 11.5, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reason}</span>
                <span style={{ color: GREEN, fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>{Math.round(s.probability * 100)}%</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {analysis.tacticalDuel && (
        <Block title="Duelo táctico">
          <div style={{ fontWeight: 800, fontSize: 13 }}>{analysis.tacticalDuel.matchup}</div>
          <p style={{ margin: "4px 0 0", color: MID, fontSize: 12.5, lineHeight: 1.5 }}>{analysis.tacticalDuel.analysis}</p>
        </Block>
      )}

      {analysis.missingData && analysis.missingData.length > 0 && (
        <Block title="Datos que afinarían el pronóstico">
          <ul style={{ margin: 0, paddingLeft: 18, color: MID, fontSize: 12, lineHeight: 1.5 }}>
            {analysis.missingData.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </Block>
      )}

      <button
        type="button"
        disabled={applying}
        onClick={async () => { setApplying(true); try { await onApply(suggestion); } finally { setApplying(false); } }}
        style={{
          marginTop: 16, width: "100%", cursor: applying ? "default" : "pointer",
          background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#1a1206",
          border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13.5, padding: "11px 14px",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
          opacity: applying ? 0.7 : 1,
        }}
      >
        <Wand2 size={16} /> {applying ? "Aplicando…" : "Aplicar sugerencia a mis predicciones"}
      </button>
      <p style={{ margin: "8px 0 0", display: "inline-flex", alignItems: "center", gap: 6, color: DIM, fontSize: 11, lineHeight: 1.4 }}>
        <Coins size={12} color={GOLD} /> Pre-rellena Resultado exacto y Ganador (y Over/Under si la línea encaja). Análisis generado por IA: la decisión final es tuya.
      </p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12, background: BG3, border: CARD_BORDER, borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD2, marginBottom: 7 }}>{title}</div>
      {children}
    </div>
  );
}

function ModelCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: BG3, border: CARD_BORDER, borderRadius: 10, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: DIM, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{value}</span>
      {sub && <span style={{ fontSize: 10.5, color: MID, lineHeight: 1.35 }}>{sub}</span>}
    </div>
  );
}

function ProbBar({ label, value, highlight, color }: { label: string; value: number; highlight: boolean; color: string }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: 92, flexShrink: 0, fontSize: 12, fontWeight: highlight ? 800 : 600, color: highlight ? "#fff" : MID, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div
        role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${pct}%`}
        style={{ flex: 1, height: 9, background: BG3, border: CARD_BORDER, borderRadius: 99, overflow: "hidden" }}
      >
        <span style={{ display: "block", height: "100%", width: `${Math.max(2, pct)}%`, background: highlight ? color : "rgba(255,255,255,0.18)", borderRadius: 99, transition: "width .4s ease" }} />
      </div>
      <span style={{ width: 36, flexShrink: 0, textAlign: "right", fontSize: 12, fontWeight: 800, color: highlight ? "#fff" : MID, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

function clampGoals(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, 20);
}

function humanError(code: string): string {
  switch (code) {
    case "invalid_json": return "Petición inválida. Intenta de nuevo.";
    case "missing_matchId_or_match": return "Faltan datos del partido.";
    case "match_not_ready": return "Aún no hay equipos definidos para este partido.";
    case "context_build_failed": return "No pudimos preparar los datos del análisis.";
    case "teams_not_found": return "No encontramos información de las selecciones.";
    case "anthropic_failed": return "El Coach IA no respondió. Inténtalo en unos segundos.";
    default: return "Algo falló. Inténtalo de nuevo.";
  }
}
