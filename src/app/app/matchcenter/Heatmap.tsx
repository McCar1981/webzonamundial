"use client";

// Mapa de calor del partido: rejilla fina sobre la cancha que se tiñe según la
// INTENSIDAD de juego en cada zona (escala azul→verde→amarillo→rojo, como un
// heatmap profesional). Cada evento con coordenadas aporta calor a su celda y a
// las vecinas (difusión gaussiana), y un fondo de actividad derivado de la
// posesión evita que se vea vacío al inicio. Un filtro de desenfoque suaviza
// las celdas en manchas continuas.

import { useMemo } from "react";
import type { MatchEvent, MatchMeta } from "@/lib/match-center/types";

const GX = 18;
const GY = 11;
const W = 1000;
const H = 420;
const PAD = 16;

// Peso de calor por tipo de evento.
const HEAT: Record<string, number> = {
  goal: 5, penalty_goal: 5, chance: 3, shot_on: 2.6, shot: 1.8,
  save: 2.2, corner: 1.6, offside: 1.2, yellow: 1, red: 1.4, sub: 0.4,
};

// Escala de color tipo heatmap. t en 0..1.
function heatColor(t: number): string {
  const stops: [number, [number, number, number]][] = [
    [0.0, [12, 94, 48]],     // verde césped (base, casi sin calor)
    [0.25, [56, 132, 220]],  // azul
    [0.5, [46, 204, 113]],   // verde
    [0.72, [241, 196, 15]],  // amarillo
    [0.88, [230, 126, 34]],  // naranja
    [1.0, [231, 76, 60]],    // rojo
  ];
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (x - t0) / (t1 - t0 || 1);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
      return `rgb(${r},${g},${b})`;
    }
  }
  return "rgb(231,76,60)";
}

export default function Heatmap({ log, meta }: { log: MatchEvent[]; meta: MatchMeta }) {
  const heat = useMemo(() => {
    const grid = new Float32Array(GX * GY);
    const add = (gx: number, gy: number, v: number) => {
      if (gx < 0 || gx >= GX || gy < 0 || gy >= GY) return;
      grid[gy * GX + gx] += v;
    };
    // Fondo de actividad: un poco de calor difuso en el centro del campo.
    for (let gy = 0; gy < GY; gy++) {
      for (let gx = 0; gx < GX; gx++) {
        const dxc = (gx - GX / 2) / GX;
        const dyc = (gy - GY / 2) / GY;
        grid[gy * GX + gx] += 0.6 * Math.exp(-(dxc * dxc * 8 + dyc * dyc * 10));
      }
    }
    // Eventos con difusión gaussiana 3x3.
    for (const e of log) {
      if (typeof e.x !== "number" || typeof e.y !== "number" || e.side === "neutral") continue;
      const w = HEAT[e.type] ?? 0.8;
      const cx = e.x * (GX - 1);
      const cy = e.y * (GY - 1);
      const bx = Math.round(cx);
      const by = Math.round(cy);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const dist2 = ox * ox + oy * oy;
          add(bx + ox, by + oy, w * Math.exp(-dist2 * 0.7));
        }
      }
    }
    let max = 0;
    for (let i = 0; i < grid.length; i++) max = Math.max(max, grid[i]);
    return { grid, max: max || 1 };
  }, [log]);

  const cw = (W - PAD * 2) / GX;
  const ch = (H - PAD * 2) / GY;

  return (
    <div style={{ background: "#0F1D32", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: "#8a94b0", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
          Mapa de calor · intensidad de juego
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#8a94b0" }}>
          <span>Menos</span>
          <span style={{ width: 90, height: 8, borderRadius: 4, display: "inline-block", background: "linear-gradient(90deg,#3884dc,#2ecc71,#f1c40f,#e67e22,#e74c3c)" }} />
          <span>Más</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", borderRadius: 12 }}>
        <defs>
          <filter id="heatBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="#0c5e30" />

        {/* Manchas de calor (desenfocadas) */}
        <g filter="url(#heatBlur)">
          {Array.from(heat.grid).map((v, i) => {
            const t = v / heat.max;
            if (t < 0.04) return null;
            const gx = i % GX;
            const gy = Math.floor(i / GX);
            return (
              <rect
                key={i}
                x={PAD + gx * cw}
                y={PAD + gy * ch}
                width={cw + 1}
                height={ch + 1}
                fill={heatColor(t)}
                opacity={0.28 + t * 0.62}
                style={{ transition: "opacity .6s ease, fill .6s ease" }}
              />
            );
          })}
        </g>

        {/* Líneas de la cancha */}
        <g stroke="rgba(255,255,255,0.45)" strokeWidth={2} fill="none">
          <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} rx={6} />
          <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} />
          <circle cx={W / 2} cy={H / 2} r={46} />
          <rect x={PAD} y={H / 2 - 70} width={70} height={140} />
          <rect x={W - PAD - 70} y={H / 2 - 70} width={70} height={140} />
        </g>

        <text x={PAD + 10} y={H - PAD - 10} fontSize={14} fontWeight={800} fill="rgba(255,255,255,0.65)">
          ◀ {meta.home.name}
        </text>
        <text x={W - PAD - 10} y={H - PAD - 10} fontSize={14} fontWeight={800} fill="rgba(255,255,255,0.65)" textAnchor="end">
          {meta.away.name} ▶
        </text>
      </svg>
    </div>
  );
}
