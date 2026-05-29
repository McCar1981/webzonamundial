"use client";

// Cancha de fútbol en SVG con motor de animación propio (requestAnimationFrame).
// El balón fluye de forma CONTINUA por el campo (como un partido real), los
// jugadores se desplazan en bloque siguiendo la pelota y los eventos (gol,
// tarjeta, cambio) disparan efectos visuales. Presentacional: el padre solo
// envía la posición objetivo del balón en cada evento y los disparadores de FX.

import { useEffect, useMemo, useRef, useState } from "react";
import { lastName } from "@/lib/match-center/names";
import type { MatchMeta, TeamLineup } from "@/lib/match-center/types";

const W = 1000;
const H = 640;
const PAD = 24;
const TRAIL = 6;

function px(nx: number): number {
  return PAD + nx * (W - PAD * 2);
}
function py(ny: number): number {
  return PAD + ny * (H - PAD * 2);
}
function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

interface PlayerNode {
  key: string;
  bx: number;
  by: number;
  num: number;
  label: string;
  color: string;
  gk: boolean;
}

interface PitchProps {
  meta: MatchMeta;
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  /** Posición objetivo del balón en coords normalizadas (la marca cada evento). */
  ball: { x: number; y: number };
  goalPulse?: { side: "home" | "away"; key: number } | null;
  /** Probabilidad de que el juego fluya hacia la derecha (portería visitante). 0..1 */
  attackBias?: number;
  subFx?: { side: "home" | "away"; key: number } | null;
  cardFx?: { side: "home" | "away"; color: string; key: number } | null;
  /** El balón deambula solo cuando está activo (sim corriendo / en vivo). */
  active?: boolean;
}

