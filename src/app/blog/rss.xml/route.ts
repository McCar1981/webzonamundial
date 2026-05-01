// src/app/blog/rss.xml/route.ts
// RSS 2.0 feed del blog editorial. Cacheado 1h.

import { getAllPosts } from "@/lib/blog";

const SITE = "https://zonamundial.app";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 3600;

export async function GET() {
  const posts = getAllPosts().slice(0, 30);
  const lastBuild = posts.length > 0 ? new Date(posts[0].publishedAt) : new Date();
  const items = posts
    .map((p) => {
      const link = `${SITE}/blog/${p.slug}`;
      const date = new Date(p.publishedAt).toUTCString();
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      <author>editorial@zonamundial.app (Editorial Zona Mundial)</author>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.description)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog Editorial ZonaMundial</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Análisis y datos editoriales del Mundial 2026 — firmado por Editorial Zona Mundial.</description>
    <language>es</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
