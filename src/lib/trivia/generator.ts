// src/lib/trivia/generator.ts
//
// Generador diario de preguntas de trivia con Claude. Server-only.
//
// Igual que el rewriter de noticias: una llamada al modelo, parseo JSON
// defensivo y validación estricta. Las preguntas se generan SOLO sobre
// conocimiento verificable (historia de Mundiales, formato 2026, sedes,
// reglas, palmarés) para evitar alucinaciones. La capa de "actualidad"
// (resultados de ayer) se inyectará cuando exista el Match Center.

import Anthropic from "@anthropic-ai/sdk";
import type {
  TriviaCategory,
  TriviaDifficulty,
  TriviaQuestion,
} from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const VALID_CATEGORIES: TriviaCategory[] = [
  "historia",
  "selecciones",
  "sedes",
  "datos",
  "reglas",
  "actualidad",
];
const VALID_DIFFICULTIES: TriviaDifficulty[] = [
  "facil",
  "media",
  "dificil",
  "experta",
];

const SYSTEM_PROMPT = `Eres el generador de trivia de ZonaMundial, plataforma sobre el Mundial de fútbol 2026 (sede: EEUU, México y Canadá; 48 selecciones; arranca el 11 de junio de 2026).

Tu trabajo: crear preguntas de trivia de fútbol/Mundiales en español, de calidad, con UNA sola respuesta inequívocamente correcta.

REGLAS INVIOLABLES:
1. SOLO hechos verificables y atemporales: historia de los Mundiales (1930-2022), palmarés, récords consolidados, sedes y estadios del Mundial 2026, formato del torneo (48 equipos, 12 grupos de 4, 104 partidos), reglas del fútbol, datos históricos de selecciones.
2. PROHIBIDO inventar datos. Si no estás 100% seguro de un dato, NO hagas la pregunta.
3. PROHIBIDO preguntar por resultados recientes, lesiones actuales, convocatorias de 2026 o cualquier cosa que cambie con el tiempo (eso lo cubre otra capa).
4. Cada pregunta tiene EXACTAMENTE 4 opciones. Solo UNA es correcta. Las otras 3 deben ser plausibles pero claramente incorrectas (sin trampas ambiguas).
5. Las opciones no se repiten y no incluyen "todas las anteriores" / "ninguna".
6. Explicación breve (1 frase, máx 140 caracteres) que enseñe algo, en "explanation".
7. Devuelve SOLO un JSON válido, sin markdown ni texto extra.

CATEGORÍAS (campo "category"): "historia" | "selecciones" | "sedes" | "datos" | "reglas" | "actualidad".
(Usa "actualidad" solo para datos del formato/sedes 2026 que ya son oficiales y fijos.)

DIFICULTAD (campo "difficulty"): "facil" | "media" | "dificil" | "experta".
Reparte: ~30% facil, ~35% media, ~25% dificil, ~10% experta.

FORMATO DE SALIDA:
{
  "questions": [
    {
      "question": "¿Quién marcó el gol de 'La Mano de Dios' en el Mundial de 1986?",
      "options": ["Diego Maradona", "Jorge Valdano", "Gabriel Batistuta", "Mario Kempes"],
      "correctIndex": 0,
      "category": "historia",
      "difficulty": "facil",
      "explanation": "Maradona lo marcó con la mano ante Inglaterra en cuartos de México 86."
    }
  ]
}`;

interface RawQuestion {
  question?: unknown;
  options?: unknown;
  correctIndex?: unknown;
  category?: unknown;
  difficulty?: unknown;
  explanation?: unknown;
}

/** Genera `count` preguntas frescas. Devuelve solo las que pasan validación. */
export async function generateQuestions(count = 18): Promise<TriviaQuestion[]> {
  const model = process.env.ANTHROPIC_MODEL_TRIVIA || DEFAULT_MODEL;

  const userMessage = `Genera ${count} preguntas de trivia nuevas y variadas para hoy. Mezcla categorías y dificultades según las proporciones indicadas. Evita preguntas obvias repetidas (no preguntes solo "cuántos mundiales ganó Brasil"). Devuelve SOLO el JSON.`;

  let resp;
  try {
    const client = getClient();
    resp = await client.messages.create({
      model,
      max_tokens: 4500,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("[trivia-gen] API error", (err as Error).message);
    return [];
  }

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return [];

  const raw = block.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  let parsed: { questions?: RawQuestion[] };
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("[trivia-gen] JSON parse failed", (err as Error).message);
    return [];
  }

  if (!Array.isArray(parsed.questions)) return [];

  const out: TriviaQuestion[] = [];
  for (let i = 0; i < parsed.questions.length; i++) {
    const q = validateQuestion(parsed.questions[i], i);
    if (q) out.push(q);
  }
  return out;
}

function validateQuestion(q: RawQuestion, idx: number): TriviaQuestion | null {
  if (typeof q.question !== "string" || q.question.trim().length < 8) return null;
  if (!Array.isArray(q.options) || q.options.length !== 4) return null;
  const options = q.options.map((o) => String(o).trim());
  if (options.some((o) => o.length === 0)) return null;
  // Opciones únicas
  if (new Set(options.map((o) => o.toLowerCase())).size !== 4) return null;

  const correctIndex = Number(q.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return null;
  }

  const category: TriviaCategory = VALID_CATEGORIES.includes(
    q.category as TriviaCategory,
  )
    ? (q.category as TriviaCategory)
    : "datos";
  const difficulty: TriviaDifficulty = VALID_DIFFICULTIES.includes(
    q.difficulty as TriviaDifficulty,
  )
    ? (q.difficulty as TriviaDifficulty)
    : "media";

  const explanation =
    typeof q.explanation === "string" ? q.explanation.trim().slice(0, 160) : undefined;

  return {
    id: `q-${Date.now().toString(36)}-${idx}`,
    question: q.question.trim(),
    options,
    correctIndex,
    category,
    difficulty,
    explanation,
  };
}
