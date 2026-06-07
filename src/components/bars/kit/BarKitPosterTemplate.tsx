// src/components/bars/kit/BarKitPosterTemplate.tsx
//
// Componente REUTILIZABLE del cartel "Porra Digital del Mundial" para bares.
// Usa la imagen de plantilla como FONDO (no la modifica) y coloca encima los
// datos dinámicos del bar (logo, premio, QR, URL) en ZONAS controladas por
// coordenadas absolutas sobre un lienzo lógico fijo de 1122 × 1402 px.
//
// Es un componente "tonto" de presentación: no carga datos ni lógica de negocio.
// Lo usa la ruta de prueba /b/[barSlug]/kit/test y, en el futuro, los materiales
// (A4, story, TV) reutilizando estas mismas zonas.

import type { CSSProperties } from "react";

// Lienzo lógico de la plantilla. Todas las zonas se definen sobre estas medidas;
// el escalado a preview/impresión se hace en el WRAPPER, nunca aquí.
export const POSTER_SIZE = { width: 1122, height: 1402 } as const;

export const POSTER_TEMPLATE_URL = "/assets/bar-kit/porra-digital-template-4x5.png";

// Zonas de inserción (x, y, w, h en px sobre el lienzo lógico). Centralizadas
// para poder ajustarlas en un único sitio con ayuda del modo debug.
export const ZONES = {
  logo:  { x: 110, y: 55,   w: 902, h: 245 },
  prize: { x: 90,  y: 890,  w: 470, h: 265 },
  qr:    { x: 645, y: 935,  w: 300, h: 300 },
  url:   { x: 615, y: 1300, w: 410, h: 48  },
} as const;

export interface BarKitPosterTemplateProps {
  barName: string;
  barLogoUrl?: string | null;
  qrImageUrl?: string | null;   // data URL (PNG) del QR ya generado
  qrSvg?: string | null;        // alternativa: SVG inline del QR
  prizeTitle?: string | null;
  shortUrl: string;
  templateUrl?: string;
  debug?: boolean;
}

// Tamaño de fuente del premio según longitud, para que nunca rompa la caja.
export function getPrizeFontSize(text: string): number {
  const len = text.trim().length;
  if (len <= 22) return 42;
  if (len <= 45) return 34;
  return 26;
}

function zoneStyle(z: { x: number; y: number; w: number; h: number }): CSSProperties {
  return { position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, boxSizing: "border-box" };
}

function debugLabel(text: string, color: string): CSSProperties {
  return {
    position: "absolute", top: -22, left: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1,
    color, background: "rgba(0,0,0,0.65)", padding: "1px 6px", borderRadius: 4, lineHeight: 1.4,
    pointerEvents: "none",
  };
}

export default function BarKitPosterTemplate({
  barName, barLogoUrl, qrImageUrl, qrSvg, prizeTitle, shortUrl,
  templateUrl = POSTER_TEMPLATE_URL, debug = false,
}: BarKitPosterTemplateProps) {
  const prizeText = (prizeTitle && prizeTitle.trim()) || "Premio del bar";
  const prizeFont = getPrizeFontSize(prizeText);
  const urlFont = shortUrl.length > 32 ? 18 : 22;

  return (
    <div
      style={{
        position: "relative",
        width: POSTER_SIZE.width,
        height: POSTER_SIZE.height,
        overflow: "hidden",
        backgroundImage: `url('${templateUrl}')`,
        backgroundSize: "100% 100%",       // exacto, sin recortes → coordenadas fiables
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "#07101F",
        color: "#F8FAFC",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── LOGO ───────────────────────────────────────────── */}
      <div style={{ ...zoneStyle(ZONES.logo), display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 24px", outline: debug ? "3px solid rgba(255,0,0,.6)" : undefined }}>
        {debug && <span style={debugLabel("#ff6b6b", "#ff6b6b")}>LOGO</span>}
        {barLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={barLogoUrl} alt={barName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 72, fontWeight: 900, color: "#f6d36b", textAlign: "center", lineHeight: 1, textTransform: "uppercase", textShadow: "0 4px 12px rgba(0,0,0,.75)" }}>
            {barName}
          </span>
        )}
      </div>

      {/* ── PREMIO ─────────────────────────────────────────── */}
      <div
        style={{
          ...zoneStyle(ZONES.prize), display: "flex", alignItems: "center", justifyContent: "center",
          padding: 36, textAlign: "center", color: "#f6d36b", fontWeight: 900, lineHeight: 1.08,
          textShadow: "0 3px 10px rgba(0,0,0,.85)", overflow: "hidden", fontSize: prizeFont,
          outline: debug ? "3px solid rgba(0,255,0,.6)" : undefined,
        }}
      >
        {debug && <span style={debugLabel("#51ff7a", "#51ff7a")}>PREMIO</span>}
        {prizeText}
      </div>

      {/* ── QR ─────────────────────────────────────────────── */}
      <div
        style={{
          ...zoneStyle(ZONES.qr), display: "flex", alignItems: "center", justifyContent: "center",
          background: "#ffffff", padding: 28, outline: debug ? "3px solid rgba(0,0,255,.6)" : undefined,
        }}
      >
        {debug && <span style={debugLabel("#6b8bff", "#6b8bff")}>QR</span>}
        {qrSvg ? (
          <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
        ) : qrImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImageUrl} alt="QR de la porra" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        ) : null}
      </div>

      {/* ── URL ────────────────────────────────────────────── */}
      <div
        style={{
          ...zoneStyle(ZONES.url), display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 18px", color: "#111111", fontSize: urlFont, fontWeight: 900, lineHeight: 1,
          textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          outline: debug ? "3px solid rgba(255,255,0,.8)" : undefined,
        }}
      >
        {debug && <span style={debugLabel("#fff35c", "#fff35c")}>URL</span>}
        {shortUrl}
      </div>
    </div>
  );
}
