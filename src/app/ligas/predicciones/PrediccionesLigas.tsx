"use client";

// "Predice en tus ligas": el hub de predicción de Zona de Ligas. Reúne los
// partidos PREDECIBLES (próximos + en vivo) de las ligas que el usuario eligió y
// lo lleva al Centro de Partido de cada uno (donde están 1X2, marcador y los
// mercados avanzados). Si una liga elegida está en PARÓN (sin calendario aún),
// muestra "en espera de calendario" en vez de nada. Datos: /api/ligas/mi-feed.

import { useEffect, useState } from "react";
import Link from "next/link";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LINE = "rgba(255,255,255,0.08)";
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

type Team = { id: number; name: string; logo: string };
type Fixture = {
  fixtureId: number;
  kickoff: string;
  status: string;
  elapsed: number | null;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
};
type LigaFeed = { slug: string; name: string; short: string; live: Fixture[]; upcoming: Fixture[] };

function fmtKickoff(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return `Hoy · ${time}`;
    return `${d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function Logo({ src, size = 22 }: { src: string | null; size?: number }) {
  if (!src) return <span style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0, display: "inline-block" }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }} />;
}

function FixtureCard({ f, slug }: { f: Fixture; slug: string }) {
  const live = LIVE.has(f.status);
  return (
    <Link href={`/ligas/${slug}/${f.fixtureId}`} className="zl-card zl-tap" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginTop: 8, textDecoration: "none", border: `1px solid ${live ? "rgba(255,107,90,0.4)" : "rgba(201,168,76,0.22)"}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Logo src={f.home.logo} size={20} />
          <span style={{ fontSize: 13.5, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{f.home.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, marginTop: 5 }}>
          <Logo src={f.away.logo} size={20} />
          <span style={{ fontSize: 13.5, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{f.away.name}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: live ? "#ff6b5a" : DIM }}>
          {live ? (f.elapsed != null ? `${f.elapsed}'` : "EN VIVO") : fmtKickoff(f.kickoff)}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: GOLD, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {live ? "Ver" : "Predecir"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
    </Link>
  );
}

export default function PrediccionesLigas() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [ligas, setLigas] = useState<LigaFeed[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/ligas/mi-feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (!j) { setAuthed(false); setLigas([]); return; }
        setAuthed(!!j.authed);
        setLigas(Array.isArray(j.ligas) ? j.ligas : []);
      })
      .catch(() => { if (alive) { setAuthed(false); setLigas([]); } });
    return () => { alive = false; };
  }, []);

  if (authed === null || ligas === null) {
    return <div aria-hidden style={{ height: 160, marginTop: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />;
  }

  if (!authed) {
    return (
      <div className="zl-card--raised" style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--zl-body)" }}>Crea tu cuenta para predecir los partidos de tus ligas y ganar Fútcoins. Sin apuestas.</p>
        <Link href="/registro?next=/ligas/predicciones" className="zl-cta">Crear cuenta gratis</Link>
      </div>
    );
  }

  if (ligas.length === 0) {
    return (
      <div className="zl-card--raised" style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--zl-body)" }}>Aún no has elegido tus ligas. Elígelas y aquí verás sus partidos para predecir.</p>
        <Link href="/ligas" className="zl-cta">Elegir mis ligas</Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {ligas.map((l) => {
        const fixtures = [...l.live, ...l.upcoming];
        return (
          <section key={l.slug} style={{ marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <h2 className="zl-h3" style={{ margin: 0 }}>{l.name}</h2>
              <Link href={`/ligas/${l.slug}`} style={{ fontSize: 12, color: GOLD, textDecoration: "none", flexShrink: 0 }}>Ver liga <span className="zl-chev">&rsaquo;</span></Link>
            </div>
            {fixtures.length === 0 ? (
              <div style={{ marginTop: 8, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${LINE}` }}>
                <p style={{ margin: 0, fontSize: 13, color: DIM }}>
                  En espera de calendario. Cuando se publique la próxima jornada de {l.short}, podrás predecir sus partidos aquí.
                </p>
              </div>
            ) : (
              fixtures.map((f) => <FixtureCard key={f.fixtureId} f={f} slug={l.slug} />)
            )}
          </section>
        );
      })}
    </div>
  );
}
