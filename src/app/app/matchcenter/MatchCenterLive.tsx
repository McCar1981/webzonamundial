"use client";

// Experiencia "en vivo" del Match Center. Consume un MatchFeed (guion de
// simulación o snapshot real) y lo reproduce con su propio reloj: cancha
// animada, eventos con animación, locución por voz, marcador, momentum y stats
// que se actualizan en tiempo (casi) real.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Pitch from "./Pitch";
import MatchFx from "./MatchFx";
import PreMatchHero from "./PreMatchHero";
import PreMatchPreview from "./PreMatchPreview";
import CommentsPanel from "./CommentsPanel";
import { createSpeaker, type Speaker } from "@/lib/match-center/voice";
import { createSound, type MatchSound } from "@/lib/match-center/sound";
import { zoneForEvent } from "@/lib/match-center/zones";
import {
  EMPTY_STATS,
  type LiveStats,
  type MatchEvent,
  type MatchFeed,
  type MatchMeta,
  type Pair,
  type StatKeyframe,
  type TeamLineup,
} from "@/lib/match-center/types";
import type {
  IACoachLiveAnalysis,
  IACoachLiveResponse,
  IACoachLiveErrorResponse,
  LiveEventInput,
} from "@/lib/ia-coach/live-types";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e", RED = "#ef4444";

const SPEAK_TYPES = new Set([
  "kickoff", "goal", "penalty_goal", "own_goal", "penalty_miss",
  "yellow", "second_yellow", "red", "sub", "var", "save", "chance",
  "half_time", "full_time",
]);

const SPEEDS = [1, 6, 12, 24];

function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code}.png`;
}

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}
function lerpPair(a: Pair, b: Pair, f: number): Pair {
  return [Math.round(lerp(a[0], b[0], f)), Math.round(lerp(a[1], b[1], f))];
}
function statAt(frames: StatKeyframe[], t: number): LiveStats {
  if (frames.length === 0) return EMPTY_STATS;
  if (t <= frames[0].t) return frames[0].stats;
  for (let i = 1; i < frames.length; i++) {
    if (t <= frames[i].t) {
      const a = frames[i - 1], b = frames[i];
      const f = (t - a.t) / Math.max(1, b.t - a.t);
      return {
        possession: lerpPair(a.stats.possession, b.stats.possession, f),
        shots: lerpPair(a.stats.shots, b.stats.shots, f),
        shotsOn: lerpPair(a.stats.shotsOn, b.stats.shotsOn, f),
        passes: lerpPair(a.stats.passes, b.stats.passes, f),
        fouls: lerpPair(a.stats.fouls, b.stats.fouls, f),
        corners: lerpPair(a.stats.corners, b.stats.corners, f),
        saves: lerpPair(a.stats.saves, b.stats.saves, f),
        yellow: lerpPair(a.stats.yellow, b.stats.yellow, f),
        red: lerpPair(a.stats.red, b.stats.red, f),
        xg: [
          +lerp(a.stats.xg[0], b.stats.xg[0], f).toFixed(2),
          +lerp(a.stats.xg[1], b.stats.xg[1], f).toFixed(2),
        ],
      };
    }
  }
  return frames[frames.length - 1].stats;
}

// Locución AMBIENTE: relleno entre jugadas para que la cronología no se quede
// congelada en el último evento cuando pasan minutos sin acción. Se construye
// SOLO con datos reales (posesión, minuto): no inventa jugadas. Determinista
// por `seed` para variar la frase sin repetir la inmediata anterior.
function ambientLine(
  meta: MatchMeta,
  possHome: number,
  sec: number,
  seed: number,
): string {
  const mm = Math.max(1, Math.floor(sec / 60));
  const diff = possHome - (100 - possHome);
  const dom = diff > 12 ? meta.home.name : diff < -12 ? meta.away.name : null;
  const min = `'${mm}`;
  const balanced = [
    `Partido parejo en el medio campo. ${min}.`,
    `Se mide el ritmo, ninguno cede el control. ${min}.`,
    `Intercambio de golpes en la mitad de la cancha. ${min}.`,
    `Tanteo entre ${meta.home.name} y ${meta.away.name}. ${min}.`,
  ];
  const dominant = dom
    ? [
        `${dom} mueve el balón con paciencia y manda en la posesión. ${min}.`,
        `${dom} acumula metros y hace correr al rival. ${min}.`,
        `Insiste ${dom}, que lleva el peso del juego. ${min}.`,
      ]
    : balanced;
  const pool = dom ? dominant : balanced;
  return pool[seed % pool.length];
}

function clockLabel(sec: number, finished: boolean): string {
  if (finished) return "FINAL";
  const mm = Math.floor(sec / 60);
  if (mm <= 90) return `${Math.max(1, mm)}'`;
  return `90+${mm - 90}'`;
}

// Estados api-football en los que el balón rueda (el reloj corre).
const IN_PLAY = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "INT"]);
function isInPlay(status: string): boolean {
  return IN_PLAY.has(status);
}

/** Formatea el saque (ISO) a fecha y hora en la zona horaria del usuario. */
function fmtKickoff(iso?: string): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  };
}

