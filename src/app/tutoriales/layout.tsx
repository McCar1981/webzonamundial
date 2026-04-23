import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutoriales ZonaMundial: aprende a jugar el Mundial 2026",
  description:
    "Guías paso a paso para dominar ZonaMundial: cómo hacer predicciones, armar tu fantasy, usar el IA Coach, crear ligas con amigos y ganar el Mundial 2026.",
  keywords: [
    "tutoriales fantasy mundial",
    "cómo jugar fantasy",
    "cómo hacer predicciones mundial",
    "guía zonamundial",
    "aprender fantasy fútbol",
  ],
  alternates: { canonical: "/tutoriales" },
  openGraph: {
    title: "Tutoriales ZonaMundial — Mundial 2026",
    description: "Guías paso a paso para dominar predicciones, fantasy, IA Coach y más.",
    url: "/tutoriales",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Tutoriales ZonaMundial",
    description: "Guías paso a paso para dominar el Mundial 2026.",
  },
};

export default function TutorialesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
