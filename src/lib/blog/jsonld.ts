// src/lib/blog/jsonld.ts
// Helpers para construir JSON-LD de tipo Article + FAQPage para SEO.

import type { BlogPost } from "./types";

const SITE = "https://zonamundial.app";

export function buildArticleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    image: [post.ogImage.startsWith("http") ? post.ogImage : `${SITE}${post.ogImage}`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: [
      {
        "@type": "Organization",
        name: "Editorial Zona Mundial",
        url: SITE,
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "ZonaMundial",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/img/logo-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    inLanguage: "es",
  };
}

export function buildFaqJsonLd(items: Array<{ q: string; a: string }>) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
    ],
  };
}
