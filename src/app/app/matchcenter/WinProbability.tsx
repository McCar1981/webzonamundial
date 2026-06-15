"use client";

// "Latido de probabilidad" del Match Center: barra 1X2 con la probabilidad REAL
// de mercado (cuotas implícitas de casas, vía /api/match-center/odds) + alerta
// de GOL INMINENTE derivada del momentum en vivo (presión real del partido).
// La probabilidad de mercado es la previa (las cuotas se sellan antes del
// saque); el latido en vivo lo da la presión. Honesto: etiqueta "mercado".

import { useEffect, useState } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

interface OddsData {
  found: boolean;
  home?: number;
  draw?: number;
  away?: number;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default function WinProbability({
  matchId,
  home,
  away,
  momentum,
  live,
}: {
  matchId: number;
  home: { name: string; color: string };
  away: { name: string; color: string };
  /** -1 (visitante presiona) .. +1 (local presiona). */
  momentum: number;
  live: boolean;
}) {
  const [odds, setOdds] = useState<OddsData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/match-center/odds/${matchId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: OddsData | null) => {
        if (alive && d) setOdds(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [matchId]);

  const hasOdds = odds?.found && odds.home != null && odds.draw != null && odds.away != null;

  // Gol inminente: presión sostenida en vivo. Umbral alto para que signifique algo.
  const pressing = live && Math.abs(momentum) >= 0.45;
  const pressSide = momentum > 0 ? home : away;

  if (!hasOdds && !pressing) return null;

  const h = odds?.home ?? 0;
  const d = odds?.draw ?? 0;
  const a = odds?.away ?? 0;
  const favorite = h >= a && h >= d ? home.name : a >= h && a >= d ? away.name : "Empate";

  return (
    <section
      style={{
        background: "#0F1D32",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 16px",
        marginBottom: 14,
      }}
    >
      {pressing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: hasOdds ? 12 : 0,
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(230,57,70,0.14)",
            border: "1px solid rgba(230,57,70,0.4)",
          }}
        >
          <span
            className="zm-wp-pulse"
            style={{ width: 9, height: 9, borderRadius: "50%", background: "#e63946", display: "inline-block" }}
          />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
            {pressSide.name} aprieta — huele a gol
          </span>
        </div>
      )}

      {hasOdds && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              fontWeight: 700,
              color: DIM,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            <span>Probabilidad · mercado</span>
            <span style={{ color: GOLD2 }}>Favorito: {favorite}</span>
          </div>

          {/* Barra 1X2 */}
          <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.4)" }}>
            <div style={{ width: pct(h), background: home.color, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>{pct(h)}</span>
            </div>
            <div style={{ width: pct(d), background: "rgba(255,255,255,0.18)", minWidth: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#cfd8ea" }}>{pct(d)}</span>
            </div>
            <div style={{ width: pct(a), background: away.color, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>{pct(a)}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, fontWeight: 700 }}>
            <span style={{ color: home.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40%" }}>{home.name}</span>
            <span style={{ color: MID }}>Empate</span>
            <span style={{ color: away.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40%", textAlign: "right" }}>{away.name}</span>
          </div>
        </>
      )}
      <style>{`
        @keyframes zmWpPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.7); } }
        .zm-wp-pulse { animation: zmWpPulse 1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .zm-wp-pulse { animation: none; } }
      `}</style>
    </section>
  );
}
