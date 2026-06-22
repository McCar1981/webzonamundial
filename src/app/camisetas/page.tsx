// src/app/camisetas/page.tsx
//
// Página pública (indexable, compatible AdSense) de camisetas del Mundial 2026
// con enlaces de AFILIADO de Amazon. Los botones van al redirector /go/amazon,
// que localiza el marketplace por IP (España -> amazon.es; resto -> amazon.com).
// Lleva el aviso de afiliación obligatorio. Diseño mobile-first (la mayoría del
// tráfico es móvil): rejilla que se adapta y botones grandes para el dedo.

import type { Metadata } from "next";
import { amazonGoUrl, AMAZON_DISCLOSURE } from "@/lib/affiliate/amazon";
import AmazonTrackedLink from "@/components/affiliate/AmazonTrackedLink";

export const metadata: Metadata = {
  title: "Camisetas del Mundial 2026 — dónde comprarlas | ZonaMundial",
  description:
    "Encuentra la camiseta oficial de tu selección para el Mundial 2026. Precios y disponibilidad en Amazon, localizado a tu país.",
  alternates: { canonical: "https://zonamundial.app/camisetas" },
};

const BG = "#060B14", BG2 = "#0F1D32", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const TEAMS: { label: string; flag: string }[] = [
  { label: "España", flag: "es" },
  { label: "México", flag: "mx" },
  { label: "Argentina", flag: "ar" },
  { label: "Brasil", flag: "br" },
  { label: "Colombia", flag: "co" },
  { label: "Uruguay", flag: "uy" },
  { label: "Chile", flag: "cl" },
  { label: "Perú", flag: "pe" },
  { label: "Ecuador", flag: "ec" },
  { label: "Estados Unidos", flag: "us" },
  { label: "Canadá", flag: "ca" },
  { label: "Francia", flag: "fr" },
  { label: "Inglaterra", flag: "gb-eng" },
  { label: "Portugal", flag: "pt" },
  { label: "Alemania", flag: "de" },
  { label: "Países Bajos", flag: "nl" },
  { label: "Italia", flag: "it" },
  { label: "Bélgica", flag: "be" },
  { label: "Croacia", flag: "hr" },
  { label: "Marruecos", flag: "ma" },
  { label: "Japón", flag: "jp" },
  { label: "Senegal", flag: "sn" },
];

function query(label: string): string {
  return `camiseta seleccion ${label} 2026`;
}

export default function CamisetasPage() {
  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", padding: "28px 16px 64px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 22 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Mundial 2026</span>
          <h1 style={{ fontSize: "clamp(26px,6vw,40px)", fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
            Camisetas del <span style={{ color: GOLD }}>Mundial 2026</span>
          </h1>
          <p style={{ color: MID, marginTop: 12, fontSize: 15.5, lineHeight: 1.6, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            La camiseta oficial de tu selección. Pulsa tu equipo y te llevamos a Amazon de tu país, con precio y disponibilidad al momento.
          </p>
        </header>

        {/* Rejilla de selecciones — se adapta sola al ancho (móvil = 2 columnas). */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {TEAMS.map((t) => (
            <AmazonTrackedLink
              key={t.flag}
              href={amazonGoUrl(query(t.label))}
              item={t.label}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 13px", borderRadius: 14, minHeight: 56,
                border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.07)",
                color: "#fff", textDecoration: "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/w40/${t.flag}.png`} alt="" loading="lazy" width={28} height={20}
                style={{ width: 28, height: 20, borderRadius: 3, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: GOLD2, opacity: 0.9 }}>~90-110 € · Ver en Amazon</span>
              </span>
            </AmazonTrackedLink>
          ))}
        </div>

        {/* Botón general */}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <AmazonTrackedLink
            href={amazonGoUrl("camiseta mundial 2026")}
            item="generico"
            style={{
              display: "inline-block", padding: "14px 28px", borderRadius: 999,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#1a1206",
              fontWeight: 800, fontSize: 15.5, textDecoration: "none",
            }}
          >
            Ver todas las camisetas en Amazon →
          </AmazonTrackedLink>
        </div>

        {/* Nota de autenticidad */}
        <p style={{ color: DIM, fontSize: 12.5, lineHeight: 1.6, marginTop: 24, textAlign: "center", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Consejo: verifica que el vendedor sea la marca oficial (Adidas, Nike, Puma) o un distribuidor autorizado. La réplica adulto suele costar ~90-110 €.
        </p>

        {/* Aviso de afiliación obligatorio */}
        <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 12, background: BG2, border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ color: MID, fontSize: 11.5, lineHeight: 1.6, margin: 0, textAlign: "center" }}>{AMAZON_DISCLOSURE}</p>
        </div>
      </div>
    </div>
  );
}
