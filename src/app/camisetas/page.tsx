// src/app/camisetas/page.tsx
//
// Página pública (indexable, compatible AdSense) de camisetas de CLUBES con
// enlaces de AFILIADO de Amazon. Los botones van al redirector /go/amazon,
// que localiza el marketplace por IP (España -> amazon.es; resto -> amazon.com).
// Lleva el aviso de afiliación obligatorio. Diseño mobile-first (la mayoría del
// tráfico es móvil): rejilla que se adapta y botones grandes para el dedo.
//
// Antes esta página vendía camisetas de SELECCIONES del Mundial 2026 — un
// inventario que caducó el 19-jul-2026. Ahora el catálogo se DERIVA de los
// clubes del Draft (CLUB_PLANTILLAS), así que crece solo cada vez que se añade
// una liga y reutiliza los escudos ya verificados del CDN de api-football
// (media.api-sports.io no consume cuota).

import type { Metadata } from "next";
import { amazonGoUrl, AMAZON_DISCLOSURE } from "@/lib/affiliate/amazon";
import AmazonTrackedLink from "@/components/affiliate/AmazonTrackedLink";
import { CLUB_PLANTILLAS } from "@/lib/draft/plantillas-ligas";
import { getCompetition } from "@/data/competitions";

export const metadata: Metadata = {
  title: "Camisetas de fútbol — la de tu club, dónde comprarla | Zona de Ligas",
  description:
    "La camiseta de tu club: LigaPro, Primera A, Liga Profesional, Brasileirão, FUTVE, Liga MX, LaLiga y Premier. Precio y disponibilidad en Amazon, localizado a tu país.",
  alternates: { canonical: "https://zonamundial.app/camisetas" },
};

const BG = "#000000", BG2 = "#14110a", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552";

// Orden pan-LATAM: la audiencia es sobre todo sudamericana (Ecuador ~50%), así
// que las ligas de casa van primero y Europa cierra. NO liderar con Liga MX.
const ORDEN_LIGAS = [
  "ligapro-ecuador",
  "primera-a-colombia",
  "liga-argentina",
  "brasileirao",
  "liga-futve",
  "liga-mx",
  "laliga",
  "premier-league",
];

// Nombres que Amazon confunde con otra cosa (o con otro club del mismo nombre).
// Solo los ambiguos: el resto busca bien con "camiseta <club>".
const QUERY_OVERRIDE: Record<string, string> = {
  "Barcelona SC": "camiseta Barcelona Sporting Club Ecuador",
  "El Nacional": "camiseta El Nacional Ecuador futbol",
  Independiente: "camiseta Independiente Avellaneda",
  Santos: "camiseta Santos FC Brasil",
  Monterrey: "camiseta Rayados de Monterrey",
  Internacional: "camiseta Internacional Porto Alegre",
  "Athletic Club": "camiseta Athletic Club Bilbao",
  "Portuguesa FC": "camiseta Portuguesa FC Venezuela",
};

const query = (club: string) => QUERY_OVERRIDE[club] ?? `camiseta ${club}`;

interface ClubItem { nombre: string; logo: string; }

// Catálogo derivado del Draft: un club por nombre, agrupado por liga. Se calcula
// una vez en build (la página es estática) — cero coste por visita.
function catalogo(): { slug: string; titulo: string; pais: string; clubes: ClubItem[] }[] {
  const porLiga = new Map<string, Map<string, ClubItem>>();
  for (const p of CLUB_PLANTILLAS) {
    if (!p.logo || !p.liga) continue;
    const m = porLiga.get(p.liga) ?? new Map<string, ClubItem>();
    if (!m.has(p.seleccion)) m.set(p.seleccion, { nombre: p.seleccion, logo: p.logo });
    porLiga.set(p.liga, m);
  }
  const slugs = [
    ...ORDEN_LIGAS.filter((s) => porLiga.has(s)),
    ...[...porLiga.keys()].filter((s) => !ORDEN_LIGAS.includes(s)),
  ];
  return slugs.map((slug) => {
    const comp = getCompetition(slug);
    return {
      slug,
      titulo: comp?.name ?? slug,
      pais: comp?.country ?? "",
      clubes: [...porLiga.get(slug)!.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    };
  });
}

export default function CamisetasPage() {
  const ligas = catalogo();
  const total = ligas.reduce((n, l) => n + l.clubes.length, 0);

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", padding: "28px 16px 64px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 26 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Zona de Ligas</span>
          <h1 style={{ fontSize: "clamp(26px,6vw,40px)", fontWeight: 900, margin: "10px 0 0", lineHeight: 1.1 }}>
            La camiseta de <span style={{ color: GOLD }}>tu club</span>
          </h1>
          <p style={{ color: MID, marginTop: 12, fontSize: 15.5, lineHeight: 1.6, maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>
            {total} clubes de {ligas.length} ligas, de LigaPro a la Premier. Pulsa el tuyo y te llevamos a Amazon de tu país,
            con precio y disponibilidad al momento.
          </p>
        </header>

        {ligas.map((liga) => (
          <section key={liga.slug} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 10px", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span>{liga.titulo}</span>
              {liga.pais && <span style={{ fontSize: 11.5, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>{liga.pais}</span>}
            </h2>

            {/* Rejilla de clubes — se adapta sola al ancho (móvil = 2 columnas). */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {liga.clubes.map((c) => (
                <AmazonTrackedLink
                  key={c.nombre}
                  href={amazonGoUrl(query(c.nombre))}
                  item={c.nombre}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 13px", borderRadius: 14, minHeight: 56,
                    border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.07)",
                    color: "#fff", textDecoration: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt="" loading="lazy" width={26} height={26}
                    style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
                  <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: GOLD2, opacity: 0.9 }}>Ver en Amazon</span>
                  </span>
                </AmazonTrackedLink>
              ))}
            </div>
          </section>
        ))}

        {/* Botón general */}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <AmazonTrackedLink
            href={amazonGoUrl("camiseta futbol club")}
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
          Consejo: verifica que el vendedor sea la marca oficial (Adidas, Nike, Puma, Umbro, Marathon) o un distribuidor
          autorizado. La réplica adulto de club suele costar entre 60 y 110 €.
        </p>

        {/* Aviso de afiliación obligatorio */}
        <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 12, background: BG2, border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ color: MID, fontSize: 11.5, lineHeight: 1.6, margin: 0, textAlign: "center" }}>{AMAZON_DISCLOSURE}</p>
        </div>
      </div>
    </div>
  );
}
