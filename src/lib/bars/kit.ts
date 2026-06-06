// src/lib/bars/kit.ts
//
// "Kit de Activación" para Porras Digitales de Bares. Sistema de PLANTILLAS
// dinámicas (no imágenes generadas por IA): los datos del bar se colocan sobre
// fondos base hechos con HTML/CSS/SVG. Aquí vive el catálogo de materiales y el
// helper que reúne los datos dinámicos (logo, nombre, QR, premio, CTA, URL).
//
// Server-only: usa qrcode y next/headers.

import { headers } from "next/headers";
import QRCode from "qrcode";
import type { BarRow, BarPrize } from "./store";

export type KitMaterialId =
  | "a4" | "a3" | "mesa-a6" | "story" | "post" | "whatsapp" | "tv-slide";

// Cómo se compone visualmente cada material (la plantilla elige el layout).
export type KitKind = "vertical" | "square" | "horizontal" | "card";

export interface KitMaterial {
  id: KitMaterialId;
  label: string;
  description: string;
  premium: boolean;       // requiere plan con materiales premium
  kind: KitKind;
  width: number;          // lienzo en px CSS (≈96dpi) → impresión/preview
  height: number;
  pageSize: string;       // valor para @page size (impresión)
  exportPx: string;       // referencia de exportación a 300dpi (informativo)
}

// Estilo base inicial: "Premium Mundial" (deportivo, oscuro, dorado, legible).
export const KIT_STYLE_NAME = "Premium Mundial";

export const KIT_MATERIALS: Record<KitMaterialId, KitMaterial> = {
  "a4": {
    id: "a4", label: "Cartel A4", description: "Vertical para colgar en el local.",
    premium: false, kind: "vertical", width: 794, height: 1123, pageSize: "A4 portrait", exportPx: "2480 × 3508 px",
  },
  "a3": {
    id: "a3", label: "Cartel A3", description: "Tamaño grande, máxima visibilidad.",
    premium: true, kind: "vertical", width: 1123, height: 1587, pageSize: "A3 portrait", exportPx: "3508 × 4961 px",
  },
  "mesa-a6": {
    id: "mesa-a6", label: "Tarjeta de mesa A6", description: "Una en cada mesa del bar.",
    premium: true, kind: "card", width: 397, height: 561, pageSize: "A6 portrait", exportPx: "1240 × 1748 px",
  },
  "story": {
    id: "story", label: "Story Instagram", description: "Formato 9:16 para stories.",
    premium: true, kind: "vertical", width: 1080, height: 1920, pageSize: "1080px 1920px", exportPx: "1080 × 1920 px",
  },
  "post": {
    id: "post", label: "Post Instagram", description: "Formato 1:1 para el feed.",
    premium: true, kind: "square", width: 1080, height: 1080, pageSize: "1080px 1080px", exportPx: "1080 × 1080 px",
  },
  "whatsapp": {
    id: "whatsapp", label: "Imagen WhatsApp", description: "Para difundir por chats y estados.",
    premium: true, kind: "vertical", width: 1080, height: 1350, pageSize: "1080px 1350px", exportPx: "1080 × 1350 px",
  },
  "tv-slide": {
    id: "tv-slide", label: "Slide TV", description: "Formato 16:9 para pantallas.",
    premium: false, kind: "horizontal", width: 1920, height: 1080, pageSize: "1920px 1080px", exportPx: "1920 × 1080 px",
  },
};

export function getKitMaterial(id: string): KitMaterial | null {
  return id in KIT_MATERIALS ? KIT_MATERIALS[id as KitMaterialId] : null;
}

export function kitMaterialList(): KitMaterial[] {
  return Object.values(KIT_MATERIALS);
}

export interface KitData {
  barName: string;
  logoUrl: string | null;
  qrDataUrl: string;        // PNG dataURL del QR (para incrustar en la plantilla)
  qrTarget: string;         // URL real a la que apunta el QR
  shortUrl: string;         // sin protocolo, para mostrar
  prizeTitle: string | null;
  prizeDescription: string | null;
  ctaLabel: string;
}

/** Origen del sitio (env o cabeceras), igual que el resto de páginas del bar. */
export function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "zonamundial.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Reúne los datos dinámicos que se colocan sobre cualquier plantilla del kit. */
export async function buildKitData(
  bar: BarRow, origin: string, code: string, prizes: BarPrize[],
): Promise<KitData> {
  const qrTarget = `${origin}/r/${code}`;
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    width: 1000, margin: 1, color: { dark: "#0A0A0A", light: "#FFFFFF" }, errorCorrectionLevel: "M",
  });
  const mainPrize = prizes.find((p) => p.prize_type === "principal") ?? prizes[0] ?? null;
  return {
    barName: bar.name,
    logoUrl: bar.logo_url,
    qrDataUrl,
    qrTarget,
    shortUrl: qrTarget.replace(/^https?:\/\//, ""),
    prizeTitle: mainPrize?.title ?? null,
    prizeDescription: mainPrize?.description ?? null,
    ctaLabel: bar.cta_label || "Entrar en la porra",
  };
}
