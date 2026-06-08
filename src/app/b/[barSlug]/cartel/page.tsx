// src/app/b/[barSlug]/cartel/page.tsx
//
// Cartel imprimible (A4) del bar — MATERIAL PREMIUM. Solo accesible para el
// dueño del bar y con un plan que incluya premiumMaterials. Pensado para
// imprimir o guardar como PDF y colgar en el local. SIN AdSense, noindex.
//
// Opcional ?code=<qrCode> para imprimir el cartel de una zona concreta
// (multi-QR). Por defecto usa el QR principal del bar.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getBarBySlug, listPrizes, getMainQr, listQrSources } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";
import { getPlan } from "@/lib/bars/plans";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cartel para imprimir · ZonaMundial",
  robots: { index: false, follow: false },
};

function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "zonamundial.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function BarCartelPage({
  params, searchParams,
}: { params: { barSlug: string }; searchParams: { code?: string } }) {
  const user = await requireUser(`/b/${params.barSlug}/cartel`);

  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();
  // Solo el dueño puede imprimir el material del bar.
  if (bar.owner_user_id !== user.id) redirect("/bar-dashboard");

  const plan = getPlan(bar.plan_id);
  if (!plan.premiumMaterials) redirect("/bar-dashboard?upsell=cartel");

  const t = getTheme(bar.theme_id);
  const [prizes, mainQr, sources] = await Promise.all([
    listPrizes(bar.id), getMainQr(bar.id), listQrSources(bar.id),
  ]);
  const mainPrize = prizes.find((p) => p.prize_type === "principal") ?? prizes[0] ?? null;

  // QR: zona elegida por ?code= o el principal.
  const chosen = searchParams.code ? sources.find((s) => s.code === searchParams.code) : null;
  const qrCode = chosen?.code ?? mainQr?.code ?? null;
  const zoneLabel = chosen?.label ?? null;

  const origin = siteOrigin();
  const qrTarget = qrCode ? `${origin}/r/${qrCode}` : `${origin}/b/${bar.slug}`;
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    width: 900, margin: 1, color: { dark: "#0A0A0A", light: "#FFFFFF" }, errorCorrectionLevel: "M",
  });
  const shortUrl = qrTarget.replace(/^https?:\/\//, "");

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          .cartel-toolbar { display: none !important; }
          html, body { background: #fff !important; }
        }
      `}</style>

      <PrintButton />

      <main style={{ background: "#e5e7eb", minHeight: "100vh", padding: "24px 12px", display: "flex", justifyContent: "center" }}>
        {/* Hoja A4 */}
        <div
          style={{
            width: 794, minHeight: 1123, boxSizing: "border-box", background: t.bg, color: t.text,
            padding: "56px 52px", display: "flex", flexDirection: "column", alignItems: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
          }}
        >
          {/* Cabecera bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, alignSelf: "stretch" }}>
            <div style={{
              width: 84, height: 84, borderRadius: 18, flexShrink: 0, border: `3px solid ${t.primary}`,
              background: bar.logo_url ? `center/cover url(${bar.logo_url})` : t.surface,
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 38, color: t.primary,
            }}>
              {!bar.logo_url && bar.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.primary, fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: 2 }}>
                <Trophy size={18} /> Peña Mundialista 2026
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 900, margin: "4px 0 0", lineHeight: 1.05 }}>{bar.name}</h1>
            </div>
          </div>

          {/* Claim grande */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.05 }}>Juega gratis.</div>
            <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.05, color: t.secondary }}>Gana premios.</div>
            <p style={{ fontSize: 20, color: t.textMuted, margin: "16px auto 0", maxWidth: 540, lineHeight: 1.5 }}>
              Predice los partidos del Mundial desde tu móvil y compite con la clientela de {bar.name}.
            </p>
          </div>

          {/* QR */}
          <div style={{ marginTop: 40, padding: 18, background: "#fff", borderRadius: 24, border: `4px solid ${t.primary}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR de la peña" style={{ width: 340, height: 340, display: "block" }} />
          </div>
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900 }}>Escanea con la cámara y entra</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: t.secondary, marginTop: 6 }}>{shortUrl}</div>
            {zoneLabel && (
              <div style={{ fontSize: 14, fontWeight: 700, color: t.textMuted, marginTop: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Zona: {zoneLabel}
              </div>
            )}
          </div>

          {/* Premio principal */}
          {mainPrize && (
            <div style={{ marginTop: 36, alignSelf: "stretch", background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: "20px 24px", textAlign: "center" }}>
              <div style={{ color: t.secondary, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Premio principal</div>
              <div style={{ fontWeight: 900, fontSize: 28, marginTop: 8 }}>{mainPrize.title}</div>
              {mainPrize.description && <div style={{ color: t.textMuted, fontSize: 16, marginTop: 6 }}>{mainPrize.description}</div>}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Pie */}
          <div style={{ marginTop: 36, textAlign: "center", color: t.textMuted }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Powered by <span style={{ color: t.secondary, fontWeight: 900 }}>ZonaMundial</span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.5, marginTop: 8, maxWidth: 560, opacity: 0.85 }}>
              {bar.entry_fee_note?.trim()
                ? `Dinámica de predicciones y puntos. ZonaMundial no es una casa de apuestas. La inscripción y los premios los gestiona ${bar.name}; ZonaMundial no procesa cobros.`
                : "Dinámica gratuita de predicciones y puntos. No implica apuestas ni pago por participar. Los premios los ofrece y gestiona el establecimiento."}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
