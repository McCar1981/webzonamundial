import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import NoticiasClient from "./NoticiasClient";

const SITE_URL = "https://zonamundial.app";

export const metadata: Metadata = {
  title: "Noticias del Mundial 2026 | ZonaMundial",
  description:
    "Última hora, análisis, datos y guías sobre el Mundial 2026. Cobertura editorial diaria de selecciones, sedes, jugadores y la actualidad de la Copa del Mundo.",
  alternates: {
    canonical: `${SITE_URL}/noticias`,
    types: { "application/rss+xml": `${SITE_URL}/noticias/rss.xml` },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/noticias`,
    title: "Noticias del Mundial 2026 | ZonaMundial",
    description:
      "Última hora, análisis y guías sobre la Copa del Mundo 2026. Cobertura editorial diaria.",
    siteName: "ZonaMundial",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noticias del Mundial 2026 | ZonaMundial",
    description: "Última hora y análisis del Mundial 2026.",
  },
};

// Always re-render. KV reads are cheap (~5ms) and freshness is critical
// for an autopublishing news hub. ISR cache caused stale content during
// validation phase.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NoticiasPage() {
  const posts = await getAllPublicNoticias();

  // JSON-LD: ItemList of news + Breadcrumbs
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Noticias del Mundial 2026",
    itemListElement: posts.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/noticias/${p.slug}`,
      name: p.title,
    })),
  };
  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Noticias", item: `${SITE_URL}/noticias` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      <Suspense fallback={null}>
        <NoticiasClient posts={posts} totalCount={posts.length} />
      </Suspense>
    </>
  );
}
