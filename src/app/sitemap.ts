import type { MetadataRoute } from "next";
import { getAllSlugs as getAllSeleccionSlugs, GRUPOS } from "@/data/selecciones";
import { getAllSedeSlugs } from "@/data/sedes";
import { CREADORES } from "@/data/creadores";
import { getAllMomentSlugs } from "@/data/momentos-iconicos";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import { getAllPosts as getAllBlogPosts } from "@/lib/blog";

const BASE_URL = "https://zonamundial.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/la-app`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/premium`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/registro`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/creadores`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/calendario`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/grupos`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/selecciones`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/sedes`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/historia`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/campeones`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/momentos-iconicos`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/formato`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/datos/formato-2026`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/herramientas`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/tutoriales`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/noticias`, lastModified, changeFrequency: "daily", priority: 0.8 },
    // /app/* (mockups del producto sin contenido sustancial — actualmente
    // noindex via src/app/app/layout.tsx hasta que cada módulo tenga
    // contenido real. NO listar en sitemap mientras tanto, así Google no
    // recibe señales contradictorias).
    // Legales (índice bajo pero deben existir)
    { url: `${BASE_URL}/legal/aviso-legal`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/eula`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/privacidad`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/terminos`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Rutas dinámicas: selecciones (48+ equipos)
  const seleccionRoutes: MetadataRoute.Sitemap = getAllSeleccionSlugs().map((slug) => ({
    url: `${BASE_URL}/selecciones/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Rutas dinámicas: sedes (16 ciudades)
  const sedeRoutes: MetadataRoute.Sitemap = getAllSedeSlugs().map((slug) => ({
    url: `${BASE_URL}/sedes/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Rutas dinámicas: grupos (A–L) — slug pattern: "grupo-a", "grupo-b", ...
  const grupoRoutes: MetadataRoute.Sitemap = Object.keys(GRUPOS).map((letra) => ({
    url: `${BASE_URL}/grupos/grupo-${letra.toLowerCase()}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Rutas dinámicas: creadores (registro personalizado por creator)
  const creadorRoutes: MetadataRoute.Sitemap = CREADORES.map((c) => ({
    url: `${BASE_URL}/registro/${c.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Rutas dinámicas: momentos icónicos
  const momentoRoutes: MetadataRoute.Sitemap = getAllMomentSlugs().map((slug) => ({
    url: `${BASE_URL}/historia/momentos-iconicos/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Rutas dinámicas: noticias individuales (estáticas + auto-publicadas)
  const allNoticias = await getAllPublicNoticias();
  const noticiaRoutes: MetadataRoute.Sitemap = allNoticias.map((n) => ({
    url: `${BASE_URL}/noticias/${n.slug}`,
    lastModified: new Date(`${n.updatedAt || n.date}T00:00:00.000Z`),
    changeFrequency: "weekly",
    priority: n.featured ? 0.85 : 0.7,
  }));

  // Rutas dinámicas: blog editorial (publicados por publishedAt <= now)
  const blogRoutes: MetadataRoute.Sitemap = getAllBlogPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.publishedAt),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [
    ...staticRoutes,
    ...seleccionRoutes,
    ...sedeRoutes,
    ...grupoRoutes,
    ...creadorRoutes,
    ...momentoRoutes,
    ...noticiaRoutes,
    ...blogRoutes,
  ];
}
