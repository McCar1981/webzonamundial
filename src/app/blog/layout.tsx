import type { Metadata } from "next";

export const metadata: Metadata = {
  // Corto: el template del layout raíz añade " | ZonaMundial" (≤60 chars total).
  title: "Blog del Mundial 2026: análisis y datos",
  description:
    "Investigación editorial diaria sobre el Mundial 2026: selecciones, sedes, jugadores, análisis tácticos y guías. Firmado por la redacción de ZonaMundial.",
  keywords: [
    "blog mundial 2026",
    "análisis mundial 2026",
    "editorial zonamundial",
    "guías mundial fifa 2026",
    "predicciones mundial",
    "selecciones clasificadas mundial 2026",
  ],
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    title: "Blog Editorial ZonaMundial — Mundial 2026",
    description:
      "Análisis y datos editoriales del Mundial 2026 firmados por la redacción de ZonaMundial.",
    url: "/blog",
    type: "website",
    siteName: "ZonaMundial",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Editorial ZonaMundial — Mundial 2026",
    description: "Investigación editorial diaria del Mundial 2026.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
