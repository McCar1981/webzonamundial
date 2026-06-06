"use client";

import { useEffect } from "react";

/**
 * Refuerza la sensación de "app nativa" en la webapp:
 *  - Bloquea el menú contextual (clic derecho → "Buscar en Google con…").
 *  - Bloquea copy/cut de texto fuera de campos editables.
 *  - Bloquea select-all (Ctrl/Cmd+A) fuera de campos editables.
 *
 * Los campos editables (input/textarea/select/contenteditable) se respetan para
 * no romper formularios: el usuario sigue pudiendo escribir, copiar y pegar ahí.
 * El CSS (globals.css) ya impide la selección visual; esto cierra las vías por
 * teclado y por menú contextual.
 */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export default function NativeAppGuard() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onCopyCut = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onSelectStart = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+A (seleccionar todo) fuera de campos editables.
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A") && !isEditable(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopyCut);
    document.addEventListener("cut", onCopyCut);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopyCut);
      document.removeEventListener("cut", onCopyCut);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
