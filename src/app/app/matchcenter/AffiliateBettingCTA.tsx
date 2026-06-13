// src/app/app/matchcenter/AffiliateBettingCTA.tsx
//
// CTA de apuestas (afiliado 1xBet) para el Match Center. SERVER COMPONENT: se
// renderiza SOLO si el visitante está físicamente en un país LATAM permitido
// (ver lib/affiliate/geo.ts). Para España y país desconocido devuelve null — no
// se muestra NADA (requisito legal: prohibido anunciar apuestas en ES).

import { visitorCanSeeBetting, BET_AFFILIATE_URL } from "@/lib/affiliate/geo";

const GOLD = "#C9A84C";

export default function AffiliateBettingCTA({ matchLabel }: { matchLabel?: string }) {
  // FAIL-CLOSED: si no es un país LATAM permitido, no se muestra nada.
  if (!visitorCanSeeBetting()) return null;

  const title = matchLabel
    ? `¿Tan seguro de ${matchLabel}?`
    : "¿Tan seguro de tu pronóstico?";

  return (
    <div style={{ maxWidth: 520, margin: "8px auto 0", padding: "0 16px" }}>
      <div
        style={{
          background: "linear-gradient(135deg,#0F1D32,#0B1825)",
          border: `1px solid ${GOLD}33`,
          borderRadius: 16,
          padding: "16px 18px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#7E94AD",
          }}
        >
          Publicidad
        </span>
        <h3 style={{ margin: "6px 0 2px", fontSize: 17, fontWeight: 800, color: "#fff" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#B9C7D8" }}>
          Llévalo a 1xBet y apuesta este partido.
        </p>
        <a
          href={BET_AFFILIATE_URL}
          target="_blank"
          rel="nofollow sponsored noopener"
          style={{
            display: "inline-block",
            padding: "11px 26px",
            background: `linear-gradient(135deg, ${GOLD}, #FDE68A)`,
            color: "#1A1208",
            textDecoration: "none",
            borderRadius: 99,
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Apostar en 1xBet →
        </a>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#6b7c90" }}>
          +18 · Juega con responsabilidad
        </p>
      </div>
    </div>
  );
}
