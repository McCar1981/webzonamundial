/**
 * Imagen de tarjeta para noticias.
 *
 * La política de copyright (noticias-image-policy) descarta las fotos de los
 * medios (GNews), por lo que muchas piezas auto-ingeridas quedan sin
 * `realImage`. Para que TODA noticia muestre foto y el listado sea atractivo,
 * caemos a una foto propia del Mundial (estadios/ambiente, assets locales =
 * copyright-safe), elegida de forma DETERMINISTA por id para dar variedad
 * estable entre tarjetas sin repetir siempre la misma.
 *
 * La propia política ya anticipa este caso: «...o con la imagen de respaldo
 * propia donde el layout la requiera» (noticias-image-policy.ts).
 */

/** Pool de fotos propias genéricas (no atadas a un partido/selección concreto,
 *  para no implicar que ilustran ESA noticia). Todas viven en /public. */
const FALLBACK_NOTICIA_IMAGES = [
  "/img/heroes/hero-stadium.webp",
  "/img/heroes/ball-stadium-pitch.webp",
  "/img/heroes/why-different-stadium.webp",
  "/img/hero/stadium.webp",
  "/img/matchcenter/riazor.jpg",
] as const;

/**
 * Devuelve la URL de imagen a mostrar en la tarjeta/hero de una noticia:
 * la foto licenciada si existe, o un respaldo propio determinista por id.
 * SIEMPRE devuelve una URL (nunca undefined) → toda noticia muestra foto.
 */
export function noticiaCardImage(
  realImage: string | null | undefined,
  seed: number,
): string {
  if (realImage) return realImage;
  const pool = FALLBACK_NOTICIA_IMAGES;
  const idx = ((Math.trunc(seed) % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

/** true si la noticia no tiene foto propia del medio y se usó un respaldo. */
export function isFallbackImage(realImage: string | null | undefined): boolean {
  return !realImage;
}
