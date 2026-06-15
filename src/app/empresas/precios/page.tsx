// src/app/empresas/precios/page.tsx
//
// La porra corporativa es GRATIS: ya no hay página de precios. Redirige a
// /empresas. Se conserva la ruta para no romper enlaces antiguos/indexados.

import { redirect } from "next/navigation";

export default function EmpresasPreciosRedirect() {
  redirect("/empresas");
}
