"use client";

// Módulo jugable de Predicciones: selector de partido + las 8 cards de tipos de
// predicción, cada una con su formulario. Persiste contra /api/predictions.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MATCHES, type Match } from "@/data/matches";
import { SELECCIONES } from "@/data/selecciones";
import { etToDate } from "@/lib/bracket/match-time";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  MINUTE_RANGES,
  PREDICTION_TYPES,
  TYPE_META,
  type ChainEventType,
  type DramaEvent,
  type MinuteRange,
  type OverUnderCategory,
  type OverUnderDifficulty,
  type PredictionData,
  type PredictionType,
  type WinnerResult,
} from "@/lib/predictions/types";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const GREEN = "#22c55e", RED = "#ef4444";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

const flagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

// ─── Multiplicador "Modo Underdog" (mismo criterio que el backend) ───────────
const byFlag = new Map(SELECCIONES.map((s) => [s.flagCode, s]));
function tierOf(m: Match): { multiplier: number; label: string; emoji: string } {
  const a = byFlag.get(m.hf)?.rankingFIFA ?? 90;
  const b = byFlag.get(m.af)?.rankingFIFA ?? 90;
  const gap = Math.abs(a - b);
  if (gap >= 75) return { multiplier: 2.0, label: "Diamante", emoji: "💎" };
  if (gap >= 40) return { multiplier: 1.5, label: "Oro", emoji: "🟡" };
  if (gap >= 15) return { multiplier: 1.25, label: "Bronce", emoji: "🟠" };
  return { multiplier: 1.0, label: "Estelar", emoji: "🟢" };
}

