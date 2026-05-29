"use client";

// Mini-mapa de calor: rejilla sobre la cancha que se tiñe según dónde se ha
// jugado el partido. Cada evento con coordenadas suma "calor" a su celda,
// atribuido al equipo que lo generó. Da una lectura visual de territorio y
// dominio, complementaria al % de posesión.

import { useMemo } from "react";
import type { MatchEvent, MatchMeta } from "@/lib/match-center/types";

const GX = 8; // columnas
const GY = 5; // filas
const W = 1000;
const H = 360;
const PAD = 14;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Cell {
  home: number;
  away: number;
}

export default function Heatmap({ log, meta }: { log: MatchEvent[]; meta: MatchMeta }) {
  const { cells, max } = useMemo(() => {
    const grid: Cell[] = Array.from({ length: GX * GY }, () => ({ home: 0, away: 0 }));
    for (const e of log) {
      if (typeof e.x !== "number" || typeof e.y !== "number") continue;
      if (e.side === "neutral") continue;
      const cx = Math.min(GX - 1, Math.max(0, Math.floor(e.x * GX)));
      const cy = Math.min(GY - 1, Math.max(0, Math.floor(e.y * GY)));
      const idx = cy * GX + cx;
      // Difusión suave a la celda y vecinas inmediatas.
      const weight = e.type === "goal" || e.type === "penalty_goal" ? 3 : 1;
      grid[idx][e.side] += weight;
      if (cx > 0) grid[idx - 1][e.side] += weight * 0.4;
      if (cx < GX - 1) grid[idx + 1][e.side] += weight * 0.4;
    }
    let m = 0;
    for (const c of grid) m = Math.max(m, c.home + c.away);
    return { cells: grid, max: m || 1 };
  }, [log]);

  const homeRgb = hexToRgb(meta.home.color);
  const awayRgb = hexToRgb(meta.away.color);
  const cw = (W - PAD * 2) / GX;
  const ch = (H - PAD * 2) / GY;

  return (
    <div style={{ background: "#0F1D32", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: "#8a94b0", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
          Mapa de calor · territorio
        </h3>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#8a94b0" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: meta.home.color, display: "inline-block" }} /> {meta.home.name}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: meta.away.color, display: "inline-block" }} /> {meta.away.name}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", borderRadius: 12 }}>
        <rect x={0} y={0} width={W} height={H} fill="#0a5e30" />
        {cells.map((c, i) => {
          const cx = i % GX;
          const cy = Math.floor(i / GX);
          const total = c.home + c.away;
          const intensity = Math.min(1, total / max);
          const dom = c.home >= c.away ? homeRgb : awayRgb;
          const op = intensity * 0.82;
          return (
            <rect
              key={i}
              x={PAD + cx * cw}
              y={PAD + cy * ch}
              width={cw - 2}
              height={ch - 2}
              rx={6}
              fill={`rgb(${dom[0]},${dom[1]},${dom[2]})`}
              opacity={op}
              style={{ transition: "opacity .6s ease, fill .6s ease" }}
            />
          );
        })}
        {/* Líneas guía */}
        <g stroke="rgba(255,255,255,0.35)" strokeWidth={2} fill="none">
          <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} rx={6} />
          <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} />
          <circle cx={W / 2} cy={H / 2} r={40} />
        </g>
        <text x={PAD + 8} y={H - PAD - 8} fontSize={13} fontWeight={800} fill="rgba(255,255,255,0.5)">
          ◀ {meta.home.name}
        </text>
        <text x={W - PAD - 8} y={H - PAD - 8} fontSize={13} fontWeight={800} fill="rgba(255,255,255,0.5)" textAnchor="end">
          {meta.away.name} ▶
        </text>
      </svg>
    </div>
  );
}
