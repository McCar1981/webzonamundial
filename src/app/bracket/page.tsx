// src/app/bracket/page.tsx
// Página principal del Bracket Challenge — anónima, sin login.
// Vista clásica + cósmica con persistencia local (localStorage).

import type { Metadata } from "next";
import BracketChallenge from "@/components/bracket/BracketChallenge";
import BracketEditorialIntro from "@/components/bracket/BracketEditorialIntro";

export const metadata: Metadata = {
  title: "Bracket Challenge Mundial 2026 — Predice los 104 partidos",
  description:
    "Construye tu Bracket Mundial 2026: predice los 104 partidos del torneo, desde fase de grupos hasta la Final. Vista clásica o cósmica. Anónimo, sin registro.",
  alternates: { canonical: "/bracket" },
  openGraph: {
    title: "Bracket Challenge Mundial 2026 · ZonaMundial",
    description:
      "Predice 48 selecciones, 12 grupos, 7 fases y 104 partidos. Cinematográfico, único. ¿Quién será tu campeón?",
    url: "/bracket",
    type: "website",
    images: [
      {
        url: "/img/og-bracket.jpg",
        width: 1200,
        height: 630,
        alt: "Bracket Challenge Mundial 2026",
      },
    ],
  },
};

export default function BracketPage() {
  return (
    <>
      <BracketChallenge />
      {/*
        Bloque editorial al pie de la página (~900 palabras) que enriquece
        /bracket de cara a SEO + AdSense. Demuestra que la página no es solo
        un widget interactivo: tiene contenido sustancial sobre cómo
        construir un bracket ganador, estrategias y guía de uso.
      */}
      <BracketEditorialIntro />
    </>
  );
}
