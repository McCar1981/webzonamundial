import type { Metadata } from "next";

const ZONA_FUTBOL_URL = "https://zonamundial.app/zona-futbol-preview";
const HERO_IMAGE = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=630&fit=crop";

export const metadata: Metadata = {
  title: "Zona Futbol — Temporada 2026/2027",
  description: "Fantasy, Predicciones, Duelos, Cromos. Todo el fútbol de liga en una app. Juega en Zona Futbol 2026/2027 con minijuegos interactivos, rankings globales y premios reales.",
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
