// src/app/b/[barSlug]/tv/page.tsx
//
// Pantalla TV del bar: pantalla completa, horizontal, alto contraste. Pensada
// para una tele del local. Muestra QR grande, top 10 en vivo, premio del día y
// "Powered by ZonaMundial" en pequeño. Se autorefresca cada 20s. SIN AdSense.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Trophy, Crown } from "lucide-react";
import { getBarBySlug, barLeaderboard, listPrizes, getMainQr } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";
import AutoRefresh from "./AutoRefresh";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { barSlug: string } }): Promise<Metadata> {
  const bar = await getBarBySlug(params.barSlug);
  return {
    title: bar ? `TV · ${bar.name}` : "TV · ZonaMundial",
    robots: { index: false, follow: false },
  };
}

function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "zonamundial.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function BarTvPage({ params }: { params: { barSlug: string } }) {
  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();

  const t = getTheme(bar.theme_id);
  const [standings, prizes, mainQr] = await Promise.all([
    barLeaderboard(bar), listPrizes(bar.id), getMainQr(bar.id),
  ]);
  const top10 = standings.slice(0, 10);
  const mainPrize = prizes.find((p) => p.prize_type === "principal") ?? prizes[0] ?? null;

  const origin = siteOrigin();
  const qrTarget = mainQr ? `${origin}/r/${mainQr.code}` : `${origin}/b/${bar.slug}`;
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    width: 420, margin: 1, color: { dark: "#0A0A0A", light: "#FFFFFF" }, errorCorrectionLevel: "M",
  });
  const shortUrl = qrTarget.replace(/^https?:\/\//, "");
  const medal = (pos: number) => (pos === 1 ? "#FFD54A" : pos === 2 ? "#C7CDD6" : pos === 3 ? "#D89B6A" : t.text);

  return (
    <main style={{ minHeight: "100vh", width: "100%", background: t.bg, color: t.text, display: "flex", flexDirection: "column", padding: "3vh 3vw", boxSizing: "border-box", overflow: "hidden" }}>
      <AutoRefresh seconds={20} />

      {/* Cabecera */}
      <header style={{ display: "flex", alignItems: "center", gap: "1.5vw", marginBottom: "2.5vh" }}>
        <div style={{
          width: "5vw", height: "5vw", minWidth: 56, minHeight: 56, borderRadius: 14, flexShrink: 0, border: `3px solid ${t.primary}`,
          background: bar.logo_url ? `center/cover url(${bar.logo_url})` : t.surface,
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "2.5vw", color: t.primary,
        }}>
          {!bar.logo_url && bar.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", color: t.primary, fontWeight: 800, fontSize: "1.4vw", textTransform: "uppercase", letterSpacing: 2 }}>
            <Trophy size={22} /> Porra del Mundial 2026
          </div>
          <h1 style={{ fontSize: "3vw", fontWeight: 900, margin: "0.3vh 0 0", lineHeight: 1 }}>{bar.name}</h1>
        </div>
      </header>

      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0 }}>
        {/* Columna izquierda: QR + premio */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2vh", width: "32%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR de la porra" style={{ width: "min(26vw, 42vh)", height: "auto", borderRadius: 16, border: `4px solid ${t.primary}`, background: "#fff" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.6vw", fontWeight: 900 }}>Escanea y entra en la porra</div>
            <div style={{ fontSize: "1.2vw", color: t.secondary, fontWeight: 700, marginTop: "0.5vh" }}>{shortUrl}</div>
          </div>
          {mainPrize && (
            <div style={{ textAlign: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: "1.5vh 1.5vw", width: "100%", boxSizing: "border-box" }}>
              <div style={{ color: t.secondary, fontWeight: 800, fontSize: "1vw", textTransform: "uppercase", letterSpacing: 1 }}>Premio de hoy</div>
              <div style={{ fontWeight: 900, fontSize: "1.6vw", marginTop: "0.5vh" }}>{mainPrize.title}</div>
            </div>
          )}
        </div>

        {/* Columna derecha: top 10 */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "1.8vw", fontWeight: 900, margin: "0 0 1.5vh", display: "flex", alignItems: "center", gap: "0.8vw" }}>
            <Crown size={26} color={t.primary} /> Top 10
          </h2>
          {top10.length === 0 ? (
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: "3vh", color: t.textMuted, fontSize: "1.4vw", textAlign: "center" }}>
              Escanea el QR para ser el primero en la clasificación.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1vh", flex: 1 }}>
              {top10.map((s) => (
                <div key={s.user_id} style={{
                  display: "flex", alignItems: "center", gap: "1.5vw", background: t.surface,
                  border: `1px solid ${s.position <= 3 ? medal(s.position) : t.border}`, borderRadius: t.cardRadius, padding: "1vh 1.5vw",
                }}>
                  <span style={{ fontWeight: 900, fontSize: "1.8vw", color: medal(s.position), width: "3vw", textAlign: "center" }}>{s.position}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: "1.6vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.display_name}</span>
                  <span style={{ fontWeight: 900, fontSize: "1.6vw", color: t.secondary }}>{s.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Powered by ZonaMundial (pequeño) */}
      <footer style={{ textAlign: "center", marginTop: "2vh", color: t.textMuted, fontSize: "1vw", fontWeight: 600 }}>
        Powered by <span style={{ color: t.secondary, fontWeight: 800 }}>ZonaMundial</span>
      </footer>
    </main>
  );
}
