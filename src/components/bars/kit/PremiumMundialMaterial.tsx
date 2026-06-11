// src/components/bars/kit/PremiumMundialMaterial.tsx
//
// Plantilla visual "Premium Mundial" para el Kit de Activación. Server Component
// puro (sin hooks): coloca los datos del bar (logo, nombre, QR, premio, CTA, URL)
// sobre un fondo base hecho 100% con CSS/SVG (gradientes, formas y líneas), sin
// imágenes externas, sin logos oficiales y con estética deportiva premium oscura.
//
// El lienzo se renderiza al tamaño exacto del material (px CSS ≈ 96dpi); la ruta
// se encarga del escalado de preview y del @page para impresión/PDF.

import { Trophy } from "lucide-react";
import type { KitMaterial, KitData } from "@/lib/bars/kit";

const GOLD = "#C9A84C";
const GOLD2 = "#FDE68A";
const INK = "#0A0A0A";
const TEXT = "#F8FAFC";
const MUTED = "#9FB0C4";

export default function PremiumMundialMaterial({
  material, data,
}: { material: KitMaterial; data: KitData }) {
  const { width, height, kind } = material;
  const u = Math.min(width, height) / 100; // unidad responsiva del lienzo

  return (
    <div
      style={{
        position: "relative", width, height, overflow: "hidden", boxSizing: "border-box",
        background: "linear-gradient(160deg, #07101F 0%, #0B1B30 55%, #060B14 100%)",
        color: TEXT, fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <Decor width={width} height={height} u={u} />
      {/* Marco dorado interior */}
      <div style={{
        position: "absolute", inset: u * 2.5, border: `${Math.max(1, u * 0.18)}px solid rgba(201,168,76,0.35)`,
        borderRadius: u * 2, pointerEvents: "none", zIndex: 1,
      }} />

      {kind === "horizontal"
        ? <Horizontal data={data} u={u} />
        : kind === "card"
          ? <Card data={data} u={u} />
          : kind === "square"
            ? <Square data={data} u={u} />
            : <Vertical data={data} u={u} />}
    </div>
  );
}

// ─── Fondo decorativo (CSS/SVG, sin imágenes externas) ────────────────────────
function Decor({ width, height, u }: { width: number; height: number; u: number }) {
  return (
    <svg
      width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, zIndex: 0 }} aria-hidden
    >
      <defs>
        <radialGradient id="kitGlow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.22)" />
          <stop offset="55%" stopColor="rgba(201,168,76,0.04)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0)" />
        </radialGradient>
        <linearGradient id="kitLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(201,168,76,0.0)" />
          <stop offset="50%" stopColor="rgba(201,168,76,0.5)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0.0)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={width} height={height} fill="url(#kitGlow)" />

      {/* Líneas diagonales finas (textura deportiva) */}
      {Array.from({ length: 7 }).map((_, i) => {
        const off = (i - 1) * (width / 5);
        return (
          <line
            key={i} x1={off} y1={height} x2={off + height * 0.55} y2={0}
            stroke="rgba(255,255,255,0.035)" strokeWidth={Math.max(1, u * 0.12)}
          />
        );
      })}

      {/* Arco/círculo tenue tipo balón, esquina inferior derecha */}
      <circle cx={width * 0.92} cy={height * 0.98} r={height * 0.28} fill="none" stroke="rgba(201,168,76,0.10)" strokeWidth={u * 0.4} />
      <circle cx={width * 0.92} cy={height * 0.98} r={height * 0.18} fill="none" stroke="rgba(201,168,76,0.07)" strokeWidth={u * 0.3} />

      {/* Acentos dorados en esquinas superiores */}
      <line x1={width * 0.06} y1={height * 0.0} x2={width * 0.06} y2={height * 0.0 + u * 10} stroke="url(#kitLine)" strokeWidth={u * 0.5} />
      <rect x={width * 0.06} y={u * 2.5} width={width * 0.34} height={Math.max(1, u * 0.22)} fill="url(#kitLine)" />
    </svg>
  );
}

// ─── Piezas reutilizables ─────────────────────────────────────────────────────
function LogoBadge({ data, u, size }: { data: KitData; u: number; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22, flexShrink: 0,
      border: `${Math.max(2, u * 0.4)}px solid ${GOLD}`,
      background: data.logoUrl ? `center/cover no-repeat url(${data.logoUrl})` : "rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: size * 0.46, color: GOLD,
    }}>
      {!data.logoUrl && data.barName.charAt(0).toUpperCase()}
    </div>
  );
}