const fmtKickoff = (m: Match): string => {
  const d = etToDate(m.d, m.t);
  if (!d) return "Por confirmar";
  return d.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// ─── Tipos de respuesta de la API ────────────────────────────────────────────
interface MatchPrediction {
  id: string;
  prediction_type: PredictionType;
  prediction_data: PredictionData;
  confidence_multiplier: number;
  is_contrarian: boolean;
  status: "pending" | "resolved";
  points_earned: number | null;
  is_correct: boolean | null;
}
interface MatchState {
  match_id: string;
  match: { home_team: string; away_team: string; home_flag: string; away_flag: string; kickoff_at: string | null; phase: string };
  match_multiplier: number;
  match_tier: string;
  match_tier_emoji: string;
  predictions_close_at: string | null;
  predictions: MatchPrediction[];
  types_completed: PredictionType[];
}
interface ScorerCandidate { id: string; name: string; team: string; pos: string }
interface DuelPlayerOut { id: string; name: string; team: string; position: string; stats: Record<string, number> }
interface DuelOut { duel_id: string; player_a: DuelPlayerOut; player_b: DuelPlayerOut; context: string; metric: string }
interface OverUnderLineOut {
  category: OverUnderCategory;
  easy: { line: number; points: number };
  medium: { line: number; points: number };
  hard: { line: number; points: number };
}
interface SocialStatRow { option_key: string; count: number; pct: number }
interface SocialStatsOut { total_predictions: number; stats: Record<string, SocialStatRow[]> }

const CATEGORY_LABEL: Record<OverUnderCategory, string> = {
  goals: "Goles", corners: "Córners", cards: "Tarjetas", shots_on_target: "Tiros a puerta",
};
const DRAMA_LABEL: Record<DramaEvent, string> = {
  first_goal: "Primer gol", first_card: "Primera tarjeta", first_sub: "Primer cambio", last_goal: "Último gol",
};
const CHAIN_EVENT_LABEL: Record<ChainEventType, string> = {
  goal: "Gol", card: "Tarjeta", halftime_score: "Marcador al descanso", winner: "Ganador",
};

export default function PrediccionesGame() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [state, setState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const [scorers, setScorers] = useState<ScorerCandidate[]>([]);
  const [duels, setDuels] = useState<DuelOut[]>([]);
  const [ouLines, setOuLines] = useState<OverUnderLineOut[]>([]);
  const [social, setSocial] = useState<SocialStatsOut | null>(null);

  // Partidos seleccionables (fase de grupos, en orden de calendario).
  const groupMatches = useMemo(
    () => MATCHES.filter((m) => m.p === "Fase de grupos").sort((a, b) => a.i - b.i),
    [],
  );
  const selectedMatch = useMemo(() => groupMatches.find((m) => String(m.i) === matchId) ?? null, [groupMatches, matchId]);

  useEffect(() => {
    const supa = createSupabaseBrowserClient();
    supa.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(id);
    }
  }, [toast]);

  const loadMatch = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [mRes, sRes, dRes, oRes, socRes] = await Promise.all([
        fetch(`/api/predictions/match/${id}`),
        fetch(`/api/predictions/match/${id}/scorers`),
        fetch(`/api/predictions/match/${id}/duels`),
        fetch(`/api/predictions/match/${id}/over-under-lines`),
        fetch(`/api/predictions/match/${id}/social-stats`),
      ]);
      if (mRes.ok) setState(await mRes.json());
      setScorers(sRes.ok ? (await sRes.json()).candidates ?? [] : []);
      setDuels(dRes.ok ? (await dRes.json()).duels ?? [] : []);
      setOuLines(oRes.ok ? (await oRes.json()).lines ?? [] : []);
      setSocial(socRes.ok ? await socRes.json() : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectMatch = useCallback((id: string) => {
    setMatchId(id);
    setState(null);
    void loadMatch(id);
  }, [loadMatch]);

  const submit = useCallback(async (
    type: PredictionType,
    data: PredictionData,
    confidence?: number,
  ) => {
    if (!matchId) return;
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId, prediction_type: type, prediction_data: data, confidence_multiplier: confidence }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setToast({ kind: "ok", msg: `¡Predicción guardada! ${TYPE_META[type].emoji} ${TYPE_META[type].label}` });
      await loadMatch(matchId);
    } else {
      setToast({ kind: "err", msg: json.message || json.error || "No se pudo guardar la predicción" });
    }
  }, [matchId, loadMatch]);

  if (authed === false) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "80px 20px", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 56 }}>🔮</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginTop: 12 }}>Predicciones del Mundial</h1>
          <p style={{ color: MID, marginTop: 12, lineHeight: 1.6 }}>
            Inicia sesión para predecir resultados, goleadores, duelos y mucho más. Acumula puntos y escala en el ranking.
          </p>
          <Link href="/login?next=/app/predicciones/jugar" style={ctaStyle}>Iniciar sesión</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header style={{ padding: "20px 16px 8px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>ZonaMundial</span>
            <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>🔮 Predicciones</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/app/predicciones/jugar/ranking" style={pillLink}>🏆 Ranking</Link>
            <Link href="/app/predicciones/jugar/stats" style={pillLink}>📈 Mis stats</Link>
          </div>
        </div>
      </header>

      {/* Selector de partido */}
      <section style={{ padding: "8px 0 4px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: MID, marginBottom: 8 }}>Elige un partido</h2>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, scrollSnapType: "x mandatory" }}>
          {groupMatches.map((m) => {
            const t = tierOf(m);
            const active = String(m.i) === matchId;
            return (
              <button key={m.i} onClick={() => selectMatch(String(m.i))} style={{
                flex: "0 0 auto", width: 190, scrollSnapAlign: "start", textAlign: "left", cursor: "pointer",
                background: active ? "rgba(201,168,76,0.12)" : BG2,
                border: active ? `1px solid ${GOLD}` : CARD_BORDER, borderRadius: 14, padding: 12, color: "#fff",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: DIM }}>Grupo {m.g} · {fmtKickoff(m)}</span>
                  <span title={t.label} style={{ fontSize: 13 }}>{t.emoji}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagUrl(m.hf)} alt="" style={{ width: 22, height: 15, borderRadius: 2, objectFit: "cover" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.h}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagUrl(m.af)} alt="" style={{ width: 22, height: 15, borderRadius: 2, objectFit: "cover" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.a}</span>
                </div>
                {t.multiplier > 1 && (
                  <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: GOLD }}>×{t.multiplier.toFixed(2)} {t.label}</div>
                )}
              </button>
            );
          })}
          </div>
        </div>
      </section>

      {/* Panel del partido seleccionado */}
      {!selectedMatch && (
        <p style={{ textAlign: "center", color: DIM, padding: "40px 20px" }}>Selecciona un partido para empezar a predecir.</p>
      )}

      {selectedMatch && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 16px 60px" }}>
          <MatchHeader m={selectedMatch} state={state} />
          {loading && !state && <p style={{ color: DIM, textAlign: "center", padding: 24 }}>Cargando predicciones…</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
            {PREDICTION_TYPES.map((type) => {
              const existing = state?.predictions.find((p) => p.prediction_type === type) ?? null;
              const mult = state?.match_multiplier ?? tierOf(selectedMatch).multiplier;
              return (
                <TypeCard key={type} type={type} mult={mult}>
                  {existing ? (
                    <CompletedView p={existing} type={type} scorers={scorers} duels={duels} />
                  ) : (
                    <TypeForm
                      type={type}
                      match={selectedMatch}
                      scorers={scorers}
                      duels={duels}
                      ouLines={ouLines}
                      social={social}
                      onSubmit={submit}
                    />
                  )}
                </TypeCard>
              );
            })}
          </div>
        </section>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 50,
          background: toast.kind === "ok" ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
          color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxWidth: "90vw", textAlign: "center",
        }}>
          {toast.msg}
        </div>
      )}
    </Shell>
  );
}

