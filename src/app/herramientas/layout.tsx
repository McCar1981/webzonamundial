import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Herramientas Mundial 2026: simuladores, predicciones, stats",
  description:
    "Herramientas gratis para el Mundial 2026: simulador de grupos, predictor de resultados, comparador de selecciones, generador de quinielas y más.",
  keywords: [
    "simulador mundial 2026",
    "herramientas mundial 2026",
    "predictor mundial 2026",
    "comparador selecciones",
    "generador quiniela mundial",
  ],
  alternates: { canonical: "/herramientas" },
  openGraph: {
    title: "Herramientas Mundial 2026 — Simuladores y predictores",
    description: "Simulador de grupos, predictor, comparador, generador de quinielas. Gratis.",
    url: "/herramientas",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Herramientas Mundial 2026",
    description: "Simuladores, predictores, comparadores gratis.",
  },
};

export default function HerramientasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
