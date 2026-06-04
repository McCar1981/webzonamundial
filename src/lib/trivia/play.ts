// src/lib/trivia/play.ts
//
// Helpers de partida compartidos por los endpoints de trivia.

import type { TriviaMode, TriviaQuestion } from "./types";

/** Pregunta tal como la ve el cliente: SIN la respuesta correcta. */
export interface ClientQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: string;
}

export function toClientQuestion(q: TriviaQuestion): ClientQuestion {
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    category: q.category,
    difficulty: q.difficulty,
  };
}

const DIFF_ORDER: Record<string, number> = {
  facil: 0,
  media: 1,
  dificil: 2,
  experta: 3,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Baraja las OPCIONES de una pregunta y reubica correctIndex.
 *
 * El modelo (y el banco de fallback) tienden a poner la respuesta correcta
 * en la primera posición, así que sin esto todas las respuestas serían "A".
 * Aleatorizamos la posición de la correcta en cada partida.
 */
function shuffleOptions(q: TriviaQuestion): TriviaQuestion {
  const correct = q.options[q.correctIndex];
  const options = shuffle(q.options);
  const correctIndex = options.indexOf(correct);
  return { ...q, options, correctIndex };
}

/** Repite el pool hasta alcanzar `n` preguntas, re-asignando ids únicos. */
function repeatToLength(pool: TriviaQuestion[], n: number): TriviaQuestion[] {
  const out: TriviaQuestion[] = [];
  let i = 0;
  while (out.length < n && pool.length > 0) {
    const base = pool[i % pool.length];
    out.push(out.length < pool.length ? base : { ...base, id: `${base.id}-r${out.length}` });
    i++;
  }
  return out;
}

/** Selecciona las preguntas de la partida según el modo, a partir de un pool. */
export function pickQuestions(pool: TriviaQuestion[], mode: TriviaMode): TriviaQuestion[] {
  let picked: TriviaQuestion[];
  if (mode === "relampago") {
    picked = repeatToLength(shuffle(pool), 10);
  } else if (mode === "muerte-subita") {
    // Dificultad creciente: el juego se vuelve más difícil cuanto más aguantas.
    const ordered = [...pool].sort(
      (a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1),
    );
    picked = repeatToLength(ordered, 40);
  } else {
    // diaria: hasta 10 preguntas barajadas
    picked = shuffle(pool).slice(0, Math.min(10, pool.length));
  }
  // Aleatoriza la posición de la respuesta correcta en cada pregunta.
  return picked.map(shuffleOptions);
}

export function newSessionId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
