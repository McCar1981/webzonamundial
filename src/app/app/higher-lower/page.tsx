import type { Metadata } from "next";
import HigherLowerLanding from "./HigherLowerLanding";

export const metadata: Metadata = {
  title: "Higher or Lower · ZonaMundial",
  description: "¿Sabes más de fútbol de lo que crees? Acierta si el siguiente dato es mayor o menor.",
};

export default function HigherLowerPage() {
  return <HigherLowerLanding />;
}
