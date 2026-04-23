import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sedes del Mundial 2026: 16 ciudades en USA, México y Canadá",
  description:
    "Las 16 sedes del Mundial 2026: ciudades, estadios, capacidad, partidos programados. Todo sobre USA, México y Canadá como anfitriones.",
  keywords: [
    "sedes mundial 2026",
    "ciudades mundial 2026",
    "estadios mundial 2026",
    "mundial usa méxico canadá",
    "16 sedes mundial",
  ],
  alternates: { canonical: "/sedes" },
  openGraph: {
    title: "Sedes del Mundial 2026 — 16 ciudades",
    description: "Ciudades, estadios y partidos en USA, México y Canadá.",
    url: "/sedes",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Sedes del Mundial 2026",
    description: "16 ciudades, 3 países, 104 partidos.",
  },
};

export default function SedesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
