import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "La App del Mundial 2026: Predicciones, Fantasy, IA Coach y más",
  description:
    "Descubre todo lo que incluye la app ZonaMundial: 8 tipos de predicciones, Fantasy, IA Coach, Trivia, Modo Carrera, ligas privadas, streaming con creators y mucho más. Gratis.",
  keywords: [
    "app mundial 2026",
    "aplicación mundial 2026",
    "mejor app predicciones mundial",
    "fantasy mundial app",
    "app fútbol gratis",
  ],
  alternates: { canonical: "/la-app" },
  openGraph: {
    title: "La App del Mundial 2026 — ZonaMundial",
    description:
      "8 tipos de predicciones, Fantasy, IA Coach, Trivia, streaming con creators. Todo gratis en una app.",
    url: "/la-app",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "La App del Mundial 2026 — ZonaMundial",
    description:
      "8 tipos de predicciones, Fantasy, IA Coach, Trivia, streaming con creators. Todo gratis.",
  },
};

export default function LaAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
