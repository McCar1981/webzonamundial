import type { Metadata } from "next";

export const metadata: Metadata = {
  // Corto: el template del layout raíz añade " | Zona de Ligas" (≤60 chars total).
  title: "Blog de Zona de Ligas: análisis y datos del fútbol de clubes",
  description:
    "Investigación editorial diaria del fútbol de clubes: ligas, clubes, jugadores, análisis tácticos y guías. Firmado por la redacción de Zona de Ligas.",
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
    title: "Blog Editorial Zona de Ligas",
    description:
      "Análisis y datos editoriales del fútbol de clubes firmados por la redacción de Zona de Ligas.",
    url: "/blog",
    type: "website",
    siteName: "Zona de Ligas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Editorial Zona de Ligas",
    description: "Investigación editorial diaria del fútbol de clubes.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
