// src/lib/season-gate.ts
//
// Fecha única del "pivote post-Mundial": el lunes 20-jul-2026 a las 06:00 UTC
// (madrugada en LATAM, horas después de cualquier prórroga de la final del 19).
// TODO lo de Zona de Ligas que debe encenderse "el lunes" cuelga de aquí:
//   · la portada pública (hook usePostMundial),
//   · el gate obligatorio de ligas+club (server, app/layout.tsx),
//   · la sección personalizada "Tu fútbol" del lobby.
// Un único punto de verdad → todo se activa a la vez, sin desajustes.

export const MUNDIAL_OVER_MS = Date.parse("2026-07-20T06:00:00Z");

/** ¿Ya pasó el pivote (lunes 20-jul 06:00 UTC)? Server y cliente. */
export function isPostMundial(now = Date.now()): boolean {
  return now >= MUNDIAL_OVER_MS;
}
