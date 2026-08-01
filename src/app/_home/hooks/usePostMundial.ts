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

import { MUNDIAL_OVER_MS } from "@/lib/season-gate";

// Re-export para consumidores que ya lo importaban desde aquí.
export { MUNDIAL_OVER_MS };

// La fecha del gate (20-jul-2026 06:00 UTC) YA PASÓ: se cablea a `true` fijo.
//
// Antes arrancaba en `false` y saltaba a `true` tras montar, así que TODAS las
// visitas —el 100%— pintaban primero la variante Mundial (hero "Tu centro vivo
// del Mundial", banners de calendario, bracket, guía y álbum) y la sustituían
// un instante después: parpadeo garantizado y salto de maquetación, que en
// Android de gama media (87% de la audiencia) se nota.
//
// Al devolver una constante, la variante Ligas queda horneada en el HTML
// estático: sin parpadeo, sin salto y sin trabajo de hidratación. Se conserva
// el hook —en vez de borrar las llamadas— para no tocar sus tres consumidores
// y poder revertir desde un solo sitio si hiciera falta.
export function usePostMundial(): boolean {
  return true;
}
