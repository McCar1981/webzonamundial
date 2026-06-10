import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import { WC_MATCHES, matchInstant } from "@/lib/calendario/time";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

/** Construye un ItemList con SportsEvent estructurado para los 104 partidos
 *  REALES (el fixture de prueba del Match Center queda fuera). Mejora el SEO
 *  para queries del tipo "México vs Sudáfrica horario" y habilita rich
 *  snippets en Google. startDate va como instante UTC absoluto (las horas de
 *  matches.ts están en ET; sin offset Google interpretaba la hora a su aire). */
function buildSportsEventListLd() {
  const SITE = "https://zonamundial.app";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Calendario completo del Mundial FIFA 2026",
    numberOfItems: WC_MATCHES.length,
    itemListElement: WC_MATCHES.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SportsEvent",
        "@id": `${SITE}/calendario#match-${m.i}`,
        name: `${m.h} vs ${m.a} — ${m.p}${m.j ? ` · J${m.j}` : ""} · Mundial 2026`,
        description: `${m.h} contra ${m.a} en ${m.vn} (${m.vc}). ${m.p}${m.j ? ` jornada ${m.j}` : ""} del Mundial FIFA 2026.`,
        startDate: matchInstant(m)?.toISOString() ?? `${m.d}T${m.t}:00-04:00`,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        sport: "Soccer",
        location: {
          "@type": "Place",
          name: m.vn,
          address: {
            "@type": "PostalAddress",
            addressLocality: m.vc,
            addressCountry:
              m.vf === "us" ? "US" : m.vf === "mx" ? "MX" : m.vf === "ca" ? "CA" : "US",
          },
        },
        homeTeam: { "@type": "SportsTeam", name: m.h },
        awayTeam: { "@type": "SportsTeam", name: m.a },
        organizer: { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com" },
        url: `${SITE}/calendario#match-${m.i}`,
      },
    })),
  };
}

export const metadata: Metadata = {
  title: "Calendario Mundial 2026: todos los partidos, fechas y horarios",
  description:
    "Calendario completo del Mundial 2026: 104 partidos, 48 selecciones, 16 sedes. Consulta fechas, horarios en tu zona y resultados en directo.",
  keywords: [
    "calendario mundial 2026",
    "partidos mundial 2026",
    "fechas mundial 2026",
    "horarios mundial 2026",
    "resultados mundial 2026",
  ],
  alternates: { canonical: "/calendario" },
  openGraph: {
    title: "Calendario Mundial 2026 — todos los partidos",
    description:
      "104 partidos, 48 selecciones, 16 sedes. Consulta el calendario completo del Mundial 2026.",
    url: "/calendario",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Calendario Mundial 2026",
    description: "104 partidos, 48 selecciones, 16 sedes.",
  },
};

export default function CalendarioLayout({ children }: { children: ReactNode }) {
  const ld = buildSportsEventListLd();
  return (
    <div className={outfit.className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      {children}
    </div>
  );
}