// Iconos de evento en SVG (regla del proyecto: nunca emojis, siempre SVG).
// Autocontenido: cada tipo trae sus colores; `size` controla el lado en px.
function EventIcon({ type, size = 18 }: { type: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" } as const;
  switch (type) {
    case "goal":
    case "penalty_goal":
    case "own_goal":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" fill="#fff" stroke={BG3} strokeWidth="1.2" />
          <path d="M12 7.2l2.7 1.95-1.03 3.2H10.33L9.3 9.15z" fill={BG3} />
          <path d="M12 7.2V4.3M14.7 9.15l2.5-1.1M13.67 12.35l1.7 2.7M10.33 12.35l-1.7 2.7M9.3 9.15l-2.5-1.1" stroke={BG3} strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case "penalty_miss":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" stroke={RED} strokeWidth="1.8" />
          <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "yellow":
      return <svg {...p}><rect x="7" y="3.5" width="10" height="14" rx="1.6" fill="#eab308" transform="rotate(8 12 10)" /></svg>;
    case "second_yellow":
      return (
        <svg {...p}>
          <rect x="4.5" y="4.5" width="9" height="13" rx="1.5" fill="#eab308" transform="rotate(-9 9 11)" />
          <rect x="10.5" y="5" width="9" height="13" rx="1.5" fill={RED} transform="rotate(9 15 11)" />
        </svg>
      );
    case "red":
      return <svg {...p}><rect x="7" y="3.5" width="10" height="14" rx="1.6" fill={RED} transform="rotate(8 12 10)" /></svg>;
    case "sub":
      return (
        <svg {...p}>
          <path d="M8 5v11M8 16l-2.4-2.4M8 16l2.4-2.4" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 19V8M16 8l-2.4 2.4M16 8l2.4 2.4" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "var":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="12" rx="2" stroke={GOLD} strokeWidth="1.6" />
          <path d="M9 20h6M12 17v3" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7.5 8.5h9M7.5 11.5h5.5" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "corner":
      return (
        <svg {...p}>
          <path d="M7 4v16" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 4l9 2.6L7 9.6z" fill={GOLD} />
        </svg>
      );
    case "shot_on":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" stroke={GOLD} strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4.5" stroke={GOLD} strokeWidth="1.4" />
          <circle cx="12" cy="12" r="1.4" fill={GOLD} />
        </svg>
      );
    case "shot":
      return <svg {...p}><path d="M5 19L19 5M19 5h-6M19 5v6" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "save":
      return (
        <svg {...p}>
          <path d="M7.5 12V7a1.3 1.3 0 0 1 2.6 0v3.2m0 0V5.6a1.3 1.3 0 0 1 2.6 0v4.6m0 0V6.4a1.3 1.3 0 0 1 2.6 0v6.6c0 3.4-2.1 6-5.2 6-1.9 0-3.1-.9-4.2-2.5l-1.9-2.9a1.3 1.3 0 0 1 2-1.6l1 1z" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "offside":
      return (
        <svg {...p}>
          <path d="M6 3v18" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6 4h11v7H6z" fill={GOLD} fillOpacity="0.85" />
        </svg>
      );
    case "chance":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" stroke={GOLD} strokeWidth="1.6" />
          <path d="M12 7v6" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="1.1" fill={GOLD} />
        </svg>
      );
    case "injury":
      return <svg {...p}><path d="M12 6v12M6 12h12" stroke={RED} strokeWidth="2.2" strokeLinecap="round" /></svg>;
    case "kickoff":
      return <svg {...p}><path d="M8 6l10 6-10 6z" fill={GOLD} /></svg>;
    case "half_time":
      return (
        <svg {...p}>
          <rect x="7" y="6" width="3.5" height="12" rx="1" fill={GOLD} />
          <rect x="13.5" y="6" width="3.5" height="12" rx="1" fill={GOLD} />
        </svg>
      );
    case "full_time":
      return (
        <svg {...p}>
          <path d="M6 4v16" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7.5 5h2.6v2.6H7.5zM12.7 5h2.6v2.6h-2.6zM10.1 7.6h2.6v2.6h-2.6zM15.3 7.6h2.6v2.6h-2.6zM7.5 10.2h2.6v2.6H7.5zM12.7 10.2h2.6v2.6h-2.6z" fill={GOLD} />
        </svg>
      );
    default:
      return <svg {...p}><circle cx="12" cy="12" r="2.5" fill={GOLD} /></svg>;
  }
}

// Glifo de "revivir/repetir" en SVG (flecha circular).
function ReliveIcon({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12a7 7 0 1 1 2 4.9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 17v-4h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Iconos de UI (controles/etiquetas) en SVG. `currentColor` hereda el color
// del botón/texto contenedor. Regla del proyecto: nunca emojis. ---
type IcoProps = { size?: number; color?: string };
const ico = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" } as const);

function MicIcon({ size = 15, color = "currentColor", off = false }: IcoProps & { off?: boolean }) {
  return (
    <svg {...ico(size)}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" stroke={color} strokeWidth="1.7" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      {off && <path d="M3.5 3.5l17 17" stroke={color} strokeWidth="1.7" strokeLinecap="round" />}
    </svg>
  );
}
function SoundIcon({ size = 15, color = "currentColor", off = false }: IcoProps & { off?: boolean }) {
  return (
    <svg {...ico(size)}>
      <path d="M4 9v6h3.5L13 19V5L7.5 9z" fill={color} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      {off ? (
        <path d="M16.5 9.5l4 4M20.5 9.5l-4 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
function PlayIcon({ size = 14, color = "currentColor" }: IcoProps) {
  return <svg {...ico(size)}><path d="M7 5l11 7-11 7z" fill={color} /></svg>;
}
function PauseIcon({ size = 14, color = "currentColor" }: IcoProps) {
  return <svg {...ico(size)}><rect x="6.5" y="5" width="3.6" height="14" rx="1" fill={color} /><rect x="13.9" y="5" width="3.6" height="14" rx="1" fill={color} /></svg>;
}
function TacticalIcon({ size = 14, color = "currentColor" }: IcoProps) {
  return (
    <svg {...ico(size)}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M12 3v18M4 12h16" stroke={color} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="2.2" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}
function CameraIcon({ size = 14, color = "currentColor" }: IcoProps) {
  return (
    <svg {...ico(size)}>
      <rect x="2.5" y="6.5" width="13" height="11" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M15.5 10.5l5-2.5v8l-5-2.5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function HeatIcon({ size = 14, color = "currentColor" }: IcoProps) {
  return (
    <svg {...ico(size)}>
      <path d="M12 2.5c3 3.2 5.5 5.6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-1.7.7-3 1.7-4.2.3 1 .9 1.7 1.8 2 0-2.4.8-4.6 2-7.3z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function BallIcon({ size = 12, color = BG3 }: IcoProps) {
  return (
    <svg {...ico(size)}>
      <circle cx="12" cy="12" r="9" fill="#fff" stroke={color} strokeWidth="1.2" />
      <path d="M12 7.2l2.7 1.95-1.03 3.2H10.33L9.3 9.15z" fill={color} />
      <path d="M12 7.2V4.3M14.7 9.15l2.5-1.1M13.67 12.35l1.7 2.7M10.33 12.35l-1.7 2.7M9.3 9.15l-2.5-1.1" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
function BootIcon({ size = 13, color = "currentColor" }: IcoProps) {
  return (
    <svg {...ico(size)}>
      <path d="M3 8h6l3 3 8 1.5c1 .2 1.5.9 1.5 2V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 14h7M6 18v2M10 18v2M14 18.2v1.8M18 18.2v1.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon({ size = 13, color = "currentColor" }: IcoProps) {
  return <svg {...ico(size)}><path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="1.9" strokeLinecap="round" /></svg>;
}
function SparkleIcon({ size = 14, color = GOLD }: IcoProps) {
  return (
    <svg {...ico(size)}>
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" fill={color} />
      <path d="M18.5 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill={color} fillOpacity="0.7" />
    </svg>
  );
}
function ChevronRightIcon({ size = 12, color = GOLD }: IcoProps) {
  return <svg {...ico(size)}><path d="M9 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ArrowLeftIcon({ size = 14, color = "currentColor" }: IcoProps) {
  return <svg {...ico(size)}><path d="M19 12H5M5 12l6-6M5 12l6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CrowdIcon({ mood, size = 22, color = "currentColor" }: { mood: string; size?: number; color?: string }) {
  if (mood === "fire") return <HeatIcon size={size} color={color} />;
  if (mood === "mega")
    return (
      <svg {...ico(size)}>
        <path d="M3 10v4l3 .5 2.5 4 2-1-1.8-3 7.3 1.5V7L8.5 9.5 6 10z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M18 8.5a4 4 0 0 1 0 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (mood === "clap")
    return (
      <svg {...ico(size)}>
        <path d="M7 13l-2.5-2.5a1.4 1.4 0 0 1 2-2L9 11M9 11V5.5a1.4 1.4 0 0 1 2.8 0V11M11.8 11V6.5a1.4 1.4 0 0 1 2.8 0V12c0 3.3-2 5.5-5 5.5-1.7 0-3-.8-4-2.2" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.5 4l1 1.5M19 6l-1.5 1M19.5 9.5l-2-.3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg {...ico(size)}>
      <path d="M9 18V6l10-2v12" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="2.5" stroke={color} strokeWidth="1.6" />
      <circle cx="16.5" cy="16" r="2.5" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  goalsHome: number | null;
  goalsAway: number | null;
  competition: string;
}
interface H2HData {
  matches: H2HMatch[];
  recordText: string;
}

interface Props {
  matchId: number;
  meta: MatchMeta;
  sim: boolean;
}

export default function MatchCenterLive({ matchId, meta, sim }: Props) {
  const [feed, setFeed] = useState<MatchFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sec, setSec] = useState(0);
  const [score, setScore] = useState<Pair>([0, 0]);
  const [stats, setStats] = useState<LiveStats>(EMPTY_STATS);
  const [log, setLog] = useState<MatchEvent[]>([]);
  const [narration, setNarration] = useState<string>("");
  const [ball, setBall] = useState({ x: 0.5, y: 0.5 });
  const [goalPulse, setGoalPulse] = useState<{ side: "home" | "away"; key: number; player?: string } | null>(null);
  const [cardFx, setCardFx] = useState<{ side: "home" | "away"; color: string; key: number; player?: string } | null>(null);
  const [subFx, setSubFx] = useState<{ side: "home" | "away"; key: number; playerOut?: string; playerIn?: string } | null>(null);
  const [shotFx, setShotFx] = useState<{ key: number; x: number; y: number; raised: boolean; slow?: boolean } | null>(null);
  const [lastScorer, setLastScorer] = useState<{ side: "home" | "away"; player?: string; minute: number } | null>(null);
  const [secondHalf, setSecondHalf] = useState(false);
  const [finished, setFinished] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [kickoff, setKickoff] = useState<string | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [showHeat, setShowHeat] = useState(false);
  const [tactical, setTactical] = useState(false);
  const [hoverPlayer, setHoverPlayer] = useState<{ num: number; label: string; side: "home" | "away"; pos: string } | null>(null);
  const [showHighlights, setShowHighlights] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [soundAvailable, setSoundAvailable] = useState(false);

  // Coach IA en vivo (Modo 2)
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachAnalysis, setCoachAnalysis] = useState<IACoachLiveAnalysis | null>(null);
  const [coachCached, setCoachCached] = useState(false);

  const feedRef = useRef<MatchFeed | null>(null);
  const secRef = useRef(0);
  const statsRef = useRef<LiveStats>(EMPTY_STATS);
  const firedRef = useRef<Set<string>>(new Set());
  const lastGoalRef = useRef<MatchEvent | null>(null);
  // Marca de tiempo (real) de la última locución mostrada. La usa el relleno
  // ambiente para no hablar encima de un evento reciente.
  const lastNarrAtRef = useRef(0);
  const ambientSeedRef = useRef(0);
  const [replayTag, setReplayTag] = useState(false);
  const [h2h, setH2h] = useState<H2HData | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const soundRef = useRef<MatchSound | null>(null);

  // Inicializa el speaker (solo en cliente)
  useEffect(() => {
    const s = createSpeaker("web");
    speakerRef.current = s;
    setVoiceAvailable(s.available());
    return () => s.cancel();
  }, []);

  // Inicializa el motor de sonido (solo en cliente)
  useEffect(() => {
    const snd = createSound();
    soundRef.current = snd;
    setSoundAvailable(snd.available());
    return () => snd.stopAmbient();
  }, []);

  // Historial head-to-head entre las dos selecciones (datos reales; vacío si no hay)
  useEffect(() => {
    let alive = true;
    fetch(`/api/match-center/h2h/${matchId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: H2HData | null) => {
        if (alive && d && Array.isArray(d.matches) && d.matches.length > 0) setH2h(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [matchId]);

  const speak = useCallback((text: string, priority = false) => {
    speakerRef.current?.speak(text, { priority });
  }, []);

  const narrationFor = useCallback((e: MatchEvent): string => {
    return feedRef.current?.narration[e.id] || "";
  }, []);

  // Procesa un evento: animación + voz + marcador + log
  const fireEvent = useCallback(
    (e: MatchEvent, animate: boolean) => {
      if (firedRef.current.has(e.id)) return;
      firedRef.current.add(e.id);

      // Coordenadas del balón: usa las del evento si existen; si no (feed real
      // sin posición de jugada), la máquina de zonas las deriva por tipo+lado,
      // garantizando que el balón nunca caiga en el lado equivocado.
      const coords =
        typeof e.x === "number" && typeof e.y === "number"
          ? { x: e.x, y: e.y }
          : zoneForEvent(e.type, e.side, e.id);

      const snd = soundRef.current;
      const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
      if (isGoal && e.side !== "neutral") {
        setScore((s) => {
          const next: Pair = [...s] as Pair;
          if (e.side === "home") next[0] += 1;
          else next[1] += 1;
          return next;
        });
        setLastScorer({ side: e.side, player: e.player, minute: e.minute });
        lastGoalRef.current = e;
        if (animate) {
          setGoalPulse({ side: e.side, key: Date.now(), player: e.player });
          if (coords) {
            setShotFx({ key: Date.now(), x: coords.x, y: coords.y, raised: true });
          }
          snd?.whistle(false); // el árbitro pita el gol
          snd?.goal();
        }
      }
      // Disparos: el balón viaja en arco hacia el destino.
      if (animate && (e.type === "shot" || e.type === "shot_on" || e.type === "chance" || e.type === "penalty_miss") && coords) {
        setShotFx({ key: Date.now(), x: coords.x, y: coords.y, raised: e.type !== "shot" });
      }
      if (animate && e.side !== "neutral") {
        if (e.type === "yellow" || e.type === "second_yellow") {
          setCardFx({ side: e.side, color: "#eab308", key: Date.now(), player: e.player });
          snd?.whistle(false); // falta sancionada
          snd?.card();
        } else if (e.type === "red") {
          setCardFx({ side: e.side, color: "#ef4444", key: Date.now(), player: e.player });
          snd?.whistle(false);
          snd?.card();
        } else if (e.type === "sub") {
          setSubFx({ side: e.side, key: Date.now(), playerOut: e.player, playerIn: e.playerIn });
          snd?.sub();
        } else if (e.type === "save") {
          snd?.save();
        } else if (e.type === "offside" || e.type === "penalty_miss") {
          snd?.whistle(false); // jugada interrumpida
        }
      }
      if (animate) {
        if (e.type === "kickoff") snd?.whistle(false);
        else if (e.type === "half_time" || e.type === "full_time") snd?.whistle(true);
      }
      if (coords) {
        setBall({ x: coords.x, y: coords.y });
      }
      const text = narrationFor(e);
      if (text) {
        setNarration(text);
        lastNarrAtRef.current = Date.now();
        if (animate && SPEAK_TYPES.has(e.type)) speak(text, isGoal || e.type === "red");
      }
      if (e.type === "half_time") setSecondHalf(true);
      if (e.type === "full_time") setFinished(true);
      setLog((l) => [e, ...l].slice(0, 60));
    },
    [narrationFor, speak],
  );

  // Carga del feed
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = sim ? "sim=1&ai=1" : "ai=1";
      const r = await fetch(`/api/match-center/live/${matchId}?${qs}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as MatchFeed;
      feedRef.current = data;
      firedRef.current = new Set();

      if (data.mode === "sim") {
        secRef.current = 0;
        setSec(0);
        setScore([0, 0]);
        setStats(statAt(data.statKeyframes, 0));
        setLog([]);
        setFinished(false);
        setSecondHalf(false);
        setBall({ x: 0.5, y: 0.5 });
        setLastScorer(null);
        setShowHighlights(false);
      } else {
        // live: marcar lo ya ocurrido sin animar
        for (const e of data.events) firedRef.current.add(e.id);
        secRef.current = data.elapsed * 60;
        setSec(data.elapsed * 60);
        setScore(data.score);
        setStats(data.stats);
        setLog([...data.events].reverse().slice(0, 60));
        setStatus(data.status);
        setKickoff(data.kickoff);
        setSecondHalf(data.elapsed >= 45 || data.status === "2H" || data.status === "ET");
        setFinished(data.status === "FT" || data.status === "AET" || data.status === "PEN");
      }
      setFeed(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [matchId, sim]);

  useEffect(() => {
    load();
  }, [load]);

  // Reloj + disparo de eventos (modo simulación)
  useEffect(() => {
    if (!feed || feed.mode !== "sim" || paused || finished) return;
    const script = feed;
    const interval = setInterval(() => {
      const dt = 0.25 * speed;
      secRef.current += dt;
      const t = secRef.current;
      setSec(t);
      setStats(statAt(script.statKeyframes, t));
      for (const e of script.events) {
        if (e.t <= t && !firedRef.current.has(e.id)) fireEvent(e, true);
      }
      if (t >= script.durationSeconds) {
        setFinished(true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [feed, paused, finished, speed, fireEvent]);

  // Reloj de display (modo live): solo corre con el partido EN JUEGO. Antes del
  // saque (NS) o en descanso (HT) se queda parado.
  useEffect(() => {
    if (!feed || feed.mode !== "live" || finished || !isInPlay(status)) return;
    const interval = setInterval(() => {
      secRef.current += 1;
      setSec(secRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [feed, finished, status]);

  // Polling de datos reales (modo live)
  useEffect(() => {
    if (!feed || feed.mode !== "live" || finished) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/match-center/live/${matchId}?ai=1`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as MatchFeed;
        if (data.mode !== "live") return;
        feedRef.current = data;
        secRef.current = data.elapsed * 60;
        setSec(secRef.current);
        setStats(data.stats);
        for (const e of data.events) {
          if (!firedRef.current.has(e.id)) fireEvent(e, true);
        }
        setScore(data.score);
        setStatus(data.status);
        setKickoff(data.kickoff);
        // Refresca también alineaciones/formación cuando la API las publica.
        setFeed(data);
        if (data.status === "FT" || data.status === "AET" || data.status === "PEN") setFinished(true);
      } catch {
        /* reintenta al siguiente tick */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [feed, finished, matchId, fireEvent]);

  // Mantiene statsRef sincronizado para el relleno ambiente (lee sin re-crear
  // su intervalo en cada actualización de stats).
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // Locución AMBIENTE: si pasan >60s reales sin nueva locución y el partido está
  // en juego, emite una frase de relleno (posesión/minuto, datos reales) para
  // que la cronología no se quede congelada. No usa TTS: no pisa la voz de los
  // eventos ni satura al usuario.
  useEffect(() => {
    if (!feed) return;
    const playing = feed.mode === "sim" ? !paused && !finished : isInPlay(status);
    if (!playing) return;
    const id = setInterval(() => {
      if (Date.now() - lastNarrAtRef.current < 60000) return;
      ambientSeedRef.current += 1;
      const possHome = statsRef.current.possession[0] || 50;
      setNarration(ambientLine(meta, possHome, secRef.current, ambientSeedRef.current));
      lastNarrAtRef.current = Date.now();
    }, 10000);
    return () => clearInterval(id);
  }, [feed, paused, finished, status, meta]);

  // Limpia el pulso de gol
  useEffect(() => {
    if (!goalPulse) return;
    const t = setTimeout(() => setGoalPulse(null), 3400);
    return () => clearTimeout(t);
  }, [goalPulse]);

  // Repetición instantánea del gol: al apagarse la celebración, recrea la
  // jugada en cámara lenta con la etiqueta "REPETICIÓN".
  useEffect(() => {
    if (!goalPulse) return;
    const e = lastGoalRef.current;
    if (!e || typeof e.x !== "number" || typeof e.y !== "number") return;
    const start = setTimeout(() => {
      setReplayTag(true);
      setShotFx({ key: Date.now(), x: e.x!, y: e.y!, raised: true, slow: true });
    }, 3500);
    const end = setTimeout(() => setReplayTag(false), 3500 + 2600);
    return () => { clearTimeout(start); clearTimeout(end); };
  }, [goalPulse]);

  // Limpia FX de tarjeta y cambio
  useEffect(() => {
    if (!cardFx) return;
    const t = setTimeout(() => setCardFx(null), 2700);
    return () => clearTimeout(t);
  }, [cardFx]);
  useEffect(() => {
    if (!subFx) return;
    const t = setTimeout(() => setSubFx(null), 3100);
    return () => clearTimeout(t);
  }, [subFx]);
  useEffect(() => {
    if (!shotFx) return;
    const t = setTimeout(() => setShotFx(null), 800);
    return () => clearTimeout(t);
  }, [shotFx]);

  // Resumen automático al terminar el partido.
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => setShowHighlights(true), 1200);
      return () => clearTimeout(t);
    }
    setShowHighlights(false);
  }, [finished]);

  function toggleVoice() {
    const s = speakerRef.current;
    if (!s) return;
    const next = !voiceOn;
    s.setEnabled(next);
    setVoiceOn(next);
    if (next) speak(narration || `Bienvenidos al ${meta.home.name} contra ${meta.away.name}.`, true);
  }

  function toggleSound() {
    const snd = soundRef.current;
    if (!snd) return;
    const next = !soundOn;
    snd.setEnabled(next); // resume() interno desbloquea el audio con este gesto
    setSoundOn(next);
    if (next) {
      snd.startAmbient();
      snd.setAmbient(Math.min(1, Math.abs(momentum) * 0.85 + 0.15));
      snd.whistle(false);
    } else {
      snd.stopAmbient();
    }
  }

  function replay() {
    speakerRef.current?.cancel();
    load();
  }

  // Revive un evento pasado: recoloca el balón, relanza sus FX y su locución
  // (sin alterar el marcador). Usado por la línea de tiempo y los destacados.
  const relive = useCallback((e: MatchEvent) => {
    const snd = soundRef.current;
    const coords =
      typeof e.x === "number" && typeof e.y === "number"
        ? { x: e.x, y: e.y }
        : zoneForEvent(e.type, e.side, e.id);
    if (coords) {
      setBall({ x: coords.x, y: coords.y });
      setShotFx({ key: Date.now(), x: coords.x, y: coords.y, raised: e.type !== "shot" });
    }
    const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
    if (isGoal && e.side !== "neutral") {
      setGoalPulse({ side: e.side, key: Date.now(), player: e.player });
      snd?.goal();
    } else if ((e.type === "yellow" || e.type === "second_yellow" || e.type === "red") && e.side !== "neutral") {
      setCardFx({ side: e.side, color: e.type === "red" ? "#ef4444" : "#eab308", key: Date.now(), player: e.player });
      snd?.card();
    } else if (e.type === "sub" && e.side !== "neutral") {
      setSubFx({ side: e.side, key: Date.now(), playerOut: e.player, playerIn: e.playerIn });
    }
    const text = feedRef.current?.narration[e.id];
    if (text) {
      setNarration(text);
      if (voiceOn) speakerRef.current?.speak(text, { priority: true });
    }
  }, [voiceOn]);

  const phase = useMemo(() => {
    if (finished) return "Final";
    const mm = Math.floor(sec / 60);
    const htFired = log.some((e) => e.type === "half_time");
    if (mm < 1) return "Previa";
    if (htFired && mm >= 45) return "2º tiempo";
    if (mm >= 45 && !htFired) return "Descanso";
    return "1º tiempo";
  }, [sec, finished, log]);

  // Momentum: ventaja instantánea de un equipo (-1 visitante .. +1 local).
  // Combina los eventos recientes (peso por tipo y por frescura) con la
  // desviación de posesión. Alimenta el medidor de ambiente y el sonido.
  const momentum = useMemo(() => {
    const WT: Record<string, number> = {
      goal: 1, penalty_goal: 1, chance: 0.6, shot_on: 0.5, shot: 0.3, corner: 0.22,
    };
    let acc = 0;
    let wsum = 0;
    log.slice(0, 14).forEach((e, idx) => {
      const recency = 1 - idx / 18;
      let w = WT[e.type] ?? 0;
      let side = e.side;
      if (e.type === "save") { w = 0.4; side = e.side === "home" ? "away" : "home"; } // parada => atacó el rival
      if (w === 0 || side === "neutral") return;
      acc += (side === "home" ? 1 : -1) * w * recency;
      wsum += w * recency;
    });
    const evMom = wsum > 0 ? acc / wsum : 0;
    const possMom = ((stats.possession[0] || 50) - 50) / 50;
    return Math.max(-1, Math.min(1, evMom * 0.7 + possMom * 0.3));
  }, [log, stats]);

  // Empuja la intensidad del ambiente al motor de sonido.
  useEffect(() => {
    if (!soundOn) return;
    soundRef.current?.setAmbient(Math.min(1, Math.abs(momentum) * 0.85 + 0.15));
  }, [momentum, soundOn]);

  // Pide al Coach IA una lectura del estado ACTUAL del partido. Reenvía lo que
  // el cliente ya tiene en pantalla (marcador, stats, eventos, momentum).
  const askLiveCoach = useCallback(async () => {
    setCoachOpen(true);
    setCoachLoading(true);
    setCoachError(null);
    const minute = Math.max(1, Math.floor(secRef.current / 60));
    // log está en orden inverso (más reciente primero): lo invertimos a cronológico.
    const events: LiveEventInput[] = [...log]
      .reverse()
      .slice(-20)
      .map((e) => ({
        minute: e.minute,
        extra: e.extra,
        type: e.type,
        side: e.side,
        player: e.player,
        detail: e.detail,
      }));
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 32_000);
    try {
      const r = await fetch("/api/ia-coach/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          state: { minute, phase, finished, score, stats, events, momentum },
        }),
        signal: ac.signal,
      });
      const data = (await r.json()) as IACoachLiveResponse | IACoachLiveErrorResponse;
      if (data.ok === false) {
        setCoachError(liveCoachError(data.error));
      } else if (data.ok === true) {
        setCoachAnalysis(data.analysis);
        setCoachCached(data.cached);
      } else {
        setCoachError("Respuesta inválida del servidor.");
      }
    } catch (err) {
      const e = err as Error;
      setCoachError(
        e.name === "AbortError"
          ? "El análisis tardó demasiado. Vuelve a intentarlo."
          : "No se pudo conectar con el coach.",
      );
    } finally {
      clearTimeout(timeoutId);
      setCoachLoading(false);
    }
  }, [log, matchId, phase, finished, score, stats, momentum]);

  const lineups = feed
    ? feed.mode === "sim"
      ? { home: feed.homeLineup, away: feed.awayLineup }
      : { home: feed.homeLineup, away: feed.awayLineup }
    : null;

  return (
    <div style={{ background: BG, color: "#fff", minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Oswald:wght@600;700&display=swap');
        @keyframes mcPulse{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
        @keyframes mcPop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes mcSlide{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes mcClock{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes mcChip{0%{transform:translateY(8px) scale(.9);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
        .mc-live-dot{width:8px;height:8px;border-radius:50%;background:${RED};display:inline-block;animation:mcPulse 1.2s infinite}
        .mc-num{font-family:'Oswald','Outfit',sans-serif;font-feature-settings:"tnum"}
        .mc-condensed{font-family:'Rajdhani','Outfit',sans-serif;letter-spacing:.5px}
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 16px 80px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link href="/app/matchcenter" style={{ color: MID, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeftIcon size={14} /> Match Center
          </Link>
          <span style={{ fontSize: 11, color: DIM }}>
            {meta.phase} · {meta.venue}, {meta.city}
          </span>
        </div>

        {loading && <Centered>Cargando partido…</Centered>}
        {error && <Centered>Error: {error} <button onClick={load} style={btnGhost}>Reintentar</button></Centered>}

        {feed && lineups && (
          <>
            {/* Previa: cabecera con cuenta atrás + análisis editorial antes de
                empezar. La foto del estadio y la previa son específicas del
                amistoso España-Irak (Riazor, id 9001). */}
            {feed.mode === "live" && !finished && !isInPlay(status) && status !== "HT" && (
              <>
                <PreMatchHero
                  meta={meta}
                  kickoff={kickoff}
                  image={matchId === 9001 ? "/img/matchcenter/riazor.jpg" : undefined}
                />
                {matchId === 9001 && <PreMatchPreview />}
              </>
            )}

            {/* Marcador. Antes del saque NO se muestra: la cabecera con cuenta
                atrás (PreMatchHero) ya hace de marcador previo, así evitamos el
                panel "VS / 21:00" duplicado. Aparece al arrancar (en juego),
                en descanso y al final. */}
            {!(feed.mode === "live" && !finished && !isInPlay(status) && status !== "HT") && (
            <div style={{ background: BG2, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", padding: "16px clamp(10px,4vw,20px)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                {feed.mode === "live" && isInPlay(status) && <span className="mc-live-dot" />}
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: finished ? MID : GREEN, textTransform: "uppercase" }}>
                  {feed.mode === "sim"
                    ? `Simulación · ${phase}`
                    : feed.mode === "live" && !finished && !isInPlay(status)
                      ? `${status === "HT" ? "Descanso" : "Previa"} · ${phase}`
                      : phase}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <TeamBlock name={meta.home.name} flag={meta.home.flag} color={meta.home.color} scorer={lastScorer?.side === "home" ? lastScorer : null} />
                <div style={{ textAlign: "center", flex: "0 0 auto", minWidth: 88 }}>
                  <div className="mc-num" style={{ fontSize: "clamp(34px,11vw,56px)", fontWeight: 700, lineHeight: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "clamp(6px,3vw,14px)" }}>
                    {feed.mode === "live" && !finished && !isInPlay(status) && status !== "HT" ? (
                      // Antes del saque: "VS" en vez de 0:0 (no parece resultado).
                      <span style={{ color: GOLD2, fontSize: "clamp(26px,8vw,40px)" }}>VS</span>
                    ) : (
                      <>
                        <span key={`hs-${score[0]}`} style={{ color: GOLD2, animation: "mcPop .4s ease" }}>{score[0]}</span>
                        <span style={{ color: DIM, fontSize: "clamp(22px,7vw,36px)" }}>:</span>
                        <span key={`as-${score[1]}`} style={{ color: GOLD2, animation: "mcPop .4s ease" }}>{score[1]}</span>
                      </>
                    )}
                  </div>
                  <div className="mc-num" style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: finished ? MID : GREEN, animation: feed.mode === "live" && isInPlay(status) && !finished ? "mcClock 1.6s ease infinite" : undefined }}>
                    {feed.mode === "live" && !finished && !isInPlay(status)
                      ? (status === "HT" ? "DESCANSO" : (fmtKickoff(kickoff)?.time ?? "PREVIA"))
                      : clockLabel(sec, finished)}
                  </div>
                </div>
                <TeamBlock name={meta.away.name} flag={meta.away.flag} color={meta.away.color} right scorer={lastScorer?.side === "away" ? lastScorer : null} />
              </div>
            </div>
            )}

            {/* Controles */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <button onClick={toggleVoice} disabled={!voiceAvailable} style={voiceOn ? btnGold : btnGhost}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MicIcon size={15} off={!voiceOn} /> {voiceOn ? "Locución ON" : "Locución OFF"}</span>
              </button>
              <button onClick={toggleSound} disabled={!soundAvailable} style={soundOn ? btnGold : btnGhost}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><SoundIcon size={15} off={!soundOn} /> {soundOn ? "Sonido ON" : "Sonido OFF"}</span>
              </button>
              {feed.mode === "sim" && (
                <>
                  <button onClick={() => setPaused((p) => !p)} disabled={finished} style={btnGhost}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{paused ? <PlayIcon size={13} /> : <PauseIcon size={13} />} {paused ? "Reanudar" : "Pausa"}</span>
                  </button>
                  <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: DIM, marginRight: 4 }}>Velocidad</span>
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => setSpeed(s)} style={speed === s ? btnGoldSm : btnGhostSm}>
                        {s}×
                      </button>
                    ))}
                  </div>
                </>
              )}
              {finished && (
                <button onClick={replay} style={btnGold}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ReliveIcon size={13} /> Repetir</span></button>
              )}
            </div>

            {/* Locución actual */}
            <div style={{ background: BG3, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, minHeight: 48, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", color: GOLD }}><MicIcon size={18} /></span>
              <span key={narration} style={{ fontSize: 15, fontWeight: 600, animation: "mcSlide .3s ease" }}>
                {narration || "El relato del partido aparecerá aquí…"}
              </span>
            </div>

            {/* Cancha: contenedor con ángulo de cámara (3D) + overlay de FX plano.
                La inclinación se ancla al borde INFERIOR para no invadir los
                paneles de abajo. */}
            {/* Controles de cámara/capas de la cancha */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, alignItems: "center" }}>
              <button onClick={() => setTactical((t) => !t)} style={tactical ? btnGoldSm : btnGhostSm}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{tactical ? <TacticalIcon size={14} /> : <CameraIcon size={14} />} {tactical ? "Vista táctica 2D" : "Vista cámara 3D"}</span>
              </button>
              <button onClick={() => setShowHeat((h) => !h)} style={showHeat ? btnGoldSm : btnGhostSm}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><HeatIcon size={14} /> {showHeat ? "Mapa de calor ON" : "Mapa de calor"}</span>
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: 26, borderRadius: 16, perspective: 1400, perspectiveOrigin: "50% 100%" }}>
              <div style={{ transform: tactical ? "rotateX(0deg)" : "rotateX(11deg)", transformOrigin: "50% 100%", borderRadius: 16, boxShadow: "0 26px 60px rgba(0,0,0,0.55)", transition: "transform .7s cubic-bezier(.22,1,.36,1)" }}>
                <Pitch
                  meta={meta}
                  homeLineup={lineups.home}
                  awayLineup={lineups.away}
                  ball={ball}
                  goalPulse={goalPulse}
                  shotFx={shotFx}
                  attackBias={(stats.possession[0] || 50) / 100}
                  active={feed.mode === "live" ? isInPlay(status) : !finished && !paused}
                  roam={feed.mode === "sim"}
                  flip={secondHalf}
                  intensity={Math.min(1, Math.abs(momentum) * 0.85 + 0.15)}
                  showHeat={showHeat}
                  log={log}
                  tactical={tactical}
                  onHoverPlayer={setHoverPlayer}
                />
              </div>
              <MatchFx meta={meta} goalPulse={goalPulse} cardFx={cardFx} subFx={subFx} />
              {feed.mode === "live" && !isInPlay(status) && !finished && (
                <div style={{ position: "absolute", inset: 0, zIndex: 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(6,11,20,0.55)", borderRadius: 16, pointerEvents: "none" }}>
                  <span className="mc-condensed" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: GOLD2 }}>
                    {status === "HT" ? "Descanso" : "Por comenzar"}
                  </span>
                  {status !== "HT" && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#cfd8ea" }}>
                      {(() => {
                        const ko = fmtKickoff(kickoff);
                        return ko ? `Saque ${ko.date} · ${ko.time}` : "Esperando el inicio";
                      })()}
                    </span>
                  )}
                </div>
              )}
              {hoverPlayer && (
                <PlayerCard player={hoverPlayer} meta={meta} />
              )}
              {replayTag && (
                <div style={{ position: "absolute", top: 12, left: 12, zIndex: 8, display: "flex", alignItems: "center", gap: 8, background: "rgba(11,24,37,0.9)", border: `1px solid ${RED}88`, borderRadius: 8, padding: "5px 12px", pointerEvents: "none" }}>
                  <span className="mc-live-dot" style={{ background: RED }} />
                  <span className="mc-condensed" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#fff" }}>Repetición · Cámara lenta</span>
                </div>
              )}
            </div>

            {/* Pulso / momentum + reacción del público */}
            <Momentum stats={stats} meta={meta} momentum={momentum} soundOn={soundOn} />

            {/* Coach IA en vivo (Modo 2) */}
            <div style={{ marginTop: 14 }}>
              <CoachLivePanel
                open={coachOpen}
                loading={coachLoading}
                error={coachError}
                analysis={coachAnalysis}
                cached={coachCached}
                meta={meta}
                finished={finished}
                onAsk={askLiveCoach}
              />
            </div>

            {/* Stats + Timeline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginTop: 14 }}>
              <StatsPanel stats={stats} meta={meta} />
              <Timeline log={log} meta={meta} onRelive={relive} />
              <MatchSummary log={log} meta={meta} />
              <Lineups lineups={lineups} meta={meta} allowPending={feed.mode === "live"} />
              {h2h && <H2HPanel h2h={h2h} meta={meta} />}
              <MatchInfo meta={meta} lineups={lineups} kickoff={kickoff} referee={feed.mode === "live" ? feed.referee : undefined} />
            </div>

            {/* Comentarios en vivo + compartir (leer es público; comentar exige
                registro). Solo en partidos reales (no en la simulación). */}
            {feed.mode === "live" && <CommentsPanel matchId={matchId} meta={meta} />}

            {/* Modo destacados al final */}
            {showHighlights && (
              <Highlights log={log} meta={meta} score={score} onRelive={relive} onClose={() => setShowHighlights(false)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 60, textAlign: "center", color: MID, fontSize: 15 }}>{children}</div>
  );
}

function TeamBlock({ name, flag, color, right, scorer }: { name: string; flag: string; color: string; right?: boolean; scorer?: { player?: string; minute: number } | null }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <img src={flagUrl(flag)} alt={name} style={{ width: "clamp(40px,12vw,56px)", height: "auto", aspectRatio: "3 / 2", borderRadius: 6, objectFit: "cover", border: `2px solid ${color}`, boxShadow: `0 0 0 1px rgba(0,0,0,0.4)` }} />
      <div className="mc-condensed" style={{ fontWeight: 700, fontSize: "clamp(11px,3.4vw,16px)", textAlign: "center", textTransform: "uppercase", lineHeight: 1.1, maxWidth: "100%" }}>{name}</div>
      {scorer && (
        <div key={`sc-${scorer.minute}-${scorer.player}`} style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: "100%", background: "rgba(201,168,76,0.14)", border: `1px solid ${GOLD}55`, borderRadius: 20, padding: "3px 10px", animation: "mcChip .4s ease" }}>
          <span style={{ display: "inline-flex" }}><BallIcon size={13} /></span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{scorer.player ? lastNameShort(scorer.player) : "Gol"}</span>
          <span className="mc-num" style={{ fontSize: 11, color: GOLD2, fontWeight: 700 }}>{scorer.minute}{"'"}</span>
        </div>
      )}
    </div>
  );
}

function lastNameShort(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

const POS_LABEL: Record<string, string> = { GK: "Portero", DF: "Defensa", MF: "Centrocampista", FW: "Delantero" };
function PlayerCard({ player, meta }: { player: { num: number; label: string; side: "home" | "away"; pos: string }; meta: MatchMeta }) {
  const team = player.side === "home" ? meta.home : meta.away;
  return (
    <div style={{
      position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 8,
      maxWidth: "92%", display: "flex", alignItems: "center", gap: 12, background: "rgba(11,24,37,0.96)",
      border: `1px solid rgba(255,255,255,0.14)`, borderLeft: `5px solid ${team.color}`,
      borderRadius: 12, padding: "10px 16px", backdropFilter: "blur(6px)", boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
      animation: "mcSlide .25s ease", pointerEvents: "none",
    }}>
      <div className="mc-num" style={{ fontSize: 30, fontWeight: 700, color: GOLD2, minWidth: 38, textAlign: "center" }}>{player.num}</div>
      <div>
        <div className="mc-condensed" style={{ fontSize: 18, fontWeight: 700, textTransform: "uppercase" }}>{player.label || `Dorsal ${player.num}`}</div>
        <div style={{ fontSize: 11, color: MID, fontWeight: 600 }}>
          {POS_LABEL[player.pos] || player.pos} · <span style={{ color: team.color }}>{team.name}</span>
        </div>
      </div>
      <img src={flagUrl(team.flag)} alt={team.name} style={{ width: 34, height: 23, borderRadius: 4, objectFit: "cover", marginLeft: 4 }} />
    </div>
  );
}

function crowdMood(intensity: number): { label: string; icon: string; color: string } {
  if (intensity >= 0.75) return { label: "Estadio en llamas", icon: "fire", color: "#ef4444" };
  if (intensity >= 0.5) return { label: "Afición encendida", icon: "mega", color: "#f59e0b" };
  if (intensity >= 0.28) return { label: "Ambiente vibrante", icon: "clap", color: GOLD };
  return { label: "Partido de tanteo", icon: "music", color: MID };
}

function Momentum({ stats, meta, momentum, soundOn }: { stats: LiveStats; meta: MatchMeta; momentum: number; soundOn: boolean }) {
  const [ph, pa] = stats.possession;
  const intensity = Math.min(1, Math.abs(momentum) * 0.85 + 0.15);
  const mood = crowdMood(intensity);
  // Posición de la aguja de momentum: 0% = visitante, 100% = local.
  const needle = ((momentum + 1) / 2) * 100;
  const leader = momentum > 0.08 ? meta.home : momentum < -0.08 ? meta.away : null;
  return (
    <div style={{ background: BG2, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
        <span>Pulso del partido</span>
        <span>xG {stats.xg[0].toFixed(2)} – {stats.xg[1].toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden" }}>
        <div style={{ width: `${ph}%`, background: meta.home.color, transition: "width .5s ease", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: 8, fontSize: 10, fontWeight: 800 }}>{ph}%</div>
        <div style={{ width: `${pa}%`, background: meta.away.color, transition: "width .5s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 10, fontWeight: 800 }}>{pa}%</div>
      </div>

      {/* Momentum: aguja que se inclina hacia quien presiona */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
        <span>Momentum</span>
        <span style={{ color: leader ? leader.color : MID }}>{leader ? `${leader.name} empuja` : "Equilibrado"}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${meta.away.color}, rgba(255,255,255,0.15) 50%, ${meta.home.color})`, overflow: "visible" }}>
        <div style={{
          position: "absolute", top: -3, left: `calc(${needle}% - 8px)`, width: 16, height: 16, borderRadius: "50%",
          background: "#fff", border: `3px solid ${leader ? leader.color : MID}`, transition: "left .6s cubic-bezier(.22,1,.36,1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }} />
      </div>

      {/* Reacción del público */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ display: "inline-flex", color: mood.color, animation: intensity >= 0.5 ? "mcPulse 0.9s infinite" : undefined }}><CrowdIcon mood={mood.icon} size={22} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            <span>Ambiente · {mood.label}</span>
            <span style={{ display: "inline-flex", color: soundOn ? GREEN : DIM }}><SoundIcon size={14} off={!soundOn} /></span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${intensity * 100}%`, height: "100%", background: mood.color, transition: "width .6s ease, background .6s ease" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const STAT_ROWS: { key: keyof LiveStats; label: string; color: string; pct?: boolean }[] = [
  { key: "shots", label: "Tiros", color: "#22c55e" },
  { key: "shotsOn", label: "A puerta", color: "#10b981" },
  { key: "possession", label: "Posesión", color: "#3b82f6", pct: true },
  { key: "passes", label: "Pases", color: "#f59e0b" },
  { key: "corners", label: "Córneres", color: "#a855f7" },
  { key: "fouls", label: "Faltas", color: "#ef4444" },
  { key: "saves", label: "Paradas", color: "#06b6d4" },
  { key: "yellow", label: "Amarillas", color: "#eab308" },
];

function StatsPanel({ stats, meta }: { stats: LiveStats; meta: MatchMeta }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Estadísticas</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STAT_ROWS.map((row) => {
          const [h, a] = stats[row.key] as Pair;
          const total = h + a || 1;
          const hw = row.pct ? h : Math.round((h / total) * 100);
          const aw = row.pct ? a : Math.round((a / total) * 100);
          return (
            <div key={row.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>{row.pct ? `${h}%` : h}</span>
                <span style={{ color: MID }}>{row.label}</span>
                <span style={{ fontWeight: 700 }}>{row.pct ? `${a}%` : a}</span>
              </div>
              <div style={{ display: "flex", gap: 6, height: 7 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: `${hw}%`, background: meta.home.color, transition: "width .5s ease" }} />
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${aw}%`, background: meta.away.color, transition: "width .5s ease" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RELIVE_TYPES = new Set([
  "goal", "penalty_goal", "own_goal", "yellow", "second_yellow", "red", "sub",
  "shot", "shot_on", "chance", "save", "penalty_miss",
]);

function Timeline({ log, meta, onRelive }: { log: MatchEvent[]; meta: MatchMeta; onRelive: (e: MatchEvent) => void }) {
  // Mini-tira visual de momentos clave (gol/tarjeta) para "scrub" rápido.
  const keyMoments = log.filter((e) => RELIVE_TYPES.has(e.type)).slice(0, 24).reverse();
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Minuto a minuto</h3>

      {keyMoments.length > 0 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {keyMoments.map((e) => {
            const side = e.side === "home" ? meta.home : e.side === "away" ? meta.away : null;
            const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
            return (
              <button key={e.id} onClick={() => onRelive(e)} title="Revivir jugada"
                style={{
                  flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  width: 50, padding: "6px 2px", borderRadius: 10, cursor: "pointer",
                  background: isGoal ? "rgba(201,168,76,0.16)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${side ? side.color + "55" : "rgba(255,255,255,0.1)"}`,
                }}>
                <EventIcon type={e.type} size={isGoal ? 22 : 18} />
                <span className="mc-num" style={{ fontSize: 10, fontWeight: 700, color: DIM }}>{e.minute}{"'"}</span>
              </button>
            );
          })}
        </div>
      )}

      {log.length === 0 && <div style={{ color: DIM, fontSize: 13 }}>Aún sin eventos…</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
        {log.map((e) => {
          const side = e.side === "home" ? meta.home : e.side === "away" ? meta.away : null;
          const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
          const can = RELIVE_TYPES.has(e.type);
          return (
            <div key={e.id} onClick={can ? () => onRelive(e) : undefined} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8,
              background: isGoal ? "rgba(201,168,76,0.1)" : "transparent",
              animation: "mcSlide .3s ease", cursor: can ? "pointer" : "default",
            }}>
              <span className="mc-num" style={{ fontSize: 11, fontWeight: 700, color: DIM, minWidth: 34 }}>
                {e.minute}{e.extra ? `+${e.extra}` : ""}{"'"}
              </span>
              <span style={{ minWidth: 22, display: "inline-flex", justifyContent: "center" }}><EventIcon type={e.type} size={16} /></span>
              <span style={{ fontSize: 13, fontWeight: isGoal ? 800 : 600, flex: 1 }}>
                {e.player ? `${e.player} ` : ""}
                <span style={{ color: side ? side.color : MID, fontWeight: 700 }}>{side ? side.name : ""}</span>
                {e.detail ? <span style={{ color: DIM }}> · {e.detail}</span> : ""}
              </span>
              {can && <span style={{ display: "inline-flex" }}><ReliveIcon size={13} /></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const POS_GROUPS: { key: string; label: string }[] = [
  { key: "GK", label: "Portero" },
  { key: "DF", label: "Defensa" },
  { key: "MF", label: "Medio" },
  { key: "FW", label: "Ataque" },
];

// Normaliza la posición a una de las 4 líneas. La simulación usa "GK/DF/MF/FW"
// pero api-football (datos reales) las da en una sola letra "G/D/M/F". Sin esto
// el agrupado fallaba y la lista de alineación salía vacía (solo la formación).
function posGroup(pos: string): string {
  const p = (pos || "").toUpperCase();
  if (p === "GK" || p === "G") return "GK";
  if (p === "DF" || p === "D") return "DF";
  if (p === "FW" || p === "F") return "FW";
  return "MF";
}

function TeamLineupCol({ team, lineup, right, allowPending }: { team: MatchMeta["home"]; lineup: TeamLineup; right?: boolean; allowPending?: boolean }) {
  // Alineación "por confirmar": en datos reales (live), api-football aún no ha
  // publicado el once oficial, así que los nombres vienen vacíos. En vez de
  // mostrar un XI ficticio ("Dorsal 1, 2…"), avisamos que falta confirmar.
  const pending = allowPending && lineup.starters.every((p) => !p.name);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexDirection: right ? "row-reverse" : "row", textAlign: right ? "right" : "left" }}>
        <img src={flagUrl(team.flag)} alt={team.name} style={{ width: 30, height: 20, borderRadius: 4, objectFit: "cover", border: `1px solid ${team.color}` }} />
        <div>
          <div className="mc-condensed" style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase", lineHeight: 1 }}>{team.name}</div>
          {!pending && <div className="mc-num" style={{ fontSize: 11, color: GOLD2, fontWeight: 700 }}>{lineup.formation}</div>}
        </div>
      </div>
      {pending ? (
        <div style={{ fontSize: 12, color: MID, fontWeight: 600, lineHeight: 1.5, padding: "6px 0" }}>
          Alineación oficial por confirmar. Se publicará en cuanto el seleccionador la anuncie (normalmente alrededor de una hora antes del saque).
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {POS_GROUPS.map((g) => {
          const rows = lineup.starters.filter((p) => posGroup(p.pos) === g.key);
          if (rows.length === 0) return null;
          return (
            <div key={g.key}>
              <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, textAlign: right ? "right" : "left" }}>{g.label}</div>
              {rows.map((p) => (
                <div key={p.num} style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 0", flexDirection: right ? "row-reverse" : "row" }}>
                  <span className="mc-num" style={{ flex: "0 0 auto", width: 22, height: 22, borderRadius: 6, background: team.color, color: "#fff", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{p.num}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name ? lastNameShort(p.name) : `Dorsal ${p.num}`}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// Resumen del partido derivado del log real: goleadores (con asistencias) y
// tarjetas por equipo. No inventa datos: solo agrega lo ya ocurrido.
const GOAL_TYPES = new Set(["goal", "penalty_goal", "own_goal"]);
function minuteLabel(e: MatchEvent): string {
  return `${e.minute}${e.extra ? `+${e.extra}` : ""}'`;
}
function MatchSummary({ log, meta }: { log: MatchEvent[]; meta: MatchMeta }) {
  const data = useMemo(() => {
    const ev = [...log].sort((a, b) => a.t - b.t);
    const side = (s: MatchEvent["side"]) => (s === "home" ? "home" : s === "away" ? "away" : null);
    const scorers: Record<"home" | "away", MatchEvent[]> = { home: [], away: [] };
    const cards: Record<"home" | "away", { y: number; r: number }> = { home: { y: 0, r: 0 }, away: { y: 0, r: 0 } };
    const assists: Record<"home" | "away", { name: string; minute: string }[]> = { home: [], away: [] };
    for (const e of ev) {
      const sd = side(e.side);
      if (!sd) continue;
      if (GOAL_TYPES.has(e.type)) {
        // gol en propia: cuenta para el rival
        const benef = e.type === "own_goal" ? (sd === "home" ? "away" : "home") : sd;
        scorers[benef].push(e);
        if (e.assist) assists[sd].push({ name: lastNameShort(e.assist), minute: minuteLabel(e) });
      } else if (e.type === "yellow" || e.type === "second_yellow") {
        cards[sd].y++;
      } else if (e.type === "red") {
        cards[sd].r++;
      }
    }
    return { scorers, cards, assists };
  }, [log]);

  const hasAny =
    data.scorers.home.length || data.scorers.away.length ||
    data.cards.home.y || data.cards.home.r || data.cards.away.y || data.cards.away.r;
  if (!hasAny) return null;

  const col = (team: MatchMeta["home"], sd: "home" | "away", right?: boolean) => {
    const goals = data.scorers[sd];
    const cards = data.cards[sd];
    const assists = data.assists[sd];
    return (
      <div style={{ textAlign: right ? "right" : "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexDirection: right ? "row-reverse" : "row" }}>
          <img src={flagUrl(team.flag)} alt={team.name} style={{ width: 30, height: 20, borderRadius: 4, objectFit: "cover", border: `1px solid ${team.color}` }} />
          <div className="mc-condensed" style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase", lineHeight: 1 }}>{team.name}</div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Goleadores</div>
        {goals.length === 0 ? (
          <div style={{ fontSize: 12, color: DIM, marginBottom: 8 }}>—</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
            {goals.map((e) => (
              <div key={e.id} style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <BallIcon size={12} /> {e.player ? lastNameShort(e.player) : "Gol"}{e.type === "penalty_goal" ? " (p)" : e.type === "own_goal" ? " (p.p.)" : ""}{" "}
                <span className="mc-num" style={{ color: GOLD2, fontWeight: 700 }}>{minuteLabel(e)}</span>
              </div>
            ))}
          </div>
        )}
        {assists.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Asistencias</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
              {assists.map((a, i) => (
                <div key={i} style={{ fontSize: 12, fontWeight: 600, color: MID, display: "flex", alignItems: "center", gap: 5 }}><BootIcon size={13} /> {a.name} <span className="mc-num" style={{ color: GOLD2 }}>{a.minute}</span></div>
              ))}
            </div>
          </>
        )}
        <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Tarjetas</div>
        <div style={{ display: "flex", gap: 12, justifyContent: right ? "flex-end" : "flex-start" }}>
          <span style={{ fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}><EventIcon type="yellow" size={13} /> <span className="mc-num">{cards.y}</span></span>
          <span style={{ fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}><EventIcon type="red" size={13} /> <span className="mc-num">{cards.r}</span></span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Resumen del partido</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {col(meta.home, "home")}
        {col(meta.away, "away", true)}
      </div>
    </div>
  );
}

function H2HPanel({ h2h, meta }: { h2h: H2HData; meta: MatchMeta }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Historial · {meta.home.name} vs {meta.away.name}</h3>
      {h2h.recordText && <div style={{ fontSize: 12, color: GOLD2, fontWeight: 700, marginBottom: 12 }}>{h2h.recordText}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {h2h.matches.slice(0, 8).map((m, i) => {
          const score = m.goalsHome !== null && m.goalsAway !== null ? `${m.goalsHome} - ${m.goalsAway}` : "—";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
              <span className="mc-num" style={{ flex: "0 0 auto", fontSize: 10, color: DIM, width: 64 }}>{m.date.slice(0, 10)}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.homeTeam}</span>
              <span className="mc-num" style={{ flex: "0 0 auto", fontSize: 13, fontWeight: 700, color: GOLD2 }}>{score}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.awayTeam}</span>
              {m.competition && <span style={{ flex: "0 0 auto", fontSize: 9, color: DIM, textTransform: "uppercase", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.competition}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Lineups({ lineups, meta, allowPending }: { lineups: { home: TeamLineup; away: TeamLineup }; meta: MatchMeta; allowPending?: boolean }) {
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Alineaciones</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <TeamLineupCol team={meta.home} lineup={lineups.home} allowPending={allowPending} />
        <TeamLineupCol team={meta.away} lineup={lineups.away} right allowPending={allowPending} />
      </div>
    </div>
  );
}

function MatchInfo({ meta, lineups, kickoff, referee }: { meta: MatchMeta; lineups: { home: TeamLineup; away: TeamLineup }; kickoff?: string; referee?: string }) {
  // Si hay saque real (datos en vivo), mostramos fecha/hora reales en la zona
  // horaria del usuario; si no, caemos a los del meta.
  const ko = fmtKickoff(kickoff);
  const rows: [string, string][] = [
    ["Estadio", meta.venue],
    ["Ciudad", meta.city],
    ["Fecha", ko?.date ?? meta.date],
    ["Hora", ko ? `${ko.time} (tu hora local)` : meta.time],
    ["Fase", meta.phase],
    ["Grupo", meta.group],
    ["Árbitro", referee ?? ""],
    [`Formación ${meta.home.name}`, lineups.home.formation],
    [`Formación ${meta.away.name}`, lineups.away.formation],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Ficha del partido</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Resumen animado de goles y tarjetas al final del partido.
function Highlights({ log, meta, score, onRelive, onClose }: { log: MatchEvent[]; meta: MatchMeta; score: Pair; onRelive: (e: MatchEvent) => void; onClose: () => void }) {
  const moments = useMemo(
    () => [...log].filter((e) => ["goal", "penalty_goal", "own_goal", "red", "yellow", "second_yellow"].includes(e.type))
      .sort((a, b) => a.t - b.t),
    [log],
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(4,8,16,0.82)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "mcSlide .3s ease" }}>
      <div style={{ width: "min(560px,100%)", maxHeight: "86vh", overflowY: "auto", background: BG2, borderRadius: 20, border: `1px solid ${GOLD}44`, padding: 22, boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="mc-condensed" style={{ fontSize: 22, fontWeight: 700, color: GOLD2, textTransform: "uppercase", margin: 0 }}>Destacados</h3>
          <button onClick={onClose} style={btnGhostSm}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><CloseIcon size={12} /> Cerrar</span></button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="mc-condensed" style={{ fontSize: 14, color: MID, textTransform: "uppercase", marginBottom: 6 }}>{meta.home.name} vs {meta.away.name}</div>
          <div className="mc-num" style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>{score[0]} : {score[1]}</div>
        </div>
        {moments.length === 0 && <div style={{ color: DIM, fontSize: 14, textAlign: "center", padding: 20 }}>Sin goles ni tarjetas para destacar.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {moments.map((e, i) => {
            const side = e.side === "home" ? meta.home : e.side === "away" ? meta.away : null;
            const isGoal = e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
            return (
              <button key={e.id} onClick={() => onRelive(e)} style={{
                display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                background: isGoal ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${side ? side.color + "44" : "rgba(255,255,255,0.1)"}`,
                animation: "mcSlide .3s ease", animationDelay: `${i * 0.05}s`, animationFillMode: "backwards",
                color: "#fff",
              }}>
                <EventIcon type={e.type} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{e.player || (isGoal ? "Gol" : "Jugada")}</div>
                  <div style={{ fontSize: 11, color: side ? side.color : MID, fontWeight: 700 }}>{side ? side.name : ""}{e.detail ? ` · ${e.detail}` : ""}</div>
                </div>
                <span className="mc-num" style={{ fontSize: 14, fontWeight: 700, color: GOLD2 }}>{e.minute}{e.extra ? `+${e.extra}` : ""}{"'"}</span>
                <span style={{ fontSize: 12, color: GOLD, display: "inline-flex", alignItems: "center", gap: 4 }}><ReliveIcon size={12} /> Revivir</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = { padding: "9px 14px", borderRadius: 10, background: BG2, border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const btnGold: React.CSSProperties = { padding: "9px 14px", borderRadius: 10, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: BG, fontWeight: 800, fontSize: 13, cursor: "pointer" };
const btnGhostSm: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, background: BG2, border: "1px solid rgba(255,255,255,0.12)", color: MID, fontWeight: 700, fontSize: 12, cursor: "pointer" };
const btnGoldSm: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: BG, fontWeight: 800, fontSize: 12, cursor: "pointer" };

function liveCoachError(code: string): string {
  switch (code) {
    case "match_not_found":
      return "No encontramos este partido.";
    case "context_build_failed":
      return "No pudimos preparar los datos del análisis.";
    case "anthropic_failed":
      return "El Coach IA no respondió. Inténtalo en unos segundos.";
    default:
      return "Algo falló. Inténtalo de nuevo.";
  }
}

// Panel del Coach IA en vivo: botón para pedir la lectura del momento + render
// del análisis (titular, situación, momentum, probabilidades de resultado final,
// observaciones, ajustes por equipo y qué esperar).
function CoachLivePanel({
  open,
  loading,
  error,
  analysis,
  cached,
  meta,
  finished,
  onAsk,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  analysis: IACoachLiveAnalysis | null;
  cached: boolean;
  meta: MatchMeta;
  finished: boolean;
  onAsk: () => void;
}) {
  const momentumName =
    analysis?.momentumTeam === "home"
      ? meta.home.name
      : analysis?.momentumTeam === "away"
        ? meta.away.name
        : "Equilibrado";
  const momentumColor =
    analysis?.momentumTeam === "home"
      ? meta.home.color
      : analysis?.momentumTeam === "away"
        ? meta.away.color
        : MID;

  return (
    <div style={{ background: BG2, borderRadius: 16, border: `1px solid ${GOLD}33`, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: analysis || loading || error ? 14 : 0 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: GOLD2, textTransform: "uppercase", letterSpacing: 1, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex" }}><SparkleIcon size={14} /></span> Coach IA en vivo
        </h3>
        <button onClick={onAsk} disabled={loading} style={loading ? { ...btnGhostSm, opacity: 0.6 } : btnGoldSm}>
          {loading ? "Analizando…" : analysis ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><ReliveIcon size={12} /> Actualizar lectura</span> : finished ? "Lectura del partido" : "Pedir lectura del momento"}
        </button>
      </div>

      {!open && (
        <p style={{ fontSize: 12, color: DIM, margin: "8px 0 0" }}>
          Pide al analista una lectura táctica del estado actual: quién manda, probabilidades de resultado y qué esperar.
        </p>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: MID, fontSize: 13 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${GOLD}`, borderTopColor: "transparent", display: "inline-block", animation: "mcPulse 0.9s linear infinite" }} />
          El analista está leyendo el partido…
        </div>
      )}

      {error && !loading && (
        <div style={{ fontSize: 13, color: RED }}>
          {error}{" "}
          <button onClick={onAsk} style={{ ...btnGhostSm, marginLeft: 6 }}>Reintentar</button>
        </div>
      )}

      {analysis && !loading && (
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 6 }}>
            {analysis.headline}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.84)", lineHeight: 1.55, margin: "0 0 14px" }}>
            {analysis.situation}
          </p>

          {/* Momentum + confianza */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: `1px solid ${momentumColor}66`, color: momentumColor }}>
              Momentum: {momentumName}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: MID }}>
              Confianza {analysis.confidence}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(201,168,76,0.14)", border: `1px solid ${GOLD}55`, color: GOLD2 }}>
              Marcador proyectado {analysis.projectedScore}
            </span>
            {cached && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: DIM }}>
                Cache
              </span>
            )}
          </div>

          {/* Probabilidades de resultado final */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            <LiveProb label={meta.home.name} value={analysis.winProbabilities.home} color={meta.home.color} />
            <LiveProb label="Empate" value={analysis.winProbabilities.draw} color={MID} />
            <LiveProb label={meta.away.name} value={analysis.winProbabilities.away} color={meta.away.color} />
          </div>

          {/* Observaciones */}
          {analysis.keyObservations.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: GOLD2, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Lo que dicen los datos</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.keyObservations.map((o, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", paddingLeft: 14, position: "relative", lineHeight: 1.4 }}>
                    <span style={{ position: "absolute", left: 0, top: 3, display: "inline-flex" }}><ChevronRightIcon size={11} /></span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ajustes tácticos por equipo */}
          {analysis.adjustments && (analysis.adjustments.home || analysis.adjustments.away) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 14 }}>
              {analysis.adjustments.home && (
                <LiveAdjustment team={meta.home} text={analysis.adjustments.home} />
              )}
              {analysis.adjustments.away && (
                <LiveAdjustment team={meta.away} text={analysis.adjustments.away} />
              )}
            </div>
          )}

          {/* Qué esperar */}
          <div style={{ background: BG3, border: `1px solid ${GOLD}22`, borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: GOLD2, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Qué esperar</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>{analysis.watchNext}</div>
          </div>

          {/* Datos no disponibles (transparencia) */}
          {analysis.missingData && analysis.missingData.length > 0 && (
            <div style={{ marginTop: 10, border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 12, padding: "9px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                Sin datos para
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5 }}>
                {analysis.missingData.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ marginTop: 12, fontSize: 10, color: DIM, fontStyle: "italic", textAlign: "center" }}>
            Lectura generada por IA a partir del estado del partido.
          </p>
        </div>
      )}
    </div>
  );
}

function LiveProb({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ flex: "0 0 auto", width: 96, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(2, pct)}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s ease" }} />
      </div>
      <span className="mc-num" style={{ flex: "0 0 auto", width: 36, textAlign: "right", fontSize: 12, fontWeight: 700, color: GOLD2 }}>{pct}%</span>
    </div>
  );
}

function LiveAdjustment({ team, text }: { team: MatchMeta["home"]; text: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderLeft: `4px solid ${team.color}`, borderRadius: 10, padding: "8px 12px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: team.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Ajuste · {team.name}</div>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>{text}</div>
    </div>
  );
}
