"use client";

// src/app/trivia/TriviaGame.tsx
//
// Juego de Trivia (cliente). Tres modos: Diaria, Relámpago, Muerte Súbita.
// La corrección y los puntos los calcula el servidor (anti-trampa); aquí solo
// gestionamos la experiencia: timers, feedback inmediato, racha y ranking.

import { useCallback, useEffect, useRef, useState } from "react";

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
        body: JSON.stringify({ mode: m }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
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
      setResult(null);
      setPhase("playing");
      qStartRef.current = Date.now();
    } catch {
      setError("Error de conexión.");
    }
    setLoading(false);
  }

  async function submitAnswer(choice: number) {
    if (revealed) return;
    const q = questions[idx];
    if (!q) return;
    setSelected(choice);
    const responseMs = Date.now() - qStartRef.current;
    try {
      const r = await fetch("/api/trivia/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: q.id, choice, responseMs }),
      });
      const data: AnswerResp = await r.json();
      setRevealed(data);
      setScore(data.totalPoints);
      setStreak(data.streak);
    } catch {
      setError("Error al enviar respuesta.");
    }
  }

  async function next() {
    if (!revealed) return;
    const isLast = idx + 1 >= questions.length;
    if (revealed.gameOver || isLast) {
      await finishGame();
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setRevealed(null);
    qStartRef.current = Date.now();
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
    <div style={{ background: BG, color: "#fff", minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @keyframes pop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes flashG{0%{box-shadow:0 0 0 0 ${GREEN}55}100%{box-shadow:0 0 0 16px transparent}}
        @keyframes barIn{from{width:100%}to{width:0%}}
        .zm-opt{transition:all .15s}
        .zm-opt:hover:not(:disabled){border-color:${GOLD}88;transform:translateY(-2px)}
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
          />
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

      {/* Options */}
      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, i) => {
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
              disabled={!!revealed}
              onClick={() => onAnswer(i)}
              style={{
                textAlign: "left",
                padding: "15px 16px",
                borderRadius: 12,
                background: bg,
                border: `1.5px solid ${border}`,
                color: "#fff",
                cursor: revealed ? "default" : "pointer",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                animation: anim,
                display: "flex",
                gap: 10,
                alignItems: "center",
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

  return (
    <div style={{ textAlign: "center", animation: "pop .3s ease" }}>
      <div style={{ fontSize: 54, marginBottom: 4 }}>{pct >= 70 ? "🏆" : pct >= 40 ? "👏" : "💪"}</div>
      <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
        {result.points.toLocaleString()} <span style={{ color: GOLD2 }}>puntos</span>
      </h2>
      <p style={{ color: MID, fontSize: 15, marginBottom: 22 }}>
        {mode === "muerte-subita"
          ? `Aguantaste ${result.survival} preguntas seguidas`
          : `${result.correct} de ${result.answered} correctas (${pct}%)`}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        <Stat label="Aciertos" value={`${result.correct}/${result.answered}`} />
        <Stat label="Mejor racha" value={`🔥 ${result.bestStreak}`} />
        <Stat label="Precisión" value={`${pct}%`} />
      </div>

      {(result.perfectDay || (result.timeBonus && result.timeBonusMult && result.timeBonusMult > 1)) && (
        <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {result.perfectDay && <Badge text="🌟 Día Perfecto · +50 pts" />}
          {result.timeBonus === "early_bird" && <Badge text="🐦 Early Bird · ×1.5" />}
          {result.timeBonus === "night_owl" && <Badge text="🦉 Búho Nocturno · ×1.25" />}
        </div>
      )}

      {!result.recorded && (
        <p style={{ color: DIM, fontSize: 12, marginBottom: 16 }}>
          Tu puntuación no se guardó en el ranking (sin nombre). Pon tu nombre en el menú para competir.
        </p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <button onClick={share} style={btn(`linear-gradient(135deg,${GOLD},${GOLD2})`, BG)}>
          📲 Compartir resultado
        </button>
        <button onClick={onAgain} style={btn(BG2, "#fff", "1px solid rgba(255,255,255,0.1)")}>
          🔁 Jugar otra vez
        </button>
        <button onClick={onMenu} style={btn("transparent", MID, "1px solid rgba(255,255,255,0.08)")}>
          ← Menú
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: BG2, borderRadius: 12, padding: "14px 8px" }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span style={{ background: `${GOLD}1a`, border: `1px solid ${GOLD}44`, color: GOLD2, padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, display: "inline-block" }}>
      {text}
    </span>
  );
}

function btn(bg: string, color: string, border = "none"): React.CSSProperties {
  return {
    width: "100%",
    padding: "15px",
    borderRadius: 14,
    border,
    cursor: "pointer",
    background: bg,
    color,
    fontWeight: 800,
    fontSize: 16,
    fontFamily: "inherit",
  };
}
