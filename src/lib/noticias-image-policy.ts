/**
 * Política de imágenes de noticias.
 *
 * Las noticias auto-ingeridas de GNews traían `article.image` apuntando al CDN
 * del medio original (lanacion.com.ar, media.cnn.com, infobae.com…). Servir
 * esas fotos en caliente es uso de material con copyright de terceros y fue
 * señalado en la auditoría AdSense del 11-06-2026 como causa probable nº1 de
 * los rechazos del programa.
 *
 * Regla: solo se renderizan imágenes de fuentes con licencia conocida.
 * Cualquier otra URL se descarta y la pieza sale sin foto de cabecera (o con
 * la imagen de respaldo propia donde el layout la requiera).
 */

const ALLOWED_IMAGE_HOSTS = new Set([
  // Propias
  "zonamundial.app",
  "www.zonamundial.app",
  // Wikimedia Commons (CC — usado por la BIBLIA de selecciones y el blog)
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  // Banderas de dominio público
  "flagcdn.com",
  // Media licenciada por la suscripción de api-football
  "media.api-sports.io",
]);

/**
 * Fotos de prensa CON CRÉDITO (decisión editorial 25-07-2026).
 *
 * La lista blanca de arriba hacía que `realImage` fuese `undefined` para todo
 * artículo de GNews (el medio siempre sirve la foto desde su propio CDN), y
 * como la publicación exige `realImage`, NINGUNA noticia ingerida podía llegar
 * a publicarse: se quedaban todas en borrador. Ese era el tapón de fondo del
 * feed.
 *
 * Ahora se admiten las fotos del medio siempre que la pieza acredite la fuente
 * al pie ("Foto: <medio>"), que es la condición que puso Carlos.
 *
 * OJO, contexto que conviene no perder: esta lista blanca nació de la auditoría
 * de AdSense del 11-06-2026, que señaló las imágenes de terceros como causa
 * probable nº1 de los rechazos. Acreditar la fuente es lo correcto
 * editorialmente, pero NO equivale a tener licencia. Si AdSense vuelve a
 * rechazar, este interruptor es el primer sitio donde mirar: basta poner
 * NOTICIAS_PRESS_IMAGES=0 para volver al comportamiento anterior sin desplegar.
 */
export function pressImagesEnabled(): boolean {
  return process.env.NOTICIAS_PRESS_IMAGES !== "0";
}

/** true si la URL puede servirse en el sitio público. */
export function isAllowedNoticiaImage(url: string | undefined): boolean {
  if (!url) return false;
  // Assets locales del propio deploy.
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (ALLOWED_IMAGE_HOSTS.has(parsed.hostname.toLowerCase())) return true;
    // Foto del medio: se acepta si el interruptor está activo. La URL debe ser
    // razonable (sin credenciales ni puerto raro) para no meter basura en el
    // <img> ni en el JSON-LD que lee Google.
    if (!pressImagesEnabled()) return false;
    if (parsed.username || parsed.password || parsed.port) return false;
    if (url.length > 500) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Devuelve la URL solo si está permitida; undefined en caso contrario.
 * Útil en la ingesta para no almacenar hotlinks que luego habría que filtrar.
 */
export function allowedNoticiaImageOrUndefined(
  url: string | undefined,
): string | undefined {
  return isAllowedNoticiaImage(url) ? url : undefined;
}
