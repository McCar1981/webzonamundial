import type { MetadataRoute } from "next";
import { getAllSlugs as getAllSeleccionSlugs, GRUPOS } from "@/data/selecciones";
import { getAllSedeSlugs } from "@/data/sedes";
import { CREADORES } from "@/data/creadores";
import { getAllMomentSlugs } from "@/data/momentos-iconicos";

const BASE_URL = "https://zonamundial.app";

export default function sitemap(): MetadataRoute.Sitemap {
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
    // Apps internas (alta prioridad UX)
    { url: `${BASE_URL}/app/predicciones`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/app/fantasy`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/app/trivia`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/app/ia-coach`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/app/ligas`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/app/rankings`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/app/matchcenter`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/app/streaming`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/app/album`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/app/chat`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/app/micro`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/app/modo-carrera`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/app/stories`, lastModified, changeFrequency: "weekly", priority: 0.6 },
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

  return [
    ...staticRoutes,
    ...seleccionRoutes,
    ...sedeRoutes,
    ...grupoRoutes,
    ...creadorRoutes,
    ...momentoRoutes,
  ];
}
