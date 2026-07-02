// src/app/ligas/mis-predicciones/page.tsx
//
// "Mis predicciones de ligas": el historial del usuario logueado (pendientes +
// resueltas), con su acierto y los Fútcoins ganados. Cierra el bucle de la
// predicción con Fútcoins. Por usuario -> no ISR (force-dynamic); los nombres de
// los partidos se leen con getFixtureDetailCached (KV) para no gastar api-football
// por vista.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserLigaPredictions, type LigaPredictionRow } from "@/lib/ligas/predictions";
import { getFixtureDetailCached, type FixtureDetail } from "@/lib/competitions/api";
import LocalTime from "../[slug]/LocalTime";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis predicciones — Zona de Ligas | ZonaMundial",
  description: "Tu historial de predicciones de ligas: aciertos, resultados y Fútcoins ganados.",
  robots: { index: false, follow: false },
};

const REWARD = 10;
const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

function pickLabel(pick: string, d: FixtureDetail | null): string {
  if (pick === "draw") return "Empate";
  if (!d) return pick === "home" ? "Local" : "Visitante";
  return pick === "home" ? d.fixture.home.name : d.fixture.away.name;
}

function Stat({ n, label, accent }: { n: string; label: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "14px 6px", borderRadius: 12, background: accent ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.24)" }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11.5, color: DIM, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Row({ p, d }: { p: LigaPredictionRow; d: FixtureDetail | null }) {
  const match = d ? `${d.fixture.home.name} — ${d.fixture.away.name}` : `Partido ${p.fixtureId}`;
  const result = d && (FINISHED.has(d.fixture.status) || LIVE.has(d.fixture.status))
    ? `${d.fixture.score.home ?? 0}-${d.fixture.score.away ?? 0}`
    : null;
  let tag: { text: string; color: string };
  if (p.status === "won") tag = { text: `Acertaste · +${REWARD}`, color: "#3fbf6a" };
  else if (p.status === "lost") tag = { text: "Fallaste", color: "#cf5b5b" };
  else if (p.status === "void") tag = { text: "Anulado", color: DIM };
  else tag = { text: "Pendiente", color: GOLD };

  return (
    <div style={{ padding: "11px 4px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <span style={{ fontSize: 13.5, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{match}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: tag.color, flexShrink: 0 }}>{tag.text}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 3, fontSize: 12, color: DIM }}>
        <span>Tu apuesta: <span style={{ color: "#cbd5e1" }}>{pickLabel(p.pick, d)}</span></span>
        <span>{result ? `Resultado ${result}` : <LocalTime iso={p.kickoff} mode="date" fallback={p.kickoff.slice(0, 10)} />}</span>
      </div>
    </div>
  );
}

export default async function MisPrediccionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/registro?next=/ligas/mis-predicciones");

  const preds = await getUserLigaPredictions(user.id, 24);
  const details = await Promise.all(preds.map((p) => getFixtureDetailCached(p.fixtureId)));
  const rows = preds.map((p, i) => ({ p, d: details[i] }));

  const won = preds.filter((p) => p.status === "won").length;
  const resolved = preds.filter((p) => p.status === "won" || p.status === "lost").length;
  const accuracy = resolved > 0 ? Math.round((won / resolved) * 100) : 0;
  const pending = rows.filter((r) => r.p.status === "pending");
  const done = rows.filter((r) => r.p.status !== "pending");

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060B14, #0a0f1a)", color: "#E2E8F0", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
          <span aria-hidden>&larr;</span> Zona de Ligas
        </Link>
        <h1 style={{ margin: "14px 0 16px", fontSize: 26, fontWeight: 500, color: "#fff" }}>Mis predicciones</h1>

        {preds.length === 0 ? (
          <div style={{ padding: 24, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.24)", textAlign: "center" }}>
            <p style={{ margin: "0 0 14px", fontSize: 14.5, color: "#cbd5e1" }}>Aún no has predicho ningún partido. Elige un partido y gana Fútcoins si aciertas.</p>
            <Link href="/ligas" style={{ display: "inline-block", background: "linear-gradient(135deg, #c9a84c, #e8d48b)", color: "#0A1422", fontWeight: 500, fontSize: 15, padding: "12px 26px", borderRadius: 12, textDecoration: "none" }}>Ver partidos</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <Stat n={String(won)} label="Aciertos" accent />
              <Stat n={`${accuracy}%`} label="Precisión" />
              <Stat n={String(won * REWARD)} label="Fútcoins" />
            </div>

            {pending.length > 0 && (
              <section style={{ marginTop: 26 }}>
                <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 4px" }}>Pendientes</h2>
                {pending.map((r) => <Row key={r.p.fixtureId} p={r.p} d={r.d} />)}
              </section>
            )}

            {done.length > 0 && (
              <section style={{ marginTop: 26 }}>
                <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 4px" }}>Resueltas</h2>
                {done.map((r) => <Row key={r.p.fixtureId} p={r.p} d={r.d} />)}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
