// /descarga — Landing dedicada para que los users descubran ZonaMundial
// desde el PC, escaneen el QR o se autoenv\u00cden el link al m\u00f3vil.
//
// Flujo:
//   - Desktop \u2192 QR + bot\u00f3n WhatsApp + form email
//   - iOS \u2192 'Pr\u00f3ximamente en App Store' + bot\u00f3n pre-registro
//   - Android \u2192 'Pr\u00f3ximamente en Google Play' + bot\u00f3n pre-registro
//
// La app a\u00fan no est\u00e1 publicada \u2014 todos los botones de tienda apuntan a
// /registro mientras est\u00e9 en pre-registro. Cuando salgan las URLs reales,
// solo hay que cambiar APP_STORE_URL y PLAY_STORE_URL en constants.

import type { Metadata } from "next";
import DescargaClient from "./DescargaClient";
import QRCode from "qrcode";

const SITE_URL = "https://zonamundial.app";
const DOWNLOAD_URL = `${SITE_URL}/descarga`;

export const metadata: Metadata = {
  title: "Descarga ZonaMundial \u2014 La app del Mundial 2026",
  description:
    "Lleva ZonaMundial a tu m\u00f3vil. Escanea el QR o env\u00edate el enlace al email o WhatsApp. Predicciones, fantasy, IA Coach y mucho m\u00e1s.",
  alternates: {
    canonical: DOWNLOAD_URL,
  },
  // Landing de descarga con QR + form (~1.010 palabras). Poca prosa
  // editorial. noindex para evitar que cuente como thin en evaluación AdSense.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: DOWNLOAD_URL,
    title: "Descarga ZonaMundial",
    description:
      "Escanea el QR desde tu m\u00f3vil o env\u00edate el enlace para descargar la app cuando est\u00e9 disponible.",
    siteName: "ZonaMundial",
  },
};

export const revalidate = 86400;

export default async function DescargaPage() {
  // Generamos el SVG del QR server-side para que sea r\u00e1pido (sin lib JS
  // en cliente) y siempre del mismo tama\u00f1o.
  //
  // El QR apunta al SMART LINK \u2014 un endpoint que detecta el sistema
  // operativo del m\u00f3vil que escane\u00f3 y redirige autom\u00e1ticamente:
  //   iPhone   \u2192 App Store
  //   Android  \u2192 Google Play
  //   Otros    \u2192 landing /descarga
  //
  // Ventajas:
  //   1. Estado limpio: un solo QR, no dos (App Store / Play Store).
  //   2. Cero fricci\u00f3n: el usuario apunta, dispara, ya est\u00e1 en su tienda.
  //   3. M\u00e9tricas unificadas: contador en KV por plataforma + source.
  //   4. Future-proof: cuando salgan las URLs reales de las tiendas, solo
  //      cambia 2 constantes en /api/app/redirect/route.ts.
  const qrTarget = `${SITE_URL}/api/app/redirect?utm_source=qr`;
  const qrSvg = await QRCode.toString(qrTarget, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: {
      dark: "#1A1A2E",
      light: "#FFFFFF",
    },
  });

  return <DescargaClient qrSvg={qrSvg} qrTarget={qrTarget} />;
}
