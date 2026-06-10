"use client";

// src/app/trivia/TriviaGame.tsx
//
// Juego de Trivia (cliente). Tres modos: Diaria, Relámpago, Muerte Súbita.
// La corrección y los puntos los calcula el servidor (anti-trampa); aquí solo
// gestionamos la experiencia: timers, feedback inmediato, racha y ranking.

import { useCallback, useEffect, useRef, useState } from "react";
import { TRIVIA_HINT_FIFTY } from "@/lib/economy/spend";
import { handleProRequired } from "@/lib/pro/paywall-client";
import { POWERUP_PACK } from "@/lib/powerups/catalog";

const BG = "#060B14",
  BG2 = "#0F1D32",
  BG3 = "#0B1825",
  GOLD = "#c9a84c",
  GOLD2 = "#e8d48b",
  MID = "#8a94b0",
  DIM = "#6a7a9a",
  GREEN = "#22c55e",
  RED = "#ef4444";

type Mode = "diaria" | "relampago" | "muerte-subita";

interface ClientQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
}

interface AnswerResp {
  correct: boolean;
  correctIndex: number;
  explanation: string | null;
  points: number;
  streak: number;
  totalPoints: number;
  gameOver: boolean;
}

interface FinishResp {
  recorded: boolean;
  points: number;
  basePoints?: number;
  timeBonus?: string | null;
  timeBonusMult?: number;
  perfectDay?: boolean;
  correct: number;
  answered: number;
  bestStreak: number;
  survival?: number | null;
  /** Economía (servidor). Fútcoins reales abonadas a la billetera única. */
  futcoins?: number;
  xpAwarded?: number;
  coinsBalance?: number | null;
  /** true si esta partida abonó Fútcoins (primera del modo hoy). */
  rewardClaimed?: boolean;
  /** true si el jugador está autenticado (billetera disponible). */
  authed?: boolean;
}

interface LbEntry {
  userId: string;
  name: string;
  points: number;
}

const MODES: { id: Mode; emoji: string; title: string; desc: string; color: string; timer: number }[] = [
  { id: "diaria", emoji: "📅", title: "Trivia Diaria", desc: "Preguntas nuevas cada día. Sin prisa.", color: GOLD, timer: 0 },
  { id: "relampago", emoji: "⚡", title: "Modo Relámpago", desc: "10 preguntas, 9s cada una. Rápido = más puntos.", color: "#f59e0b", timer: 9 },
  { id: "muerte-subita", emoji: "💀", title: "Muerte Súbita", desc: "Aguanta sin fallar. Cada vez más difícil.", color: RED, timer: 12 },
];

function modeOf(id: Mode) {
  return MODES.find((m) => m.id === id)!;
}

function ensureAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("zm_trivia_anon");
  if (!id) {
    id = "anon-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("zm_trivia_anon", id);
  }
  return id;
}

