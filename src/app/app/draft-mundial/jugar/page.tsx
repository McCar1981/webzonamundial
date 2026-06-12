"use client";

// src/app/app/draft-mundial/jugar/page.tsx
// Juego Draft Mundial — Nueva mecánica: elegí cualquier jugador de la selección

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
  puntosPorCalificacion,
  monedasPorCalificacion,
  getNearMiss,
} from "@/lib/draft/simulacion";
import { DraftLogro } from "@/lib/draft/logros";
import { generarCampana, Campana, CampanaPartido, calcularBonusCampana } from "@/lib/draft/campana";
import { useDraftGame } from "../hooks/useDraftGame";
import SoccerField from "../components/SoccerField";
import {
  IconTrophy, IconDice, IconShield, IconScale, IconSwords,
  IconChart, IconBook, IconTimer, IconLink, IconTarget,
  IconShare, IconRefresh, IconBolt, IconArrowLeft,
  IconCalificacion, IconLogro, IconGlobe,
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

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}>
      {children}
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
function SetupScreen({
  formacion, setFormacion, estilo, setEstilo, modo, setModo, onStart,
}: {
  formacion: FormacionKey; setFormacion: (f: FormacionKey) => void;
  estilo: Estilo; setEstilo: (e: Estilo) => void;
  modo: Modo; setModo: (m: Modo) => void;
  onStart: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3"><IconTrophy size={48} color={GOLD} className="animate-bounce" /></div>
          <h1 className="text-2xl font-bold" style={{ color: TXT }}>Draft Mundial</h1>
          <p className="text-sm mt-2" style={{ color: TXT_MUT }}>Arma tu once ideal con leyendas de todas las Copas del Mundo</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: GOLD }}>Formación</label>
          <div className="grid grid-cols-4 gap-2">
            {FORMACIONES.map((f) => (
              <button key={f.key} onClick={() => setFormacion(f.key)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all border hover:scale-105"
                style={{ background: formacion === f.key ? GOLD : CARD, color: formacion === f.key ? NAVY : TXT, borderColor: formacion === f.key ? GOLD : "rgba(255,255,255,0.1)" }}>
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
              { key: "defensivo" as Estilo, label: "Defensivo", icon: IconShield, desc: "Bonus por defensa" },
              { key: "equilibrado" as Estilo, label: "Equilibrado", icon: IconScale, desc: "Sin bonus ni penal" },
              { key: "ofensivo" as Estilo, label: "Ofensivo", icon: IconSwords, desc: "Bonus por ataque" },
            ].map((s) => (
              <button key={s.key} onClick={() => setEstilo(s.key)}
                className="px-3 py-3 rounded-lg text-sm font-medium transition-all border text-center hover:scale-105"
                style={{ background: estilo === s.key ? GOLD : CARD, color: estilo === s.key ? NAVY : TXT, borderColor: estilo === s.key ? GOLD : "rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-center gap-1.5"><s.icon size={16} color={estilo === s.key ? NAVY : TXT} />{s.label}</div>
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
              { key: "clasico" as Modo, label: "Clásico", icon: IconChart, desc: "Con stats" },
              { key: "almanaque" as Modo, label: "Almanaque", icon: IconBook, desc: "Sin stats" },
              { key: "contrarreloj" as Modo, label: "Contrarreloj", icon: IconTimer, desc: "10 seg" },
            ].map((m) => (
              <button key={m.key} onClick={() => setModo(m.key)}
                className="px-3 py-3 rounded-lg text-sm font-medium transition-all border text-center hover:scale-105"
                style={{ background: modo === m.key ? GOLD : CARD, color: modo === m.key ? NAVY : TXT, borderColor: modo === m.key ? GOLD : "rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-center gap-1.5"><m.icon size={16} color={modo === m.key ? NAVY : TXT} />{m.label}</div>
                <div className="text-xs opacity-70 mt-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <button onClick={onStart}
          className="w-full py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg flex items-center justify-center gap-2"
          style={{ background: GOLD, color: NAVY, boxShadow: `0 4px 20px ${GOLD}44` }}>
          <IconDice size={22} color={NAVY} /><span>¡Jugar ahora!</span>
        </button>
        <Link href="/app" className="flex items-center justify-center gap-1 mt-4 text-sm" style={{ color: TXT_MUT }}><IconArrowLeft size={14} color={TXT_MUT} />Volver al lobby</Link>
      </FadeIn>
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
  return (
    <FadeIn>
      <div className="rounded-xl p-6 text-center" style={{ background: CARD }}>
        {plantilla ? (
          <>
            <div className="text-sm mb-2" style={{ color: TXT_MUT }}>Te tocó</div>
            <div className="flex justify-center mb-2 animate-bounce">
              <FlagImage code={seleccionISO(plantilla.seleccion)} alt={plantilla.seleccion} width={48} className="rounded shadow-md" fallback={plantilla.seleccion.slice(0, 3).toUpperCase()} />
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: TXT }}>{plantilla.seleccion} {plantilla.year}</div>
            <div className="text-sm mb-4" style={{ color: GOLD }}>Elige un jugador para tu equipo</div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4"><IconDice size={56} color={GOLD} className="animate-pulse" /></div>
            <div className="text-lg font-bold mb-2" style={{ color: TXT }}>¡Tira el dado!</div>
            <div className="text-sm mb-4" style={{ color: TXT_MUT }}>Se sorteará una selección histórica con sus jugadores</div>
            <button onClick={onTirar}
              className="px-8 py-3 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 animate-pulse flex items-center gap-2 mx-auto"
              style={{ background: GOLD, color: NAVY }}>
              <IconDice size={20} color={NAVY} />Tirar dado
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
          <FlagImage code={seleccionISO(plantilla.seleccion)} alt={plantilla.seleccion} width={46} className="rounded shadow-md flex-shrink-0" fallback={plantilla.seleccion.slice(0, 3).toUpperCase()} />
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
                {posicionesOcupadas.includes(j.posicion) && <span className="text-[10px] font-bold" style={{ color: RED }}>YA TOMADO</span>}
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
function ResultadoScreen({ resultado, equipo, campanaBonus, onReiniciar }: { resultado: DraftResultado; equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>; campanaBonus?: number; onReiniciar: () => void }) {
  const color = getColorCalificacion(resultado.calificacion);
  const puntos = puntosPorCalificacion(resultado.calificacion);
  const monedas = monedasPorCalificacion(resultado.calificacion);
  const nearMiss = getNearMiss(resultado.puntaje);
  const bonusCamp = campanaBonus ?? 0;

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
            <div><div className="text-2xl font-bold" style={{ color: GOLD }}>+{puntos}</div><div className="text-xs" style={{ color: TXT_MUT }}>puntos XP</div></div>
            <div>
              <div className="text-2xl font-bold" style={{ color: GOLD }}>+{monedas + bonusCamp}</div>
              <div className="text-xs" style={{ color: TXT_MUT }}>monedas</div>
              {bonusCamp > 0 && (
                <div className="text-[10px] font-bold mt-0.5 animate-fade-in" style={{ color: "#22c55e" }}>
                  ({monedas} base +{bonusCamp} campaña)
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.35}><RankingMini /></FadeIn>

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
                  <span className="text-xs flex items-center gap-1" style={{ color: TXT_MUT }}>
                    <FlagImage code={seleccionISO(jug.seleccion)} alt={jug.seleccion} width={16} className="rounded-sm" fallback={jug.seleccion.slice(0, 3).toUpperCase()} />
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

function Marcador({ equipo, formacion, puntajeParcial }: { equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>; formacion: FormacionKey; puntajeParcial?: number | null }) {
  const posiciones = FORMACIONES.find((f) => f.key === formacion)?.posiciones ?? [];
  // El juego guarda una posición por tipo → posiciones únicas en orden.
  const unicas = posiciones.filter((p, i) => posiciones.indexOf(p) === i);
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
            Marcador · {colocados.length}/{unicas.length}
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

      {/* Once por posición */}
      <div className="mt-4">
        {unicas.map((pos) => {
          const j = equipo[pos];
          return (
            <div key={pos} className="flex items-center gap-3 py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs font-bold w-9 flex-shrink-0" style={{ color: j ? posicionColor(pos) : TXT_MUT, opacity: j ? 1 : 0.55 }}>{posicionLabel(pos)}</span>
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
  equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>;
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

/* ─────────── Página Principal ─────────── */
export default function DraftMundialJugarPage() {
  const game = useDraftGame();
  // Posiciones reales a cubrir (el juego guarda una por tipo).
  const totalSlots = new Set(FORMACIONES.find((f) => f.key === game.formacion)?.posiciones ?? []).size;
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
      <style jsx global>{`@keyframes fade-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} } .animate-fade-in{animation:fade-in .4s ease-out forwards} @keyframes panic-shake{0%,100%{transform:translateX(0)}15%,45%,75%{transform:translateX(-4px)}30%,60%,90%{transform:translateX(4px)}} .animate-panic-shake{animation:panic-shake 0.25s ease-in-out infinite}`}</style>
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
        {game.phase === "setup" && (
          <SetupScreen
            formacion={game.formacion} setFormacion={game.setFormacion}
            estilo={game.estilo} setEstilo={game.setEstilo}
            modo={game.modo} setModo={game.setModo}
            onStart={game.iniciarJuego}
          />
        )}

        {game.phase !== "setup" && game.phase !== "resultado" && game.phase !== "campana" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Columna izquierda: Campo + Info */}
            <div>
              <FadeIn>
                <SoccerField
                  equipo={game.equipo}
                  formacion={game.formacion}
                  highlightPos={game.posicionesPendientes[0] || null}
                />
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="mt-3">
                  <Marcador equipo={game.equipo} formacion={game.formacion} puntajeParcial={game.puntajeParcial} />
                </div>
              </FadeIn>
            </div>

            {/* Columna derecha: Tirada / Selección */}
            <div>
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
          <ResultadoScreen resultado={game.resultado} equipo={game.equipo} campanaBonus={game.campanaBonus} onReiniciar={game.reiniciar} />
        )}
      </div>
    </div>
  );
}
