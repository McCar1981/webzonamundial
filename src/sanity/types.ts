// Tipo unificado para noticias (Sanity + datos estáticos)
export interface Post {
  id: string | number;
  title: string;
  excerpt: string;
  cat: string;
  date: string;
  readTime: number;
  flags: string[];
  featured: boolean;
  realImage?: string;
  imageCaption?: string;
  imageSource?: string;
  slug?: string;
}

// Tipo raw de Sanity
export interface SanityNoticia {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  cat: string;
  date: string;
  readTime: number;
  flags?: string[];
  featured?: boolean;
  mainImage?: {
    url: string;
    alt?: string;
    caption?: string;
    source?: string;
  };
  externalImageUrl?: string;
  body?: unknown[];
}

// Convierte SanityNoticia al tipo Post unificado
export function sanityNoticiaToPost(n: SanityNoticia): Post {
  const imageUrl = n.mainImage?.url || n.externalImageUrl;
  return {
    id: n._id,
    title: n.title,
    excerpt: n.excerpt,
    cat: n.cat,
    date: n.date,
    readTime: n.readTime,
    flags: n.flags || [],
    featured: n.featured || false,
    realImage: imageUrl,
    imageCaption: n.mainImage?.caption,
    imageSource: n.mainImage?.source,
    slug: n.slug,
  };
}
