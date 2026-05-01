// src/app/blog/page.tsx
// Blog editorial ZonaMundial — hub con featured + grid + filtros.
// Server component que pasa los posts publicados a BlogHub (client).

import { getAllPosts } from "@/lib/blog";
import BlogHub from "@/components/blog/BlogHub";

// ISR cada 5 min: suficiente para que un publishedAt futuro se active sin
// nuevo deploy. Programación de M-J-S queda automática.
export const revalidate = 300;

export default async function BlogPage() {
  const posts = getAllPosts();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Blog Editorial ZonaMundial",
    itemListElement: posts.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://zonamundial.app/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <BlogHub posts={posts} />
    </>
  );
}
