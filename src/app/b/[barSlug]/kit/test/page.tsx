// src/app/b/[barSlug]/kit/test/page.tsx
//
// RUTA DE PRUEBA del Kit de Activación. Valida la composición dinámica del
// cartel "Porra Digital del Mundial" usando la imagen de plantilla como FONDO
// (no la rediseña) y colocando encima logo, premio, QR y URL en zonas
// controladas (ver BarKitPosterTemplate).
//
// Imagen base: public/assets/bar-kit/porra-digital-template-4x5.webp (1122×1402).
//
// Parámetros de prueba:
//   ?debug=1                → dibuja bordes/etiquetas en cada zona dinámica
//   ?logoTest=horizontal    → logo horizontal simulado (fondo blanco)
//   ?logoTest=square        → logo cuadrado simulado (fondo blanco)
//   ?logoTest=none          → sin logo (fallback al nombre del bar)
//   (sin logoTest)          → logo real del bar
//
// Validaciones: usuario autenticado y dueño del bar; el bar existe; el QR existe.
// SIN AdSense, noindex.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth-helpers";
import { getBarBySlug, listPrizes, getMainQr } from "@/lib/bars/store";
import { siteOrigin } from "@/lib/bars/kit";
import BarKitPosterTemplate, { POSTER_SIZE } from "@/components/bars/kit/BarKitPosterTemplate";
import { kitTemplateUrlForKind } from "@/lib/bars/kit-image-templates";
import TestToolbar from "./TestToolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prueba de cartel (kit) · ZonaMundial",
  robots: { index: false, follow: false },
};

const PREVIEW_MAX_W = 820;

// Logos simulados (data URL SVG) para validar que la zona aguanta distintos
// formatos sin deformar. Fondo blanco a propósito (peor caso de contraste).
function simulatedLogo(kind: "horizontal" | "square"): string {
  const [w, h] = kind === "horizontal" ? [900, 240] : [420, 420];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="24" fill="#ffffff"/>
    <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="16" fill="none" stroke="#0F1D32" stroke-width="6"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="${kind === "horizontal" ? 110 : 150}" fill="#0F1D32">BAR</text>
    <text x="50%" y="${kind === "horizontal" ? "82%" : "75%"}" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${kind === "horizontal" ? 40 : 56}" fill="#C9A84C">${kind.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default async function KitTestPage({
  params, searchParams,
}: {
  params: { barSlug: string };
  searchParams: { debug?: string; logoTest?: string };
}) {
  const user = await requireUser(`/b/${params.barSlug}/kit/test`);

  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();
  if (bar.owner_user_id !== user.id) redirect("/bar-dashboard");

  const [prizes, mainQr] = await Promise.all([listPrizes(bar.id), getMainQr(bar.id)]);
  const code = mainQr?.code ?? null;
  if (!code) notFound();

  const origin = siteOrigin();
  const qrTarget = `${origin}/r/${code}`;
  const shortUrl = qrTarget.replace(/^https?:\/\//, "");
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    width: 600, margin: 0, color: { dark: "#0A0A0A", light: "#FFFFFF" }, errorCorrectionLevel: "M",
  });

  const mainPrize = prizes.find((p) => p.prize_type === "principal") ?? prizes[0] ?? null;
  const prizeText = mainPrize?.title ?? (bar.kind === "empresa" ? "Premio de la empresa" : "Premio del bar");

  const debug = searchParams.debug === "1";
  const logoTest = searchParams.logoTest;
  const logoUrl =
    logoTest === "none" ? null :
    logoTest === "horizontal" ? simulatedLogo("horizontal") :
    logoTest === "square" ? simulatedLogo("square") :
    bar.logo_url;

  const scale = Math.min(1, PREVIEW_MAX_W / POSTER_SIZE.width);
  const pageUrl = `${origin}/b/${bar.slug}/kit/test`;

  return (
    <>
      <style>{`
        @page { size: ${POSTER_SIZE.width}px ${POSTER_SIZE.height}px; margin: 0; }
        html, body { background: #e5e7eb; }
        .zm-pub-lat { display: none !important; }
        .google-auto-placed, ins.adsbygoogle { display: none !important; }
        @media print {
          html, body { background: #fff !important; }
          .kit-toolbar { display: none !important; }
          .kit-stage { padding: 0 !important; background: #fff !important; min-height: 0 !important; }
          .kit-scale { transform: none !important; }
          .kit-scale-wrap { width: auto !important; height: auto !important; }
        }
      `}</style>

      <TestToolbar publicUrl={pageUrl} debug={debug} logoTest={logoTest ?? null} />

      <main
        className="kit-stage"
        style={{ background: "#e5e7eb", minHeight: "100vh", padding: "112px 12px 24px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}
      >
        <div className="kit-scale-wrap" style={{ width: POSTER_SIZE.width * scale, height: POSTER_SIZE.height * scale }}>
          <div className="kit-scale" style={{ transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
            <BarKitPosterTemplate
              barName={bar.name}
              barLogoUrl={logoUrl}
              qrImageUrl={qrDataUrl}
              prizeTitle={prizeText}
              shortUrl={shortUrl}
              templateUrl={kitTemplateUrlForKind(bar.kind)}
              debug={debug}
            />
          </div>
        </div>
      </main>
    </>
  );
}
