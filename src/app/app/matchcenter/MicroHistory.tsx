"use client";

// src/app/app/matchcenter/MicroHistory.tsx
//
// Historial de Micro-predicciones del partido. Lista las micros emitidas
// (resueltas y abiertas), con la opción correcta y, si hay sesión, el recorrido
// del usuario: qué respondió, si acertó y los puntos. Sondea con baja frecuencia
// para ir reflejando las resoluciones en vivo sin pesar.

import { useCallback, useEffect, useRef, useState } from "react";

const BG = "#060B14";
const SURFACE = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#e8d48b";
const OK = "#4ade80";
const BAD = "#ff6b6b";

interface MicroOption {
  key: string;
  label: string;
}
interface MyEntry {
  option: string;
  correct: boolean | null;
  points: number | null;
}
interface MicroItem {
  id: string;
  kind: string;
  category: string;
  emoji: string;
  question: string;
  options: MicroOption[];
  status: "active" | "closed" | "resolved";
  correct_option: string | null;
  base_points: number;
  open_minute: number;
  activated_at: string;
  closes_at: string;
  resolved_at: string | null;
  mine: MyEntry | null;
}

function labelOf(options: MicroOption[], key: string | null): string | null {
  if (!key) return null;
  return options.find((o) => o.key === key)?.label ?? key;
}

// Resultado local de una jugada en modo Fantasma (no toca el historial real).
interface GhostResult {
  option: string;
  is_correct: boolean;
  correct_option: string;
  points: number;
}

