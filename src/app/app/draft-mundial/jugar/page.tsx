"use client";

// src/app/app/draft-mundial/jugar/page.tsx
// Juego completo Draft Mundial — Fases 1-3

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DraftPosicion,
  FormacionKey,
  Estilo,
  Modo,
  DraftResultado,
  JugadorSeleccionado,
} from "@/lib/draft/types";
import { FORMACIONES } from "@/lib/draft/formaciones";
import {
  getColorCalificacion,
  getEmojiCalificacion,
  puntosPorCalificacion,
  monedasPorCalificacion,
} from "@/lib/draft/simulacion";
import { DraftLogro } from "@/lib/draft/logros";
import { useDraftGame } from "../hooks/useDraftGame";

/* ─────────── Paleta ─────────── */
const NAVY = "#0a1729";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TXT = "#eef2fb";
const TXT_MUT = "#93a1bd";
const CARD = "#111d32";
const CARD_HOV = "#1a2744";
const RED = "#ef4444";
const GREEN = "#22c55e";

/* ─────────── Helpers visuales ─────────── */
function posicionLabel(p: DraftPosicion): string {
  const labels: Record<DraftPosicion, string> = {
    GOL: "POR",
    LD: "LD",
    ZAG: "CT",
    LE: "LI",
    VOL: "VOL",
    MEI: "MED",
    EXT: "EXT",
    CA: "DC",
    PD: "ED",
    PI: "EI",
    MCD: "MCD",
  };
  return labels[p] || p;
}

function posicionColor(p: DraftPosicion): string {
  if (p === "GOL") return "#3b82f6";
  if (["LD", "ZAG", "LE"].includes(p)) return "#22c55e";
  if (["VOL", "MEI", "MCD"].includes(p)) return "#f59e0b";
  return "#ef4444";
}

