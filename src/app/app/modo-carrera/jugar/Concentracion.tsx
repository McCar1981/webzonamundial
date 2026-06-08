// src/app/app/modo-carrera/jugar/Concentracion.tsx
//
// PANTALLA DE CONCENTRACIÓN (semana previa al partido). El DT decide cómo llega
// su selección al encuentro: elige 3 sesiones de entrenamiento que mueven la
// fuerza del equipo, la frescura del grupo (recurso que se arrastra entre
// partidos) y el ánimo. Las sesiones físicas exigen y arriesgan lesiones.
// SVG-only, sin emojis. Ver motor en src/lib/modo-carrera/concentracion.ts.

"use client";

import { useMemo, useState } from "react";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";
import type { CareerState, Injury } from "@/lib/modo-carrera/types";
import {
  PREP_SESSIONS,
  SESSIONS_PER_WEEK,
  prepSessionById,
  previewPrep,
  getFrescura,
  type PrepSessionId,
} from "@/lib/modo-carrera/concentracion";

function frescuraColor(f: number): string {
  if (f >= 70) return GREEN;
  if (f >= 45) return GOLD2;
  return RED;
}

function frescuraLabel(f: number): string {
  if (f >= 80) return "Pletórico";
  if (f >= 60) return "En forma";
  if (f >= 40) return "Justo";
  if (f >= 20) return "Cansado";
  return "Fundido";
}

/** Icono SVG por tipo de sesión. Sin emojis. */
function SessionIcon({ id, color = GOLD2, size = 22 }: { id: PrepSessionId; color?: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const };
  switch (id) {
    case "fisico":
      return (
        <svg {...common}>
          <path d="M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "tactico":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.6" />
          <path d="M7 9l4 3-4 3M13 15h4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "balon_parado":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.6" />
          <path d="M12 7l2.6 1.9-1 3.1h-3.2l-1-3.1L12 7Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "analisis":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" stroke={color} strokeWidth="1.7" />
          <path d="M15.5 15.5L20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "recuperacion":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/** Ruta de la miniatura ilustrada de una sesión (guiones bajos → guiones). */
function sessionArtSrc(id: PrepSessionId): string {
  return `/img/modo-carrera/concentracion/sesion-${id.replace(/_/g, "-")}.webp`;
}

/**
 * Arte de la sesión: muestra la miniatura ilustrada si el archivo existe; si aún
 * no está (404), cae al icono SVG. Así se integra sola al soltar las imágenes.
 */
function SessionArt({ id, size = 22 }: { id: PrepSessionId; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <SessionIcon id={id} size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sessionArtSrc(id)}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, display: "block", pointerEvents: "none", userSelect: "none" }}
    />
  );
}

/**
 * Ilustración del contratiempo (lesión en el entrenamiento): muestra
 * `contratiempo-lesion.webp` si existe; si no, cae al emblema SVG rojo.
 */