// ─── Layout base ─────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", paddingBottom: 40 }}>
      {children}
    </div>
  );
}

function MatchHeader({ m, state }: { m: Match; state: MatchState | null }) {
  const t = tierOf(m);
  const completed = state?.types_completed.length ?? 0;
  const pct = Math.round((completed / PREDICTION_TYPES.length) * 100);
  const close = state?.predictions_close_at ? new Date(state.predictions_close_at) : null;
  return (
    <div style={{ background: BG2, border: CARD_BORDER, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        <TeamTag flag={m.hf} name={m.h} />
        <span style={{ fontWeight: 900, color: DIM }}>VS</span>
        <TeamTag flag={m.af} name={m.a} right />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Badge>{m.vc} · {fmtKickoff(m)}</Badge>
        <Badge>{t.emoji} {t.label} ×{t.multiplier.toFixed(2)}</Badge>
        {close && <Badge>Cierra {close.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Badge>}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MID, marginBottom: 4 }}>
          <span>Progreso: {completed}/{PREDICTION_TYPES.length} tipos</span>
          {completed === PREDICTION_TYPES.length && <span style={{ color: GOLD, fontWeight: 700 }}>¡Predicción perfecta posible! +500</span>}
        </div>
        <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${GOLD},${GOLD2})`, transition: "width 0.4s" }} />
        </div>
      </div>
    </div>
  );
}

function TeamTag({ flag, name, right }: { flag: string; name: string; right?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: right ? "row-reverse" : "row" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flagUrl(flag)} alt="" style={{ width: 34, height: 23, borderRadius: 4, objectFit: "cover" }} />
      <span style={{ fontWeight: 800, fontSize: 16 }}>{name}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, fontWeight: 600, color: MID, background: "rgba(255,255,255,0.05)", border: CARD_BORDER, borderRadius: 20, padding: "4px 10px" }}>{children}</span>;
}

function TypeCard({ type, mult, children }: { type: PredictionType; mult: number; children: React.ReactNode }) {
  const meta = TYPE_META[type];
  const maxPts = Math.round(meta.maxPoints * mult);
  return (
    <div style={{ background: BG3, border: CARD_BORDER, borderRadius: 16, padding: 16, borderTop: `3px solid ${meta.color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{meta.emoji}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 800, fontSize: 15 }}>{meta.label}</h3>
          <span style={{ fontSize: 11, color: DIM }}>Dificultad: {meta.difficulty}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: "rgba(201,168,76,0.12)", borderRadius: 8, padding: "3px 8px" }}>
          hasta {maxPts} pts
        </span>
      </div>
      <p style={{ fontSize: 12, color: MID, lineHeight: 1.5, marginBottom: 12 }}>{meta.blurb}</p>
      {children}
    </div>
  );
}

