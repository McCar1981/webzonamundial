// GET /api/match-center/gifs/search?q=<texto>&offset=<n>
//
// Proxy server-side a GIPHY (GIFs) para el chat de la Sala con amigos. Igual
// patrón que /api/stories/stickers/search: la API key queda en el servidor
// (GIPHY_API_KEY) y la CSP del sitio bloquea fetch directo a api.giphy.com.
// Sin q → trending. Sin clave → lista vacía + configured:false.

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
  };
}

export async function GET(req: Request) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return NextResponse.json({ gifs: [], configured: false });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0)) || 0;

  const base = q
    ? "https://api.giphy.com/v1/gifs/search"
    : "https://api.giphy.com/v1/gifs/trending";
  const url = new URL(base);
  url.searchParams.set("api_key", key);
  url.searchParams.set("limit", "24");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("bundle", "messaging_non_clips");
  if (q) url.searchParams.set("q", q);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      return NextResponse.json({ gifs: [], configured: true, error: "giphy_error" }, { status: 502 });
    }
    const json = (await res.json()) as { data?: GiphyItem[] };
    const gifs = (json.data ?? [])
      .map((it) => {
        const full = it.images?.fixed_width;
        const small = it.images?.fixed_width_small ?? full;
        if (!full?.url) return null;
        return {
          id: it.id,
          url: full.url,
          preview: small?.url ?? full.url,
          title: it.title ?? "",
        };
      })
      .filter(Boolean);
    return NextResponse.json({ gifs, configured: true });
  } catch {
    return NextResponse.json({ gifs: [], configured: true, error: "fetch_failed" }, { status: 502 });
  }
}
