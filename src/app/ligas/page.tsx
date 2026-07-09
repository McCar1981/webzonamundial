// src/app/ligas/page.tsx
//
// Hub público de Zona de Ligas: índice de todas las competiciones del catálogo,
// agrupadas por región (América primero — audiencia 80% MX/LATAM). Cada tarjeta
// enlaza a su pantalla /ligas/[slug]. Estática (sin llamadas a la API): el
// catálogo es fijo. Indexable y en el sitemap.

import type { Metadata } from "next";
import Link from "next/link";
import LiveStrip from "./LiveStrip";
import HabitStrip from "@/components/ligas/HabitStrip";
import MiClubCard from "@/components/ligas/MiClubCard";
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
      className="zl-card zl-tap"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", textDecoration: "none" }}
    >
      {c.flag ? (
        <img src={`https://flagcdn.com/32x24/${c.flag}.png`} alt="" width={28} height={21} loading="lazy" style={{ width: 28, height: 21, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
      ) : (
        <span style={{ width: 28, height: 21, borderRadius: 3, background: "rgba(201,168,76,0.18)", flexShrink: 0 }} aria-hidden />
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--zl-text)" }}>{c.name}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--zl-muted)" }}>{c.country}</span>
      </span>
      <span aria-hidden className="zl-chev" style={{ color: GOLD, fontSize: 18 }}>&rsaquo;</span>
    </Link>
  );
}

export default function LigasHub() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060B14, #0a0f1a)", color: "#E2E8F0", padding: "28px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <p className="zl-eyebrow">Zona de Ligas</p>
        <h1 className="zl-h1">Todas las ligas y copas</h1>
        <p className="zl-sub">Calendario, resultados y clasificación en vivo. No leas el partido: juégalo.</p>

        {/* Mi club: el ancla de la temporada — su próximo partido, su último
            resultado y sus noticias, siempre arriba del todo. */}
        <MiClubCard />

        {/* Hábito visible en la puerta: racha + cofre del día 7 + Fútcoins. */}
        <HabitStrip />

        <LiveStrip />

        {REGION_ORDER.map((region) => {
          const comps = COMPETITIONS.filter((c) => c.region === region);
          if (!comps.length) return null;
          return (
            <section key={region} style={{ marginTop: 28 }}>
              <h2 className="zl-h2">{REGION_LABEL[region]}</h2>
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
