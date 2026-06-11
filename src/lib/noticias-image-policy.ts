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

/** true si la URL puede servirse en el sitio público sin riesgo de copyright. */
export function isAllowedNoticiaImage(url: string | undefined): boolean {
  if (!url) return false;
  // Assets locales del propio deploy.
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.has(parsed.hostname.toLowerCase());
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
