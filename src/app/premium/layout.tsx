import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zona de Ligas Premium: desbloquea todas las funciones",
  description:
    "Hazte Premium y accede a análisis avanzados, predicciones sin límite, ranking de tu liga, IA Coach ilimitada y funciones VIP para toda la temporada de clubes.",
  keywords: [
    "zona de ligas premium",
    "fantasy premium",
    "predicciones ilimitadas",
    "ia coach futbol",
  ],
  alternates: { canonical: "/premium" },
  // Página comercial con poca prosa editorial (~809 palabras). noindex
  // para que Google no la cuente como thin content en su evaluación AdSense.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Zona de Ligas Premium — tu liga sin límites",
    description:
      "Análisis avanzados, predicciones ilimitadas, IA Coach, ranking de tu liga. Hazte Premium.",
    url: "/premium",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "Zona de Ligas Premium",
    description: "Análisis avanzados, predicciones ilimitadas, IA Coach, ranking exclusivo.",
  },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
