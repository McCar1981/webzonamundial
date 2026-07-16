// /patrocina — landing INBOUND de patrocinio: propuesta de valor + paquetes +
// formulario. Las marcas interesadas dejan su solicitud (→ KV + email a Carlos),
// en vez de tener que perseguirlas en frío. Página pública, sin sesión.

import type { Metadata } from "next";
import PatrocinaPanel from "./PatrocinaPanel";

export const metadata: Metadata = {
  title: "Patrocina la Quiniela del Mundial 2026 | ZonaMundial",
  description:
    "Pon tu marca ante miles de hinchas mexicanos durante el Mundial 2026. Patrocina la quiniela, el push de partido o la crónica diaria. Paquetes para todo el torneo, cobro adelantado.",
  alternates: { canonical: "/patrocina" },
};

export const dynamic = "force-dynamic";

export default function PatrocinaPage() {
  return <PatrocinaPanel />;
}
