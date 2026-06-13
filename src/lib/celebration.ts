// Micro-celebración compartida para los "beats" de hábito que mueven la
// retención: bloquear una predicción, reclamar la recompensa diaria, mantener
// la racha, acertar en trivia. Da un golpe de dopamina (visual + háptico) en
// móvil (67% de usuarios) sin convertir la acción en un formulario.
//
// Todo respeta prefers-reduced-motion y hace feature-detection de la vibración,
// así que es un no-op seguro donde no aplica (SSR, desktop sin vibración, etc.).

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Vibración corta en móviles compatibles. Silencioso si no hay soporte o reduced-motion. */
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (prefersReducedMotion()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* algunos navegadores lanzan si está bloqueado por política — ignorar */
  }
}

/** Pop dorado de un solo disparo sobre un elemento (toggle de la clase .zm-celebrate). */
export function celebratePop(el: HTMLElement | null | undefined): void {
  if (!el || prefersReducedMotion()) return;
  el.classList.remove("zm-celebrate");
  // Forzar reflow para poder re-disparar la animación si ya estaba aplicada.
  void el.offsetWidth;
  el.classList.add("zm-celebrate");
  window.setTimeout(() => el.classList.remove("zm-celebrate"), 600);
}

/** Conveniencia: háptica + pop juntos para un beat de éxito. */
export function celebrate(el?: HTMLElement | null, pattern: number | number[] = 10): void {
  haptic(pattern);
  celebratePop(el);
}
