import type { Metadata } from "next";

const ZONA_FUTBOL_URL = "https://zonamundial.app/zona-futbol-preview";
const HERO_IMAGE = "https://zonamundial.app/og-image.jpg";

export const metadata: Metadata = {
  title: "Zona Futbol 26/27 — Reserva tu sitio",
  description: "Fantasy, predicciones, duelos y cromos para las grandes ligas de clubes (Premier, LaLiga, Serie A, Liga MX, Champions, Libertadores). La evolución de ZonaMundial. Reserva tu sitio: muy pronto.",
  keywords: [
    "zona futbol",
    "fantasy fútbol 2026",
    "duelos fútbol",
    "cromos 2026",
    "predicciones ligas",
    "rankings fútbol",
    "minijuegos fútbol",
    "premier league",
    "laliga",
    "serie a",
    "bundesliga",
    "liga mx",
    "libertadores",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: ZONA_FUTBOL_URL,
    siteName: "ZonaMundial",
    title: "Zona Futbol — Temporada 2026/2027",
    description: "Fantasy, Predicciones, Duelos, Cromos. Todo el fútbol de liga en una app.",
    images: [
      {
        url: HERO_IMAGE,
        width: 1200,
        height: 630,
        alt: "Zona Futbol Preview",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zona Futbol — Temporada 2026/2027",
    description: "Fantasy, Predicciones, Duelos, Cromos. Todo el fútbol de liga en una app.",
    images: [HERO_IMAGE],
  },
  alternates: {
    canonical: ZONA_FUTBOL_URL,
  },
};

export default function ZonaFutbolPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
