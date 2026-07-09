"use client";

// Franja "En vivo y de hoy" del hub: tarjetas horizontales de los partidos del
// catálogo en vivo (o de hoy), cada una enlaza a su Centro de Partido. Se oculta
// si no hay nada. Datos: /api/ligas/live (cacheado). Sin emojis.

import { useEffect, useState } from "react";
import Link from "next/link";

type Fixture = {
  fixtureId: number;
  competitionSlug: string;
  competitionShort: string;
  kickoff: string;
  status: string;
  elapsed: number | null;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  score: { home: number | null; away: number | null };
};
type Payload = { mode: "live" | "today" | "none"; fixtures: Fixture[] };

const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

function timeLabel(f: Fixture): { text: string; live: boolean } {
  if (LIVE.has(f.status)) return { text: f.elapsed != null ? `${f.elapsed}'` : "EN VIVO", live: true };
  if (FINISHED.has(f.status)) return { text: "Final", live: false };
  try {
    return { text: new Date(f.kickoff).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }), live: false };
  } catch {
    return { text: f.kickoff.slice(11, 16), live: false };
  }
}

function Side({ name, logo }: { name: string; logo: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      {logo ? <img src={logo} alt="" width={18} height={18} loading="lazy" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} /> : null}
      <span style={{ fontSize: 13, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</span>
    </span>
  );
}

export default function LiveStrip() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/ligas/live")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j) setData(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!data || data.mode === "none" || data.fixtures.length === 0) return null;

  return (
    <section style={{ marginTop: 22 }}>
      <h2 className="zl-label" style={{ display: "flex", alignItems: "center", gap: 8, color: data.mode === "live" ? "var(--zl-live)" : GOLD, margin: "0 0 10px" }}>
        {data.mode === "live" && <span className="zl-live-dot" aria-hidden />}
        {data.mode === "live" ? "EN VIVO" : "HOY"}
      </h2>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {data.fixtures.map((f) => {
          const t = timeLabel(f);
          const showScore = t.live || FINISHED.has(f.status);
          return (
            <Link
              key={f.fixtureId}
              href={`/ligas/${f.competitionSlug}/${f.fixtureId}`}
              className={t.live ? "zl-card zl-card--live zl-tap" : "zl-card zl-tap"}
              style={{ flex: "0 0 auto", width: 190, padding: 12, textDecoration: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, color: DIM, fontWeight: 500 }}>{f.competitionShort}</span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: t.live ? "#d85a30" : DIM }}>{t.text}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Side name={f.home.name} logo={f.home.logo} />
                  {showScore && <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{f.score.home ?? 0}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Side name={f.away.name} logo={f.away.logo} />
                  {showScore && <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{f.score.away ?? 0}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
