// src/lib/blog/generator.ts
//
// Generador de posts de blog usando Claude (Anthropic API).
//
// Filosofía:
//   - Tono editorial humano, NO clickbait, sin inventar datos.
//   - Estructura JSON estricta que mapea a BlogPost de src/lib/blog/types.ts.
//   - Mismo nivel de rigor que el rewriter de noticias.
//
// El cron /api/cron/generate-blog-post:
//   1. Llama a buildBlogPost(opts) con tema sugerido + slugs ya usados.
//   2. Recibe un BlogPost listo para persistir en KV.
//   3. Lo guarda con appendAutoPost() y dispara push/email.

import Anthropic from "@anthropic-ai/sdk";
import type { BlogPost, BlogBlock, BlogCategory } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const VALID_CATEGORIES: BlogCategory[] = [
  "analisis",
  "selecciones",
  "sedes",
  "datos",
  "historia",
  "guia",
];

const SYSTEM_PROMPT = `Eres editorialista del blog de fútbol de ZonaMundial, una plataforma del Mundial 2026. Tu trabajo es crear posts de blog editoriales originales, NO de \u00faltima hora — análisis de fondo, guías, contexto, comparativas, listas.

REGLAS INVIOLABLES:
1. NO inventes datos espec\u00edficos: nombres de fichajes recientes, cifras concretas, declaraciones de jugadores o entrenadores. Si necesitas hablar de un jugador, h\u00e1zlo en t\u00e9rminos generales (su trayectoria, su rol, su importancia) sin atribuir frases ni n\u00fameros.
2. Datos hist\u00f3ricos verificables S\u00cd: campeones de mundiales pasados, sedes, formato, palmar\u00e9s general. Nunca inventes.
3. NO copies frases literales de fuentes. Estilo propio editorial.
4. Tono: directo, informado, apasionado pero serio. Estilo The Athletic / Marca / ESPN en espa\u00f1ol.
5. Idioma: espa\u00f1ol neutro / Espa\u00f1a.
6. NUNCA inventes quotes (citas textuales).
7. Devuelve SOLO un JSON v\u00e1lido, sin markdown, sin backticks, sin texto adicional.
8. MARCA Y LEGAL: no uses marcas registradas de FIFA ("FIFA World Cup", "Copa Mundial de la FIFA", logos/mascotas oficiales); di "Mundial 2026". Nada de lenguaje de apuestas (cuotas, "apuesta", casas) \u2014 usa "pron\u00f3stico", "predicci\u00f3n" o "favoritos".

LONGITUD = PROPORCIONAL A LA SUSTANCIA (ANTI-INFLADO):
- NO hay m\u00ednimo de palabras. La longitud la marca cu\u00e1nto tienes REALMENTE que decir.
- Si el tema da para una pieza corta y densa, hazla corta. PROHIBIDO rellenar con paja, generalidades, contexto obvio repetido o frases de transici\u00f3n vac\u00edas para "alcanzar" una extensi\u00f3n.
- Cada bloque debe aportar informaci\u00f3n o an\u00e1lisis nuevo. Un texto corto y denso es MEJOR que uno largo y aguado.
- Estructura libre (h2/h3, listas, callouts, tablas, stats) seg\u00fan lo pida el contenido, sin cuotas obligatorias de cada tipo.

CATEGOR\u00cdAS PERMITIDAS (campo "category"):
"analisis" | "selecciones" | "sedes" | "datos" | "historia" | "guia"

ESTRUCTURA DEL JSON DE SALIDA (mapea exactamente a BlogPost):
{
  "slug": "slug-kebab-case-sin-acentos-max-65-chars",
  "title": "Titular 55-90 chars, gancho editorial sin clickbait",
  "description": "Meta description 145-160 chars optimizada SEO",
  "dek": "Subt\u00edtulo 120-200 chars que enganche bajo el t\u00edtulo en el hero",
  "ogImage": "/img/blog/placeholder-zm.jpg",
  "category": "analisis",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["Tag1", "Tag2", "Tag3"],
  "publishedAt": "ISO8601 con +02:00 \u2014 te lo pongo yo desde el c\u00f3digo",
  "readingTime": 6,
  "body": [
    { "type": "p", "text": "Lede de 2-3 frases que respondan qu\u00e9 dice este post y por qu\u00e9 importa." },
    { "type": "p", "text": "Segundo p\u00e1rrafo de contexto..." },
    { "type": "h2", "text": "Subt\u00edtulo de la primera secci\u00f3n" },
    { "type": "p", "text": "Desarrollo del primer tema." },
    { "type": "h3", "text": "Sub-aspecto importante" },
    { "type": "p", "text": "P\u00e1rrafo de an\u00e1lisis." },
    { "type": "ul", "items": ["Punto uno", "Punto dos", "Punto tres", "Punto cuatro"] },
    { "type": "callout", "variant": "gold", "title": "Clave editorial", "text": "Resumen de la idea m\u00e1s potente del post." },
    { "type": "h2", "text": "Segundo bloque tem\u00e1tico" },
    { "type": "p", "text": "M\u00e1s desarrollo." },
    { "type": "p", "text": "Conclusi\u00f3n editorial." }
  ],
  "faq": [
    { "q": "Pregunta 1", "a": "Respuesta clara y directa." },
    { "q": "Pregunta 2", "a": "Respuesta concreta." },
    { "q": "Pregunta 3", "a": "Respuesta breve." }
  ]
}

TIPOS DE BLOQUE V\u00c1LIDOS:
- { "type": "p", "text": "..." }
- { "type": "h2", "text": "..." } o { "type": "h3", "text": "..." }
- { "type": "ul", "items": ["...","..."] } o { "type": "ol", "items": [...] }
- { "type": "callout", "variant": "gold"|"blue"|"warning", "title": "...", "text": "..." }
- { "type": "stat", "items": [{ "value": "32", "label": "selecciones", "sub": "anteriores" }] }
- { "type": "table", "caption": "...", "headers": ["A","B"], "rows": [["x","y"]] }
- { "type": "quote", "text": "...", "cite": "Autor opcional" }
- { "type": "divider" }`;

