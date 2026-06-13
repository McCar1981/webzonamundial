// src/lib/affiliate/geo.ts
//
// Candado geográfico del CTA de apuestas (afiliado 1xBet). El CTA SOLO puede
// mostrarse a visitantes físicamente en países LATAM donde 1xBet opera. Mostrar
// publicidad de apuestas a un usuario en ESPAÑA es ILEGAL (1xBet no tiene
// licencia DGOJ) — por eso el diseño es FAIL-CLOSED: si no sabemos el país con
// certeza, NO se muestra nada. Peor caso = no se muestra a nadie (0 ingresos),
// nunca el caso peligroso (mostrarlo en España).

import { headers } from "next/headers";

/** Enlace de afiliado 1xBet (1xPartners). Configurable por env sin redeploy. */
export const BET_AFFILIATE_URL =
  process.env.BET_AFFILIATE_URL ||
  "https://reffpa.com/L?tag=d_5711113m_97c_latam&site=5711113&ad=97";

/** Banner oficial 1xBet (iframe 300x250 de 1xPartners). Configurable por env. */
export const BET_BANNER_URL =
  process.env.BET_BANNER_URL ||
  "https://refbanners.com/I?tag=d_5711113m_70839c_&site=5711113&ad=70839";

// Países donde SÍ se muestra el CTA (ISO-3166 alpha-2 lowercase). Solo LATAM
// donde 1xBet opera. EXCLUYE España (ilegal sin licencia DGOJ) y EEUU (apuestas
// reguladas estado a estado, 1xBet no licenciado). Lista EXPLÍCITA: ningún país
// se cuela por error.
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
