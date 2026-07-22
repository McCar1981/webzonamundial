// src/app/ligas/predicciones/page.tsx
//
// "Predice en tus ligas": el hub de predicción de Zona de Ligas (reemplaza, en el
// lobby post-Mundial, al viejo lobby de predicciones del Mundial). Lista los
// partidos predecibles de las ligas elegidas por el usuario y enlaza a cada
// Centro de Partido. Por usuario -> force-dynamic (el contenido lo trae el
// componente cliente desde /api/ligas/mi-feed).

import Link from "next/link";
import FutcoinsBadge from "@/components/ligas/FutcoinsBadge";
import PrediccionesLigas from "./PrediccionesLigas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Predice en tus ligas — ZonaMundial",
  description: "Predice los partidos de tus ligas elegidas y gana Fútcoins. Sin apuestas.",
  robots: { index: false, follow: false },
};

const GOLD = "#c9a84c";
const DIM = "#a69a82";

export default function PrediccionesLigasPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #000000, #000000)", color: "#E2E8F0", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
            <span aria-hidden>&larr;</span> Zona de Ligas
          </Link>
          <FutcoinsBadge />
        </div>

        <h1 className="zl-h1" style={{ marginTop: 16 }}>Predice en tus ligas</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: DIM }}>
          Elige un partido de tus ligas y predícelo. Ganas Fútcoins al acertar — sin apuestas.
        </p>

        <PrediccionesLigas />

        <p style={{ marginTop: 26, fontSize: 12.5, color: DIM, textAlign: "center" }}>
          ¿Buscas tu historial? <Link href="/ligas/mis-predicciones" style={{ color: GOLD, textDecoration: "none" }}>Mis predicciones</Link>
        </p>
      </div>
    </main>
  );
}
