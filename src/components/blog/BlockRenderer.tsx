// src/components/blog/BlockRenderer.tsx
// Renderiza el array `body: BlogBlock[]` de cada artículo en JSX.
// Soporta marcado inline simple en strings: **negrita**, *cursiva* y
// [texto](href) para enlaces. Sin librerías externas.

import Link from "next/link";
import type { BlogBlock } from "@/lib/blog/types";
import { amazonGoUrl, AMAZON_DISCLOSURE } from "@/lib/affiliate/amazon";
import styles from "./blog.module.css";

/** Convierte texto plano con marcado simple a JSX. */
function renderInline(text: string, key: string | number = 0): React.ReactNode {
  // Marcado: **bold** *italic* [text](href)
  const parts: React.ReactNode[] = [];
  // Una pasada extrae links primero porque pueden contener cualquier cosa
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const segments: Array<{ type: "text" | "link"; text: string; href?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", text: text.slice(last, m.index) });
    segments.push({ type: "link", text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "text", text: text.slice(last) });

  segments.forEach((seg, i) => {
    if (seg.type === "link") {
      const isInternal = seg.href!.startsWith("/");
      if (isInternal) {
        parts.push(
          <Link key={`${key}-l${i}`} href={seg.href!}>
            {seg.text}
          </Link>
        );
      } else {
        parts.push(
          <a key={`${key}-l${i}`} href={seg.href} target="_blank" rel="noopener noreferrer">
            {seg.text}
          </a>
        );
      }
      return;
    }
    // Aplicar negrita y cursiva en este segmento
    const tokens = seg.text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    tokens.forEach((tok, j) => {
      if (!tok) return;
      const subKey = `${key}-${i}-${j}`;
      if (tok.startsWith("**") && tok.endsWith("**")) {
        parts.push(<strong key={subKey}>{tok.slice(2, -2)}</strong>);
      } else if (tok.startsWith("*") && tok.endsWith("*")) {
        parts.push(<em key={subKey}>{tok.slice(1, -1)}</em>);
      } else {
        parts.push(<span key={subKey}>{tok}</span>);
      }
    });
  });
  return parts;
}

/** Slug a partir de texto para anclas de heading. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface Props {
  blocks: BlogBlock[];
}

export default function BlockRenderer({ blocks }: Props) {
  let firstParagraphRendered = false;

  return (
    <>
      {blocks.map((b, i) => {
        const k = `b-${i}`;
        switch (b.type) {
          case "p": {
            const isFirst = !firstParagraphRendered;
            firstParagraphRendered = true;
            return (
              <p key={k} className={`${styles.p} ${isFirst ? styles.firstP : ""}`}>
                {renderInline(b.text, k)}
              </p>
            );
          }
          case "h2": {
            const id = b.id || slugify(b.text);
            return (
              <h2 key={k} id={id} className={styles.h2}>
                {b.text}
              </h2>
            );
          }
          case "h3": {
            const id = b.id || slugify(b.text);
            return (
              <h3 key={k} id={id} className={styles.h3}>
                {b.text}
              </h3>
            );
          }
          case "ul":
            return (
              <ul key={k} className={styles.ul}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className={styles.ol}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `${k}-${j}`)}</li>
                ))}
              </ol>
            );
          case "callout": {
            const variantClass =
              b.variant === "blue"
                ? styles.calloutBlue
                : b.variant === "warning"
                ? styles.calloutWarning
                : "";
            return (
              <aside key={k} className={`${styles.callout} ${variantClass}`}>
                {b.title && <div className={styles.calloutTitle}>{b.title}</div>}
                <p className={styles.calloutText}>{renderInline(b.text, k)}</p>
              </aside>
            );
          }
          case "stat":
            return (
              <div key={k} className={styles.stats}>
                {b.items.map((it, j) => (
                  <div key={j} className={styles.statItem}>
                    <div className={styles.statValue}>{it.value}</div>
                    <div className={styles.statLabel}>{it.label}</div>
                    {it.sub && <div className={styles.statSub}>{it.sub}</div>}
                  </div>
                ))}
              </div>
            );
          case "table":
            return (
              <div key={k} className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {b.headers.map((h, j) => (
                        <th key={j}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, c) => (
                          <td key={c}>{renderInline(cell, `${k}-${j}-${c}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {b.caption && <div className={styles.tableCaption}>{b.caption}</div>}
              </div>
            );
          case "quote":
            return (
              <blockquote key={k} className={styles.quote}>
                <p className={styles.quoteText}>{renderInline(b.text, k)}</p>
                {b.cite && <cite className={styles.quoteCite}>{b.cite}</cite>}
              </blockquote>
            );
          case "image":
            return (
              <figure key={k} className={styles.figure}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} className={styles.figureImg} loading="lazy" />
                {b.caption && <figcaption className={styles.figureCaption}>{b.caption}</figcaption>}
                {b.credit && (
                  <div className={styles.figureCredit}>
                    Foto:{" "}
                    {b.credit.sourceUrl ? (
                      <a href={b.credit.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {b.credit.author}
                      </a>
                    ) : (
                      b.credit.author
                    )}{" "}
                    / {b.credit.license} · {b.credit.source}
                  </div>
                )}
              </figure>
            );
          case "cta": {
            const isInternal = b.href.startsWith("/");
            const Btn = isInternal ? Link : "a";
            const btnProps: any = isInternal
              ? { href: b.href }
              : { href: b.href, target: "_blank", rel: "noopener noreferrer" };
            return (
              <aside key={k} className={styles.cta}>
                <div className={styles.ctaBody}>
                  <p className={styles.ctaTitle}>{b.title}</p>
                  <p className={styles.ctaText}>{b.text}</p>
                </div>
                <Btn className={styles.ctaBtn} {...btnProps}>
                  {b.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Btn>
              </aside>
            );
          }
          case "faq":
            return (
              <section key={k} className={styles.faq}>
                <h2 className={styles.faqHeading}>Preguntas frecuentes</h2>
                {b.items.map((it, j) => (
                  <div key={j} className={styles.faqItem}>
                    <h3 className={styles.faqQ}>{it.q}</h3>
                    <p className={styles.faqA}>{renderInline(it.a, `${k}-${j}`)}</p>
                  </div>
                ))}
              </section>
            );
          case "divider":
            return <hr key={k} className={styles.divider} />;
          case "affiliate":
            return (
              <aside
                key={k}
                style={{
                  margin: "28px 0",
                  padding: "20px 22px",
                  borderRadius: 14,
                  border: "1px solid var(--b-border)",
                  background:
                    "linear-gradient(180deg, rgba(20,37,54,0.5), rgba(11,24,37,0.35))",
                }}
              >
                {b.title && (
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontFamily: "var(--b-font-display)",
                      fontWeight: 800,
                      fontSize: 17,
                      letterSpacing: "-0.01em",
                      color: "var(--b-gold-3)",
                    }}
                  >
                    {b.title}
                  </p>
                )}
                {b.text && (
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--b-text-2)",
                    }}
                  >
                    {renderInline(b.text, k)}
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {b.items.map((it, j) => (
                    <a
                      key={j}
                      href={amazonGoUrl(it.query)}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 14px",
                        borderRadius: 14,
                        border: "1px solid rgba(201,168,76,0.45)",
                        background: "rgba(201,168,76,0.08)",
                        color: "var(--b-text)",
                        textDecoration: "none",
                        fontFamily: "var(--b-font-display)",
                      }}
                    >
                      {it.flag && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://flagcdn.com/w40/${it.flag}.png`}
                            alt=""
                            loading="lazy"
                            style={{
                              width: 26,
                              height: 18,
                              borderRadius: 3,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        </>
                      )}
                      <span
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          lineHeight: 1.2,
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{it.label}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--b-gold-3)",
                            opacity: 0.9,
                          }}
                        >
                          {it.price ? `${it.price} · Ver en Amazon` : "Ver en Amazon"}
                        </span>
                      </span>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M7 17L17 7" />
                        <path d="M8 7h9v9" />
                      </svg>
                    </a>
                  ))}
                </div>
                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: "var(--b-text-2)",
                    opacity: 0.8,
                  }}
                >
                  {b.note || AMAZON_DISCLOSURE}
                </p>
              </aside>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