export default function MicroHistory({ matchId }: { matchId: number }) {
  const [items, setItems] = useState<MicroItem[]>([]);
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  // Resultados de modo Fantasma por micro (id → resultado). Solo en cliente.
  const [ghost, setGhost] = useState<Record<string, GhostResult>>({});
  const [ghostBusy, setGhostBusy] = useState<string | null>(null);
  const aliveRef = useRef(true);

  const playGhost = useCallback(async (microId: string, option: string) => {
    setGhostBusy(microId);
    try {
      const res = await fetch(`/api/micro/${microId}/ghost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      });
      const data = await res.json();
      if (!aliveRef.current) return;
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok) {
        setGhost((g) => ({
          ...g,
          [microId]: {
            option,
            is_correct: Boolean(data.is_correct),
            correct_option: String(data.correct_option),
            points: Number(data.points ?? 0),
          },
        }));
      } else if (data?.error === "ghost_expired") {
        // Caducó entre el render y el clic: oculta los botones (el render
        // recalcula la frescura con la hora actual).
        setItems((prev) => [...prev]);
      }
    } catch {
      /* silencioso */
    } finally {
      if (aliveRef.current) setGhostBusy(null);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/micro/match/${matchId}/history`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!aliveRef.current) return;
      if (Array.isArray(data.micros)) setItems(data.micros as MicroItem[]);
      setLoaded(true);
    } catch {
      /* silencioso */
    }
  }, [matchId]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, open ? 15000 : 45000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [load, open]);

  // Mientras no haya datos, no ocupamos espacio.
  if (loaded && items.length === 0) return null;

  const resolvedCount = items.filter((m) => m.status === "resolved").length;
  const myHits = items.filter((m) => m.mine?.correct === true).length;
  const myTotal = items.filter((m) => m.mine && m.mine.correct !== null).length;

  return (
    <section
      style={{
        maxWidth: 760,
        margin: "24px auto",
        padding: "0 16px",
        fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)",
        color: "#fff",
      }}
    >
      <div
        style={{
          borderRadius: 18,
          background: `linear-gradient(180deg, ${SURFACE} 0%, ${BG} 100%)`,
          border: "1px solid rgba(201,168,76,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Cabecera */}
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 18px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Micro-predicciones</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                {items.length} en el partido · {resolvedCount} resueltas
                {myTotal > 0 ? ` · acertaste ${myHits}/${myTotal}` : ""}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 18,
              color: GOLD,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            ⌄
          </span>
        </button>

        {/* Lista */}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 14px 16px" }}>
            {items.map((m) => {
              const resolved = m.status === "resolved";
              // "active" con la ventana vencida = ya no se puede responder: para
              // el usuario está CERRADA (en espera de resolución), no "en vivo".
              const expired = !resolved && new Date(m.closes_at).getTime() <= Date.now();
              const correctLabel = labelOf(m.options, m.correct_option);
              const myLabel = m.mine ? labelOf(m.options, m.mine.option) : null;
              const myCorrect = m.mine?.correct;
              const g = ghost[m.id];
              // Solo se puede jugar en fantasma una micro YA resuelta (no anulada)
              // que NO jugaste en vivo.
              // El fantasma CADUCA a los 5 min de resolverse: rejugar "la que se
              // te acaba de escapar", no elegir micros del min 30 yendo por el 73.
              const ghostFresh =
                resolved && m.resolved_at
                  ? Date.now() - new Date(m.resolved_at).getTime() <= 5 * 60_000
                  : false;
              const ghostable = ghostFresh && !!m.correct_option && !m.mine;
              const borderColor =
                myCorrect === true ? "rgba(74,222,128,0.45)" : myCorrect === false ? "rgba(255,107,53,0.40)" : "rgba(255,255,255,0.10)";
              return (
                <div
                  key={m.id}
                  style={{
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${borderColor}`,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{m.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: GOLD_LIGHT, opacity: 0.8 }}>
                      min {m.open_minute}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: resolved || expired ? "rgba(255,255,255,0.55)" : GOLD }}>
                      {resolved
                        ? (m.correct_option ? "Resuelta" : "Anulada")
                        : m.status === "active" && !expired ? "En vivo" : expired && m.status === "active" ? "Se resuelve en vivo" : "Cerrada"}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: resolved || m.mine ? 8 : 0 }}>
                    {m.question}
                  </div>

                  {/* Resultado */}
                  {resolved && correctLabel && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                      Correcto: <span style={{ color: GOLD_LIGHT, fontWeight: 800 }}>{correctLabel}</span>
                    </div>
                  )}

                  {/* Mi recorrido */}
                  {m.mine && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>Tú:</span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            myCorrect === true
                              ? "rgba(74,222,128,0.15)"
                              : myCorrect === false
                                ? "rgba(255,107,53,0.15)"
                                : "rgba(255,255,255,0.08)",
                          color: myCorrect === true ? OK : myCorrect === false ? BAD : "#fff",
                        }}
                      >
                        {myLabel}
                      </span>
                      {resolved && myCorrect !== null && (
                        <span style={{ marginLeft: "auto", color: myCorrect ? OK : BAD, fontWeight: 800 }}>
                          {myCorrect ? `+${m.mine.points ?? 0} pts` : "Fallaste"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Modo Fantasma 👻: jugar a toro pasado una micro que no respondiste. */}
                  {ghostable && !g && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                        👻 Jugar en fantasma <span style={{ opacity: 0.7 }}>(recién resuelta · solo XP ×0.5 · disponible 5 min)</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.options.map((o) => (
                          <button
                            key={o.key}
                            disabled={ghostBusy === m.id}
                            onClick={() => playGhost(m.id, o.key)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 999,
                              border: "1px solid rgba(201,168,76,0.4)",
                              background: "rgba(201,168,76,0.08)",
                              color: GOLD_LIGHT,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: ghostBusy === m.id ? "wait" : "pointer",
                              opacity: ghostBusy === m.id ? 0.5 : 1,
                            }}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resultado de la jugada fantasma */}
                  {g && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>👻</span>
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>Fantasma:</span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: g.is_correct ? "rgba(74,222,128,0.15)" : "rgba(255,107,53,0.15)",
                          color: g.is_correct ? OK : BAD,
                        }}
                      >
                        {labelOf(m.options, g.option)}
                      </span>
                      <span style={{ marginLeft: "auto", color: g.is_correct ? OK : BAD, fontWeight: 800 }}>
                        {g.is_correct ? `+${g.points} XP ×0.5` : "Fallaste"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
