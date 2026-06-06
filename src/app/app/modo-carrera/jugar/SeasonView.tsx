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
import type { PlayResult } from "@/lib/modo-carrera/season";
import { liveLockMs } from "@/lib/modo-carrera/live-season";
import { getUserTimezone } from "@/lib/bracket/match-time";
import { DEMAND_LABEL, VERDICT_LABEL } from "@/lib/modo-carrera/board";
import type { CareerState, SeasonMatch } from "@/lib/modo-carrera/types";

const OUTCOME_LABEL = { V: "Victoria", E: "Empate", D: "Derrota" } as const;
const OUTCOME_COLOR = { V: GREEN, E: GOLD, D: RED } as const;

function confColor(n: number): string {
  if (n >= 60) return GREEN;
  if (n >= 25) return GOLD;
  return RED;
}

function sel(slug: string) {
  return SELECCIONES.find((s) => s.slug === slug);
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

function FixtureRow({ m, isNext }: { m: SeasonMatch; isNext: boolean }) {
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
          <FlagName slug={m.opponentSlug} />
          <span style={{ fontSize: 11, color: DIM, fontWeight: 600 }}>{m.home ? "(L)" : "(V)"}</span>
        </div>
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

export default function SeasonView({
  career,
  paseDT = false,
  canLive = false,
  onStart,
  onStartLive,
  onPlayNext,
  onNextSeason,
}: {
  career: CareerState;
  paseDT?: boolean;
  canLive?: boolean;
  onStart: () => void;
  onStartLive?: () => void;
  onPlayNext: () => PlayResult | null;
  onNextSeason: () => void;
}) {
  const { season } = career;
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<PlayResult | null>(null);
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
                href="/premium"
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

  const play = () => {
    if (busy || !nextMatch || locked) return;
    setBusy(true);
    const res = onPlayNext();
    if (res && res.match) setReveal(res);
    setBusy(false);
  };

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
            Objetivo de la federación: <strong style={{ color: GOLD2 }}>{DEMAND_LABEL[career.board.objective]}</strong>
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
            <button
              type="button"
              onClick={play}
              disabled={busy}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: busy ? BG3 : `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                color: busy ? DIM : BG,
                fontWeight: 900,
                fontSize: 14,
                cursor: busy ? "default" : "pointer",
                boxShadow: busy ? "none" : "0 8px 22px rgba(201,168,76,0.32)",
              }}
            >
              {busy ? "Jugando…" : "Disputar partido"}
            </button>
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

      {/* Calendario */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {season.fixtures.map((m, i) => (
          <FixtureRow key={m.id} m={m} isNext={!season.finished && i === season.cursor} />
        ))}
      </div>

      {/* Revelado del resultado */}
      {reveal && reveal.match && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setReveal(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(6,11,20,0.86)",
            padding: 20,
            animation: "mcBannerIn .25s ease both",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 28,
              borderRadius: 18,
              background: BG2,
              border: `1px solid ${reveal.match.outcome ? OUTCOME_COLOR[reveal.match.outcome] : GOLD}`,
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>
              {reveal.match.label}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "18px 0", animation: "mcScoreIn .6s cubic-bezier(.2,.8,.2,1) both" }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <FlagName slug={nationSlug} size={26} />
              </div>
              <div style={{ fontSize: 38, fontWeight: 900, color: reveal.match.outcome ? OUTCOME_COLOR[reveal.match.outcome] : "#fff" }}>
                {reveal.match.gf} - {reveal.match.ga}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <FlagName slug={reveal.match.opponentSlug} size={26} />
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 900, color: reveal.match.outcome ? OUTCOME_COLOR[reveal.match.outcome] : "#fff" }}>
              {reveal.match.outcome ? OUTCOME_LABEL[reveal.match.outcome] : ""}
            </div>

            {/* Insignias de recompensa */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
              {reveal.leveledUp && (
                <span style={chip(GOLD)}>¡Subiste {reveal.levelsGained > 1 ? `${reveal.levelsGained} niveles` : "de nivel"}!</span>
              )}
              {reveal.champion && <span style={chip(GOLD)}>Copa del Mundo</span>}
              {reveal.eliminated && <span style={chip(RED)}>Eliminado</span>}
              {reveal.newTitles.map((t) => (
                <span key={t} style={chip(GOLD2)}>Título: {t}</span>
              ))}
              {reveal.boardVerdict && reveal.boardVerdict !== "pendiente" && (
                <span style={chip(confColor(reveal.boardConfidence ?? 50))}>
                  Federación: {VERDICT_LABEL[reveal.boardVerdict]}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setReveal(null)}
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
              Continuar
            </button>
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
