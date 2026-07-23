// src/lib/ligas/club-color.ts
//
// Color de AMBIENTE del club para la ficha, EXTRAÍDO DEL ESCUDO real (automático
// para cualquier club, no un mapa a mano). Descarga el crest de api-football,
// saca su color vibrante dominante con sharp y lo cachea 30 días en KV. Para unos
// pocos grandes con escudo "difícil" (blanco/multicolor) hay un override a mano
// en player-visuals (color de marca). SOLO servidor (sharp es nativo).

import sharp from "sharp";
import { kv } from "@/lib/kv";
import { clubColor as brandColor, type ClubColor } from "./player-visuals";

const TTL_S = 60 * 60 * 24 * 30; // 30 días
const key = (teamId: number) => `zl:clubcolor:${teamId}`;

function hex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: mx === 0 ? 0 : d / mx, v: mx };
}

/** Color vibrante dominante del escudo (o null si no se pudo). */
async function dominantFromCrest(buf: Buffer): Promise<ClubColor | null> {
  const { data, info } = await sharp(buf).resize(40, 40, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; // 4 (RGBA)
  // 12 sectores de tono (30°), pesados por saturación·brillo. Descarta el fondo
  // transparente y los píxeles apagados (blanco/negro/gris del escudo).
  const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i + ch - 1 < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = ch === 4 ? data[i + 3] : 255;
    if (a < 128) continue;
    const { h, s, v } = rgbToHsv(r, g, b);
    if (s < 0.35 || v < 0.22 || v > 0.98) continue;
    const bin = bins[Math.min(11, Math.floor(h / 30))];
    const w = s * v;
    bin.w += w; bin.r += r * w; bin.g += g * w; bin.b += b * w;
  }
  let best = bins[0];
  for (const bin of bins) if (bin.w > best.w) best = bin;
  if (best.w <= 0) return null;
  const r = best.r / best.w, g = best.g / best.w, b = best.b / best.w;
  return { club: `#${hex(r)}${hex(g)}${hex(b)}`, deep: `#${hex(r * 0.34)}${hex(g * 0.34)}${hex(b * 0.34)}` };
}

/** Color de club para el ambiente del héroe. Override de marca > escudo real >
 *  null (la ficha cae al oro). Cacheado 30 días por equipo. */
export async function getClubColor(teamId: number, crestUrl: string | null): Promise<ClubColor | null> {
  const brand = brandColor(teamId);
  if (brand) return brand;
  if (!crestUrl) return null;

  try {
    const cached = await kv.get<ClubColor | "none">(key(teamId));
    if (cached) return cached === "none" ? null : cached;
  } catch { /* sin KV: extraemos */ }

  let color: ClubColor | null = null;
  try {
    const res = await fetch(crestUrl, { cache: "no-store" });
    if (res.ok) color = await dominantFromCrest(Buffer.from(await res.arrayBuffer()));
  } catch { color = null; }

  try { await kv.set(key(teamId), color ?? "none", { ex: TTL_S }); } catch { /* best-effort */ }
  return color;
}
