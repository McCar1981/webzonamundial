"use client";
/* eslint-disable @next/next/no-img-element */

// src/app/app/draft-mundial/jugar/page.tsx
// Juego Draft Mundial — Nueva mecánica: elegí cualquier jugador de la selección

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { FREE_LIMITS, PRO_PRICE_DISPLAY } from "@/lib/pro/limits";
import {
  DraftPosicion,
  FormacionKey,
  Estilo,
  Modo,
  DraftResultado,
  JugadorSeleccionado,
} from "@/lib/draft/types";
import { FORMACIONES } from "@/lib/draft/formaciones";
import { SlotLayout } from "@/lib/draft/layout";
import {
  getColorCalificacion,
  getNearMiss,
} from "@/lib/draft/simulacion";
import { DraftLogro } from "@/lib/draft/logros";
import { generarCampana, Campana, CampanaPartido, calcularBonusCampana } from "@/lib/draft/campana";
import { RecompensaDraft } from "@/lib/draft/recompensa";
import { draftKitUrl, KIT_FALLBACK } from "@/lib/draft/kit";
import { useDraftGame } from "../hooks/useDraftGame";
import SoccerField from "../components/SoccerField";
import {
  IconTrophy, IconDice, IconShield, IconScale, IconSwords,
  IconChart, IconBook, IconTimer, IconLink, IconTarget,
  IconShare, IconRefresh, IconBolt, IconArrowLeft,
  IconCalificacion, IconLogro, IconGlobe, IconFlame,
} from "../components/DraftIcons";
import FlagImage from "@/components/FlagImage";

const NAVY = "#0a1729";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TXT = "#eef2fb";
const TXT_MUT = "#93a1bd";
const CARD = "#111d32";
const CARD_HOV = "#1a2744";
const RED = "#ef4444";
const GREEN = "#22c55e";

// Código ISO (alpha-2, o gb-eng para Inglaterra) por selección histórica,
// para mostrar banderas reales con <FlagImage> en vez de emoji.
const SELECCION_ISO: Record<string, string> = {
  Brasil: "br", Argentina: "ar", Alemania: "de", Holanda: "nl",
  Francia: "fr", España: "es", Italia: "it", Uruguay: "uy",
  Hungría: "hu", Inglaterra: "gb-eng", Portugal: "pt",
  Croacia: "hr", Marruecos: "ma",
};

function seleccionISO(seleccion: string): string {
  return SELECCION_ISO[seleccion] || "";
}

function posicionLabel(p: DraftPosicion): string {
  const labels: Record<DraftPosicion, string> = {
    GOL: "POR", LD: "LD", ZAG: "CT", LE: "LI",
    VOL: "VOL", MEI: "MED", EXT: "EXT",
    CA: "DC", PD: "ED", PI: "EI", MCD: "MCD",
  };
  return labels[p] || p;
}

function posicionColor(p: DraftPosicion): string {
  if (p === "GOL") return "#3b82f6";
  if (["LD", "ZAG", "LE"].includes(p)) return "#22c55e";
  if (["VOL", "MEI", "MCD"].includes(p)) return "#f59e0b";
  return "#ef4444";
}

function KitAvatar({ seleccion, size = 40 }: { seleccion: string; size?: number }) {
  const src = draftKitUrl(seleccion);
  const fb = KIT_FALLBACK[seleccion];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: fb?.bg ?? "#e2e8f0", border: `2px solid ${GOLD}55`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>
      {src ? (
        <img src={src} alt={seleccion} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: size * 0.28, fontWeight: 700, color: fb?.text ?? "#fff" }}>
          {seleccion.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}>
      {children}
    </div>
  );
}

/* ─────────── Dado 3D ─────────── */
const PIP_STYLE: Record<string, React.CSSProperties> = {
  tl: { top: "15%", left: "15%" },
  tr: { top: "15%", right: "15%" },
  ml: { top: "50%", left: "15%", transform: "translateY(-50%)" },
  c:  { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  mr: { top: "50%", right: "15%", transform: "translateY(-50%)" },
  bl: { bottom: "15%", left: "15%" },
  br: { bottom: "15%", right: "15%" },
};
const FACE_PIPS: Record<number, string[]> = {
  1: ["c"],
  2: ["tr", "bl"],
  3: ["tr", "c", "bl"],
  4: ["tl", "tr", "bl", "br"],
  5: ["tl", "tr", "c", "bl", "br"],
  6: ["tl", "tr", "ml", "mr", "bl", "br"],
};

function DieFace({ face, transform }: { face: number; transform: string }) {
  return (
    <div style={{
      position: "absolute", width: "100%", height: "100%",
      background: CARD, border: `1.5px solid ${GOLD}55`,
      borderRadius: 10, backfaceVisibility: "hidden",
      transform,
    }}>
      {FACE_PIPS[face].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", width: 11, height: 11,
          borderRadius: "50%", background: GOLD, ...PIP_STYLE[pos],
        }} />
      ))}
    </div>
  );
}

function Dice3D({ rolling, onRollEnd }: { rolling: boolean; onRollEnd: () => void }) {
  const S = 72;
  const H = S / 2;
  return (
    <div style={{ perspective: 260, width: S, height: S }}>
      <div
        className={rolling ? "animate-dice-roll" : ""}
        style={{ width: S, height: S, position: "relative", transformStyle: "preserve-3d" }}
        onAnimationEnd={onRollEnd}
      >
        <DieFace face={1} transform={`translateZ(${H}px)`} />
        <DieFace face={6} transform={`rotateY(180deg) translateZ(${H}px)`} />
        <DieFace face={3} transform={`rotateY(90deg) translateZ(${H}px)`} />
        <DieFace face={4} transform={`rotateY(-90deg) translateZ(${H}px)`} />
        <DieFace face={2} transform={`rotateX(90deg) translateZ(${H}px)`} />
        <DieFace face={5} transform={`rotateX(-90deg) translateZ(${H}px)`} />
      </div>
    </div>
  );
}

