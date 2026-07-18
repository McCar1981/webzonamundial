import type { MetadataRoute } from "next";
import { getAllSlugs as getAllSeleccionSlugs, GRUPOS } from "@/data/selecciones";
import { getAllSedeSlugs } from "@/data/sedes";
import { getAllMomentSlugs } from "@/data/momentos-iconicos";
import { getAllPublicNoticias } from "@/lib/noticias-store";
import { getAllPosts as getAllBlogPosts } from "@/lib/blog";
import { MATCHES } from "@/data/matches";
import { matchSlug } from "@/lib/match-center/slug";
import { COMPETITIONS } from "@/data/competitions";
import {
  getAllEdiciones,
  getAllJugadoresLegendarios,
  getAllSeleccionesHistoricas,
} from "@/lib/content/ediciones";

const BASE_URL = "https://zonamundial.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // lastModified solo en superficies VIVAS (cambian de verdad a diario durante
  // el torneo): home, calendario, grupos, noticias, blog y mejores terceros.
  // En el resto se OMITE: un lastmod "siempre hoy" en 400+ URLs diluye la
  // señal de frescura ante Google (auditoría SEO 11-jun). Noticias y posts
  // llevan su fecha real más abajo.
  const lastModified = new Date();

  // Rutas estáticas principales
  // NOTA AdSense: /la-app, /premium, /tutoriales, /descarga, /formato y
  // /herramientas tienen contenido funcional con poca prosa editorial.
  // Están marcadas robots:noindex,follow y EXCLUIDAS del sitemap para no
  // dar señales contradictorias a Google. Cuando el contenido editorial
  // de esas páginas sea sustancial, reactivar aquí + quitar el noindex.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/registro`, changeFrequency: "monthly", priority: 0.9 },
    // Landing del plan Pro (la única página que vende suscripciones). Con su
    // canonical propio ya no es duplicado de la home; entra al sitemap para
    // captar búsqueda transaccional ("app predicciones pro", etc.).
    { url: `${BASE_URL}/pro`, changeFrequency: "monthly", priority: 0.8 },
    // Puente a la próxima temporada de ligas de clubes: capta búsqueda de marca
    // ("zona futbol") y da destino al tráfico del Mundial cuando acabe (waitlist).
    { url: `${BASE_URL}/zona-futbol-preview`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/calendario`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/grupos`, lastModified, changeFrequency: "daily", priority: 0.9 },
    // Tabla viva de mejores terceros: cambia con cada resultado de grupos.
    { url: `${BASE_URL}/grupos/mejores-terceros`, lastModified, changeFrequency: "daily", priority: 0.85 },
    // Cuadro de dieciseisavos: los 16 cruces, fechas y sedes (ronda de 32).
    { url: `${BASE_URL}/dieciseisavos-mundial-2026`, lastModified, changeFrequency: "daily", priority: 0.85 },
    // Cuadro de octavos (ronda de 16): se vuelca con los ganadores de dieciseisavos.
    { url: `${BASE_URL}/octavos-de-final-mundial-2026`, lastModified, changeFrequency: "daily", priority: 0.85 },
    // Escenarios de la última jornada: qué necesita cada selección + simulador.
    // Cambia con cada resultado de grupos; capta "qué necesita X para clasificar".
    { url: `${BASE_URL}/que-necesita-cada-seleccion-mundial-2026`, lastModified, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE_URL}/selecciones`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/sedes`, changeFrequency: "weekly", priority: 0.8 },
    // Landings de juego indexables (auditoría SEO 11-jun): quiniela = hueco
    // transaccional con SERPs débiles; bracket ataca "simulador mundial 2026".
    { url: `${BASE_URL}/quiniela-mundial-2026`, changeFrequency: "weekly", priority: 0.9 },
    // Landing pública de Predicciones: capta "predicción/pronóstico mundial 2026"
    // (~24k impr/sem que hoy caen al home, GSC 22-jun). Es la vía del Gran Premio.
    { url: `${BASE_URL}/prediccion-mundial-2026`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/bracket`, changeFrequency: "weekly", priority: 0.85 },
    // Landing pública del Fantasy: el juego vive en /app (noindex); esta capta
    // "fantasy mundial 2026" (~7,5k impr/sem que hoy no capturamos, GSC 22-jun).
    { url: `${BASE_URL}/fantasy-mundial-2026`, changeFrequency: "weekly", priority: 0.85 },
    // Hub /historia + 36 subpáginas temáticas (base de datos del Mundial)
    { url: `${BASE_URL}/historia`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/historia/2026`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/historia/campeones`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/momentos-iconicos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/arbitros`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/balones`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/best-xi`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/buscar`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/historia/camisetas`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/cancelados`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/historia/comparar`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/comparar-jugadores`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/confederaciones`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/curiosidades`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/economia`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/entrenadores`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/eras`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/estadios`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/goleadores`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/goles`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/hat-tricks`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/jugadores`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/historia/mascotas`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/historia/momentos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/notables`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/partidos-legendarios`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/polemicas`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/premios`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/quiz`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/records`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/sedes-2026`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/selecciones`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/historia/sociopolitica`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/historia/trofeos`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/historia/visualizaciones`, changeFrequency: "monthly", priority: 0.6 },
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
    { url: `${BASE_URL}/sobre`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contacto`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/accesibilidad`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/eliminar-cuenta`, changeFrequency: "yearly", priority: 0.3 },
    // Legales (índice bajo pero deben existir)
    { url: `${BASE_URL}/legal/aviso-legal`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/eula`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/terminos`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Rutas dinámicas: selecciones (48+ equipos)
  const seleccionRoutes: MetadataRoute.Sitemap = getAllSeleccionSlugs().map((slug) => ({
    url: `${BASE_URL}/selecciones/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Rutas dinámicas: sedes (16 ciudades)
  const sedeRoutes: MetadataRoute.Sitemap = getAllSedeSlugs().map((slug) => ({
    url: `${BASE_URL}/sedes/${slug}`,
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

  // Rutas dinámicas: momentos icónicos
  const momentoRoutes: MetadataRoute.Sitemap = getAllMomentSlugs().map((slug) => ({
    url: `${BASE_URL}/historia/momentos-iconicos/${slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Rutas dinámicas: 23 ediciones del Mundial (1930–2026)
  const edicionRoutes: MetadataRoute.Sitemap = getAllEdiciones().map((e) => ({
    url: `${BASE_URL}/historia/${e.meta.slug}`,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  // Rutas dinámicas: 25 jugadores legendarios
  const jugadorLegRoutes: MetadataRoute.Sitemap = getAllJugadoresLegendarios().map((j) => ({
    url: `${BASE_URL}/historia/jugadores/${j.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Rutas dinámicas: 8 selecciones históricas campeonas perfiladas
  const seleccionHistRoutes: MetadataRoute.Sitemap = getAllSeleccionesHistoricas().map((s) => ({
    url: `${BASE_URL}/historia/selecciones/${s.slug}`,
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

  // Rutas dinámicas: páginas públicas de partido (solo con equipos reales;
  // los slots de cuadro aún sin asignar dan 404 y NO se listan).
  const partidoRoutes: MetadataRoute.Sitemap = MATCHES
    .filter((m) => m.i < 9000 && m.hf !== "tbd" && m.af !== "tbd")
    .map((m) => matchSlug(m.i))
    .filter((s): s is string => !!s)
    .map((slug) => ({
      url: `${BASE_URL}/partido/${slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  // Zona de Ligas: pantalla pública por competición (activo SEO programático del
  // pivote — "liga mx calendario", "brasileirão resultados"…). Datos del catálogo.
  const ligaRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/ligas`, changeFrequency: "daily", priority: 0.85 },
    ...COMPETITIONS.map((c) => ({
      url: `${BASE_URL}/ligas/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  return [
    ...staticRoutes,
    ...ligaRoutes,
    ...partidoRoutes,
    ...seleccionRoutes,
    ...sedeRoutes,
    ...grupoRoutes,
    ...momentoRoutes,
    ...edicionRoutes,
    ...jugadorLegRoutes,
    ...seleccionHistRoutes,
    ...noticiaRoutes,
    ...blogRoutes,
  ];
}
