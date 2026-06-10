// src/app/app/modo-carrera/jugar/useModalA11y.ts
// A11y mínima compartida por los modales del Modo Carrera: al abrir, mueve el
// foco DENTRO del diálogo (sin esto, el teclado/lector de pantalla se queda en
// la página de fondo); Escape ejecuta el cierre seguro si se pasa uno; y al
// cerrar devuelve el foco al elemento que lo tenía (normalmente el botón que
// abrió el modal). Usar junto a role="dialog" aria-modal="true" y tabIndex={-1}
// en el elemento al que se asigna el ref.

"use client";

import { useEffect, useRef } from "react";

/**
 * @param onClose Cierre seguro a ejecutar con Escape; sin él, Escape no hace nada
 *   (p. ej. decisiones obligatorias o fases de partido sin vuelta atrás).
 * @param open Para diálogos renderizados condicionalmente DENTRO de una vista que
 *   ya está montada (SeasonView): pasa aquí la condición de apertura para que el
 *   foco se mueva al abrirse, no al montar la vista. Los modales que se montan
 *   como componente propio pueden omitirlo.
 */
export function useModalA11y<T extends HTMLElement>(onClose?: () => void, open = true) {
  const ref = useRef<T | null>(null);
  // Última versión del cierre sin re-suscribir el listener en cada render (los
  // callers suelen pasar arrows inline) ni re-robar el foco.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  return ref;
}
