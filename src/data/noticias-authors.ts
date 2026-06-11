/**
 * Authors registry for noticias.
 *
 * Honestidad editorial (auditoría AdSense 11-06-2026): solo hay dos firmas y
 * las dos son veraces — Carlos (persona real, titular del medio) y la
 * "Redacción ZonaMundial" (firma de equipo para las piezas elaboradas con
 * apoyo de IA a partir de fuentes verificadas). PROHIBIDO añadir personas
 * ficticias con biografías inventadas: es una violación E-E-A-T directa.
 *
 * El id histórico "gabriel-venegas" se conserva porque las noticias ya
 * almacenadas en KV lo referencian como authorId; su ficha visible es ahora
 * la firma de redacción.
 */

export interface NoticiaAuthor {
  /** Stable id used as foreign key in Noticia.authorId — must match an AuthorId */
  id: AuthorId;
  name: string;
  role: string;
  bio: string;
  twitter?: string;
  /** Initial color theme used by the avatar gradient */
  accent: string;
  /** "person" → JSON-LD Person; "team" → JSON-LD Organization */
  kind: "person" | "team";
}

export type AuthorId = "carlos-zamudio" | "gabriel-venegas";

export const AUTHORS = {
  "carlos-zamudio": {
    id: "carlos-zamudio",
    name: "Carlos Zamudio",
    role: "Editor jefe · Fundador de ZonaMundial",
    bio: "Fundador y editor jefe de ZonaMundial. Dirige la cobertura del Mundial 2026: datos en vivo, predicciones, fantasy y análisis de las 48 selecciones.",
    accent: "#c9a84c",
    kind: "person",
  },
  "gabriel-venegas": {
    id: "gabriel-venegas",
    name: "Redacción ZonaMundial",
    role: "Equipo editorial",
    bio: "Piezas elaboradas por el equipo editorial de ZonaMundial con apoyo de herramientas de IA, a partir de fuentes verificadas y de los datos oficiales del torneo, bajo la supervisión del editor jefe.",
    accent: "#5b21b6",
    kind: "team",
  },
} as const satisfies Record<AuthorId, NoticiaAuthor>;

export function getAuthor(id: AuthorId): NoticiaAuthor {
  return AUTHORS[id];
}

/**
 * Pick an author for an article based on its category and a numeric seed.
 * - Carlos firma lo que cubre directamente (Latam, datos, historia).
 * - La Redacción firma el resto del flujo auto-asistido.
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
