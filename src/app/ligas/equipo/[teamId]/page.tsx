// src/app/ligas/equipo/[teamId]/page.tsx
//
// Pantalla de Equipo de Zona de Ligas: la forma reciente, los próximos partidos y
// los últimos resultados de un club, a través de TODAS sus competiciones (liga +
// copas). Ruta agnóstica de competición: /ligas/equipo/[teamId] (id de
// api-football). Consume getTeamFixtures. ISR (revalidate 300) para acotar coste.

import type { Metadata } from "next";
import { cache } from "react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeamFixtures, type TeamFixture } from "@/lib/competitions/api";
import LocalTime from "../../[slug]/LocalTime";

export const revalidate = 300;

type Params = { teamId: string };

const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

const load = cache((id: number) =>
  Promise.all([getTeamFixtures(id, { last: 6 }), getTeamFixtures(id, { next: 6 })]),
);

function teamOf(fixtures: TeamFixture[], teamId: number): { name: string; logo: string } | null {
  for (const f of fixtures) {
    if (f.home.id === teamId) return { name: f.home.name, logo: f.home.logo };
    if (f.away.id === teamId) return { name: f.away.name, logo: f.away.logo };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = Number(params.teamId);
  if (!Number.isFinite(id)) return { title: "Equipo no encontrado — ZonaMundial" };
  const [last, next] = await load(id);
  const team = teamOf([...last, ...next], id);
  if (!team) return { title: "Equipo — ZonaMundial" };
  const title = `${team.name}: calendario, resultados y forma | ZonaMundial`;
  const description = `Sigue a ${team.name} en ZonaMundial: próximos partidos, últimos resultados y forma en todas sus competiciones. Predice cada partido y compite con tus amigos.`;
  return {
    title,
    description,
    alternates: { canonical: `https://zonamundial.app/ligas/equipo/${id}` },
    openGraph: { title, description, images: ["https://zonamundial.app/og-image.jpg"] },
  };
}

function Row({ f, teamId }: { f: TeamFixture; teamId: number }) {
  const isHome = f.home.id === teamId;
  const opp = isHome ? f.away : f.home;
  const finished = FINISHED.has(f.status);
  const live = LIVE.has(f.status);
  const ts = isHome ? f.score.home : f.score.away;
  const os = isHome ? f.score.away : f.score.home;
  let mid: ReactNode;
  if (finished || live) {
    const win = (ts ?? 0) > (os ?? 0);
    const draw = (ts ?? 0) === (os ?? 0);
    const col = live ? "#d85a30" : win ? "#3fbf6a" : draw ? DIM : "#cf5b5b";
    mid = <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, color: col }}>{ts ?? 0}-{os ?? 0}</span>;
  } else {
    mid = <span style={{ fontSize: 13, color: DIM }}><LocalTime iso={f.kickoff} mode="time" fallback={f.kickoff.slice(11, 16)} /></span>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 13.5 }}>
      <span style={{ width: 26, fontSize: 11, color: DIM, textAlign: "center", flexShrink: 0 }}>{isHome ? "L" : "V"}</span>
      {opp.logo ? <img src={opp.logo} alt="" width={20} height={20} loading="lazy" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} /> : null}
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#fff" }}>{opp.name}</span>
      <span style={{ fontSize: 10.5, color: DIM, maxWidth: 90, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textAlign: "right" }}>{f.leagueName}</span>
      <span style={{ width: 46, textAlign: "right", flexShrink: 0 }}>{mid}</span>
    </div>
  );
}

export default async function TeamPage({ params }: { params: Params }) {
  const id = Number(params.teamId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const [last, next] = await load(id);
  const team = teamOf([...last, ...next], id);
  if (!team) notFound();

  // Forma: últimos resultados terminados (más reciente primero).
  const form = last
    .filter((f) => FINISHED.has(f.status))
    .slice(-5)
    .reverse()
    .map((f) => {
      const isHome = f.home.id === id;
      const ts = isHome ? f.score.home : f.score.away;
      const os = isHome ? f.score.away : f.score.home;
      return (ts ?? 0) > (os ?? 0) ? "G" : (ts ?? 0) === (os ?? 0) ? "E" : "P";
    });
  const formColor: Record<string, string> = { G: "#3fbf6a", E: "#8a94a6", P: "#cf5b5b" };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060B14, #0a0f1a)", color: "#E2E8F0", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
          <span aria-hidden>&larr;</span> Zona de Ligas
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          {team.logo ? <img src={team.logo} alt="" width={48} height={48} loading="lazy" style={{ width: 48, height: 48, objectFit: "contain" }} /> : null}
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500, color: "#fff" }}>{team.name}</h1>
            {form.length > 0 && (
              <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                {form.map((r, i) => (
                  <span key={i} title={r === "G" ? "Ganó" : r === "E" ? "Empató" : "Perdió"} style={{ width: 20, height: 20, borderRadius: 6, background: formColor[r], color: "#0A1422", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{r}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {next.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>Próximos partidos</h2>
            {next.map((f) => <Row key={f.fixtureId} f={f} teamId={id} />)}
          </section>
        )}

        {last.length > 0 && (
          <section style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>Últimos resultados</h2>
            {last.slice().reverse().map((f) => <Row key={f.fixtureId} f={f} teamId={id} />)}
          </section>
        )}

        <p style={{ marginTop: 24, fontSize: 11.5, color: DIM, textAlign: "center" }}>L = local · V = visitante</p>
      </div>
    </main>
  );
}
