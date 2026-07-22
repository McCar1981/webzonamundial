"use client";

// MiFutbolSection — "Tu fútbol" en el lobby /app.
//
// El lobby se ADAPTA a la configuración del usuario (gate de ligas+club):
//   · Tarjeta "Tu club": próximo partido (o en vivo / último resultado) del
//     club favorito. Datos de /api/ligas/mi-club (cacheado 10 min por club).
//   · Tira "Tus ligas": partidos EN VIVO y próximos de las ligas elegidas.
//     Datos de /api/ligas/mi-feed (cacheado 120 s por liga, compartido).
//
// Se OCULTA por completo si el usuario no tiene sesión o aún no eligió (authed
// false o sin club y sin partidos): así es seguro tenerla antes del gate y para
// invitados. Enlaza siempre al Centro de Partido / hub de club de Zona de Ligas.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePostMundial } from "@/app/_home/hooks/usePostMundial";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const LINE = "rgba(255,255,255,0.08)";
const DIM = "#a69a82";

const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

type CTeam = { id: number; name: string; logo: string };
type Fixture = {
  fixtureId: number;
  kickoff: string;
  status: string;
  elapsed: number | null;
  home: CTeam;
  away: CTeam;
  score: { home: number | null; away: number | null };
};
type TeamFixture = Fixture & { leagueName: string };
type MiClub = { ligaSlug: string | null; clubId: number; clubName: string; clubLogo: string | null };
type ClubEntry = MiClub & { next: TeamFixture | null; last: TeamFixture | null };
type ClubResp = { authed: boolean; clubs: ClubEntry[] };
type LigaFeed = { slug: string; name: string; short: string; live: Fixture[]; upcoming: Fixture[] };
type FeedResp = { authed: boolean; ligas: LigaFeed[] };

function timeLabel(f: Pick<Fixture, "kickoff" | "status" | "elapsed">): { text: string; live: boolean } {
  if (LIVE.has(f.status)) return { text: f.elapsed != null ? `${f.elapsed}'` : "EN VIVO", live: true };
  if (FINISHED.has(f.status)) return { text: "Final", live: false };
  try {
    const d = new Date(f.kickoff);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return { text: `Hoy · ${time}`, live: false };
    return { text: `${d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · ${time}`, live: false };
  } catch {
    return { text: f.kickoff.slice(11, 16), live: false };
  }
}

function Logo({ src, size = 20 }: { src: string | null; size?: number }) {
  if (!src) return <span style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0, display: "inline-block" }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }} />;
}

/* Tarjeta grande del club favorito: próximo partido, en vivo o último resultado. */
function ClubCard({ club, next, last }: { club: MiClub; next: TeamFixture | null; last: TeamFixture | null }) {
  const show = next ?? last;
  const t = show ? timeLabel(show) : null;
  const showScore = show ? LIVE.has(show.status) || FINISHED.has(show.status) : false;

  return (
    <Link
      href={`/ligas/equipo/${club.clubId}`}
      style={{
        display: "block",
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 12,
        background: "linear-gradient(160deg,#1b160d 0%,#0a0906 62%)",
        border: `1px solid ${GOLD}33`,
        boxShadow: "0 16px 36px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: show ? 12 : 0 }}>
        <Logo src={club.clubLogo} size={30} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>Tu club</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{club.clubName}</div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: DIM, display: "inline-flex", alignItems: "center", gap: 4 }}>
          Ver club
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={DIM} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>

      {show && t && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: next ? DIM : "#a69a82", minWidth: 62 }}>
            {next ? (LIVE.has(show.status) ? "En vivo" : "Próximo") : "Último"}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{show.home.name}</span>
              <Logo src={show.home.logo} size={20} />
            </span>
            <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.live ? "#ff6b5a" : "#fff", fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "center" }}>
              {showScore ? `${show.score.home ?? 0} - ${show.score.away ?? 0}` : "VS"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
              <Logo src={show.away.logo} size={20} />
              <span style={{ fontSize: 13, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{show.away.name}</span>
            </span>
          </div>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: t.live ? "#ff6b5a" : DIM, minWidth: 54, textAlign: "right" }}>{t.text}</span>
        </div>
      )}
    </Link>
  );
}

/* Tira horizontal de partidos de una liga (en vivo primero, luego próximos). */
function LigaRow({ liga }: { liga: LigaFeed }) {
  const fixtures = [...liga.live, ...liga.upcoming].slice(0, 6);
  if (fixtures.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: DIM, marginBottom: 6 }}>{liga.short}</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {fixtures.map((f) => {
          const t = timeLabel(f);
          const showScore = LIVE.has(f.status) || FINISHED.has(f.status);
          return (
            <Link
              key={f.fixtureId}
              href={`/ligas/${liga.slug}/${f.fixtureId}`}
              style={{
                flex: "0 0 auto",
                width: 178,
                padding: 10,
                borderRadius: 12,
                textDecoration: "none",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${t.live ? "rgba(255,107,90,0.4)" : LINE}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: DIM }}>{liga.short}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.live ? "#ff6b5a" : DIM }}>{t.text}</span>
              </div>
              <Side team={f.home} goals={showScore ? f.score.home : null} />
              <div style={{ height: 5 }} />
              <Side team={f.away} goals={showScore ? f.score.away : null} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Side({ team, goals }: { team: CTeam; goals: number | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <Logo src={team.logo} size={18} />
        <span style={{ fontSize: 12.5, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{team.name}</span>
      </span>
      {goals != null && <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{goals}</span>}
    </div>
  );
}

export default function MiFutbolSection() {
  // Solo desde el pivote del lunes (o ?zm-ligas=1 para demo): durante el Mundial
  // el lobby sigue siendo del Mundial; "Tu fútbol" aparece a la vez que el gate.
  const post = usePostMundial();
  const [club, setClub] = useState<ClubResp | null>(null);
  const [feed, setFeed] = useState<FeedResp | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Antes del lunes no pedimos nada (ahorra 2 llamadas por carga del lobby).
    if (!post) return;
    let alive = true;
    Promise.all([
      fetch("/api/ligas/mi-club").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/ligas/mi-feed").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([c, f]) => {
      if (!alive) return;
      setClub(c);
      setFeed(f);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [post]);

  // Antes del pivote del lunes: el lobby es del Mundial, no mostramos "Tu fútbol".
  if (!post) return null;

  // Hasta tener respuesta no renderiza nada (evita salto de layout).
  if (!loaded) return null;

  const authed = club?.authed || feed?.authed;
  if (!authed) return null;

  const clubs = club?.clubs ?? [];
  const ligasWithMatches = (feed?.ligas ?? []).filter((l) => l.live.length + l.upcoming.length > 0);

  // Sin clubes y sin partidos en sus ligas: no hay nada personal que mostrar.
  if (clubs.length === 0 && ligasWithMatches.length === 0) return null;

  return (
    <section data-reveal style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 16, borderRadius: 3, background: `linear-gradient(180deg,${GOLD},${GOLD2})`, display: "inline-block" }} />
          Tu fútbol
        </h2>
        <Link href="/ligas" style={{ fontSize: 11.5, fontWeight: 700, color: GOLD, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Ver todo
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>

      {clubs.map((c) => (
        <ClubCard key={c.clubId} club={c} next={c.next} last={c.last} />
      ))}

      {ligasWithMatches.map((l) => (
        <LigaRow key={l.slug} liga={l} />
      ))}
    </section>
  );
}
