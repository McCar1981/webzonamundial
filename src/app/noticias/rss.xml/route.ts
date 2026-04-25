import { getNoticiasSorted } from "@/data/noticias";
import { getAuthor } from "@/data/noticias-authors";

const SITE_URL = "https://zonamundial.app";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = getNoticiasSorted();
  const xmlItems = items
    .map((n) => {
      const url = `${SITE_URL}/noticias/${n.slug}`;
      const pub = new Date(`${n.date}T08:00:00.000Z`).toUTCString();
      return `
    <item>
      <title>${escapeXml(n.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pub}</pubDate>
      <author>noreply@zonamundial.app (${escapeXml(getAuthor(n.authorId).name)})</author>
      <category>${escapeXml(n.cat)}</category>
      <description><![CDATA[${n.excerpt}]]></description>
      ${n.realImage ? `<enclosure url="${escapeXml(n.realImage)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ZonaMundial — Noticias del Mundial 2026</title>
    <link>${SITE_URL}/noticias</link>
    <description>Última hora, análisis y guías sobre la Copa del Mundo 2026.</description>
    <language>es-ES</language>
    <atom:link href="${SITE_URL}/noticias/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${xmlItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

export const revalidate = 600;
