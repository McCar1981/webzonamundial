// src/app/app/modo-carrera/jugar/SeasonView.tsx
// Motor de temporada (UI). Muestra el calendario del Mundial que dirige el DT,
// permite disputar el próximo partido (simulación en el motor `season.ts`) y
// revela el resultado con una animación. Al terminar el torneo ofrece arrancar la
// siguiente temporada. SVG-only, sin emojis.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, flagUrl } from "./fx";
import { SELECCIONES } from "@/data/selecciones";
import { STAGE_LABEL } from "@/lib/modo-carrera/season";
import { activeInjuries } from "@/lib/modo-carrera/injuries";
import { activeSuspensions } from "@/lib/modo-carrera/suspensions";
import { FANTASY_ROSTERS } from "@/data/fantasy-rosters";
import type { PlayResult } from "@/lib/modo-carrera/season";
import { liveLockMs } from "@/lib/modo-carrera/live-season";
import { getUserTimezone } from "@/lib/bracket/match-time";
import { DEMAND_LABEL, VERDICT_LABEL } from "@/lib/modo-carrera/board";
import { TITLES } from "@/lib/modo-carrera/constants";
import type { CareerState, SeasonMatch, NarrativeEntry, Injury } from "@/lib/modo-carrera/types";
import { getFrescura, type PrepSessionId } from "@/lib/modo-carrera/concentracion";
import MatchLive from "./MatchLive";
import Concentracion from "./Concentracion";
import { Kit, Confetti } from "./Visuals";
import { useModalA11y } from "./useModalA11y";

const OUTCOME_LABEL = { V: "Victoria", E: "Empate", D: "Derrota" } as const;
const OUTCOME_COLOR = { V: GREEN, E: GOLD, D: RED } as const;

/** Nombre legible de un título por id (cae al id si no está en el catálogo). */
const TITLE_NAME: Record<string, string> = Object.fromEntries(TITLES.map((t) => [t.id, t.name]));
const titleName = (id: string) => TITLE_NAME[id] ?? id;

function confColor(n: number): string {
  if (n >= 60) return GREEN;
  if (n >= 25) return GOLD;
  return RED;
}

function sel(slug: string) {
  return SELECCIONES.find((s) => s.slug === slug);
}

// Fases del Mundial cuyos rivales NO se conocen hasta clasificar / llegar a la
// ronda: el sorteo del Mundial ocurre DESPUÉS de la clasificación, así que no se
// puede saber a quién enfrentas en la fase de grupos mientras aún clasificas.
const WC_STAGE_ORDER: SeasonMatch["stage"][] = [
  "amistoso", "clasificacion", "grupos", "octavos", "cuartos", "semifinal", "final", "campeon",
];
const WC_PHASES = new Set<SeasonMatch["stage"]>(["grupos", "octavos", "cuartos", "semifinal", "final"]);

/** ¿Se conoce ya el rival de este partido? Las fases del Mundial se ocultan hasta
 *  que la temporada alcanza esa ronda (los amistosos y la clasificación, no). */
function opponentRevealed(m: SeasonMatch, seasonStage: SeasonMatch["stage"]): boolean {
  if (m.played) return true;
  if (!WC_PHASES.has(m.stage)) return true;
  const cur = WC_STAGE_ORDER.indexOf(seasonStage);
  const ms = WC_STAGE_ORDER.indexOf(m.stage);
  return cur >= 0 && cur >= ms;
}

const HIDDEN_STAGE_HINT: Partial<Record<SeasonMatch["stage"], string>> = {
  grupos: "Tras la clasificación",
  octavos: "Tras la fase de grupos",
  cuartos: "Tras octavos",
  semifinal: "Tras cuartos",
  final: "Tras semifinales",
};

/** Marca del rival aún por determinar: usa `rival-incognito.webp` si existe; si no,
 *  cae al glifo "?". El 404 de la imagen no rompe nada. */
function RivalIncognito() {
  const [failed, setFailed] = useState(false);
  if (failed) return <>?</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/modo-carrera/rival-incognito.webp"
      alt=""
      width={22}
      height={15}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }}
    />
  );
}

