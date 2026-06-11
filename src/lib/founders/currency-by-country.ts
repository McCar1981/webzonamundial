// src/lib/founders/currency-by-country.ts
//
// Mapeo país → moneda para el Founders Pass.
//
// Regla de negocio (acordada con producto, mayo 2026):
//   - Países de América Latina + USA → 6 USD
//   - Resto del mundo (Europa, Asia, África, Oceanía) → 8 EUR
//
// El precio en USD es ~30% más bajo para reflejar el poder adquisitivo
// de LATAM y evitar que el ticket sea un freno al growth en mercados
// donde 8 € ≈ 8.50 USD (caro).
//
// Para evitar arbitraje (alguien de España elige "6 USD"), el frontend
// muestra SOLO la moneda asignada al país del usuario y el backend
// rechaza pagos con moneda incorrecta.
//
// Si un usuario no tiene country (no completó el wizard de país aún),
// caemos en EUR por defecto (Europa es nuestro mercado prioritario).

import type { FoundersCurrency } from "@/lib/stripe/client";
import type { ProRegion } from "@/lib/stripe/pricing";

// Países que reciben precio en USD (ISO-3166 alpha-2, lowercase).
// América Latina + USA. Incluye territorios de habla hispana y portuguesa.
const USD_COUNTRIES: ReadonlySet<string> = new Set([
  // Norte y centro
  "us", // Estados Unidos
  "mx", // México
  "gt", // Guatemala
  "hn", // Honduras
  "sv", // El Salvador
  "ni", // Nicaragua
  "cr", // Costa Rica
  "pa", // Panamá
  "cu", // Cuba
  "do", // República Dominicana
  "pr", // Puerto Rico
  "ht", // Haití
  "jm", // Jamaica
  "tt", // Trinidad y Tobago
  // Sudamérica
  "ar", // Argentina
  "bo", // Bolivia
  "br", // Brasil
  "cl", // Chile
  "co", // Colombia
  "ec", // Ecuador
  "gy", // Guyana
  "py", // Paraguay
  "pe", // Perú
  "sr", // Surinam
  "uy", // Uruguay
  "ve", // Venezuela
]);

/**
 * Devuelve la moneda asignada al país del usuario.
 *
 * @param country  Código ISO-3166 alpha-2 lowercase ("es", "mx", "us"…)
 *                 o null/undefined si el usuario no la ha guardado.
 * @returns "usd" si está en la lista de LATAM+USA, "eur" en caso contrario.
 */
export function currencyForCountry(
  country: string | null | undefined,
): FoundersCurrency {
  if (!country) return "eur";
  const normalized = country.trim().toLowerCase();
  return USD_COUNTRIES.has(normalized) ? "usd" : "eur";
}

/**
 * Devuelve la región humana (para mostrar en UI).
 */
export function regionForCurrency(currency: FoundersCurrency): string {
  return currency === "usd"
    ? "LATAM y USA"
    : "Europa y resto del mundo";
}

/**
 * Región de PRECIO del plan Pro (3 tiers): EEUU se separa de LATAM aunque
 * ambos paguen en USD, porque el pase mensual difiere (10 USD vs 6 USD). El
 * Founders Pass sigue usando currencyForCountry (solo 2 monedas).
 *
 * @returns "us" (Estados Unidos), "latam" (resto de América Latina) o "eu"
 *          (Europa y resto del mundo; también el fallback sin país).
 */
export function proRegionForCountry(country: string | null | undefined): ProRegion {
  if (!country) return "eu";
  const normalized = country.trim().toLowerCase();
  if (normalized === "us") return "us";
  return USD_COUNTRIES.has(normalized) ? "latam" : "eu";
}
