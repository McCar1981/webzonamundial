// src/lib/ligas/football-prefs.ts
//
// Estado del "gate de fútbol": ¿el usuario ya eligió sus ligas Y su club?
// Regla de producto (Carlos, jul-2026): al entrar al lobby /app, un usuario
// LOGUEADO debe haber elegido al menos una liga Y un club; si no, se le manda
// primero a /elige-tu-futbol. Quien ya eligió entra directo.
//
// Lee las dos preferencias (fav_ligas de 2026-46 y fav_club_id de 2026-45) en
// UNA sola consulta. FAIL-OPEN por diseño: si las columnas aún no están
// migradas (Postgres 42703) o hay cualquier error transitorio, NO se bloquea el
// lobby — nunca dejamos a nadie fuera por un problema de infraestructura.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingTable, isMissingColumn } from "./predictions";

export interface GateStatus {
  /** ¿Existen las columnas (migraciones 2026-45/46 aplicadas)? */
  migrated: boolean;
  hasLigas: boolean;
  hasClub: boolean;
  /** true = hay que mandar al usuario al gate antes del lobby. */
  needsGate: boolean;
}

const OPEN: GateStatus = { migrated: false, hasLigas: false, hasClub: false, needsGate: false };

/**
 * Estado del gate para un usuario. `needsGate` es la única señal que consume el
 * layout de /app. Siempre fail-open: ante duda, dejar pasar.
 */
export async function getGateStatus(userId: string): Promise<GateStatus> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("profiles")
    .select("fav_ligas,fav_club_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Columnas sin migrar (2026-45/46): tratar como "sin gate" para no romper
    // el lobby en un entorno donde el feature aún no tiene esquema.
    if (isMissingColumn(error) || isMissingTable(error)) return OPEN;
    // Error transitorio (red/RLS): fail-open igualmente. Bloquear el lobby por
    // un fallo puntual sería peor que dejar entrar a alguien sin elegir.
    return { migrated: true, hasLigas: false, hasClub: false, needsGate: false };
  }

  const row = (data ?? {}) as { fav_ligas: unknown; fav_club_id: number | null };
  const hasLigas = Array.isArray(row.fav_ligas) && row.fav_ligas.length > 0;
  const hasClub = typeof row.fav_club_id === "number" && row.fav_club_id > 0;
  // Se exigen AMBOS: liga(s) y club. El wizard guarda los dos a la vez, así que
  // tras completarlo esta condición se cumple y el usuario entra directo.
  const needsGate = !(hasLigas && hasClub);
  return { migrated: true, hasLigas, hasClub, needsGate };
}
