"use client";

// Módulo jugable de Predicciones: selector de partido + las 8 cards de tipos de
// predicción, cada una con su formulario. Persiste contra /api/predictions.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MATCHES, type Match } from "@/data/matches";
import { SELECCIONES } from "@/data/selecciones";
import { etToDate } from "@/lib/bracket/match-time";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import GamificationHUD from "./GamificationHUD";
import BattlePass from "./BattlePass";
import Cosmetics from "./Cosmetics";
import LiveMicroPicks from "./LiveMicroPicks";
import {
  TYPE_ICON, TIER_ICON,
  ArrowLeft, Calendar, Check, ChevronRight, Clock, Flame, Gem, Globe, Pencil, Sparkles, TrendingUp, Trophy, Users, X,
} from "./icons";
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
const TIER_COLOR: Record<string, string> = { Estelar: GREEN, Bronce: "#cd7f32", Oro: GOLD, Diamante: "#38bdf8" };
function tierOf(m: Match): { multiplier: number; label: string } {
  const a = byFlag.get(m.hf)?.rankingFIFA ?? 90;
  const b = byFlag.get(m.af)?.rankingFIFA ?? 90;
  const gap = Math.abs(a - b);
  if (gap >= 75) return { multiplier: 2.0, label: "Diamante" };
  if (gap >= 40) return { multiplier: 1.5, label: "Oro" };
  if (gap >= 15) return { multiplier: 1.25, label: "Bronce" };
  return { multiplier: 1.0, label: "Estelar" };
}
function TierIcon({ label, size = 16 }: { label: string; size?: number }) {
  const Icon = TIER_ICON[label] ?? TIER_ICON.Estelar;
  return <Icon size={size} color={TIER_COLOR[label]} fill={label === "Estelar" ? TIER_COLOR[label] : "none"} />;
}

