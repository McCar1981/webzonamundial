// src/app/app/modo-carrera/jugar/page.tsx
// Wrapper server del Modo Carrera jugable. El estado vive en cliente
// (localStorage) y se sincroniza con Supabase via /api/modo-carrera/save.

import type { Metadata } from "next";
import CareerGame from "./CareerGame";

export const metadata: Metadata = {
  title: "Modo Carrera · Crea tu leyenda | ZonaMundial",
  description:
    "Crea tu director técnico, adopta una de las 48 selecciones y vive una carrera al estilo FIFA: progresión, misiones, reputación y legado.",
};

export default function ModoCarreraJugarPage() {
  return <CareerGame />;
}
