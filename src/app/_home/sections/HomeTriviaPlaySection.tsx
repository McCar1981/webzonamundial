"use client";

// HomeTriviaPlaySection — pregunta de trivia JUGABLE directamente en la home.
// Reutiliza la API real de trivia (/api/trivia/start + /api/trivia/answer) en
// modo "diaria". Solo juega UNA pregunta como muestra; no llama a /finish, así
// que no contamina el ranking. No requiere login (sesión anónima). El módulo
// completo (3 modos + ranking) vive en /trivia.

import { useState } from "react";
import Link from "next/link";

const BG2 = "#0F1D32",
  BG3 = "#0B1825",
  GOLD = "#c9a84c",
  GOLD2 = "#e8d48b",
  MID = "#8a94b0",
  DIM = "#6a7a9a",
  GREEN = "#22c55e",
  RED = "#ef4444";

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
}

type Phase = "idle" | "loading" | "playing" | "answered" | "error";

export function HomeTriviaPlaySection() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState("");
  const [q, setQ] = useState<ClientQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<AnswerResp | null>(null);
  const [startedAt, setStartedAt] = useState(0);

  async function start() {
    setPhase("loading");
    setSelected(null);
    setRevealed(null);
    try {
      const r = await fetch("/api/trivia/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "diaria" }),
      });
      if (!r.ok) {
        setPhase("error");
        return;
      }
      const data = await r.json();
      const first: ClientQuestion | undefined = (data.questions || [])[0];
      if (!first || !data.sessionId) {
        setPhase("error");
        return;
      }
      setSessionId(data.sessionId);
      setQ(first);
      setStartedAt(Date.now());
      setPhase("playing");
    } catch {
      setPhase("error");
    }
  }

  async function answer(choice: number) {
    if (!q || phase !== "playing") return;
    setSelected(choice);
    setPhase("answered");
    try {
      const r = await fetch("/api/trivia/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: q.id,
          choice,
          responseMs: Date.now() - startedAt,
        }),
      });
      const data: AnswerResp = await r.json();
      setRevealed(data);
    } catch {
      // Si falla, dejamos el estado "answered" sin feedback de servidor.
      setRevealed(null);
    }
  }

  return (
    <section className="relative px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div
          className="relative overflow-hidden rounded-3xl border"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(11,24,37,0.85))",
          }}
        >
          {/* ── Banner hero: leyendas del Mundial ── */}
          <div className="relative">
            <picture>
              <source media="(min-width: 640px)" srcSet="/img/trivia/banner-desktop.webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/trivia/banner-mobile.webp"
                alt="Leyendas del Mundial"
                className="block w-full h-[340px] sm:h-[280px] object-cover object-top sm:object-right"
              />
            </picture>
            {/* Degradado móvil: oscurece abajo (texto al pie) */}
            <div
              aria-hidden
              className="absolute inset-0 sm:hidden"
              style={{ background: "linear-gradient(to top, rgba(7,12,20,0.97) 0%, rgba(7,12,20,0.55) 42%, rgba(7,12,20,0.12) 72%, transparent 100%)" }}
            />
            {/* Degradado escritorio: oscurece la izquierda (texto a la izq.) */}
            <div
              aria-hidden
              className="absolute inset-0 hidden sm:block"
              style={{ background: "linear-gradient(to right, rgba(7,12,20,0.97) 0%, rgba(7,12,20,0.82) 32%, rgba(7,12,20,0.25) 60%, transparent 82%)" }}
            />
            {/* Texto sobre la zona oscura */}
            <div className="absolute inset-0 flex flex-col justify-end sm:justify-center px-6 pb-6 sm:px-9 sm:pb-0">
              <div className="sm:max-w-[58%]">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: GOLD }}>
                  ⚡ Trivia · Juega ya
                </div>
                <h2
                  className="font-black text-white mb-2 leading-tight"
                  style={{ fontSize: "clamp(22px, 3.6vw, 34px)", letterSpacing: "-0.02em" }}
                >
                  ¿Cuánto sabes del{" "}
                  <span
                    style={{
                      background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Mundial
                  </span>
                  ?
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.80)", maxWidth: 460 }}>
                  Responde una pregunta aquí mismo —sin registro— y mide tu nivel.
                </p>
              </div>
            </div>
          </div>

          {/* ── Cuerpo: juego ── */}
          <div className="relative p-6 sm:p-9">
            {/* Glow decorativo */}
            <div
              aria-hidden
              className="absolute -top-24 -right-16 w-60 h-60 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(201,168,76,0.22), transparent 70%)",
                filter: "blur(45px)",
              }}
            />

            <div className="relative z-10">
            {/* ── IDLE ── */}
            {phase === "idle" && (
              <button
                onClick={start}
                style={primaryBtn}
                aria-label="Jugar una pregunta de trivia"
              >
                Jugar una pregunta →
              </button>
            )}

            {/* ── LOADING ── */}
            {phase === "loading" && (
              <div style={{ color: DIM, fontSize: 14, padding: "14px 0" }}>Cargando pregunta…</div>
            )}

            {/* ── ERROR ── */}
            {phase === "error" && (
              <div>
                <p style={{ color: "#ffd9d9", fontSize: 14, marginBottom: 12 }}>
                  No se pudo cargar la pregunta ahora mismo.
                </p>
                <Link href="/trivia" style={primaryBtn}>
                  Ir a Trivia →
                </Link>
              </div>
            )}

            {/* ── PLAYING / ANSWERED ── */}
            {(phase === "playing" || phase === "answered") && q && (
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <Pill text={q.category} />
                  <Pill text={q.difficulty} />
                </div>
                <h3 style={{ fontSize: "clamp(17px, 3vw, 21px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 16, color: "#fff" }}>
                  {q.question}
                </h3>

                <div style={{ display: "grid", gap: 9 }}>
                  {q.options.map((opt, i) => {
                    let bg = BG2;
                    let border = "rgba(255,255,255,0.08)";
                    if (revealed) {
                      if (i === revealed.correctIndex) {
                        bg = `${GREEN}22`;
                        border = GREEN;
                      } else if (i === selected) {
                        bg = `${RED}22`;
                        border = RED;
                      }
                    } else if (i === selected) {
                      border = GOLD;
                    }
                    return (
                      <button
                        key={i}
                        disabled={phase === "answered"}
                        onClick={() => answer(i)}
                        style={{
                          textAlign: "left",
                          padding: "13px 15px",
                          borderRadius: 12,
                          background: bg,
                          border: `1.5px solid ${border}`,
                          color: "#fff",
                          cursor: phase === "answered" ? "default" : "pointer",
                          fontSize: 14.5,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          transition: "border-color .15s, background .15s",
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.06)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            color: DIM,
                            flexShrink: 0,
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {phase === "answered" && (
                  <div style={{ marginTop: 16 }}>
                    {revealed && (
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          background: revealed.correct ? `${GREEN}14` : `${RED}14`,
                          border: `1px solid ${revealed.correct ? GREEN : RED}44`,
                          marginBottom: 14,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15, color: revealed.correct ? GREEN : RED }}>
                          {revealed.correct ? `✅ ¡Correcto! +${revealed.points} pts` : "❌ Casi…"}
                        </div>
                        {revealed.explanation && (
                          <div style={{ fontSize: 13, color: DIM, marginTop: 7, lineHeight: 1.5 }}>
                            {revealed.explanation}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Link href="/trivia" style={primaryBtn}>
                        Seguir jugando →
                      </Link>
                      <button onClick={start} style={secondaryBtn}>
                        Otra pregunta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: DIM,
        background: "rgba(255,255,255,0.05)",
        padding: "4px 9px",
        borderRadius: 999,
      }}
    >
      {text}
    </span>
  );
}

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "13px 24px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
  color: "#1A1208",
  fontWeight: 800,
  fontSize: 14.5,
  fontFamily: "inherit",
  textDecoration: "none",
  boxShadow: "0 0 30px -8px rgba(201,168,76,0.55)",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "13px 22px",
  borderRadius: 999,
  cursor: "pointer",
  background: BG3,
  color: "#fff",
  fontWeight: 700,
  fontSize: 14.5,
  fontFamily: "inherit",
  border: "1px solid rgba(255,255,255,0.1)",
};
