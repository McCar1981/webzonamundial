/**
 * Dynamic Open Graph image for each /noticias/[slug] article.
 *
 * Replaces the generic /og-image.jpg with a per-article social card that
 * includes the headline, category, author and brand. Drastically improves
 * CTR when shared on Twitter/X, WhatsApp, LinkedIn, Facebook.
 *
 * Spec: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 * Runtime: Edge (fast, cheap)
 */

import { ImageResponse } from "next/og";
import { getNoticiaBySlugPublic } from "@/lib/noticias-store";
import { getAuthor } from "@/data/noticias-authors";

// Note: runtime set to nodejs because the KV/store reader uses node:fs as
// fallback for local dev. ImageResponse works fine in nodejs runtime,
// just slightly slower cold start than edge. Acceptable for OG images
// which are also cached aggressively by Twitter/Facebook/WhatsApp.
export const runtime = "nodejs";
export const alt = "ZonaMundial — Noticia del Mundial 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CAT_LABELS: Record<string, string> = {
  analisis: "Análisis",
  datos: "Datos & Stats",
  historia: "Historia",
  sedes: "Sedes",
  selecciones: "Selecciones",
  plataforma: "Plataforma",
};
const CAT_COLORS: Record<string, string> = {
  analisis: "#3b82f6",
  datos: "#22c55e",
  historia: "#f59e0b",
  sedes: "#e879f9",
  selecciones: "#ef4444",
  plataforma: "#06b6d4",
};

export default async function Image({ params }: { params: { slug: string } }) {
  const noticia = await getNoticiaBySlugPublic(params.slug);
  const title = noticia?.title || "Mundial 2026";
  const cat = noticia?.cat || "selecciones";
  const author = noticia ? getAuthor(noticia.authorId) : null;
  const catLabel = CAT_LABELS[cat] || cat;
  const catColor = CAT_COLORS[cat] || "#c9a84c";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #060B14 0%, #0F1D32 50%, #1a1130 100%)",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        {/* Gold accent corner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 460,
            height: 460,
            background:
              "radial-gradient(circle at top right, rgba(201,168,76,0.55), transparent 65%)",
            display: "flex",
          }}
        />
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 12,
              background: "#c9a84c",
              boxShadow: "0 0 22px #c9a84c",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#fff",
              display: "flex",
            }}
          >
            ZONA<span style={{ color: "#c9a84c", marginLeft: 4 }}>MUNDIAL</span>
          </div>
        </div>

        {/* Category pill */}
        <div
          style={{
            marginTop: 36,
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: "10px 22px",
            borderRadius: 999,
            background: `${catColor}26`,
            border: `2px solid ${catColor}`,
            color: catColor,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {catLabel}
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 28,
            fontSize: 64,
            lineHeight: 1.1,
            fontWeight: 900,
            color: "#fff",
            display: "flex",
            letterSpacing: "-0.02em",
            maxWidth: 1080,
          }}
        >
          {title.length > 110 ? title.slice(0, 107) + "…" : title}
        </div>

        {/* Spacer + footer */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Footer: author + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {author && (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 56,
                  background: `linear-gradient(135deg, ${author.accent}, #5b21b6)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 28,
                  color: "#fff",
                }}
              >
                {author.name.charAt(0)}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
                  {author.name}
                </div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.65)" }}>
                  {author.role}
                </div>
              </div>
            </div>
          )}
          <div
            style={{
              fontSize: 22,
              color: "#c9a84c",
              fontWeight: 700,
              letterSpacing: 1,
              display: "flex",
            }}
          >
            zonamundial.app/noticias
          </div>
        </div>
      </div>
    ),
    size,
  );
}
