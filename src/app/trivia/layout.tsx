// src/app/trivia/layout.tsx
//
// Metadatos SEO de la Trivia de fútbol. Página pública e indexable: es
// contenido interactivo de valor (preguntas frescas a diario) que atrae
// tráfico orgánico y genera visitas recurrentes durante el torneo.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trivia de fútbol — Preguntas diarias de tu liga | Zona de Ligas",
  description:
    "Pon a prueba lo que sabes de fútbol con la Trivia diaria: preguntas nuevas cada día de tu liga y del fútbol de clubes, Modo Relámpago, Muerte Súbita y ranking. ¿Cuánto sabes?",
  alternates: { canonical: "/trivia" },
  openGraph: {
    title: "Trivia de fútbol — Zona de Ligas",
    description:
      "Preguntas nuevas cada día de tu liga y del fútbol de clubes. Compite en el ranking, mantén tu racha y demuestra que sabes más que nadie.",
    url: "/trivia",
    siteName: "ZonaMundial",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TriviaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