function ContratiempoArt() {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/img/modo-carrera/concentracion/contratiempo-lesion.webp"
        alt=""
        width={120}
        height={120}
        onError={() => setFailed(true)}
        style={{ display: "block", margin: "0 auto 14px", width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))" }}
      />
    );
  }
  return (
    <div style={{ width: 56, height: 56, margin: "0 auto 14px", borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: `1px solid ${RED}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" stroke={RED} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 8v6M9 11h6" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Delta({ label, value, unit = "" }: { label: string; value: number; unit?: string }) {
  const pos = value > 0.05;
  const neg = value < -0.05;
  const color = pos ? GREEN : neg ? RED : DIM;
  const sign = pos ? "+" : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 900, color }}>
        {sign}
        {value.toFixed(unit === "%" ? 0 : 1)}
        {unit}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: DIM }}>{label}</span>
    </div>
  );
}

export default function Concentracion({
  career,
  opponentName,
  onConfirm,
  onPlay,
  onCancel,
}: {
  career: CareerState;
  opponentName: string;
  /** Persiste la concentración y devuelve la lesión de entrenamiento (o null). */
  onConfirm: (sessions: PrepSessionId[]) => Injury | null;
  /** Lanza el partido. */
  onPlay: () => void;
  /** Vuelve al hub sin jugar. */
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<PrepSessionId[]>([]);
  const [injured, setInjured] = useState<Injury | null>(null);
  const [done, setDone] = useState(false);

  const frescura = getFrescura(career);
  const preview = useMemo(() => previewPrep(career, picked), [career, picked]);
  const full = picked.length >= SESSIONS_PER_WEEK;

  const addSession = (id: PrepSessionId) => {
    if (full) return;
    setPicked((prev) => [...prev, id]);
  };
  const removeAt = (idx: number) => setPicked((prev) => prev.filter((_, i) => i !== idx));

  const confirm = () => {
    const inj = onConfirm(picked);
    if (inj) {
      setInjured(inj);
      setDone(true);
    } else {
      onPlay();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,11,20,0.94)",
        padding: 14,
        animation: "mcBannerIn .25s ease both",
      }}
    >
      {/* Fondo de escena (desktop/mobile). Si el .webp no existe, el degradado +
          backgroundColor de marca cubren el hueco: el 404 no rompe nada. */}
      <style>{`
        .mcConcCard {
          background-image: linear-gradient(180deg, rgba(15,29,50,0.94), rgba(11,24,37,0.97)), url(/img/modo-carrera/partido/concentracion-bg.webp);
          background-size: cover;
          background-position: center;
        }
        @media (max-width: 640px) {
          .mcConcCard {
            background-image: linear-gradient(180deg, rgba(15,29,50,0.94), rgba(11,24,37,0.97)), url(/img/modo-carrera/partido/concentracion-bg-mobile.webp);
          }
        }
      `}</style>
      <div
        className="mcConcCard"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: "94vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          padding: 20,
          borderRadius: 18,
          backgroundColor: BG2,
          border: `1px solid ${GOLD}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
        }}
      >
        {!done ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>
                Semana de concentración
              </div>
              <div style={{ fontSize: 12, color: MID, marginTop: 3 }}>
                Prepara al grupo para medirse a <strong style={{ color: "#fff" }}>{opponentName}</strong>. Elige {SESSIONS_PER_WEEK} sesiones.
              </div>
            </div>

            {/* Frescura actual */}
            <div style={{ padding: "12px 14px", borderRadius: 12, background: BG3, border: `1px solid ${frescuraColor(frescura)}44`, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: GOLD }}>
                  Frescura del grupo
                </span>
                <span style={{ fontSize: 16, fontWeight: 900, color: frescuraColor(frescura) }}>
                  {Math.round(frescura)}
                  <span style={{ fontSize: 11, fontWeight: 700, color: DIM }}> · {frescuraLabel(frescura)}</span>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${frescura}%`, height: "100%", background: frescuraColor(frescura), transition: "width .3s" }} />
              </div>
            </div>

            {/* Sesiones elegidas (slots) */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {Array.from({ length: SESSIONS_PER_WEEK }).map((_, i) => {
                const id = picked[i];
                const s = id ? prepSessionById(id) : null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => id && removeAt(i)}
                    disabled={!id}
                    style={{
                      flex: 1,
                      minHeight: 58,
                      borderRadius: 10,
                      cursor: id ? "pointer" : "default",
                      background: id ? "rgba(201,168,76,0.14)" : BG3,
                      border: `1px ${id ? "solid" : "dashed"} ${id ? GOLD : "rgba(255,255,255,0.14)"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: 6,
                    }}
                  >
                    {s ? (
                      <>
                        <SessionArt id={s.id} size={26} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: GOLD2, textAlign: "center", lineHeight: 1.1 }}>{s.name}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: DIM }}>Sesión {i + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Vista previa del efecto */}
            <div style={{ padding: "12px 14px", borderRadius: 12, background: BG3, border: `1px solid rgba(255,255,255,0.07)`, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <Delta label="Ataque" value={preview.atk} />
                <Delta label="Defensa" value={preview.def} />
                <Delta label="Moral" value={preview.morale} />
                <Delta label="Lesión" value={preview.injuryRisk * 100} unit="%" />
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, color: MID }}>
                <span>Frescura tras el partido:</span>
                <strong style={{ color: frescuraColor(preview.frescuraNext) }}>{Math.round(preview.frescuraNext)}</strong>
              </div>
            </div>

            {/* Catálogo de sesiones */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {PREP_SESSIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSession(s.id)}
                  disabled={full}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: full ? "not-allowed" : "pointer",
                    opacity: full ? 0.45 : 1,
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ flexShrink: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SessionArt id={s.id} size={40} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#fff" }}>{s.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: DIM, lineHeight: 1.4, marginTop: 1 }}>{s.hint}</span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 18, fontWeight: 900, color: full ? DIM : GOLD2 }}>+</span>
                </button>
              ))}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, paddingTop: 6, background: `linear-gradient(180deg, ${BG2}00, ${BG2} 40%)` }}>
              <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
              <button type="button" onClick={() => setPicked([])} style={btnGhost} disabled={picked.length === 0}>Limpiar</button>
              <button
                type="button"
                disabled={!full}
                onClick={confirm}
                style={{ ...btnGold, opacity: full ? 1 : 0.45, cursor: full ? "pointer" : "not-allowed" }}
              >
                {full ? "Concentrar y jugar" : `Faltan ${SESSIONS_PER_WEEK - picked.length}`}
              </button>
            </div>
          </>
        ) : (
          // Contratiempo en el entrenamiento: una sesión dejó tocado a un jugador.
          <div style={{ textAlign: "center", padding: "10px 6px" }}>
            <ContratiempoArt />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: RED }}>Contratiempo</div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: "#fff", margin: "6px 0 8px" }}>
              {injured?.player} se resiente
            </h3>
            <p style={{ fontSize: 13, color: MID, lineHeight: 1.55, marginBottom: 18 }}>
              Cae lesionado en el entrenamiento y será baja el próximo partido. Tocará rehacer la zona.
            </p>
            <button type="button" onClick={onPlay} style={{ ...btnGold, width: "100%" }}>Continuar al partido</button>
          </div>
        )}
      </div>
    </div>
  );
}

const btnGold: React.CSSProperties = {
  flex: 1.5,
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
  color: BG,
  fontWeight: 900,
  fontSize: 13.5,
  cursor: "pointer",
  boxShadow: "0 10px 28px rgba(201,168,76,0.3)",
};

const btnGhost: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: MID,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
