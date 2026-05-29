"use client";

// Cancha de fútbol en SVG con motor de animación propio (requestAnimationFrame).
// Incluye ESTADIO alrededor (gradas + focos), jugadores con CUERPO (camiseta +
// cabeza + sombra) y equipaciones con el COLOR de cada selección (con contraste
// automático cuando ambos equipos visten parecido). El balón fluye de forma
// continua y cada jugador tiene movimiento individual. Los FX de gol/tarjeta/
// cambio viven en un overlay HTML aparte (MatchFx). En la segunda mitad los
// equipos cambian de lado (prop `flip`).

import { useEffect, useMemo, useRef, useState } from "react";
import { lastName } from "@/lib/match-center/names";
import type { MatchMeta, TeamLineup } from "@/lib/match-center/types";

const W = 1000;
const H = 660;
const STAND = 64;      // grosor de las gradas alrededor del campo
const PAD = STAND;     // el campo arranca tras las gradas
const TRAIL = 6;
const BALL_R = 12;

function px(nx: number): number {
  return PAD + nx * (W - PAD * 2);
}
function py(ny: number): number {
  return PAD + ny * (H - PAD * 2);
}
function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}
function frac(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// --- Color / equipaciones ---
function rgbOf(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lumOf(hex: string): number {
  const [r, g, b] = rgbOf(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function distOf(a: string, b: string): number {
  const A = rgbOf(a), B = rgbOf(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}
function toHex(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
}
function mixHex(hex: string, t: [number, number, number], f: number): string {
  const c = rgbOf(hex);
  const m = (x: number, y: number) => Math.round(x + (y - x) * f);
  return `#${toHex(m(c[0], t[0]))}${toHex(m(c[1], t[1]))}${toHex(m(c[2], t[2]))}`;
}
const WHITE: [number, number, number] = [255, 255, 255];
interface Kit { fill: string; txt: string; line: string }
function buildKits(homeColor: string, awayColor: string): { home: Kit; away: Kit } {
  // Aclara colores muy oscuros para que se vean sobre el césped.
  let h = lumOf(homeColor) < 0.2 ? mixHex(homeColor, WHITE, 0.24) : homeColor;
  let a = lumOf(awayColor) < 0.2 ? mixHex(awayColor, WHITE, 0.24) : awayColor;
  // Si ambos equipos visten parecido, el visitante usa equipación alterna.
  if (distOf(h, a) < 80) a = lumOf(h) < 0.55 ? "#f4f4f4" : "#16335c";
  const kit = (fill: string): Kit => ({
    fill,
    txt: lumOf(fill) > 0.62 ? "#10202c" : "#ffffff",
    line: lumOf(fill) > 0.62 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)",
  });
  return { home: kit(h), away: kit(a) };
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

// Silueta de camiseta (mangas + cuello), centrada en (0,0), bajo a y≈18.
const SHIRT = "M-12,-7 L-6,-10.5 L-3,-8 Q0,-6 3,-8 L6,-10.5 L12,-7 L9.5,-1.5 L9,17 Q0,20 -9,17 L-9.5,-1.5 Z";

interface PlayerNode {
  key: string;
  bx: number;
  by: number;
  num: number;
  label: string;
  kit: Kit;
  gk: boolean;
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
  const { kit } = node;
  return (
    <g ref={innerRef} transform={`translate(${node.bx},${node.by})`} style={{ willChange: "transform" }}>
      {/* Sombra en el suelo */}
      <ellipse cx={2} cy={20} rx={13} ry={4} fill="rgba(0,0,0,0.32)" />
      {/* Cabeza */}
      <circle cx={0} cy={-14} r={5.6} fill="#e8c8a6" stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      {/* Camiseta (color de la selección) */}
      <path d={SHIRT} fill={kit.fill} stroke="#0b1825" strokeWidth={1.3} />
      {/* Relieve de la camiseta */}
      <path d={SHIRT} fill="url(#kitShade)" />
      {/* Dorsal */}
      <text x={0} y={7} textAnchor="middle" fontSize={12.5} fontWeight={900} fill={kit.txt} style={{ pointerEvents: "none" }}>
        {node.num}
      </text>
      {/* Nombre */}
      {node.label && (
        <text
          x={0}
          y={32}
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

  const kits = useMemo(() => buildKits(meta.home.color, meta.away.color), [meta.home.color, meta.away.color]);

  const players = useMemo<PlayerNode[]>(() => {
    const arr: PlayerNode[] = [];
    let idx = 0;
    const make = (key: string, sx: number, p: { x: number; y: number; num: number; name?: string; pos: string }, kit: Kit): PlayerNode => {
      const k = idx++;
      const gk = p.pos === "GK";
      return {
        key,
        bx: px(sx),
        by: py(p.y),
        num: p.num,
        label: p.name ? lastName(p.name) : "",
        kit,
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
      arr.push(make(`h${i}`, flip ? 1 - p.x : p.x, p, kits.home)),
    );
    awayLineup.starters.forEach((p, i) =>
      arr.push(make(`a${i}`, flip ? p.x : 1 - p.x, p, kits.away)),
    );
    return arr;
  }, [homeLineup, awayLineup, kits, flip]);

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

      // Cada jugador: deambular individual + reacción al balón (sin bloque).
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

  const FW = W - PAD * 2; // ancho del campo
  const FH = H - PAD * 2; // alto del campo
  // Postes de luz en las 4 esquinas del estadio.
  const lights = [
    { x: STAND / 2, y: STAND / 2 },
    { x: W - STAND / 2, y: STAND / 2 },
    { x: STAND / 2, y: H - STAND / 2 },
    { x: W - STAND / 2, y: H - STAND / 2 },
  ];

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
          <stop offset="0%" stopColor="#139a4b" />
          <stop offset="100%" stopColor="#0a5e30" />
        </linearGradient>
        <radialGradient id="light" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vig" cx="50%" cy="44%" r="72%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="66%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </radialGradient>
        <radialGradient id="flood" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#fff7d6" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#fff7d6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ballG" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f2f5f8" />
          <stop offset="100%" stopColor="#c3ccd4" />
        </radialGradient>
        <linearGradient id="kitShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <pattern id="seats" width="12" height="9" patternUnits="userSpaceOnUse">
          <rect width="12" height="9" fill="#11161f" />
          <circle cx="3" cy="3" r="1.3" fill="#1d2733" />
          <circle cx="9" cy="7" r="1.3" fill="#1d2733" />
        </pattern>
      </defs>

      {/* Estadio: base oscura */}
      <rect x={0} y={0} width={W} height={H} fill="#0a0e15" />

      {/* Gradas (anillo entre el borde y el campo) con textura de asientos */}
      <path
        d={`M0 0 H${W} V${H} H0 Z M${PAD} ${PAD} V${H - PAD} H${W - PAD} V${PAD} Z`}
        fillRule="evenodd"
        fill="url(#seats)"
      />
      {/* Muro perimetral del campo */}
      <rect x={PAD - 8} y={PAD - 8} width={FW + 16} height={FH + 16} rx={6} fill="#0c1118" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />

      {/* Focos de las esquinas */}
      {lights.map((l, i) => (
        <g key={`fl-${i}`}>
          <circle cx={l.x} cy={l.y} r={120} fill="url(#flood)" />
          <rect x={l.x - 12} y={l.y - 7} width={24} height={14} rx={3} fill="#1a2230" stroke="rgba(255,255,255,0.15)" />
          {[-7, 0, 7].map((o) => (
            <circle key={o} cx={l.x + o} cy={l.y} r={2.4} fill="#fff7d6" />
          ))}
        </g>
      ))}

      {/* Césped + franjas de corte */}
      <rect x={PAD} y={PAD} width={FW} height={FH} rx={8} fill="url(#turf)" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x={PAD + (i * FW) / 12}
          y={PAD}
          width={FW / 12}
          height={FH}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}
        />
      ))}
      {/* Luz de estadio sobre el césped */}
      <rect x={PAD} y={PAD} width={FW} height={FH} fill="url(#light)" />

      {/* Líneas */}
      <g stroke="rgba(255,255,255,0.6)" strokeWidth={2} fill="none">
        <rect x={PAD} y={PAD} width={FW} height={FH} />
        <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} />
        <circle cx={W / 2} cy={H / 2} r={64} />
        <circle cx={W / 2} cy={H / 2} r={3} fill="rgba(255,255,255,0.6)" />
        <rect x={PAD} y={H / 2 - 96} width={110} height={192} />
        <rect x={PAD} y={H / 2 - 46} width={44} height={92} />
        <rect x={W - PAD - 110} y={H / 2 - 96} width={110} height={192} />
        <rect x={W - PAD - 44} y={H / 2 - 46} width={44} height={92} />
        <rect x={PAD - 10} y={H / 2 - 30} width={10} height={60} stroke="rgba(255,255,255,0.85)" />
        <rect x={W - PAD} y={H / 2 - 30} width={10} height={60} stroke="rgba(255,255,255,0.85)" />
      </g>

      {/* Viñeta sobre el campo (profundidad) */}
      <rect x={PAD} y={PAD} width={FW} height={FH} fill="url(#vig)" style={{ pointerEvents: "none" }} />

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
        <g stroke="#1a2733" strokeWidth={1} fill="none" opacity={0.85}>
          {OUTER_PENTS.map((o, i) => (
            <line key={`seam-${i}`} x1={0} y1={0} x2={o.cx} y2={o.cy} />
          ))}
        </g>
        <polygon points={CENTRAL_PENT} fill="#10202c" />
        {OUTER_PENTS.map((o, i) => (
          <polygon key={`op-${i}`} points={pentPoints(3.4, o.rot)} transform={`translate(${o.cx},${o.cy})`} fill="#10202c" opacity={0.92} />
        ))}
        <ellipse cx={-4} cy={-5} rx={4} ry={2.6} fill="rgba(255,255,255,0.85)" />
      </g>
    </svg>
  );
}
