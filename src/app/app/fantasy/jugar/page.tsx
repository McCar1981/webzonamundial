import type { Metadata } from "next";
import FantasyGame from "./FantasyGame";

export const metadata: Metadata = {
  title: "Fantasy Mundial · Arma tu equipo | ZonaMundial",
  description: "Crea tu equipo Fantasy del Mundial 2026: formación táctica, mercado, capitán, power-ups, multiplicador Modo Underdog y puntuación en vivo.",
};

export default function FantasyJugarPage() {
  return <FantasyGame />;
}