const fmtKickoff = (m: Match): string => {
  const d = etToDate(m.d, m.t);
  if (!d) return "Por confirmar";
  return d.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const flagUrlLg = (code: string) => `https://flagcdn.com/w80/${code}.png`;

// Texto emocional según el multiplicador de la rivalidad.
function tierMood(mult: number): string {
  if (mult >= 2) return "Batacazo histórico";
  if (mult >= 1.5) return "Sorpresa posible";
  if (mult >= 1.25) return "Partido abierto";
  return "Favorito claro";
}

// ¿El partido se juega hoy? (solo presentación, para el filtro "Hoy").
function isMatchToday(m: Match): boolean {
  const d = etToDate(m.d, m.t);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

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
  const [pendingTeams, setPendingTeams] = useState<string[]>([]);
  const [duels, setDuels] = useState<DuelOut[]>([]);
  const [ouLines, setOuLines] = useState<OverUnderLineOut[]>([]);
  const [social, setSocial] = useState<SocialStatsOut | null>(null);
  const [editing, setEditing] = useState<Set<PredictionType>>(new Set());
  const latestLoad = useRef<string | null>(null);
  const stateRef = useRef<MatchState | null>(null);
  stateRef.current = state;

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
    latestLoad.current = id;
    setLoading(true);
    try {
      const [mRes, sRes, dRes, oRes, socRes] = await Promise.all([
        fetch(`/api/predictions/match/${id}`),
        fetch(`/api/predictions/match/${id}/scorers`),
        fetch(`/api/predictions/match/${id}/duels`),
        fetch(`/api/predictions/match/${id}/over-under-lines`),
        fetch(`/api/predictions/match/${id}/social-stats`),
      ]);
      const [mJson, sJson, dJson, oJson, socJson] = await Promise.all([
        mRes.ok ? mRes.json() : null,
        sRes.ok ? sRes.json() : null,
        dRes.ok ? dRes.json() : null,
        oRes.ok ? oRes.json() : null,
        socRes.ok ? socRes.json() : null,
      ]);
      // Ignora respuestas obsoletas: si el usuario ya cambió de partido, una
      // petición lenta de un partido anterior no debe pisar los datos actuales.
      if (latestLoad.current !== id) return;
      if (mJson) setState(mJson);
      setScorers(sJson?.candidates ?? []);
      setPendingTeams(sJson?.pending_teams ?? []);
      setDuels(dJson?.duels ?? []);
      setOuLines(oJson?.lines ?? []);
      setSocial(socJson ?? null);
    } finally {
      if (latestLoad.current === id) setLoading(false);
    }
  }, []);

  const selectMatch = useCallback((id: string) => {
    setMatchId(id);
    setState(null);
    setScorers([]);
    setPendingTeams([]);
    setDuels([]);
    setOuLines([]);
    setSocial(null);
    setEditing(new Set());
    void loadMatch(id);
  }, [loadMatch]);

  const submit = useCallback(async (
    type: PredictionType,
    data: PredictionData,
    confidence?: number,
  ) => {
    if (!matchId) return;
    // Si ya existe una predicción de este tipo, editamos (PATCH); si no, creamos (POST).
    const existing = stateRef.current?.predictions.find((p) => p.prediction_type === type) ?? null;
    const res = existing
      ? await fetch(`/api/predictions/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction_data: data, confidence_multiplier: confidence }),
        })
      : await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ match_id: matchId, prediction_type: type, prediction_data: data, confidence_multiplier: confidence }),
        });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setEditing((prev) => { const next = new Set(prev); next.delete(type); return next; });
      setToast({ kind: "ok", msg: `${existing ? "Predicción actualizada" : "¡Predicción guardada!"} · ${TYPE_META[type].label}` });
      await loadMatch(matchId);
    } else {
      setToast({ kind: "err", msg: json.message || json.error || "No se pudo guardar la predicción" });
    }
  }, [matchId, loadMatch]);

  if (authed === false) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "80px 20px", maxWidth: 520, margin: "0 auto" }}>
          <Sparkles size={56} color={GOLD} style={{ display: "inline-block" }} />
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
      <header style={{ padding: "20px 16px 8px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>ZonaMundial</span>
            <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={24} color={GOLD2} /> Predicciones
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/app/predicciones/jugar/ranking" style={pillLink}><Trophy size={14} /> Ranking</Link>
            <Link href="/app/predicciones/jugar/ligas" style={pillLink}><Users size={14} /> Ligas</Link>
            <Link href="/app/predicciones/jugar/stats" style={pillLink}><TrendingUp size={14} /> Mis stats</Link>
          </div>
        </div>
      </header>

      {/* Tira de progreso: los 6 recuadros (Nivel, Racha, Fútcoins, Reto,
          Pase, Cosméticos) en una sola fila; los paneles desplegables caen
          a lo ancho debajo mediante flex order. */}
      <div
        className="progress-strip"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px 4px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "stretch" }}
      >
        <GamificationHUD />
        <BattlePass />
        <Cosmetics />
      </div>

      {/* Vista tablero: hero + partido destacado + filtros + grupos + showcase */}
      {!selectedMatch && <LandingView matches={groupMatches} onPick={selectMatch} />}

      {selectedMatch && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px 60px" }}>
          <button
            onClick={() => { setMatchId(null); setState(null); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
              background: BG2, border: CARD_BORDER, borderRadius: 99, color: GOLD2,
              fontWeight: 700, fontSize: 14, padding: "9px 16px", marginBottom: 14,
            }}
          >
            <ArrowLeft size={16} /> Volver a los partidos
          </button>
          <MatchHeader m={selectedMatch} state={state} />
          <LiveMicroPicks matchId={String(selectedMatch.i)} />
          {loading && !state && <p style={{ color: DIM, textAlign: "center", padding: 24 }}>Cargando predicciones…</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
            {PREDICTION_TYPES.map((type) => {
              const existing = state?.predictions.find((p) => p.prediction_type === type) ?? null;
              const mult = state?.match_multiplier ?? tierOf(selectedMatch).multiplier;
              const isEditing = editing.has(type);
              const locked = existing ? existing.status === "resolved" : false;
              const showForm = !existing || isEditing;
              return (
                <TypeCard key={type} type={type} mult={mult}>
                  {showForm ? (
                    <>
                      {isEditing && (
                        <button
                          onClick={() => setEditing((prev) => { const n = new Set(prev); n.delete(type); return n; })}
                          style={{ background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: 12, marginBottom: 8, padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <X size={13} /> Cancelar edición
                        </button>
                      )}
                      <TypeForm
                        type={type}
                        match={selectedMatch}
                        scorers={scorers}
                        pendingTeams={pendingTeams}
                        duels={duels}
                        ouLines={ouLines}
                        social={social}
                        initial={isEditing ? existing : null}
                        onSubmit={submit}
                      />
                    </>
                  ) : (
                    <CompletedView
                      p={existing}
                      type={type}
                      scorers={scorers}
                      duels={duels}
                      onEdit={locked ? undefined : () => setEditing((prev) => new Set(prev).add(type))}
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
const PJ_CSS = `
.predictions-page * { box-sizing: border-box; }
.pj-wrap { max-width: 1280px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }

/* Hero */
.predictions-hero { display: flex; flex-direction: column; gap: 22px; }
.pj-hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (min-width: 1024px) {
  .predictions-hero { flex-direction: row; align-items: center; justify-content: space-between; }
  .pj-hero-text { flex: 1; }
  .pj-hero-stats { width: 380px; flex-shrink: 0; }
}

/* Filtros */
.pj-filter-head { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }
.pj-search-input { width: 100%; }
@media (min-width: 560px) {
  .pj-filter-head { flex-direction: row; align-items: center; justify-content: space-between; }
  .pj-search-input { width: 240px; }
}
.prediction-filters .pj-filters { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
.prediction-filters .pj-filters::-webkit-scrollbar { height: 0; display: none; }

/* Featured */
.pj-featured-teams { display: flex; align-items: center; justify-content: center; gap: 16px; }

/* Grupos */
.group-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 768px) { .group-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .group-grid { grid-template-columns: repeat(3, 1fr); } }

.match-row { transition: border-color .15s ease, background .15s ease; }
.match-row:hover { border-color: rgba(201,168,76,0.45); background: #12233b; }
.match-row:hover .match-row-chevron { color: ${GOLD2}; transform: translateX(2px); }
.match-row:focus-visible { outline: 2px solid rgba(201,168,76,0.7); outline-offset: 2px; }
.match-row-chevron { transition: color .15s ease, transform .15s ease; }

.pj-cta { transition: filter .15s ease, transform .15s ease; }
.pj-cta:hover { filter: brightness(1.06); transform: translateY(-1px); }
.pj-cta:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

/* 8 formas de acertar */
.prediction-modes .pj-types-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 560px) { .prediction-modes .pj-types-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .prediction-modes .pj-types-grid { grid-template-columns: repeat(4, 1fr); } }
.pj-type-card { transition: transform .15s ease, border-color .15s ease; }
.pj-type-card:hover { transform: translateY(-2px); border-color: rgba(201,168,76,0.35); }

/* Underdog */
.underdog-section .pj-underdog-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
@media (min-width: 768px) { .underdog-section .pj-underdog-grid { grid-template-columns: repeat(4, 1fr); } }

/* CTA final */
.pj-cta-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 768px) { .pj-cta-grid { grid-template-columns: repeat(2, 1fr); } }
`;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="predictions-page" style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", paddingBottom: 40 }}>
      <style>{PJ_CSS}</style>
      {children}
    </div>
  );
}

// ─── Vista de aterrizaje: hero + destacado + filtros + grupos + showcase ─────
const sectionTitle: React.CSSProperties = { fontSize: 19, fontWeight: 900, color: "#fff", margin: "0 0 14px", letterSpacing: 0.2 };
const pillTag: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: MID, background: "rgba(255,255,255,0.05)", border: CARD_BORDER, borderRadius: 99, padding: "5px 11px", display: "inline-flex", alignItems: "center", gap: 5 };

function LandingView({ matches, onPick }: { matches: Match[]; onPick: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const featured = matches[0] ?? null;

  const groupLetters = useMemo(() => {
    const set = new Set(matches.map((m) => m.g));
    return [...set].sort();
  }, [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter((m) => {
      if (q && !`${m.h} ${m.a}`.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "all": return true;
        case "today": return isMatchToday(m);
        case "underdog": return tierOf(m).multiplier > 1;
        case "x1.25": return tierOf(m).multiplier === 1.25;
        case "x1.50": return tierOf(m).multiplier === 1.5;
        case "x2.00": return tierOf(m).multiplier === 2;
        default: return filter.startsWith("group:") ? m.g === filter.slice(6) : true;
      }
    });
  }, [matches, filter, query]);

  return (
    <>
      <Hero />
      {featured && <FeaturedMatch m={featured} onPick={onPick} />}
      <Filters filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} groups={groupLetters} />
      <GroupGrid matches={filtered} onPick={onPick} />
      <TypesShowcase />
      <UnderdogBand />
      <CtaFinal />
    </>
  );
}

function Hero() {
  const stats: { icon: typeof Globe; value: string; label: string }[] = [
    { icon: Globe, value: "48", label: "selecciones" },
    { icon: Sparkles, value: "8", label: "predicciones" },
    { icon: Trophy, value: "Global", label: "ranking" },
  ];
  return (
    <section className="pj-wrap" style={{ paddingTop: 14, paddingBottom: 6 }}>
      <div className="predictions-hero" style={{
        background: `radial-gradient(120% 150% at 0% 0%, ${BG2} 0%, ${BG3} 55%, ${BG} 100%)`,
        border: CARD_BORDER, borderRadius: 22, padding: "28px 24px", position: "relative", overflow: "hidden",
      }}>
        {/* textura sutil de campo (líneas verticales muy tenues) */}
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 64px)" }} />
        <div aria-hidden style={{ position: "absolute", top: -90, right: -50, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.16), transparent 70%)", pointerEvents: "none" }} />
        <div className="pj-hero-text" style={{ position: "relative", zIndex: 1 }}>
          <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Mundial 2026 · Predicciones</span>
          <h2 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.08, margin: "10px 0 10px", maxWidth: 560 }}>
            Predice el Mundial antes que todos
          </h2>
          <p style={{ fontSize: 14.5, color: MID, lineHeight: 1.55, maxWidth: 520, margin: 0 }}>
            Ocho formas de leer cada partido. Acumula puntos, escala el ranking global y gana más cuando ves la sorpresa.
          </p>
        </div>
        <div className="pj-hero-stats" style={{ position: "relative", zIndex: 1 }}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: CARD_BORDER, borderRadius: 14, padding: "16px 8px", textAlign: "center" }}>
                <Icon size={20} color={GOLD2} />
                <div style={{ fontSize: 21, fontWeight: 900, color: "#fff", lineHeight: 1, marginTop: 8 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: MID, marginTop: 4, textTransform: "capitalize" }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedTeam({ flag, name }: { flag: string; name: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flagUrlLg(flag)} alt="" style={{ width: 56, height: 38, borderRadius: 6, objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.45)" }} />
      <span style={{ fontSize: 16, fontWeight: 800, textAlign: "center", lineHeight: 1.15 }}>{name}</span>
    </div>
  );
}

function FeaturedMatch({ m, onPick }: { m: Match; onPick: (id: string) => void }) {
  const t = tierOf(m);
  return (
    <section className="pj-wrap featured-match" style={{ paddingTop: 20 }}>
      <h3 style={sectionTitle}>Partido destacado</h3>
      <div style={{
        background: `linear-gradient(135deg, ${BG2} 0%, ${BG3} 100%)`,
        border: "1px solid rgba(201,168,76,0.28)", borderRadius: 20, padding: "24px 22px",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 120% at 50% -20%, rgba(201,168,76,0.10), transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 20 }}>
          <span style={pillTag}>Grupo {m.g}</span>
          <span style={pillTag}><Calendar size={12} /> {fmtKickoff(m)}</span>
          <span style={{ ...pillTag, color: TIER_COLOR[t.label], borderColor: `${TIER_COLOR[t.label]}55` }}>
            <TierIcon label={t.label} size={13} /> ×{t.multiplier.toFixed(2)} · {tierMood(t.multiplier)}
          </span>
        </div>
        <div className="pj-featured-teams" style={{ position: "relative" }}>
          <FeaturedTeam flag={m.hf} name={m.h} />
          <div style={{ fontSize: 30, fontWeight: 900, color: GOLD, letterSpacing: 1, flexShrink: 0 }}>VS</div>
          <FeaturedTeam flag={m.af} name={m.a} />
        </div>
        <button onClick={() => onPick(String(m.i))} className="pj-cta" style={featuredBtn} aria-label={`Lanzar predicción para ${m.h} contra ${m.a}`}>Lanzar predicción</button>
      </div>
    </section>
  );
}

function Filters({ filter, setFilter, query, setQuery, groups }: {
  filter: string; setFilter: (f: string) => void; query: string; setQuery: (q: string) => void; groups: string[];
}) {
  const chips: { key: string; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "today", label: "Hoy" },
    { key: "underdog", label: "Underdog" },
    { key: "x1.25", label: "×1.25" },
    { key: "x1.50", label: "×1.50" },
    { key: "x2.00", label: "×2.00" },
    ...groups.map((g) => ({ key: `group:${g}`, label: `Grupo ${g}` })),
  ];
  return (
    <section className="pj-wrap prediction-filters" style={{ paddingTop: 26 }}>
      <div className="pj-filter-head">
        <h3 style={{ ...sectionTitle, margin: 0 }}>Elige tu batalla</h3>
        <input
          className="pj-search-input"
          type="search"
          aria-label="Buscar selección"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar selección…"
          style={{ background: BG2, border: CARD_BORDER, borderRadius: 99, color: "#fff", fontSize: 13, padding: "10px 16px", outline: "none" }}
        />
      </div>
      <div className="pj-filters">
        {chips.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              aria-pressed={active}
              onClick={() => setFilter(active && c.key !== "all" ? "all" : c.key)}
              style={{
                flexShrink: 0, whiteSpace: "nowrap", cursor: "pointer", fontSize: 13, fontWeight: 600,
                padding: "0 16px", minHeight: 40, borderRadius: 99,
                background: active ? "rgba(201,168,76,0.16)" : BG2,
                color: active ? GOLD2 : MID,
                border: active ? `1px solid ${GOLD}` : CARD_BORDER,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TeamLine({ flag, name }: { flag: string; name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flagUrl(flag)} alt="" style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
      <span style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
    </div>
  );
}

function MatchCard({ m, onPick }: { m: Match; onPick: (id: string) => void }) {
  const t = tierOf(m);
  return (
    <button
      className="match-row"
      onClick={() => onPick(String(m.i))}
      aria-label={`Predecir ${m.h} contra ${m.a}, ${fmtKickoff(m)}, multiplicador ×${t.multiplier.toFixed(2)}`}
      style={{
        display: "block", width: "100%", textAlign: "left", cursor: "pointer", color: "#fff",
        background: BG2, border: CARD_BORDER, borderRadius: 14, padding: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
        <span style={{ fontSize: 10.5, color: DIM, display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {fmtKickoff(m)}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: TIER_COLOR[t.label], display: "inline-flex", alignItems: "center", gap: 3 }}>
          <TierIcon label={t.label} size={12} /> ×{t.multiplier.toFixed(2)}
        </span>
      </div>
      <TeamLine flag={m.hf} name={m.h} />
      <div style={{ fontSize: 10, fontWeight: 800, color: DIM, margin: "4px 0 4px 35px" }}>VS</div>
      <TeamLine flag={m.af} name={m.a} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <span style={{ fontSize: 11, color: TIER_COLOR[t.label], fontWeight: 600 }}>{tierMood(t.multiplier)}</span>
        <span className="match-row-chevron" style={{ color: MID, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700 }}>
          Predecir <ChevronRight size={16} />
        </span>
      </div>
    </button>
  );
}

function GroupGrid({ matches, onPick }: { matches: Match[]; onPick: (id: string) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const arr = map.get(m.g) ?? [];
      arr.push(m);
      map.set(m.g, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [matches]);

  if (!groups.length) {
    return (
      <section className="pj-wrap" style={{ paddingTop: 16 }}>
        <div style={{ textAlign: "center", color: DIM, fontSize: 14, padding: "40px 16px", background: BG3, border: CARD_BORDER, borderRadius: 16 }}>
          No hay partidos para este filtro. Prueba con otra selección o quita los filtros.
        </div>
      </section>
    );
  }

  return (
    <section className="pj-wrap" style={{ paddingTop: 16 }}>
      <div className="group-grid">
        {groups.map(([g, ms]) => (
          <div key={g} className="group-card" style={{ background: BG3, border: CARD_BORDER, borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: 0.5, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(201,168,76,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{g}</span>
                Grupo {g}
              </span>
              <span style={{ fontSize: 11, color: DIM, fontWeight: 600 }}>{ms.length} {ms.length === 1 ? "partido" : "partidos"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ms.map((m) => <MatchCard key={m.i} m={m} onPick={onPick} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypesShowcase() {
  return (
    <section className="pj-wrap prediction-modes" style={{ paddingTop: 40 }}>
      <h3 style={sectionTitle}>8 formas de acertar</h3>
      <p style={{ fontSize: 13.5, color: MID, margin: "-6px 0 18px", maxWidth: 560, lineHeight: 1.5 }}>
        No todo va de adivinar el marcador. Elige cómo quieres leer cada partido.
      </p>
      <div className="pj-types-grid">
        {PREDICTION_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const TypeIcon = TYPE_ICON[type];
          return (
            <div key={type} className="pj-type-card" style={{ background: BG2, border: CARD_BORDER, borderRadius: 16, padding: 16, borderTop: `2px solid ${meta.color}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${meta.color}22`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 11 }}>
                <TypeIcon size={22} color={meta.color} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 5 }}>{meta.label}</div>
              <p style={{ fontSize: 12.5, color: MID, lineHeight: 1.45, margin: "0 0 12px", minHeight: 36 }}>{meta.blurb}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: meta.color }}>{meta.minPoints}–{meta.maxPoints} pts</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: DIM, background: "rgba(255,255,255,0.05)", padding: "3px 9px", borderRadius: 99 }}>{meta.difficulty}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UnderdogBand() {
  const tiers = [
    { label: "Estelar", mult: "×1.0", desc: "Favorito claro" },
    { label: "Bronce", mult: "×1.25", desc: "Partido abierto" },
    { label: "Oro", mult: "×1.5", desc: "Sorpresa posible" },
    { label: "Diamante", mult: "×2.0", desc: "Batacazo histórico" },
  ];
  return (
    <section className="pj-wrap underdog-section" style={{ paddingTop: 40 }}>
      <div style={{ background: `linear-gradient(135deg, ${BG2}, ${BG3})`, border: CARD_BORDER, borderRadius: 20, padding: "24px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
          <Gem size={20} color="#38bdf8" />
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Gana más si ves la sorpresa</h3>
        </div>
        <p style={{ fontSize: 13, color: MID, margin: "0 0 18px", maxWidth: 600, lineHeight: 1.5 }}>
          Cuanto mayor la diferencia de ranking FIFA entre los equipos, mayor el multiplicador de puntos por acertar. Atrévete con el menos favorito.
        </p>
        <div className="pj-underdog-grid">
          {tiers.map((t) => (
            <div key={t.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${TIER_COLOR[t.label]}3a`, borderRadius: 14, padding: "16px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <TierIcon label={t.label} size={22} />
                <span style={{ fontSize: 18, fontWeight: 900, color: TIER_COLOR[t.label] }}>{t.mult}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{t.label}</div>
              <div style={{ fontSize: 12, color: MID, marginTop: 2 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  const cards = [
    {
      icon: Users, href: "/app/predicciones/jugar/ligas",
      title: "Únete a una liga privada", text: "Juega con tus amigos y compite por la gloria.",
      btn: "Crear liga", gold: true,
    },
    {
      icon: Trophy, href: "/app/predicciones/jugar/ranking",
      title: "Compite en el ranking", text: "Demuestra que eres el mejor predictor.",
      btn: "Ver ranking", gold: false,
    },
  ];
  return (
    <section className="pj-wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="pj-cta-grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.href} style={{ background: BG3, border: CARD_BORDER, borderRadius: 18, padding: "22px 20px", display: "flex", flexDirection: "column" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(201,168,76,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={22} color={GOLD2} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>{c.title}</h3>
              <p style={{ fontSize: 13.5, color: MID, lineHeight: 1.5, margin: "0 0 18px", flex: 1 }}>{c.text}</p>
              <Link
                href={c.href}
                className="pj-cta"
                style={c.gold ? {
                  display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 46,
                  padding: "0 22px", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14,
                  background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, alignSelf: "flex-start",
                } : {
                  display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 46,
                  padding: "0 22px", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14,
                  background: "rgba(201,168,76,0.12)", color: GOLD2, border: `1px solid ${GOLD}55`, alignSelf: "flex-start",
                }}
              >
                {c.btn}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const featuredBtn: React.CSSProperties = {
  position: "relative", width: "100%", marginTop: 22, padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
  background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 900, fontSize: 15, minHeight: 48,
};

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
        <Badge><TierIcon label={t.label} size={13} /> {t.label} ×{t.multiplier.toFixed(2)}</Badge>
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
  return <span style={{ fontSize: 11, fontWeight: 600, color: MID, background: "rgba(255,255,255,0.05)", border: CARD_BORDER, borderRadius: 20, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>;
}

function TypeCard({ type, mult, children }: { type: PredictionType; mult: number; children: React.ReactNode }) {
  const meta = TYPE_META[type];
  const TypeIcon = TYPE_ICON[type];
  const maxPts = Math.round(meta.maxPoints * mult);
  return (
    <div style={{ background: BG3, border: CARD_BORDER, borderRadius: 16, padding: 16, borderTop: `3px solid ${meta.color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <TypeIcon size={22} color={meta.color} />
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
function CompletedView({ p, type, scorers, duels, onEdit }: { p: MatchPrediction; type: PredictionType; scorers: ScorerCandidate[]; duels: DuelOut[]; onEdit?: () => void }) {
  const summary = summarize(type, p, scorers, duels);
  const resolved = p.status === "resolved";
  const color = resolved ? (p.is_correct ? GREEN : RED) : GOLD;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}40`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color, fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {resolved && !p.is_correct ? <X size={14} /> : <Check size={14} />}
          {resolved ? (p.is_correct ? "Acertaste" : "Fallaste") : "Enviada"}
        </span>
        {resolved && <span style={{ marginLeft: "auto", fontWeight: 800, color }}>{(p.points_earned ?? 0) > 0 ? "+" : ""}{p.points_earned ?? 0} pts</span>}
      </div>
      <div style={{ fontSize: 13, color: MID, marginTop: 6 }}>{summary}</div>
      {onEdit && (
        <button
          onClick={onEdit}
          style={{
            marginTop: 10, width: "100%", padding: "8px", borderRadius: 8, cursor: "pointer",
            background: "rgba(201,168,76,0.12)", border: `1px solid ${GOLD}55`, color: GOLD2, fontWeight: 700, fontSize: 13,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Pencil size={13} /> Editar predicción
        </button>
      )}
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
    case "social": return `${d.choice} ${p.is_contrarian ? "(contrarian)" : "(con la manada)"}`;
    default: return "Predicción enviada";
  }
}

// ─── Formularios por tipo ────────────────────────────────────────────────────
type SubmitFn = (type: PredictionType, data: PredictionData, confidence?: number) => Promise<void>;

function TypeForm(props: {
  type: PredictionType;
  match: Match;
  scorers: ScorerCandidate[];
  pendingTeams: string[];
  duels: DuelOut[];
  ouLines: OverUnderLineOut[];
  social: SocialStatsOut | null;
  initial: MatchPrediction | null;
  onSubmit: SubmitFn;
}) {
  const d = (props.initial?.prediction_data ?? null) as unknown as Record<string, unknown> | null;
  const editLabel = props.initial ? "Actualizar" : null;
  switch (props.type) {
    case "exact_score": return <ExactScoreForm {...props} init={d} editLabel={editLabel} />;
    case "winner": return <WinnerForm {...props} init={d} initConf={props.initial?.confidence_multiplier ?? 1} editLabel={editLabel} />;
    case "first_scorer": return <FirstScorerForm {...props} init={d} editLabel={editLabel} />;
    case "chain": return <ChainForm {...props} init={d} editLabel={editLabel} />;
    case "duel": return <DuelForm {...props} init={d} editLabel={editLabel} />;
    case "over_under": return <OverUnderForm {...props} init={d} editLabel={editLabel} />;
    case "minute_drama": return <MinuteDramaForm {...props} init={d} editLabel={editLabel} />;
    case "social": return <SocialForm {...props} init={d} editLabel={editLabel} />;
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

// ─── Comparación social en el momento de decidir (Modo Manada en todo form) ──
/** % de la comunidad para una opción concreta de un grupo, y total del grupo. */
function communityPct(social: SocialStatsOut | null, group: string, optionKey: string): { pct: number; total: number } | null {
  const rows = social?.stats?.[group];
  if (!rows || rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0) return null;
  return { pct: rows.find((r) => r.option_key === optionKey)?.pct ?? 0, total };
}

/** Aviso "vas con/contra la manada" reutilizable bajo cualquier opción elegida. */
function ManadaHint({ pct, total }: { pct: number; total: number }) {
  const minority = pct < 50;
  return (
    <div style={{ fontSize: 11, color: minority ? GOLD : MID, marginTop: 8, display: "flex", alignItems: "center", gap: 4, lineHeight: 1.4 }}>
      {minority
        ? <><Flame size={13} style={{ flexShrink: 0 }} /> Solo el {pct}% piensa como tú · vas contra la manada (más puntos si aciertas)</>
        : <><Users size={13} style={{ flexShrink: 0 }} /> El {pct}% de {total} predicciones coincide contigo</>}
    </div>
  );
}

function ExactScoreForm({ match, init, editLabel, onSubmit }: { match: Match; init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const [h, setH] = useState(typeof init?.home_goals === "number" ? init.home_goals : 1);
  const [a, setA] = useState(typeof init?.away_goals === "number" ? init.away_goals : 1);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Stepper label={match.h} value={h} onChange={setH} />
        <span style={{ fontWeight: 900, color: DIM }}>–</span>
        <Stepper label={match.a} value={a} onChange={setA} />
      </div>
      <button disabled={busy} style={btnPrimary} onClick={async () => { setBusy(true); await onSubmit("exact_score", { home_goals: h, away_goals: a }); setBusy(false); }}>
        {editLabel ?? "Guardar"} marcador
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

function WinnerForm({ match, social, init, initConf, editLabel, onSubmit }: { match: Match; social: SocialStatsOut | null; init: Record<string, unknown> | null; initConf: number; editLabel: string | null; onSubmit: SubmitFn }) {
  const [result, setResult] = useState<WinnerResult | null>((init?.result as WinnerResult) ?? null);
  const [conf, setConf] = useState(initConf || 1);
  const [busy, setBusy] = useState(false);
  const winnerStats = social?.stats?.winner ?? [];
  const winnerTotal = winnerStats.reduce((s, r) => s + r.count, 0);
  const pctOf = (r: WinnerResult): number => winnerStats.find((s) => s.option_key === `winner:${r}`)?.pct ?? 0;
  const options: { key: WinnerResult; label: string }[] = [
    { key: "home", label: match.h }, { key: "draw", label: "Empate" }, { key: "away", label: match.a },
  ];
  return (
    <div>
      {winnerTotal > 0 && (
        <div style={{ fontSize: 11, color: DIM, marginBottom: 6 }}>Qué predice la comunidad ({winnerTotal})</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((o) => {
          const active = result === o.key;
          const pct = pctOf(o.key);
          return (
            <button key={o.key} onClick={() => setResult(o.key)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left",
              position: "relative", overflow: "hidden", border: active ? `1px solid ${GOLD}` : CARD_BORDER, background: BG, color: "#fff",
            }}>
              {winnerTotal > 0 && <span style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "rgba(201,168,76,0.16)" }} />}
              <span style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: active ? GOLD : "#fff" }}>
                <span>{o.label}</span>
                {winnerTotal > 0 && <span style={{ color: MID }}>{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      {result && winnerTotal > 0 && <ManadaHint pct={pctOf(result)} total={winnerTotal} />}
      <div style={{ fontSize: 11, color: DIM, margin: "10px 0 4px" }}>Confianza (multiplica puntos y riesgo):</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3].map((c) => <button key={c} onClick={() => setConf(c)} style={optBtn(conf === c)}>×{c}</button>)}
      </div>
      <button disabled={busy || !result} style={{ ...btnPrimary, opacity: result ? 1 : 0.5 }}
        onClick={async () => { if (!result) return; setBusy(true); await onSubmit("winner", { result }, conf); setBusy(false); }}>
        {editLabel ?? "Guardar"} ganador
      </button>
    </div>
  );
}

function FirstScorerForm({ scorers, pendingTeams, init, editLabel, onSubmit }: { scorers: ScorerCandidate[]; pendingTeams: string[]; init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const [playerId, setPlayerId] = useState<string>(typeof init?.player_id === "string" ? init.player_id : "");
  const [noGoals, setNoGoals] = useState(init?.no_goals === true);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      {pendingTeams.length > 0 && (
        <p style={{ fontSize: 11.5, color: GOLD, background: "rgba(201,168,76,0.10)", border: `1px solid ${GOLD}40`, borderRadius: 8, padding: "7px 10px", marginBottom: 8, lineHeight: 1.4, display: "flex", gap: 6 }}>
          <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{pendingTeams.join(" y ")} {pendingTeams.length > 1 ? "aún no han" : "aún no ha"} anunciado convocatoria definitiva. Sus jugadores aparecerán cuando se confirme la lista.</span>
        </p>
      )}
      <select value={noGoals ? "" : playerId} disabled={noGoals || scorers.length === 0} onChange={(e) => setPlayerId(e.target.value)} style={inputStyle}>
        <option value="">{scorers.length === 0 ? "Sin convocatorias disponibles" : "Elige goleador…"}</option>
        {scorers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.team} ({s.pos})</option>)}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: MID, cursor: "pointer" }}>
        <input type="checkbox" checked={noGoals} onChange={(e) => setNoGoals(e.target.checked)} />
        Nadie marca (0-0)
      </label>
      <button disabled={busy || (!noGoals && !playerId)} style={{ ...btnPrimary, opacity: noGoals || playerId ? 1 : 0.5 }}
        onClick={async () => { setBusy(true); await onSubmit("first_scorer", { player_id: noGoals ? null : playerId, no_goals: noGoals }); setBusy(false); }}>
        {editLabel ?? "Guardar"} goleador
      </button>
    </div>
  );
}

function ChainForm({ init, editLabel, onSubmit }: { init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const initSteps = Array.isArray(init?.chain)
    ? (init!.chain as { event_type: ChainEventType; event_data?: { description?: string } }[])
        .map((s) => ({ event_type: s.event_type, description: s.event_data?.description ?? "" }))
    : null;
  const [steps, setSteps] = useState<{ event_type: ChainEventType; description: string }[]>(initSteps ?? [
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
        {editLabel ?? "Guardar"} cadena (3 eslabones)
      </button>
    </div>
  );
}

function DuelForm({ duels, init, editLabel, onSubmit }: { duels: DuelOut[]; init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const [pick, setPick] = useState<{ duelId: string; playerId: string } | null>(
    typeof init?.duel_id === "string" && typeof init?.winner_player_id === "string"
      ? { duelId: init.duel_id, playerId: init.winner_player_id }
      : null,
  );
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
        {editLabel ?? "Guardar"} duelo
      </button>
    </div>
  );
}

function OverUnderForm({ ouLines, social, init, editLabel, onSubmit }: { ouLines: OverUnderLineOut[]; social: SocialStatsOut | null; init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const [category, setCategory] = useState<OverUnderCategory>((init?.category as OverUnderCategory) ?? "goals");
  const [difficulty, setDifficulty] = useState<OverUnderDifficulty>((init?.difficulty as OverUnderDifficulty) ?? "medium");
  const [choice, setChoice] = useState<"over" | "under" | null>((init?.choice as "over" | "under") ?? null);
  const [busy, setBusy] = useState(false);
  const line = ouLines.find((l) => l.category === category);
  const sel = line ? line[difficulty] : null;
  const community = choice ? communityPct(social, "over_under", `over_under:${category}:${choice}`) : null;
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
      {community && <ManadaHint pct={community.pct} total={community.total} />}
      <button disabled={busy || !choice || !sel} style={{ ...btnPrimary, opacity: choice && sel ? 1 : 0.5 }}
        onClick={async () => { if (!choice || !sel) return; setBusy(true); await onSubmit("over_under", { category, line: sel.line, choice, difficulty }); setBusy(false); }}>
        {editLabel ?? "Guardar"} over/under
      </button>
    </div>
  );
}

function MinuteDramaForm({ social, init, editLabel, onSubmit }: { social: SocialStatsOut | null; init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const [event, setEvent] = useState<DramaEvent>((init?.event as DramaEvent) ?? "first_goal");
  const [range, setRange] = useState<MinuteRange>((init?.minute_range as MinuteRange) ?? "0-10");
  const [noEvent, setNoEvent] = useState(init?.no_event === true);
  const [busy, setBusy] = useState(false);
  const community = communityPct(social, "minute_drama", `minute_drama:${event}:${noEvent ? "none" : range}`);
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
      {community && <ManadaHint pct={community.pct} total={community.total} />}
      <button disabled={busy} style={btnPrimary}
        onClick={async () => { setBusy(true); await onSubmit("minute_drama", noEvent ? { event, no_event: true } : { event, minute_range: range }); setBusy(false); }}>
        {editLabel ?? "Guardar"} minuto
      </button>
    </div>
  );
}

function SocialForm({ match, social, init, editLabel, onSubmit }: { match: Match; social: SocialStatsOut | null; init: Record<string, unknown> | null; editLabel: string | null; onSubmit: SubmitFn }) {
  const [choice, setChoice] = useState<WinnerResult | null>((init?.choice as WinnerResult) ?? null);
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
        <div style={{ fontSize: 11, color: chosenPct < 50 ? GOLD : MID, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          {chosenPct < 50 ? <><Flame size={13} /> Vas contra la manada: más puntos si aciertas</> : "Vas con la mayoría"}
        </div>
      )}
      <button disabled={busy || !choice} style={{ ...btnPrimary, opacity: choice ? 1 : 0.5 }}
        onClick={async () => { if (!choice) return; setBusy(true); await onSubmit("social", { question_key: "winner", choice, community_pct_at_time: chosenPct }); setBusy(false); }}>
        {editLabel ?? "Guardar en"} Modo Manada
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
  borderRadius: 20, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 5,
};
