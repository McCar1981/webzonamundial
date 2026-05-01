// src/app/blog/[slug]/page.tsx
// Detalle de artículo editorial. SSG con generateStaticParams + ISR.
// JSON-LD Article + FAQPage + Breadcrumb para rich snippets.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/blog/jsonld";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/blog/types";
import ArticleHero from "@/components/blog/ArticleHero";
import BlockRenderer from "@/components/blog/BlockRenderer";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ShareBar from "@/components/blog/ShareBar";
import styles from "@/components/blog/blog.module.css";

// ISR cada 5 min — los posts a publishedAt futuro se irán activando solos.
export const revalidate = 300;

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

interface Params {
  params: { slug: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Artículo no encontrado" };
  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} | ZonaMundial`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      images: [{ url: post.ogImage, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: ["Editorial Zona Mundial"],
      siteName: "ZonaMundial",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.ogImage],
    },
  };
}

export default function BlogPostPage({ params }: Params) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(post, 3);
  const articleLd = buildArticleJsonLd(post);
  const breadcrumbLd = buildBreadcrumbJsonLd(post);
  const faqLd = post.faq && post.faq.length > 0 ? buildFaqJsonLd(post.faq) : null;

  return (
    <div className={styles.scope}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <ReadingProgress />

      <ArticleHero post={post} />

      <article className={styles.article} data-article>
        <BlockRenderer blocks={post.body} />
        <ShareBar title={post.title} slug={post.slug} />
        <EditorialFooter />
      </article>

      {related.length > 0 && (
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "40px 20px 80px",
            borderTop: "1px solid var(--b-rule)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--b-font-display)",
              fontWeight: 800,
              fontSize: "clamp(20px, 2.6vw, 26px)",
              letterSpacing: "-0.02em",
              marginBottom: 20,
              color: "var(--b-text)",
            }}
          >
            Sigue leyendo
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid var(--b-border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "rgba(15,31,48,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 220ms",
                }}
              >
                <div style={{ aspectRatio: "16/10", overflow: "hidden", background: "#0F1F30" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.ogImage}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontFamily: "var(--b-font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: CATEGORY_COLORS[p.category],
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {CATEGORY_LABELS[p.category]}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--b-font-display)",
                      fontWeight: 800,
                      fontSize: 16,
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                      margin: 0,
                      color: "var(--b-text)",
                    }}
                  >
                    {p.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EditorialFooter() {
  return (
    <footer
      style={{
        marginTop: 48,
        padding: "28px 24px",
        borderRadius: 16,
        border: "1px solid var(--b-border)",
        background: "linear-gradient(180deg, rgba(20, 37, 54, 0.5), rgba(11, 24, 37, 0.3))",
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #C9A84C, #FDE68A)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1A1208",
          flexShrink: 0,
          fontWeight: 900,
          fontSize: 22,
          fontFamily: "var(--b-font-display)",
        }}
      >
        ZM
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--b-font-display)",
            fontWeight: 800,
            fontSize: 16,
            color: "var(--b-gold-3)",
            letterSpacing: "-0.01em",
            marginBottom: 4,
          }}
        >
          Editorial Zona Mundial
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--b-text-2)",
            lineHeight: 1.6,
            fontFamily: "var(--b-font-serif)",
          }}
        >
          El equipo editorial de ZonaMundial firma análisis, datos y guías del
          Mundial 2026 con un único compromiso: rigor y pasión por el fútbol.
          Sin algoritmos, sin clickbait, sin prisas.
        </p>
      </div>
    </footer>
  );
}
