// src/data/fantasy-market-values.ts
//
// Valores de mercado REALES (fuente: Transfermarkt, transfermarkt.es) por
// jugador y selección, en MILLONES de euros. El precio "fantasy" NO es el valor
// de mercado: el presupuesto del juego es €100M para 15 jugadores, así que el
// valor real se comprime a un coste 3.8–13.5M mediante priceFromMarketValue().
//
// Estructura: MARKET_VALUES[teamSlug][nombreNormalizado] = valorEnMillones.
// El emparejamiento se hace por nombre normalizado (minúsculas, sin acentos),
// por lo que da igual cómo esté escrito en la convocatoria.
//
// Cobertura: se va completando selección a selección desde Transfermarkt. Los
// jugadores sin dato caen al precio SIMULADO (determinista) como respaldo.

/** minúsculas, sin acentos ni signos, espacios colapsados. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// valorEnMillones de € (Transfermarkt). Ej: 0.3 = 300 mil €.
export const MARKET_VALUES: Record<string, Record<string, number>> = {
  haiti: {
    "ricardo ade": 0.3, // Transfermarkt: 300 mil € (rev. 22/12/2025)
  },
};

const _index = new Map<string, number>();
for (const [slug, players] of Object.entries(MARKET_VALUES)) {
  for (const [name, value] of Object.entries(players)) {
    _index.set(`${slug}|${normalizeName(name)}`, value);
  }
}

/** Valor de mercado real (millones €) de un jugador, o undefined si no hay dato. */
export function getMarketValue(teamSlug: string, name: string): number | undefined {
  return _index.get(`${teamSlug}|${normalizeName(name)}`);
}

/**
 * Convierte el valor de mercado real (millones €) en el precio fantasy (3.8–13.5M)
 * mediante una curva logarítmica: un crack de ~180M € roza 13.5M y un jugador de
 * ~0.3M € cae al mínimo de 3.8M, manteniendo todo dentro del presupuesto de €100M.
 */
export function priceFromMarketValue(mvMillions: number): number {
  const v = Math.max(0.01, mvMillions);
  const price = 5.0 + 3.5 * Math.log10(v);
  return Math.round(Math.max(3.8, Math.min(13.5, price)) * 10) / 10;
}
