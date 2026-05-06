// /embed/* — layout simplificado para versiones iframe-friendly de la app.
// No incluye Header/Footer global, no incluye PromoPopup, no incluye nada
// que rompa el embed. Sí incluye el font global y meta robots noindex.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <div className={outfit.className}>{children}</div>;
}
