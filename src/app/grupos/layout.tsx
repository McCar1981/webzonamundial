import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grupos del Mundial 2026: 12 grupos, 48 selecciones",
  description:
    "Todos los grupos del Mundial 2026 (A-L): 12 grupos, 48 selecciones. Calendario, clasificación y predicciones por grupo.",
  keywords: [
    "grupos mundial 2026",
    "grupo A mundial 2026",
    "grupo B mundial 2026",
    "sorteo mundial 2026",
    "clasificación mundial 2026",
  ],
  alternates: { canonical: "/grupos" },
  openGraph: {
    title: "Grupos del Mundial 2026 — 12 grupos, 48 selecciones",
    description: "Calendario, clasificación y predicciones por grupo en ZonaMundial.",
    url: "/grupos",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Grupos del Mundial 2026",
    description: "12 grupos, 48 selecciones, calendario y predicciones.",
  },
};

export default function GruposLayout({ children }: { children: React.ReactNode }) {
  return children;
}
