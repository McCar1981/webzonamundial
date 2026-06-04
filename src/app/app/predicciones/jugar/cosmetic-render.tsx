// Helpers de render de cosméticos (mejora G) reutilizados por rankings y ligas.
// El backend resuelve los cosméticos equipados a valores visuales y los manda en
// el payload; aquí solo los pintamos. Sin estado: funciones/componentes puros.

import type { CSSProperties } from "react";

export interface CosmeticDisplay {
  frame: { color: string; gradient?: string; glow?: string } | null;
  name_color: { color: string; gradient?: string } | null;
  title: string | null;
}

const GOLD2 = "#e8d48b", DIM = "#6a7a9a";

/** Estilo del aro/marco para envolver el badge de posición (o avatar). */
export function frameStyle(c: CosmeticDisplay | null | undefined): CSSProperties {
  const f = c?.frame;
  if (!f) return {};
  return {
    borderRadius: 99,
    padding: 2,
    background: f.gradient ?? f.color,
    boxShadow: f.glow ? `0 0 12px ${f.glow}` : undefined,
  };
}

/** Estilo para pintar el nombre con color/degradado equipado. */
export function nameColorStyle(c: CosmeticDisplay | null | undefined): CSSProperties {
  const nc = c?.name_color;
  if (!nc) return {};
  if (nc.gradient) {
    return {
      background: nc.gradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
  }
  return { color: nc.color };
}

/** Chip del título equipado (etiqueta de prestigio junto al nombre). */
export function TitleChip({ title }: { title: string | null | undefined }) {
  if (!title) return null;
  return (
    <span
      style={{
        fontSize: 10.5, fontWeight: 800, color: GOLD2, border: "1px solid rgba(232,212,139,0.35)",
        background: "rgba(232,212,139,0.08)", borderRadius: 99, padding: "1px 7px",
        letterSpacing: 0.3, whiteSpace: "nowrap",
      }}
    >
      {title}
    </span>
  );
}

/** Badge de posición envuelto con el marco equipado (si lo hay). */
export function PositionBadge({ position, cosmetics, top3color, baseColor, innerBg }: {
  position: number; cosmetics: CosmeticDisplay | null | undefined;
  top3color: string; baseColor: string; innerBg: string;
}) {
  const fr = frameStyle(cosmetics);
  const num = (
    <span style={{ fontWeight: 900, color: position <= 3 ? top3color : baseColor, fontSize: 14 }}>
      {position}
    </span>
  );
  if (!cosmetics?.frame) {
    return <span style={{ width: 26, textAlign: "center", display: "inline-flex", justifyContent: "center" }}>{num}</span>;
  }
  return (
    <span style={{ ...fr, display: "inline-flex" }}>
      <span style={{ background: innerBg, borderRadius: 99, width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {num}
      </span>
    </span>
  );
}

export { DIM, GOLD2 };
