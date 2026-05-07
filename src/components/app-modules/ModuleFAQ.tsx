// src/components/app-modules/ModuleFAQ.tsx
// FAQ acordeón para landings de módulo. Inserta JSON-LD FAQPage para
// rich snippets en Google. Renderiza también la versión visible.

import { Fragment } from "react";

export interface FAQItem {
  q: string;
  a: string;
}

interface Props {
  /** Etiqueta del módulo (ej "Predicciones") */
  moduleLabel: string;
  items: FAQItem[];
}

export default function ModuleFAQ({ moduleLabel, items }: Props) {
  if (items.length === 0) return null;

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `${moduleLabel} — Preguntas frecuentes`,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <section
        aria-label={`Preguntas frecuentes sobre ${moduleLabel}`}
        style={{ marginTop: 32 }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C9A84C",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          // PREGUNTAS FRECUENTES
        </div>
        <h3
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 18,
            letterSpacing: "-0.02em",
          }}
        >
          Lo que más nos preguntáis sobre {moduleLabel}
        </h3>

        <div>
          {items.map((it, i) => (
            <details
              key={i}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "14px 0",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.01em",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <span>{it.q}</span>
                <span
                  aria-hidden
                  style={{
                    fontSize: 18,
                    color: "#C9A84C",
                    flexShrink: 0,
                    transition: "transform 200ms",
                  }}
                >
                  +
                </span>
              </summary>
              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#94a3b8",
                  lineHeight: 1.65,
                  fontSize: 15,
                  fontFamily: "Source Serif 4, Georgia, serif",
                }}
              >
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </Fragment>
  );
}
