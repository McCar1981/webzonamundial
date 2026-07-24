"use client";

// src/app/app/draft-mundial/page.tsx
// Portada del minijuego Draft Mundial.
//
// No es una landing de marketing: es la "tapa" del juego. La identidad la dan
// las selecciones reales (banderas + año desde plantillas.ts) y el movimiento
// hecho a mano (cancha que se dibuja, focos que barren, scroll-reveal,
// contadores). Voz de hincha (voseo), como el resto de /app.
//
// NOTA: hay un slot listo para un fondo generado (public/draft-mundial/hero-bg.png).
// Cuando exista, se pinta solo; mientras tanto la atmósfera es 100% CSS.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  IconDice, IconChart, IconBook, IconTimer, IconArrowLeft, IconTrophy,
} from "./components/DraftIcons";
import FlagImage from "@/components/FlagImage";

const NAVY = "#0a0906", GOLD = "#c9a84c", GOLD2 = "#e8d48b";
const TXT = "#eef2fb", TXT_MUT = "#a69a82", CARD = "#14110a", LINE = "rgba(255,255,255,0.08)";

const LEYENDAS: { sel: string; year: number; iso: string }[] = [
  { sel: "Brasil", year: 1970, iso: "br" },
  { sel: "Argentina", year: 1986, iso: "ar" },
  { sel: "Alemania", year: 1974, iso: "de" },
  { sel: "Holanda", year: 1974, iso: "nl" },
  { sel: "Hungría", year: 1954, iso: "hu" },
  { sel: "Inglaterra", year: 1966, iso: "gb-eng" },
  { sel: "Uruguay", year: 1950, iso: "uy" },
  { sel: "Italia", year: 1982, iso: "it" },
  { sel: "Francia", year: 1998, iso: "fr" },
  { sel: "España", year: 2010, iso: "es" },
  { sel: "Argentina", year: 2022, iso: "ar" },
  { sel: "Croacia", year: 2018, iso: "hr" },
  { sel: "Marruecos", year: 2022, iso: "ma" },
  { sel: "Portugal", year: 1966, iso: "pt" },
];

const FICHA: { n: number | string; label: string }[] = [
  { n: 52, label: "clubes" },
  { n: 8, label: "ligas" },
  { n: "todas", label: "épocas" },
  { n: 8, label: "formaciones" },
];

const MODOS: { icon: typeof IconChart; nombre: string; desc: string }[] = [
  { icon: IconChart, nombre: "Clásico", desc: "Ves la fuerza de cada jugador. Decidís con los números a la vista." },
  { icon: IconBook, nombre: "De Almanaque", desc: "Sin stats. Solo el nombre. Lo que sabés de memoria es lo único que te salva." },
  { icon: IconTimer, nombre: "Contrarreloj", desc: "15 segundos por elección. Sin re-tiradas. El dedo más rápido manda." },
];

const LOGROS = [
  "Primer Draft", "Draft Experto", "Draft Maestro", "Leyenda Viva", "Arquitecto",
  "Contra el Tiempo", "De Memoria", "Equilibrista", "Historiador", "La Muralla",
];

/* ─────────── Hooks de movimiento ─────────── */

// Dispara una vez al entrar en viewport (scroll-reveal real, no solo CSS).
function useInView<T extends HTMLElement>(threshold = 0.25): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

