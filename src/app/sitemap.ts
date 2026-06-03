import type { MetadataRoute } from "next";
import { getAllSlugs as getAllSeleccionSlugs, GRUPOS } from "@/data/selecciones";
import { getAllSedeSlugs } from "@/data/sedes";
import { CREADORES } from "@/data/creadores";
import { getAllMomentSlugs } from "@/data/momentos-iconicos";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import { getAllPosts as getAllBlogPosts } from "@/lib/blog";
import {
  getAllEdiciones,
  getAllJugadoresLegendarios,
  getAllSeleccionesHistoricas,
} from "@/lib/content/ediciones";

const BASE_URL = "https://zonamundial.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Rutas estáticas principales
  // NOTA AdSense: /la-app, /premium, /tutoriales, /descarga, /formato y
  // /herramientas tienen contenido funcional con poca prosa editorial.
  // Están marcadas robots:noindex,follow y EXCLUIDAS del sitemap para no
  // dar señales contradictorias a Google. Cuando el contenido editorial
  // de esas páginas sea sustancial, reactivar aquí + quitar el noindex.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/registro`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/creadores`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/calendario`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/grupos`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/selecciones`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/sedes`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    // Hub /historia + 36 subpáginas temáticas (base de datos del Mundial)
    { url: `${BASE_URL}/historia`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/historia/2026`, lastModified, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/historia/campeones`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/momentos-iconicos`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/arbitros`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/balones`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/best-xi`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/buscar`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/historia/camisetas`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/cancelados`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/historia/comparar`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/comparar-jugadores`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/confederaciones`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/curiosidades`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/economia`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/entrenadores`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/eras`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/estadios`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/goleadores`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/goles`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/hat-tricks`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/jugadores`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/historia/mascotas`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/historia/momentos`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/notables`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/partidos-legendarios`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/polemicas`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/premios`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/quiz`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/records`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/sedes-2026`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/selecciones`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/sociopolitica`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/trofeos`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/historia/visualizaciones`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    // /formato, /datos/formato-2026, /herramientas, /tutoriales: excluidos.
    // Las dos primeras son páginas funcionales con poca prosa; las dos últimas
    // están marcadas noindex. Reactivar cuando se enriquezcan editorialmente.
    { url: `${BASE_URL}/blog`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/noticias`, lastModified, changeFrequency: "daily", priority: 0.8 },
    // /app/* (mockups del producto sin contenido sustancial — actualmente
    // noindex via src/app/app/layout.tsx hasta que cada módulo tenga
    // contenido real. NO listar en sitemap mientras tanto, así Google no
    // recibe señales contradictorias).
    // Páginas corporativas (alta prioridad para AdSense / trust / Apple)
    { url: `${BASE_URL}/sobre`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/accesibilidad`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/eliminar-cuenta`, lastModified, changeFrequency: "yearly", priority: 0.3 },
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

  // Rutas dinámicas: 23 ediciones del Mundial (1930–2026)
  const edicionRoutes: MetadataRoute.Sitemap = getAllEdiciones().map((e) => ({
    url: `${BASE_URL}/historia/${e.meta.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  // Rutas dinámicas: 25 jugadores legendarios
  const jugadorLegRoutes: MetadataRoute.Sitemap = getAllJugadoresLegendarios().map((j) => ({
    url: `${BASE_URL}/historia/jugadores/${j.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Rutas dinámicas: 8 selecciones históricas campeonas perfiladas
  const seleccionHistRoutes: MetadataRoute.Sitemap = getAllSeleccionesHistoricas().map((s) => ({
    url: `${BASE_URL}/historia/selecciones/${s.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Rutas dinámicas: noticias individuales (estáticas + auto-publicadas)
  const allNoticias = await getAllPublicNoticias();
  const noticiaRoutes: MetadataRoute.Sitemap = allNoticias.map((n) => ({
    url: `${BASE_URL}/noticias/${n.slug}`,
    lastModified: new Date(`${n.updatedAt || n.date}T00:00:00.000Z`),
    changeFrequency: "weekly",
    priority: n.featured ? 0.85 : 0.7,
  }));

  // Rutas dinámicas: blog editorial (publicados por publishedAt <= now).
  // Se EXCLUYEN los marcados noindex (despublicados por la auditoría de
  // calidad): no deben aparecer en el sitemap si no se indexan.
  const allBlogPosts = (await getAllBlogPosts()).filter((p) => !p.noindex);
  const blogRoutes: MetadataRoute.Sitemap = allBlogPosts.map((p) => ({
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
    ...edicionRoutes,
    ...jugadorLegRoutes,
    ...seleccionHistRoutes,
    ...noticiaRoutes,
    ...blogRoutes,
  ];
}
