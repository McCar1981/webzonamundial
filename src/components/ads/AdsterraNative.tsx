"use client";

// Adsterra Native Banner — puente de monetización durante el Mundial.
//
// No renderiza NADA hasta que se definan las dos variables de entorno con los
// datos que da el panel de Adsterra al crear el bloque "Native Banner":
//   NEXT_PUBLIC_ADSTERRA_NATIVE_SRC          → la URL del invoke.js (//plXX…/invoke.js)
//   NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER_ID → el id del <div> (container-XXXX)
//
// Gating (igual que AdSense en layout.tsx):
//   - enabled=false (founder o sin ADSENSE) → no carga.
//   - rutas excluidas (/bracket limpio + zonas privadas) → no carga.
//   - script async, data-cfasync="false" (Cloudflare Rocket Loader off).
//
// SPA / cambio de página: Next.js NO re-ejecuta los <script> en navegaciones de
// cliente (solo en carga inicial y recarga). El invoke.js de Adsterra rellena el
// contenedor UNA sola vez, así que al cambiar de ruta el banner desaparecía.
// Por eso inyectamos el script a mano en CADA cambio de ruta: limpiamos el
// contenedor, recreamos el <div> destino y añadimos un <script> fresco → fuerza
// el re-render del banner en cada página (y evita banners duplicados/apilados).

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SRC = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_SRC;
const CONTAINER_ID = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER_ID;

// Rutas SIN publicidad. Filosofía: monetizar TODO lo que tiene tráfico
// (editorial + webapp + bracket) con una sola franja nativa discreta, y dejar
// limpias solo las áreas privadas/funcionales y las páginas de venta (para no
// distraer de la conversión).
const EXCLUDED_PREFIXES = [
  "/embed", // widgets embebidos en sitios de terceros
  "/admin",
  "/cuenta",
  "/onboarding",
  "/studio",
  "/founders", // página de venta — no distraer de la compra
  "/premium", // página de venta — no distraer de la compra
  "/login",
  "/eliminar-cuenta",
];

export default function AdsterraNative({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const excluded = EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const active = enabled && Boolean(SRC) && Boolean(CONTAINER_ID) && !excluded;

  useEffect(() => {
    if (!active) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Render limpio: contenedor vacío que el invoke.js volverá a rellenar.
    wrapper.innerHTML = "";
    const container = document.createElement("div");
    container.id = CONTAINER_ID as string;
    wrapper.appendChild(container);

    // Script FRESCO en cada navegación: el navegador re-ejecuta los <script>
    // insertados dinámicamente, así Adsterra vuelve a pintar el banner.
    const script = document.createElement("script");
    script.src = SRC as string;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, [pathname, active]);

  if (!active) return null;

  return <div ref={wrapperRef} style={{ maxWidth: 970, margin: "0 auto", padding: "8px 0" }} />;
}
