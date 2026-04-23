import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Selecciones del Mundial 2026: 48 equipos clasificados",
  description:
    "Todas las selecciones clasificadas al Mundial 2026: plantilla, estadísticas, historia y predicciones para cada uno de los 48 equipos.",
  keywords: [
    "selecciones mundial 2026",
    "equipos mundial 2026",
    "48 selecciones mundial",
    "plantilla selección mundial",
    "países mundial 2026",
  ],
  alternates: { canonical: "/selecciones" },
  openGraph: {
    title: "Selecciones del Mundial 2026 — 48 equipos clasificados",
    description: "Plantilla, estadísticas, historia y predicciones de cada selección.",
    url: "/selecciones",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Selecciones del Mundial 2026",
    description: "48 equipos, plantilla, estadísticas y predicciones.",
  },
};

export default function SeleccionesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
