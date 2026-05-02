import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getNoticiaBySlugPublic,
  getAllPublicSlugs,
  getRelatedNoticiasPublic,
} from "@/lib/noticias-store";
import { getAuthor } from "@/data/noticias-authors";
import { ArticleView } from "./ArticleView";

const SITE_URL = "https://zonamundial.app";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllPublicSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await getNoticiaBySlugPublic(params.slug);
  if (!n) {
    return {
      title: "Noticia no encontrada | ZonaMundial",
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/noticias/${n.slug}`;
  const description = n.seoDescription || n.excerpt;

  return {
    title: `${n.title} | ZonaMundial`,
    description,
    keywords: n.tags,
    authors: [{ name: getAuthor(n.authorId).name }],
    alternates: {
      canonical: url,
      languages: { es: url, en: url },
    },
    openGraph: {
      type: "article",
      url,
      title: n.title,
      description,
      siteName: "ZonaMundial",
      locale: "es_ES",
      publishedTime: `${n.date}T08:00:00.000Z`,
      modifiedTime: `${n.updatedAt || n.date}T08:00:00.000Z`,
      authors: [getAuthor(n.authorId).name],
      tags: n.tags,
      images: n.realImage
        ? [
            {
              url: n.realImage,
              alt: n.imageCaption || n.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: n.title,
      description,
      images: n.realImage ? [n.realImage] : undefined,
    },
  };
}

export default async function NoticiaPage({ params }: Props) {
  const noticia = await getNoticiaBySlugPublic(params.slug);
  if (!noticia) notFound();

  const related = await getRelatedNoticiasPublic(noticia, 4);
  const url = `${SITE_URL}/noticias/${noticia.slug}`;
  const author = getAuthor(noticia.authorId);

  // JSON-LD: NewsArticle
  const newsArticleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: noticia.title,
    description: noticia.seoDescription || noticia.excerpt,
    image: noticia.realImage ? [noticia.realImage] : undefined,
    datePublished: `${noticia.date}T08:00:00.000Z`,
    dateModified: `${noticia.updatedAt || noticia.date}T08:00:00.000Z`,
    author: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role,
      sameAs: author.twitter ? [`https://twitter.com/${author.twitter.replace(/^@/, "")}`] : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "ZonaMundial",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: noticia.tags.join(", "),
    articleSection: noticia.cat,
    inLanguage: "es-ES",
  };

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Noticias",
        item: `${SITE_URL}/noticias`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: noticia.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      <ArticleView noticia={noticia} related={related} url={url} />
    </>
  );
}

// Allow runtime ISR for newly auto-published slugs (cron tick adds new
// articles to KV; first visitor of a fresh slug pays the SSR + render
// cost, subsequent visits served from ISR cache for 60s).
export const dynamicParams = true;
export const revalidate = 60;
