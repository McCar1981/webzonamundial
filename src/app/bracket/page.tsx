// src/app/bracket/page.tsx
// Página principal del Bracket Challenge — anónima, sin login.
// Vista clásica + cósmica con persistencia local (localStorage).

import type { Metadata } from "next";
import BracketChallenge from "@/components/bracket/BracketChallenge";
import BracketAccountSync from "@/components/bracket/BracketAccountSync";
import BracketEditorialIntro from "@/components/bracket/BracketEditorialIntro";

export const metadata: Metadata = {
  // "Simulador" delante: es la keyword con SERP más débil (auditoría 11-jun);
  // "bracket" se mantiene en title y description.
  title: "Simulador Mundial 2026: arma tu bracket",
  description:
    "Simulador del Mundial 2026 gratis: predice los 104 partidos, arma las llaves de las eliminatorias y elige a tu campeón. Bracket interactivo, sin registro.",
  keywords: [
    "simulador mundial 2026",
    "bracket mundial 2026",
    "llaves mundial 2026",
    "eliminatorias mundial 2026",
    "simulador copa del mundo 2026",
  ],
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
      {/* Mejora F: guardar el bracket en la cuenta para competir en ligas. */}
      <BracketAccountSync />
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