function Reveal({ children, delay = 0, y = 18, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.18);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : `translateY(${y}px)`,
        transition: `opacity .7s cubic-bezier(.2,.7,.2,1) ${delay}s, transform .7s cubic-bezier(.2,.7,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// Contador que sube de 0 al valor al entrar en pantalla.
function CountUp({ to }: { to: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.6);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    const dur = 1000, t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(Math.round(e * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref}>{n}</span>;
}

function FlagChip({ l }: { l: { sel: string; year: number; iso: string } }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full flex-shrink-0" style={{ background: CARD, border: `1px solid ${LINE}` }}>
      <FlagImage code={l.iso} alt={l.sel} width={26} className="rounded-sm" fallback={l.sel.slice(0, 3).toUpperCase()} />
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: TXT }}>
        {l.sel} <span className="font-semibold" style={{ color: TXT_MUT }}>{l.year}</span>
      </span>
    </div>
  );
}

export default function DraftMundialPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: NAVY }}>
      <style jsx global>{`
        @keyframes dm-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes dm-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dm-draw { to { stroke-dashoffset: 0; } }
        @keyframes dm-sweep { 0% { transform: translateX(-60%) skewX(-18deg); opacity: 0; } 18% { opacity: .55; } 50% { opacity: .15; } 100% { transform: translateX(160%) skewX(-18deg); opacity: 0; } }
        @keyframes dm-drift { 0%,100% { transform: translate(-6%, -4%) scale(1); } 50% { transform: translate(8%, 6%) scale(1.15); } }
        @keyframes dm-tumble { 0%,72%,100% { transform: rotate(0deg); } 80% { transform: rotate(-16deg); } 88% { transform: rotate(14deg); } 94% { transform: rotate(-6deg); } }
        @keyframes dm-pop { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: scale(1); } }
        @keyframes dm-shimmer { to { background-position: 200% center; } }

        .dm-ticker-track { display: flex; gap: 10px; width: max-content; animation: dm-ticker 38s linear infinite; }
        @media (hover: hover) { .dm-ticker-mask:hover .dm-ticker-track { animation-play-state: paused; } }
        .dm-hero-h { animation: dm-rise .8s cubic-bezier(.2,.7,.2,1) both; }
        .dm-sweep { animation: dm-sweep 7s ease-in-out 1.2s infinite; }
        .dm-drift { animation: dm-drift 14s ease-in-out infinite; }
        .dm-pitch path, .dm-pitch circle, .dm-pitch line { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: dm-draw 2.4s ease-out .3s forwards; }
        .dm-dice { animation: dm-tumble 4.5s ease-in-out 1s infinite; transform-origin: 50% 60%; }
        .dm-cta:hover .dm-dice { animation-duration: .7s; }
        .dm-shimmer { background: linear-gradient(100deg, ${TXT} 30%, ${GOLD2} 50%, ${TXT} 70%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: dm-shimmer 5.5s linear infinite; }
        .dm-pop { animation: dm-pop .45s cubic-bezier(.2,.9,.3,1.2) both; }

        @media (prefers-reduced-motion: reduce) {
          .dm-ticker-track, .dm-sweep, .dm-drift, .dm-dice, .dm-shimmer, .dm-pop, .dm-hero-h { animation: none !important; }
          .dm-pitch path, .dm-pitch circle, .dm-pitch line { stroke-dashoffset: 0 !important; }
        }
      `}</style>

      {/* Barra superior */}
      <div className="sticky top-0 z-30 px-4 py-3" style={{ background: `${NAVY}d9`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${LINE}` }}>
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: TXT_MUT }}>
          <IconArrowLeft size={16} color={TXT_MUT} /> Lobby
        </Link>
      </div>

      {/* ════════ HERO con atmósfera viva ════════ */}
      <header className="relative overflow-hidden">
        {/* Capa 0 · fondo generado opcional. Si el PNG aún no existe se oculta
            solo (onError) → sin imagen rota, la atmósfera CSS queda intacta. */}
        <img
          aria-hidden alt="" src="/draft-mundial/hero-bg.png" loading="lazy" decoding="async"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.22, mixBlendMode: "luminosity" }}
        />
        {/* Capa 1 · cancha dibujándose */}
        <svg aria-hidden className="dm-pitch absolute left-1/2 -translate-x-1/2 -top-10 opacity-[0.13]" width="560" height="360" viewBox="0 0 560 360" fill="none" stroke={GOLD} strokeWidth="1.5">
          <rect x="20" y="20" width="520" height="320" rx="4" />
          <line x1="280" y1="20" x2="280" y2="340" />
          <circle cx="280" cy="180" r="62" />
          <path d="M20 110 H110 V250 H20" />
          <path d="M540 110 H450 V250 H540" />
        </svg>
        {/* Capa 2 · glow dorado a la deriva */}
        <div aria-hidden className="dm-drift absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-[420px] pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${GOLD}26, transparent 62%)` }} />
        {/* Capa 3 · barrido de foco */}
        <div aria-hidden className="dm-sweep absolute inset-y-0 -left-1/3 w-1/2 pointer-events-none" style={{ background: `linear-gradient(100deg, transparent, ${GOLD}1f 45%, ${GOLD2}33 50%, ${GOLD}1f 55%, transparent)` }} />
        {/* Capa 4 · grano fino */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        <div className="relative z-10 px-5 pt-14 pb-9 max-w-xl mx-auto">
          <div className="dm-hero-h text-[11px] font-bold uppercase tracking-[0.28em] mb-4" style={{ color: GOLD, animationDelay: "0s" }}>
            Minijuego · Zona Mundial
          </div>
          <h1 className="dm-hero-h text-[2.7rem] sm:text-6xl font-black leading-[0.95] tracking-tight" style={{ color: TXT, animationDelay: ".08s" }}>
            Draft<br /><span className="dm-shimmer">de Ligas</span>
          </h1>
          <p className="dm-hero-h text-lg mt-5 leading-snug" style={{ color: TXT_MUT, animationDelay: ".16s" }}>
            El dado saca un club legendario. Tú eliges un nombre.
            Repite <span style={{ color: TXT, fontWeight: 700 }}>once veces</span> y arma el mejor once con los clubes de tu liga —
            aunque mezcles épocas y camisetas.
          </p>

          <div className="dm-hero-h" style={{ animationDelay: ".24s" }}>
            <Link
              href="/app/draft-mundial/jugar"
              className="dm-cta group inline-flex items-center gap-2.5 mt-7 px-9 py-4 rounded-2xl text-lg font-black transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: GOLD, color: NAVY, boxShadow: `0 10px 30px ${GOLD}40` }}
            >
              <span className="dm-dice inline-flex"><IconDice size={22} color={NAVY} /></span>
              Tirar el dado
            </Link>
          </div>
        </div>

        {/* Ticker de leyendas */}
        <div className="dm-ticker-mask relative z-10 py-2 mt-2 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)" }}>
          <div className="dm-ticker-track px-2">
            {[...LEYENDAS, ...LEYENDAS].map((l, i) => <FlagChip key={i} l={l} />)}
          </div>
        </div>
      </header>

      {/* ════════ Una partida, contada rápido ════════ */}
      <section className="px-5 py-12 max-w-xl mx-auto">
        <Reveal>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] mb-6" style={{ color: GOLD }}>
            Una partida en treinta segundos
          </h2>
        </Reveal>
        <ol className="space-y-5">
          {[
            { k: "Tiras.", v: <>Sale <b style={{ color: TXT }}>Argentina 86</b>. Te muestra los once de esa plantilla.</> },
            { k: "Eliges uno.", v: <>De todos ellos, te quedas con <b style={{ color: TXT }}>Maradona</b> para la mediapunta. El resto vuelve al sorteo.</> },
            { k: "Repites.", v: <>Sale <b style={{ color: TXT }}>Alemania 74</b>, buscas un central y aparece <b style={{ color: TXT }}>Beckenbauer</b>. Y así hasta completar tu once.</> },
            { k: "Se juega.", v: <>Se calcula la fuerza, el balance y la coherencia del equipo. Después disputa una campaña entera de torneo.</> },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <li className="flex gap-4">
                <span className="flex-shrink-0 text-2xl font-black tabular-nums w-7" style={{ color: `${GOLD}66` }}>{i + 1}</span>
                <p className="text-base leading-snug pt-0.5" style={{ color: TXT_MUT }}>
                  <span className="font-black" style={{ color: GOLD2 }}>{s.k}</span>{" "}{s.v}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ════════ Ficha técnica con contadores ════════ */}
      <section className="px-5 pb-12 max-w-xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-4 rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${LINE}` }}>
            {FICHA.map((f, i) => (
              <div key={f.label} className="px-2 py-5 text-center" style={{ borderLeft: i ? `1px solid ${LINE}` : "none" }}>
                <div className="text-xl sm:text-2xl font-black leading-none" style={{ color: TXT }}>
                  {typeof f.n === "number" ? <CountUp to={f.n} /> : f.n}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: TXT_MUT }}>{f.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ════════ Modos ════════ */}
      <section className="px-5 pb-12 max-w-xl mx-auto">
        <Reveal>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] mb-5" style={{ color: GOLD }}>
            Tres maneras de sufrirla
          </h2>
        </Reveal>
        <div className="space-y-3">
          {MODOS.map((m, i) => (
            <Reveal key={m.nombre} delay={i * 0.08}>
              <div className="flex gap-4 p-4 rounded-2xl transition-transform hover:translate-x-1" style={{ background: CARD, border: `1px solid ${LINE}` }}>
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}33` }}>
                  <m.icon size={22} color={GOLD} />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-0.5" style={{ color: TXT }}>{m.nombre}</h3>
                  <p className="text-sm leading-snug" style={{ color: TXT_MUT }}>{m.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════ Logros ════════ */}
      <section className="px-5 pb-12 max-w-xl mx-auto">
        <Reveal>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] mb-1 flex items-center gap-2" style={{ color: GOLD }}>
            <IconTrophy size={16} color={GOLD} /> 10 logros para destrabar
          </h2>
          <p className="text-sm mb-4" style={{ color: TXT_MUT }}>
            Algunos son obvios. Otros, como “La Muralla” o “Historiador”, vas a tener que ir a buscarlos.
          </p>
        </Reveal>
        <Reveal>
          <div className="flex flex-wrap gap-2">
            {LOGROS.map((l, i) => (
              <span key={l} className="dm-pop text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: CARD, border: `1px solid ${LINE}`, color: TXT, animationDelay: `${0.25 + i * 0.05}s` }}>
                {l}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ════════ Cierre ════════ */}
      <section className="px-5 pb-16 pt-2 max-w-xl mx-auto text-center">
        <Reveal>
          <p className="text-xl font-black mb-5" style={{ color: TXT }}>¿Tu mejor once de la historia?</p>
          <Link
            href="/app/draft-mundial/jugar"
            className="dm-cta inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl text-lg font-black transition-transform hover:scale-[1.03] active:scale-95"
            style={{ background: GOLD, color: NAVY, boxShadow: `0 10px 30px ${GOLD}40` }}
          >
            <span className="dm-dice inline-flex"><IconDice size={22} color={NAVY} /></span>
            Empezar a tirar
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