export default function TriviaGame() {
  const [phase, setPhase] = useState<"menu" | "playing" | "result">("menu");
  const [mode, setMode] = useState<Mode>("diaria");
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<AnswerResp | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinishResp | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lb, setLb] = useState<LbEntry[]>([]);
  const [lbPeriod, setLbPeriod] = useState<"global" | "diaria">("global");
  const [error, setError] = useState("");
  // Pista 50/50: índices descartados de la pregunta actual + estado de compra.
  const [removed, setRemoved] = useState<number[]>([]);
  const [hintBusy, setHintBusy] = useState(false);
  const [hintErr, setHintErr] = useState<string | null>(null);
  // true mientras un POST /answer está en vuelo: bloquea doble-envío (doble clic
  // o timeout del timer que coincide con un clic).
  const [submitting, setSubmitting] = useState(false);

  // Comodín "Salvarracha": revive en Muerte Súbita (1 por partida). Con usos
  // del Pack ×3 en el monedero la aplicación es INSTANTÁNEA (POST /use); sin
  // usos se compra el pack en pestaña nueva y se confirma por polling.
  const [reviveOffer, setReviveOffer] = useState(false);
  const [reviveCredits, setReviveCredits] = useState<number | null>(null);
  const [reviveBusy, setReviveBusy] = useState(false);
  const [reviveWaiting, setReviveWaiting] = useState(false);
  const [reviveErr, setReviveErr] = useState<string | null>(null);
  const [lostStreak, setLostStreak] = useState(0);
  const revivedOnce = useRef(false);
  const revivePoll = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (revivePoll.current) clearTimeout(revivePoll.current); }, []);

  const qStartRef = useRef<number>(0);
  const anonRef = useRef<string>("");

  useEffect(() => {
    anonRef.current = ensureAnonId();
    const saved = localStorage.getItem("zm_trivia_name");
    if (saved) setName(saved);
  }, []);

  const loadLeaderboard = useCallback(async (period: "global" | "diaria") => {
    try {
      const r = await fetch(`/api/trivia/leaderboard?period=${period}&limit=20`);
      const data = await r.json();
      setLb(data.entries || []);
    } catch {
      setLb([]);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(lbPeriod);
  }, [lbPeriod, loadLeaderboard]);

  // ─── timer por pregunta ───
  useEffect(() => {
    const t = modeOf(mode).timer;
    if (phase !== "playing" || revealed || t === 0) return;
    setTimeLeft(t);
    const start = Date.now();
    const iv = setInterval(() => {
      const left = t - Math.floor((Date.now() - start) / 1000);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(iv);
        void submitAnswer(-1); // timeout = fallo
      }
    }, 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, revealed, mode]);

  async function startGame(m: Mode) {
    setMode(m);
    setLoading(true);
    setError("");
    if (name) localStorage.setItem("zm_trivia_name", name.trim());
    try {
      const r = await fetch("/api/trivia/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m, anonId: anonRef.current, name: name.trim() || undefined }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        if (handleProRequired(e)) {
          // Cupo diario Free agotado: el paywall global explica el upgrade.
          setLoading(false);
          return;
        }
        setError(e.message || "No se pudo iniciar la trivia. Inténtalo en un momento.");
        setLoading(false);
        return;
      }
      const data = await r.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions || []);
      setIdx(0);
      setScore(0);
      setStreak(0);
      setSelected(null);
      setRevealed(null);
      setRemoved([]);
      setHintErr(null);
      setResult(null);
      setPhase("playing");
      qStartRef.current = Date.now();
    } catch {
      setError("Error de conexión.");
    }
    setLoading(false);
  }

  async function submitAnswer(choice: number) {
    if (revealed || submitting) return;
    const q = questions[idx];
    if (!q) return;
    setSubmitting(true);
    setSelected(choice);
    const responseMs = Date.now() - qStartRef.current;
    try {
      const r = await fetch("/api/trivia/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: q.id, choice, responseMs }),
      });
      if (!r.ok) {
        // 404 sesión expirada (TTL 1h), 409 ya respondida, 429 rate-limit. No
        // tratamos el cuerpo de error como una respuesta válida (eso daba
        // "undefined pts" y racha NaN): avisamos y dejamos reintentar.
        setError(
          r.status === 404
            ? "Tu partida expiró. Vuelve al menú y empieza otra."
            : "No se pudo registrar la respuesta. Inténtalo de nuevo.",
        );
        setSelected(null);
        setSubmitting(false);
        return;
      }
      const data: AnswerResp = await r.json();
      // Racha que se acaba de romper (este closure aún ve el valor previo):
      // la enseña la oferta del Salvarracha ("llevabas N seguidas").
      if (!data.correct) setLostStreak(streak);
      setRevealed(data);
      setScore(data.totalPoints);
      setStreak(data.streak);
    } catch {
      setError("Error al enviar respuesta.");
      setSelected(null);
    }
    setSubmitting(false);
  }

  // Compra una pista 50/50 para la pregunta actual: el servidor cobra Fútcoins y
  // devuelve dos opciones erróneas a descartar. Solo usuarios con sesión.
  async function buyFifty() {
    if (revealed || hintBusy || removed.length > 0) return;
    const q = questions[idx];
    if (!q) return;
    setHintBusy(true);
    setHintErr(null);
    try {
      const r = await fetch("/api/trivia/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: q.id }),
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; removed?: number[]; error?: string };
      if (r.ok && data.ok && Array.isArray(data.removed)) {
        setRemoved(data.removed);
      } else if (r.status === 401) {
        setHintErr("Inicia sesión para usar pistas.");
      } else if (data.error === "insufficient_coins") {
        setHintErr("No te alcanzan las Fútcoins.");
      } else {
        setHintErr("No se pudo usar la pista.");
      }
    } catch {
      setHintErr("Error de conexión.");
    }
    setHintBusy(false);
  }

  async function next() {
    if (!revealed) return;
    const isLast = idx + 1 >= questions.length;
    if (revealed.gameOver || isLast) {
      // Muerte Súbita: antes de cerrar la partida, UNA oferta de revive
      // (si quedan preguntas que jugar). De paso miramos el monedero para
      // ofrecer "usa 1 comodín" o la compra del pack.
      if (revealed.gameOver && mode === "muerte-subita" && !revivedOnce.current && !isLast) {
        setReviveOffer(true);
        setReviveCredits(null);
        fetch("/api/powerups/status?wallet=1")
          .then(async (r) => {
            if (!r.ok) return setReviveCredits(0);
            const j = (await r.json()) as { credits?: number };
            setReviveCredits(typeof j.credits === "number" ? j.credits : 0);
          })
          .catch(() => setReviveCredits(0));
        return;
      }
      await finishGame();
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setRevealed(null);
    setRemoved([]);
    setHintErr(null);
    qStartRef.current = Date.now();
  }

  // ── Salvarracha (revive de pago) ──────────────────────────────────────────

  /** El webhook ya revivió la sesión en el servidor: reanudar la partida. */
  function resumeAfterRevive(restoredStreak: number) {
    revivedOnce.current = true;
    if (revivePoll.current) clearTimeout(revivePoll.current);
    setReviveOffer(false);
    setReviveWaiting(false);
    setReviveErr(null);
    setStreak(restoredStreak);
    setIdx((i) => i + 1);
    setSelected(null);
    setRevealed(null);
    setRemoved([]);
    setHintErr(null);
    qStartRef.current = Date.now();
  }

  /** Gasta 1 uso del monedero en revivir ESTA sesión. "not_game_over" cuenta
   *  como éxito: significa que el revive ya se aplicó (p.ej. el intent del
   *  pack llegó justo antes que nosotros). */
  async function tryUseRevive(): Promise<{ ok: boolean; streak?: number; message?: string }> {
    try {
      const r = await fetch("/api/powerups/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "trivia_revive", trivia_session_id: sessionId }),
      });
      const j = (await r.json().catch(() => null)) as {
        ok?: boolean; trivia?: { streak: number } | null; error?: string; message?: string;
      } | null;
      if (r.ok && j?.ok) return { ok: true, streak: j.trivia?.streak ?? lostStreak };
      if (j?.error === "not_game_over") return { ok: true, streak: lostStreak };
      return { ok: false, message: j?.message ?? "No se pudo aplicar el comodín." };
    } catch {
      return { ok: false, message: "Sin conexión, reintenta." };
    }
  }

  function pollRevive(pid: string, tries: number) {
    if (tries > 48) {
      // ~2 min sin confirmación: no cerramos la partida (la sesión vive 1h),
      // pero dejamos de esperar en bucle.
      setReviveWaiting(false);
      setReviveErr("La confirmación está tardando. Si has pagado, pulsa «Seguir esperando».");
      return;
    }
    revivePoll.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/powerups/status?pid=${encodeURIComponent(pid)}`);
        if (r.ok) {
          const j = (await r.json()) as {
            status: string;
            trivia?: { streak: number; revived: boolean } | null;
            credits?: number;
          };
          if (j.status === "applied" || j.status === "consumed") {
            if (j.trivia?.revived) {
              resumeAfterRevive(j.trivia.streak);
              return;
            }
            // Pack acreditado pero el revive automático aún no consta: tras un
            // par de ticks lo aplicamos nosotros con uno de los usos comprados.
            if (tries >= 2) {
              const used = await tryUseRevive();
              if (used.ok) {
                resumeAfterRevive(used.streak ?? lostStreak);
              } else {
                setReviveWaiting(false);
                setReviveErr(
                  `${used.message ?? "No se pudo revivir."} Tus usos del pack quedan en tu monedero.`,
                );
              }
              return;
            }
          }
          if (j.status === "failed" || j.status === "refunded") {
            setReviveWaiting(false);
            setReviveErr("El pago no pudo aplicarse y se ha devuelto automáticamente.");
            return;
          }
        }
      } catch {
        /* siguiente tick */
      }
      pollRevive(pid, tries + 1);
    }, 2500);
  }

  const reviveRetryPid = useRef<string | null>(null);

  async function buyRevive() {
    setReviveErr(null);

    // Con usos en el monedero: aplicación instantánea, sin Stripe.
    if ((reviveCredits ?? 0) > 0) {
      setReviveBusy(true);
      const used = await tryUseRevive();
      setReviveBusy(false);
      if (used.ok) resumeAfterRevive(used.streak ?? lostStreak);
      else setReviveErr(used.message ?? "No se pudo aplicar el comodín.");
      return;
    }

    // Reintento tras timeout: solo reanudar el polling, sin nuevo checkout.
    if (reviveRetryPid.current) {
      setReviveWaiting(true);
      pollRevive(reviveRetryPid.current, 0);
      return;
    }
    // Sin usos: comprar el Pack ×3. Abrir la pestaña dentro del gesto del
    // usuario (popup blockers) y poner la URL de Stripe cuando llegue.
    const payTab = window.open("about:blank", "_blank");
    try {
      const r = await fetch("/api/powerups/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: { sku: "trivia_revive", trivia_session_id: sessionId } }),
      });
      const j = (await r.json().catch(() => null)) as { url?: string; purchase_id?: string; message?: string } | null;
      if (r.status === 401) {
        payTab?.close();
        setReviveErr("Inicia sesión para salvar tu racha.");
        return;
      }
      if (!r.ok || !j?.url || !j.purchase_id) {
        payTab?.close();
        setReviveErr(j?.message ?? "No se pudo iniciar el pago.");
        return;
      }
      if (payTab) payTab.location.href = j.url;
      else window.open(j.url, "_blank");
      reviveRetryPid.current = j.purchase_id;
      setReviveWaiting(true);
      pollRevive(j.purchase_id, 0);
    } catch {
      payTab?.close();
      setReviveErr("Sin conexión, reintenta.");
    }
  }

  function declineRevive() {
    if (revivePoll.current) clearTimeout(revivePoll.current);
    setReviveOffer(false);
    setReviveWaiting(false);
    void finishGame();
  }

  async function finishGame() {
    setLoading(true);
    try {
      const r = await fetch("/api/trivia/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: name.trim() || undefined,
          anonId: anonRef.current,
        }),
      });
      if (!r.ok) {
        // La sesión pudo expirar (TTL 1h) o chocar con el rate-limit (429). No
        // pintamos la pantalla de resultado con datos inválidos (eso crasheaba en
        // points.toLocaleString()): avisamos y volvemos al menú.
        setError(
          r.status === 429
            ? "Vas muy rápido. Espera unos segundos antes de volver a finalizar."
            : "No pudimos guardar el resultado. Tu partida pudo expirar.",
        );
        setPhase("menu");
        setLoading(false);
        loadLeaderboard(lbPeriod);
        return;
      }
      const data: FinishResp = await r.json();
      setResult(data);
      setPhase("result");
      loadLeaderboard(lbPeriod);
    } catch {
      setError("Error al finalizar.");
    }
    setLoading(false);
  }

  const q = questions[idx];

  return (
    <div
      className={phase === "result" ? "zm-result-bg" : undefined}
      style={{
        background: phase === "result" ? undefined : BG,
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      <style>{`
        @keyframes pop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes flashG{0%{box-shadow:0 0 0 0 ${GREEN}55}100%{box-shadow:0 0 0 16px transparent}}
        @keyframes barIn{from{width:100%}to{width:0%}}
        .zm-opt{transition:all .15s}
        .zm-opt:hover:not(:disabled){border-color:${GOLD}88;transform:translateY(-2px)}
        .zm-result-bg{
          background-color:${BG};
          background-image:linear-gradient(to bottom,rgba(5,11,20,.92),rgba(5,11,20,.985)),url('/assets/trivia/results/trivia-result-bg-mobile.png');
          background-size:cover;background-position:center top;background-repeat:no-repeat;
        }
        @media(min-width:1024px){
          .zm-result-bg{
            background-image:linear-gradient(to bottom,rgba(5,11,20,.9),rgba(5,11,20,.98)),url('/assets/trivia/results/trivia-result-bg-desktop.png');
            background-attachment:fixed;
          }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
            ZonaMundial · Mundial 2026
          </span>
          <h1 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 900, marginTop: 6, lineHeight: 1.05 }}>
            Trivia del{" "}
            <span style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Mundial
            </span>
          </h1>
        </div>

        {error && (
          <div style={{ background: "#3a1620", border: `1px solid ${RED}55`, color: "#ffd9d9", padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {phase === "menu" && (
          <Menu
            name={name}
            setName={(v) => {
              setName(v);
              localStorage.setItem("zm_trivia_name", v.trim());
            }}
            loading={loading}
            onStart={startGame}
            lb={lb}
            lbPeriod={lbPeriod}
            setLbPeriod={setLbPeriod}
          />
        )}

        {phase === "playing" && q && (
          <Play
            q={q}
            idx={idx}
            total={mode === "muerte-subita" ? null : questions.length}
            mode={mode}
            score={score}
            streak={streak}
            selected={selected}
            revealed={revealed}
            timeLeft={timeLeft}
            timerMax={modeOf(mode).timer}
            onAnswer={submitAnswer}
            onNext={next}
            loading={loading}
            submitting={submitting}
            removed={removed}
            onFifty={buyFifty}
            hintBusy={hintBusy}
            hintErr={hintErr}
          />
        )}

        {phase === "playing" && reviveOffer && (
          <ReviveOverlay
            lostStreak={lostStreak}
            credits={reviveCredits}
            busy={reviveBusy}
            waiting={reviveWaiting}
            err={reviveErr}
            onBuy={buyRevive}
            onDecline={declineRevive}
          />
        )}

        {phase === "playing" && !q && (
          <div style={{ textAlign: "center", padding: "48px 0", color: MID }}>
            <p style={{ marginBottom: 18, fontSize: 15 }}>
              No hay preguntas disponibles en este momento. Inténtalo de nuevo en un rato.
            </p>
            <button
              onClick={() => setPhase("menu")}
              style={{
                padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG,
                fontWeight: 800, fontFamily: "inherit",
              }}
            >
              Volver al menú
            </button>
          </div>
        )}

        {phase === "result" && result && (
          <Result
            result={result}
            mode={mode}
            onAgain={() => startGame(mode)}
            onMenu={() => {
              setPhase("menu");
              loadLeaderboard(lbPeriod);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Menu ─────────────────────────

function Menu({
  name,
  setName,
  loading,
  onStart,
  lb,
  lbPeriod,
  setLbPeriod,
}: {
  name: string;
  setName: (v: string) => void;
  loading: boolean;
  onStart: (m: Mode) => void;
  lb: LbEntry[];
  lbPeriod: "global" | "diaria";
  setLbPeriod: (p: "global" | "diaria") => void;
}) {
  return (
    <>
      <p style={{ textAlign: "center", color: MID, fontSize: 15, marginBottom: 20 }}>
        Demuestra cuánto sabes de fútbol y Mundiales. Mantén tu racha y sube en el ranking.
      </p>

      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 12, color: DIM, fontWeight: 600 }}>Tu nombre en el ranking</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: ElPibe10"
          maxLength={24}
          style={{
            width: "100%",
            marginTop: 6,
            padding: "12px 14px",
            borderRadius: 12,
            background: BG2,
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: 15,
            fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            disabled={loading}
            onClick={() => onStart(m.id)}
            style={{
              textAlign: "left",
              padding: "18px 18px",
              borderRadius: 16,
              background: BG2,
              border: `1px solid ${m.color}33`,
              color: "#fff",
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 30 }}>{m.emoji}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 17, color: m.color }}>{m.title}</span>
              <span style={{ display: "block", fontSize: 13, color: DIM, marginTop: 2 }}>{m.desc}</span>
            </span>
            <span style={{ color: m.color, fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ background: BG3, borderRadius: 16, padding: 18, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>🏆 Ranking</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {(["global", "diaria"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setLbPeriod(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  background: lbPeriod === p ? GOLD : "rgba(255,255,255,0.06)",
                  color: lbPeriod === p ? BG : MID,
                }}
              >
                {p === "global" ? "Global" : "Hoy"}
              </button>
            ))}
          </div>
        </div>
        {lb.length === 0 ? (
          <p style={{ color: DIM, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
            Aún no hay puntuaciones. ¡Sé el primero!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lb.map((e, i) => (
              <div
                key={e.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: i < 3 ? `${GOLD}11` : "transparent",
                }}
              >
                <span style={{ width: 24, fontWeight: 800, color: i < 3 ? GOLD : DIM, fontSize: 14 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{e.name}</span>
                <span style={{ fontWeight: 800, color: GOLD2, fontSize: 14 }}>{e.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ───────────────────────── Play ─────────────────────────

function Play({
  q,
  idx,
  total,
  mode,
  score,
  streak,
  selected,
  revealed,
  timeLeft,
  timerMax,
  onAnswer,
  onNext,
  loading,
  submitting,
  removed,
  onFifty,
  hintBusy,
  hintErr,
}: {
  q: ClientQuestion;
  idx: number;
  total: number | null;
  mode: Mode;
  score: number;
  streak: number;
  selected: number | null;
  revealed: AnswerResp | null;
  timeLeft: number;
  timerMax: number;
  onAnswer: (c: number) => void;
  onNext: () => void;
  loading: boolean;
  submitting: boolean;
  removed: number[];
  onFifty: () => void;
  hintBusy: boolean;
  hintErr: string | null;
}) {
  return (
    <div style={{ animation: "pop .25s ease" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: DIM, fontWeight: 600 }}>
          {total ? `Pregunta ${idx + 1}/${total}` : `Pregunta ${idx + 1}`}
        </span>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {streak >= 2 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: "#f97316" }}>🔥 {streak}</span>
          )}
          <span style={{ fontSize: 14, fontWeight: 800, color: GOLD2 }}>{score} pts</span>
        </div>
      </div>

      {/* Timer */}
      {timerMax > 0 && !revealed && (
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginBottom: 18, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(timeLeft / timerMax) * 100}%`,
              background: timeLeft <= 3 ? RED : GOLD,
              transition: "width .25s linear",
              borderRadius: 999,
            }}
          />
        </div>
      )}

      {/* Question */}
      <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill text={q.category} />
        <Pill text={q.difficulty} />
      </div>
      <h2 style={{ fontSize: "clamp(19px,4vw,24px)", fontWeight: 800, lineHeight: 1.25, marginBottom: 22 }}>
        {q.question}
      </h2>

      {/* Comodín 50/50 (sumidero de Fútcoins) — solo antes de responder */}
      {!revealed && (
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={hintBusy || removed.length > 0}
            onClick={onFifty}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 999,
              background: removed.length > 0 ? "rgba(255,255,255,0.04)" : "rgba(201,168,76,0.12)",
              border: `1px solid ${removed.length > 0 ? "rgba(255,255,255,0.08)" : `${GOLD}66`}`,
              color: removed.length > 0 ? DIM : GOLD2,
              fontSize: 13, fontWeight: 800, fontFamily: "inherit",
              cursor: hintBusy || removed.length > 0 ? "default" : "pointer",
              opacity: hintBusy ? 0.6 : 1,
            }}
          >
            <span aria-hidden>✂️</span>
            {removed.length > 0 ? "50/50 usado" : hintBusy ? "Aplicando…" : `50/50 · ${TRIVIA_HINT_FIFTY} 🪙`}
          </button>
          {hintErr && <span style={{ fontSize: 12, color: "#fca5a5" }}>{hintErr}</span>}
        </div>
      )}

      {/* Options */}
      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, i) => {
          const isRemoved = !revealed && removed.includes(i);
          let bg = BG2;
          let border = "rgba(255,255,255,0.08)";
          let anim = "";
          if (revealed) {
            if (i === revealed.correctIndex) {
              bg = `${GREEN}22`;
              border = GREEN;
              anim = "flashG .5s ease";
            } else if (i === selected) {
              bg = `${RED}22`;
              border = RED;
              anim = "shake .3s ease";
            }
          } else if (i === selected) {
            border = GOLD;
          }
          return (
            <button
              key={i}
              className="zm-opt"
              disabled={!!revealed || isRemoved || submitting}
              onClick={() => onAnswer(i)}
              style={{
                textAlign: "left",
                padding: "15px 16px",
                borderRadius: 12,
                background: bg,
                border: `1.5px solid ${border}`,
                color: "#fff",
                cursor: revealed || isRemoved || submitting ? "default" : "pointer",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                animation: anim,
                display: "flex",
                gap: 10,
                alignItems: "center",
                opacity: isRemoved ? 0.35 : 1,
                textDecoration: isRemoved ? "line-through" : "none",
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: DIM, flexShrink: 0 }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {revealed && (
        <div style={{ marginTop: 18, animation: "pop .25s ease" }}>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: revealed.correct ? `${GREEN}14` : `${RED}14`,
              border: `1px solid ${revealed.correct ? GREEN : RED}44`,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16, color: revealed.correct ? GREEN : RED }}>
              {revealed.correct ? `✅ ¡Correcto! +${revealed.points} pts` : "❌ Fallaste"}
            </div>
            {q.options && (
              <div style={{ fontSize: 13, color: MID, marginTop: 6 }}>
                Respuesta: <b style={{ color: "#fff" }}>{q.options[revealed.correctIndex]}</b>
              </div>
            )}
            {revealed.explanation && (
              <div style={{ fontSize: 13, color: DIM, marginTop: 8, lineHeight: 1.5 }}>{revealed.explanation}</div>
            )}
          </div>
          <button
            onClick={onNext}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "15px",
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG,
              fontWeight: 800,
              fontSize: 16,
              fontFamily: "inherit",
            }}
          >
            {revealed.gameOver ? "Ver resultado" : "Siguiente →"}
          </button>
        </div>
      )}
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: DIM, background: "rgba(255,255,255,0.05)", padding: "4px 9px", borderRadius: 999 }}>
      {text}
    </span>
  );
}

// ───────────────────────── Result ─────────────────────────

const R = "/assets/trivia/results";

/** Rango según puntos (solo visual; no cambia ninguna lógica de juego). */
function rankFor(points: number): string {
  if (points >= 121) return "Leyenda ZonaMundial";
  if (points >= 81) return "Experto Mundialista";
  if (points >= 41) return "Buen Predictor";
  return "Aprendiz Mundialista";
}

function Result({
  result,
  mode,
  onAgain,
  onMenu,
}: {
  result: FinishResp;
  mode: Mode;
  onAgain: () => void;
  onMenu: () => void;
}) {
  const pct = result.answered > 0 ? Math.round((result.correct / result.answered) * 100) : 0;
  const rank = rankFor(result.points);
  // Economía: si el servidor abonó Fútcoins (usuario autenticado, primera del modo
  // hoy), mostramos los valores REALES de la billetera. Si está autenticado pero ya
  // cobró hoy, muestra 0. Para invitados mostramos una estimación como gancho.
  const claimed = Boolean(result.rewardClaimed);
  // Estimación para invitados (gancho de registro): debe COINCIDIR con lo que el
  // servidor abonará al registrarse, no una cifra inventada. Misma fórmula que
  // triviaSessionReward (coinsForResolved / xpForResolved): éxito = acertar ≥ 50%.
  const estSuccess = result.answered > 0 && result.correct / result.answered >= 0.5;
  const estCoins = estSuccess ? 10 + Math.round(result.points * 0.25) : 1;
  const estXp = (estSuccess ? 15 : 3) + Math.round(result.points * 0.5);
  const futcoins = claimed ? result.futcoins ?? 0 : result.authed ? 0 : estCoins;
  const xp = claimed ? result.xpAwarded ?? 0 : result.authed ? 0 : estXp;
  const alreadyClaimed = Boolean(result.authed) && !claimed && result.recorded;
  const share = async () => {
    const text =
      mode === "muerte-subita"
        ? `He aguantado ${result.survival} preguntas seguidas en la Trivia del Mundial de ZonaMundial 🔥 ¿Puedes superarme?`
        : `He sacado ${result.points} puntos (${result.correct}/${result.answered}) en la Trivia del Mundial de ZonaMundial ⚽ ¿Cuánto sabes tú?`;
    const url = "https://zonamundial.app/trivia";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Trivia del Mundial", text, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert("¡Copiado! Pégalo donde quieras.");
    } catch {
      /* noop */
    }
  };

  const hasBadges =
    result.perfectDay ||
    result.timeBonus === "early_bird" ||
    result.timeBonus === "night_owl";

  return (
    <div className="zm-r">
      <style>{`
        .zm-r{max-width:760px;margin:0 auto;animation:pop .3s ease}
        .zm-r-eyebrow{text-align:center;color:#E6C85C;font-size:11px;font-weight:800;letter-spacing:4px;text-transform:uppercase;margin-bottom:14px}
        .zm-r-card{position:relative;background-image:linear-gradient(180deg,rgba(7,20,38,.35),rgba(7,20,38,.55)),url('${R}/result-main-panel.png');background-size:100% 100%;background-repeat:no-repeat;padding:42px 22px 30px;text-align:center;margin-bottom:16px}
        .zm-r-medal{width:88px;height:88px;margin:0 auto 8px;display:block;filter:drop-shadow(0 6px 18px rgba(0,0,0,.55))}
        .zm-r-score{font-weight:900;line-height:.95;font-size:clamp(46px,13vw,66px);color:#F4F6FA;text-shadow:0 2px 18px rgba(0,0,0,.4)}
        .zm-r-score b{color:#E6C85C}
        .zm-r-score em{display:block;font-style:normal;font-size:.26em;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:#8E9AB3;margin-top:8px}
        .zm-r-summary{color:#8E9AB3;font-size:15px;font-weight:500;margin:12px 0 16px}
        .zm-r-rank{display:inline-block;padding:9px 20px;border-radius:999px;font-weight:800;font-size:14px;letter-spacing:.4px;color:#050B14;background:linear-gradient(135deg,#D8B84F,#E6C85C);box-shadow:0 6px 18px rgba(216,184,79,.28)}
        .zm-r-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .zm-r-stat{background:linear-gradient(180deg,#0B1A2D,#071426);border:1px solid rgba(47,128,255,.28);border-radius:14px;padding:14px 6px;text-align:center}
        .zm-r-stat img{width:24px;height:24px;margin-bottom:6px}
        .zm-r-stat strong{display:block;font-size:clamp(18px,5.4vw,22px);font-weight:800;color:#F4F6FA}
        .zm-r-stat span{display:block;margin-top:2px;font-size:11px;color:#8E9AB3;font-weight:500}
        .zm-r-rewards{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;background:linear-gradient(180deg,#0B1A2D,#071426);border:1px solid rgba(47,128,255,.22);border-radius:14px;padding:12px 6px;margin-bottom:18px}
        .zm-r-reward{display:flex;align-items:center;gap:7px;padding:4px 14px;font-weight:800;color:#F4F6FA;font-size:14px}
        .zm-r-reward img{width:20px;height:20px}
        .zm-r-reward+.zm-r-reward{border-left:1px solid rgba(255,255,255,.08)}
        .zm-r-badge{margin:0 5px;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;color:#E6C85C;background:rgba(230,200,92,.12);border:1px solid rgba(230,200,92,.42)}
        .zm-r-actions{display:grid;gap:10px;max-width:640px;margin:0 auto}
        .zm-r-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;padding:14px 18px;border-radius:14px;font-weight:800;font-size:16px;font-family:inherit;cursor:pointer;border:none;transition:transform .12s,filter .12s}
        .zm-r-btn img{width:20px;height:20px}
        .zm-r-btn:hover{filter:brightness(1.07)}
        .zm-r-btn:active{transform:translateY(1px)}
        .zm-r-btn:focus-visible{outline:3px solid #2F80FF;outline-offset:2px}
        .zm-r-primary{background:linear-gradient(135deg,#D8B84F,#E6C85C);color:#050B14}
        .zm-r-secondary{background:#0B1A2D;color:#F4F6FA;border:1px solid rgba(47,128,255,.55)}
        .zm-r-tertiary{background:transparent;color:#8E9AB3;border:1px solid rgba(255,255,255,.1)}
        .zm-r-chev{margin-left:auto;font-size:20px;line-height:1;font-weight:800}
        .zm-r-note{color:#6a7a9a;font-size:12px;text-align:center;margin:14px auto 0;max-width:480px}
        @media(max-width:359px){.zm-r-reward{padding:4px 9px;font-size:13px}}
      `}</style>

      <p className="zm-r-eyebrow">Resultado final</p>

      {/* Card principal */}
      <div className="zm-r-card">
        <img className="zm-r-medal" src={`${R}/rank-medal.png`} alt="" />
        <div className="zm-r-score">
          <b>{result.points.toLocaleString()}</b>
          <em>puntos</em>
        </div>
        <p className="zm-r-summary">
          {mode === "muerte-subita"
            ? `Aguantaste ${result.survival} preguntas seguidas`
            : `${result.correct} de ${result.answered} correctas (${pct}%)`}
        </p>
        <span className="zm-r-rank">{rank}</span>
      </div>

      {/* Stats */}
      <div className="zm-r-stats">
        <article className="zm-r-stat">
          <img src={`${R}/icon-target.svg`} alt="" />
          <strong>
            {result.correct}/{result.answered}
          </strong>
          <span>Aciertos</span>
        </article>
        <article className="zm-r-stat">
          <img src={`${R}/icon-fire.svg`} alt="" />
          <strong>{result.bestStreak}</strong>
          <span>Mejor racha</span>
        </article>
        <article className="zm-r-stat">
          <img src={`${R}/icon-accuracy.svg`} alt="" />
          <strong>{pct}%</strong>
          <span>Precisión</span>
        </article>
      </div>

      {/* Recompensas */}
      <div className="zm-r-rewards">
        <div className="zm-r-reward">
          <img src={`${R}/icon-xp.svg`} alt="" />
          <span>+{xp.toLocaleString()} XP</span>
        </div>
        <div className="zm-r-reward">
          <img src={`${R}/icon-futcoins.svg`} alt="" />
          <span>+{futcoins} Fútcoins</span>
        </div>
        {hasBadges && (
          <div className="zm-r-reward" style={{ borderLeft: "1px solid rgba(255,255,255,.08)" }}>
            {result.perfectDay && <span className="zm-r-badge">Día Perfecto +50</span>}
            {result.timeBonus === "early_bird" && <span className="zm-r-badge">Early Bird ×1.5</span>}
            {result.timeBonus === "night_owl" && <span className="zm-r-badge">Búho Nocturno ×1.25</span>}
          </div>
        )}
      </div>

      {!result.recorded && (
        <p className="zm-r-note">
          Tu puntuación no se guardó en el ranking (sin nombre). Pon tu nombre en el menú para competir.
        </p>
      )}

      {result.recorded && !result.authed && (
        <p className="zm-r-note">
          Inicia sesión para guardar tus Fútcoins y gastarlas en todo ZonaMundial.
        </p>
      )}

      {alreadyClaimed && (
        <p className="zm-r-note">
          Ya cobraste Fútcoins en este modo hoy. Sigues sumando al ranking; vuelve mañana para más Fútcoins.
        </p>
      )}

      {/* Acciones */}
      <div className="zm-r-actions" style={{ marginTop: 18 }}>
        <button className="zm-r-btn zm-r-primary" onClick={share}>
          <img src={`${R}/icon-share.svg`} alt="" />
          Compartir resultado
          <span className="zm-r-chev" aria-hidden="true">›</span>
        </button>
        <button className="zm-r-btn zm-r-secondary" onClick={onAgain}>
          <img src={`${R}/icon-replay.svg`} alt="" />
          Jugar otra vez
        </button>
        <button className="zm-r-btn zm-r-tertiary" onClick={onMenu}>
          <img src={`${R}/icon-menu.svg`} alt="" />
          Menú
        </button>
      </div>
    </div>
  );
}

// ─── Salvarracha: overlay de revive en Muerte Súbita ─────────────────────────

function ReviveOverlay({ lostStreak, credits, busy, waiting, err, onBuy, onDecline }: {
  lostStreak: number;
  /** Usos en el monedero; null mientras se consulta. */
  credits: number | null;
  busy: boolean;
  waiting: boolean;
  err: string | null;
  onBuy: () => void;
  onDecline: () => void;
}) {
  const hasCredits = (credits ?? 0) > 0;
  const cta = busy
    ? "Aplicando…"
    : credits === null
      ? "💛 Revivir y salvar mi racha"
      : hasCredits
        ? `💛 Usar Salvarracha · te quedan ${credits}`
        : `💛 Revivir con ${POWERUP_PACK.emoji} Pack ×3 · ${POWERUP_PACK.prices.eur.display}`;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(6,11,20,0.82)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ background: "#0F1D32", border: `1px solid ${GOLD}55`, borderRadius: 20, padding: "28px 22px", maxWidth: 400, width: "100%", textAlign: "center", animation: "pop .18s ease-out" }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>💀</div>
        <h3 style={{ margin: "10px 0 6px", fontSize: 20, fontWeight: 900, color: "#fff" }}>¡Has caído!</h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: MID, lineHeight: 1.55 }}>
          {lostStreak >= 3
            ? <>Llevabas <b style={{ color: GOLD2 }}>{lostStreak} seguidas</b>. Revive y conserva tu racha y tu multiplicador.</>
            : <>La partida no tiene por qué acabar aquí. Revive y sigue sumando.</>}
        </p>

        {waiting ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${GOLD}33`, borderRadius: 12, padding: "14px 12px", fontSize: 13.5, color: MID, lineHeight: 1.5 }}>
            🕐 Termina el pago en la pestaña que se ha abierto.
            <br />Esta pantalla seguirá sola en cuanto se confirme.
          </div>
        ) : (
          <button
            onClick={onBuy}
            disabled={busy || credits === null}
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
              cursor: busy || credits === null ? "default" : "pointer",
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#0B1220",
              fontWeight: 900, fontSize: 15, fontFamily: "inherit",
              opacity: busy || credits === null ? 0.75 : 1,
            }}
          >
            {cta}
          </button>
        )}

        {err && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#fca5a5", lineHeight: 1.45 }}>{err}</p>}

        <button
          onClick={onDecline}
          disabled={waiting || busy}
          style={{
            marginTop: 12, width: "100%", padding: "11px 16px", borderRadius: 12, cursor: waiting || busy ? "default" : "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: waiting || busy ? "#475569" : MID,
            fontWeight: 700, fontSize: 13.5, fontFamily: "inherit",
          }}
        >
          Terminar partida
        </button>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#64748B", lineHeight: 1.45 }}>
          {hasCredits
            ? "Un revive por partida. Se aplica al instante con uno de tus usos."
            : `Un revive por partida. El pack trae 3 usos: gastas 1 aquí y te quedan 2 para cualquier comodín.`}
        </p>
      </div>
    </div>
  );
}
