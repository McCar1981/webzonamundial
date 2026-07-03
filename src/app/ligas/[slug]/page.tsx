// src/app/ligas/[slug]/page.tsx
//
// Primera pantalla PÚBLICA de Zona de Ligas: el calendario/jornada real de una
// competición del catálogo (próximos partidos + resultados recientes). Consume
// el servicio de datos (getCompetitionFixtures) e ISR (revalidate 60): la página
// se cachea en el edge, así que N visitantes cuestan ~1 llamada/min/liga a
// api-football sin importar el tráfico (respeta el gate de coste — el cuello es
// Vercel/KV, no la API). Indexable: es el activo SEO programático del pivote
// ("liga mx calendario", "brasileirão resultados"…). No confundir con /app/ligas
// (ligas privadas de amigos).

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COMPETITIONS, getCompetition } from "@/data/competitions";
import {
  getCompetitionFixtures,
  getCompetitionStandings,
  type CompetitionFixture,
  type StandingsGroup,
} from "@/lib/competitions/api";
import LocalTime from "./LocalTime";

export const revalidate = 60;

export function generateStaticParams() {
  return COMPETITIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const comp = getCompetition(params.slug);
  if (!comp) return { title: "Competición no encontrada — ZonaMundial" };
  const title = `${comp.name}: calendario, resultados y en vivo | ZonaMundial`;
  const description = `Sigue ${comp.name} en ZonaMundial: próximos partidos, resultados y la jornada en vivo. Predice cada partido, juega y compite con tus amigos, sin apuestas.`;
  const url = `https://zonamundial.app/ligas/${comp.slug}`;
  const ogUrl = `https://zonamundial.app/api/og/ligas-competicion?comp=${encodeURIComponent(comp.name)}&country=${encodeURIComponent(comp.country)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ZonaMundial", type: "website", images: [{ url: ogUrl, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function dateFallback(iso: string): string {
  const d = iso.slice(0, 10).split("-"); // YYYY-MM-DD
  return d.length === 3 ? `${Number(d[2])} ${MONTHS[Number(d[1]) - 1] ?? ""}` : iso.slice(0, 10);
}
function timeFallback(iso: string): string {
  return iso.slice(11, 16) || "—"; // HH:MM en la zona del fixture; el cliente lo pasa a local
}

const GOLD = "#c9a84c";
const DIM = "#9db0c9";

function TeamName({ name, logo, align }: { name: string; logo: string; align: "left" | "right" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
      {align === "right" && <span style={{ fontSize: 14, color: "#fff", textAlign: "right" }}>{name}</span>}
      {logo ? <img src={logo} alt="" width={22} height={22} loading="lazy" style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} /> : null}
      {align === "left" && <span style={{ fontSize: 14, color: "#fff" }}>{name}</span>}
    </div>
  );
}

function FixtureRow({ f, slug }: { f: CompetitionFixture; slug: string }) {
  const finished = FINISHED.has(f.status);
  const live = LIVE.has(f.status);
  let center: ReactNode;
  if (finished) {
    center = <span style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "#fff" }}>{f.score.home ?? 0} - {f.score.away ?? 0}</span>;
  } else if (live) {
    center = (
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "#fff" }}>{f.score.home ?? 0} - {f.score.away ?? 0}</span>
        <span style={{ fontSize: 10.5, fontWeight: 500, color: "#d85a30" }}>{f.elapsed != null ? `${f.elapsed}'` : "EN VIVO"}</span>
      </span>
    );
  } else {
    center = <span style={{ fontSize: 13.5, color: DIM, fontVariantNumeric: "tabular-nums" }}><LocalTime iso={f.kickoff} mode="time" fallback={timeFallback(f.kickoff)} /></span>;
  }
  return (
    <Link href={`/ligas/${slug}/${f.fixtureId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "inherit" }}>
      <TeamName name={f.home.name} logo={f.home.logo} align="right" />
      <div style={{ minWidth: 64, textAlign: "center" }}>{center}</div>
      <TeamName name={f.away.name} logo={f.away.logo} align="left" />
    </Link>
  );
}

function groupByDay(fixtures: CompetitionFixture[]): { day: string; sample: string; items: CompetitionFixture[] }[] {
  const map = new Map<string, CompetitionFixture[]>();
  for (const f of fixtures) {
    const k = f.kickoff.slice(0, 10);
    (map.get(k) ?? map.set(k, []).get(k)!).push(f);
  }
  return [...map.entries()].map(([day, items]) => ({ day, sample: items[0].kickoff, items }));
}

function StandingsTable({ groups }: { groups: StandingsGroup[] }) {
  return (
    <section style={{ marginTop: 34 }}>
      <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>Clasificación</h2>
      {groups.map((g) => (
        <div key={g.group} style={{ marginTop: 14 }}>
          {groups.length > 1 && (
            <div style={{ fontSize: 12, fontWeight: 500, color: GOLD, marginBottom: 4 }}>{g.group}</div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
            <thead>
              <tr style={{ color: DIM, fontSize: 11 }}>
                <th style={{ textAlign: "left", padding: "6px 4px", fontWeight: 500, width: 24 }}>#</th>
                <th style={{ textAlign: "left", padding: "6px 4px", fontWeight: 500 }}>Equipo</th>
                <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: 500, width: 30 }}>PJ</th>
                <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: 500, width: 38 }}>DG</th>
                <th style={{ textAlign: "center", padding: "6px 2px", fontWeight: 500, width: 34 }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.team.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "8px 4px", color: DIM, fontVariantNumeric: "tabular-nums" }}>{r.rank}</td>
                  <td style={{ padding: "8px 4px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    <Link href={`/ligas/equipo/${r.team.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, maxWidth: "100%", textDecoration: "none" }}>
                      {r.team.logo ? <img src={r.team.logo} alt="" width={18} height={18} loading="lazy" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} /> : null}
                      <span style={{ color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{r.team.name}</span>
                    </Link>
                  </td>
                  <td style={{ padding: "8px 2px", textAlign: "center", color: DIM, fontVariantNumeric: "tabular-nums" }}>{r.played}</td>
                  <td style={{ padding: "8px 2px", textAlign: "center", color: DIM, fontVariantNumeric: "tabular-nums" }}>{r.goalsDiff > 0 ? `+${r.goalsDiff}` : r.goalsDiff}</td>
                  <td style={{ padding: "8px 2px", textAlign: "center", color: "#fff", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

export default async function LigaPage({ params }: { params: { slug: string } }) {
  const comp = getCompetition(params.slug);
  if (!comp) notFound();

  const [upcoming, recent, standings] = await Promise.all([
    getCompetitionFixtures(comp.apiFootballId, { next: 15 }),
    getCompetitionFixtures(comp.apiFootballId, { last: 8 }),
    getCompetitionStandings(comp.apiFootballId),
  ]);
  const days = groupByDay(upcoming);
  const hasData = upcoming.length > 0 || recent.length > 0 || standings.length > 0;
  // Partido destacado: preferimos el PRÓXIMO (jugable: ahí se predice y se ganan
  // Fútcoins, que es el diferenciador); si no hay próximos, el jugado más reciente
  // (rico en datos). Así la portada de la liga lleva a lo que nos hace distintos.
  const featured = upcoming[0]
    ?? (recent.length ? [...recent].sort((a, b) => b.kickoff.localeCompare(a.kickoff))[0] : null);
  const featPlayed = featured ? FINISHED.has(featured.status) || LIVE.has(featured.status) : false;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060B14, #0a0f1a)", color: "#E2E8F0", padding: "28px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: 2, color: GOLD }}>ZONA DE LIGAS</p>
        <h1 style={{ margin: "4px 0 2px", fontSize: 28, fontWeight: 500, color: "#fff" }}>{comp.name}</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: DIM }}>{comp.country} · Calendario y resultados en vivo</p>

        {featured && (
          <Link href={`/ligas/${comp.slug}/${featured.fixtureId}`} style={{ display: "block", marginTop: 18, padding: 16, borderRadius: 16, textDecoration: "none", background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.34)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: GOLD, marginBottom: 10 }}>PARTIDO DESTACADO</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end", minWidth: 0 }}>
                <span style={{ fontSize: 15, color: "#fff", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{featured.home.name}</span>
                {featured.home.logo ? <img src={featured.home.logo} alt="" width={26} height={26} loading="lazy" style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} /> : null}
              </span>
              <span style={{ fontSize: 20, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "center" }}>
                {featPlayed ? `${featured.score.home ?? 0}-${featured.score.away ?? 0}` : "vs"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                {featured.away.logo ? <img src={featured.away.logo} alt="" width={26} height={26} loading="lazy" style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} /> : null}
                <span style={{ fontSize: 15, color: "#fff", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{featured.away.name}</span>
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {(featPlayed ? ["Resumen con IA", "Estadísticas", "Alineaciones", "Línea de tiempo"] : ["Resumen con IA", "Predice y gana Fútcoins"]).map((chip) => (
                <span key={chip} style={{ fontSize: 11, color: "#cbd5e1", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.24)", borderRadius: 99, padding: "4px 10px" }}>{chip}</span>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: GOLD }}>Ver partido &rsaquo;</div>
          </Link>
        )}

        <Link href={`/ligas/${comp.slug}/fantasy`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "13px 16px", borderRadius: 12, textDecoration: "none", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.3)" }}>
          <span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#fff" }}>Fantasy: monta tu once de la jornada</span>
            <span style={{ display: "block", fontSize: 12, color: DIM }}>Elige 5 jugadores, marca tu capitán y gana Fútcoins por su rendimiento real.</span>
          </span>
          <span aria-hidden style={{ color: GOLD, fontSize: 18 }}>&rsaquo;</span>
        </Link>

        {!hasData ? (
          <div style={{ marginTop: 28, padding: 24, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.24)", textAlign: "center", color: DIM, fontSize: 14 }}>
            Aún no hay partidos disponibles para esta competición. Vuelve cuando arranque la jornada.
          </div>
        ) : (
          <>
            {days.length > 0 && (
              <section style={{ marginTop: 26 }}>
                <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>Próximos partidos</h2>
                {days.map((g) => (
                  <div key={g.day} style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: GOLD, textTransform: "capitalize" }}>
                      <LocalTime iso={g.sample} mode="date" fallback={dateFallback(g.sample)} />
                    </div>
                    {g.items.map((f) => <FixtureRow key={f.fixtureId} f={f} slug={comp.slug} />)}
                  </div>
                ))}
              </section>
            )}

            {standings.length > 0 && <StandingsTable groups={standings} />}

            {recent.length > 0 && (
              <section style={{ marginTop: 34 }}>
                <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>Resultados recientes</h2>
                <div style={{ marginTop: 8 }}>
                  {recent.slice().reverse().map((f) => <FixtureRow key={f.fixtureId} f={f} slug={comp.slug} />)}
                </div>
              </section>
            )}
          </>
        )}

        <div style={{ marginTop: 34, padding: 18, borderRadius: 14, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.28)", textAlign: "center" }}>
          <p style={{ margin: "0 0 12px", fontSize: 14.5, color: "#cbd5e1" }}>No leas el partido. Juégalo. Predice cada jornada de {comp.short} y compite con tus amigos.</p>
          <Link href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg, #c9a84c, #e8d48b)", color: "#0A1422", fontWeight: 500, fontSize: 15, padding: "12px 26px", borderRadius: 12, textDecoration: "none" }}>
            Entrar a ZonaMundial
          </Link>
        </div>
      </div>
    </main>
  );
}
