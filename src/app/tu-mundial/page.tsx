// src/app/tu-mundial/page.tsx
//
// Página PÚBLICA compartible del recuerdo "Tu Mundial 2026". El destinatario del
// enlace (no logueado) ve la tarjeta con las cifras que viajan por query, y su
// meta OG apunta a la imagen dinámica /api/og/tu-mundial para que el preview en
// WhatsApp/Telegram/Twitter salga con la tarjeta. noindex: son tarjetas
// personales, no páginas SEO. CTA para crear el propio.

import type { Metadata } from "next";
import Link from "next/link";
import RecapCard from "./RecapCard";
import { statsFromParams } from "@/lib/tu-mundial/share";

export const dynamic = "force-dynamic";

type SP = { [key: string]: string | string[] | undefined };

function toUsp(sp: SP): URLSearchParams {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") u.set(k, v);
    else if (Array.isArray(v) && v.length) u.set(k, v[0]);
  }
  return u;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const usp = toUsp(searchParams);
  const s = statsFromParams(usp);
  const ogUrl = `https://zonamundial.app/api/og/tu-mundial?${usp.toString()}`;
  const title = `El Mundial 2026 de ${s.name} — ZonaMundial`;
  const description = `${s.correct} aciertos, ${s.accuracy}% de acierto y ${s.points.toLocaleString("es")} puntos en el Mundial 2026. Crea el tuyo en ZonaMundial.`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: "https://zonamundial.app/tu-mundial",
      siteName: "ZonaMundial",
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default function TuMundialPublicPage({ searchParams }: { searchParams: SP }) {
  const s = statsFromParams(toUsp(searchParams));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #000000, #000000)",
        color: "#E2E8F0",
        padding: "48px 16px",
      }}
    >
      <RecapCard s={s} />

      <div style={{ maxWidth: 560, margin: "28px auto 0", textAlign: "center" }}>
        <p style={{ fontSize: 15, color: "#a69a82", marginBottom: 16 }}>
          Cada aficionado tiene su propio Mundial. ¿Cómo fue el tuyo?
        </p>
        <Link
          href="/app/tu-mundial"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #c9a84c, #e8d48b)",
            color: "#0a0906",
            fontWeight: 800,
            fontSize: 16,
            padding: "14px 30px",
            borderRadius: 14,
            textDecoration: "none",
          }}
        >
          Crea tu Mundial 2026
        </Link>
      </div>
    </main>
  );
}