/** "Faltan 3 días", "Faltan 5 h 20 min", etc. */
function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Disponible ahora";
  const min = Math.floor(ms / 60000);
  const days = Math.floor(min / 1440);
  const hours = Math.floor((min % 1440) / 60);
  const mins = min % 60;
  if (days >= 1) return `Faltan ${days} ${days === 1 ? "día" : "días"}${hours ? ` y ${hours} h` : ""}`;
  if (hours >= 1) return `Faltan ${hours} h ${mins} min`;
  return `Faltan ${mins} min`;
}

function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: getUserTimezone(),
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function FlagName({ slug, size = 22 }: { slug: string; size?: number }) {
  const s = sel(slug);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {s && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagUrl(s.flagCode)}
          alt=""
          style={{ width: size, height: size * 0.7, objectFit: "cover", borderRadius: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
        />
      )}
      <span>{s?.nombre ?? slug}</span>
    </span>
  );
}

function FixtureRow({ m, isNext, revealed }: { m: SeasonMatch; isNext: boolean; revealed: boolean }) {
  const color = m.outcome ? OUTCOME_COLOR[m.outcome] : isNext ? GOLD2 : MID;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 12,
        background: isNext ? "rgba(201,168,76,0.10)" : BG3,
        border: `1px solid ${isNext ? GOLD : m.played ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)"}`,
        opacity: m.played || isNext ? 1 : 0.6,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: isNext ? GOLD : DIM }}>
          {m.label}
          {isNext && " · próximo"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 14, color: "#fff", fontWeight: 700 }}>
          {revealed ? (
            <>
              <FlagName slug={m.opponentSlug} />
              <span style={{ fontSize: 11, color: DIM, fontWeight: 600 }}>{m.home ? "(L)" : "(V)"}</span>
            </>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: DIM, fontWeight: 700 }}>
              <span
                aria-hidden
                style={{ width: 22, height: 15.4, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}
              >
                <RivalIncognito />
              </span>
              Rival por determinar
            </span>
          )}
        </div>
        {!revealed && HIDDEN_STAGE_HINT[m.stage] && (
          <div style={{ fontSize: 11, color: DIM, marginTop: 4, fontStyle: "italic" }}>{HIDDEN_STAGE_HINT[m.stage]}</div>
        )}
        {!m.played && m.kickoffISO && (
          <div style={{ fontSize: 11, color: DIM, marginTop: 4, textTransform: "capitalize" }}>{fmtKickoff(m.kickoffISO)}</div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        {m.played && m.gf !== null && m.ga !== null ? (
          <div style={{ fontSize: 18, fontWeight: 900, color }}>
            {m.gf} - {m.ga}
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 800, color: isNext ? GOLD2 : DIM }}>—</div>
        )}
      </div>
    </div>
  );
}