/* ─────────── Confetti ─────────── */
function Confetti() {
  const [pieces] = useState(() => {
    const colors = [GOLD, "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9", "#fd79a8"];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2 + Math.random() * 3,
    }));
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="absolute w-2 h-2 rounded-sm" style={{
          left: `${p.x}%`, top: "-10px", background: p.color,
          animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`, opacity: 0,
        }} />
      ))}
      <style jsx>{`@keyframes confetti-fall { 0%{transform:translateY(0)rotate(0deg);opacity:1} 100%{transform:translateY(100vh)rotate(720deg);opacity:0} }`}</style>
    </div>
  );
}

/* ─────────── SetupScreen ─────────── */
const SETUP_BG_DEEP = "#060B14";
const SETUP_CARD = "#0F1D32";
const SETUP_CARD_HI = "#16294a";

// Microcopy táctico por formación (sensación de panel de juego).
const FORM_MICRO: Record<FormacionKey, string> = {
  "4-3-3": "Bandas rápidas",
  "4-4-2": "Doble 9",
  "4-2-3-1": "Media punta",
  "4-2-4": "Ataque total",
  "3-5-2": "Control medio",
  "5-3-2": "Bloque bajo",
  "4-5-1": "Compacto",
  "3-4-3": "Presión alta",
};

const ESTILO_LABEL: Record<Estilo, string> = {
  defensivo: "Defensivo", equilibrado: "Equilibrado", ofensivo: "Ofensivo",
};
const MODO_LABEL: Record<Modo, string> = {
  clasico: "Clásico", almanaque: "Almanaque", contrarreloj: "Contrarreloj",
};

const ESTILOS: { key: Estilo; label: string; icon: typeof IconShield; desc: string; accent: string }[] = [
  { key: "defensivo", label: "Defensivo", icon: IconShield, desc: "Bonus por defensa", accent: "#7aa0d6" },
  { key: "equilibrado", label: "Equilibrado", icon: IconScale, desc: "Sin bonus ni penal", accent: GOLD2 },
  { key: "ofensivo", label: "Ofensivo", icon: IconFlame, desc: "Bonus por ataque", accent: "#ef7a5c" },
];

const MODOS: { key: Modo; label: string; icon: typeof IconChart; desc: string; badge: string; badgeColor: string }[] = [
  { key: "clasico", label: "Clásico", icon: IconChart, desc: "Con stats", badge: "Recomendado", badgeColor: GOLD },
  { key: "almanaque", label: "Almanaque", icon: IconBook, desc: "Sin stats", badge: "Experto", badgeColor: "#a78bfa" },
  { key: "contrarreloj", label: "Contrarreloj", icon: IconTimer, desc: "10 seg", badge: "Rápido", badgeColor: "#5ec8c8" },
];

// Marca de selección (check dorado sobre disco navy).
function CheckBadge() {
  return (
    <span style={{
      position: "absolute", top: 6, right: 6, width: 17, height: 17, borderRadius: "50%",
      background: NAVY, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={GOLD2} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function SectionLabel({ children, paso }: { children: React.ReactNode; paso?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ width: 3, height: 14, borderRadius: 2, background: `linear-gradient(${GOLD},${GOLD2})` }} />
      <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>{children}</span>
      {paso && <span className="text-[10px] font-bold ml-auto" style={{ color: TXT_MUT }}>Paso {paso}/3</span>}
    </div>
  );
}

function SetupScreen({
  formacion, setFormacion, estilo, setEstilo, modo, setModo, onStart,
}: {
  formacion: FormacionKey; setFormacion: (f: FormacionKey) => void;
  estilo: Estilo; setEstilo: (e: Estilo) => void;
  modo: Modo; setModo: (m: Modo) => void;
  onStart: () => void;
}) {
  const resumen = `Formación ${formacion} · ${ESTILO_LABEL[estilo]} · ${MODO_LABEL[modo]}`;

  return (
    <div className="relative max-w-lg mx-auto px-4 pt-4">
      <style jsx global>{`
        @keyframes dm-glow-pulse { 0%,100% { opacity:.5 } 50% { opacity:.85 } }
        .dm-cta-wrap { position: sticky; bottom: 14px; z-index: 30; }
        @media (max-width: 768px) {
          .dm-cta-wrap { bottom: calc(60px + env(safe-area-inset-bottom)); }
        }
      `}</style>

      {/* Capas de fondo: glow dorado radial + líneas tácticas tenues */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-2 h-72 -z-10"
        style={{ background: `radial-gradient(60% 70% at 50% 0%, ${GOLD}22, transparent 70%)`, animation: "dm-glow-pulse 6s ease-in-out infinite" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 .5H40M.5 0V40' stroke='%23c9a84c' stroke-width='.5'/%3E%3C/svg%3E\")" }} />

      {/* ── HERO CARD ── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl px-5 py-6 mb-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${SETUP_CARD} 0%, ${SETUP_BG_DEEP} 100%)`,
            border: `1px solid ${GOLD}33`,
            boxShadow: `0 12px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}>
          {/* Líneas tácticas casi invisibles dentro del hero */}
          <svg aria-hidden className="absolute left-1/2 -translate-x-1/2 -top-6 opacity-[0.12]" width="320" height="200" viewBox="0 0 320 200" fill="none" stroke={GOLD} strokeWidth="1">
            <circle cx="160" cy="100" r="46" />
            <line x1="0" y1="100" x2="320" y2="100" />
            <rect x="120" y="0" width="80" height="34" />
          </svg>
          {/* Brillo superior dorado */}
          <div aria-hidden className="absolute inset-x-10 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD2}, transparent)` }} />

          <div className="relative flex justify-center mb-2">
            <div className="flex items-center justify-center rounded-2xl" style={{ width: 64, height: 64, background: `radial-gradient(circle, ${GOLD}33, transparent 70%)` }}>
              <IconTrophy size={42} color={GOLD2} />
            </div>
          </div>
          <h1 className="relative text-2xl font-black tracking-tight" style={{ color: TXT }}>Draft Mundial</h1>
          <p className="relative text-sm mt-1.5 leading-snug" style={{ color: TXT_MUT }}>
            Arma tu once ideal con leyendas de todas las Copas del Mundo
          </p>
        </div>
      </FadeIn>

      {/* ── FORMACIÓN ── */}
      <FadeIn delay={0.08}>
        <div className="mb-6">
          <SectionLabel paso={1}>Formación</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {FORMACIONES.map((f) => {
              const sel = formacion === f.key;
              return (
                <button key={f.key} onClick={() => setFormacion(f.key)}
                  className="relative rounded-xl px-1.5 py-2.5 transition-all duration-150 active:scale-[0.96] hover:-translate-y-0.5 border text-center"
                  style={{
                    background: sel ? `linear-gradient(150deg, ${GOLD2}, ${GOLD})` : SETUP_CARD,
                    borderColor: sel ? GOLD2 : "rgba(255,255,255,0.09)",
                    boxShadow: sel
                      ? `0 6px 18px ${GOLD}55, inset 0 1px 0 rgba(255,255,255,0.35)`
                      : "0 2px 8px rgba(0,0,0,0.3)",
                  }}>
                  {sel && <CheckBadge />}
                  <div className="text-[15px] font-black leading-none tabular-nums" style={{ color: sel ? NAVY : TXT }}>{f.label}</div>
                  <div className="text-[8.5px] font-bold mt-1 leading-tight" style={{ color: sel ? "rgba(10,23,41,0.7)" : TXT_MUT }}>
                    {FORM_MICRO[f.key]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* ── ESTILO DE JUEGO ── */}
      <FadeIn delay={0.16}>
        <div className="mb-6">
          <SectionLabel paso={2}>Estilo de juego</SectionLabel>
          <div className="grid grid-cols-3 gap-2.5">
            {ESTILOS.map((s) => {
              const sel = estilo === s.key;
              return (
                <button key={s.key} onClick={() => setEstilo(s.key)}
                  className="relative rounded-xl px-2 py-3.5 transition-all duration-150 active:scale-[0.97] hover:-translate-y-0.5 border text-center"
                  style={{
                    background: sel ? `linear-gradient(160deg, ${GOLD2}, ${GOLD})` : SETUP_CARD,
                    borderColor: sel ? GOLD2 : `${s.accent}44`,
                    boxShadow: sel ? `0 8px 22px ${GOLD}55` : "0 2px 10px rgba(0,0,0,0.3)",
                  }}>
                  {sel && <CheckBadge />}
                  <div className="flex justify-center mb-1.5">
                    <div className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, background: sel ? "rgba(10,23,41,0.14)" : `${s.accent}1f` }}>
                      <s.icon size={18} color={sel ? NAVY : s.accent} />
                    </div>
                  </div>
                  <div className="text-[13px] font-extrabold leading-none" style={{ color: sel ? NAVY : TXT }}>{s.label}</div>
                  <div className="text-[10px] font-semibold mt-1 leading-tight" style={{ color: sel ? "rgba(10,23,41,0.7)" : TXT_MUT }}>{s.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* ── MODO DE DIFICULTAD ── */}
      <FadeIn delay={0.24}>
        <div className="mb-6">
          <SectionLabel paso={3}>Modo de dificultad</SectionLabel>
          <div className="grid grid-cols-3 gap-2.5">
            {MODOS.map((m) => {
              const sel = modo === m.key;
              return (
                <button key={m.key} onClick={() => setModo(m.key)}
                  className="relative rounded-xl px-2 pt-5 pb-3.5 transition-all duration-150 active:scale-[0.97] hover:-translate-y-0.5 border text-center"
                  style={{
                    background: sel ? `linear-gradient(160deg, ${GOLD2}, ${GOLD})` : SETUP_CARD,
                    borderColor: sel ? GOLD2 : "rgba(255,255,255,0.09)",
                    boxShadow: sel ? `0 8px 22px ${GOLD}55` : "0 2px 10px rgba(0,0,0,0.3)",
                  }}>
                  {/* Badge del modo */}
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: sel ? NAVY : `${m.badgeColor}22`, color: sel ? GOLD2 : m.badgeColor, border: `1px solid ${sel ? "transparent" : `${m.badgeColor}55`}` }}>
                    {m.badge}
                  </span>
                  {sel && <CheckBadge />}
                  <div className="flex justify-center mb-1.5 mt-0.5">
                    <div className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, background: sel ? "rgba(10,23,41,0.14)" : "rgba(255,255,255,0.06)" }}>
                      <m.icon size={18} color={sel ? NAVY : GOLD} />
                    </div>
                  </div>
                  <div className="text-[13px] font-extrabold leading-none" style={{ color: sel ? NAVY : TXT }}>{m.label}</div>
                  <div className="text-[10px] font-semibold mt-1 leading-tight" style={{ color: sel ? "rgba(10,23,41,0.7)" : TXT_MUT }}>{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* ── PASOS ── */}
      <FadeIn delay={0.3}>
        <div className="flex items-center justify-center gap-1.5 mb-5 text-[10px] font-bold">
          {[
            { n: 1, t: "Configura", on: true },
            { n: 2, t: "Elige jugadores", on: false },
            { n: 3, t: "Finaliza", on: false },
          ].map((p, i) => (
            <div key={p.n} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ width: 14, height: 1, background: "rgba(255,255,255,0.15)" }} />}
              <span className="inline-flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: p.on ? GOLD : "rgba(255,255,255,0.08)", color: p.on ? NAVY : TXT_MUT, fontSize: 9, fontWeight: 900 }}>{p.n}</span>
              <span style={{ color: p.on ? GOLD2 : TXT_MUT }}>{p.t}</span>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── CTA semifijo ── */}
      <div className="dm-cta-wrap">
        <button onClick={onStart}
          className="w-full rounded-2xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-0.5"
          style={{ minHeight: 60, padding: "10px 16px", background: `linear-gradient(135deg, ${GOLD2}, ${GOLD})`, color: NAVY, boxShadow: `0 10px 30px ${GOLD}66, inset 0 1px 0 rgba(255,255,255,0.4)` }}>
          <span className="flex items-center gap-2 text-lg font-black"><IconDice size={20} color={NAVY} />Comenzar Draft</span>
          <span className="text-[11px] font-bold" style={{ color: "rgba(10,23,41,0.72)" }}>{resumen}</span>
        </button>
      </div>

      <Link href="/app" className="flex items-center justify-center gap-1 mt-3 mb-2 text-sm" style={{ color: TXT_MUT }}>
        <IconArrowLeft size={14} color={TXT_MUT} />Volver al lobby
      </Link>
    </div>
  );
}

/* ─────────── TiradaPanel ─────────── */
function TiradaPanel({
  plantilla, onTirar,
}: {
  plantilla: { seleccion: string; year: number; bandera: string } | null;
  onTirar: () => void;
}) {
  const [rolling, setRolling] = useState(false);

  const handleClick = () => {
    if (rolling) return;
    setRolling(true);
  };

  const handleRollEnd = () => {
    setRolling(false);
    onTirar();
  };

  return (
    <FadeIn>
      <div className="rounded-xl p-6 text-center" style={{ background: CARD }}>
        {plantilla ? (
          <>
            <div className="text-sm mb-3" style={{ color: TXT_MUT }}>Te tocó</div>
            <div className="flex justify-center items-center gap-3 mb-3 animate-bounce">
              <KitAvatar seleccion={plantilla.seleccion} size={72} />
              <FlagImage code={seleccionISO(plantilla.seleccion)} alt={plantilla.seleccion} width={40} className="rounded-lg shadow-md" fallback={plantilla.seleccion.slice(0, 3).toUpperCase()} />
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: TXT }}>{plantilla.seleccion} {plantilla.year}</div>
            <div className="text-sm mb-4" style={{ color: GOLD }}>Elige un jugador para tu equipo</div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-5">
              <Dice3D rolling={rolling} onRollEnd={handleRollEnd} />
            </div>
            <div className="text-lg font-bold mb-2" style={{ color: TXT }}>¡Tira el dado!</div>
            <div className="text-sm mb-5" style={{ color: TXT_MUT }}>
              {rolling ? "Sorteando selección…" : "Se sorteará una selección histórica con sus jugadores"}
            </div>
            <button
              onClick={handleClick}
              disabled={rolling}
              className="px-8 py-3 rounded-xl text-lg font-bold transition-all active:scale-95 flex items-center gap-2 mx-auto"
              style={{ background: rolling ? `${GOLD}88` : GOLD, color: NAVY, cursor: rolling ? "wait" : "pointer" }}
            >
              <IconDice size={20} color={NAVY} />
              {rolling ? "Tirando…" : "Tirar dado"}
            </button>
          </>
        )}
      </div>
    </FadeIn>
  );
}

/* ─────────── SeleccionPanel ─────────── */
function SeleccionPanel({
  plantilla, jugadores, modo, tiempoRestante, onSeleccionar, posicionesOcupadas,
  rerollsRestantes, onOtraSeleccion, onOtroMundial, coherenciaHint,
}: {
  plantilla: { seleccion: string; year: number };
  jugadores: JugadorSeleccionado[];
  modo: Modo;
  tiempoRestante: number | null;
  onSeleccionar: (id: string) => void;
  posicionesOcupadas: DraftPosicion[];
  rerollsRestantes: number;
  onOtraSeleccion: () => void;
  onOtroMundial: () => void;
  coherenciaHint?: string | null;
}) {
  const sinRerolls = rerollsRestantes <= 0;
  return (
    <FadeIn>
      {/* Cabecera: qué selección salió + re-tiradas */}
      <div className="rounded-xl p-4 mb-3" style={{ background: CARD, border: `1px solid ${GOLD}33` }}>
        <div className="flex items-center gap-3">
          <KitAvatar seleccion={plantilla.seleccion} size={48} />
          <FlagImage code={seleccionISO(plantilla.seleccion)} alt={plantilla.seleccion} width={28} className="rounded shadow-md flex-shrink-0" fallback={plantilla.seleccion.slice(0, 2).toUpperCase()} />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: TXT_MUT }}>Salió</div>
            <div className="text-xl font-black leading-tight truncate" style={{ color: TXT }}>{plantilla.seleccion}</div>
            <div className="text-sm font-bold" style={{ color: GOLD }}>Mundial {plantilla.year}</div>
          </div>
        </div>

        {/* Botones de re-tirada (ocultos en contrarreloj) */}
        {modo !== "contrarreloj" && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TXT_MUT }}>¿No te convence?</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: sinRerolls ? `${RED}22` : `${GOLD}22`, color: sinRerolls ? RED : GOLD }}>
                {rerollsRestantes} {rerollsRestantes === 1 ? "cambio" : "cambios"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onOtraSeleccion} disabled={sinRerolls}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                style={{ borderColor: `${GOLD}55`, color: GOLD, background: `${GOLD}11`, cursor: sinRerolls ? "not-allowed" : "pointer" }}>
                <IconRefresh size={15} color={GOLD} />Otra selección
              </button>
              <button onClick={onOtroMundial} disabled={sinRerolls}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                style={{ borderColor: `${GOLD}55`, color: GOLD, background: `${GOLD}11`, cursor: sinRerolls ? "not-allowed" : "pointer" }}>
                <IconGlobe size={15} color={GOLD} />Otro mundial
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`rounded-xl p-4 transition-all duration-200${tiempoRestante !== null && tiempoRestante <= 3 ? " animate-panic-shake" : ""}`}
        style={{ background: tiempoRestante !== null && tiempoRestante <= 3 ? `color-mix(in srgb, ${RED} 12%, ${CARD})` : CARD }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold" style={{ color: GOLD }}>Elige un jugador</span>
          {tiempoRestante !== null && (
            <span className="text-sm font-bold px-2 py-1 rounded-lg animate-pulse flex items-center gap-1"
              style={{ background: tiempoRestante <= 3 ? `${RED}55` : tiempoRestante <= 5 ? `${RED}33` : `${GOLD}33`, color: tiempoRestante <= 3 ? "#fff" : tiempoRestante <= 5 ? RED : GOLD }}>
              <IconTimer size={16} color={tiempoRestante <= 3 ? "#fff" : tiempoRestante <= 5 ? RED : GOLD} />{tiempoRestante}s
            </span>
          )}
        </div>
        {coherenciaHint && (
          <div className="mb-3 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in"
            style={{ background: `#f59e0b22`, color: "#f59e0b", border: `1px solid #f59e0b44` }}>
            <span>⬆</span>{coherenciaHint}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {jugadores.map((j, i) => (
            <button key={j.id} onClick={() => onSeleccionar(j.id)}
              className="p-3 rounded-lg text-left transition-all hover:scale-[1.03] active:scale-[0.97] border animate-fade-in"
              style={{
                background: posicionesOcupadas.includes(j.posicion) ? `${posicionColor(j.posicion)}11` : CARD_HOV,
                borderColor: "rgba(255,255,255,0.08)",
                animationDelay: `${i * 0.05}s`, animationFillMode: "both",
                opacity: posicionesOcupadas.includes(j.posicion) ? 0.5 : 1,
                cursor: posicionesOcupadas.includes(j.posicion) ? "not-allowed" : "pointer",
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: posicionColor(j.posicion) }}>{posicionLabel(j.posicion)}</span>
                {posicionesOcupadas.includes(j.posicion) && <span className="text-[10px] font-bold" style={{ color: RED }}>SIN HUECO</span>}
              </div>
              <div className="text-sm font-bold truncate" style={{ color: TXT }}>{j.nombre}</div>
              <div className="text-xs mt-1" style={{ color: TXT_MUT }}>{j.seleccion} {j.year}</div>
              {modo !== "almanaque" && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${j.fuerza}%`,
                      background: j.fuerza >= 90 ? GREEN : j.fuerza >= 80 ? GOLD : j.fuerza >= 70 ? "#f59e0b" : RED,
                    }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: TXT }}>{j.fuerza}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

/* ─────────── SimulacionScreen ─────────── */
function SimulacionScreen() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6"><IconBolt size={56} color={GOLD} className="animate-bounce" /></div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: TXT }}>Calculando resultado...</h2>
      <p className="text-sm" style={{ color: TXT_MUT }}>Analizando fuerza, balance y coherencia de tu equipo</p>
      <div className="mt-6 flex justify-center gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: GOLD, animationDelay: `${i * 0.2}s` }} />)}
      </div>
    </div>
  );
}

/* ─────────── LogrosPopup ─────────── */
function LogrosPopup({ logros, onClose }: { logros: DraftLogro[]; onClose: () => void }) {
  if (logros.length === 0) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="max-w-sm w-full rounded-2xl p-6 text-center animate-fade-in" style={{ background: CARD, border: `2px solid ${GOLD}66` }}>
        <div className="flex justify-center mb-3"><IconTrophy size={40} color={GOLD} /></div>
        <h3 className="text-xl font-bold mb-2" style={{ color: GOLD2 }}>¡Nuevos logros!</h3>
        <div className="space-y-2 mb-4">
          {logros.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${GOLD}15` }}>
              <div className="flex-shrink-0"><IconLogro id={l.id} size={28} /></div>
              <div className="text-left">
                <div className="text-sm font-bold" style={{ color: TXT }}>{l.nombre}</div>
                <div className="text-xs" style={{ color: TXT_MUT }}>{l.descripcion}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02]" style={{ background: GOLD, color: NAVY }}>¡Genial!</button>
      </div>
    </div>
  );
}

/* ─────────── RankingMini ─────────── */
function RankingMini() {
  const [entries, setEntries] = useState<Array<{ user_id: string; best_score: number; best_calificacion: string; username: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/draft/ranking?limit=5").then((r) => r.json()).then((data) => {
      setEntries(data.entries || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-4 text-sm" style={{ color: TXT_MUT }}>Cargando ranking...</div>;
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: CARD }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: GOLD }}>
        <IconTrophy size={14} />Top 5 Global
      </div>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div key={e.user_id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: i === 0 ? `${GOLD}15` : "transparent" }}>
            <span className="text-xs font-bold w-5" style={{ color: i === 0 ? GOLD : TXT_MUT }}>#{i + 1}</span>
            <span className="text-sm flex-1 truncate" style={{ color: TXT }}>{e.username || "Anónimo"}</span>
            <span className="text-xs font-bold" style={{ color: getColorCalificacion(e.best_calificacion as DraftResultado["calificacion"]) }}>{e.best_calificacion}</span>
            <span className="text-xs font-bold w-8 text-right" style={{ color: GOLD }}>{e.best_score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── ResultadoScreen ─────────── */
function ResultadoScreen({ resultado, equipo, recompensa, onReiniciar }: { resultado: DraftResultado; equipo: Record<number, JugadorSeleccionado>; recompensa: RecompensaDraft | null; onReiniciar: () => void }) {
  const color = getColorCalificacion(resultado.calificacion);
  const nearMiss = getNearMiss(resultado.puntaje);
  // Recompensa NETA ya calculada por el hook (base ÷2 + bonus campaña − castigo
  // por eliminación). Fallback defensivo si aún no llegó.
  const puntos = recompensa?.xp ?? 0;
  const monedas = recompensa?.coins ?? 0;
  const bonusCamp = recompensa?.bonusCoins ?? 0;
  const penalCoins = recompensa?.penalCoins ?? 0;
  const penalXp = recompensa?.penalXp ?? 0;
  const eliminado = recompensa?.eliminado ?? false;

  const compartir = useCallback(() => {
    const nombres = Object.values(equipo).filter(Boolean).map((j) => j!.nombre).slice(0, 3).join(", ");
    const texto = `Armé un equipo ${resultado.calificacion} (${resultado.puntaje}/100) en Draft Mundial de @ZonaMundial\n\n${nombres}...\n\n¿Puedes superarme? → webzonamundial.com/app/draft-mundial`;
    navigator.clipboard.writeText(texto).then(() => alert("¡Texto copiado al portapapeles!"));
  }, [resultado, equipo]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3" style={{ animation: "bounce 1s infinite" }}>
            <IconCalificacion calificacion={resultado.calificacion} size={64} color={color} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color }}>{resultado.calificacion}</h1>
          <div className="text-5xl font-black mt-2" style={{ color: TXT }}>
            {resultado.puntaje}<span className="text-xl font-normal" style={{ color: TXT_MUT }}>/100</span>
          </div>
          {nearMiss && (
            <div className="mt-2 text-sm animate-fade-in" style={{ color: TXT_MUT }}>
              Solo te faltaron <span className="font-bold" style={{ color: GOLD }}>{nearMiss.faltaron} punto{nearMiss.faltaron !== 1 ? "s" : ""}</span> para {nearMiss.siguiente}
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="rounded-xl p-4 mb-6 space-y-3" style={{ background: CARD }}>
          {[
            { label: "Fuerza", icon: IconSwords, value: resultado.fuerza, color: "#3b82f6" },
            { label: "Balance", icon: IconScale, value: resultado.balance, color: "#22c55e" },
            { label: "Coherencia", icon: IconLink, value: resultado.coherencia, color: "#f59e0b" },
            { label: "Bonus estilo", icon: IconTarget, value: resultado.bonusEstilo, color: GOLD },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="text-sm w-28 flex items-center gap-1.5" style={{ color: TXT }}>
                <stat.icon size={14} color={stat.color} />{stat.label}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${stat.value}%`, background: stat.color }} />
              </div>
              <span className="text-sm font-bold w-10 text-right" style={{ color: TXT }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.25}>
        <div className="rounded-xl p-4 mb-6 text-center" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}44` }}>
          <div className="text-sm mb-1" style={{ color: TXT_MUT }}>Recompensas</div>
          <div className="flex justify-center gap-6">
            <div>
              <div className="text-2xl font-bold" style={{ color: GOLD }}>+{puntos}</div>
              <div className="text-xs" style={{ color: TXT_MUT }}>puntos XP</div>
              {penalXp > 0 && (
                <div className="text-[10px] font-bold mt-0.5 animate-fade-in" style={{ color: RED }}>
                  (−{penalXp} eliminación)
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: GOLD }}>+{monedas}</div>
              <div className="text-xs" style={{ color: TXT_MUT }}>monedas</div>
              {bonusCamp > 0 && penalCoins === 0 && (
                <div className="text-[10px] font-bold mt-0.5 animate-fade-in" style={{ color: "#22c55e" }}>
                  (+{bonusCamp} campaña)
                </div>
              )}
              {penalCoins > 0 && (
                <div className="text-[10px] font-bold mt-0.5 animate-fade-in" style={{ color: RED }}>
                  (−{penalCoins} eliminación)
                </div>
              )}
            </div>
          </div>
          {eliminado && (
            <div className="text-[11px] mt-2 animate-fade-in" style={{ color: TXT_MUT }}>
              Tu once cayó: ganás menos. Llegá a la final para no perder puntos.
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.35}><RankingMini /></FadeIn>

      <FadeIn delay={0.4}>
        <div className="rounded-xl p-4 mb-6" style={{ background: CARD }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: GOLD }}>Tu equipo</div>
          <div className="space-y-1">
            {Object.entries(equipo).map(([slotId, jug]) => {
              if (!jug) return null;
              return (
                <div key={slotId} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: `${posicionColor(jug.posicion)}11` }}>
                  <KitAvatar seleccion={jug.seleccion} size={22} />
                  <span className="text-xs font-bold w-8" style={{ color: posicionColor(jug.posicion) }}>{posicionLabel(jug.posicion)}</span>
                  <span className="text-sm flex-1 truncate" style={{ color: TXT }}>{jug.nombre}</span>
                  <span className="text-xs flex items-center gap-1" style={{ color: TXT_MUT }}>
                    <FlagImage code={seleccionISO(jug.seleccion)} alt={jug.seleccion} width={14} className="rounded-sm" fallback={jug.seleccion.slice(0, 2).toUpperCase()} />
                    {jug.seleccion} {jug.year}
                  </span>
                  <span className="text-xs font-bold w-6 text-right" style={{ color: jug.fuerza >= 90 ? GREEN : TXT }}>{jug.fuerza}</span>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="space-y-3">
          <button onClick={compartir}
            className="w-full py-3 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border flex items-center justify-center gap-2"
            style={{ borderColor: `${GOLD}66`, color: GOLD, background: `${GOLD}11` }}>
            <IconShare size={18} color={GOLD} />Compartir resultado
          </button>
          <button onClick={onReiniciar}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: GOLD, color: NAVY }}>
            <IconRefresh size={20} color={NAVY} />Jugar de nuevo
          </button>
          <Link href="/app" className="flex items-center justify-center gap-1 w-full py-3 rounded-xl text-sm font-medium border transition-all" style={{ borderColor: "rgba(255,255,255,0.15)", color: TXT }}><IconArrowLeft size={16} color={TXT} />Volver al lobby</Link>
        </div>
      </FadeIn>
    </div>
  );
}

/* ─────────── Marcador en vivo ─────────── */
// Posiciones que cuentan para cada métrica (mediocampo repartido: los más
// ofensivos suman a Ataque; los de contención, a Defensa).
const ATA_POS: DraftPosicion[] = ["CA", "PD", "PI", "EXT", "MEI"];
const DEF_POS: DraftPosicion[] = ["GOL", "LD", "ZAG", "LE", "VOL", "MCD"];

function promedioFuerza(js: JugadorSeleccionado[]): number {
  if (js.length === 0) return 0;
  return Math.round(js.reduce((s, j) => s + j.fuerza, 0) / js.length);
}

function BarraMarcador({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function Marcador({ slots, equipo, puntajeParcial }: { slots: SlotLayout[]; equipo: Record<number, JugadorSeleccionado>; puntajeParcial?: number | null }) {
  const colocados = Object.values(equipo).filter(Boolean) as JugadorSeleccionado[];
  const overall = promedioFuerza(colocados);
  const ataque = promedioFuerza(colocados.filter((j) => ATA_POS.includes(j.posicion)));
  const defensa = promedioFuerza(colocados.filter((j) => DEF_POS.includes(j.posicion)));
  const overallColor = overall >= 90 ? GREEN : overall >= 80 ? GOLD : TXT;

  return (
    <div className="rounded-xl p-4" style={{ background: CARD }}>
      {/* Cabecera + valoración global */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: TXT_MUT }}>
            Marcador · {colocados.length}/{slots.length}
          </span>
          {puntajeParcial !== null && puntajeParcial !== undefined && (
            <div className="text-[10px] font-bold mt-0.5 animate-fade-in" style={{ color: puntajeParcial >= 85 ? GOLD : puntajeParcial >= 75 ? "#22c55e" : TXT_MUT }}>
              Proyectado ~{puntajeParcial}
            </div>
          )}
        </div>
        <span className="text-4xl font-black leading-none" style={{ color: overallColor }}>
          {colocados.length ? overall : "—"}
        </span>
      </div>
      <BarraMarcador value={overall} color={GOLD} />

      {/* Ataque / Defensa */}
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TXT_MUT }}>Ataque {ataque ? <span style={{ color: RED }}>{ataque}</span> : ""}</span>
          </div>
          <BarraMarcador value={ataque} color={RED} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TXT_MUT }}>Defensa {defensa ? <span style={{ color: GREEN }}>{defensa}</span> : ""}</span>
          </div>
          <BarraMarcador value={defensa} color={GREEN} />
        </div>
      </div>

      {/* Once por casilla (respeta la formación: dos centrales salen dos veces) */}
      <div className="mt-4">
        {slots.map((slot) => {
          const j = equipo[slot.id];
          return (
            <div key={slot.id} className="flex items-center gap-3 py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs font-bold w-9 flex-shrink-0" style={{ color: j ? posicionColor(slot.pos) : TXT_MUT, opacity: j ? 1 : 0.55 }}>{posicionLabel(slot.pos)}</span>
              <span className="text-sm flex-1 truncate" style={{ color: j ? TXT : TXT_MUT }}>{j ? j.nombre : "—"}</span>
              {j && <span className="text-sm font-bold flex-shrink-0" style={{ color: j.fuerza >= 90 ? GREEN : j.fuerza >= 80 ? GOLD : TXT }}>{j.fuerza}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── La Campaña (Mundial simulado) ─────────── */
function PartidoRow({ p, delay }: { p: CampanaPartido; delay: number }) {
  const col = p.resultado === "G" ? GREEN : p.resultado === "P" ? RED : GOLD;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl animate-fade-in" style={{ background: CARD, borderLeft: `3px solid ${col}`, animationDelay: `${delay}s`, animationFillMode: "both" }}>
      <span className="text-[10px] font-bold uppercase tracking-wider w-16 flex-shrink-0" style={{ color: TXT_MUT }}>{p.fase}</span>
      <FlagImage code={seleccionISO(p.rivalSeleccion)} alt={p.rivalSeleccion} width={22} className="rounded-sm flex-shrink-0" fallback={p.rivalSeleccion.slice(0, 3).toUpperCase()} />
      <span className="text-sm font-bold flex-1 truncate" style={{ color: TXT }}>
        {p.rivalSeleccion} <span className="font-normal" style={{ color: TXT_MUT }}>{p.rivalYear}</span>
      </span>
      {p.penalesGf != null && (
        <span className="text-[10px] font-bold" style={{ color: col }}>({p.penalesGf}-{p.penalesGc}p)</span>
      )}
      <span className="text-base font-black tabular-nums" style={{ color: col }}>{p.gf}-{p.gc}</span>
    </div>
  );
}

function ResumenStat({ n, label, color = TXT }: { n: number; label: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black" style={{ color }}>{n}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: TXT_MUT }}>{label}</div>
    </div>
  );
}

function CampanaScreen({ equipo, onTerminar }: {
  equipo: Record<number, JugadorSeleccionado>;
  onTerminar: (campana: Campana) => void;
}) {
  const jugadores = Object.values(equipo).filter(Boolean) as JugadorSeleccionado[];
  const [campana, setCampana] = useState<Campana>(() => generarCampana(jugadores));
  const [revelados, setRevelados] = useState(0);
  const total = campana.partidos.length;
  const completo = revelados >= total;

  const repetir = () => { setCampana(generarCampana(jugadores)); setRevelados(0); };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {completo && campana.campeon && <Confetti />}

      <FadeIn>
        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: TXT_MUT }}>
            La Campaña · Seed #{campana.seed}
          </div>
          <h1 className="text-3xl font-black leading-none mt-1" style={{ color: TXT }}>La Campaña</h1>
          <p className="text-xs mt-2" style={{ color: TXT_MUT }}>
            Fase de grupos + eliminatorias del Mundial 2026 contra selecciones históricas.
          </p>
        </div>
      </FadeIn>

      {/* Partidos revelados */}
      <div className="space-y-2 mb-4">
        {campana.partidos.slice(0, revelados).map((p, i) => (
          <PartidoRow key={`${i}-${campana.seed}`} p={p} delay={Math.min(i, 2) * 0.06} />
        ))}
        {revelados === 0 && (
          <div className="text-center py-10 rounded-xl" style={{ background: CARD, color: TXT_MUT }}>
            <IconTrophy size={36} color={GOLD} className="inline-block mb-2" />
            <div className="text-sm font-semibold">Tu once está listo. ¿Cómo juegas la campaña?</div>
          </div>
        )}
      </div>

      {/* Controles */}
      {!completo ? (
        <FadeIn>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRevelados((r) => Math.min(total, r + 1))}
              className="py-3 rounded-xl text-sm font-bold border transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: TXT, background: CARD }}>
              {revelados === 0 ? "Partido a partido" : `Siguiente (${revelados}/${total})`}
            </button>
            <button onClick={() => setRevelados(total)}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: GOLD, color: NAVY }}>
              <IconBolt size={16} color={NAVY} />Automático
            </button>
          </div>
        </FadeIn>
      ) : (
        <FadeIn>
          {/* Banner resumen */}
          <div className="rounded-2xl p-5 mb-4 text-center"
            style={{ background: campana.campeon ? `${GOLD}18` : CARD, border: `1px solid ${campana.campeon ? `${GOLD}66` : "rgba(255,255,255,0.08)"}` }}>
            {campana.campeon && <div className="flex justify-center mb-2"><IconTrophy size={34} color={GOLD} /></div>}
            <div className="text-2xl font-black mb-1" style={{ color: campana.campeon ? GOLD2 : TXT }}>{campana.outcome}</div>
            {calcularBonusCampana(campana) > 0 && (
              <div className="text-sm font-bold mb-3 animate-fade-in" style={{ color: "#22c55e" }}>
                +{calcularBonusCampana(campana)} monedas extra
              </div>
            )}
            <div className="flex justify-center gap-4">
              <ResumenStat n={campana.resumen.v} label="Ganados" color={GREEN} />
              <ResumenStat n={campana.resumen.e} label="Empates" color={GOLD} />
              <ResumenStat n={campana.resumen.d} label="Perdidos" color={RED} />
              <ResumenStat n={campana.resumen.gf} label="GF" />
              <ResumenStat n={campana.resumen.gc} label="GC" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={repetir}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: TXT, background: CARD }}>
              <IconRefresh size={16} color={TXT} />Repetir
            </button>
            <button onClick={() => onTerminar(campana)}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: GOLD, color: NAVY }}>
              <IconTrophy size={16} color={NAVY} />Ver mi carta
            </button>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

