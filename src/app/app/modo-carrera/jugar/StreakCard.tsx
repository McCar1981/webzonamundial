// src/app/app/modo-carrera/jugar/StreakCard.tsx
//
// Tarjeta de RACHA DIARIA del Hub. Es el gancho de retorno: entra cada día,
// reclama y la cadena crece; cada 7 días hay punto de habilidad extra. Muestra
// los 7 días de la semana de racha como "sellos" y un botón de reclamo que se
// apaga una vez usado hoy. Client-only, sin emojis (SVG).

"use client";

import { useMemo, useState } from "react";
import { BG3, GOLD, GOLD2, MID, DIM, GREEN } from "./fx";
import type { CareerState } from "@/lib/modo-carrera/types";
import { streakStatus, streakGivesPoint } from "@/lib/modo-carrera/streak";

export default function StreakCard({
  career,
  onClaim,
}: {
  career: CareerState;
  onClaim: () => void;
}) {
  const status = useMemo(() => streakStatus(career), [career]);
  const [justClaimed, setJustClaimed] = useState(false);

  const claim = () => {
    if (!status.claimable) return;
    onClaim();
    setJustClaimed(true);
  };

  // Posición dentro del ciclo semanal (1..7) que quedaría tras el reclamo.
  const weekPos = ((status.pendingDay - 1) % 7) + 1;
  // Sellos de la semana: días ya consolidados vs el de hoy vs futuros.
  const stamps = Array.from({ length: 7 }, (_, i) => i + 1);
  const consolidated = status.claimable ? weekPos - 1 : weekPos;

  return (
    <div style={{ padding: 20, borderRadius: 16, background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(20,17,10,0.4))", border: "1px solid rgba(201,168,76,0.22)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>
          Racha diaria
        </h3>
        <span style={{ fontSize: 12, color: DIM, fontWeight: 700 }}>
          Mejor: {Math.max(status.best, status.current)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>{status.current}</span>
        <span style={{ fontSize: 13, color: MID, fontWeight: 700 }}>
          {status.current === 1 ? "día seguido" : "días seguidos"}
        </span>
      </div>

      {/* Sellos de la semana de racha */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {stamps.map((n) => {
          const done = n <= consolidated;
          const isToday = status.claimable && n === weekPos;
          const isMilestone = streakGivesPoint(
            // día absoluto representado por este sello dentro del ciclo actual
            status.pendingDay - weekPos + n,
          );
          return (
            <div
              key={n}
              title={isMilestone ? "Hito: +1 punto de habilidad" : undefined}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                background: done ? "rgba(34,197,94,0.18)" : isToday ? "rgba(201,168,76,0.18)" : BG3,
                border: `1px solid ${done ? GREEN : isToday ? GOLD : "rgba(255,255,255,0.06)"}`,
                color: done ? GREEN : isToday ? GOLD2 : DIM,
                position: "relative",
              }}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                n
              )}
              {isMilestone && (
                <span style={{ position: "absolute", top: 2, right: 3, width: 5, height: 5, borderRadius: "50%", background: done ? GREEN : GOLD }} />
              )}
            </div>
          );
        })}
      </div>

      {status.claimable ? (
        <button
          type="button"
          onClick={claim}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: "#1a1205",
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          Reclamar +{status.rewardXp} XP{status.rewardPoint ? " · +1 punto" : ""}
        </button>
      ) : (
        <div style={{ textAlign: "center", padding: "11px 16px", borderRadius: 12, background: BG3, color: justClaimed ? GREEN : MID, fontSize: 13, fontWeight: 700 }}>
          {justClaimed ? "¡Recompensa reclamada!" : "Vuelve mañana para no perder la racha"}
        </div>
      )}
    </div>
  );
}
