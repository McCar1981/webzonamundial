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
  // /la-app es una demo interactiva con poca prosa: SEO y AdSense la
  // pueden ver como "thin content" (646 palabras renderizadas). Pedimos
  // noindex para que Google no la considere en la evaluación editorial
  // del sitio. El follow sí queda activo para el linking interno.
  robots: { index: false, follow: true },
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
