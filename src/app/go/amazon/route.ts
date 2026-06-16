// src/app/go/amazon/route.ts
// Redirector de afiliado de Amazon LOCALIZADO por país (OneLink casero).
//
// Los botones de afiliado enlazan a /go/amazon?q=<búsqueda>. Aquí leemos el país
// del visitante por IP (cabecera del edge) y redirigimos a SU Amazon con NUESTRO
// tag de ese país: España -> amazon.es (-21); resto del mundo, LATAM incluido ->
// amazon.com (-20). Así cada clic cuenta en la tienda donde el usuario compra.
//
// No hay riesgo de open-redirect: el destino SIEMPRE es amazon.es/amazon.com
// (base fija); solo varía el término de búsqueda.

import { NextResponse, type NextRequest } from "next/server";
import { getVisitorCountry } from "@/lib/affiliate/geo";
import { amazonSearchUrlForCountry, amazonStoreForCountry } from "@/lib/affiliate/amazon";

// Depende del país del visitante (cabecera por petición): nunca estático.
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const country = getVisitorCountry();
  const q = req.nextUrl.searchParams.get("q")?.trim();

  // Sin término: a la home del Amazon que toque (con tag).
  if (!q) {
    const store = amazonStoreForCountry(country);
    return NextResponse.redirect(`${store.base}/?tag=${encodeURIComponent(store.tag)}`, 302);
  }

  return NextResponse.redirect(amazonSearchUrlForCountry(q, country), 302);
}
