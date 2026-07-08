// src/app/ligas/page.tsx
//
// Hub público de Zona de Ligas: índice de todas las competiciones del catálogo,
// agrupadas por región (América primero — audiencia 80% MX/LATAM). Cada tarjeta
// enlaza a su pantalla /ligas/[slug]. Estática (sin llamadas a la API): el
// catálogo es fijo. Indexable y en el sitemap.

import type { Metadata } from "next";
import Link from "next/link";
import LiveStrip from "./LiveStrip";
import { COMPETITIONS, type Competition, type CompetitionRegion } from "@/data/competitions";

export const metadata: Metadata = {
  // Sin "| ZonaMundial": lo añade la plantilla del layout raíz (evita el sufijo duplicado).
  title: "Zona de Ligas: todas las ligas y copas en vivo",
  description: "Calendario, resultados y clasificación en vivo de LaLiga, Premier, Liga MX, Libertadores, Champions y más. Predice cada jornada y compite con tus amigos, sin apuestas.",
  alternates: { canonical: "https://zonamundial.app/ligas" },
};

const GOLD = "#c9a84c";
const DIM = "#9db0c9";

const REGION_LABEL: Record<CompetitionRegion, string> = {
  americas: "América",
  europa: "Europa",
  global: "Internacional",
};
const REGION_ORDER: CompetitionRegion[] = ["americas", "europa", "global"];

function CompCard({ c }: { c: Competition }) {
  return (
    <Link
      href={`/ligas/${c.slug}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(201,168,76,0.24)",
        textDecoration: "none",
      }}
    >
      {c.flag ? (
        <img src={`https://flagcdn.com/32x24/${c.flag}.png`} alt="" width={28} height={21} loading="lazy" style={{ width: 28, height: 21, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
      ) : (
        <span style={{ width: 28, height: 21, borderRadius: 3, background: "rgba(201,168,76,0.18)", flexShrink: 0 }} aria-hidden />
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 500, color: "#fff" }}>{c.name}</span>
        <span style={{ display: "block", fontSize: 12, color: DIM }}>{c.country}</span>
      </span>
      <span aria-hidden style={{ color: GOLD, fontSize: 18 }}>&rsaquo;</span>
    </Link>
  );
}

export default function LigasHub() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060B14, #0a0f1a)", color: "#E2E8F0", padding: "28px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: 2, color: GOLD }}>ZONA DE LIGAS</p>
        <h1 style={{ margin: "4px 0 2px", fontSize: 28, fontWeight: 500, color: "#fff" }}>Todas las ligas y copas</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: DIM }}>Calendario, resultados y clasificación en vivo. No leas el partido: júgalo.</p>

        <LiveStrip />

        {REGION_ORDER.map((region) => {
          const comps = COMPETITIONS.filter((c) => c.region === region);
          if (!comps.length) return null;
          return (
            <section key={region} style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", margin: "0 0 10px" }}>{REGION_LABEL[region]}</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {comps.map((c) => <CompCard key={c.slug} c={c} />)}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
