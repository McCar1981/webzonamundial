import type { Metadata } from "next";
import PrediccionesGame from "./PrediccionesGame";
import AffiliateBettingCTA from "@/components/affiliate/AffiliateBettingCTA";

export const metadata: Metadata = {
  title: "Predicciones · Juega los 8 tipos | ZonaMundial",
  description: "Predice cada partido del Mundial 2026 con los 8 tipos: resultado exacto, ganador con confianza, primer goleador, cadena, duelos, over/under IA, minuto del drama y modo manada.",
};

export default function PrediccionesJugarPage() {
  return (
    <>
      <PrediccionesGame />
      <AffiliateBettingCTA />
    </>
  );
}
