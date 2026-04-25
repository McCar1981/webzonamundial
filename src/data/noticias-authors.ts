/**
 * Authors registry for noticias.
 *
 * Fase 2 constraint: every article must be signed by Carlos Zamudio or
 * Gabriel Venegas. The auto-ingest pipeline picks one based on the
 * article's category + a round-robin seed so the byline stays balanced.
 */

export interface NoticiaAuthor {
  id: string;
  name: string;
  role: string;
  bio: string;
  twitter?: string;
  /** Initial color theme used by the avatar gradient */
  accent: string;
}

export const AUTHORS = {
  "carlos-zamudio": {
    id: "carlos-zamudio",
    name: "Carlos Zamudio",
    role: "Editor jefe · Mundial 2026",
    bio: "Periodista deportivo con 15 años cubriendo selecciones latinoamericanas y Mundiales. Especializado en análisis táctico, mercado de fichajes y el día a día de las concentraciones.",
    twitter: "@carloszamudio",
    accent: "#c9a84c",
  },
  "gabriel-venegas": {
    id: "gabriel-venegas",
    name: "Gabriel Venegas",
    role: "Redactor · Selecciones europeas",
    bio: "Sigue de cerca la actualidad de las grandes ligas europeas y la previa del Mundial 2026. Ex-corresponsal en LaLiga, Premier y Bundesliga, especialista en lectura táctica.",
    twitter: "@gvenegas",
    accent: "#5b21b6",
  },
} as const satisfies Record<string, NoticiaAuthor>;

export type AuthorId = keyof typeof AUTHORS;

export function getAuthor(id: AuthorId): NoticiaAuthor {
  return AUTHORS[id];
}

/**
 * Pick an author for an article based on its category and a numeric seed.
 * - Carlos covers Latam selecciones, datos and historia.
 * - Gabriel covers European selecciones, análisis, sedes and plataforma.
 * - For "selecciones" we alternate by seed so the byline mix is healthy.
 */
export function pickAuthorForArticle(opts: {
  cat: string;
  flags?: string[];
  seed?: number;
}): NoticiaAuthor {
  const { cat, flags = [], seed = Date.now() } = opts;

  // Latin American flags get Carlos by default (his beat).
  const LATAM = new Set(["ar","mx","br","co","cl","pe","uy","py","ec","ve","bo","cr","pa","gt","hn","sv","ni","do","cu","jm"]);
  const hasLatam = flags.some((f) => LATAM.has(f.toLowerCase()));

  if (cat === "selecciones") {
    if (hasLatam) return AUTHORS["carlos-zamudio"];
    if (flags.length > 0) return AUTHORS["gabriel-venegas"];
    return seed % 2 === 0 ? AUTHORS["carlos-zamudio"] : AUTHORS["gabriel-venegas"];
  }
  if (cat === "historia" || cat === "datos") return AUTHORS["carlos-zamudio"];
  if (cat === "analisis" || cat === "sedes" || cat === "plataforma")
    return AUTHORS["gabriel-venegas"];

  // Default: alternate by seed
  return seed % 2 === 0 ? AUTHORS["carlos-zamudio"] : AUTHORS["gabriel-venegas"];
}
