// src/components/blog/BlogHub.tsx
// Hub editorial del blog: hero + featured (post más reciente) + grid de
// resto + filtros por categoría sticky.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type BlogCategory,
  type BlogPost,
} from "@/lib/blog/types";
import styles from "./BlogHub.module.css";
import blogStyles from "./blog.module.css";

interface Props {
  posts: BlogPost[];
}

const CATS: Array<{ id: BlogCategory | "all"; label: string }> = [
  { id: "all", label: "Todo" },
  { id: "analisis", label: "Análisis" },
  { id: "selecciones", label: "Selecciones" },
  { id: "datos", label: "Datos" },
  { id: "sedes", label: "Sedes" },
  { id: "historia", label: "Historia" },
  { id: "guia", label: "Guías" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogHub({ posts }: Props) {
  const [cat, setCat] = useState<BlogCategory | "all">("all");

  const filtered = useMemo(() => {
    if (cat === "all") return posts;
    return posts.filter((p) => p.category === cat);
  }, [posts, cat]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className={`${styles.root} ${blogStyles.scope}`}>
      {/* HERO */}
      <header className={styles.hubHero}>
        <div className={styles.hubEyebrow}>// EDITORIAL ZONA MUNDIAL</div>
        <h1 className={styles.hubTitle}>
          Análisis y datos para vivir el <span>Mundial 2026</span>.
        </h1>
        <p className={styles.hubSub}>
          Investigación editorial diaria sobre selecciones, sedes, jugadores y
          el camino hacia la Copa del Mundo. Sin filtros, sin clickbait, sin atajos.
        </p>
      </header>

      {/* CATEGORIES BAR (sticky) */}
      <nav className={styles.cats} aria-label="Categorías">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles.catBtn}
            data-active={cat === c.id}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          Aún no hay artículos en esta categoría. Vuelve pronto.
        </div>
      ) : (
        <>
          {/* FEATURED (primero) */}
          {featured && (
            <div className={styles.featuredWrap}>
              <Link href={`/blog/${featured.slug}`} className={styles.featured}>
                <div className={styles.featuredImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured.ogImage} alt="" />
                </div>
                <div>
                  <div
                    className={styles.featuredEyebrow}
                    style={{ color: CATEGORY_COLORS[featured.category] }}
                  >
                    {CATEGORY_LABELS[featured.category]} · ARTÍCULO DESTACADO
                  </div>
                  <h2 className={styles.featuredTitle}>{featured.title}</h2>
                  <p className={styles.featuredDek}>{featured.dek}</p>
                  <div className={styles.featuredMeta}>
                    <span>Editorial Zona Mundial</span>
                    <span className={styles.featuredMetaSep} aria-hidden />
                    <span>{formatDate(featured.publishedAt)}</span>
                    <span className={styles.featuredMetaSep} aria-hidden />
                    <span>{featured.readingTime} min</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* GRID DEL RESTO */}
          {rest.length > 0 && (
            <div className={styles.grid}>
              {rest.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
                  <div className={styles.cardImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.ogImage} alt="" />
                    <span
                      className={styles.cardCat}
                      style={{ color: CATEGORY_COLORS[p.category] }}
                    >
                      {CATEGORY_LABELS[p.category]}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{p.title}</h3>
                    <p className={styles.cardDek}>{p.dek}</p>
                    <div className={styles.cardMeta}>
                      <span>{formatDate(p.publishedAt)}</span>
                      <span className={styles.cardMetaSep} aria-hidden />
                      <span>{p.readingTime} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