function Kicker({ u }: { u: number }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: u * 0.8, color: GOLD,
      fontWeight: 800, fontSize: u * 2, textTransform: "uppercase", letterSpacing: u * 0.25,
    }}>
      <Trophy size={u * 2.4} /> Peña Mundialista 2026
    </div>
  );
}

function QrPanel({ data, u, qrSize }: { data: KitData; u: number; qrSize: number }) {
  return (
    <div style={{
      background: "#fff", borderRadius: u * 2.2, padding: u * 1.6,
      border: `${u * 0.5}px solid ${GOLD}`, boxShadow: `0 ${u}px ${u * 3.5}px rgba(0,0,0,0.45)`,
      display: "inline-flex",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.qrDataUrl} alt="QR de la peña" width={qrSize} height={qrSize} style={{ display: "block", borderRadius: u * 0.4 }} />
    </div>
  );
}

function ScanLine({ data, u, big }: { data: KitData; u: number; big?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 900, fontSize: u * (big ? 3 : 2.4) }}>Escanea con la cámara y entra</div>
      <div style={{ fontWeight: 800, fontSize: u * (big ? 2.4 : 2), color: GOLD2, marginTop: u * 0.6 }}>{data.shortUrl}</div>
    </div>
  );
}

function PrizePanel({ data, u, full }: { data: KitData; u: number; full?: boolean }) {
  if (!data.prizeTitle) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.045)", border: "1px solid rgba(201,168,76,0.3)",
      borderRadius: u * 1.8, padding: `${u * 1.8}px ${u * 2.2}px`, textAlign: "center",
      alignSelf: full ? "stretch" : "center",
    }}>
      <div style={{ color: GOLD2, fontWeight: 800, fontSize: u * 1.6, textTransform: "uppercase", letterSpacing: u * 0.15 }}>
        Incentivo principal
      </div>
      <div style={{ fontWeight: 900, fontSize: u * 3, marginTop: u * 0.6 }}>{data.prizeTitle}</div>
      {data.prizeDescription && (
        <div style={{ color: MUTED, fontSize: u * 1.9, marginTop: u * 0.4 }}>{data.prizeDescription}</div>
      )}
    </div>
  );
}

function CtaPill({ data, u }: { data: KitData; u: number }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: INK,
      fontWeight: 900, fontSize: u * 2.4, padding: `${u * 1.4}px ${u * 3.4}px`, borderRadius: 999,
    }}>
      {data.ctaLabel}
    </div>
  );
}

function Claim({ u, oneLine }: { u: number; oneLine?: boolean }) {
  if (oneLine) {
    return (
      <div style={{ fontWeight: 900, fontSize: u * 5, lineHeight: 1.05, textAlign: "center" }}>
        Juega gratis. <span style={{ color: GOLD2 }}>Llévate el incentivo.</span>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 900, fontSize: u * 7, lineHeight: 1.02 }}>Juega gratis.</div>
      <div style={{ fontWeight: 900, fontSize: u * 7, lineHeight: 1.02, color: GOLD2 }}>Llévate el incentivo.</div>
    </div>
  );
}

function PoweredBy({ u, compact }: { u: number; compact?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: u * (compact ? 1.6 : 1.9), fontWeight: 700, color: MUTED }}>
        Powered by <span style={{ color: GOLD2, fontWeight: 900 }}>ZonaMundial</span>
      </div>
      {!compact && (
        <div style={{ fontSize: u * 1.25, color: MUTED, opacity: 0.8, marginTop: u * 0.6, lineHeight: 1.4 }}>
          Dinámica gratuita de predicciones. No implica apuestas ni pago por participar.
          Los premios los gestiona el establecimiento.
        </div>
      )}
    </div>
  );
}

function BarTitle({ data, u, size }: { data: KitData; u: number; size: number }) {
  return <h1 style={{ fontSize: size, fontWeight: 900, margin: `${u * 0.4}px 0 0`, lineHeight: 1.02 }}>{data.barName}</h1>;
}

