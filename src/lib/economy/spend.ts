// src/lib/economy/spend.ts
//
// CATÁLOGO ÚNICO de SUMIDEROS de la economía de ZonaMundial: el espejo de earn.ts.
// Mientras earn.ts dice CUÁNTAS Fútcoins entran por cada acción, este módulo dice
// CUÁNTAS salen por cada compra/consumo, en cualquier módulo del universo.
//
// Reglas de diseño:
//  · Las Fútcoins son una sola moneda global (viven en profiles.coins). Un precio
//    aquí significa lo mismo en predicciones, trivia, fantasy o modo carrera.
//  · El XP NO se gasta: es progresión. Aquí solo se mueven Fútcoins.
//  · Todo gasto se PERSISTE por la puerta única spendCoins (wallet.ts), que cobra
//    de forma atómica y nunca deja el saldo negativo. Este módulo solo aporta los
//    NÚMEROS; no toca la base de datos.
//
// Fuentes de verdad de los precios ya existentes:
//  · Boosts de predicciones  → BOOST_CATALOG (gamification.ts)
//  · Cosméticos de prestigio → COSMETICS      (cosmetics.ts)
// Aquí NO se duplican esos números: se reexpone su precio para tener una sola
// vista de "qué compran las Fútcoins" en toda la app, y se añaden los sumideros
// transversales que no viven en ningún catálogo de módulo.

import { BOOST_CATALOG } from "@/lib/predictions/gamification";
import { COSMETICS } from "@/lib/predictions/cosmetics";

/** Módulo del universo al que pertenece un sumidero (para agrupar/analítica). */
export type SinkModule = "predicciones" | "trivia" | "fantasy" | "modo-carrera";

export interface SinkDef {
  /** Identificador estable del sumidero (único en toda la app). */
  id: string;
  /** Módulo al que pertenece. */
  module: SinkModule;
  /** Etiqueta legible (ES) para UI/analítica. */
  label: string;
  /** Precio en Fútcoins. */
  cost: number;
}

// ─── Sumideros TRANSVERSALES (no viven en un catálogo de módulo) ───────────────
// Consumibles de un solo uso que cualquier módulo puede ofrecer. Precios bajos:
// son gastos de conveniencia frecuentes, no metas de prestigio a largo plazo.
export const TRIVIA_HINT_FIFTY = 30;       // descarta dos opciones erróneas
export const TRIVIA_HINT_SKIP = 20;        // salta la pregunta sin penalizar
export const CAREER_NARRATIVE_REFILL = 50; // recarga una generación de narrativa IA

// ─── Vista UNIFICADA de todos los sumideros ────────────────────────────────────
// Une los catálogos de módulo (predicciones) con los transversales. Es solo una
// proyección de lectura: el precio de boosts/cosméticos sigue siendo el de su
// catálogo de origen.
export function allSinks(): SinkDef[] {
  const boosts: SinkDef[] = Object.values(BOOST_CATALOG).map((b) => ({
    id: b.id, module: "predicciones", label: b.name, cost: b.cost,
  }));
  const cosmetics: SinkDef[] = COSMETICS.map((c) => ({
    id: c.id, module: "predicciones", label: c.name, cost: c.cost,
  }));
  const cross: SinkDef[] = [
    { id: "trivia_hint_fifty", module: "trivia", label: "Pista 50/50", cost: TRIVIA_HINT_FIFTY },
    { id: "trivia_hint_skip", module: "trivia", label: "Saltar pregunta", cost: TRIVIA_HINT_SKIP },
    { id: "career_narrative_refill", module: "modo-carrera", label: "Recarga de narrativa IA", cost: CAREER_NARRATIVE_REFILL },
  ];
  return [...boosts, ...cosmetics, ...cross];
}

/**
 * Precio de un sumidero por id (en cualquier módulo). Devuelve null si no existe:
 * el llamador NUNCA debe cobrar un precio que no esté en el catálogo.
 */
export function sinkCost(id: string): number | null {
  const found = allSinks().find((s) => s.id === id);
  return found ? found.cost : null;
}
