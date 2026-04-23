import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creators del Mundial 2026: streaming, contenido y competencias",
  description:
    "Conoce a los 9 creators de ZonaMundial: streaming en vivo de partidos, fantasy, predicciones y contenido exclusivo del Mundial 2026.",
  keywords: [
    "creators mundial 2026",
    "streamers fútbol",
    "creadores contenido mundial",
    "influencers fútbol",
    "sportfield",
  ],
  alternates: { canonical: "/creadores" },
  openGraph: {
    title: "Los Creators del Mundial 2026 — ZonaMundial",
    description: "9 creators, streaming en vivo, fantasy y predicciones del Mundial 2026.",
    url: "/creadores",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Los Creators del Mundial 2026",
    description: "9 creators, streaming, fantasy, predicciones.",
  },
};

export default function CreadoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
