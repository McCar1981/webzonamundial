import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Noticias Mundial 2026: última hora, convocatorias y novedades",
  description:
    "Noticias del Mundial 2026: convocatorias de selecciones, lesiones, partidos, sedes, entrevistas. Actualizado al minuto por ZonaMundial.",
  keywords: [
    "noticias mundial 2026",
    "última hora mundial",
    "convocatorias mundial 2026",
    "lesiones mundial",
    "novedades mundial 2026",
  ],
  alternates: { canonical: "/noticias" },
  openGraph: {
    title: "Noticias Mundial 2026",
    description: "Convocatorias, lesiones, partidos, sedes. Actualizado al minuto.",
    url: "/noticias",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Noticias Mundial 2026",
    description: "Última hora y novedades del Mundial.",
  },
};

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
