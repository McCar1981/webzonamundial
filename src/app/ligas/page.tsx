// src/app/ligas/page.tsx
//
// Hub público de Zona de Ligas: índice de todas las competiciones del catálogo,
// agrupadas por región (América primero — audiencia 80% MX/LATAM). Cada tarjeta
// enlaza a su pantalla /ligas/[slug]. Estática (sin llamadas a la API): el
// catálogo es fijo. Indexable y en el sitemap.

import type { Metadata } from "next";
import LiveStrip from "./LiveStrip";
import HabitStrip from "@/components/ligas/HabitStrip";
import MiClubCard from "@/components/ligas/MiClubCard";
import LigasDirectory from "./LigasDirectory";

export const metadata: Metadata = {
  // Sin "| ZonaMundial": lo añade la plantilla del layout raíz (evita el sufijo duplicado).
  title: "Zona de Ligas: todas las ligas y copas en vivo",
  description: "Calendario, resultados y clasificación en vivo de LaLiga, Premier, Liga MX, Libertadores, Champions y más. Predice cada jornada y compite con tus amigos, sin apuestas.",
  alternates: { canonical: "https://zonamundial.app/ligas" },
};

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

        {/* Directorio del catalogo que se vuelve feed personal ("Mis ligas"). */}
        <LigasDirectory />
      </div>
    </main>
  );
}
