"use client";

// Cancha de fútbol en SVG con once de cada equipo y balón animado.
// Presentacional: el componente padre mueve el balón y dispara celebraciones.

import type { MatchMeta, TeamLineup } from "@/lib/match-center/types";

const W = 1000;
const H = 640;
const PAD = 24;

interface PitchProps {
  meta: MatchMeta;
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  ball: { x: number; y: number };
  goalPulse?: { side: "home" | "away"; key: number } | null;
}

function px(nx: number): number {
  return PAD + nx * (W - PAD * 2);
}
function py(ny: number): number {
  return PAD + ny * (H - PAD * 2);
}

function Player({
  nx,
  ny,
  num,
  color,
}: {
  nx: number;
  ny: number;
  num: number;
  color: string;
}) {
  return (
    <g style={{ transition: "transform .4s ease" }}>
      <circle cx={px(nx)} cy={py(ny)} r={17} fill={color} stroke="#fff" strokeWidth={2.5} />
      <text
        x={px(nx)}
        y={py(ny) + 5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={800}
        fill="#fff"
        style={{ pointerEvents: "none" }}
      >
        {num}
      </text>
    </g>
  );
}

export default function Pitch({ meta, homeLineup, awayLineup, ball, goalPulse }: PitchProps) {
  const bx = px(ball.x);
  const by = py(ball.y);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", borderRadius: 16 }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7a3e" />
          <stop offset="100%" stopColor="#0a5e30" />
        </linearGradient>
      </defs>

      {/* Césped + franjas */}
      <rect x={0} y={0} width={W} height={H} fill="url(#turf)" />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x={PAD + (i * (W - PAD * 2)) / 10}
          y={PAD}
          width={(W - PAD * 2) / 10}
          height={H - PAD * 2}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent"}
        />
      ))}

      {/* Líneas */}
      <g stroke="rgba(255,255,255,0.55)" strokeWidth={2} fill="none">
        <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} />
        <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} />
        <circle cx={W / 2} cy={H / 2} r={64} />
        <circle cx={W / 2} cy={H / 2} r={3} fill="rgba(255,255,255,0.55)" />
        {/* Áreas */}
        <rect x={PAD} y={H / 2 - 110} width={120} height={220} />
        <rect x={PAD} y={H / 2 - 50} width={48} height={100} />
        <rect x={W - PAD - 120} y={H / 2 - 110} width={120} height={220} />
        <rect x={W - PAD - 48} y={H / 2 - 50} width={48} height={100} />
        {/* Porterías */}
        <rect x={PAD - 10} y={H / 2 - 34} width={10} height={68} stroke="rgba(255,255,255,0.8)" />
        <rect x={W - PAD} y={H / 2 - 34} width={10} height={68} stroke="rgba(255,255,255,0.8)" />
      </g>

      {/* Jugadores local (ataca a la derecha) */}
      {homeLineup.starters.map((p, i) => (
        <Player key={`h-${i}`} nx={p.x} ny={p.y} num={p.num} color={meta.home.color} />
      ))}
      {/* Jugadores visitante (espejado) */}
      {awayLineup.starters.map((p, i) => (
        <Player key={`a-${i}`} nx={1 - p.x} ny={p.y} num={p.num} color={meta.away.color} />
      ))}

      {/* Celebración de gol */}
      {goalPulse && (
        <g key={goalPulse.key}>
          <circle
            cx={goalPulse.side === "home" ? W - PAD - 30 : PAD + 30}
            cy={H / 2}
            r={20}
            fill="none"
            stroke="#ffd34d"
            strokeWidth={4}
          >
            <animate attributeName="r" from="20" to="160" dur="0.9s" fill="freeze" />
            <animate attributeName="opacity" from="0.9" to="0" dur="0.9s" fill="freeze" />
          </circle>
        </g>
      )}

      {/* Balón */}
      <g style={{ transform: `translate(${bx}px,${by}px)`, transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}>
        <circle r={9} fill="#fff" stroke="#0b1825" strokeWidth={1.5} />
        <circle r={3.2} fill="#0b1825" />
      </g>
    </svg>
  );
}
