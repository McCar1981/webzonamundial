"use client";

// FormationBoard — alineación estilo Google: campo VERTICAL (portrait) con el
// once dibujado como CAMISETAS de los colores REALES de la selección (BIBLIA,
// kit titular), badge de formación, dorsal + apellido, y debajo la lista de
// SUPLENTES y el seleccionador. Estático (sin animación): es la pestaña
// "Alineaciones", complementaria al campo animado en vivo de la pestaña General.
//
// Reutiliza el modelo de datos del Match Center (TeamLineup) y los colores de
// camiseta precomputados en src/data/kits-2026.ts. Si la selección no tiene kit
// real, cae al color primario del equipo (meta.color). Si la API aún no publicó
// el once, muestra el aviso "por confirmar" en vez de inventar nombres.

import { useMemo } from "react";
import type { MatchMeta, TeamLineup } from "@/lib/match-center/types";
import { lastName } from "@/lib/match-center/names";
import { kitColors } from "@/data/kits-2026";

const BG2 = "#0F1D32";
const MID = "#8a94b0";
const DIM = "#6a7a9a";
const GOLD2 = "#e8d48b";

// Silueta de camiseta (misma que el campo animado), centrada en (0,0).
const SHIRT = "M-12,-7 L-6,-10.5 L-3,-8 Q0,-6 3,-8 L6,-10.5 L12,-7 L9.5,-1.5 L9,17 Q0,20 -9,17 L-9.5,-1.5 Z";

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
/** Texto legible sobre la camiseta (negro o blanco según luminancia). */
function inkOn(fill: string): string {
  return lum(fill) > 0.6 ? "#10202c" : "#ffffff";
}

interface KitPair {
  out: string; // jugador de campo
  gk: string; // portero (contraste)
  trim: string; // detalle (cuello/mangas)
}

/** Colores de camiseta de la selección: kit real (BIBLIA) o color del equipo. */
function teamKit(flag: string, fallback: string): KitPair {
  const real = kitColors(flag);
  const primary = real?.primary || fallback || "#3b82f6";
  // Aclara primarios muy oscuros para que se lean sobre el césped.
  const out = lum(primary) < 0.16 ? "#2b3a52" : primary;
  const trim = real?.secondary || (lum(out) > 0.6 ? "#10202c" : "#ffffff");
  // Portero: alto contraste con la camiseta de campo.
  const gk = lum(out) > 0.5 ? "#1f2d44" : "#16e0a8";
  return { out, gk, trim };
}

interface Props {
  team: MatchMeta["home"];
  lineup: TeamLineup;
  /** En vivo: si la API aún no publicó el once, muestra "por confirmar". */
  allowPending?: boolean;
}

