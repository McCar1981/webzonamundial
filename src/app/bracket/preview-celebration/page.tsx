// src/app/bracket/preview-celebration/page.tsx
//
// Página de prueba para visualizar el CelebrationOverlay con cualquier
// selección campeona, sin tener que completar los 104 partidos del
// bracket. Útil para QA visual de los colores procedurales por team.
//
// Uso:
//   /bracket/preview-celebration            → Argentina (default)
//   /bracket/preview-celebration?team=ESP   → España
//   /bracket/preview-celebration?team=BRA   → Brasil
//   /bracket/preview-celebration?team=GER   → Alemania (caso "muy oscuro")
//   /bracket/preview-celebration?team=JPN   → Japón
//
// Los IDs válidos son los de BracketTeam.id (3 letras ISO).
//
// NOTA: esta ruta NO está enlazada desde ningún sitio público.
// Es solo para QA/dev. Sin meta robots index para SEO.

import type { Metadata } from "next";
import PreviewCelebrationClient from "./PreviewCelebrationClient";

export const metadata: Metadata = {
  title: "Preview Celebration · ZonaMundial",
  robots: { index: false, follow: false },
};

export default function PreviewCelebrationPage({
  searchParams,
}: {
  searchParams?: { team?: string; goals?: string };
}) {
  const teamId = (searchParams?.team || "ARG").toUpperCase();
  const goals = Number(searchParams?.goals ?? "202");

  return <PreviewCelebrationClient teamId={teamId} totalGoals={goals} />;
}
