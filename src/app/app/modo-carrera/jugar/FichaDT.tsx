// src/app/app/modo-carrera/jugar/FichaDT.tsx
// Carta del DT estilo FIFA (pieza visual central del Modo Carrera). Muestra el
// overall 0-99, el rango, la bandera de la nación adoptada, el nombre, la
// filosofía y la moral. Determinista a partir de avatarSeed (sin imágenes
// externas todavía: el "retrato" es un monograma generado).

"use client";

import { GOLD, GOLD2, BG, flagUrl } from "./fx";
import { philosophyDef, rankForOverall } from "@/lib/modo-carrera/constants";
import type { DTIdentity, Progression } from "@/lib/modo-carrera/types";
import { SELECCIONES } from "@/data/selecciones";

// SVG por filosofía (heredan color con currentColor). Sin emojis.
export function PhilosophyIcon({ id, size = 20 }: { id: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "ofensiva":
      return (<svg {...common}><path d="M3 12h12" /><path d="m13 6 6 6-6 6" /><path d="M19 12h2" /></svg>);
    case "defensiva":
      return (<svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
    case "posesion":
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>);
    case "contragolpe":
      return (<svg {...common}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="9" /></svg>);
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function FichaDT({
  identity,
  progression,
  compact = false,
}: {
  identity: DTIdentity;
  progression: Progression;
  compact?: boolean;
}) {
  const phil = philosophyDef(identity.philosophy);
  const accent = phil?.accent ?? GOLD;
  const rank = rankForOverall(progression.overall);
  const nation = SELECCIONES.find((s) => s.slug === identity.nationSlug) ?? null;
  const w = compact ? 200 : 260;

  return (
    <div
      data-ficha-dt
      style={{
        width: w,
        maxWidth: "100%",
        aspectRatio: "3 / 4.2",
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        // Textura foil dorada sobre el degradado base (si no carga, queda el degradado).
        backgroundColor: GOLD,
        backgroundImage: `linear-gradient(160deg, rgba(232,212,139,0.55) 0%, rgba(201,168,76,0.35) 35%, rgba(138,111,40,0.6) 100%), url('/img/modo-carrera/card-texture.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        color: BG,
        fontFamily: "'Outfit',sans-serif",
        padding: 16,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Barrido de brillo (shine sweep) */}
      <div
        data-ficha-shine
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Cabecera: overall + rango */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontSize: compact ? 38 : 48, fontWeight: 900, lineHeight: 1 }}>{progression.overall}</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{rank.name}</div>
        </div>
        {nation && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flagUrl(nation.flagCode)}
            alt={nation.nombre}
            width={40}
            height={28}
            style={{ borderRadius: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.3)", objectFit: "cover" }}
          />
        )}
      </div>

      {/* Retrato (monograma determinista) */}
      <div
        style={{
          margin: "10px auto",
          width: compact ? 70 : 92,
          height: compact ? 70 : 92,
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), ${accent})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? 26 : 34,
          fontWeight: 900,
          color: BG,
          border: "3px solid rgba(0,0,0,0.15)",
          position: "relative",
        }}
      >
        {initials(identity.name)}
      </div>

      {/* Nombre */}
      <div style={{ textAlign: "center", fontSize: compact ? 15 : 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, position: "relative" }}>
        {identity.name || "Nuevo DT"}
      </div>

      {/* Filosofía */}
      {phil && (
        <div style={{ textAlign: "center", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: BG, position: "relative" }}>
          <PhilosophyIcon id={phil.id} size={16} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>{phil.name}</span>
        </div>
      )}

      {/* Moral */}
      <div style={{ marginTop: "auto", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          <span>Moral</span>
          <span>{progression.morale}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.18)", overflow: "hidden" }}>
          <div
            data-ficha-morale
            style={{
              height: "100%",
              width: `${progression.morale}%`,
              borderRadius: 3,
              background: progression.morale >= 60 ? "#15803d" : progression.morale >= 35 ? "#b45309" : "#991b1b",
            }}
          />
        </div>
      </div>
    </div>
  );
}