/* ─────────── Tope diario Free ─────────── */
const FREE_DRAFT_LIMIT = FREE_LIMITS.draft.dailyGames;

// Conteo anónimo en localStorage (tope blando que empuja al registro; el
// usuario logueado se cuenta en servidor vía cuota KV).
function localDayKey(): string {
  return "draft:plays:" + new Date().toISOString().slice(0, 10);
}
function readAnonPlays(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(localDayKey()) || "0") || 0;
}
function bumpAnonPlays(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(localDayKey(), String(readAnonPlays() + 1)); } catch { /* storage lleno/denegado */ }
}

interface GateState {
  loading: boolean;
  isPro: boolean;
  anon: boolean;
  limite: number;
  restantes: number;
  agotado: boolean;
}

function LimiteScreen({ anon }: { anon: boolean }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <FadeIn>
        <div className="rounded-2xl p-7 text-center" style={{ background: CARD, border: `1px solid ${GOLD}44` }}>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${GOLD}18` }}>
              <IconTrophy size={28} color={GOLD} />
            </div>
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: TXT }}>
            Llegaste al límite de hoy
          </h1>
          <p className="text-sm mb-1" style={{ color: TXT_MUT }}>
            Con el plan gratis podés jugar <b style={{ color: TXT }}>{FREE_DRAFT_LIMIT} drafts al día</b>.
          </p>
          <p className="text-sm mb-6" style={{ color: TXT_MUT }}>
            {anon
              ? "Registrate gratis y hacete Pro para tirar sin tope."
              : "Pasate a Pro y armá todos los onces que quieras."}
          </p>

          <Link
            href="/pro"
            className="inline-block w-full py-3.5 rounded-xl text-base font-black transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: GOLD, color: NAVY, boxShadow: `0 8px 24px ${GOLD}40` }}
          >
            Hazte Pro — {PRO_PRICE_DISPLAY.yearly}
          </Link>

          {anon && (
            <Link href="/registro" className="block mt-3 text-sm font-bold" style={{ color: GOLD }}>
              Crear cuenta gratis
            </Link>
          )}

          <Link href="/app/draft-mundial" className="flex items-center justify-center gap-1 mt-5 text-sm" style={{ color: TXT_MUT }}>
            <IconArrowLeft size={14} color={TXT_MUT} />Volver
          </Link>

          <p className="text-xs mt-5" style={{ color: TXT_MUT }}>
            Tu cupo se renueva mañana.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

function CupoBanner({ restantes }: { restantes: number }) {
  const sinCupo = restantes <= 1;
  return (
    <div className="max-w-lg mx-auto px-4 -mb-4">
      <div className="text-center text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mx-auto"
        style={{ background: sinCupo ? `${RED}18` : `${GOLD}14`, color: sinCupo ? RED : GOLD, border: `1px solid ${sinCupo ? RED : GOLD}33` }}>
        <IconDice size={13} color={sinCupo ? RED : GOLD} />
        Te {restantes === 1 ? "queda" : "quedan"} {restantes} de {FREE_DRAFT_LIMIT} partidas gratis hoy
      </div>
    </div>
  );
}

/* ─────────── Página Principal ─────────── */
export default function DraftMundialJugarPage() {
  const game = useDraftGame();

  // ── Gating del tope diario ───────────────────────────────────────────
  const [gate, setGate] = useState<GateState>({
    loading: true, isPro: false, anon: false,
    limite: FREE_DRAFT_LIMIT, restantes: FREE_DRAFT_LIMIT, agotado: false,
  });

  const refrescarGate = useCallback(async () => {
    try {
      const r = await fetch("/api/draft/estado", { cache: "no-store" });
      const d = await r.json();
      if (d.isPro) {
        setGate({ loading: false, isPro: true, anon: false, limite: Infinity, restantes: Infinity, agotado: false });
        return;
      }
      if (d.anon) {
        const restantes = Math.max(0, (d.limite ?? FREE_DRAFT_LIMIT) - readAnonPlays());
        setGate({ loading: false, isPro: false, anon: true, limite: d.limite ?? FREE_DRAFT_LIMIT, restantes, agotado: restantes <= 0 });
        return;
      }
      setGate({
        loading: false, isPro: false, anon: false,
        limite: d.limite ?? FREE_DRAFT_LIMIT,
        restantes: d.restantes ?? 0,
        agotado: !!d.agotado,
      });
    } catch {
      // Fail-open: ante fallo de red no bloqueamos el juego.
      setGate((g) => ({ ...g, loading: false }));
    }
  }, []);

  useEffect(() => { refrescarGate(); }, [refrescarGate]);

  // Al COMPLETAR una partida: el anónimo suma en localStorage; en ambos casos
  // refrescamos el cupo para que el siguiente "setup" quede bien gateado.
  const prevPhase = useRef(game.phase);
  useEffect(() => {
    if (game.phase === "resultado" && prevPhase.current !== "resultado") {
      if (gate.anon) bumpAnonPlays();
      refrescarGate();
    }
    prevPhase.current = game.phase;
  }, [game.phase, gate.anon, refrescarGate]);

  const bloqueado = !gate.loading && !gate.isPro && gate.agotado;
  // Total de casillas reales de la formación elegida.
  const totalSlots = game.slots.length;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (game.phase === "resultado" && game.resultado && ["Oro", "Platino", "Leyenda"].includes(game.resultado.calificacion)) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(t);
    }
  }, [game.phase, game.resultado]);

  // Tras girar el dado, la selección aparece en la columna de ACCIÓN (arriba en
  // mobile). Si el usuario estaba mirando el campo (abajo), llevamos la vista a
  // la acción para que no se quede "en el dado".
  const accionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (game.phase === "seleccion") {
      accionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [game.phase, game.tiradaActual]);

  return (
    <div className="min-h-screen pb-24" style={{ background: NAVY }}>
      <style jsx global>{`@keyframes fade-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} } .animate-fade-in{animation:fade-in .4s ease-out forwards} @keyframes panic-shake{0%,100%{transform:translateX(0)}15%,45%,75%{transform:translateX(-4px)}30%,60%,90%{transform:translateX(4px)}} .animate-panic-shake{animation:panic-shake 0.25s ease-in-out infinite} @keyframes dice-roll{0%{transform:rotateX(0deg) rotateY(0deg) rotateZ(0deg)}20%{transform:rotateX(230deg) rotateY(115deg) rotateZ(50deg)}45%{transform:rotateX(460deg) rotateY(290deg) rotateZ(135deg)}65%{transform:rotateX(630deg) rotateY(450deg) rotateZ(200deg)}80%{transform:rotateX(750deg) rotateY(560deg) rotateZ(256deg)}93%{transform:rotateX(800deg) rotateY(610deg) rotateZ(282deg)}97%{transform:rotateX(811deg) rotateY(622deg) rotateZ(291deg)}100%{transform:rotateX(810deg) rotateY(621deg) rotateZ(290deg)}} .animate-dice-roll{animation:dice-roll 1.1s ease-out forwards}`}</style>
      {showConfetti && <Confetti />}
      {game.phase === "resultado" && game.logrosNuevos.length > 0 && <LogrosPopup logros={game.logrosNuevos} onClose={game.marcarLogrosVistos} />}

      {/* Top bar */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ background: `${NAVY}ee`, backdropFilter: "blur(10px)" }}>
        <Link href="/app/draft-mundial" className="flex items-center gap-1 text-sm font-medium" style={{ color: TXT_MUT }}><IconArrowLeft size={16} color={TXT_MUT} />Draft Mundial</Link>
        {game.phase !== "setup" && game.phase !== "resultado" && game.phase !== "campana" && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: TXT_MUT }}>{Object.keys(game.equipo).length}/{totalSlots}</span>
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${game.progreso}%`, background: GOLD }} />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {game.phase === "setup" && bloqueado && <LimiteScreen anon={gate.anon} />}
        {game.phase === "setup" && !bloqueado && (
          <>
            {!gate.isPro && !gate.loading && Number.isFinite(gate.restantes) && (
              <CupoBanner restantes={gate.restantes} />
            )}
            <SetupScreen
              formacion={game.formacion} setFormacion={game.setFormacion}
              estilo={game.estilo} setEstilo={game.setEstilo}
              modo={game.modo} setModo={game.setModo}
              onStart={game.iniciarJuego}
            />
          </>
        )}

        {game.phase !== "setup" && game.phase !== "resultado" && game.phase !== "campana" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Columna campo — en mobile va DEBAJO de la acción (order-2) */}
            <div className="order-2 lg:order-1">
              <FadeIn>
                <SoccerField
                  slots={game.slots}
                  equipo={game.equipo}
                  highlightSlot={game.slotActivo}
                />
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="mt-3">
                  <Marcador slots={game.slots} equipo={game.equipo} puntajeParcial={game.puntajeParcial} />
                </div>
              </FadeIn>
            </div>

            {/* Columna acción — en mobile va PRIMERO (order-1) */}
            <div ref={accionRef} className="order-1 lg:order-2 scroll-mt-20">
              {game.phase === "tirada" && (
                <TiradaPanel
                  plantilla={
                    game.tiradaActual
                      ? { seleccion: game.tiradaActual.seleccion, year: game.tiradaActual.year, bandera: game.tiradaActual.bandera }
                      : null
                  }
                  onTirar={game.tirar}
                />
              )}
              {game.phase === "seleccion" && game.tiradaActual && (
                <SeleccionPanel
                  plantilla={{ seleccion: game.tiradaActual.seleccion, year: game.tiradaActual.year }}
                  jugadores={game.jugadoresDisponibles}
                  modo={game.modo}
                  tiempoRestante={game.tiempoRestante}
                  onSeleccionar={game.seleccionarJugador}
                  posicionesOcupadas={game.posicionesOcupadas}
                  rerollsRestantes={game.rerollsRestantes}
                  onOtraSeleccion={game.otraSeleccion}
                  onOtroMundial={game.otroMundial}
                  coherenciaHint={game.coherenciaHint}
                />
              )}
              {game.phase === "simulacion" && <SimulacionScreen />}
            </div>
          </div>
        )}

        {game.phase === "campana" && (
          <CampanaScreen equipo={game.equipo} onTerminar={game.finalizarConCampana} />
        )}

        {game.phase === "resultado" && game.resultado && (
          <ResultadoScreen resultado={game.resultado} equipo={game.equipo} recompensa={game.recompensa} onReiniciar={game.reiniciar} />
        )}
      </div>
    </div>
  );
}
