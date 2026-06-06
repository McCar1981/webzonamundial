// src/app/b/[barSlug]/kit/test/page.tsx
//
// RUTA DE PRUEBA del Kit de Activación: valida si una imagen base externa
// (plantilla gráfica) sirve como fondo para colocar encima los datos dinámicos
// del bar (logo, QR, premio, URL corta) mediante HTML/CSS en posiciones
// absolutas. NO rediseña ni modifica la imagen; solo la usa de background.
//
// Imagen base: public/assets/bar-kit/premium-test.png (1122 × 1402 px).
//
// Validaciones: usuario autenticado y dueño del bar; el bar existe; el QR existe.
// SIN AdSense, noindex.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth-helpers";
import { getBarBySlug, listPrizes, getMainQr } from "@/lib/bars/store";
import { siteOrigin } from "@/lib/bars/kit";
import TestToolbar from "./TestToolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prueba de cartel (kit) · ZonaMundial",
  robots: { index: false, follow: false },
};

// Lienzo exacto de la imagen base.
const W = 1122;
const H = 1402;
const BASE_IMG = "/assets/bar-kit/premium-test.png";
const PREVIEW_MAX_W = 820;

export default async function KitTestPage({ params }: { params: { barSlug: string } }) {
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
  const prizeText = mainPrize?.title ?? "Premio del bar";

  const scale = Math.min(1, PREVIEW_MAX_W / W);
  const pageUrl = `${origin}/b/${bar.slug}/kit/test`;

  return (
    <>
      <style>{`
        @page { size: ${W}px ${H}px; margin: 0; }
        html, body { background: #e5e7eb; }
        @media print {
          html, body { background: #fff !important; }
          .kit-toolbar { display: none !important; }
          .kit-stage { padding: 0 !important; background: #fff !important; min-height: 0 !important; }
          .kit-scale { transform: none !important; }
          .kit-scale-wrap { width: auto !important; height: auto !important; }
        }
      `}</style>

      <TestToolbar publicUrl={pageUrl} />

      <main
        className="kit-stage"
        style={{ background: "#e5e7eb", minHeight: "100vh", padding: "72px 12px 24px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}
      >
        <div className="kit-scale-wrap" style={{ width: W * scale, height: H * scale }}>
          <div className="kit-scale" style={{ transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
            {/* Lienzo: imagen base + overlays absolutos */}
            <div
              style={{
                position: "relative", width: W, height: H, overflow: "hidden",
                backgroundImage: `url(${BASE_IMG})`, backgroundSize: "cover", backgroundPosition: "center",
                backgroundColor: "#07101F", color: "#F8FAFC",
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              }}
            >
              {/* 1) LOGO DEL BAR */}
              <div style={{ position: "absolute", left: 165, top: 85, width: 790, height: 230, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {bar.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bar.logo_url} alt={bar.name} style={{ maxWidth: "90%", maxHeight: "85%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 64, fontWeight: 900, color: "#f6d36b", textAlign: "center", textShadow: "0 3px 8px rgba(0,0,0,.8)", padding: "0 16px", lineHeight: 1.05 }}>
                    {bar.name}
                  </span>
                )}
              </div>

              {/* 2) PREMIO ACTIVO */}
              <div
                style={{
                  position: "absolute", left: 100, top: 840, width: 460, height: 260,
                  display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                  padding: 32, fontWeight: 800, fontSize: 38, lineHeight: 1.1, color: "#f6d36b",
                  textShadow: "0 3px 8px rgba(0,0,0,.8)", overflow: "hidden",
                }}
              >
                {prizeText}
              </div>

              {/* 3) QR DINÁMICO */}
              <div style={{ position: "absolute", left: 695, top: 800, width: 300, height: 300, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR de la porra" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>

              {/* 4) URL CORTA */}
              <div
                style={{
                  position: "absolute", left: 675, top: 1190, width: 370, height: 55,
                  display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                  fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: ".02em",
                  textShadow: "0 2px 4px rgba(0,0,0,.8)",
                }}
              >
                {shortUrl}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
