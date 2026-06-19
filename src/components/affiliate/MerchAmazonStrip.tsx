"use client";

// CTA de afiliado Amazon (camisetas del Mundial). Reutiliza el patron ya validado
// en /camisetas (amazonGoUrl + rel="sponsored" + AMAZON_DISCLOSURE) para no
// duplicar las reglas del programa. CONTEXTUAL: si recibe los equipos de un
// partido, muestra la camiseta de ESAS selecciones; si no, un CTA generico.
// Sin precios (el precio lo pone Amazon en destino). El redirector /go/amazon
// localiza por IP: Espana -> amazon.es (tag -21); LATAM/resto -> amazon.com (-20).
//
// Compatible con AdSense y separado del afiliado de apuestas (ese va en
// AffiliateBettingCTA, geobloqueado). Se monta en el lobby y en cada ficha de
// Match Center, donde esta la traccion real.

import { amazonGoUrl, AMAZON_DISCLOSURE } from "@/lib/affiliate/amazon";

type Team = { name: string; flag: string };

interface MerchAmazonStripProps {
  home?: Team | null;
  away?: Team | null;
  variant?: "lobby" | "match";
  title?: string;
}

// MISMA plantilla que /camisetas (sin tilde en "seleccion") para no fragmentar
// los resultados de busqueda de Amazon.
const teamQuery = (label: string) => `camiseta seleccion ${label} 2026`;

export default function MerchAmazonStrip({
  home = null,
  away = null,
  variant = "lobby",
  title,
}: MerchAmazonStripProps) {
  const teams: Team[] = [home, away].filter(
    (t): t is Team => !!t && !!t.name && !!t.flag
  );

  const chips =
    teams.length > 0
      ? teams.map((t) => ({
          key: t.flag + t.name,
          href: amazonGoUrl(teamQuery(t.name)),
          flag: t.flag as string | null,
          label: `Camiseta de ${t.name}`,
        }))
      : [
          {
            key: "generic",
            href: amazonGoUrl("camiseta mundial 2026"),
            flag: null as string | null,
            label: "Ver camisetas del Mundial",
          },
        ];

  const cardBg =
    variant === "lobby"
      ? "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(11,24,37,0.55))"
      : "rgba(255,255,255,0.04)";

  return (
    <div
      style={{
        background: cardBg,
        border: "1px solid rgba(201,168,76,0.30)",
        borderRadius: 16,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: "#eef2fb" }}>
          {title || "Camisetas del Mundial"}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#93a1bd",
            flexShrink: 0,
          }}
        >
          Publicidad
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            chips.length > 1 ? "repeat(auto-fill, minmax(150px, 1fr))" : "1fr",
          gap: 8,
        }}
      >
        {chips.map((c) => (
          <a
            key={c.key}
            href={c.href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 52,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(201,168,76,0.10)",
              border: "1px solid rgba(201,168,76,0.30)",
              color: "#eef2fb",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {c.flag ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://flagcdn.com/w40/${c.flag}.png`}
                alt=""
                width={28}
                height={19}
                loading="lazy"
                style={{ borderRadius: 3, flexShrink: 0 }}
              />
            ) : null}
            <span style={{ flex: 1, minWidth: 0 }}>{c.label}</span>
            <span
              style={{
                color: "#c9a84c",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              Ver en Amazon
            </span>
          </a>
        ))}
      </div>

      <p
        style={{
          margin: "10px 2px 0",
          fontSize: 10,
          lineHeight: 1.4,
          color: "#93a1bd",
        }}
      >
        {AMAZON_DISCLOSURE}
      </p>
    </div>
  );
}
