/**
 * Google News sitemap.
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 *
 * Lists only articles published within the last 2 days, as required by Google News.
 * Each entry includes <news:publication>, <news:publication_date>, <news:title>.
 */

import { getAllPublicNoticias } from "@/lib/noticias-store";

const BASE_URL = "https://zonamundial.app";
const PUBLICATION_NAME = "ZonaMundial";
const PUBLICATION_LANG = "es";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = await getAllPublicNoticias();
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000; // last 2 days

  const recent = items.filter((n) => {
    const t = new Date(`${n.date}T08:00:00.000Z`).getTime();
    return t >= cutoff;
  });

  const xmlItems = recent
    .map((n) => {
      const url = `${BASE_URL}/noticias/${n.slug}`;
      const pub = `${n.date}T08:00:00.000Z`;
      const tags = (n.tags || []).slice(0, 5).join(", ");
      return `
  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${escapeXml(n.title)}</news:title>${
        tags ? `\n      <news:keywords>${escapeXml(tags)}</news:keywords>` : ""
      }
    </news:news>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${xmlItems}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export const dynamic = "force-dynamic";