function Player({
  node,
  innerRef,
}: {
  node: PlayerNode;
  innerRef: (el: SVGGElement | null) => void;
}) {
  return (
    <g ref={innerRef} transform={`translate(${node.bx},${node.by})`} style={{ willChange: "transform" }}>
      <ellipse cx={0} cy={20} rx={13} ry={4} fill="rgba(0,0,0,0.28)" />
      <circle cx={0} cy={0} r={17} fill={node.color} stroke="#fff" strokeWidth={2.5} />
      <text
        x={0}
        y={5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={800}
        fill="#fff"
        style={{ pointerEvents: "none" }}
      >
        {node.num}
      </text>
      {node.label && (
        <text
          x={0}
          y={34}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="#fff"
          stroke="#0b1825"
          strokeWidth={2.6}
          paintOrder="stroke"
          style={{ pointerEvents: "none" }}
        >
          {node.label}
        </text>
      )}
    </g>
  );
}

export default function Pitch({
  meta,
  homeLineup,
  awayLineup,
  ball,
  goalPulse,
  attackBias = 0.5,
  subFx,
  cardFx,
  active = true,
}: PitchProps) {
  const players = useMemo<PlayerNode[]>(() => {
    const arr: PlayerNode[] = [];
    homeLineup.starters.forEach((p, i) =>
      arr.push({ key: `h${i}`, bx: px(p.x), by: py(p.y), num: p.num, label: p.name ? lastName(p.name) : "", color: meta.home.color, gk: p.pos === "GK" }),
    );
    awayLineup.starters.forEach((p, i) =>
      arr.push({ key: `a${i}`, bx: px(1 - p.x), by: py(p.y), num: p.num, label: p.name ? lastName(p.name) : "", color: meta.away.color, gk: p.pos === "GK" }),
    );
    return arr;
  }, [homeLineup, awayLineup, meta.home.color, meta.away.color]);

  // Refs de animación
  const ballRef = useRef<SVGGElement | null>(null);
  const trailRefs = useRef<(SVGCircleElement | null)[]>([]);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);

  const ballPos = useRef({ x: px(0.5), y: py(0.5) });
  const target = useRef({ x: px(0.5), y: py(0.5) });
  const eventHold = useRef(0);
  const roamAcc = useRef(0);
  const roamInt = useRef(1);
  const biasRef = useRef(attackBias);
  const activeRef = useRef(active);
  const playersRef = useRef(players);
  const history = useRef<{ x: number; y: number }[]>([]);
  const angle = useRef(0);

  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => { biasRef.current = attackBias; }, [attackBias]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { playersRef.current = players; }, [players]);

  // Un evento fija el objetivo del balón y lo "ancla" un instante.
  useEffect(() => {
    target.current = { x: px(clamp(ball.x, 0, 1)), y: py(clamp(ball.y, 0, 1)) };
    eventHold.current = performance.now() + 1500;
  }, [ball.x, ball.y]);

  // Sacudida de cámara al marcar (se limpia para poder reiniciar la animación).
  useEffect(() => {
    if (!goalPulse) return;
    setShakeKey(goalPulse.key);
    const t = setTimeout(() => setShakeKey(0), 600);
    return () => clearTimeout(t);
  }, [goalPulse]);

  // Motor de animación.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const anchored = now < eventHold.current;

      if (activeRef.current && !anchored) {
        roamAcc.current += dt;
        if (roamAcc.current >= roamInt.current) {
          roamAcc.current = 0;
          roamInt.current = 0.55 + Math.random() * 0.8;
          const cx = (ballPos.current.x - PAD) / (W - PAD * 2);
          const cy = (ballPos.current.y - PAD) / (H - PAD * 2);
          const dir = Math.random() < biasRef.current ? 1 : -1;
          const nx = clamp(cx + dir * (0.1 + Math.random() * 0.24), 0.07, 0.93);
          const ny = clamp(cy + (Math.random() - 0.5) * 0.5, 0.1, 0.9);
          target.current = { x: px(nx), y: py(ny) };
        }
      }

      // Suavizado hacia el objetivo (más rápido si viene de un evento).
      const k = Math.min(1, dt * (anchored ? 7 : 3.4));
      const prevX = ballPos.current.x;
      const prevY = ballPos.current.y;
      ballPos.current.x += (target.current.x - prevX) * k;
      ballPos.current.y += (target.current.y - prevY) * k;

      const dx = ballPos.current.x - prevX;
      const dy = ballPos.current.y - prevY;
      const sp = Math.hypot(dx, dy);
      const wob = activeRef.current ? Math.sin(now / 150) * Math.min(2, sp * 0.4 + 0.4) : 0;
      const bxp = ballPos.current.x;
      const byp = ballPos.current.y + wob;

      angle.current += sp * 6;
      if (ballRef.current) {
        ballRef.current.setAttribute("transform", `translate(${bxp},${byp}) rotate(${angle.current})`);
      }

      // Estela.
      history.current.unshift({ x: bxp, y: byp });
      if (history.current.length > TRAIL * 2 + 2) history.current.length = TRAIL * 2 + 2;
      for (let i = 0; i < TRAIL; i++) {
        const c = trailRefs.current[i];
        const p = history.current[(i + 1) * 2];
        if (c && p) {
          c.setAttribute("cx", String(p.x));
          c.setAttribute("cy", String(p.y));
          c.setAttribute("opacity", String(0.22 * (1 - i / TRAIL)));
        }
      }

      // Jugadores se desplazan en bloque hacia el balón.
      const list = playersRef.current;
      for (let i = 0; i < list.length; i++) {
        const g = groupRefs.current[i];
        const pl = list[i];
        if (!g || !pl) continue;
        const kp = pl.gk ? 0.05 : 0.15;
        const maxS = pl.gk ? 24 : 70;
        const ox = clamp((bxp - pl.bx) * kp, -maxS, maxS);
        const oy = clamp((byp - pl.by) * kp, -maxS, maxS);
        g.setAttribute("transform", `translate(${pl.bx + ox},${pl.by + oy})`);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Confeti de gol (SMIL, se reinicia con la key).
  const confetti = useMemo(() => {
    if (!goalPulse) return [];
    const cx = goalPulse.side === "home" ? W - PAD - 50 : PAD + 50;
    const cy = H / 2;
    const palette = ["#ffd34d", "#ffffff", meta.home.color, meta.away.color, "#22c55e", "#ff5a8a"];
    return Array.from({ length: 34 }).map((_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 260;
      return {
        id: i,
        cx,
        cy,
        ex: Math.cos(ang) * dist,
        ey: Math.sin(ang) * dist + 70,
        color: palette[i % palette.length],
        dur: 0.9 + Math.random() * 0.7,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
      };
    });
  }, [goalPulse, meta.home.color, meta.away.color]);

  const cardPos = cardFx ? (cardFx.side === "home" ? W * 0.36 : W * 0.64) : 0;
  const goalX = goalPulse ? (goalPulse.side === "home" ? W - PAD - 30 : PAD + 30) : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", borderRadius: 16, willChange: "transform" }}
      preserveAspectRatio="xMidYMid meet"
      className={shakeKey ? "mc-shake" : undefined}
    >
      <style>{`
        @keyframes mcShakeKf{0%,100%{transform:translate(0,0)}15%{transform:translate(-6px,3px)}30%{transform:translate(6px,-3px)}45%{transform:translate(-5px,-2px)}60%{transform:translate(4px,3px)}75%{transform:translate(-3px,2px)}}
        .mc-shake{animation:mcShakeKf .55s ease}
      `}</style>
      <defs>
        <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7a3e" />
          <stop offset="100%" stopColor="#0a5e30" />
        </linearGradient>
        <radialGradient id="ballG" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfd6dd" />
        </radialGradient>
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
        <rect x={PAD} y={H / 2 - 110} width={120} height={220} />
        <rect x={PAD} y={H / 2 - 50} width={48} height={100} />
        <rect x={W - PAD - 120} y={H / 2 - 110} width={120} height={220} />
        <rect x={W - PAD - 48} y={H / 2 - 50} width={48} height={100} />
        <rect x={PAD - 10} y={H / 2 - 34} width={10} height={68} stroke="rgba(255,255,255,0.8)" />
        <rect x={W - PAD} y={H / 2 - 34} width={10} height={68} stroke="rgba(255,255,255,0.8)" />
      </g>

      {/* Jugadores */}
      {players.map((node, i) => (
        <Player
          key={node.key}
          node={node}
          innerRef={(el) => {
            groupRefs.current[i] = el;
          }}
        />
      ))}

      {/* Estela del balón */}
      {Array.from({ length: TRAIL }).map((_, i) => (
        <circle
          key={`tr-${i}`}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          r={7 - (i * 4) / TRAIL}
          fill="#fff"
          opacity={0}
        />
      ))}

      {/* Celebración de gol: anillos + flash + confeti */}
      {goalPulse && (
        <g key={`gp-${goalPulse.key}`}>
          <rect x={0} y={0} width={W} height={H} fill="#ffd34d" opacity={0}>
            <animate attributeName="opacity" values="0.45;0" dur="0.5s" fill="freeze" />
          </rect>
          {[0, 0.12].map((d, k) => (
            <circle key={k} cx={goalX} cy={H / 2} r={20} fill="none" stroke="#ffd34d" strokeWidth={4} opacity={0.9}>
              <animate attributeName="r" from="20" to="200" dur="0.9s" begin={`${d}s`} fill="freeze" />
              <animate attributeName="opacity" from="0.9" to="0" dur="0.9s" begin={`${d}s`} fill="freeze" />
            </circle>
          ))}
          {confetti.map((c) => (
            <rect key={c.id} x={c.cx} y={c.cy} width={c.w} height={c.h} fill={c.color} rx={1}>
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to={`${c.ex} ${c.ey}`}
                dur={`${c.dur}s`}
                fill="freeze"
              />
              <animate attributeName="opacity" values="1;1;0" dur={`${c.dur}s`} fill="freeze" />
            </rect>
          ))}
        </g>
      )}

      {/* Tarjeta */}
      {cardFx && (
        <g key={`cf-${cardFx.key}`} transform={`translate(${cardPos},${H / 2 - 60})`}>
          <rect x={-16} y={-22} width={32} height={46} rx={4} fill={cardFx.color} stroke="#000" strokeWidth={1.5}>
            <animateTransform attributeName="transform" type="scale" values="0.2;1.15;1" dur="0.4s" fill="freeze" />
            <animate attributeName="opacity" values="1;1;0" dur="1.4s" fill="freeze" />
          </rect>
        </g>
      )}

      {/* Cambio de jugadores */}
      {subFx && (
        <g key={`sf-${subFx.key}`} transform={`translate(${W / 2},${H - 56})`}>
          <g>
            <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" fill="freeze" />
            <rect x={-58} y={-22} width={116} height={40} rx={10} fill="#0b1825" stroke="#c9a84c" strokeWidth={1.5} />
            <text x={-26} y={5} textAnchor="middle" fontSize={22} fontWeight={900} fill="#22c55e">▲</text>
            <text x={-44} y={6} textAnchor="middle" fontSize={13} fontWeight={800} fill="#e8d48b">⇄</text>
            <text x={26} y={5} textAnchor="middle" fontSize={22} fontWeight={900} fill="#ef4444">▼</text>
            <text x={6} y={6} textAnchor="middle" fontSize={11} fontWeight={800} fill="#8a94b0">CAMBIO</text>
          </g>
        </g>
      )}

      {/* Balón */}
      <g ref={ballRef} transform={`translate(${px(0.5)},${py(0.5)})`} style={{ willChange: "transform" }}>
        <ellipse cx={0} cy={16} rx={11} ry={3.5} fill="rgba(0,0,0,0.3)" />
        <circle r={12} fill="url(#ballG)" stroke="#0b1825" strokeWidth={1.5} />
        <circle r={4} fill="#0b1825" />
        <circle r={12} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1} opacity={0.5} />
      </g>
    </svg>
  );
}
