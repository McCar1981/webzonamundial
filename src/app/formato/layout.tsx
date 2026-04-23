import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formato Mundial 2026: cómo funciona el torneo con 48 equipos",
  description:
    "Explicación completa del nuevo formato del Mundial 2026: 48 selecciones, 12 grupos, 104 partidos, repesca, fases eliminatorias. Todo lo que necesitas saber.",
  keywords: [
    "formato mundial 2026",
    "48 equipos mundial",
    "cómo funciona mundial 2026",
    "reglas mundial 2026",
    "fase grupos mundial 2026",
  ],
  alternates: { canonical: "/formato" },
  openGraph: {
    title: "Formato Mundial 2026 — 48 equipos explicado",
    description:
      "48 selecciones, 12 grupos, 104 partidos. Explicación completa del nuevo formato.",
    url: "/formato",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Formato Mundial 2026 con 48 equipos",
    description: "12 grupos, 104 partidos, repesca, fases eliminatorias.",
  },
};

export default function FormatoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
