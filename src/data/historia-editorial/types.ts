// src/data/historia-editorial/types.ts
// Tipos para el contenido editorial extenso de las páginas /historia/*.
// Este contenido convierte páginas de datos/tablas en artículos con prosa
// original sustancial (requisito de calidad de Google AdSense y SEO).

export interface EditorialSection {
  /** Encabezado de la sección (se renderiza como <h2>). */
  h: string;
  /** Párrafos de la sección (cada string es un <p>). */
  body: string[];
}

export interface EditorialFAQ {
  q: string;
  a: string;
}

export interface EditorialArticle {
  /** Párrafo introductorio que abre el bloque editorial. */
  lead: string;
  /** Secciones de desarrollo (idealmente 3-4, con 1-2 párrafos cada una). */
  sections: EditorialSection[];
  /** Preguntas frecuentes (se renderizan como contenido + JSON-LD FAQPage). */
  faq?: EditorialFAQ[];
}

export type EditorialMap = Record<string, EditorialArticle>;
