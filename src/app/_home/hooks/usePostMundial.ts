// usePostMundial — gate del pivote post-Mundial de la home.
//
// La final es el 19-jul-2026 15:00 ET (MetLife). A partir del lunes 20 a las
// 06:00 UTC (madrugada en LATAM, horas después de cualquier prórroga posible)
// la home pasa a modo Ligas SIN necesidad de desplegar: el PR puede mergearse
// antes de la final y el cambio se activa solo.
//
// Se evalúa tras montar, no en render: la home se prerenderiza estática y un
// Date.now() en render se hornearía en build (hydration mismatch + rama vieja).
//
// QA/demo: `?zm-ligas=1` fuerza el modo Ligas en cualquier entorno y fecha
// (para revisar la home del lunes antes del lunes, o enseñarla en reuniones).

import { useEffect, useState } from "react";
import { MUNDIAL_OVER_MS } from "@/lib/season-gate";

// Re-export para consumidores que ya lo importaban desde aquí.
export { MUNDIAL_OVER_MS };

export function usePostMundial(): boolean {
  const [post, setPost] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("zm-ligas") === "1") {
        setPost(true);
        return;
      }
    } catch {
      // sin URL válida: decide el reloj
    }
    if (Date.now() >= MUNDIAL_OVER_MS) setPost(true);
  }, []);
  return post;
}
