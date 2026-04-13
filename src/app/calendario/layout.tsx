import type { ReactNode } from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export default function CalendarioLayout({ children }: { children: ReactNode }) {
  return (
    <div className={outfit.className}>
      {children}
    </div>
  );
}
