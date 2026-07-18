/**
 * Helpers de validación server-side para datos de perfil y onboarding.
 *
 * Se usan desde server actions para garantizar que el cliente
 * manipulado no pueda escribir valores arbitrarios o fechas inválidas.
 */

import { COUNTRIES } from "./countries";
import { getSeleccionBySlug } from "@/data/selecciones";

/** Valida formato de username: 3-30 chars, a-z, 0-9, underscore. */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

/**
 * Valida que la fecha sea ISO real (YYYY-MM-DD) y no futura.
 * Rechaza fechas imposibles como 2026-13-40.
 */
export function isValidIsoDate(input: string | null | undefined): boolean {
  if (!input) return true; // vacío = no birth_date (opcional)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;

  const [yStr, mStr, dStr] = input.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  // Verificar que no es futura
  if (date > new Date()) return false;
  // Verificar que los componentes coinciden (rechaza 2023-02-30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  return true;
}

/** Calcula edad en años dada una fecha de nacimiento ISO. */
export function calculateAge(birthDateIso: string): number {
  const [y, m, d] = birthDateIso.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Verifica mayoría de edad (default 18 años). */
export function isAdult(birthDateIso: string, minAge = 18): boolean {
  return calculateAge(birthDateIso) >= minAge;
}

/**
 * Valida country contra el catálogo de países soportados.
 * Devuelve el código limpio o null si no es válido.
 */
export function validateCountry(input: string | null): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  const found = COUNTRIES.find((c) => c.code === clean);
  return found ? clean : null;
}

/**
 * Valida fav_team contra el catálogo de selecciones.
 * Devuelve el slug limpio o null si no es válido.
 */
export function validateFavTeam(input: string | null): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  const found = getSeleccionBySlug(clean);
  return found ? clean : null;
}

