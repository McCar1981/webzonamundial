// src/app/trivia/layout.tsx
//
// Metadatos SEO para la Trivia del Mundial. Página pública e indexable: es
// contenido interactivo de valor (preguntas frescas a diario) que atrae
// tráfico orgánico y genera visitas recurrentes durante el torneo.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trivia del Mundial 2026 — Preguntas diarias de fútbol | ZonaMundial",
  description:
    "Pon a prueba lo que sabes del Mundial con la Trivia diaria de ZonaMundial: preguntas nuevas cada día, Modo Relámpago, Muerte Súbita y ranking global. ¿Cuánto sabes de fútbol?",
  alternates: { canonical: "/trivia" },
  openGraph: {
    title: "Trivia del Mundial 2026 — ZonaMundial",
    description:
      "Preguntas nuevas cada día sobre el Mundial. Compite en el ranking, mantén tu racha y demuestra que sabes más que nadie.",
    url: "/trivia",
    siteName: "ZonaMundial",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TriviaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
