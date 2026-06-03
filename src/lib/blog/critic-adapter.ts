// src/lib/blog/critic-adapter.ts
//
// Puente entre el modelo de bloques del BLOG (BlogBlock) y el crítico de
// calidad (Fase 1), que razona sobre NoticiaBlock. El crítico es el MISMO que
// gatea las noticias: así blog y contenido perenne pasan exactamente el mismo
// listón editorial.
//
// La conversión es deliberadamente "lossy": aplana stats/tablas/FAQ a texto
// para que el crítico evalúe la SUSTANCIA del contenido, no su maquetación.
// Bloques puramente visuales (image, cta, divider) se descartan.

import type { BlogBlock } from "./types";
import type { NoticiaBlock } from "@/data/noticias";
import { evaluateArticle, shouldPublish, type CriticVerdict } from "@/lib/noticias-critic";

/** Convierte el body de un BlogPost a NoticiaBlock[] para el crítico. */
export function blogBodyToNoticiaBlocks(body: BlogBlock[]): NoticiaBlock[] {
  const out: NoticiaBlock[] = [];
  for (const b of body) {
    switch (b.type) {
      case "p":
        out.push({ type: "p", text: b.text });
        break;
      case "h2":
        out.push({ type: "h2", text: b.text });
        break;
      case "h3":
        out.push({ type: "h3", text: b.text });
        break;
      case "quote":
        out.push({ type: "quote", text: b.text, cite: b.cite });
        break;
      case "ul":
      case "ol":
        out.push({ type: "list", items: b.items });
        break;
      case "callout":
        out.push({ type: "callout", title: b.title, text: b.text });
        break;
      case "stat":
        out.push({
          type: "list",
          items: b.items.map((s) =>
            [s.value, s.label, s.sub].filter(Boolean).join(" — "),
          ),
        });
        break;
      case "table": {
        const lines: string[] = [];
        if (b.caption) lines.push(b.caption);
        lines.push(b.headers.join(" | "));
        for (const row of b.rows) lines.push(row.join(" | "));
        out.push({ type: "p", text: lines.join("\n") });
        break;
      }
      case "faq":
        out.push({
          type: "list",
          items: b.items.map((f) => `${f.q} ${f.a}`),
        });
        break;
      // image, cta, divider: sin valor textual evaluable.
      default:
        break;
    }
  }
  return out;
}

/** Evalúa un BlogPost (título + body + faq) con el crítico de noticias. */
export async function evaluateBlogPost(args: {
  title: string;
  body: BlogBlock[];
  faq?: Array<{ q: string; a: string }>;
  /** Texto fuente / dossier de datos verificados del que salió la pieza. */
  sourceText?: string;
  /** Títulos ya publicados (para detectar duplicado de ángulo). */
  recentTitles?: string[];
}): Promise<CriticVerdict | null> {
  const blocks = blogBodyToNoticiaBlocks(args.body);
  if (args.faq && args.faq.length > 0) {
    blocks.push({
      type: "list",
      items: args.faq.map((f) => `${f.q} ${f.a}`),
    });
  }
  return evaluateArticle({
    title: args.title,
    body: blocks,
    sourceText: args.sourceText,
    recentTitles: args.recentTitles,
  });
}

export { shouldPublish };
