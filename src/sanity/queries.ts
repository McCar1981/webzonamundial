import { groq } from "next-sanity";

// Todos los campos de una noticia (sin body para listados)
const noticiaFields = groq`
  _id,
  title,
  "slug": slug.current,
  excerpt,
  cat,
  date,
  readTime,
  flags,
  featured,
  "mainImage": mainImage{
    ...,
    "url": asset->url,
    "alt": alt,
    "caption": caption,
    "source": source
  },
  externalImageUrl
`;

// Listado de noticias
export const NOTICIAS_QUERY = groq`
  *[_type == "noticia"] | order(date desc) {
    ${noticiaFields}
  }
`;

// Noticias destacadas
export const NOTICIAS_FEATURED_QUERY = groq`
  *[_type == "noticia" && featured == true] | order(date desc)[0...6] {
    ${noticiaFields}
  }
`;

// Noticias por categoría
export const NOTICIAS_BY_CAT_QUERY = groq`
  *[_type == "noticia" && cat == $cat] | order(date desc) {
    ${noticiaFields}
  }
`;

// Noticia individual con body completo
export const NOTICIA_BY_SLUG_QUERY = groq`
  *[_type == "noticia" && slug.current == $slug][0] {
    ${noticiaFields},
    body
  }
`;

// Slugs para generateStaticParams
export const NOTICIAS_SLUGS_QUERY = groq`
  *[_type == "noticia"]{ "slug": slug.current }
`;
