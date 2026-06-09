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

import Script from "next/script";
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

  if (!enabled || !SRC || !CONTAINER_ID) return null;
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <div style={{ maxWidth: 970, margin: "0 auto", padding: "8px 0" }}>
      <div id={CONTAINER_ID} />
      <Script
        id="adsterra-native"
        src={SRC}
        strategy="afterInteractive"
        async
        data-cfasync="false"
      />
    </div>
  );
}
