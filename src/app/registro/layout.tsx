import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regístrate gratis: juega tu liga con Zona de Ligas",
  description:
    "Crea tu cuenta gratis y empieza a jugar tu fútbol: predicciones jornada a jornada, Fantasy, Draft de Ligas y trivia. LigaPro, Liga MX, Brasileirão, LaLiga, Premier y más. Sin coste.",
  keywords: [
    "registro mundial 2026",
    "crear cuenta zonamundial",
    "jugar mundial gratis",
    "fantasy mundial registro",
  ],
  alternates: { canonical: "/registro" },
  openGraph: {
    title: "Regístrate gratis en ZonaMundial",
    description: "Crea tu cuenta y empieza a jugar tu liga, jornada a jornada. Sin coste.",
    url: "/registro",
    // images se hereda del root opengraph-image.tsx (dinámico, dorado).
    // Antes apuntaba a /og-image.jpg estática (23-abril, versión vieja).
  },
  twitter: {
    title: "Regístrate gratis — ZonaMundial",
    description: "Juega tu liga: predicciones, Fantasy, Draft y trivia.",
  },
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
