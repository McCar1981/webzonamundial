// src/lib/blog/types.ts
// Esquema editorial de los artículos del blog ZonaMundial.
//
// Cada post vive en src/content/blog/<slug>.ts y exporta un objeto BlogPost.
// El campo `body` es un array de bloques estructurados (no MDX) para mantener
// la edición sencilla sin añadir dependencias.

export type BlogCategory =
  | "analisis"
  | "selecciones"
  | "sedes"
  | "datos"
  | "historia"
  | "guia";

export interface BlogAuthor {
  name: string;
  role: string;
  avatar?: string;
}

/** Bloque textual estándar (párrafo). Soporta marcado simple **bold**. */
export interface BlockParagraph {
  type: "p";
  text: string;
}
export interface BlockHeading {
  type: "h2" | "h3";
  text: string;
  /** Anclaje para el TOC. Si se omite se genera del slug. */
  id?: string;
}
export interface BlockList {
  type: "ul" | "ol";
  items: string[];
}
export interface BlockCallout {
  type: "callout";
  variant?: "gold" | "blue" | "warning";
  title?: string;
  text: string;
}
export interface BlockStat {
  type: "stat";
  /** Cards horizontales con valor grande + label. */
  items: Array<{ value: string; label: string; sub?: string }>;
}
export interface BlockTable {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
}
export interface BlockQuote {
  type: "quote";
  text: string;
  cite?: string;
}
export interface BlockImage {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}
export interface BlockCta {
  type: "cta";
  title: string;
  text: string;
  href: string;
  label: string;
}
export interface BlockFaq {
  type: "faq";
  items: Array<{ q: string; a: string }>;
}
export interface BlockDivider {
  type: "divider";
}

export type BlogBlock =
  | BlockParagraph
  | BlockHeading
  | BlockList
  | BlockCallout
  | BlockStat
  | BlockTable
  | BlockQuote
  | BlockImage
  | BlockCta
  | BlockFaq
  | BlockDivider;

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description para SEO + tarjetas (máx 160 chars). */
  description: string;
  /** Subtítulo / dek mostrado bajo el título en hero. */
  dek: string;
  /** Imagen principal (og + hero). */
  ogImage: string;
  category: BlogCategory;
  /** Keywords objetivo (1ª = principal). */
  keywords: string[];
  /** Etiquetas visibles en hub. */
  tags: string[];
  /** ISO 8601 con hora. Posts con publishedAt > now() quedan ocultos. */
  publishedAt: string;
  /** Si se actualiza, fecha del último update. */
  updatedAt?: string;
  /** Minutos estimados de lectura. */
  readingTime: number;
  /** Cuerpo estructurado en bloques. */
  body: BlogBlock[];
  /** FAQ schema.org (rich snippets). Se renderiza al final si existe. */
  faq?: Array<{ q: string; a: string }>;
  /** Slugs de artículos relacionados. */
  related?: string[];
  /** Si está fijado, aparece SIEMPRE primero como featured. Pensado para
   * el manifiesto de presentación de marca o piezas atemporales clave. */
  pinned?: boolean;
}

export const EDITORIAL_AUTHOR: BlogAuthor = {
  name: "Editorial Zona Mundial",
  role: "Equipo editorial",
};

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  analisis: "Análisis",
  selecciones: "Selecciones",
  sedes: "Sedes",
  datos: "Datos",
  historia: "Historia",
  guia: "Guía",
};

export const CATEGORY_COLORS: Record<BlogCategory, string> = {
  analisis: "#75AADB",
  selecciones: "#FDE68A",
  sedes: "#10B981",
  datos: "#C9A84C",
  historia: "#A855F7",
  guia: "#FB923C",
};
