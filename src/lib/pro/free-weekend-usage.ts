// src/lib/pro/free-weekend-usage.ts
//
// Seguimiento (cliente, localStorage) de QUÉ funciones Pro ha tocado el usuario
// durante el "Fin de semana Pro gratis". Alimenta el embudo posterior:
//   Gratis → USO → valor percibido → miedo a perderlo → precio fundador → compra.
//
// No toca el backend ni la BD: es señal puramente local para decidir qué mensaje
// contextual mostrar (hito "ya estás usando Pro", aviso del domingo, paywall del
// lunes "lo probaste gratis"). Todo fail-safe: sin storage, no rompe nada.

export type FwFeature = "predicciones" | "ia-coach" | "fantasy" | "modo-carrera" | "trivia" | "ligas";

const USED_KEY = "zm:fw-used";

/** Nombre humano de cada función (para los copys "Has probado …"). */
export const FW_FEATURE_LABEL: Record<FwFeature, string> = {
  predicciones: "Predicciones ilimitadas",
  "ia-coach": "IA Coach",
  fantasy: "Fantasy en vivo",
  "modo-carrera": "Modo Carrera",
  trivia: "Trivia sin límites",
  ligas: "Ligas privadas",
};

/**
 * Mapa ruta → función Pro. "ligas" se comprueba primero porque sus rutas
 * cuelgan de /predicciones o /fantasy.
 */
export function featureForPath(path: string | null | undefined): FwFeature | null {
  if (!path) return null;
  if (path.includes("ligas")) return "ligas";
  if (path.includes("/predicciones")) return "predicciones";
  if (path.includes("/ia-coach")) return "ia-coach";
  if (path.includes("/fantasy")) return "fantasy";
  if (path.includes("/modo-carrera")) return "modo-carrera";
  if (path.includes("/trivia")) return "trivia";
  return null;
}

/** Lista de funciones Pro ya usadas este finde (sin duplicados). */
export function getFeaturesUsed(): FwFeature[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(USED_KEY) || "[]");
    return Array.isArray(raw) ? (raw.filter((x) => typeof x === "string") as FwFeature[]) : [];
  } catch {
    return [];
  }
}

/** Registra el uso de una función y devuelve el total de funciones distintas. */
export function recordFeatureUse(feature: FwFeature): number {
  if (typeof window === "undefined") return 0;
  const cur = getFeaturesUsed();
  if (!cur.includes(feature)) {
    cur.push(feature);
    try {
      window.localStorage.setItem(USED_KEY, JSON.stringify(cur));
    } catch {
      /* sin storage: no pasa nada, el conteo de esta sesión sigue en memoria del caller */
    }
  }
  return cur.length;
}

/** ¿Ha probado al menos una función Pro este finde? */
export function hasUsedAnyPro(): boolean {
  return getFeaturesUsed().length > 0;
}
