import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZonaMundial Premium: Desbloquea todas las funciones",
  description:
    "Hazte Premium y accede a análisis avanzados, predicciones sin límite, ranking exclusivo, IA Coach ilimitada y funciones VIP para el Mundial 2026.",
  keywords: [
    "zonamundial premium",
    "mundial 2026 premium",
    "fantasy premium",
    "predicciones ilimitadas",
  ],
  alternates: { canonical: "/premium" },
  openGraph: {
    title: "ZonaMundial Premium — Todo el Mundial 2026 sin límites",
    description:
      "Análisis avanzados, predicciones ilimitadas, IA Coach, ranking exclusivo. Hazte Premium.",
    url: "/premium",
    images: ["/og-image.jpg"],
  },
  twitter: {
    title: "ZonaMundial Premium",
    description: "Análisis avanzados, predicciones ilimitadas, IA Coach, ranking exclusivo.",
  },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