// ─── Layouts por formato ──────────────────────────────────────────────────────
function Vertical({ data, u }: { data: KitData; u: number }) {
  return (
    <div style={{
      position: "relative", zIndex: 2, height: "100%", boxSizing: "border-box",
      padding: u * 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: u * 3,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: u * 2.2, alignSelf: "stretch" }}>
        <LogoBadge data={data} u={u} size={u * 12} />
        <div>
          <Kicker u={u} />
          <BarTitle data={data} u={u} size={u * 5.5} />
        </div>
      </div>

      <Claim u={u} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u * 2 }}>
        <QrPanel data={data} u={u} qrSize={u * 34} />
        <ScanLine data={data} u={u} big />
      </div>

      <PrizePanel data={data} u={u} full />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u * 2.4 }}>
        <CtaPill data={data} u={u} />
        <PoweredBy u={u} />
      </div>
    </div>
  );
}

function Square({ data, u }: { data: KitData; u: number }) {
  return (
    <div style={{
      position: "relative", zIndex: 2, height: "100%", boxSizing: "border-box",
      padding: u * 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u * 1.4 }}>
        <LogoBadge data={data} u={u} size={u * 11} />
        <Kicker u={u} />
        <BarTitle data={data} u={u} size={u * 5} />
      </div>

      <Claim u={u} oneLine />

      <div style={{ display: "flex", alignItems: "center", gap: u * 3 }}>
        <QrPanel data={data} u={u} qrSize={u * 24} />
        <div style={{ textAlign: "left", maxWidth: u * 34 }}>
          <div style={{ fontWeight: 900, fontSize: u * 2.6 }}>Escanea y entra</div>
          <div style={{ fontWeight: 800, fontSize: u * 2, color: GOLD2, marginTop: u * 0.5 }}>{data.shortUrl}</div>
          {data.prizeTitle && (
            <div style={{ marginTop: u * 1.4, color: MUTED, fontSize: u * 1.9 }}>
              <span style={{ color: GOLD2, fontWeight: 800 }}>Incentivo: </span>{data.prizeTitle}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u * 1.8 }}>
        <CtaPill data={data} u={u} />
        <PoweredBy u={u} compact />
      </div>
    </div>
  );
}

function Card({ data, u }: { data: KitData; u: number }) {
  return (
    <div style={{
      position: "relative", zIndex: 2, height: "100%", boxSizing: "border-box",
      padding: u * 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u * 1 }}>
        <Kicker u={u} />
        <BarTitle data={data} u={u} size={u * 5} />
      </div>

      <QrPanel data={data} u={u} qrSize={u * 36} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: u * 3.4 }}>Escanea y juega gratis</div>
        <div style={{ fontWeight: 800, fontSize: u * 2.6, color: GOLD2, marginTop: u * 0.5 }}>{data.shortUrl}</div>
        {data.prizeTitle && (
          <div style={{ marginTop: u * 1.2, color: MUTED, fontSize: u * 2.4 }}>
            <span style={{ color: GOLD2, fontWeight: 800 }}>Incentivo: </span>{data.prizeTitle}
          </div>
        )}
      </div>

      <PoweredBy u={u} compact />
    </div>
  );
}

function Horizontal({ data, u }: { data: KitData; u: number }) {
  return (
    <div style={{
      position: "relative", zIndex: 2, height: "100%", boxSizing: "border-box",
      padding: u * 6, display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: u * 5, alignItems: "center" }}>
        {/* Izquierda: marca + claim + premio + CTA */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: u * 2.4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: u * 2 }}>
            <LogoBadge data={data} u={u} size={u * 11} />
            <div>
              <Kicker u={u} />
              <BarTitle data={data} u={u} size={u * 5} />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: u * 7.5, lineHeight: 1.02 }}>Juega gratis.</div>
            <div style={{ fontWeight: 900, fontSize: u * 7.5, lineHeight: 1.02, color: GOLD2 }}>Llévate el incentivo.</div>
          </div>
          {data.prizeTitle && <PrizePanel data={data} u={u} />}
          <div><CtaPill data={data} u={u} /></div>
        </div>

        {/* Derecha: QR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u * 2 }}>
          <QrPanel data={data} u={u} qrSize={u * 30} />
          <ScanLine data={data} u={u} />
        </div>
      </div>

      <div style={{ marginTop: u * 2 }}><PoweredBy u={u} compact /></div>
    </div>
  );
}
