/**
 * Lista de países para el selector de perfil. Foco España + LATAM
 * (audiencia principal de ZonaMundial), después grandes hispanos en US/EU.
 *
 * `code` = ISO-3166 alpha-2 (lowercase). Sirve para mostrar bandera con
 * flag-icons o flagcdn.com.
 */

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  // Latinoamérica
  { code: "ar", name: "Argentina" },
  { code: "bo", name: "Bolivia" },
  { code: "br", name: "Brasil" },
  { code: "cl", name: "Chile" },
  { code: "co", name: "Colombia" },
  { code: "cr", name: "Costa Rica" },
  { code: "cu", name: "Cuba" },
  { code: "do", name: "República Dominicana" },
  { code: "ec", name: "Ecuador" },
  { code: "sv", name: "El Salvador" },
  { code: "gt", name: "Guatemala" },
  { code: "hn", name: "Honduras" },
  { code: "mx", name: "México" },
  { code: "ni", name: "Nicaragua" },
  { code: "pa", name: "Panamá" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Perú" },
  { code: "pr", name: "Puerto Rico" },
  { code: "uy", name: "Uruguay" },
  { code: "ve", name: "Venezuela" },
  // Europa
  { code: "es", name: "España" },
  { code: "ad", name: "Andorra" },
  { code: "pt", name: "Portugal" },
  { code: "fr", name: "Francia" },
  { code: "de", name: "Alemania" },
  { code: "it", name: "Italia" },
  { code: "gb", name: "Reino Unido" },
  // Norteamérica
  { code: "us", name: "Estados Unidos" },
  { code: "ca", name: "Canadá" },
  // Otros con audiencia hispana significativa
  { code: "ma", name: "Marruecos" },
  { code: "ph", name: "Filipinas" },
];

export function getCountryName(code: string | null | undefined): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase();
}
