// src/lib/trivia/play.ts
//
// Helpers de partida compartidos por los endpoints de trivia.

import type { DailyTriviaSet, TriviaMode, TriviaQuestion } from "./types";

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

/** Selecciona las preguntas de la partida según el modo. */
export function pickQuestions(set: DailyTriviaSet, mode: TriviaMode): TriviaQuestion[] {
  const pool = set.questions;
  if (mode === "relampago") {
    return repeatToLength(shuffle(pool), 10);
  }
  if (mode === "muerte-subita") {
    // Dificultad creciente: el juego se vuelve más difícil cuanto más aguantas.
    const ordered = [...pool].sort(
      (a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1),
    );
    return repeatToLength(ordered, 40);
  }
  // diaria: hasta 10 preguntas barajadas
  return shuffle(pool).slice(0, Math.min(10, pool.length));
}

export function newSessionId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
