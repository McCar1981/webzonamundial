// Hero editorial: imagen full-bleed + eyebrow + título + dek + meta.

import { CATEGORY_LABELS, type BlogPost } from "@/lib/blog/types";
import styles from "./ArticleHero.module.css";

interface Props {
  post: BlogPost;
}

function formatPublishDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticleHero({ post }: Props) {
  const credit = post.ogImageCredit;
  return (
    <header className={styles.hero}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.ogImage} alt="" className={styles.heroImg} />
      <div className={styles.heroOverlay} />
      <div className={styles.heroBody}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          {CATEGORY_LABELS[post.category]}
        </div>
        <h1 className={styles.h1}>{post.title}</h1>
        <p className={styles.dek}>{post.dek}</p>
        <div className={styles.meta}>
          <span className={styles.metaAuthor}>
            <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            <strong>Editorial Zona Mundial</strong>
          </span>
          <span className={styles.metaSep} aria-hidden />
          <span>{formatPublishDate(post.publishedAt)}</span>
          <span className={styles.metaSep} aria-hidden />
          <span>{post.readingTime} min de lectura</span>
        </div>
      </div>
      {credit && (
        <div className={styles.heroCredit}>
          Imagen:{" "}
          {credit.sourceUrl ? (
            <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">
              {credit.author}
            </a>
          ) : (
            credit.author
          )}{" "}
          / {credit.license} · {credit.source}
        </div>
      )}
    </header>
  );
}
