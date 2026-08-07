import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import NoticiasClient from "./NoticiasClient";
import PushOptInBanner from "@/components/PushOptInBanner";

const SITE_URL = "https://zonamundial.app";

export const metadata: Metadata = {
  // Sin sufijo de marca: lo añade el template del layout raíz.
  title: "Noticias de fútbol",
  description:
    "Última hora, análisis y datos del fútbol de clubes: fichajes, jornadas y actualidad de LigaPro, Liga MX, Brasileirão, Liga Argentina, LaLiga, Premier y más.",
  alternates: {
    canonical: `${SITE_URL}/noticias`,
    types: { "application/rss+xml": `${SITE_URL}/noticias/rss.xml` },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/noticias`,
    title: "Noticias de fútbol | Zona de Ligas",
    description:
      "Última hora, análisis y datos del fútbol de clubes. Cobertura editorial diaria de tus ligas.",
    siteName: "Zona de Ligas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noticias de fútbol | Zona de Ligas",
    description: "Última hora y análisis del fútbol de clubes.",
  },
};

// ISR: render once and serve cached HTML for 60s. Cron tick after publishing
// calls revalidatePath('/noticias') to invalidate immediately, so freshness
// stays sub-minute without paying the TTFB tax of force-dynamic on every
// visit. KV stays as the source of truth.
export const revalidate = 60;

export default async function NoticiasPage() {
  const posts = await getAllPublicNoticias();

  // JSON-LD: ItemList of news + Breadcrumbs
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Noticias de fútbol",
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
      {/* Banner discreto pidiendo opt-in de Web Push tras 3 visitas. */}
      <PushOptInBanner />
    </>
  );
}
