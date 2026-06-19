// src/lib/affiliate/geo.ts
//
// Candado geográfico del CTA de apuestas (afiliado Betcris, casa con licencia en
// LATAM). El CTA SOLO puede mostrarse a visitantes físicamente en los países
// LATAM donde Betcris opera. ESPAÑA queda EXCLUIDA (Betcris no opera en España;
// el mercado español se monetizará aparte con 1xBet.es —operador con licencia
// DGOJ— en su propia integración con verificación de edad). Diseño FAIL-CLOSED:
// si no sabemos el país con certeza, NO se muestra nada. Peor caso = no se
// muestra a nadie (0 ingresos), nunca el caso peligroso (mostrarlo donde no toca).

import { headers } from "next/headers";

/** Enlace de afiliado Betcris (landing de seguimiento). Configurable por env sin redeploy. */
export const BET_AFFILIATE_URL =
  process.env.BET_AFFILIATE_URL ||
  "https://record.betcrisaffiliates.com/_ppVnDtkWM0-8JV5VcMXjlGNd7ZgqdRLk/1/";

/**
 * Banner Betcris = IMAGEN + ENLACE (no iframe). La imagen la sirve
 * media.betcrisaffiliates.com (la CSP ya la permite vía `img-src https:`), y el
 * clic va al enlace con tracking por creatividad. Ambos configurables por env
 * sin redeploy. Creatividad actual: 300x250 (rectángulo estándar, encaja en el
 * hueco del CTA sin escalar). Es la variante "Dominican Republic Spanish";
 * funciona y atribuye igual para toda LATAM (mismo ID de afiliado ppVnDtkWM0).
 */
export const BET_BANNER_IMAGE_URL =
  process.env.BET_BANNER_IMAGE_URL ||
  "https://media.betcrisaffiliates.com/uploads/001xGE-GRA-10566_DO-300x250-px.gif";

export const BET_BANNER_CLICK_URL =
  process.env.BET_BANNER_CLICK_URL ||
  "https://record.betcrisaffiliates.com/_ppVnDtkWM08CurWVigjhV1CK4uRYiXBx/1/";

// Países donde SÍ se muestra el CTA (ISO-3166 alpha-2 lowercase). Solo LATAM
// donde Betcris opera. EXCLUYE España (Betcris no opera allí; el mercado español
// irá aparte con 1xBet.es) y EEUU. Lista EXPLÍCITA: ningún país se cuela por
// error. PENDIENTE: confirmar contra los mercados con licencia de Betcris
// (Soporte del panel) y recortar si procede.
const BETTING_ALLOWED_COUNTRIES: ReadonlySet<string> = new Set([
  "mx", // México
  "ar", // Argentina
  "co", // Colombia
  "pe", // Perú
  "cl", // Chile
  "ec", // Ecuador
  "bo", // Bolivia
  "py", // Paraguay
  "uy", // Uruguay
  "ve", // Venezuela
  "gt", // Guatemala
  "hn", // Honduras
  "sv", // El Salvador
  "ni", // Nicaragua
  "cr", // Costa Rica
  "pa", // Panamá
  "do", // República Dominicana
]);

/**
 * País del visitante por IP, leído de las cabeceras del edge (Vercel y/o
 * Cloudflare). Devuelve el ISO-3166 alpha-2 lowercase, o null si no se conoce.
 */
export function getVisitorCountry(): string | null {
  const h = headers();
  const raw =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country") ||
    "";
  const c = raw.trim().toLowerCase();
  // Solo ISO-3166 alpha-2 válido. "xx"/"t1" (Tor/desconocido) → null.
  if (!/^[a-z]{2}$/.test(c) || c === "xx" || c === "t1") return null;
  return c;
}

/** ¿Se puede mostrar publicidad de apuestas a este país? FAIL-CLOSED. */
export function isBettingAllowedCountry(country: string | null): boolean {
  if (!country) return false;
  return BETTING_ALLOWED_COUNTRIES.has(country);
}

/** Atajo: ¿el visitante actual puede ver el CTA de apuestas? */
export function visitorCanSeeBetting(): boolean {
  return isBettingAllowedCountry(getVisitorCountry());
}
