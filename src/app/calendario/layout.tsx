import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calendario Mundial 2026: todos los partidos, fechas y horarios",
  description:
    "Calendario completo del Mundial 2026: 104 partidos, 48 selecciones, 16 sedes. Consulta fechas, horarios y resultados en directo.",
  keywords: [
    "calendario mundial 2026",
    "partidos mundial 2026",
    "fechas mundial 2026",
    "horarios mundial 2026",
    "resultados mundial 2026",
  ],
  alternates: { canonical: "/calendario" },
  openGraph: {
    title: "Calendario Mundial 2026 — todos los partidos",
    description:
      "104 partidos, 48 selecciones, 16 sedes. Consulta el calendario completo del Mundial 2026.",
    url: "/calendario",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Calendario Mundial 2026",
    description: "104 partidos, 48 selecciones, 16 sedes.",
  },
};

export default function CalendarioLayout({ children }: { children: ReactNode }) {
  return (
    <div className={outfit.className}>
      {children}
    </div>
  );
}
