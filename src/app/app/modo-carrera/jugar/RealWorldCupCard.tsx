// src/app/app/modo-carrera/jugar/RealWorldCupCard.tsx
//
// Puente emocional entre el Modo Carrera (ficción) y el Mundial 2026 REAL.
// Cruza la selección que dirige el DT con los partidos reales de matches.ts y
// muestra su próximo encuentro real (rival, sede, fecha en la hora del usuario)
// con una cuenta atrás en vivo. Es además el embudo hacia el "Pase DT": invita a
// dirigir a tu selección siguiendo los resultados reales del torneo.
//
// Client-only, sin coste de API (solo datos locales). SVG/sin emojis.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, flagUrl } from "./fx";
import { SELECCIONES } from "@/data/selecciones";
import { MATCHES, type Match } from "@/data/matches";
import { etToDate, getUserTimezone } from "@/lib/bracket/match-time";

interface RealFixture {
  match: Match;
  kickoff: Date;
  isHome: boolean;
  oppName: string;
  oppFlag: string;
}

function buildFixtures(flagCode: string): RealFixture[] {
  return MATCHES.filter((m) => m.hf === flagCode || m.af === flagCode)
    .map((m) => {
      const kickoff = etToDate(m.d, m.t);
      if (!kickoff) return null;
      const isHome = m.hf === flagCode;
      return {
        match: m,
        kickoff,
        isHome,
        oppName: isHome ? m.a : m.h,
        oppFlag: isHome ? m.af : m.hf,
      };
    })
    .filter((f): f is RealFixture => f !== null)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
}

/** "en 3 días", "en 5 h 20 min", "Comienza ya", etc. */
function countdownText(ms: number): string {
  if (ms <= 0) return "En juego ahora";
  const min = Math.floor(ms / 60000);
  const days = Math.floor(min / 1440);
  const hours = Math.floor((min % 1440) / 60);
  const mins = min % 60;
  if (days >= 1) return `Faltan ${days} ${days === 1 ? "día" : "días"}${hours ? ` y ${hours} h` : ""}`;
  if (hours >= 1) return `Faltan ${hours} h ${mins} min`;
  return `Faltan ${mins} min`;
}

export default function RealWorldCupCard({ nationSlug, paseDT = false }: { nationSlug: string | null; paseDT?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  const nation = useMemo(() => SELECCIONES.find((s) => s.slug === nationSlug), [nationSlug]);
  const fixtures = useMemo(() => (nation ? buildFixtures(nation.flagCode) : []), [nation]);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!nation) return null;

  // Próximo partido real: el primero cuyo final estimado (+2,5 h) no ha pasado.
  const LIVE_WINDOW = 150 * 60000;
  const next = now === null ? null : fixtures.find((f) => f.kickoff.getTime() + LIVE_WINDOW > now);
  const playedCount = now === null ? 0 : fixtures.filter((f) => f.kickoff.getTime() + LIVE_WINDOW <= now).length;
  const msToKick = next && now !== null ? next.kickoff.getTime() - now : 0;
  const live = next ? msToKick <= 0 : false;

  const when = next
    ? new Intl.DateTimeFormat("es-ES", {
        timeZone: getUserTimezone(),
        weekday: "long",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(next.kickoff)
    : "";

  return (
    <div style={{ padding: 20, borderRadius: 16, background: BG2, border: "1px solid rgba(201,168,76,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>
          Tu selección en el Mundial real
        </h3>
        {live && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: GREEN }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}`, display: "inline-block" }} />
            EN JUEGO
          </span>
        )}
      </div>

      {now === null ? (
        <div style={{ color: DIM, fontSize: 14 }}>Calculando el calendario real…</div>
      ) : next ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(nation.flagCode)} alt="" style={{ width: 30, height: 21, objectFit: "cover", borderRadius: 3 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{nation.nombre}</span>
            <span style={{ fontSize: 13, color: DIM, fontWeight: 700 }}>{next.isHome ? "vs" : "@"}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(next.oppFlag)} alt="" style={{ width: 30, height: 21, objectFit: "cover", borderRadius: 3 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{next.oppName}</span>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: MID }}>
            {next.match.p} · {next.match.vn}, {next.match.vc}
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#fff", fontWeight: 700, textTransform: "capitalize" }}>{when}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: live ? GREEN : GOLD2 }}>{countdownText(msToKick)}</span>
          </div>
        </>
      ) : (
        <div style={{ color: MID, fontSize: 14, lineHeight: 1.6 }}>
          {playedCount > 0
            ? `El Mundial de ${nation.nombre} ya se disputó. Revívelo dirigiéndola en tu carrera.`
            : `Aún no hay partidos reales programados para ${nation.nombre}.`}
        </div>
      )}

      {/* Pase DT: estado activo (ya desbloqueado) o embudo de monetización. */}
      {paseDT ? (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.32)",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}`, display: "inline-block" }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: GREEN }}>Temporada en Vivo activa</span>
          </div>
          <div style={{ fontSize: 12, color: MID, marginTop: 4 }}>
            Tu carrera con {nation.nombre} avanza al ritmo del Mundial real. Pase DT incluido.
          </div>
        </div>
      ) : (
        <Link
          href="/premium"
          style={{
            marginTop: 16,
            display: "block",
            padding: "12px 16px",
            borderRadius: 12,
            background: `linear-gradient(135deg, rgba(201,168,76,0.16), rgba(232,212,139,0.06))`,
            border: "1px solid rgba(201,168,76,0.35)",
            textDecoration: "none",
          }}
        >
          <div style={{ fontSize: 13.5, fontWeight: 800, color: GOLD2 }}>
            Dirige a {nation.nombre} con los resultados reales
          </div>
          <div style={{ fontSize: 12, color: MID, marginTop: 2 }}>
            Temporada en Vivo: tu carrera avanza al ritmo del Mundial real. Disponible con el Pase DT.
          </div>
          <span
            style={{
              marginTop: 8,
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              color: BG,
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            Conocer el Pase DT
          </span>
        </Link>
      )}
    </div>
  );
}
