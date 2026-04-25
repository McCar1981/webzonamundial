"use client";

/**
 * ArticleView — ESPN-style editorial article page.
 * Hero image full-bleed, sticky share rail, sidebar with related,
 * scroll progress bar, reading-time, copy-link toast, JSON-LD applied
 * server-side at the page level.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Noticia, NoticiaBlock } from "@/data/noticias";
import { getAuthor } from "@/data/noticias-authors";
import styles from "./ArticleView.module.css";

const CAT_LABELS: Record<string, string> = {
  analisis: "Análisis",
  datos: "Datos & Stats",
  historia: "Historia",
  sedes: "Sedes",
  selecciones: "Selecciones",
  plataforma: "Plataforma",
};
const CAT_COLORS: Record<string, string> = {
  analisis: "#3b82f6",
  datos: "#22c55e",
  historia: "#f59e0b",
  sedes: "#e879f9",
  selecciones: "#ef4444",
  plataforma: "#06b6d4",
};

const flagUrl = (c: string) => `https://flagcdn.com/w80/${c}.png`;

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${parseInt(day)} ${MONTHS_ES[parseInt(m) - 1]} ${y}`;
};

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function Block({ block }: { block: NoticiaBlock }) {
  switch (block.type) {
    case "p":
      return <p className={styles.p}>{block.text}</p>;
    case "h2":
      return <h2 className={styles.h2}>{block.text}</h2>;
    case "h3":
      return <h3 className={styles.h3}>{block.text}</h3>;
    case "quote":
      return (
        <blockquote className={styles.quote}>
          <p>{block.text}</p>
          {block.cite && <cite>— {block.cite}</cite>}
        </blockquote>
      );
    case "list":
      return (
        <ul className={styles.list}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside className={styles.callout}>
          {block.title && <strong>{block.title}</strong>}
          <p>{block.text}</p>
        </aside>
      );
  }
}

export function ArticleView({
  noticia,
  related,
  url,
}: {
  noticia: Noticia;
  related: Noticia[];
  url: string;
}) {
  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(100, (scrolled / total) * 100));
      setProgress(pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const catColor = CAT_COLORS[noticia.cat] || "#c9a84c";
  const catLabel = CAT_LABELS[noticia.cat] || noticia.cat;
  const shareText = encodeURIComponent(`${noticia.title} — ZonaMundial`);
  const shareUrl = encodeURIComponent(url);
  const author = getAuthor(noticia.authorId);

  return (
    <div className={styles.shell}>
      {/* Reading progress */}
      <div className={styles.progress} style={{ width: `${progress}%` }} aria-hidden />

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Inicio</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/noticias">Noticias</Link></li>
          <li aria-hidden>›</li>
          <li className={styles.crumbCurrent}>{catLabel}</li>
        </ol>
      </nav>

      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.heroMeta}>
          <span
            className={styles.catPill}
            style={{ background: `${catColor}1c`, borderColor: `${catColor}55`, color: catColor }}
          >
            {catLabel}
          </span>
          {noticia.flags.length > 0 && (
            <div className={styles.flags}>
              {noticia.flags.map((f) => (
                <img key={f} src={flagUrl(f)} alt="" />
              ))}
            </div>
          )}
        </div>

        <h1 className={styles.title}>{noticia.title}</h1>
        <p className={styles.lede}>{noticia.excerpt}</p>

        <div className={styles.byline}>
          <div className={styles.author}>
            <span
              className={styles.authorAvatar}
              aria-hidden
              style={{ background: `linear-gradient(135deg, ${author.accent}, #5b21b6)` }}
            >
              {author.name.charAt(0)}
            </span>
            <div>
              <strong>{author.name}</strong>
              {author.role && <span>{author.role}</span>}
            </div>
          </div>
          <div className={styles.bylineMeta}>
            <time dateTime={noticia.date}>{fmtDate(noticia.date)}</time>
            <span aria-hidden>·</span>
            <span>{noticia.readTime} min de lectura</span>
            {noticia.updatedAt && noticia.updatedAt !== noticia.date && (
              <>
                <span aria-hidden>·</span>
                <span>Actualizado {fmtDate(noticia.updatedAt)}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO IMAGE */}
      {noticia.realImage && (
        <figure className={styles.heroImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={noticia.realImage} alt={noticia.imageCaption || noticia.title} />
          {(noticia.imageCaption || noticia.imageSource) && (
            <figcaption>
              {noticia.imageCaption}
              {noticia.imageSource && <span> · {noticia.imageSource}</span>}
            </figcaption>
          )}
        </figure>
      )}

      {/* MAIN GRID: article + sidebar */}
      <div className={styles.grid}>
        {/* SHARE RAIL (desktop) */}
        <aside className={styles.shareRail} aria-label="Compartir">
          <span className={styles.shareLabel}>Compartir</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en Twitter"
            className={styles.shareBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zM17.083 19.77h1.832L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en WhatsApp"
            className={styles.shareBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.5 3.5A11.85 11.85 0 0 0 12.04 0C5.5 0 .19 5.31.18 11.85a11.8 11.8 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.67 1.44h.01c6.54 0 11.85-5.31 11.86-11.84a11.78 11.78 0 0 0-3.4-8.44Zm-8.46 18.27h-.01a9.84 9.84 0 0 1-5.02-1.37l-.36-.21-3.77.98 1-3.67-.23-.38a9.83 9.83 0 0 1-1.51-5.27c0-5.43 4.42-9.85 9.86-9.85a9.79 9.79 0 0 1 6.97 2.89 9.79 9.79 0 0 1 2.89 6.97c0 5.43-4.43 9.85-9.86 9.85Zm5.41-7.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.42-1.5a9.13 9.13 0 0 1-1.68-2.09c-.17-.3 0-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.18-.24-.58-.49-.5-.66-.51l-.56-.01a1.07 1.07 0 0 0-.78.37c-.27.3-1.02 1-1.02 2.43s1.05 2.83 1.2 3.02c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.68.61.7.22 1.34.19 1.84.12.56-.08 1.76-.72 2-1.4.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.34Z" />
            </svg>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en Facebook"
            className={styles.shareBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
            </svg>
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en LinkedIn"
            className={styles.shareBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.36-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43A2.06 2.06 0 1 1 5.34 3.3a2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
            </svg>
          </a>
          <button onClick={handleCopy} aria-label="Copiar enlace" className={styles.shareBtn} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          {copied && <span className={styles.copyToast}>¡Copiado!</span>}
        </aside>

        {/* ARTICLE */}
        <article ref={articleRef} className={styles.article}>
          {noticia.body.map((b, i) => (
            <Block key={i} block={b} />
          ))}

          {/* Tags */}
          {noticia.tags.length > 0 && (
            <div className={styles.tagBar} role="list">
              {noticia.tags.map((tag) => (
                <span key={tag} className={styles.tag} role="listitem">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author footer */}
          <footer className={styles.authorFooter}>
            <span
              className={styles.authorAvatarLg}
              aria-hidden
              style={{ background: `linear-gradient(135deg, ${author.accent}, #5b21b6)` }}
            >
              {author.name.charAt(0)}
            </span>
            <div className={styles.authorFooterBody}>
              <strong>{author.name}</strong>
              {author.role && <p className={styles.authorFooterRole}>{author.role}</p>}
              {author.bio && <p className={styles.authorFooterBio}>{author.bio}</p>}
              {author.twitter && (
                <a
                  href={`https://twitter.com/${author.twitter.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.authorFooterTwitter}
                >
                  {author.twitter}
                </a>
              )}
            </div>
          </footer>

          {/* Source attribution if applicable */}
          {noticia.sourceUrl && (
            <p className={styles.sourceLine}>
              Información complementaria de{" "}
              <a href={noticia.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                {noticia.sourceName || noticia.sourceUrl}
              </a>
              .
            </p>
          )}

          {/* Share row (mobile + bottom) */}
          <div className={styles.shareBottom}>
            <span><ShareIcon /> Compartir</span>
            <div>
              <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
              <button type="button" onClick={handleCopy}>{copied ? "¡Copiado!" : "Copiar"}</button>
            </div>
          </div>

          {/* App promo CTA */}
          <aside className={styles.appCta}>
            <div>
              <small>NO TE PIERDAS NADA</small>
              <h3>Vive el Mundial 2026 desde la app de ZonaMundial</h3>
              <p>Predicciones, fantasy, IA coach y streaming con creadores. Todo gratis.</p>
            </div>
            <Link href="/registro" className={styles.appCtaBtn}>Pre-regístrate</Link>
          </aside>
        </article>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBlock}>
            <h2>Lo más leído</h2>
            <ol>
              {related.slice(0, 4).map((r, i) => (
                <li key={r.id}>
                  <span className={styles.sideRank}>{i + 1}</span>
                  <Link href={`/noticias/${r.slug}`}>
                    <strong>{r.title}</strong>
                    <span className={styles.sideMeta}>
                      {CAT_LABELS[r.cat]} · {r.readTime} min
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className={`${styles.sidebarBlock} ${styles.sidebarPromo}`}>
            <small>JUEGA GRATIS</small>
            <h3>Predicciones del Mundial</h3>
            <p>Desafía a tus amigos y compite con creadores. Lista de espera abierta.</p>
            <Link href="/registro">Entrar a la lista →</Link>
          </div>

          <div className={styles.sidebarBlock}>
            <h2>Categorías</h2>
            <ul className={styles.sideCats}>
              {Object.entries(CAT_LABELS).map(([id, label]) => (
                <li key={id}>
                  <Link
                    href={`/noticias?cat=${id}`}
                    style={{ borderColor: `${CAT_COLORS[id]}55`, color: CAT_COLORS[id] }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* RELATED full-width */}
      {related.length > 0 && (
        <section className={styles.relatedSection} aria-labelledby="related-h">
          <h2 id="related-h">Sigue leyendo</h2>
          <div className={styles.relatedGrid}>
            {related.map((r) => (
              <Link key={r.id} href={`/noticias/${r.slug}`} className={styles.relatedCard}>
                {r.realImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.realImage} alt="" className={styles.relatedImg} />
                )}
                <div className={styles.relatedBody}>
                  <span
                    className={styles.relatedCat}
                    style={{ color: CAT_COLORS[r.cat] || "#c9a84c" }}
                  >
                    {CAT_LABELS[r.cat]}
                  </span>
                  <h3>{r.title}</h3>
                  <span className={styles.relatedMeta}>
                    {fmtDate(r.date)} · {r.readTime} min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