// ─── Vista de predicción ya enviada ──────────────────────────────────────────
function CompletedView({ p, type, scorers, duels }: { p: MatchPrediction; type: PredictionType; scorers: ScorerCandidate[]; duels: DuelOut[] }) {
  const summary = summarize(type, p, scorers, duels);
  const resolved = p.status === "resolved";
  const color = resolved ? (p.is_correct ? GREEN : RED) : GOLD;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}40`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color, fontWeight: 800, fontSize: 13 }}>{resolved ? (p.is_correct ? "✓ Acertaste" : "✗ Fallaste") : "✓ Enviada"}</span>
        {resolved && <span style={{ marginLeft: "auto", fontWeight: 800, color }}>{(p.points_earned ?? 0) > 0 ? "+" : ""}{p.points_earned ?? 0} pts</span>}
      </div>
      <div style={{ fontSize: 13, color: MID, marginTop: 6 }}>{summary}</div>
    </div>
  );
}

function summarize(type: PredictionType, p: MatchPrediction, scorers: ScorerCandidate[], duels: DuelOut[]): string {
  const d = p.prediction_data as unknown as Record<string, unknown>;
  switch (type) {
    case "exact_score": return `Marcador: ${d.home_goals}-${d.away_goals}`;
    case "winner": return `Ganador: ${d.result === "home" ? "Local" : d.result === "away" ? "Visitante" : "Empate"} (×${p.confidence_multiplier})`;
    case "first_scorer": return d.no_goals ? "Nadie marca" : `Goleador: ${scorers.find((s) => s.id === d.player_id)?.name ?? "Jugador"}`;
    case "chain": return `Cadena de ${(d.chain as unknown[])?.length ?? 0} eslabones`;
    case "duel": {
      const duel = duels.find((x) => x.duel_id === d.duel_id);
      const w = duel && (duel.player_a.id === d.winner_player_id ? duel.player_a : duel.player_b);
      return `Duelo: ${w?.name ?? "elegido"}`;
    }
    case "over_under": return `${CATEGORY_LABEL[d.category as OverUnderCategory]}: ${d.choice === "over" ? "Más de" : "Menos de"} ${d.line}`;
    case "minute_drama": return d.no_event ? `${DRAMA_LABEL[d.event as DramaEvent]}: no ocurre` : `${DRAMA_LABEL[d.event as DramaEvent]}: ${d.minute_range}'`;
    case "social": return `${d.choice} ${p.is_contrarian ? "(contrarian 🔥)" : "(con la manada)"}`;
    default: return "Predicción enviada";
  }
}

// ─── Formularios por tipo ────────────────────────────────────────────────────
type SubmitFn = (type: PredictionType, data: PredictionData, confidence?: number) => Promise<void>;

function TypeForm(props: {
  type: PredictionType;
  match: Match;
  scorers: ScorerCandidate[];
  duels: DuelOut[];
  ouLines: OverUnderLineOut[];
  social: SocialStatsOut | null;
  onSubmit: SubmitFn;
}) {
  switch (props.type) {
    case "exact_score": return <ExactScoreForm {...props} />;
    case "winner": return <WinnerForm {...props} />;
    case "first_scorer": return <FirstScorerForm {...props} />;
    case "chain": return <ChainForm {...props} />;
    case "duel": return <DuelForm {...props} />;
    case "over_under": return <OverUnderForm {...props} />;
    case "minute_drama": return <MinuteDramaForm {...props} />;
    case "social": return <SocialForm {...props} />;
  }
}

