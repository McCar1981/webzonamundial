// src/app/ligas/[slug]/[fixture]/page.tsx
//
// Centro de Partido de Zona de Ligas: previa / en vivo / post-partido de un
// fixture (marcador, timeline de eventos, alineaciones, estadísticas), más el
// gancho a la capa jugable (predecir el partido — el diferencial "No leas el
// partido, júgalo"). Reutiliza getFixtureDetail (1 request embebido).
//
// ISR revalidate 30: en vivo se refresca cada 30 s y se cachea en el edge, así
// que N espectadores cuestan ~1 request/30s/partido (respeta el gate de coste).
// Sin generateStaticParams (los fixtures son dinámicos): render on-demand.

import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompetition } from "@/data/competitions";
import { getFixtureDetail, type FixtureDetail, type FixtureEvent } from "@/lib/competitions/api";
import MatchPoll from "./MatchPoll";
import MatchSummary from "./MatchSummary";
import LiveScore from "./LiveScore";
import FutcoinsBadge from "@/components/ligas/FutcoinsBadge";

export const revalidate = 30;

const loadDetail = cache((id: number) => getFixtureDetail(id));

const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const FINISHED = new Set(["FT", "AET", "PEN"]);

type Params = { slug: string; fixture: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const comp = getCompetition(params.slug);
  const id = Number(params.fixture);
  if (!comp || !Number.isFinite(id)) return { title: "Partido no encontrado — ZonaMundial" };
  const d = await loadDetail(id);
  if (!d) return { title: `${comp.name} — ZonaMundial` };
  const t = `${d.fixture.home.name} vs ${d.fixture.away.name} — ${comp.name} | ZonaMundial`;
  const desc = `Sigue ${d.fixture.home.name} - ${d.fixture.away.name} de ${comp.name} en ZonaMundial: marcador, alineaciones, estadísticas y predicciones.`;
  return {
    title: t,
    description: desc,
    alternates: { canonical: `https://zonamundial.app/ligas/${comp.slug}/${id}` },
    openGraph: { title: t, description: desc, images: ["https://zonamundial.app/og-image.jpg"] },
  };
}

function eventLabel(type: string, detail: string): string {
  const ty = type.toLowerCase();
  if (ty === "goal") return detail.toLowerCase().includes("penalty") ? "Gol (penalti)" : detail.toLowerCase().includes("own") ? "Gol en propia" : "Gol";
  if (ty === "card") return detail.toLowerCase().includes("red") ? "Roja" : "Amarilla";
  if (ty === "subst") return "Cambio";
  if (ty === "var") return "VAR";
  return detail || type;
}

