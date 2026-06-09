// GET /api/stories/stickers/search?q=<texto>&offset=<n>
//
// Proxy server-side hacia la API de Giphy (Stickers). Se hace en el servidor
// porque:
//   1. La API key NUNCA debe ir al navegador (queda en GIPHY_API_KEY, server-only).
//   2. La CSP del sitio bloquea `fetch` directo a api.giphy.com (connect-src),
//      pero SÍ permite mostrar las imágenes vía <img> (img-src https:).
//
// Devuelve una lista ligera { id, url, preview, title, w, h } con stickers
// (fondo transparente). Sin q → trending. Sin API key → lista vacía + flag.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GiphyImageVariant {
  url?: string;
  width?: string;
  height?: string;
}
interface GiphyItem {
  id: string;
  title?: string;
  images?: {
    fixed_width?: GiphyImageVariant;
    fixed_width_small?: GiphyImageVariant;
    original?: GiphyImageVariant;
  };
}

export async function GET(req: Request) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    // Sin clave (p.ej. local sin configurar): degradación elegante, no error.
    return NextResponse.json({ stickers: [], configured: false });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0)) || 0;
  const limit = 24;

  // Búsqueda si hay texto; si no, trending (lo que IG muestra al abrir).
  const base = q
    ? "https://api.giphy.com/v1/stickers/search"
    : "https://api.giphy.com/v1/stickers/trending";
  const url = new URL(base);
  url.searchParams.set("api_key", key);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("bundle", "messaging_non_clips");
  if (q) url.searchParams.set("q", q);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Cache corto: trending/búsquedas cambian poco minuto a minuto.
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      return NextResponse.json({ stickers: [], configured: true, error: "giphy_error" }, { status: 502 });
    }
    const json = (await res.json()) as { data?: GiphyItem[] };
    const stickers = (json.data ?? [])
      .map((it) => {
        const full = it.images?.fixed_width;
        const small = it.images?.fixed_width_small ?? full;
        if (!full?.url) return null;
        return {
          id: it.id,
          url: full.url, // imagen a pegar en la story
          preview: small?.url ?? full.url, // miniatura del buscador
          title: it.title ?? "",
          w: Number(full.width ?? 0) || null,
          h: Number(full.height ?? 0) || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ stickers, configured: true });
  } catch {
    return NextResponse.json({ stickers: [], configured: true, error: "fetch_failed" }, { status: 502 });
  }
}