/* ─────────── Confetti Component ─────────── */
function Confetti() {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; delay: number; color: string; duration: number }>>([]);

  useEffect(() => {
    const colors = [GOLD, "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9", "#fd79a8"];
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2 + Math.random() * 3,
    }));
    setPieces(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            background: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─────────── Animación de entrada ─────────── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

/* ─────────── SetupScreen ─────────── */
function SetupScreen({
  formacion,
  setFormacion,
  estilo,
  setEstilo,
  modo,
  setModo,
  onStart,
}: {
  formacion: FormacionKey;
  setFormacion: (f: FormacionKey) => void;
  estilo: Estilo;
  setEstilo: (e: Estilo) => void;
  modo: Modo;
  setModo: (m: Modo) => void;
  onStart: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-bounce">🏆</div>
          <h1 className="text-2xl font-bold" style={{ color: TXT }}>Draft Mundial</h1>
          <p className="text-sm mt-2" style={{ color: TXT_MUT }}>
            Armá tu once ideal con leyendas de todas las Copas del Mundo
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: GOLD }}>Formación</label>
          <div className="grid grid-cols-4 gap-2">
            {FORMACIONES.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormacion(f.key)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all border hover:scale-105"
                style={{
                  background: formacion === f.key ? GOLD : CARD,
                  color: formacion === f.key ? NAVY : TXT,
                  borderColor: formacion === f.key ? GOLD : "rgba(255,255,255,0.1)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: TXT_MUT }}>{FORMACIONES.find((f) => f.key === formacion)?.descripcion}</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: GOLD }}>Estilo de juego</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "defensivo" as Estilo, label: "🛡️ Defensivo", desc: "Bonus por defensa" },
              { key: "equilibrado" as Estilo, label: "⚖️ Equilibrado", desc: "Sin bonus ni penal" },
              { key: "ofensivo" as Estilo, label: "⚔️ Ofensivo", desc: "Bonus por ataque" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setEstilo(s.key)}
                className="px-3 py-3 rounded-lg text-sm font-medium transition-all border text-center hover:scale-105"
                style={{
                  background: estilo === s.key ? GOLD : CARD,
                  color: estilo === s.key ? NAVY : TXT,
                  borderColor: estilo === s.key ? GOLD : "rgba(255,255,255,0.1)",
                }}
              >
                <div>{s.label}</div>
                <div className="text-xs opacity-70 mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="mb-8">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: GOLD }}>Modo de dificultad</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "clasico" as Modo, label: "📊 Clásico", desc: "Con stats" },
              { key: "almanaque" as Modo, label: "📚 Almanaque", desc: "Sin stats" },
              { key: "contrarreloj" as Modo, label: "⏱️ Contrarreloj", desc: "15 seg" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setModo(m.key)}
                className="px-3 py-3 rounded-lg text-sm font-medium transition-all border text-center hover:scale-105"
                style={{
                  background: modo === m.key ? GOLD : CARD,
                  color: modo === m.key ? NAVY : TXT,
                  borderColor: modo === m.key ? GOLD : "rgba(255,255,255,0.1)",
                }}
              >
                <div>{m.label}</div>
                <div className="text-xs opacity-70 mt-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <button
          onClick={onStart}
          className="w-full py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
          style={{ background: GOLD, color: NAVY, boxShadow: `0 4px 20px ${GOLD}44` }}
        >
          🎲 ¡Jugar ahora!
        </button>
        <Link href="/app" className="block text-center mt-4 text-sm" style={{ color: TXT_MUT }}>← Volver al lobby</Link>
      </FadeIn>
    </div>
  );
}

/* ─────────── EquipoBoard ─────────── */
function EquipoBoard({
  equipo,
  progreso,
}: {
  equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>;
  progreso: number;
}) {
  return (
    <FadeIn>
      <div className="rounded-xl p-4 mb-4" style={{ background: CARD }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>Tu equipo</span>
          <span className="text-xs font-bold" style={{ color: TXT_MUT }}>{Object.keys(equipo).length}/11</span>
        </div>
        <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%`, background: GOLD }} />
        </div>
        <div className="space-y-1">
          {[
            { label: "ATAQUE", posiciones: ["CA", "PD", "PI", "EXT"] as DraftPosicion[] },
            { label: "MEDIOCAMPO", posiciones: ["MEI", "VOL", "MCD"] as DraftPosicion[] },
            { label: "DEFENSA", posiciones: ["LD", "ZAG", "LE"] as DraftPosicion[] },
            { label: "PORTERO", posiciones: ["GOL"] as DraftPosicion[] },
          ].map((linea) => {
            const jugadores = linea.posiciones
              .map((p) => ({ pos: p, jug: equipo[p] }))
              .filter((x) => x.jug);
            if (jugadores.length === 0) return null;
            return (
              <div key={linea.label} className="flex gap-1 justify-center flex-wrap">
                {jugadores.map(({ pos, jug }) => (
                  <div
                    key={pos}
                    className="px-2 py-1.5 rounded-lg text-center min-w-[80px] transition-all hover:scale-105"
                    style={{ background: `${posicionColor(pos)}22`, border: `1px solid ${posicionColor(pos)}44` }}
                  >
                    <div className="text-[10px] font-bold" style={{ color: posicionColor(pos) }}>{posicionLabel(pos)}</div>
                    <div className="text-xs font-medium truncate" style={{ color: TXT }}>{jug!.nombre}</div>
                    <div className="text-[10px]" style={{ color: TXT_MUT }}>{jug!.bandera} {jug!.seleccion} {jug!.year}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </FadeIn>
  );
}

/* ─────────── TiradaPanel ─────────── */
function TiradaPanel({
  posicion,
  plantilla,
  onTirar,
  modo,
}: {
  posicion: DraftPosicion | null;
  plantilla: { seleccion: string; year: number; bandera: string } | null;
  onTirar: () => void;
  modo: Modo;
}) {
  return (
    <FadeIn>
      <div className="rounded-xl p-6 text-center" style={{ background: CARD }}>
        {plantilla ? (
          <>
            <div className="text-sm mb-2" style={{ color: TXT_MUT }}>Te tocó</div>
            <div className="text-3xl mb-2 animate-bounce">{plantilla.bandera}</div>
            <div className="text-xl font-bold mb-1" style={{ color: TXT }}>{plantilla.seleccion} {plantilla.year}</div>
            <div className="text-sm mb-4" style={{ color: GOLD }}>Elegí un {posicionLabel(posicion || "CA")}</div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4 animate-pulse">🎲</div>
            <div className="text-lg font-bold mb-2" style={{ color: TXT }}>
              {posicion ? `Necesitás un ${posicionLabel(posicion)}` : "¡Tirá el dado!"}
            </div>
            <div className="text-sm mb-4" style={{ color: TXT_MUT }}>
              {modo === "almanaque" ? "Se sorteará una selección histórica" : "Se sorteará una selección histórica con sus jugadores"}
            </div>
            <button
              onClick={onTirar}
              className="px-8 py-3 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 animate-pulse"
              style={{ background: GOLD, color: NAVY }}
            >
              🎲 Tirar dado
            </button>
          </>
        )}
      </div>
    </FadeIn>
  );
}

/* ─────────── SeleccionPanel ─────────── */
function SeleccionPanel({
  jugadores,
  posicion,
  modo,
  tiempoRestante,
  onSeleccionar,
}: {
  jugadores: JugadorSeleccionado[];
  posicion: DraftPosicion;
  modo: Modo;
  tiempoRestante: number | null;
  onSeleccionar: (id: string) => void;
}) {
  return (
    <FadeIn>
      <div className="rounded-xl p-4" style={{ background: CARD }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold" style={{ color: GOLD }}>Elegí tu {posicionLabel(posicion)}</span>
          {tiempoRestante !== null && (
            <span
              className="text-sm font-bold px-2 py-1 rounded-lg animate-pulse"
              style={{
                background: tiempoRestante <= 5 ? `${RED}33` : `${GOLD}33`,
                color: tiempoRestante <= 5 ? RED : GOLD,
              }}
            >
              ⏱️ {tiempoRestante}s
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {jugadores.map((j, i) => (
            <button
              key={j.id}
              onClick={() => onSeleccionar(j.id)}
              className="p-3 rounded-lg text-left transition-all hover:scale-[1.03] active:scale-[0.97] border animate-fade-in"
              style={{
                background: CARD_HOV,
                borderColor: "rgba(255,255,255,0.08)",
                animationDelay: `${i * 0.05}s`,
                animationFillMode: "both",
              }}
            >
              <div className="text-xs font-bold mb-1" style={{ color: posicionColor(j.posicion) }}>{posicionLabel(j.posicion)}</div>
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
      <div className="text-6xl mb-6 animate-bounce">⚡</div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: TXT }}>Calculando resultado...</h2>
      <p className="text-sm" style={{ color: TXT_MUT }}>Analizando fuerza, balance y coherencia de tu equipo</p>
      <div className="mt-6 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: GOLD, animationDelay: `${i * 0.2}s` }} />
        ))}
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
        <div className="text-4xl mb-3">🏆</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: GOLD2 }}>¡Nuevos logros!</h3>
        <div className="space-y-2 mb-4">
          {logros.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${GOLD}15` }}>
              <div className="text-2xl">{l.icon}</div>
              <div className="text-left">
                <div className="text-sm font-bold" style={{ color: TXT }}>{l.nombre}</div>
                <div className="text-xs" style={{ color: TXT_MUT }}>{l.descripcion}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
          style={{ background: GOLD, color: NAVY }}
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}

/* ─────────── RankingMini ─────────── */
function RankingMini() {
  const [entries, setEntries] = useState<Array<{ user_id: string; best_score: number; best_calificacion: string; username: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/draft/ranking?limit=5")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-4 text-sm" style={{ color: TXT_MUT }}>Cargando ranking...</div>;
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: CARD }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: GOLD }}>🏆 Top 5 Global</div>
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
function ResultadoScreen({
  resultado,
  equipo,
  onReiniciar,
}: {
  resultado: DraftResultado;
  equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>;
  onReiniciar: () => void;
}) {
  const color = getColorCalificacion(resultado.calificacion);
  const emoji = getEmojiCalificacion(resultado.calificacion);
  const puntos = puntosPorCalificacion(resultado.calificacion);
  const monedas = monedasPorCalificacion(resultado.calificacion);

  const compartir = useCallback(() => {
    const nombres = Object.values(equipo).filter(Boolean).map((j) => j!.nombre).slice(0, 3).join(", ");
    const texto = `🏆 Armé un equipo ${resultado.calificacion} (${resultado.puntaje}/100) en Draft Mundial de @ZonaMundial\n\n⭐ ${nombres}...\n\n¿Me superás? → webzonamundial.com/app/draft-mundial`;
    navigator.clipboard.writeText(texto).then(() => alert("¡Texto copiado al portapapeles!"));
  }, [resultado, equipo]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="text-6xl mb-3" style={{ animation: "bounce 1s infinite" }}>{emoji}</div>
          <h1 className="text-3xl font-bold" style={{ color }}>{resultado.calificacion}</h1>
          <div className="text-5xl font-black mt-2" style={{ color: TXT }}>
            {resultado.puntaje}<span className="text-xl font-normal" style={{ color: TXT_MUT }}>/100</span>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="rounded-xl p-4 mb-6 space-y-3" style={{ background: CARD }}>
          {[
            { label: "⚔️ Fuerza", value: resultado.fuerza, color: "#3b82f6" },
            { label: "⚖️ Balance", value: resultado.balance, color: "#22c55e" },
            { label: "🔗 Coherencia", value: resultado.coherencia, color: "#f59e0b" },
            { label: "🎯 Bonus estilo", value: resultado.bonusEstilo, color: GOLD },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="text-sm w-28" style={{ color: TXT }}>{stat.label}</span>
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
              <div className="text-xs" style={{ color: TXT_MUT }}>puntos</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: GOLD }}>+{monedas}</div>
              <div className="text-xs" style={{ color: TXT_MUT }}>monedas</div>
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.35}>
        <RankingMini />
      </FadeIn>

      <FadeIn delay={0.4}>
        <div className="rounded-xl p-4 mb-6" style={{ background: CARD }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: GOLD }}>Tu equipo</div>
          <div className="space-y-1">
            {Object.entries(equipo).map(([pos, jug]) => {
              if (!jug) return null;
              return (
                <div key={pos} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: `${posicionColor(pos as DraftPosicion)}11` }}>
                  <span className="text-xs font-bold w-8" style={{ color: posicionColor(pos as DraftPosicion) }}>{posicionLabel(pos as DraftPosicion)}</span>
                  <span className="text-sm flex-1 truncate" style={{ color: TXT }}>{jug.nombre}</span>
                  <span className="text-xs" style={{ color: TXT_MUT }}>{jug.bandera} {jug.seleccion} {jug.year}</span>
                  <span className="text-xs font-bold w-6 text-right" style={{ color: jug.fuerza >= 90 ? GREEN : TXT }}>{jug.fuerza}</span>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="space-y-3">
          <button
            onClick={compartir}
            className="w-full py-3 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border"
            style={{ borderColor: `${GOLD}66`, color: GOLD, background: `${GOLD}11` }}
          >
            📤 Compartir resultado
          </button>
          <button
            onClick={onReiniciar}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: GOLD, color: NAVY }}
          >
            🔄 Jugar de nuevo
          </button>
          <Link
            href="/app"
            className="block w-full py-3 rounded-xl text-center text-sm font-medium border transition-all"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: TXT }}
          >
            ← Volver al lobby
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}