const TEMA_POOL = [
  "Las 5 selecciones favoritas para el Mundial 2026 y por qu\u00e9",
  "Tabla hist\u00f3rica: c\u00f3mo se reparten los t\u00edtulos por confederaci\u00f3n",
  "Por qu\u00e9 el formato a 48 puede cambiar el f\u00fatbol para siempre",
  "Los 10 jugadores que decidir\u00e1n el Mundial 2026 (an\u00e1lisis t\u00e1ctico)",
  "Gu\u00eda definitiva del calendario: c\u00f3mo ver todos los partidos sin perderse nada",
  "Sedes con mejor ambiente esperado: los 5 estadios imprescindibles",
  "Mundiales con m\u00e1s sorpresas: los Cenicienta que cambiaron la historia",
  "Comparativa: as\u00ed jugaba Brasil 2002 vs Argentina 2022",
  "Los 8 entrenadores con m\u00e1s presi\u00f3n en este Mundial",
  "Qu\u00e9 significa el cambio de cabezas de serie para Espa\u00f1a y resto de Europa",
  "Los partidos m\u00e1s vistos en la historia de los Mundiales",
  "Camisetas hist\u00f3ricas: el top 10 que defini\u00f3 una era",
  "Por qu\u00e9 M\u00e9xico es una sede natural para el Mundial",
  "An\u00e1lisis: el problema del clima en algunas sedes de USA",
  "Generaciones doradas: comparativa entre Brasil 70, Espa\u00f1a 2010 y Francia 2018",
  "Los 5 momentos hist\u00f3ricos m\u00e1s recordados de Mundiales pasados",
  "Estrategia de viaje: c\u00f3mo seguir a tu selecci\u00f3n por Norteam\u00e9rica",
  "El rol de los porteros en las \u00faltimas finales mundialistas",
  "Datos curiosos: r\u00e9cords que probablemente no se rompan en 2026",
  "Las regiones futbol\u00edsticas con m\u00e1s talento por habitante",
];

