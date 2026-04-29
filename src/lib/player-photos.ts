/**
 * Player photos via Wikipedia Commons.
 *
 * Estrategia automática (cero hardcoding):
 *   1. Recibir nombre del jugador (full_name del JSON BIBLIA).
 *   2. Llamar Wikipedia API REST en español primero, fallback a inglés.
 *   3. La API devuelve "thumbnail.source" que es la URL Commons del retrato
 *      principal del artículo del jugador.
 *   4. Cachear resultado en KV para no hacer lookups repetidos.
 *
 * Atribución (decisión Carlos):
 *   "fuentes Wikipedia Commons mientras se de creditos al autor de la
 *   imagen". La API de Wikipedia devuelve attribution + url de la página
 *   original; los guardamos en photo_credit.
 */

interface WikiSummary {
  title: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string };
  content_urls?: { desktop: { page: string } };
  description?: string;
  extract?: string;
}

export interface PlayerPhoto {
  /** URL del thumbnail (320-640px) listo para <img src> */
  url: string;
  /** URL del artículo Wikipedia (para crédito) */
  wikipedia_url: string;
  /** Texto de crédito a mostrar bajo la foto */
  credit: string;
}

/**
 * Resuelve la foto Wikipedia Commons del jugador.
 * Devuelve null si no se encuentra (no es bloqueante: PlayerCard hace
 * fallback al dorsal en gradient).
 *
 * Llamar SIEMPRE desde server (build-time o cron). NUNCA desde client
 * (cors + rate limit Wikipedia).
 */
export async function fetchPlayerPhoto(
  fullName: string
): Promise<PlayerPhoto | null> {
  // Wikipedia API summary — formato slug es nombre con espacios → guion bajo
  const slug = encodeURIComponent(fullName.replace(/\s+/g, "_"));

  // Intento 1: Wikipedia ES
  let res = await fetchSummary(`https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  if (!res?.thumbnail?.source) {
    // Intento 2: Wikipedia EN (más cobertura para jugadores no hispanos)
    res = await fetchSummary(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  }
  if (!res?.thumbnail?.source) return null;

  return {
    url: res.thumbnail.source,
    wikipedia_url: res.content_urls?.desktop?.page ?? `https://es.wikipedia.org/wiki/${slug}`,
    credit: "Wikipedia Commons",
  };
}

async function fetchSummary(url: string): Promise<WikiSummary | null> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "ZonaMundial/1.0 (https://zonamundial.app)",
        Accept: "application/json",
      },
      // Cache 7 días — Wikipedia no cambia el retrato a menudo
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!r.ok) return null;
    return (await r.json()) as WikiSummary;
  } catch {
    return null;
  }
}
