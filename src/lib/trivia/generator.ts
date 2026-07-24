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

// Modelo por defecto: Sonnet 4.6 (mucho más fiable en hechos que Haiku, que
// alucinaba datos: finales inexistentes, sedes erróneas, etc.). Se puede subir
// a Opus con ANTHROPIC_MODEL_TRIVIA=claude-opus-4-6 si se quiere máxima precisión.
const DEFAULT_MODEL = "claude-sonnet-4-6";

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
  "ligas",
  "clubes",
];
const VALID_DIFFICULTIES: TriviaDifficulty[] = [
  "facil",
  "media",
  "dificil",
  "experta",
];

const SYSTEM_PROMPT = `Eres el generador de trivia de ZonaMundial, plataforma de fútbol (Zona de Ligas): fútbol de clubes de las grandes ligas todo el año + historia de los Mundiales.

Tu trabajo: crear preguntas de trivia de fútbol en español, de calidad, con UNA sola respuesta inequívocamente correcta.

ÁMBITO (equilibra entre estos temas atemporales y verificables):
- LIGAS DE CLUBES: LaLiga (España), Liga MX (México), LigaPro (Ecuador), CONMEBOL Libertadores y Sudamericana, Liga FUTVE (Venezuela), Primera A (Colombia), Liga Argentina, Brasileirão, Premier League, Serie A, Bundesliga, Ligue 1, Champions League. Campeones históricos, clubes récord, máximos goleadores históricos, estadios míticos, apodos y escudos.
- CLUBES: palmarés, leyendas e ídolos históricos, fundaciones, clásicos y rivalidades.
- MUNDIALES: historia (1930-2022), palmarés, récords consolidados.
- REGLAS del fútbol y datos históricos de selecciones.

REGLAS INVIOLABLES:
1. SOLO hechos verificables y ATEMPORALES (consolidados por la historia). PROHIBIDO todo lo que cambie con el tiempo: resultados recientes, tabla actual, plantilla o fichajes de esta temporada, lesiones, quién juega hoy. Eso lo cubre otra capa (noticias). Un dato válido sigue siendo cierto dentro de 5 años.
2. PROHIBIDO inventar datos. Si tienes la MÁS MÍNIMA duda sobre un dato, NO hagas esa pregunta. Verifica mentalmente cada hecho antes de escribirlo. Más vale generar menos preguntas que una sola incorrecta.
3. Sé especialmente CAUTO con récords de clubes que podrían haber cambiado (máximo goleador, más títulos): usa solo los consolidados e indiscutibles, o formula la pregunta sobre una fecha/época cerrada.
4. Cada pregunta tiene EXACTAMENTE 4 opciones. Solo UNA es correcta. Las otras 3 deben ser plausibles pero claramente incorrectas (sin trampas ambiguas).
5. PROHIBIDO opciones tipo "Ninguna", "Todas las anteriores", "Aún no está confirmado", "No se sabe" o similares. Las 4 opciones deben ser respuestas concretas y distintas. El dato correcto SIEMPRE existe y es conocido (si no lo sabes con certeza, descarta la pregunta).
6. La pregunta NO puede partir de una premisa falsa. Si la premisa no es cierta, NO hagas la pregunta.
7. La "explanation" DEBE afirmar y respaldar exactamente la opción correcta (cítala literalmente) y ser coherente con ella. PROHIBIDO que la explicación contenga dudas, correcciones, la palabra "error", "no estoy seguro", "creo que", "posiblemente", ni un dato distinto al de la opción correcta.
8. Explicación breve (1 frase, máx 140 caracteres) que enseñe algo, en "explanation".
9. Devuelve SOLO un JSON válido, sin markdown ni texto extra.

DATOS DE REFERENCIA (úsalos exactos, son correctos):
- Brasil es la ÚNICA selección que ha disputado todos los Mundiales (1930-2022).
- Real Madrid es el máximo ganador de la Copa de Europa/Champions League (récord histórico consolidado).
- Independiente (Argentina) es el club con más Copas Libertadores (7), récord histórico.
- América es el club más laureado de la Liga MX por títulos de liga.
- Barcelona SC (Guayaquil) es el club con más títulos de la LigaPro/Serie A de Ecuador.

CATEGORÍAS (campo "category"): "ligas" (competiciones de clubes) | "clubes" (equipos, leyendas) | "historia" (Mundiales) | "selecciones" | "reglas" | "datos" | "sedes".
Prioriza "ligas" y "clubes": la plataforma es de fútbol de clubes.

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

/**
 * Genera `count` preguntas frescas. Devuelve solo las que pasan validación.
 * `avoid` es una lista de enunciados ya usados recientemente: el modelo no debe
 * repetirlos y, por si acaso, se filtran a posteriori (anti-repetición).
 */
export async function generateQuestions(
  count = 18,
  avoid: string[] = [],
  /** Si se pasa, TODAS las preguntas se centran en esa liga/copa y se etiquetan
   *  con su slug (para sesgar la trivia a la liga del usuario). Sin esto, fútbol
   *  general (Mundiales, leyendas, reglas) y sin etiqueta de liga. */
  leagueContext?: { slug: string; name: string } | null,
): Promise<TriviaQuestion[]> {
  const model = process.env.ANTHROPIC_MODEL_TRIVIA || DEFAULT_MODEL;

  const avoidBlock =
    avoid.length > 0
      ? `\n\nPREGUNTAS YA USADAS RECIENTEMENTE (NO las repitas ni hagas variantes mínimas de estas):\n${avoid
          .slice(0, 120)
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "";

  const focusBlock = leagueContext
    ? `\n\nTEMA DE HOY: TODAS las preguntas deben tratar sobre ${leagueContext.name} (sus clubes, campeones históricos, leyendas, récords consolidados, estadios y clásicos). Nada de otras ligas. Usa category "ligas" o "clubes".`
    : "";

  const userMessage = `Genera ${count} preguntas de trivia nuevas y variadas para hoy. Mezcla categorías y dificultades según las proporciones indicadas. Cada pregunta debe ser distinta de las demás (sin enunciados repetidos). Verifica cada dato antes de incluirlo.${focusBlock}${avoidBlock}\n\nDevuelve SOLO el JSON.`;

  const avoidSet = new Set(avoid.map(normalizeText));

  let resp;
  try {
    const client = getClient();
    resp = await client.messages.create({
      model,
      // 8000 (no 4500): con count 30-40 y explicaciones, 4500 truncaba el JSON a
      // medias → parse fail → 0 preguntas ese día en silencio.
      max_tokens: 8000,
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

  const candidates: TriviaQuestion[] = [];
  const seen = new Set<string>(); // anti-repetición dentro del set
  for (let i = 0; i < parsed.questions.length; i++) {
    const q = validateQuestion(parsed.questions[i]);
    if (!q) continue;
    const key = normalizeText(q.question);
    if (seen.has(key) || avoidSet.has(key)) continue; // ya usada hoy o en días previos
    seen.add(key);
    candidates.push(q);
  }

  // ── Verificador de doble pase ──────────────────────────────────────────
  // Cada candidata pasa por una SEGUNDA llamada a la IA, independiente, que
  // responde la pregunta "a ciegas" (sin saber cuál marcamos como correcta) y
  // detecta premisas falsas o ambigüedades. Solo sobreviven las preguntas en
  // las que el verificador coincide con seguridad. Atrapa errores factuales
  // que ninguna regex puede ver (p.ej. "árbitro brasileño Jack Taylor" → inglés).
  const verdicts = await Promise.all(candidates.map((q) => verifyQuestion(q, model)));
  const survivors = candidates.filter((_, i) => verdicts[i]);
  // Etiqueta con la liga si la tanda tenía foco → el /start puede sesgar por liga.
  return leagueContext ? survivors.map((q) => ({ ...q, league: leagueContext.slug })) : survivors;
}

/** Normaliza un enunciado para comparar repeticiones (sin tildes/símbolos/espacios). */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** ID estable derivado del enunciado (misma pregunta → mismo id siempre).
 *  Permite deduplicar en el banco y rastrear "ya visto" por usuario. */
export function stableQuestionId(question: string): string {
  const norm = normalizeText(question);
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
  return "q" + (h >>> 0).toString(36);
}

const VERIFY_SYSTEM = `Eres un verificador EXPERTO e IMPLACABLE de trivia de fútbol y Mundiales. Recibes una pregunta con 4 opciones (NO sabes cuál marcó el autor como correcta). Tu trabajo es responderla con tu propio conocimiento y auditar su calidad.

Devuelve SOLO un JSON, sin markdown:
{
  "answerIndex": <0-3, la opción que TÚ sabes que es correcta>,
  "confidence": "alta" | "media" | "baja",
  "falsePremise": <true si la pregunta da por cierto algo falso, p.ej. "el árbitro brasileño X" cuando X no es brasileño, o "la final en México" cuando no lo es>,
  "ambiguous": <true si hay más de una opción defendible o la pregunta es confusa>,
  "factError": <true si NINGUNA de las 4 opciones es realmente correcta>
}

Sé estricto: ante la mínima duda factual marca confidence "baja". No inventes.`;

interface Verdict {
  answerIndex?: unknown;
  confidence?: unknown;
  falsePremise?: unknown;
  ambiguous?: unknown;
  factError?: unknown;
}

/** Segundo pase: la IA responde a ciegas y solo aceptamos si coincide con
 *  seguridad y no detecta premisa falsa / ambigüedad / error factual. */
async function verifyQuestion(q: TriviaQuestion, model: string): Promise<boolean> {
  const payload = {
    question: q.question,
    options: q.options, // sin revelar correctIndex
  };
  let resp;
  try {
    const client = getClient();
    resp = await client.messages.create({
      model,
      max_tokens: 200,
      temperature: 0, // máxima determinación: queremos su mejor conocimiento
      system: VERIFY_SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
  } catch {
    // Si el verificador no está disponible, NO aceptamos (preferimos menos
    // preguntas que una incorrecta). El banco/fallback cubre el hueco.
    return false;
  }

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return false;
  const raw = block.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  let v: Verdict;
  try {
    v = JSON.parse(raw);
  } catch {
    return false;
  }

  const answerIndex = Number(v.answerIndex);
  if (!Number.isInteger(answerIndex)) return false;
  if (v.falsePremise === true || v.ambiguous === true || v.factError === true) return false;
  if (String(v.confidence).toLowerCase() !== "alta") return false;
  // El verificador, a ciegas, debe llegar a la MISMA respuesta que el autor.
  return answerIndex === q.correctIndex;
}

// Opciones "comodín" prohibidas: el dato correcto siempre debe ser concreto.
const BANNED_OPTION = /^(ninguna|todas|todas las anteriores|ninguna de las anteriores|aun no|aún no|no se sabe|no se|no esta confirmado|no está confirmado|cualquiera|otro|otra)\b/i;
// Señales de que la explicación es dudosa o se autocorrige → pregunta basura.
const BAD_EXPLANATION = /\berror\b|no estoy seguro|no estoy segura|creo que|posiblemente|tal vez|quiza|quizá|deberia|debería ser|en realidad la|corrijo|me equivoco/i;

function validateQuestion(q: RawQuestion): TriviaQuestion | null {
  if (typeof q.question !== "string" || q.question.trim().length < 8) return null;
  if (!Array.isArray(q.options) || q.options.length !== 4) return null;
  const options = q.options.map((o) => String(o).trim());
  if (options.some((o) => o.length === 0)) return null;
  // Opciones únicas
  if (new Set(options.map((o) => o.toLowerCase())).size !== 4) return null;
  // Opciones "comodín" prohibidas (Ninguna / Todas / Aún no confirmado / ...)
  if (options.some((o) => BANNED_OPTION.test(o))) return null;

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
  // Explicación que duda o se autocorrige → la pregunta es poco fiable, se descarta.
  if (explanation && BAD_EXPLANATION.test(explanation)) return null;

  const question = q.question.trim();
  return {
    id: stableQuestionId(question),
    question,
    options,
    correctIndex,
    category,
    difficulty,
    explanation,
  };
}
