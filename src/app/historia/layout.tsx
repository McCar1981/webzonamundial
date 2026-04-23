import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historia del Mundial de Fútbol: campeones, momentos icónicos y hitos",
  description:
    "Recorrido por la historia de los Mundiales de Fútbol: todos los campeones desde 1930, momentos icónicos (Maracanazo, Mano de Dios, España 2010) y datos históricos.",
  keywords: [
    "historia mundial fútbol",
    "campeones mundial fútbol",
    "mundiales fifa historia",
    "momentos icónicos mundial",
    "maracanazo",
    "mano de dios",
  ],
  alternates: { canonical: "/historia" },
  openGraph: {
    title: "Historia del Mundial de Fútbol — ZonaMundial",
    description: "Campeones, momentos icónicos y datos históricos de todos los Mundiales.",
    url: "/historia",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Historia del Mundial de Fútbol",
    description: "Campeones desde 1930 y momentos icónicos.",
  },
};

export default function HistoriaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
