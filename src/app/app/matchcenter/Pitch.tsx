"use client";

// Cancha de fútbol en SVG con motor de animación propio (requestAnimationFrame),
// con calidad "broadcast":
//  - ESTADIO alrededor (gradas con público que REACCIONA al momentum y a los goles,
//    focos, muro perimetral).
//  - CLIMA y HORA por sede (día / atardecer / noche con focos encendidos; lluvia).
//  - CÁMARA dinámica que panea suavemente hacia el balón y hace punch-zoom al gol.
//  - JUGADORES con cuerpo (camiseta + cabeza + piernas con micro-carrera + sombra),
//    portero con equipación distinta, dorsal y color de cada selección.
//  - ANILLO de posesión bajo el jugador con balón + LÍNEAS DE PASE a sus compañeros.
//  - TRAYECTORIA curva del balón en disparos (se eleva, la sombra se separa) y RED
//    de la portería que se sacude al marcar.
//  - HEATMAP superpuesto sobre el campo (toggle).
//  - Modo TÁCTICO (resalta líneas de pase) y cambio de lado en la 2ª mitad (flip).
// Los FX de gol/tarjeta/cambio viven en un overlay HTML aparte (MatchFx).

import { useEffect, useMemo, useRef, useState } from "react";
import { lastName } from "@/lib/match-center/names";
import type { MatchEvent, MatchMeta, TeamLineup } from "@/lib/match-center/types";

const W = 1000;
const H = 660;
const STAND = 64; // grosor de las gradas alrededor del campo
const PAD = STAND; // el campo arranca tras las gradas
const TRAIL = 6;
const BALL_R = 12;
const FW = W - PAD * 2;
const FH = H - PAD * 2;

function px(nx: number): number {
  return PAD + nx * FW;
}
function py(ny: number): number {
  return PAD + ny * FH;
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
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}
function mixHex(hex: string, t: [number, number, number], f: number): string {
  const c = rgbOf(hex);
  const m = (x: number, y: number) => Math.round(x + (y - x) * f);
  return `#${toHex(m(c[0], t[0]))}${toHex(m(c[1], t[1]))}${toHex(m(c[2], t[2]))}`;
}
const WHITE: [number, number, number] = [255, 255, 255];
interface Kit { fill: string; txt: string; line: string }
function kitFrom(fill: string): Kit {
  return {
    fill,
    txt: lumOf(fill) > 0.62 ? "#0a0906" : "#ffffff",
    line: lumOf(fill) > 0.62 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)",
  };
}
function buildKits(homeColor: string, awayColor: string): { home: Kit; away: Kit; gkHome: Kit; gkAway: Kit } {
  // Aclara colores muy oscuros para que se vean sobre el césped.
  const h = lumOf(homeColor) < 0.2 ? mixHex(homeColor, WHITE, 0.24) : homeColor;
  let a = lumOf(awayColor) < 0.2 ? mixHex(awayColor, WHITE, 0.24) : awayColor;
  // Si ambos equipos visten parecido, el visitante usa equipación alterna.
  if (distOf(h, a) < 80) a = lumOf(h) < 0.55 ? "#f4f4f4" : "#16335c";
  // Porteros con colores de alta visibilidad, distintos entre sí y de los equipos.
  return { home: kitFrom(h), away: kitFrom(a), gkHome: kitFrom("#15e0b0"), gkAway: kitFrom("#ff8a3c") };
}

// --- Clima / hora por sede (determinista a partir de la meta) ---
type TimeOfDay = "day" | "dusk" | "night";
interface Weather { tod: TimeOfDay; rain: boolean }
function venueWeather(meta: MatchMeta): Weather {
  const seed = meta.id * 1.7 + meta.city.length * 3.1 + meta.venue.length;
  const t = frac(seed);
  const tod: TimeOfDay = t < 0.42 ? "day" : t < 0.7 ? "dusk" : "night";
  const rain = frac(seed * 2.3 + 5) > 0.8;
  return { tod, rain };
}

