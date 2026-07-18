"use client";

// CTA de afiliado Amazon (camisetas del Mundial). Reutiliza amazonGoUrl +
// AMAZON_DISCLOSURE + rel="sponsored" (mismo patron que /camisetas). CONTEXTUAL:
// muestra la CAMISETA REAL (imagen propia de cada seleccion, de KIT_BY_ISO) de
// los equipos del partido en scope; si no hay equipos, un CTA generico. Sin
// precios (los pone Amazon en destino). El redirector /go/amazon localiza por IP
// (amazon.es tag -21 en Espana; amazon.com tag -20 en LATAM/resto).
//
// MEDICION: cada clic emite el evento GA4 `affiliate_click` (network=amazon,
// placement=lobby|match, item=<seleccion o "generico">) para ver el
// comportamiento en tiempo real en Analytics, sin depender del panel de Amazon.
//
// LOGO de Amazon: NO se reproduce su logo (el "smile" tiene uso muy restringido
// y recrearlo arriesga la cuenta). Se usa el nombre "Amazon" (uso nominativo) +
// un boton con su color reconocible. En el pie se muestra la insignia OFICIAL
// "Available at Amazon" (asset oficial descargado de las guias de marca de
// Amazon, SIN modificar) + la atribucion de marca exigida.

import type { CSSProperties } from "react";
import { amazonGoUrl, AMAZON_DISCLOSURE } from "@/lib/affiliate/amazon";
import { KIT_BY_ISO } from "@/data/kits-2026";
import { trackEvent } from "@/lib/analytics/track-event";

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

// Boton con el amarillo reconocible de Amazon + texto oscuro (uso nominativo del
// nombre, NO el logo). Da "seriedad" sin tocar el smile/trademark.
const amazonBtn: CSSProperties = {
  background: "linear-gradient(180deg,#FFD814,#F7CA00)",
  color: "#0F1111",
  fontWeight: 800,
  textAlign: "center",
  textDecoration: "none",
  border: "1px solid #E2A400",
};

export default function MerchAmazonStrip({
  home = null,
  away = null,
  variant = "lobby",
  title,
}: MerchAmazonStripProps) {
  const teams: Team[] = [home, away].filter(
    (t): t is Team => !!t && !!t.name && !!t.flag
  );

  // Evento GA4 al clicar un enlace de Amazon (no rompe la navegacion: trackEvent
  // es sincrono y fail-safe, y el enlace abre en pestana nueva).
  const trackClick = (item: string) =>
    trackEvent("affiliate_click", {
      network: "amazon",
      placement: variant,
      item,
    });

  const cardBg =
    variant === "lobby"
      ? "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(10,9,6,0.55))"
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
      {/* cabecera */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 12,
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
            color: "#a69a82",
            flexShrink: 0,
          }}
        >
          Publicidad
        </span>
      </div>

      {teams.length === 0 ? (
        /* Generico: un solo boton ancho. */
        <a
          href={amazonGoUrl("camiseta mundial 2026")}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackClick("generico")}
          style={{
            ...amazonBtn,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            padding: "12px 14px",
            borderRadius: 10,
            fontSize: 14,
          }}
        >
          Ver camisetas del Mundial en Amazon
        </a>
      ) : (
        /* Contextual: una tarjeta con la camiseta REAL de cada seleccion. */
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              teams.length > 1 ? "repeat(auto-fill, minmax(140px, 1fr))" : "1fr",
            gap: 10,
          }}
        >
          {teams.map((t) => {
            const image = KIT_BY_ISO[t.flag]?.image ?? null;
            return (
              <a
                key={t.flag + t.name}
                href={amazonGoUrl(teamQuery(t.name))}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() => trackClick(t.name)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 10px 10px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(201,168,76,0.22)",
                  textDecoration: "none",
                }}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={`Camiseta de ${t.name}`}
                    loading="lazy"
                    style={{
                      height: 78,
                      width: "auto",
                      maxWidth: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))",
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://flagcdn.com/w80/${t.flag}.png`}
                    alt=""
                    loading="lazy"
                    style={{ height: 54, width: "auto", borderRadius: 4 }}
                  />
                )}

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#eef2fb",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {t.name}
                </span>

                <span
                  style={{
                    ...amazonBtn,
                    display: "block",
                    width: "100%",
                    marginTop: 2,
                    padding: "7px 10px",
                    borderRadius: 8,
                    fontSize: 12.5,
                  }}
                >
                  Ver en Amazon
                </span>
              </a>
            );
          })}
        </div>
      )}

      {/* Insignia OFICIAL "Available at Amazon" (asset oficial de Amazon,
          descargado de sus guias de marca, SIN modificar; version "rev" para
          fondo oscuro). Va en su propia fila con espacio libre alrededor, como
          exigen las guias (no alterar, no dentro de una frase). */}
      <div style={{ margin: "14px 2px 4px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/affiliate/available-at-amazon.png"
          alt="Available at Amazon"
          height={22}
          style={{ height: 22, width: "auto", display: "block" }}
        />
      </div>

      {/* avisos: afiliado + marca */}
      <p
        style={{
          margin: "12px 2px 0",
          fontSize: 10,
          lineHeight: 1.4,
          color: "#a69a82",
        }}
      >
        {AMAZON_DISCLOSURE}
      </p>
      <p
        style={{
          margin: "4px 2px 0",
          fontSize: 9.5,
          lineHeight: 1.4,
          color: "#7d8aa6",
        }}
      >
        La marca de Amazon se usa bajo licencia de Amazon.com, Inc. o sus filiales.
      </p>
    </div>
  );
}
