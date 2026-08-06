// src/lib/higher-lower/cards.ts
// Generación de rondas, barajado y resolución del juego Higher or Lower.

import type { HLCard, HLGuess, HLMetric, HLMode, HLRound } from "./types";
import { getPlayerItems, getSeleccionItems, type HLPlayerSource, type HLSeleccionSource } from "./data";

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const METRICS: HLMetric[] = [
  {
    key: "rankingFIFA",
    labelEs: "Ranking FIFA",
    labelEn: "FIFA Ranking",
    inverse: true,
    format: (v) => `#${v}`,
    extractSeleccion: (s: HLSeleccionSource) => s.rankingFIFA,
  },
  {
    key: "mundiales",
    labelEs: "Mundiales jugados",
    labelEn: "World Cups played",
    inverse: false,
    format: (v) => `${v}`,
    extractSeleccion: (s: HLSeleccionSource) => s.mundiales,
  },
  {
    key: "gfMundial",
    labelEs: "Goles en Mundiales",
    labelEn: "World Cup goals",
    inverse: false,
    format: (v) => `${v}`,
    extractSeleccion: (s: HLSeleccionSource) => s.gfMundial,
  },
  {
    key: "jugadoresClave",
    labelEs: "Jugadores clave",
    labelEn: "Key players",
    inverse: false,
    format: (v) => `${v}`,
    extractSeleccion: (s: HLSeleccionSource) => s.jugadoresClaveCount,
  },
  {
    key: "marketValue",
    labelEs: "Valor de mercado",
    labelEn: "Market value",
    inverse: false,
    format: (v) => `€${v}M`,
    extractPlayer: (p: HLPlayerSource) => p.marketValue,
  },
  {
    key: "form",
    labelEs: "Forma",
    labelEn: "Form",
    inverse: false,
    format: (v) => `${v}/10`,
    extractPlayer: (p: HLPlayerSource) => p.form,
  },
  {
    key: "price",
    labelEs: "Precio Fantasy",
    labelEn: "Fantasy price",
    inverse: false,
    format: (v) => `€${v}M`,
    extractPlayer: (p: HLPlayerSource) => p.price,
  },
];

function metricsForMode(mode: HLMode): HLMetric[] {
  return METRICS.filter((m) => (mode === "selecciones" ? m.extractSeleccion : m.extractPlayer));
}

function buildValidCards(mode: HLMode, metric: HLMetric): HLCard[] {
  if (mode === "selecciones") {
    return getSeleccionItems()
      .map((s) => {
        const value = metric.extractSeleccion!(s);
        if (value === undefined) return null;
        return {
          id: s.slug,
          name: s.nombre,
          subtitle: s.confederacion,
          image: s.flagCode,
          value,
          displayValue: metric.format(value),
          metricKey: metric.key,
        };
      })
      .filter(Boolean) as HLCard[];
  }

  return getPlayerItems()
    .map((p) => {
      const value = metric.extractPlayer!(p);
      if (value === undefined) return null;
      return {
        id: p.id,
        name: p.name,
        subtitle: p.club,
        image: p.flag,
        value,
        displayValue: metric.format(value),
        metricKey: metric.key,
      };
    })
    .filter(Boolean) as HLCard[];
}

/** Genera una lista de rondas aleatorias para un modo. */
export function generateRounds(mode: HLMode, count = 10): HLRound[] {
  const metrics = metricsForMode(mode);
  const rng = mulberry32(Date.now());
  const rounds: HLRound[] = [];
  let attempts = 0;

  while (rounds.length < count && attempts < count * 20) {
    attempts++;
    const metric = metrics[Math.floor(rng() * metrics.length)];
    const cards = buildValidCards(mode, metric);
    if (cards.length < 2) continue;

    const shuffled = shuffle(cards, rng);
    const left = shuffled[0];
    const right = shuffled[1];
    if (left.value === right.value) continue;

    rounds.push({ left, right, metric });
  }

  return rounds;
}

/** Resuelve si una respuesta es correcta. */
export function isCorrect(guess: HLGuess, left: HLCard, right: HLCard, metric: HLMetric): boolean {
  if (right.value === left.value) return true;
  if (metric.inverse) {
    return guess === "higher" ? right.value < left.value : right.value > left.value;
  }
  return guess === "higher" ? right.value > left.value : right.value < left.value;
}

/** Etiqueta localizada de una métrica. */
export function metricLabel(metric: HLMetric, locale: "es" | "en"): string {
  return locale === "en" ? metric.labelEn : metric.labelEs;
}

/** Texto de los botones según métrica normal/inversa. */
export function guessLabels(metric: HLMetric, locale: "es" | "en"): { higher: string; lower: string } {
  if (metric.inverse) {
    return locale === "en" ? { higher: "Better", lower: "Worse" } : { higher: "Mejor", lower: "Peor" };
  }
  return locale === "en" ? { higher: "Higher", lower: "Lower" } : { higher: "Mayor", lower: "Menor" };
}