// --- Heatmap (rejilla coarse superpuesta) ---
const HX = 14;
const HY = 9;
const HEAT_W: Record<string, number> = {
  goal: 5, penalty_goal: 5, chance: 3, shot_on: 2.6, shot: 1.8,
  save: 2.2, corner: 1.6, offside: 1.2, yellow: 1, red: 1.4,
};
function heatColor(t: number): string {
  const stops: [number, [number, number, number]][] = [
    [0.0, [56, 132, 220]], [0.45, [46, 204, 113]], [0.72, [241, 196, 15]],
    [0.88, [230, 126, 34]], [1.0, [231, 76, 60]],
  ];
  const x = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (x - t0) / (t1 - t0 || 1);
      return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * f)},${Math.round(c0[1] + (c1[1] - c0[1]) * f)},${Math.round(c0[2] + (c1[2] - c0[2]) * f)})`;
    }
  }
  return "rgb(231,76,60)";
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
  return { cx: Math.cos(a) * 9.5, cy: Math.sin(a) * 9.5, rot: -90 + i * 72 + 36 };
});

// Silueta de camiseta (mangas + cuello), centrada en (0,0), bajo a y≈18.
const SHIRT = "M-12,-7 L-6,-10.5 L-3,-8 Q0,-6 3,-8 L6,-10.5 L12,-7 L9.5,-1.5 L9,17 Q0,20 -9,17 L-9.5,-1.5 Z";

// Marco de gradas (rectángulo con hueco interior).
const STANDS_PATH = `M0 0 H${W} V${H} H0 Z M${PAD} ${PAD} V${H - PAD} H${W - PAD} V${PAD} Z`;

export interface PlayerInfo { num: number; label: string; side: "home" | "away"; pos: string }

interface PlayerNode {
  key: string;
  side: "home" | "away";
  pos: string;
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
export interface ShotFx { key: number; x: number; y: number; raised: boolean; slow?: boolean }

interface PitchProps {
  meta: MatchMeta;
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  /** Posición objetivo del balón en coords normalizadas (home ataca hacia x=1). */
  ball: { x: number; y: number };
  /** Solo se usa para la sacudida/zoom de cámara y la red al marcar. */
  goalPulse?: GoalPulse | null;
  /** Disparo: el balón viaja en arco hacia (x,y) y se eleva si `raised`. */
  shotFx?: ShotFx | null;
  /** Probabilidad de que el juego fluya hacia la portería visitante. 0..1 */
  attackBias?: number;
  /** El balón deambula solo cuando está activo (sim corriendo / en vivo). */
  active?: boolean;
  /** Movimiento simulado del balón/jugadores. En vivo (datos reales sin
   *  coordenadas de jugada) se desactiva: el balón no deambula y los jugadores
   *  mantienen su formación, para no inventar acciones que no han ocurrido. */
  roam?: boolean;
  /** Segunda mitad: los equipos cambian de lado. */
  flip?: boolean;
  /** Energía del público 0..1 (deriva del momentum). */
  intensity?: number;
  /** Superponer mapa de calor sobre el campo. */
  showHeat?: boolean;
  /** Historial de eventos (para el heatmap). */
  log?: MatchEvent[];
  /** Vista táctica: resalta líneas de pase y aplana el realismo. */
  tactical?: boolean;
  /** Ficha de jugador al pasar el ratón. */
  onHoverPlayer?: (p: PlayerInfo | null) => void;
}

function Player({
  node,
  innerRef,
  onHover,
}: {
  node: PlayerNode;
  innerRef: (el: SVGGElement | null) => void;
  onHover?: (n: PlayerNode | null) => void;
}) {
  const { kit } = node;
  const legDelay = `${(node.ph / (Math.PI * 2)) * -0.6}s`;
  return (
    <g
      ref={innerRef}
      transform={`translate(${node.bx},${node.by})`}
      style={{ willChange: "transform", cursor: onHover ? "pointer" : "default" }}
      onMouseEnter={onHover ? () => onHover(node) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
      {/* Sombra en el suelo */}
      <ellipse cx={2} cy={20} rx={13} ry={4} fill="rgba(0,0,0,0.32)" />
      {/* Piernas con micro-animación de carrera */}
      <g>
        <rect className="mc-leg" x={-5} y={15} width={3.6} height={9} rx={1.6} fill={kit.fill} stroke="#0a0906" strokeWidth={0.8}
          style={{ transformBox: "fill-box", transformOrigin: "top", animationDelay: legDelay } as React.CSSProperties} />
        <rect className="mc-leg mc-leg2" x={1.4} y={15} width={3.6} height={9} rx={1.6} fill={kit.fill} stroke="#0a0906" strokeWidth={0.8}
          style={{ transformBox: "fill-box", transformOrigin: "top", animationDelay: legDelay } as React.CSSProperties} />
      </g>
      {/* Cabeza */}
      <circle cx={0} cy={-14} r={5.6} fill="#e8c8a6" stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      {/* Camiseta (color de la selección) */}
      <path d={SHIRT} fill={kit.fill} stroke="#0a0906" strokeWidth={1.3} />
      {/* Relieve de la camiseta */}
      <path d={SHIRT} fill="url(#kitShade)" />
      {/* Dorsal */}
      <text x={0} y={7} textAnchor="middle" fontSize={12.5} fontWeight={900} fill={kit.txt}
        style={{ pointerEvents: "none", fontFamily: "'Rajdhani','Outfit',sans-serif" }}>
        {node.num}
      </text>
      {/* Nombre */}
      {node.label && (
        <text x={0} y={32} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff" stroke="#0a0906"
          strokeWidth={2.8} paintOrder="stroke" style={{ pointerEvents: "none", fontFamily: "'Rajdhani','Outfit',sans-serif" }}>
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
  shotFx,
  attackBias = 0.5,
  active = true,
  roam = true,
  flip = false,
  intensity = 0.3,
  showHeat = false,
  log = [],
  tactical = false,
  onHoverPlayer,
}: PitchProps) {
  const fx = (x: number) => (flip ? 1 - x : x);
  const weather = useMemo(() => venueWeather(meta), [meta]);
  const kits = useMemo(() => buildKits(meta.home.color, meta.away.color), [meta.home.color, meta.away.color]);

  const players = useMemo<PlayerNode[]>(() => {
    const arr: PlayerNode[] = [];
    let idx = 0;
    const make = (key: string, side: "home" | "away", sx: number, p: { x: number; y: number; num: number; name?: string; pos: string }, kit: Kit, gkKit: Kit): PlayerNode => {
      const k = idx++;
      const gk = p.pos === "GK";
      return {
        key,
        side,
        pos: p.pos,
        bx: px(sx),
        by: py(p.y),
        num: p.num,
        label: p.name ? lastName(p.name) : "",
        kit: gk ? gkKit : kit,
        gk,
        ph: frac(k + 1.1) * Math.PI * 2,
        perX: 520 + frac(k + 2.7) * 760,
        perY: 540 + frac(k + 3.9) * 760,
        ampX: gk ? 4 : 6 + frac(k + 4.3) * 9,
        ampY: gk ? 5 : 6 + frac(k + 5.6) * 9,
        react: gk ? 0.05 : 0.1 + frac(k + 6.1) * 0.12,
      };
    };
    homeLineup.starters.forEach((p, i) => arr.push(make(`h${i}`, "home", flip ? 1 - p.x : p.x, p, kits.home, kits.gkHome)));
    awayLineup.starters.forEach((p, i) => arr.push(make(`a${i}`, "away", flip ? p.x : 1 - p.x, p, kits.away, kits.gkAway)));
    return arr;
  }, [homeLineup, awayLineup, kits, flip]);

  // Heatmap (recalculado cuando cambia el log y está activo)
  const heat = useMemo(() => {
    if (!showHeat) return null;
    const grid = new Float32Array(HX * HY);
    const add = (gx: number, gy: number, v: number) => {
      if (gx < 0 || gx >= HX || gy < 0 || gy >= HY) return;
      grid[gy * HX + gx] += v;
    };
    for (const e of log) {
      if (typeof e.x !== "number" || typeof e.y !== "number" || e.side === "neutral") continue;
      const w = HEAT_W[e.type] ?? 0.8;
      const ex = flip ? 1 - e.x : e.x;
      const bx = Math.round(ex * (HX - 1));
      const by = Math.round(e.y * (HY - 1));
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++)
          add(bx + ox, by + oy, w * Math.exp(-(ox * ox + oy * oy) * 0.7));
    }
    let max = 0;
    for (let i = 0; i < grid.length; i++) max = Math.max(max, grid[i]);
    return { grid, max: max || 1 };
  }, [showHeat, log, flip]);

  // Refs de animación
  const ballRef = useRef<SVGGElement | null>(null);
  const ballShadowRef = useRef<SVGEllipseElement | null>(null);
  const trailRefs = useRef<(SVGCircleElement | null)[]>([]);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const cameraRef = useRef<SVGGElement | null>(null);
  const possRef = useRef<SVGGElement | null>(null);
  const passRefs = useRef<(SVGLineElement | null)[]>([]);

  const ballPos = useRef({ x: px(0.5), y: py(0.5) });
  const target = useRef({ x: px(0.5), y: py(0.5) });
  const eventHold = useRef(0);
  const roamAcc = useRef(0);
  const roamInt = useRef(1);
  const biasRef = useRef(attackBias);
  const flipRef = useRef(flip);
  const activeRef = useRef(active);
  const roamRef = useRef(roam);
  const playersRef = useRef(players);
  const history = useRef<{ x: number; y: number }[]>([]);
  const angle = useRef(0);
  const camPan = useRef({ x: 0, y: 0 });
  const shot = useRef<{ active: boolean; t: number; dur: number; sx: number; sy: number; ex: number; ey: number; lift: number; bow: number } | null>(null);

  const [shakeKey, setShakeKey] = useState(0);
  // En móvil ocultamos las gradas y recortamos al campo para ganar superficie.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => { biasRef.current = attackBias; }, [attackBias]);
  useEffect(() => { flipRef.current = flip; }, [flip]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { roamRef.current = roam; }, [roam]);
  useEffect(() => { playersRef.current = players; }, [players]);

  // Un evento fija el objetivo del balón y lo "ancla" un instante.
  useEffect(() => {
    target.current = { x: px(clamp(fx(ball.x), 0, 1)), y: py(clamp(ball.y, 0, 1)) };
    eventHold.current = performance.now() + 1500;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ball.x, ball.y, flip]);

  // Disparo: arrancar la trayectoria en arco hacia el destino.
  useEffect(() => {
    if (!shotFx) return;
    const ex = px(clamp(flipRef.current ? 1 - shotFx.x : shotFx.x, 0, 1));
    const ey = py(clamp(shotFx.y, 0, 1));
    shot.current = {
      active: true, t: 0, dur: shotFx.slow ? 1.8 : 0.62,
      sx: ballPos.current.x, sy: ballPos.current.y, ex, ey,
      lift: shotFx.raised ? 46 : 14,
      bow: (frac(shotFx.key) - 0.5) * 90,
    };
    target.current = { x: ex, y: ey };
    eventHold.current = performance.now() + (shotFx.slow ? 2600 : 1700);
  }, [shotFx]);

  // Sacudida + punch-zoom de cámara al marcar.
  useEffect(() => {
    if (!goalPulse) return;
    setShakeKey(goalPulse.key);
    const t = setTimeout(() => setShakeKey(0), 900);
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
      const sh = shot.current;

      if (activeRef.current && roamRef.current && !anchored && (!sh || !sh.active)) {
        roamAcc.current += dt;
        if (roamAcc.current >= roamInt.current) {
          roamAcc.current = 0;
          roamInt.current = 0.55 + Math.random() * 0.8;
          const cx = (ballPos.current.x - PAD) / FW;
          const cy = (ballPos.current.y - PAD) / FH;
          const bias = flipRef.current ? 1 - biasRef.current : biasRef.current;
          const dir = Math.random() < bias ? 1 : -1;
          const nx = clamp(cx + dir * (0.1 + Math.random() * 0.24), 0.07, 0.93);
          const ny = clamp(cy + (Math.random() - 0.5) * 0.5, 0.1, 0.9);
          target.current = { x: px(nx), y: py(ny) };
        }
      }

      let bxp: number, byp: number, lift = 0;
      if (sh && sh.active) {
        // Trayectoria en arco (cuadrática) con elevación y bombeo lateral.
        sh.t += dt / sh.dur;
        const p = Math.min(1, sh.t);
        const lx = sh.sx + (sh.ex - sh.sx) * p;
        const ly = sh.sy + (sh.ey - sh.sy) * p;
        // perpendicular a la trayectoria para el bombeo
        const ang = Math.atan2(sh.ey - sh.sy, sh.ex - sh.sx) + Math.PI / 2;
        const bow = Math.sin(p * Math.PI) * sh.bow;
        bxp = lx + Math.cos(ang) * bow;
        lift = Math.sin(p * Math.PI) * sh.lift;
        byp = ly + Math.sin(ang) * bow - lift;
        ballPos.current.x = lx;
        ballPos.current.y = ly;
        angle.current += 16;
        if (p >= 1) sh.active = false;
      } else {
        const k = Math.min(1, dt * (anchored ? 7 : 3.4));
        const prevX = ballPos.current.x;
        const prevY = ballPos.current.y;
        ballPos.current.x += (target.current.x - prevX) * k;
        ballPos.current.y += (target.current.y - prevY) * k;
        const dx = ballPos.current.x - prevX;
        const dy = ballPos.current.y - prevY;
        const sp = Math.hypot(dx, dy);
        const wob = activeRef.current ? Math.sin(now / 150) * Math.min(2, sp * 0.4 + 0.4) : 0;
        bxp = ballPos.current.x;
        byp = ballPos.current.y + wob;
        angle.current += sp * 5 + (activeRef.current ? 0.4 : 0);
      }

      if (ballRef.current) {
        ballRef.current.setAttribute("transform", `translate(${bxp},${byp}) rotate(${angle.current})`);
      }
      // Sombra del balón: se queda en el suelo (se separa al elevarse).
      if (ballShadowRef.current) {
        ballShadowRef.current.setAttribute("cx", String(bxp));
        ballShadowRef.current.setAttribute("cy", String(byp + lift + BALL_R + 4));
        const k = clamp(1 - lift / 70, 0.4, 1);
        ballShadowRef.current.setAttribute("rx", String((BALL_R - 1) * k));
        ballShadowRef.current.setAttribute("opacity", String(0.32 * k));
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

      // Cada jugador: deambular individual + reacción al balón. En vivo (roam
      // off) no inventamos movimiento: formación quieta con respiración mínima.
      const idleK = roamRef.current ? (activeRef.current ? 1 : 0.3) : 0.12;
      const reactK = roamRef.current ? 1 : 0;
      const list = playersRef.current;
      const cur: { x: number; y: number; side: string; gk: boolean }[] = [];
      for (let i = 0; i < list.length; i++) {
        const g = groupRefs.current[i];
        const pl = list[i];
        if (!pl) { cur.push({ x: 0, y: 0, side: "x", gk: false }); continue; }
        const maxS = pl.gk ? 26 : 74;
        const wx = Math.sin(now / pl.perX + pl.ph) * pl.ampX * idleK;
        const wy = Math.cos(now / pl.perY + pl.ph * 1.3) * pl.ampY * idleK;
        const ox = clamp((bxp - pl.bx) * pl.react * reactK + wx, -maxS, maxS);
        const oy = clamp((byp - pl.by) * pl.react * reactK + wy, -maxS, maxS);
        const cxp = pl.bx + ox, cyp = pl.by + oy;
        cur.push({ x: cxp, y: cyp, side: pl.side, gk: pl.gk });
        if (g) g.setAttribute("transform", `translate(${cxp},${cyp})`);
      }

      // Jugador en posesión = el más cercano al balón.
      let nearest = -1, nd = Infinity;
      for (let i = 0; i < cur.length; i++) {
        const d = Math.hypot(cur[i].x - bxp, cur[i].y - byp);
        if (d < nd) { nd = d; nearest = i; }
      }
      if (possRef.current) {
        if (nearest >= 0 && nd < 120) {
          possRef.current.setAttribute("transform", `translate(${cur[nearest].x},${cur[nearest].y + 20})`);
          possRef.current.setAttribute("opacity", "1");
        } else {
          possRef.current.setAttribute("opacity", "0");
        }
      }
      // Líneas de pase: del poseedor a hasta 3 compañeros cercanos.
      const carrier = nearest >= 0 ? cur[nearest] : null;
      if (carrier) {
        const mates = cur
          .map((c, i) => ({ c, i, d: Math.hypot(c.x - carrier.x, c.y - carrier.y) }))
          .filter((m) => m.i !== nearest && m.c.side === carrier.side && !m.c.gk && m.d > 30 && m.d < 320)
          .sort((a, b) => a.d - b.d)
          .slice(0, 3);
        for (let i = 0; i < 3; i++) {
          const ln = passRefs.current[i];
          if (!ln) continue;
          const m = mates[i];
          if (m) {
            ln.setAttribute("x1", String(carrier.x));
            ln.setAttribute("y1", String(carrier.y + 6));
            ln.setAttribute("x2", String(m.c.x));
            ln.setAttribute("y2", String(m.c.y + 6));
            ln.setAttribute("opacity", String((tactical ? 0.5 : 0.24) * (1 - i * 0.22)));
          } else {
            ln.setAttribute("opacity", "0");
          }
        }
      } else {
        for (let i = 0; i < 3; i++) passRefs.current[i]?.setAttribute("opacity", "0");
      }

      // Cámara: panea suavemente hacia el balón (clip al campo evita desbordes).
      if (cameraRef.current) {
        const cx = W / 2, cy = H / 2;
        const desX = (cx - bxp) * 0.1;
        const desY = (cy - byp) * 0.08;
        camPan.current.x += (desX - camPan.current.x) * 0.045;
        camPan.current.y += (desY - camPan.current.y) * 0.045;
        const s = tactical ? 1.0 : 1.05;
        cameraRef.current.setAttribute("transform", `translate(${cx * (1 - s) + camPan.current.x},${cy * (1 - s) + camPan.current.y}) scale(${s})`);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tactical]);

  // Postes de luz en las 4 esquinas del estadio.
  const lights = [
    { x: STAND / 2, y: STAND / 2 }, { x: W - STAND / 2, y: STAND / 2 },
    { x: STAND / 2, y: H - STAND / 2 }, { x: W - STAND / 2, y: H - STAND / 2 },
  ];
  const night = weather.tod === "night";
  const dusk = weather.tod === "dusk";
  const floodOp = night ? 1 : dusk ? 0.6 : 0.25;
  const skyTint = night ? "rgba(10,9,6,0.55)" : dusk ? "rgba(40,24,60,0.3)" : "rgba(0,0,0,0)";
  const crowdGlow = clamp(0.05 + intensity * 0.14, 0.05, 0.22);
  const ch = FH / HY, cwh = FW / HX;

  return (
    <svg
      viewBox={compact ? `${PAD - 14} ${PAD - 14} ${FW + 28} ${FH + 28}` : `0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", borderRadius: 16, willChange: "transform" }}
      preserveAspectRatio="xMidYMid meet"
      className={shakeKey ? "mc-goalcam" : undefined}
    >
      <style>{`
        @keyframes mcGoalCamKf{0%{transform:scale(1) translate(0,0)}8%{transform:scale(1.12) translate(0,-4px)}22%{transform:scale(1.08) translate(-5px,2px)}38%{transform:scale(1.06) translate(5px,-2px)}60%{transform:scale(1.03) translate(-3px,1px)}100%{transform:scale(1) translate(0,0)}}
        .mc-goalcam{animation:mcGoalCamKf .9s cubic-bezier(.2,.8,.3,1);transform-origin:50% 46%}
        @keyframes mcLeg{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(12deg)}}
        @keyframes mcLeg2{0%,100%{transform:rotate(12deg)}50%{transform:rotate(-10deg)}}
        .mc-leg{animation:mcLeg .5s ease-in-out infinite}
        .mc-leg2{animation-name:mcLeg2}
        @keyframes mcPoss{0%,100%{transform:scale(.85);opacity:.55}50%{transform:scale(1.15);opacity:1}}
        .mc-poss-ring{animation:mcPoss 1.1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        @keyframes mcWave{0%{transform:translateX(-110%)}100%{transform:translateX(110%)}}
        .mc-wave{animation:mcWave 3.2s linear infinite}
        @keyframes mcRain{0%{transform:translateY(-40px)}100%{transform:translateY(40px)}}
        .mc-rain{animation:mcRain .5s linear infinite}
        @keyframes mcNet{0%,100%{transform:translateX(0)}25%{transform:translateX(3px)}60%{transform:translateX(-2px)}}
        .mc-net-hit{animation:mcNet .5s ease-out 2}
        @keyframes mcCrowdFlash{0%{opacity:0}20%{opacity:.9}100%{opacity:0}}
        .mc-crowd-flash{animation:mcCrowdFlash 1.1s ease-out}
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
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id="seats" width="12" height="9" patternUnits="userSpaceOnUse">
          <rect width="12" height="9" fill="#11161f" />
          <circle cx="3" cy="3" r="1.3" fill="#14110a" />
          <circle cx="9" cy="7" r="1.3" fill="#14110a" />
        </pattern>
        <clipPath id="fieldClip">
          <rect x={PAD} y={PAD} width={FW} height={FH} rx={8} />
        </clipPath>
        <filter id="heatBlur" x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
      </defs>

      {/* Estadio: base oscura */}
      <rect x={0} y={0} width={W} height={H} fill="#000000" />

      {/* Gradas + público + focos: solo en escritorio (en móvil se recorta al campo) */}
      {!compact && (
        <>
          {/* Gradas con textura de asientos */}
          <path d={STANDS_PATH} fillRule="evenodd" fill="url(#seats)" />
          {/* Público: resplandor según intensidad */}
          <path d={STANDS_PATH} fillRule="evenodd" fill="#ffd27a" opacity={crowdGlow} style={{ transition: "opacity .8s ease" }} />
          {/* Ola del público (banda que recorre la grada superior) */}
          {intensity > 0.45 && (
            <rect className="mc-wave" x={0} y={0} width={W * 0.35} height={PAD} fill="url(#waveGrad)" opacity={0.6} style={{ pointerEvents: "none" }} />
          )}
          {/* Destello del público al marcar */}
          {shakeKey > 0 && (
            <path key={`cf-${shakeKey}`} className="mc-crowd-flash" d={STANDS_PATH} fillRule="evenodd" fill="#fff7d6" />
          )}
          {/* Muro perimetral del campo */}
          <rect x={PAD - 8} y={PAD - 8} width={FW + 16} height={FH + 16} rx={6} fill="#000000" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
          {/* Focos de las esquinas (intensidad según hora) */}
          {lights.map((l, i) => (
            <g key={`fl-${i}`}>
              <circle cx={l.x} cy={l.y} r={120} fill="url(#flood)" opacity={floodOp} />
              <rect x={l.x - 12} y={l.y - 7} width={24} height={14} rx={3} fill="#1a2230" stroke="rgba(255,255,255,0.15)" />
              {[-7, 0, 7].map((o) => (
                <circle key={o} cx={l.x + o} cy={l.y} r={2.4} fill={night || dusk ? "#fff7d6" : "#cdd6e2"} />
              ))}
            </g>
          ))}
        </>
      )}

      {/* === CAPA DE CÁMARA (campo + acción), recortada al campo === */}
      <g clipPath="url(#fieldClip)">
        <g ref={cameraRef}>
          {/* Césped + franjas de corte */}
          <rect x={PAD} y={PAD} width={FW} height={FH} rx={8} fill="url(#turf)" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={PAD + (i * FW) / 12} y={PAD} width={FW / 12} height={FH}
              fill={i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"} />
          ))}
          <rect x={PAD} y={PAD} width={FW} height={FH} fill="url(#light)" />
          {/* Tinte de hora (atardecer / noche) */}
          {skyTint !== "rgba(0,0,0,0)" && <rect x={PAD} y={PAD} width={FW} height={FH} fill={skyTint} />}

          {/* Heatmap superpuesto */}
          {heat && (
            <g filter="url(#heatBlur)" opacity={0.6} style={{ pointerEvents: "none" }}>
              {Array.from(heat.grid).map((v, i) => {
                const t = v / heat.max;
                if (t < 0.05) return null;
                const gx = i % HX, gy = Math.floor(i / HX);
                return (
                  <rect key={i} x={PAD + gx * cwh} y={PAD + gy * ch} width={cwh + 1} height={ch + 1}
                    fill={heatColor(t)} opacity={0.3 + t * 0.55} />
                );
              })}
            </g>
          )}

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
          </g>

          {/* Redes de portería (se sacuden al marcar) */}
          {[{ side: "home", x: PAD - 10, dir: -1 }, { side: "away", x: W - PAD, dir: 1 }].map((g) => {
            const scored = goalPulse && ((flip ? (g.side === "home" ? "away" : "home") : g.side) === goalPulse.side);
            return (
              <g key={g.side} className={scored ? "mc-net-hit" : undefined}>
                <rect x={g.x} y={H / 2 - 30} width={10} height={60} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.85)" strokeWidth={2} />
                <g stroke="rgba(255,255,255,0.4)" strokeWidth={0.7}>
                  {[0, 1, 2, 3].map((k) => (
                    <line key={`v${k}`} x1={g.x + (k * 10) / 3} y1={H / 2 - 30} x2={g.x + (k * 10) / 3} y2={H / 2 + 30} />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((k) => (
                    <line key={`h${k}`} x1={g.x} y1={H / 2 - 30 + (k * 60) / 5} x2={g.x + 10} y2={H / 2 - 30 + (k * 60) / 5} />
                  ))}
                </g>
              </g>
            );
          })}

          {/* Líneas de pase (poseedor → compañeros) */}
          <g stroke={tactical ? "#7ee0ff" : "#ffe08a"} strokeWidth={tactical ? 2 : 1.6} strokeDasharray="5 5" fill="none" style={{ pointerEvents: "none" }}>
            {[0, 1, 2].map((i) => (
              <line key={`pl-${i}`} ref={(el) => { passRefs.current[i] = el; }} x1={0} y1={0} x2={0} y2={0} opacity={0} />
            ))}
          </g>

          {/* Anillo de posesión */}
          <g ref={possRef} opacity={0} style={{ pointerEvents: "none" }}>
            <ellipse className="mc-poss-ring" cx={0} cy={0} rx={16} ry={6} fill="none" stroke="#ffe08a" strokeWidth={2.4} />
          </g>

          {/* Jugadores */}
          {players.map((node, i) => (
            <Player
              key={node.key}
              node={node}
              innerRef={(el) => { groupRefs.current[i] = el; }}
              onHover={onHoverPlayer ? (n) => onHoverPlayer(n ? { num: n.num, label: n.label, side: n.side, pos: n.pos } : null) : undefined}
            />
          ))}

          {/* Estela del balón */}
          {Array.from({ length: TRAIL }).map((_, i) => (
            <circle key={`tr-${i}`} ref={(el) => { trailRefs.current[i] = el; }} r={6 - (i * 3) / TRAIL} fill="#fff" opacity={0} />
          ))}

          {/* Sombra del balón (separada para la elevación) */}
          <ellipse ref={ballShadowRef} cx={px(0.5)} cy={py(0.5) + BALL_R + 4} rx={BALL_R - 1} ry={3.5} fill="rgba(0,0,0,0.32)" />

          {/* Balón realista (pentágonos que rotan con el balón) */}
          <g ref={ballRef} transform={`translate(${px(0.5)},${py(0.5)})`} style={{ willChange: "transform" }}>
            <circle r={BALL_R + 5} fill="#fff" opacity={0.14} />
            <circle r={BALL_R} fill="url(#ballG)" stroke="#0a0906" strokeWidth={1.4} />
            <g stroke="#1a2733" strokeWidth={1} fill="none" opacity={0.85}>
              {OUTER_PENTS.map((o, i) => (
                <line key={`seam-${i}`} x1={0} y1={0} x2={o.cx} y2={o.cy} />
              ))}
            </g>
            <polygon points={CENTRAL_PENT} fill="#0a0906" />
            {OUTER_PENTS.map((o, i) => (
              <polygon key={`op-${i}`} points={pentPoints(3.4, o.rot)} transform={`translate(${o.cx},${o.cy})`} fill="#0a0906" opacity={0.92} />
            ))}
            <ellipse cx={-4} cy={-5} rx={4} ry={2.6} fill="rgba(255,255,255,0.85)" />
          </g>

          {/* Viñeta sobre el campo (profundidad) */}
          <rect x={PAD} y={PAD} width={FW} height={FH} fill="url(#vig)" style={{ pointerEvents: "none" }} />
        </g>
      </g>

      {/* Reacción del público en móvil (sin gradas): destello del borde al marcar */}
      {compact && shakeKey > 0 && (
        <g key={`cmf-${shakeKey}`} style={{ pointerEvents: "none" }}>
          {/* Anillo exterior (la franja visible alrededor del campo) */}
          <path className="mc-crowd-flash" d={STANDS_PATH} fillRule="evenodd" fill="#fff7d6" />
          {/* Glow del borde del terreno */}
          <rect className="mc-crowd-flash" x={PAD} y={PAD} width={FW} height={FH} rx={8} fill="none" stroke="#fff7d6" strokeWidth={10} />
        </g>
      )}

      {/* Lluvia (delante de todo, sutil) */}
      {weather.rain && !compact && (
        <g className="mc-rain" opacity={0.5} style={{ pointerEvents: "none" }}>
          {Array.from({ length: 60 }).map((_, i) => {
            const x = frac(i + 0.3) * W;
            const y = frac(i + 0.7) * (H + 40) - 40;
            return <line key={i} x1={x} y1={y} x2={x - 2} y2={y + 14} stroke="rgba(200,220,255,0.5)" strokeWidth={1} />;
          })}
        </g>
      )}
    </svg>
  );
}