export default function FormationBoard({ team, lineup, allowPending }: Props) {
  const kit = useMemo(() => teamKit(team.flag, team.color), [team.flag, team.color]);
  const confirmed = lineup.starters.some((p) => !!p.name);

  // Camiseta REAL diseñada (PNG en /public). Si falta, se cae a la silueta de
  // color. El dorsal va superpuesto sobre el pecho con contraste automático.
  const kc = kitColors(team.flag);
  const jersey = kc?.image ?? null;
  const numInk = kc && lum(kc.primary) > 0.6 ? "#0b1825" : "#ffffff";
  const numStroke = numInk === "#ffffff" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)";

  // viewBox vertical; la selección ataca hacia ARRIBA (portero abajo).
  const W = 320;
  const H = 380;
  const padX = 30;
  const padTop = 34;
  const padBot = 30;

  // Reproyección: el modelo guarda x 0..0.5 (medio campo propio, 0 = portería) e
  // y 0..1 (lateral). En vertical: eje Y del tablero = profundidad (portero
  // abajo → ataque arriba), eje X = lateral.
  const project = (px: number, py: number) => {
    const depth = Math.min(1, Math.max(0, (0.5 - px) / 0.5)); // 0 portería .. 1 ataque
    const X = padX + py * (W - 2 * padX);
    // Portero ABAJO (junto a su área, depth alto → Y alto) y ataque ARRIBA.
    const Y = padTop + depth * (H - padTop - padBot);
    return { X, Y };
  };

  return (
    <div style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
      {/* Cabecera: bandera + nombre + badge de formación */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <img src={`https://flagcdn.com/w40/${team.flag}.png`} alt="" style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
        <span className="mc-condensed" style={{ fontSize: 16, fontWeight: 800, textTransform: "uppercase", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#06210f", background: "#16c772", borderRadius: 8, padding: "3px 9px", letterSpacing: 0.5 }}>{lineup.formation}</span>
      </div>

      {!confirmed && allowPending ? (
        <div style={{ padding: "26px 18px", textAlign: "center", color: MID, fontSize: 13.5, lineHeight: 1.6 }}>
          Alineación oficial por confirmar.<br />
          <span style={{ color: DIM, fontSize: 12 }}>api-football publica el once unos 40 minutos antes del saque.</span>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} role="img" aria-label={`Formación ${lineup.formation} de ${team.name}`}>
          {/* Césped */}
          <defs>
            <linearGradient id={`turf-${team.flag}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1f6b3a" />
              <stop offset="1" stopColor="#175a31" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill={`url(#turf-${team.flag})`} />
          {/* Franjas de césped */}
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x="0" y={(H / 6) * i} width={W} height={H / 12} fill="rgba(255,255,255,0.03)" />
          ))}
          {/* Líneas del campo (medio arriba, área abajo) */}
          <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" fill="none">
            <rect x={padX * 0.5} y={padTop * 0.5} width={W - padX} height={H - padTop * 0.5 - padBot * 0.5} rx="3" />
            <line x1={padX * 0.5} y1={padTop * 0.5} x2={W - padX * 0.5} y2={padTop * 0.5} />
            <rect x={W / 2 - 46} y={H - padBot * 0.5 - 42} width="92" height="42" />
            <rect x={W / 2 - 22} y={H - padBot * 0.5 - 18} width="44" height="18" />
          </g>

          {lineup.starters.map((p, i) => {
            const { X, Y } = project(p.x, p.y);
            const isGk = (p.pos || "").toUpperCase().startsWith("G") || i === 0;
            const fill = isGk ? kit.gk : kit.out;
            const ink = inkOn(fill);
            const label = p.name ? lastName(p.name) : `#${p.num}`;
            return (
              <g key={`${p.num}-${i}`} transform={`translate(${X},${Y})`}>
                {/* sombra */}
                <ellipse cx="0" cy="16" rx="12" ry="3.2" fill="rgba(0,0,0,0.30)" />
                {jersey ? (
                  // Camiseta REAL diseñada del repo (PNG). El portero, sin kit
                  // propio diseñado, viste también la titular.
                  <image href={jersey} x={-15} y={-15} width={30} height={30} preserveAspectRatio="xMidYMid meet" />
                ) : (
                  // Respaldo (no debería ocurrir: las 48 tienen PNG).
                  <g transform="scale(0.92)">
                    <path d={SHIRT} fill={fill} stroke="#0b1825" strokeWidth="1.2" />
                    <path d="M-3,-8 Q0,-6 3,-8 L2,-5 Q0,-3.6 -2,-5 Z" fill={kit.trim} opacity="0.95" />
                  </g>
                )}
                {/* dorsal sobre el pecho, con contorno para legibilidad */}
                <text x="0" y="3" textAnchor="middle" fontSize="10.5" fontWeight="900"
                  fill={jersey ? numInk : ink} stroke={jersey ? numStroke : "none"} strokeWidth="0.5"
                  paintOrder="stroke" fontFamily="'Oswald','Outfit',sans-serif">{p.num}</text>
                {/* nombre */}
                <g transform="translate(0,28)">
                  <rect x="-31" y="-9" width="62" height="16" rx="4" fill="rgba(6,15,24,0.78)" />
                  <text x="0" y="2.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#eef2f9">{label.length > 11 ? label.slice(0, 10) + "…" : label}</text>
                </g>
              </g>
            );
          })}
        </svg>
      )}

      {/* Suplentes + entrenador */}
      {(lineup.substitutes?.length || lineup.coach) && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {lineup.coach && (
            <div style={{ fontSize: 12.5, color: MID, marginBottom: lineup.substitutes?.length ? 10 : 0 }}>
              <span style={{ color: DIM }}>Entrenador:</span> <span style={{ color: "#fff", fontWeight: 600 }}>{lineup.coach}</span>
            </div>
          )}
          {lineup.substitutes && lineup.substitutes.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: GOLD2, textTransform: "uppercase", marginBottom: 8 }}>Suplentes</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "4px 14px" }}>
                {lineup.substitutes.map((s, i) => (
                  <div key={`${s.num}-${i}`} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
                    <span className="mc-num" style={{ color: DIM, minWidth: 18, textAlign: "right", fontWeight: 700 }}>{s.num || "–"}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name ? lastName(s.name) : "—"}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
