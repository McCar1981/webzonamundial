import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regístrate gratis: juega el Mundial 2026 con ZonaMundial",
  description:
    "Crea tu cuenta gratis en ZonaMundial y empieza a jugar: predicciones, fantasy, trivia y más. 48 selecciones, 104 partidos, 9 creators. Sin coste.",
  keywords: [
    "registro mundial 2026",
    "crear cuenta zonamundial",
    "jugar mundial gratis",
    "fantasy mundial registro",
  ],
  alternates: { canonical: "/registro" },
  openGraph: {
    title: "Regístrate gratis en ZonaMundial",
    description: "Crea tu cuenta y empieza a jugar el Mundial 2026. Sin coste.",
    url: "/registro",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Regístrate gratis — ZonaMundial",
    description: "Juega el Mundial 2026: predicciones, fantasy, trivia.",
  },
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