/* ─────────── Página Principal ─────────── */
export default function DraftMundialJugarPage() {
  const game = useDraftGame();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (game.phase === "resultado" && game.resultado && ["Oro", "Platino", "Leyenda"].includes(game.resultado.calificacion)) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(t);
    }
  }, [game.phase, game.resultado]);

  return (
    <div className="min-h-screen pb-8" style={{ background: NAVY }}>
      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Logros popup */}
      {game.phase === "resultado" && game.logrosNuevos.length > 0 && (
        <LogrosPopup logros={game.logrosNuevos} onClose={game.marcarLogrosVistos} />
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ background: `${NAVY}ee`, backdropFilter: "blur(10px)" }}>
        <Link href="/app/draft-mundial" className="text-sm font-medium" style={{ color: TXT_MUT }}>← Draft Mundial</Link>
        {game.phase !== "setup" && game.phase !== "resultado" && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: TXT_MUT }}>{Object.keys(game.equipo).length}/11</span>
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${game.progreso}%`, background: GOLD }} />
            </div>
          </div>
        )}
      </div>

      {/* Contenido según fase */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        {game.phase === "setup" && (
          <SetupScreen
            formacion={game.formacion}
            setFormacion={game.setFormacion}
            estilo={game.estilo}
            setEstilo={game.setEstilo}
            modo={game.modo}
            setModo={game.setModo}
            onStart={game.iniciarJuego}
          />
        )}

        {game.phase !== "setup" && game.phase !== "resultado" && (
          <>
            <EquipoBoard equipo={game.equipo} progreso={game.progreso} />

            {game.phase === "tirada" && (
              <TiradaPanel
                posicion={game.posicionesPendientes[0] || null}
                plantilla={
                  game.tiradaActual
                    ? { seleccion: game.tiradaActual.plantilla.seleccion, year: game.tiradaActual.plantilla.year, bandera: game.tiradaActual.plantilla.bandera }
                    : null
                }
                onTirar={game.tirar}
                modo={game.modo}
              />
            )}

            {game.phase === "seleccion" && game.tiradaActual && (
              <SeleccionPanel
                jugadores={game.jugadoresDisponibles}
                posicion={game.tiradaActual.posicion}
                modo={game.modo}
                tiempoRestante={game.tiempoRestante}
                onSeleccionar={game.seleccionarJugador}
              />
            )}

            {game.phase === "simulacion" && <SimulacionScreen />}
          </>
        )}

        {game.phase === "resultado" && game.resultado && (
          <ResultadoScreen
            resultado={game.resultado}
            equipo={game.equipo}
            onReiniciar={game.reiniciar}
          />
        )}
      </div>
    </div>
  );
}
