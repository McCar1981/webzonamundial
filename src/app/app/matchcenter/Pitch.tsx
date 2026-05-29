"use client";

// Cancha de fútbol en SVG con motor de animación propio (requestAnimationFrame).
// El balón (dibujado como un balón real con pentágonos) fluye de forma CONTINUA
// por el campo. Cada jugador tiene MOVIMIENTO INDIVIDUAL (deambular propio +
// reacción al balón), así no se desplazan en bloque. Los eventos (gol, tarjeta,
// cambio) disparan efectos visuales con animaciones CSS (que arrancan al
// insertarse el elemento, a diferencia de SMIL que se mide contra el reloj del
// documento). En la segunda mitad los equipos cambian de lado (prop `flip`).

import { useEffect, useMemo, useRef, useState } from "react";
import { lastName } from "@/lib/match-center/names";
import type { MatchMeta, TeamLineup } from "@/lib/match-center/types";

const W = 1000;
const H = 640;
const PAD = 24;
const TRAIL = 6;
const BALL_R = 13;

function px(nx: number): number {
  return PAD + nx * (W - PAD * 2);
}
function py(ny: number): number {
  return PAD + ny * (H - PAD * 2);
}
function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}
// Pseudoaleatorio determinista 0..1 a partir de un índice (para parámetros de
// movimiento únicos por jugador, sin re-render).
function frac(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// --- Geometría del balón (pentágono central + costuras) ---
function pentPoints(r: number, rot = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = ((rot + i * 72) * Math.PI) / 180;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(" ");
}
const CENTRAL_PENT = pentPoints(5);
const OUTER_PENTS = Array.from({ length: 5 }).map((_, i) => {
  const a = ((-90 + 36 + i * 72) * Math.PI) / 180;
  const cx = Math.cos(a) * 9.5;
  const cy = Math.sin(a) * 9.5;
  return { cx, cy, rot: -90 + i * 72 + 36 };
});

interface PlayerNode {
  key: string;
  bx: number;
  by: number;
  num: number;
  label: string;
  color: string;
  gk: boolean;
  // Parámetros de movimiento individual.
  ph: number;
  perX: number;
  perY: number;
  ampX: number;
  ampY: number;
  react: number;
}

interface GoalPulse { side: "home" | "away"; key: number; player?: string }

interface PitchProps {
  meta: MatchMeta;
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  /** Posición objetivo del balón en coords normalizadas (home ataca hacia x=1). */
  ball: { x: number; y: number };
  /** Solo se usa para la sacudida de cámara al marcar (los FX van en overlay). */
  goalPulse?: GoalPulse | null;
  /** Probabilidad de que el juego fluya hacia la portería visitante. 0..1 */
  attackBias?: number;
  /** El balón deambula solo cuando está activo (sim corriendo / en vivo). */
  active?: boolean;
  /** Segunda mitad: los equipos cambian de lado. */
  flip?: boolean;
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
      <ellipse cx={0} cy={21} rx={14} ry={4.5} fill="rgba(0,0,0,0.30)" />
      <circle cx={0} cy={0} r={17} fill={node.color} stroke="#fff" strokeWidth={2.5} />
      {/* Relieve: sombra interior abajo + brillo arriba */}
      <circle cx={0} cy={0} r={17} fill="url(#chipShade)" />
      <ellipse cx={-5} cy={-6} rx={6.5} ry={4} fill="rgba(255,255,255,0.28)" />
      <text x={0} y={5} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" stroke="rgba(0,0,0,0.25)" strokeWidth={0.6} style={{ pointerEvents: "none" }}>
        {node.num}
      </text>
      {node.label && (
        <text
          x={0}
          y={35}
          textAnchor="middle"
          fontSize={11.5}
          fontWeight={700}
          fill="#fff"
          stroke="#0b1825"
          strokeWidth={2.8}
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
  active = true,
  flip = false,
}: PitchProps) {
  // fx mapea la coordenada x normalizada teniendo en cuenta el cambio de lado.
  const fx = (x: number) => (flip ? 1 - x : x);

  const players = useMemo<PlayerNode[]>(() => {
    const arr: PlayerNode[] = [];
    let idx = 0;
    const make = (key: string, sx: number, p: { x: number; y: number; num: number; name?: string; pos: string }, color: string): PlayerNode => {
      const k = idx++;
      const gk = p.pos === "GK";
      return {
        key,
        bx: px(sx),
        by: py(p.y),
        num: p.num,
        label: p.name ? lastName(p.name) : "",
        color,
        gk,
        ph: frac(k + 1.1) * Math.PI * 2,
        perX: 520 + frac(k + 2.7) * 760,
        perY: 540 + frac(k + 3.9) * 760,
        ampX: gk ? 4 : 6 + frac(k + 4.3) * 9,
        ampY: gk ? 5 : 6 + frac(k + 5.6) * 9,
        react: gk ? 0.05 : 0.1 + frac(k + 6.1) * 0.12,
      };
    };
    homeLineup.starters.forEach((p, i) =>
      arr.push(make(`h${i}`, flip ? 1 - p.x : p.x, p, meta.home.color)),
    );
    awayLineup.starters.forEach((p, i) =>
      arr.push(make(`a${i}`, flip ? p.x : 1 - p.x, p, meta.away.color)),
    );
    return arr;
  }, [homeLineup, awayLineup, meta.home.color, meta.away.color, flip]);

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
  const flipRef = useRef(flip);
  const activeRef = useRef(active);
  const playersRef = useRef(players);
  const history = useRef<{ x: number; y: number }[]>([]);
  const angle = useRef(0);

  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => { biasRef.current = attackBias; }, [attackBias]);
  useEffect(() => { flipRef.current = flip; }, [flip]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { playersRef.current = players; }, [players]);

  // Un evento fija el objetivo del balón y lo "ancla" un instante.
  useEffect(() => {
    target.current = { x: px(clamp(fx(ball.x), 0, 1)), y: py(clamp(ball.y, 0, 1)) };
    eventHold.current = performance.now() + 1500;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ball.x, ball.y, flip]);

  // Sacudida de cámara al marcar.
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
          const bias = flipRef.current ? 1 - biasRef.current : biasRef.current;
          const dir = Math.random() < bias ? 1 : -1;
          const nx = clamp(cx + dir * (0.1 + Math.random() * 0.24), 0.07, 0.93);
          const ny = clamp(cy + (Math.random() - 0.5) * 0.5, 0.1, 0.9);
          target.current = { x: px(nx), y: py(ny) };
        }
      }

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

      angle.current += sp * 5 + (activeRef.current ? 0.4 : 0);
      if (ballRef.current) {
        ballRef.current.setAttribute("transform", `translate(${bxp},${byp}) rotate(${angle.current})`);
      }

      history.current.unshift({ x: bxp, y: byp });
      if (history.current.length > TRAIL * 2 + 2) history.current.length = TRAIL * 2 + 2;
      for (let i = 0; i < TRAIL; i++) {
        const c = trailRefs.current[i];
        const p = history.current[(i + 1) * 2];
        if (c && p) {
          c.setAttribute("cx", String(p.x));
          c.setAttribute("cy", String(p.y));
          c.setAttribute("opacity", String(0.18 * (1 - i / TRAIL)));
        }
      }

      // Cada jugador: deambular individual (fase/frecuencia/amplitud propias) +
      // reacción al balón. Así nadie se mueve en bloque.
      const idleK = activeRef.current ? 1 : 0.3;
      const list = playersRef.current;
      for (let i = 0; i < list.length; i++) {
        const g = groupRefs.current[i];
        const pl = list[i];
        if (!g || !pl) continue;
        const maxS = pl.gk ? 26 : 74;
        const wx = Math.sin(now / pl.perX + pl.ph) * pl.ampX * idleK;
        const wy = Math.cos(now / pl.perY + pl.ph * 1.3) * pl.ampY * idleK;
        const ox = clamp((bxp - pl.bx) * pl.react + wx, -maxS, maxS);
        const oy = clamp((byp - pl.by) * pl.react + wy, -maxS, maxS);
        g.setAttribute("transform", `translate(${pl.bx + ox},${pl.by + oy})`);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

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
          <stop offset="0%" stopColor="#119247" />
          <stop offset="100%" stopColor="#0a5e30" />
        </linearGradient>
        <radialGradient id="light" cx="50%" cy="36%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vig" cx="50%" cy="44%" r="72%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="68%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.42" />
        </radialGradient>
        <radialGradient id="ballG" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f2f5f8" />
          <stop offset="100%" stopColor="#c3ccd4" />
        </radialGradient>
        <radialGradient id="chipShade" cx="50%" cy="64%" r="60%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
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
          fill={i % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)"}
        />
      ))}
      {/* Luz de estadio */}
      <rect x={0} y={0} width={W} height={H} fill="url(#light)" />

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

      {/* Viñeta (oscurece bordes, da profundidad) */}
      <rect x={0} y={0} width={W} height={H} fill="url(#vig)" style={{ pointerEvents: "none" }} />

      {/* Jugadores */}
      {players.map((node, i) => (
        <Player key={node.key} node={node} innerRef={(el) => { groupRefs.current[i] = el; }} />
      ))}

      {/* Estela del balón */}
      {Array.from({ length: TRAIL }).map((_, i) => (
        <circle key={`tr-${i}`} ref={(el) => { trailRefs.current[i] = el; }} r={6 - (i * 3) / TRAIL} fill="#fff" opacity={0} />
      ))}

      {/* Balón realista (pentágonos que rotan con el balón) */}
      <g ref={ballRef} transform={`translate(${px(0.5)},${py(0.5)})`} style={{ willChange: "transform" }}>
        <ellipse cx={0} cy={BALL_R + 4} rx={BALL_R - 1} ry={3.5} fill="rgba(0,0,0,0.32)" />
        <circle r={BALL_R + 5} fill="#fff" opacity={0.14} />
        <circle r={BALL_R} fill="url(#ballG)" stroke="#0b1825" strokeWidth={1.4} />
        {/* Costuras hacia los pentágonos exteriores */}
        <g stroke="#1a2733" strokeWidth={1} fill="none" opacity={0.85}>
          {OUTER_PENTS.map((o, i) => (
            <line key={`seam-${i}`} x1={0} y1={0} x2={o.cx} y2={o.cy} />
          ))}
        </g>
        {/* Pentágono central */}
        <polygon points={CENTRAL_PENT} fill="#10202c" />
        {/* Pentágonos exteriores (medios, recortados por el borde) */}
        {OUTER_PENTS.map((o, i) => (
          <polygon key={`op-${i}`} points={pentPoints(3.4, o.rot)} transform={`translate(${o.cx},${o.cy})`} fill="#10202c" opacity={0.92} />
        ))}
        {/* Brillo especular */}
        <ellipse cx={-4} cy={-5} rx={4} ry={2.6} fill="rgba(255,255,255,0.85)" />
      </g>
    </svg>
  );
}