/** Icono SVG de parte médico (cruz en escudo). Sin emojis. */
function MedicalIcon({ size = 16, color = RED }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 8v6M9 11h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Panel de bajas (lesiones) activas del plantel antes del próximo partido. */
function InjuriesPanel({ career }: { career: CareerState }) {
  const injuries = activeInjuries(career);
  if (injuries.length === 0) return null;
  const zona = (pos: string) => (pos === "FWD" || pos === "MID" ? "ataque" : "defensa");
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: "rgba(239,68,68,0.07)", border: `1px solid ${RED}44` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <MedicalIcon size={16} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: RED }}>
          Parte médico · {injuries.length} {injuries.length === 1 ? "baja" : "bajas"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {injuries.map((inj) => (
          <div key={inj.player} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#fff", fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inj.player}
              <span style={{ color: DIM, fontWeight: 600, marginLeft: 6 }}>· merma el {zona(inj.pos)}</span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: GOLD2, border: `1px solid ${GOLD2}55`, background: `${GOLD2}14`, borderRadius: 999, padding: "3px 9px" }}>
              {inj.matchesOut === 1 ? "1 partido" : `${inj.matchesOut} partidos`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Icono SVG de tarjeta (sanción). Sin emojis. */
function CardIcon({ size = 16, color = GOLD2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth="1.7" />
    </svg>
  );
}

/** Panel de sanciones por tarjetas activas antes del próximo partido. */
function SuspensionsPanel({ career }: { career: CareerState }) {
  const susp = activeSuspensions(career);
  if (susp.length === 0) return null;
  const zona = (pos: string) => (pos === "FWD" || pos === "MID" ? "ataque" : "defensa");
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: "rgba(201,168,76,0.07)", border: `1px solid ${GOLD2}44` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <CardIcon size={16} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD2 }}>
          Sancionados · {susp.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {susp.map((s) => (
          <div key={s.player} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#fff", fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.player}
              <span style={{ color: DIM, fontWeight: 600, marginLeft: 6 }}>
                · {s.reason === "roja" ? "roja directa" : "ciclo de amarillas"} · merma el {zona(s.pos)}
              </span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: GOLD2, border: `1px solid ${GOLD2}55`, background: `${GOLD2}14`, borderRadius: 999, padding: "3px 9px" }}>
              {s.matchesOut === 1 ? "1 partido" : `${s.matchesOut} partidos`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Indicador de frescura del grupo (recurso de la concentración entre partidos). */
function FrescuraPanel({ career }: { career: CareerState }) {
  const f = Math.round(getFrescura(career));
  const color = f >= 70 ? GREEN : f >= 45 ? GOLD2 : RED;
  const label = f >= 80 ? "Pletórico" : f >= 60 ? "En forma" : f >= 40 ? "Justo" : f >= 20 ? "Cansado" : "Fundido";
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: BG3, border: `1px solid ${color}33` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD }}>
          Frescura del grupo
        </span>
        <span style={{ fontSize: 14, fontWeight: 900, color }}>
          {f}
          <span style={{ fontSize: 11, fontWeight: 700, color: DIM }}> · {label}</span>
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${f}%`, height: "100%", background: color, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 8, lineHeight: 1.5 }}>
        Antes de cada partido, concentra al grupo y elige cómo entrenar. La recuperación recarga frescura; el trabajo físico exige.
      </div>
    </div>
  );
}

/** Icono SVG de brazalete de capitán. Sin emojis. */
function CaptainIcon({ size = 16, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7" />
      <path d="M14.5 9.5a3 3 0 1 0 0 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Designación de capitán: el DT elige a un referente del plantel. Da un pequeño
 * bonus de liderazgo (vía dtBonus) y refuerza la idea de gestión de vestuario.
 */
function CaptainPanel({ career, onSetCaptain }: { career: CareerState; onSetCaptain: (player: string) => void }) {
  const [open, setOpen] = useState(false);
  const roster = FANTASY_ROSTERS[career.identity.nationSlug ?? ""] ?? [];
  if (roster.length === 0) return null;
  const captain = career.squad?.captain ?? null;
  const current = roster.find((p) => p.name === captain) ?? null;
  // Candidatos preferentes: referentes de campo (líderes naturales del vestuario).
  const candidates = [...roster].sort((a, b) => {
    const rank = (pos: string) => (pos === "DEF" ? 0 : pos === "MID" ? 1 : pos === "GK" ? 2 : 3);
    return rank(a.pos) - rank(b.pos);
  });
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: "rgba(201,168,76,0.06)", border: `1px solid ${GOLD}33` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <CaptainIcon size={16} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD }}>Capitán</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: current ? "#fff" : DIM, marginLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current ? `${current.name} · ${current.pos}` : "Sin designar"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: GOLD2, background: `${GOLD2}14`, border: `1px solid ${GOLD2}55`, borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}
        >
          {open ? "Cerrar" : current ? "Cambiar" : "Designar"}
        </button>
      </div>
      {!current && !open && (
        <div style={{ fontSize: 12, color: DIM, marginTop: 8, lineHeight: 1.5 }}>
          Nombra un capitán para sumar un plus de liderazgo al vestuario.
        </div>
      )}
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {candidates.map((p) => {
            const active = p.name === captain;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  onSetCaptain(p.name);
                  setOpen(false);
                }}
                style={{
                  textAlign: "left",
                  padding: "9px 11px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: active ? "rgba(201,168,76,0.16)" : BG3,
                  border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: active ? GOLD2 : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{p.pos}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SeasonView({
  career,
  paseDT = false,
  canLive = false,
  onStart,
  onStartLive,
  onResolveMatch,
  onChoose,
  onSetCaptain,
  onSetLineup,
  onSetPrep,
  onNextSeason,
}: {
  career: CareerState;
  paseDT?: boolean;
  canLive?: boolean;
  onStart: () => void;
  onStartLive?: () => void;
  onResolveMatch: (gf: number, ga: number, wasBehind?: boolean, injury?: Injury, moraleDelta?: number) => PlayResult | null;
  onChoose: (entryId: string, choiceId: string) => void;
  onSetCaptain: (player: string) => void;
  onSetLineup?: (formation: string, lineup: string[]) => void;
  onSetPrep?: (sessions: string[]) => Injury | null;
  onNextSeason: () => void;
}) {
  const { season } = career;
  const [live, setLive] = useState(false);
  const [prepping, setPrepping] = useState(false);
  const [reveal, setReveal] = useState<PlayResult | null>(null);
  const [pressConf, setPressConf] = useState<NarrativeEntry | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Tick por minuto para refrescar la cuenta atrás de la Temporada en Vivo.
  useEffect(() => {
    if (!season?.live) return;
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, [season?.live]);

  const nationSlug = career.identity.nationSlug ?? "";
  const nation = sel(nationSlug);

  // Sin temporada activa → elige una de las DOS modalidades (Libre vs En Vivo).
  if (!season) {
    const liveAvailable = paseDT && canLive;
    return (
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px" }}>
        <style>{`
          @media (max-width: 720px) { .mc-modes-grid { grid-template-columns: 1fr !important; } }
        `}</style>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>Elige tu modalidad</h2>
          <p style={{ fontSize: 14, color: MID, marginTop: 8, lineHeight: 1.6 }}>
            {nation ? (
              <>Llevarás a <strong style={{ color: "#fff" }}>{nation.nombre}</strong> a por la gloria. Dos formas de vivirlo:</>
            ) : (
              "Configura tu selección para comenzar el torneo."
            )}
          </p>
        </div>

        <div className="mc-modes-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
          {/* ── Modo Libre ── */}
          <div style={{ display: "flex", flexDirection: "column", padding: 22, borderRadius: 18, background: BG2, border: `1px solid ${GOLD}44` }}>
            <span style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 999, padding: "3px 10px" }}>
              Disponible siempre
            </span>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: "#fff", margin: "12px 0 6px" }}>Modo Libre</h3>
            <p style={{ fontSize: 13.5, color: MID, lineHeight: 1.6, flex: 1 }}>
              Un Mundial simulado a tu ritmo. Sorteamos los rivales según el ranking FIFA y disputas cada
              partido cuando quieras, sin esperar a nadie.
            </p>
            <button
              type="button"
              onClick={onStart}
              style={{
                marginTop: 18,
                padding: "13px 24px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                color: BG,
                fontWeight: 900,
                fontSize: 14.5,
                cursor: "pointer",
                boxShadow: "0 10px 30px rgba(201,168,76,0.32)",
              }}
            >
              Comenzar temporada {career.progression.season}
            </button>
          </div>

          {/* ── Mundial en Vivo ── */}
          <div style={{ display: "flex", flexDirection: "column", padding: 22, borderRadius: 18, background: BG2, border: `1px solid ${canLive ? GREEN : "rgba(255,255,255,0.08)"}44`, opacity: canLive ? 1 : 0.85 }}>
            <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: liveAvailable ? GREEN : GOLD2, border: `1px solid ${liveAvailable ? GREEN : GOLD2}55`, borderRadius: 999, padding: "3px 10px" }}>
              {liveAvailable && <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />}
              {liveAvailable ? "En vivo" : "Pase DT"}
            </span>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: "#fff", margin: "12px 0 6px" }}>Mundial en Vivo</h3>
            <p style={{ fontSize: 13.5, color: MID, lineHeight: 1.6, flex: 1 }}>
              Tu carrera avanza al ritmo del Mundial real{nation ? ` de ${nation.nombre}` : ""}: rivales y horarios
              reales, y cada partido se desbloquea a la hora exacta del saque.
            </p>

            {liveAvailable && onStartLive ? (
              <button
                type="button"
                onClick={onStartLive}
                style={{
                  marginTop: 18,
                  padding: "13px 24px",
                  borderRadius: 12,
                  border: `1px solid ${GREEN}`,
                  background: "rgba(34,197,94,0.14)",
                  color: GREEN,
                  fontWeight: 800,
                  fontSize: 14.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                Jugar en Vivo
              </button>
            ) : canLive ? (
              <Link
                href="/pro"
                style={{
                  marginTop: 18,
                  padding: "13px 24px",
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                  color: BG,
                  fontWeight: 800,
                  fontSize: 14.5,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Desbloquear con Pase DT
              </Link>
            ) : (
              <div style={{ marginTop: 18, fontSize: 12.5, color: DIM, lineHeight: 1.5, fontStyle: "italic" }}>
                {nation ? `${nation.nombre} no disputa el Mundial real, así que esta modalidad no está disponible para esta selección.` : "Elige una selección clasificada al Mundial para habilitar esta modalidad."}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const nextMatch = !season.finished ? season.fixtures[season.cursor] ?? null : null;
  const lockMs = season.live && nextMatch ? liveLockMs(nextMatch, nowMs) : 0;
  const locked = lockMs > 0;

  // Semana de concentración (preparación + entrenamiento): es una acción propia,
  // accesible siempre antes del partido. Antes solo se abría al pulsar "Disputar
  // partido", lo que la escondía; ahora tiene su botón.
  const openPrep = () => {
    if (live || prepping || !nextMatch || locked) return;
    setPrepping(true);
  };

  // Disputar el partido directamente. La concentración (si se hizo) ya quedó
  // guardada en el plantel y se aplica igual; aquí se salta a la pizarra del once.
  const openMatch = () => {
    if (live || prepping || !nextMatch || locked) return;
    setLive(true);
  };

  const finishMatch = (gf: number, ga: number, wasBehind?: boolean, injury?: Injury, moraleDelta?: number) => {
    const res = onResolveMatch(gf, ga, wasBehind, injury, moraleDelta);
    setLive(false);
    if (res && res.match) setReveal(res);
  };

  // Cierra el revelado del resultado y, si saltó una rueda de prensa, la abre a
  // continuación (decisión que impacta moral y confianza de la federación).
  const closeReveal = () => {
    const p = reveal?.press ?? null;
    setReveal(null);
    if (p) setPressConf(p);
  };

  // Resuelve la rueda de prensa: aplica el tono elegido y cierra el modal.
  const choosePress = (choiceId: string) => {
    if (pressConf) onChoose(pressConf.id, choiceId);
    setPressConf(null);
  };

  // A11y de los diálogos de la vista: foco al abrirse y Escape donde hay cierre
  // seguro. La rueda de prensa EXIGE decisión (no tiene cierre), solo recibe foco.
  const revealRef = useModalA11y<HTMLDivElement>(closeReveal, !!(reveal && reveal.match));
  const pressRef = useModalA11y<HTMLDivElement>(undefined, !!(pressConf && pressConf.choices));

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <style>{`
        @keyframes mcScoreIn { 0% { transform: scale(.7); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes mcBannerIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Temporada {season.season}</h2>
            {season.live && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: GREEN, border: `1px solid ${GREEN}66`, background: "rgba(34,197,94,0.12)", borderRadius: 999, padding: "3px 10px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                EN VIVO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>
            {nation ? `Al mando de ${nation.nombre}` : "Mundial"} · {STAGE_LABEL[season.stage]}
          </p>
          <p style={{ fontSize: 12, color: DIM, marginTop: 6 }}>
            {season.live ? "Objetivo del Mundial" : "Objetivo de la federación"}: <strong style={{ color: GOLD2 }}>{DEMAND_LABEL[career.board.objective]}</strong>
            {" · "}
            Confianza: <strong style={{ color: confColor(career.board.confidence) }}>{career.board.confidence}/100</strong>
          </p>
        </div>
        {!season.finished && nextMatch && (
          locked ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: GREEN }}>El partido te espera</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: GOLD2, marginTop: 2 }}>{fmtCountdown(lockMs)}</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>Se juega a la hora real del saque</div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {onSetPrep && (
                <button
                  type="button"
                  onClick={openPrep}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: `1px solid ${GOLD}`,
                    background: career.squad?.prep?.sessions?.length ? "rgba(201,168,76,0.16)" : "transparent",
                    color: GOLD2,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {career.squad?.prep?.sessions?.length ? "Concentración lista" : "Concentración"}
                </button>
              )}
              <button
                type="button"
                onClick={openMatch}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                  color: BG,
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 8px 22px rgba(201,168,76,0.32)",
                }}
              >
                Disputar partido
              </button>
            </div>
          )
        )}
      </div>

      {/* Estado terminal del torneo */}
      {season.finished && (
        <div
          style={{
            marginBottom: 18,
            padding: 20,
            borderRadius: 16,
            textAlign: "center",
            background: season.stage === "campeon" ? "rgba(201,168,76,0.14)" : "rgba(239,68,68,0.10)",
            border: `1px solid ${season.stage === "campeon" ? GOLD : RED}`,
            animation: "mcBannerIn .5s ease both",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: season.stage === "campeon" ? GOLD : RED }}>
            {season.stage === "campeon" ? "Torneo conquistado" : "Torneo finalizado"}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "6px 0 14px" }}>
            {season.stage === "campeon" ? "¡Campeones del Mundo!" : "Eliminados del Mundial"}
          </h3>
          <button
            type="button"
            onClick={onNextSeason}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: `1px solid ${GOLD}`,
              background: "rgba(201,168,76,0.12)",
              color: GOLD2,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Comenzar temporada {season.season + 1}
          </button>
        </div>
      )}

      {/* Bajas (lesiones) del plantel */}
      {!season.finished && <FrescuraPanel career={career} />}
      {!season.finished && <CaptainPanel career={career} onSetCaptain={onSetCaptain} />}
      {!season.finished && <InjuriesPanel career={career} />}
      {!season.finished && <SuspensionsPanel career={career} />}

      {/* Calendario */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {season.fixtures.map((m, i) => (
          <FixtureRow
            key={m.id}
            m={m}
            isNext={!season.finished && i === season.cursor}
            revealed={opponentRevealed(m, season.stage)}
          />
        ))}
      </div>

      {/* Concentración: semana de preparación previa al partido */}
      {prepping && nextMatch && onSetPrep && (
        <Concentracion
          career={career}
          opponentName={sel(nextMatch.opponentSlug)?.nombre ?? nextMatch.opponentSlug}
          onConfirm={(sessions: PrepSessionId[]) => onSetPrep(sessions)}
          onPlay={() => {
            setPrepping(false);
            setLive(true);
          }}
          onCancel={() => setPrepping(false)}
        />
      )}

      {/* Partido interactivo */}
      {live && nextMatch && (
        <MatchLive
          career={career}
          match={nextMatch}
          onFinish={finishMatch}
          onCancel={() => setLive(false)}
          onLineupChange={onSetLineup}
        />
      )}

      {/* Revelado del resultado */}
      {reveal && reveal.match && (
        <div
          ref={revealRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          onClick={closeReveal}
          style={{
            outline: "none",
            position: "fixed",
            inset: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.86)",
            padding: 20,
            animation: "mcBannerIn .25s ease both",
          }}
        >
          {(() => {
            const oc = reveal.match.outcome;
            const ocColor = oc ? OUTCOME_COLOR[oc] : GOLD;
            const celebrate = reveal.champion || oc === "V";
            return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              overflow: "hidden",
              width: "100%",
              maxWidth: 440,
              padding: 28,
              borderRadius: 18,
              background: `radial-gradient(120% 80% at 50% 0%, ${ocColor}24, ${BG2} 62%)`,
              border: `1px solid ${ocColor}`,
              textAlign: "center",
              boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${ocColor}22`,
            }}
          >
            {celebrate && <Confetti pieces={reveal.champion ? 48 : 30} />}

            <div style={{ position: "relative", zIndex: 3 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>
              {reveal.champion ? "Campeón del Mundo" : reveal.match.label}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "16px 0 6px", animation: "mcScoreIn .6s cubic-bezier(.2,.8,.2,1) both" }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                <Kit slug={nationSlug} size={72} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: oc ? ocColor : "#fff", minWidth: 92 }}>
                {reveal.match.gf} - {reveal.match.ga}
              </div>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
                <Kit slug={reveal.match.opponentSlug} size={72} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: "right", fontSize: 12 }}>
                <FlagName slug={nationSlug} size={20} />
              </div>
              <div style={{ width: 40 }} />
              <div style={{ flex: 1, textAlign: "left", fontSize: 12 }}>
                <FlagName slug={reveal.match.opponentSlug} size={20} />
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 900, color: oc ? ocColor : "#fff" }}>
              {oc ? OUTCOME_LABEL[oc] : ""}
            </div>

            {/* Insignias de recompensa */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
              {reveal.leveledUp && (
                <span style={chip(GOLD)}>¡Subiste {reveal.levelsGained > 1 ? `${reveal.levelsGained} niveles` : "de nivel"}!</span>
              )}
              {reveal.champion && <span style={chip(GOLD)}>Copa del Mundo</span>}
              {reveal.eliminated && <span style={chip(RED)}>Eliminado</span>}
              {reveal.newTitles.map((t) => (
                <span key={t} style={chip(GOLD2)}>Título: {titleName(t)}</span>
              ))}
              {reveal.boardVerdict && reveal.boardVerdict !== "pendiente" && (
                <span style={chip(confColor(reveal.boardConfidence ?? 50))}>
                  Federación: {VERDICT_LABEL[reveal.boardVerdict]}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeReveal}
              style={{
                marginTop: 22,
                padding: "11px 26px",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                color: BG,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {reveal.press ? "Ir a la rueda de prensa" : "Continuar"}
            </button>
            </div>
          </div>
            );
          })()}
        </div>
      )}

      {/* Rueda de prensa post-partido (decisión que impacta moral y confianza) */}
      {pressConf && pressConf.choices && (
        <div
          ref={pressRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            outline: "none",
            position: "fixed",
            inset: 0,
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.9)",
            padding: 20,
            animation: "mcBannerIn .25s ease both",
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              width: "100%",
              maxWidth: 480,
              borderRadius: 18,
              border: `1px solid ${GOLD}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              backgroundImage:
                "linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.94)), url('/img/modo-carrera/narrativa/prensa-podio.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div style={{ padding: 26 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 999, padding: "3px 10px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: RED, boxShadow: `0 0 8px ${RED}` }} />
                Rueda de prensa · en directo
              </div>
              <p style={{ fontSize: 16, color: "#fff", lineHeight: 1.6, fontWeight: 600, margin: "16px 0 6px" }}>
                {pressConf.body}
              </p>
              <p style={{ fontSize: 12, color: DIM, marginBottom: 16 }}>
                Tu respuesta afectará a la moral del vestuario y a la confianza de la federación.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pressConf.choices.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => choosePress(ch.id)}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(20,17,10,0.72)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      transition: "border-color .15s, background .15s",
                    }}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.borderColor = GOLD;
                      ev.currentTarget.style.background = "rgba(201,168,76,0.14)";
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      ev.currentTarget.style.background = "rgba(20,17,10,0.72)";
                    }}
                  >
                    {ch.label}
                    <span style={{ display: "block", fontSize: 11.5, color: MID, marginTop: 4, fontWeight: 600 }}>{ch.effect}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
    color,
    border: `1px solid ${color}66`,
    background: `${color}1a`,
    borderRadius: 999,
    padding: "4px 10px",
  };
}
