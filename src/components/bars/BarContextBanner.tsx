// src/components/bars/BarContextBanner.tsx
//
// Banner de CONTEXTO DE BAR para la experiencia de predicciones (/app/*).
//
// Problema que resuelve: al entrar en la porra de un bar, el usuario aterriza en
// el motor de predicciones de ZonaMundial, que usa la paleta azul+dorado de ZM y
// hace que se pierda toda la identidad del bar. Este banner reintroduce la marca
// del bar (logo, nombre y color de acento de su tema) de forma persistente y, a
// la vez, conserva las vías para navegar por ZM (el resto de la UI sigue siendo
// ZM y hay un enlace claro para "volver a la porra").
//
// Mecánica: se activa con la cookie `zm_bar=<slug>` que se fija al entrar en la
// porra (POST /api/bars/join). Si no hay cookie o el bar no existe, no pinta nada
// y la experiencia ZM queda intacta para el resto de usuarios.

import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { getBarBySlug } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";
import BarContextExit from "./BarContextExit";

export default async function BarContextBanner() {
  const slug = cookies().get("zm_bar")?.value;
  if (!slug) return null;

  const bar = await getBarBySlug(slug);
  if (!bar) return null;

  const t = getTheme(bar.theme_id);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: t.surface,
        borderBottom: `1px solid ${t.border}`,
        // Franja de acento del bar: identidad de marca visible al instante.
        boxShadow: `inset 0 3px 0 0 ${t.primary}`,
        color: t.text,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Logo del bar (o inicial) */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            border: `1.5px solid ${t.primary}`,
            background: bar.logo_url ? `center/cover url(${bar.logo_url})` : t.surface2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 15,
            color: t.primary,
          }}
        >
          {!bar.logo_url && bar.name.charAt(0).toUpperCase()}
        </div>

        {/* Nombre + contexto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: t.primary,
              fontWeight: 800,
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            <Trophy size={11} /> Estás jugando la porra de
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 14,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bar.name}
          </div>
        </div>

        {/* Volver a la porra del bar */}
        <Link
          href={`/b/${bar.slug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            textDecoration: "none",
            background: t.primary,
            color: t.primaryInk,
            borderRadius: t.buttonRadius,
            fontWeight: 800,
            fontSize: 12.5,
            padding: "7px 12px",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={13} /> Volver a la porra
        </Link>

        {/* Salir del contexto de bar (limpia la cookie) */}
        <BarContextExit color={t.textMuted} />
      </div>
    </div>
  );
}