// Línea de tiempo visual del partido: goles (dorado) y rojas (rojo) posicionados
// por minuto sobre el eje 0'-90'+, local arriba y visitante abajo. Solo eventos
// de impacto; el detalle completo va en la lista de abajo. Presentacional (sin
// datos nuevos): la señal de "app seria" que tienen FotMob/SofaScore.
function MatchTimeline({ events, homeId }: { events: FixtureEvent[]; homeId: number }) {
  const marks = events
    .filter((e) => {
      const t = e.type.toLowerCase();
      return t === "goal" || (t === "card" && e.detail.toLowerCase().includes("red"));
    })
    .map((e) => ({
      pct: Math.min(97, Math.max(3, ((e.minute ?? 0) / 95) * 100)),
      home: e.teamId === homeId,
      goal: e.type.toLowerCase() === "goal",
      minute: e.minute ?? 0,
      player: e.player,
    }));
  if (!marks.length) return null;
  return (
    <div style={{ position: "relative", height: 62, margin: "10px 0 4px" }}>
      {/* eje */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.1)", transform: "translateY(-50%)" }} />
      <span style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", fontSize: 9.5, color: DIM }}>0&apos;</span>
      <span style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", fontSize: 9.5, color: DIM }}>90&apos;</span>
      {marks.map((m, i) => (
        <div
          key={i}
          title={`${m.minute}'${m.player ? ` ${m.player}` : ""}`}
          style={{
            position: "absolute",
            left: `${m.pct}%`,
            top: m.home ? "50%" : "auto",
            bottom: m.home ? "auto" : "50%",
            transform: m.home ? "translate(-50%, -100%)" : "translate(-50%, 100%)",
            display: "flex",
            flexDirection: m.home ? "column" : "column-reverse",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 9, color: m.goal ? GOLD : "#cf5b5b", fontVariantNumeric: "tabular-nums" }}>{m.minute}&apos;</span>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: m.goal ? GOLD : "#cf5b5b", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

function Team({ name, logo, side }: { name: string; logo: string; side: "home" | "away" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 110, textAlign: "center" }}>
      {logo ? <img src={logo} alt="" width={44} height={44} loading="lazy" style={{ width: 44, height: 44, objectFit: "contain" }} /> : <div style={{ width: 44, height: 44 }} aria-hidden />}
      <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{name}</span>
    </div>
  );
}

// Nombres de estadística de api-football (inglés) -> español.
const STAT_LABEL: Record<string, string> = {
  "Ball Possession": "Posesión",
  "Total Shots": "Tiros totales",
  "Shots on Goal": "Tiros a puerta",
  "Shots off Goal": "Tiros fuera",
  "Blocked Shots": "Tiros bloqueados",
  "Shots insidebox": "Tiros dentro del área",
  "Shots outsidebox": "Tiros fuera del área",
  "Corner Kicks": "Córners",
  "Offsides": "Fueras de juego",
  "Fouls": "Faltas",
  "Yellow Cards": "Amarillas",
  "Red Cards": "Rojas",
  "Goalkeeper Saves": "Paradas",
  "Total passes": "Pases",
  "Passes accurate": "Pases acertados",
  "Passes %": "Precisión de pase",
  "expected_goals": "Goles esperados (xG)",
};

function statNum(v: string | number | null): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", ".").replace("%", ""));
  return Number.isFinite(n) ? n : null;
}

function StatBars({ d }: { d: FixtureDetail }) {
  const homeId = d.fixture.home.id;
  const byType = new Map<string, { home: string | number | null; away: string | number | null }>();
  for (const block of d.stats) {
    for (const it of block.items) {
      const e = byType.get(it.type) ?? { home: null, away: null };
      if (block.teamId === homeId) e.home = it.value;
      else e.away = it.value;
      byType.set(it.type, e);
    }
  }
  const rows = [...byType.entries()].filter(([, v]) => v.home != null || v.away != null);
  if (!rows.length) return null;
  return (
    <section style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 12px" }}>Estadísticas</h2>
      {rows.map(([type, v]) => {
        const hn = statNum(v.home);
        const an = statNum(v.away);
        const sum = (hn ?? 0) + (an ?? 0);
        const hasBar = hn != null && an != null && sum > 0;
        const hPct = hasBar ? Math.round(((hn as number) / sum) * 100) : 50;
        const homeLeads = (hn ?? 0) >= (an ?? 0);
        return (
          <div key={type} style={{ padding: "9px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, marginBottom: hasBar ? 6 : 0 }}>
              <span style={{ width: 54, textAlign: "left", color: "#fff", fontWeight: homeLeads ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{v.home ?? "—"}</span>
              <span style={{ flex: 1, textAlign: "center", color: DIM }}>{STAT_LABEL[type] ?? type}</span>
              <span style={{ width: 54, textAlign: "right", color: "#fff", fontWeight: !homeLeads ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{v.away ?? "—"}</span>
            </div>
            {hasBar && (
              <div style={{ display: "flex", height: 6, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${hPct}%`, background: homeLeads ? "linear-gradient(90deg, #c9a84c, #e8d48b)" : "rgba(201,168,76,0.45)" }} />
                <div style={{ width: `${100 - hPct}%`, background: !homeLeads ? "linear-gradient(90deg, #e8d48b, #c9a84c)" : "rgba(201,168,76,0.45)" }} />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default async function CentroPartido({ params }: { params: Params }) {
  const comp = getCompetition(params.slug);
  const id = Number(params.fixture);
  if (!comp || !Number.isFinite(id)) notFound();

  const d = await loadDetail(id);
  if (!d) notFound();

  const f = d.fixture;
  const finished = FINISHED.has(f.status);
  const homeId = f.home.id;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060B14, #0a0f1a)", color: "#E2E8F0", padding: "20px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href={`/ligas/${comp.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
            <span aria-hidden>&larr;</span> {comp.name}
          </Link>
          <FutcoinsBadge />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
          <Team name={f.home.name} logo={f.home.logo} side="home" />
          <LiveScore fixtureId={f.fixtureId} status={f.status} elapsed={f.elapsed} scoreHome={f.score.home} scoreAway={f.score.away} kickoff={f.kickoff} />
          <Team name={f.away.name} logo={f.away.logo} side="away" />
        </div>

        <MatchSummary fixtureId={f.fixtureId} />

        {!finished && <MatchPoll fixtureId={f.fixtureId} slug={comp.slug} homeName={f.home.name} awayName={f.away.name} notStarted={f.status === "NS" || f.status === "TBD"} />}

        <Link href="/registro" style={{ display: "block", marginTop: 22, padding: 16, borderRadius: 14, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.45)", textDecoration: "none", textAlign: "center" }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 500, color: "#fff" }}>No leas el partido. Júgalo.</span>
          <span style={{ display: "block", fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>Predice este partido y compite por Fútcoins con tus amigos. Sin apuestas.</span>
        </Link>

        {d.events.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>Lo que pasó</h2>
            <MatchTimeline events={d.events} homeId={homeId} />
            {d.events.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 13, flexDirection: e.teamId === homeId ? "row" : "row-reverse", textAlign: e.teamId === homeId ? "left" : "right" }}>
                <span style={{ color: DIM, width: 34, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{e.minute != null ? `${e.minute}'` : ""}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ color: GOLD, fontWeight: 500 }}>{eventLabel(e.type, e.detail)}</span>
                  {e.player ? <span style={{ color: "#fff" }}> · {e.player}</span> : null}
                  {e.assist ? <span style={{ color: DIM }}> ({e.assist})</span> : null}
                </span>
              </div>
            ))}
          </section>
        )}

        {d.lineups.length > 0 && (
          <section style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 10px" }}>Alineaciones</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {d.lineups.map((l) => (
                <div key={l.teamId}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{l.teamName}</div>
                  {l.formation ? <div style={{ fontSize: 11.5, color: GOLD, marginBottom: 6 }}>{l.formation}</div> : null}
                  <ol style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.9 }}>
                    {l.startXI.map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        <StatBars d={d} />
      </div>
    </main>
  );
}