const btnPrimary: React.CSSProperties = {
  width: "100%", marginTop: 12, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
  background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 14,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, background: BG, border: CARD_BORDER, color: "#fff", fontSize: 14,
};
function optBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "8px 6px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
    background: active ? "rgba(201,168,76,0.18)" : BG, color: active ? GOLD : MID,
    border: active ? `1px solid ${GOLD}` : CARD_BORDER,
  };
}

function ExactScoreForm({ match, onSubmit }: { match: Match; onSubmit: SubmitFn }) {
  const [h, setH] = useState(1);
  const [a, setA] = useState(1);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Stepper label={match.h} value={h} onChange={setH} />
        <span style={{ fontWeight: 900, color: DIM }}>–</span>
        <Stepper label={match.a} value={a} onChange={setA} />
      </div>
      <button disabled={busy} style={btnPrimary} onClick={async () => { setBusy(true); await onSubmit("exact_score", { home_goals: h, away_goals: a }); setBusy(false); }}>
        Guardar marcador
      </button>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: DIM, marginBottom: 4, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))} style={stepBtn}>−</button>
        <span style={{ fontSize: 22, fontWeight: 900, minWidth: 24 }}>{value}</span>
        <button onClick={() => onChange(Math.min(20, value + 1))} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
const stepBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, border: CARD_BORDER, background: BG, color: GOLD, fontSize: 18, fontWeight: 800, cursor: "pointer" };

function WinnerForm({ match, onSubmit }: { match: Match; onSubmit: SubmitFn }) {
  const [result, setResult] = useState<WinnerResult | null>(null);
  const [conf, setConf] = useState(1);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setResult("home")} style={optBtn(result === "home")}>{match.h}</button>
        <button onClick={() => setResult("draw")} style={optBtn(result === "draw")}>Empate</button>
        <button onClick={() => setResult("away")} style={optBtn(result === "away")}>{match.a}</button>
      </div>
      <div style={{ fontSize: 11, color: DIM, margin: "10px 0 4px" }}>Confianza (multiplica puntos y riesgo):</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3].map((c) => <button key={c} onClick={() => setConf(c)} style={optBtn(conf === c)}>×{c}</button>)}
      </div>
      <button disabled={busy || !result} style={{ ...btnPrimary, opacity: result ? 1 : 0.5 }}
        onClick={async () => { if (!result) return; setBusy(true); await onSubmit("winner", { result }, conf); setBusy(false); }}>
        Guardar ganador
      </button>
    </div>
  );
}

function FirstScorerForm({ scorers, onSubmit }: { scorers: ScorerCandidate[]; onSubmit: SubmitFn }) {
  const [playerId, setPlayerId] = useState<string>("");
  const [noGoals, setNoGoals] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <select value={noGoals ? "" : playerId} disabled={noGoals} onChange={(e) => setPlayerId(e.target.value)} style={inputStyle}>
        <option value="">Elige goleador…</option>
        {scorers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.team} ({s.pos})</option>)}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: MID, cursor: "pointer" }}>
        <input type="checkbox" checked={noGoals} onChange={(e) => setNoGoals(e.target.checked)} />
        Nadie marca (0-0)
      </label>
      <button disabled={busy || (!noGoals && !playerId)} style={{ ...btnPrimary, opacity: noGoals || playerId ? 1 : 0.5 }}
        onClick={async () => { setBusy(true); await onSubmit("first_scorer", { player_id: noGoals ? null : playerId, no_goals: noGoals }); setBusy(false); }}>
        Guardar goleador
      </button>
    </div>
  );
}

