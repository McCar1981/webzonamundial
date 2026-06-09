// Dynamic Open Graph image for /selecciones/[slug] BIBLIA fichas.
// Imagen 1200×630 con: bandera del país + nombre + grupo + tagline.
// Cuando alguien comparte /selecciones/argentina en WhatsApp/X/Telegram,
// se ve una tarjeta visual rica en lugar de la genérica.
//
// Edge runtime: rápido, barato, cacheable a nivel de Vercel.

import { ImageResponse } from "next/og";
import { loadTeam } from "@/lib/biblia";

export const runtime = "nodejs"; // loadTeam usa fs (no edge-friendly)

export const alt = "Selección del Mundial 2026 — ZonaMundial";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD_GRAD = "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)";

interface Props {
  params: { slug: string };
}

export default async function OgImage({ params }: Props) {
  // Tolerantes a fallos: si loadTeam tira (fs error, JSON malformado, etc.)
  // devolvemos OG genérica de marca en lugar de 500.
  let team: Awaited<ReturnType<typeof loadTeam>> = null;
  try {
    team = await loadTeam(params.slug);
  } catch (err) {
    console.warn(`[og selecciones] loadTeam falló para ${params.slug}:`, (err as Error).message);
  }

  // Si no existe ficha BIBLIA, OG genérica con marca
  if (!team) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(180deg, #060B14, #0B1825)",
            color: "#fff",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.03em" }}>ZonaMundial</div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginTop: 16 }}>
            Mundial FIFA 2026
          </div>
        </div>
      ),
      size
    );
  }

  const flagSrc = `https://flagcdn.com/${team.iso}.svg`;
  // Algunos slugs canónicos para mostrar grupo (puede no estar en NationalTeam)
  // const groupLetter = team.group?.letter || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.18), transparent 70%), linear-gradient(180deg, #060B14, #0B1825)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "56px 72px",
          position: "relative",
        }}
      >
        {/* Header con brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: GOLD_GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🏆
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", display: "flex" }}>
              <span>zonamundial</span>
              <span style={{ color: "#C9A84C", marginLeft: 4 }}>.app</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                display: "flex",
              }}
            >
              BIBLIA Mundial 2026
            </div>
          </div>
        </div>

        {/* Cuerpo: bandera + nombre + grupo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 56,
            position: "relative",
            paddingTop: 24,
          }}
        >
          {/* Bandera grande */}
          <div
            style={{
              display: "flex",
              width: 280,
              height: 200,
              flexShrink: 0,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 0 0 4px rgba(201,168,76,0.5), 0 0 60px -10px rgba(253,230,138,0.6)",
              background: "#0F1F30",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagSrc}
              alt={team.name_es}
              width={280}
              height={200}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>

          {/* Texto */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: 18,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "#C9A84C",
                fontWeight: 700,
                marginBottom: 14,
                display: "flex",
              }}
            >
              {/* Selección · Mundial 2026 */}
            </div>
            <div
              style={{
                fontSize: 86,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                backgroundImage: GOLD_GRAD,
                backgroundClip: "text",
                color: "transparent",
                display: "flex",
                wordBreak: "break-word",
              }}
            >
              {team.name_es}
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#cbd5e1",
                marginTop: 18,
                lineHeight: 1.4,
                display: "flex",
                maxWidth: 580,
              }}
            >
              Plantilla, capitán, 11 ideal y datos completos.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 22,
            borderTop: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          <div style={{ fontSize: 16, color: "#94a3b8", display: "flex" }}>
            zonamundial.app/selecciones/{params.slug}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 99,
              background: GOLD_GRAD,
              color: "#1A1208",
              display: "flex",
            }}
          >
            FICHA BIBLIA
          </div>
        </div>
      </div>
    ),
    size
  );
}