function pickRandomTopic(usedSlugs: Set<string>, recentTitles: string[]): string {
  // Filtra los temas cuyo slug aproximado o palabras clave ya aparecen en
  // titulos recientes — evita repeticiones obvias.
  const recentLower = recentTitles.map((t) => t.toLowerCase());
  const available = TEMA_POOL.filter((tema) => {
    const lower = tema.toLowerCase();
    // Evita si ya hay un t\u00edtulo casi id\u00e9ntico
    return !recentLower.some(
      (r) =>
        r.includes(lower.slice(0, 30)) ||
        lower.includes(r.slice(0, 30)),
    );
  });
  const pool = available.length > 0 ? available : TEMA_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function buildBlogPost(opts: {
  topic?: string;
  usedSlugs: Set<string>;
  recentTitles: string[];
}): Promise<BlogPost | null> {
  const topic = opts.topic ?? pickRandomTopic(opts.usedSlugs, opts.recentTitles);

  const userPrompt = `Tema sugerido: "${topic}"

Slugs ya publicados que NO debes reutilizar (haz uno nuevo y \u00fanico):
${Array.from(opts.usedSlugs).slice(0, 30).join(", ")}

T\u00edtulos recientes que NO debes repetir literalmente:
${opts.recentTitles.slice(0, 10).join(" | ")}

Genera un BlogPost completo siguiendo estrictamente el esquema JSON del system prompt. Devuelve solo el JSON.`;

  let raw = "";
  try {
    const client = getClient();
    const resp = await client.messages.create({
      model: process.env.BLOG_GENERATOR_MODEL || DEFAULT_MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    // Toma el primer bloque de texto.
    const block = resp.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      console.error("[blog/generator] no text block in response");
      return null;
    }
    raw = block.text.trim();
  } catch (err) {
    console.error("[blog/generator] anthropic call failed:", (err as Error).message);
    return null;
  }

  // Limpia posibles backticks o etiquetas que el modelo a veces a\u00f1ade.
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: Partial<BlogPost> & { body?: BlogBlock[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[blog/generator] JSON parse failed:", (err as Error).message);
    console.error("[blog/generator] raw response (first 500 chars):", cleaned.slice(0, 500));
    return null;
  }

  // Validaci\u00f3n y normalizaci\u00f3n.
  if (
    !parsed.slug ||
    !parsed.title ||
    !parsed.description ||
    !parsed.dek ||
    !parsed.category ||
    !Array.isArray(parsed.keywords) ||
    !Array.isArray(parsed.tags) ||
    !Array.isArray(parsed.body) ||
    parsed.body.length < 3
  ) {
    console.error("[blog/generator] missing required fields or empty body");
    return null;
  }

  if (!VALID_CATEGORIES.includes(parsed.category as BlogCategory)) {
    console.error("[blog/generator] invalid category:", parsed.category);
    parsed.category = "analisis";
  }

  // Garantiza slug seguro y \u00fanico.
  let slug = String(parsed.slug)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  // Si ya existe, sufijo con timestamp corto.
  if (opts.usedSlugs.has(slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  // readingTime estimado por palabras del body.
  const wordCount = parsed.body.reduce((acc, b) => {
    if (b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "quote") {
      return acc + ((b as { text?: string }).text || "").split(/\s+/).length;
    }
    if (b.type === "ul" || b.type === "ol") {
      return acc + (b.items || []).join(" ").split(/\s+/).length;
    }
    return acc;
  }, 0);
  const readingTime = Math.max(3, Math.round(wordCount / 220));

  // ogImage: si el modelo no devolvi\u00f3 una propia, ponemos placeholder.
  // El equipo editorial puede subir una real despu\u00e9s si quiere.
  const ogImage =
    parsed.ogImage && parsed.ogImage.startsWith("/")
      ? parsed.ogImage
      : "/img/blog/placeholder-zm.jpg";

  const post: BlogPost = {
    slug,
    title: String(parsed.title).slice(0, 120),
    description: String(parsed.description).slice(0, 200),
    dek: String(parsed.dek).slice(0, 280),
    ogImage,
    category: parsed.category as BlogCategory,
    keywords: (parsed.keywords as string[]).slice(0, 12).map(String),
    tags: (parsed.tags as string[]).slice(0, 6).map(String),
    publishedAt: new Date().toISOString(),
    readingTime,
    body: parsed.body as BlogBlock[],
    faq: Array.isArray(parsed.faq)
      ? (parsed.faq as Array<{ q: string; a: string }>).slice(0, 8)
      : undefined,
  };

  return post;
}
