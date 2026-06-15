// src/app/bares/precios/page.tsx
//
// La porra de bares es GRATIS: ya no hay página de precios. Redirige a /bares.
// Se conserva la ruta para no romper enlaces antiguos/indexados.

import { redirect } from "next/navigation";

export default function BaresPreciosRedirect() {
  redirect("/bares");
}
