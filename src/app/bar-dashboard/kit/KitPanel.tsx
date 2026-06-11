"use client";

// KitPanel — UI del Kit de Activación del bar. Lista los materiales (carteles,
// redes, slide TV), las descargas de QR (PNG/SVG), copiar enlace y abrir la
// pantalla TV. Los materiales premium se bloquean si el plan no los incluye y
// llevan a la página de precios. NO cobra ni publica: solo entrega materiales.

import { useCallback, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft, Download, Copy, Check, Tv, Lock, QrCode, FileText, Image as ImageIcon, Smartphone, Trophy,
} from "lucide-react";
import type { KitMaterial } from "@/lib/bars/kit";

const BG = "#060B14";
const BG2 = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TEXT = "#F8FAFC";
const MID = "#94A3B8";
const DIM = "#64748B";
const BORDER = "1px solid rgba(255,255,255,0.08)";

// Icono por tipo de material (solo SVG, sin emojis).
function iconFor(id: string) {
  if (id === "tv-slide") return Tv;
  if (id === "story" || id === "post" || id === "whatsapp") return Smartphone;
  if (id === "mesa-a6") return ImageIcon;
  return FileText;
}

export default function KitPanel({
  materials, barSlug, barName, hasActivePlan, premiumMaterials, planName, prizeTitle, qrTarget,
}: {
  materials: KitMaterial[];
  barSlug: string;
  barName: string;
  hasActivePlan: boolean;
  premiumMaterials: boolean;
  planName: string;
  prizeTitle: string | null;
  qrTarget: string;
}) {
  const [copied, setCopied] = useState(false);
  const shortUrl = qrTarget.replace(/^https?:\/\//, "");

  const copyLink = useCallback(() => {
    void navigator.clipboard.writeText(qrTarget);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [qrTarget]);

  const downloadQr = useCallback(async (fmt: "png" | "svg") => {
    const data = fmt === "png"
      ? await QRCode.toDataURL(qrTarget, { width: 1024, margin: 2, errorCorrectionLevel: "M" })
      : `data:image/svg+xml;utf8,${encodeURIComponent(await QRCode.toString(qrTarget, { type: "svg", margin: 2 }))}`;
    const a = document.createElement("a");
    a.href = data; a.download = `qr-${barSlug}.${fmt}`; a.click();
  }, [qrTarget, barSlug]);

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 18px 64px" }}>
        {/* Volver */}
        <Link href="/bar-dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MID, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Volver al panel
        </Link>

        {/* Cabecera */}
        <header style={{ marginTop: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: GOLD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            <Trophy size={14} /> Kit de activación
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: "8px 0 0", lineHeight: 1.1 }}>Tu peña ya está lista</h1>
          <p style={{ color: MID, fontSize: 15, margin: "8px 0 0", maxWidth: 560, lineHeight: 1.5 }}>
            Descarga tus carteles, compártelos en redes y abre la pantalla TV para empezar a recibir participantes.
          </p>
        </header>

        {/* Aviso si no hay plan activo */}
        {!hasActivePlan && (
          <div style={{ marginTop: 20, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: GOLD2, fontWeight: 800, fontSize: 14 }}>
              <Lock size={15} /> Activa tu plan para publicar la peña
            </div>
            <p style={{ color: MID, fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
              Puedes previsualizar y descargar los materiales básicos. Para publicar tu peña y desbloquear
              los materiales premium, activa un plan.
            </p>
            <Link href="/bares/precios" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#1A1208", fontWeight: 800, fontSize: 13, padding: "8px 14px", borderRadius: 999, textDecoration: "none" }}>
              Ver planes
            </Link>
          </div>
        )}

        {/* Materiales */}
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1.5 }}>Carteles y materiales</h2>
          <div style={{ marginTop: 12, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {materials.map((m) => {
              const Icon = iconFor(m.id);
              const locked = m.premium && !premiumMaterials;
              const href = locked ? `/bares/precios` : `/b/${barSlug}/kit/${m.id}`;
              return (
                <Link
                  key={m.id}
                  href={href}
                  target={locked ? undefined : "_blank"}
                  style={{
                    display: "block", background: BG2, border: BORDER, borderRadius: 14, padding: 16,
                    textDecoration: "none", color: TEXT, position: "relative", opacity: locked ? 0.85 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "rgba(201,168,76,0.12)", color: GOLD }}>
                      <Icon size={19} />
                    </span>
                    {m.premium && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: locked ? DIM : GOLD2 }}>
                        {locked && <Lock size={11} />} Premium
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 800, fontSize: 15 }}>{m.label}</div>
                  <div style={{ marginTop: 3, fontSize: 12.5, color: MID, lineHeight: 1.45 }}>{m.description}</div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: locked ? DIM : GOLD }}>
                    {locked
                      ? <>Requiere plan superior</>
                      : <><Download size={13} /> Abrir / descargar</>}
                  </div>
                </Link>
              );
            })}
          </div>
          {!premiumMaterials && (
            <p style={{ marginTop: 10, fontSize: 12, color: DIM }}>
              Tu plan ({planName}) incluye los materiales básicos. Mejora de plan para desbloquear los premium.
            </p>
          )}
        </section>

        {/* QR y enlace */}
        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1.5 }}>QR y enlace</h2>
          <div style={{ marginTop: 12, background: BG2, border: BORDER, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT, fontWeight: 800, fontSize: 14 }}>
              <QrCode size={16} color={GOLD} /> Código QR de la peña
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: GOLD2, fontWeight: 700, wordBreak: "break-all" }}>{shortUrl}</div>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" onClick={() => void downloadQr("png")} style={btn()}>
                <Download size={14} /> QR PNG
              </button>
              <button type="button" onClick={() => void downloadQr("svg")} style={btn()}>
                <Download size={14} /> QR SVG
              </button>
              <button type="button" onClick={copyLink} style={btn()}>
                {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar enlace</>}
              </button>
            </div>
          </div>
        </section>

        {/* Pantalla TV */}
        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: MID, textTransform: "uppercase", letterSpacing: 1.5 }}>Pantalla TV</h2>
          <div style={{ marginTop: 12, background: BG2, border: BORDER, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14 }}>
                <Tv size={16} color={GOLD} /> Modo televisión
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: MID, lineHeight: 1.5, maxWidth: 460 }}>
                Abre la pantalla a tamaño completo con el QR, el top y el incentivo del día para mostrarla en el local.
              </div>
            </div>
            <Link href={`/b/${barSlug}/tv`} target="_blank" style={{ ...btn(), background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#1A1208", border: "none" }}>
              <Tv size={14} /> Abrir pantalla TV
            </Link>
          </div>
        </section>

        {/* Resumen de lo que muestran los materiales */}
        <p style={{ marginTop: 28, fontSize: 12, color: DIM, lineHeight: 1.6 }}>
          Todos los materiales incluyen el logo y nombre de <strong style={{ color: MID }}>{barName}</strong>, el QR
          dinámico, el enlace corto{prizeTitle ? <>, el incentivo «{prizeTitle}»</> : null}, la llamada a la acción y
          el sello «Powered by ZonaMundial». Estilo base: <strong style={{ color: MID }}>Premium Mundial</strong>.
        </p>
      </div>
    </main>
  );
}

function btn(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
    background: "rgba(255,255,255,0.05)", color: TEXT, border: BORDER, borderRadius: 10,
    fontWeight: 800, fontSize: 13, padding: "9px 14px", textDecoration: "none",
  };
}
