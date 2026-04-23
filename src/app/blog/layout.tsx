import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog ZonaMundial: análisis, predicciones y guías del Mundial 2026",
  description:
    "Artículos, análisis y guías del Mundial 2026: grupos, selecciones, predicciones, fantasy tips. Actualizado a diario por expertos y creators.",
  keywords: [
    "blog mundial 2026",
    "análisis mundial 2026",
    "predicciones expertos mundial",
    "guías fantasy mundial",
    "noticias mundial fútbol",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog ZonaMundial — Mundial 2026",
    description: "Artículos, análisis y guías del Mundial 2026 actualizados a diario.",
    url: "/blog",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Blog ZonaMundial — Mundial 2026",
    description: "Análisis, predicciones y guías del Mundial 2026.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