function ChainForm({ onSubmit }: { onSubmit: SubmitFn }) {
  const [steps, setSteps] = useState<{ event_type: ChainEventType; description: string }[]>([
    { event_type: "goal", description: "" },
    { event_type: "card", description: "" },
    { event_type: "winner", description: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const update = (i: number, patch: Partial<{ event_type: ChainEventType; description: string }>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <span style={{ width: 18, fontWeight: 800, color: GOLD, fontSize: 13 }}>{i + 1}</span>
          <select value={s.event_type} onChange={(e) => update(i, { event_type: e.target.value as ChainEventType })} style={{ ...inputStyle, width: 130 }}>
            {(Object.keys(CHAIN_EVENT_LABEL) as ChainEventType[]).map((k) => <option key={k} value={k}>{CHAIN_EVENT_LABEL[k]}</option>)}
          </select>
          <input value={s.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Detalle…" style={{ ...inputStyle, flex: 1 }} />
        </div>
      ))}
      <button disabled={busy} style={btnPrimary} onClick={async () => {
        setBusy(true);
        await onSubmit("chain", { chain: steps.map((s, i) => ({ step: i + 1, event_type: s.event_type, event_data: { description: s.description } })) });
        setBusy(false);
      }}>
        Guardar cadena (3 eslabones)
      </button>
    </div>
  );
}

function DuelForm({ duels, onSubmit }: { duels: DuelOut[]; onSubmit: SubmitFn }) {
  const [pick, setPick] = useState<{ duelId: string; playerId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!duels.length) return <p style={{ fontSize: 12, color: DIM }}>No hay duelos disponibles para este partido.</p>;
  return (
    <div>
      {duels.map((d) => (
        <div key={d.duel_id} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 4 }}>{d.context}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[d.player_a, d.player_b].map((pl) => {
              const active = pick?.duelId === d.duel_id && pick?.playerId === pl.id;
              return (
                <button key={pl.id} onClick={() => setPick({ duelId: d.duel_id, playerId: pl.id })} style={{ ...optBtn(active), flexDirection: "column", textAlign: "left", alignItems: "flex-start", padding: 8 }}>
                  <span style={{ fontSize: 12 }}>{pl.name}</span>
                  <span style={{ fontSize: 10, color: DIM }}>{pl.team} · forma {pl.stats.form}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button disabled={busy || !pick} style={{ ...btnPrimary, opacity: pick ? 1 : 0.5 }}
        onClick={async () => { if (!pick) return; setBusy(true); await onSubmit("duel", { duel_id: pick.duelId, winner_player_id: pick.playerId }); setBusy(false); }}>
        Guardar duelo
      </button>
    </div>
  );
}

function OverUnderForm({ ouLines, onSubmit }: { ouLines: OverUnderLineOut[]; onSubmit: SubmitFn }) {
  const [category, setCategory] = useState<OverUnderCategory>("goals");
  const [difficulty, setDifficulty] = useState<OverUnderDifficulty>("medium");
  const [choice, setChoice] = useState<"over" | "under" | null>(null);
  const [busy, setBusy] = useState(false);
  const line = ouLines.find((l) => l.category === category);
  const sel = line ? line[difficulty] : null;
  return (
    <div>
      <select value={category} onChange={(e) => setCategory(e.target.value as OverUnderCategory)} style={inputStyle}>
        {ouLines.map((l) => <option key={l.category} value={l.category}>{CATEGORY_LABEL[l.category]}</option>)}
      </select>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {(["easy", "medium", "hard"] as OverUnderDifficulty[]).map((dd) => (
          <button key={dd} onClick={() => setDifficulty(dd)} style={optBtn(difficulty === dd)}>
            {dd === "easy" ? "Fácil" : dd === "medium" ? "Media" : "Difícil"}
            {line && <span style={{ display: "block", fontSize: 10, color: DIM }}>{line[dd].points} pts</span>}
          </button>
        ))}
      </div>
      {sel && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => setChoice("over")} style={optBtn(choice === "over")}>Más de {sel.line}</button>
          <button onClick={() => setChoice("under")} style={optBtn(choice === "under")}>Menos de {sel.line}</button>
        </div>
      )}
      <button disabled={busy || !choice || !sel} style={{ ...btnPrimary, opacity: choice && sel ? 1 : 0.5 }}
        onClick={async () => { if (!choice || !sel) return; setBusy(true); await onSubmit("over_under", { category, line: sel.line, choice, difficulty }); setBusy(false); }}>
        Guardar over/under
      </button>
    </div>
  );
}

function MinuteDramaForm({ onSubmit }: { onSubmit: SubmitFn }) {
  const [event, setEvent] = useState<DramaEvent>("first_goal");
  const [range, setRange] = useState<MinuteRange>("0-10");
  const [noEvent, setNoEvent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <select value={event} onChange={(e) => setEvent(e.target.value as DramaEvent)} style={inputStyle}>
        {(Object.keys(DRAMA_LABEL) as DramaEvent[]).map((k) => <option key={k} value={k}>{DRAMA_LABEL[k]}</option>)}
      </select>
      <select value={range} disabled={noEvent} onChange={(e) => setRange(e.target.value as MinuteRange)} style={{ ...inputStyle, marginTop: 8 }}>
        {MINUTE_RANGES.map((r) => <option key={r} value={r}>Minuto {r}</option>)}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: MID, cursor: "pointer" }}>
        <input type="checkbox" checked={noEvent} onChange={(e) => setNoEvent(e.target.checked)} />
        El evento no ocurre
      </label>
      <button disabled={busy} style={btnPrimary}
        onClick={async () => { setBusy(true); await onSubmit("minute_drama", noEvent ? { event, no_event: true } : { event, minute_range: range }); setBusy(false); }}>
        Guardar minuto
      </button>
    </div>
  );
}

function SocialForm({ match, social, onSubmit }: { match: Match; social: SocialStatsOut | null; onSubmit: SubmitFn }) {
  const [choice, setChoice] = useState<WinnerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const winnerStats = social?.stats?.winner ?? [];
  const pctOf = (r: WinnerResult): number => winnerStats.find((s) => s.option_key === `winner:${r}`)?.pct ?? 0;
  const total = social?.total_predictions ?? 0;
  const options: { key: WinnerResult; label: string }[] = [
    { key: "home", label: match.h }, { key: "draw", label: "Empate" }, { key: "away", label: match.a },
  ];
  const chosenPct = choice ? pctOf(choice) : 50;
  return (
    <div>
      <div style={{ fontSize: 11, color: DIM, marginBottom: 6 }}>{total > 0 ? `${total} predicciones de la comunidad` : "Sé el primero en predecir"}</div>
      {options.map((o) => {
        const pct = pctOf(o.key);
        const active = choice === o.key;
        return (
          <button key={o.key} onClick={() => setChoice(o.key)} style={{
            width: "100%", marginBottom: 6, padding: "8px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left",
            position: "relative", overflow: "hidden", border: active ? `1px solid ${GOLD}` : CARD_BORDER, background: BG, color: "#fff",
          }}>
            <span style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "rgba(236,72,153,0.18)" }} />
            <span style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
              <span>{o.label}</span><span style={{ color: MID }}>{pct}%</span>
            </span>
          </button>
        );
      })}
      {choice && (
        <div style={{ fontSize: 11, color: chosenPct < 50 ? GOLD : MID, marginTop: 4 }}>
          {chosenPct < 50 ? "🔥 Vas contra la manada: más puntos si aciertas" : "Vas con la mayoría"}
        </div>
      )}
      <button disabled={busy || !choice} style={{ ...btnPrimary, opacity: choice ? 1 : 0.5 }}
        onClick={async () => { if (!choice) return; setBusy(true); await onSubmit("social", { question_key: "winner", choice, community_pct_at_time: chosenPct }); setBusy(false); }}>
        Guardar en Modo Manada
      </button>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "inline-block", marginTop: 24, padding: "14px 32px", borderRadius: 12,
  background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, textDecoration: "none",
};
const pillLink: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: MID, textDecoration: "none", background: BG2, border: CARD_BORDER,
  borderRadius: 20, padding: "6px 12px",
};
