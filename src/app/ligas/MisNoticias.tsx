"use client";

// "Noticias de tu fútbol": feed personalizado del hub de ligas. Prioridad del
// usuario: 1º su(s) club(es), 2º sus ligas. Marca las de fichajes/mercado. Se
// oculta si no hay nada personal. Datos: /api/ligas/mis-noticias.

import { useEffect, useState } from "react";
import Link from "next/link";

const GOLD = "#c9a84c";
const DIM = "#a69a82";

type Lite = { slug: string; title: string; excerpt: string; date: string; image: string | null; isTransfer: boolean };

function fmtDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`);
    const today = new Date();
    const days = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    if (days <= 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function NewsCard({ n }: { n: Lite }) {
  return (
    <Link
      href={`/noticias/${n.slug}`}
      className="zl-card zl-tap"
      style={{ display: "flex", gap: 12, alignItems: "stretch", padding: 10, marginTop: 8, textDecoration: "none" }}
    >
      {n.image ? (
        <img src={n.image} alt="" width={78} height={78} loading="lazy" style={{ width: 78, height: 78, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#241e12" }} />
      ) : null}
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
        {n.isTransfer ? (
          <span style={{ alignSelf: "flex-start", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "#0a0906", background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, borderRadius: 5, padding: "2px 6px" }}>Fichajes</span>
        ) : null}
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--zl-text)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.title}</span>
        <span style={{ fontSize: 11, color: DIM }}>{fmtDate(n.date)}</span>
      </span>
    </Link>
  );
}

function Sub({ label }: { label: string }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: DIM, margin: "16px 0 2px" }}>{label}</div>;
}

export default function MisNoticias() {
  const [data, setData] = useState<{ club: Lite[]; league: Lite[] } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/ligas/mis-noticias")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        setData(j && j.authed ? { club: j.club || [], league: j.league || [] } : { club: [], league: [] });
      })
      .catch(() => { if (alive) setData({ club: [], league: [] }); });
    return () => { alive = false; };
  }, []);

  if (!data || (data.club.length === 0 && data.league.length === 0)) return null;

  return (
    <section style={{ marginTop: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <h2 className="zl-h2" style={{ marginBottom: 0 }}>Noticias de tu fútbol</h2>
        <Link href="/noticias" style={{ fontSize: 12, color: GOLD, textDecoration: "none", flexShrink: 0 }}>Ver todas <span className="zl-chev">&rsaquo;</span></Link>
      </div>

      {data.club.length > 0 && (
        <>
          <Sub label="Tu club" />
          {data.club.map((n) => <NewsCard key={n.slug} n={n} />)}
        </>
      )}
      {data.league.length > 0 && (
        <>
          <Sub label="De tus ligas" />
          {data.league.map((n) => <NewsCard key={n.slug} n={n} />)}
        </>
      )}
    </section>
  );
}
