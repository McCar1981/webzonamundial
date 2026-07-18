"use client";
/* eslint-disable @next/next/no-img-element */

// src/app/app/draft-mundial/components/SoccerField.tsx
// Campo de fútbol visual con jugadores posicionados POR CASILLA.
// Las coordenadas vienen de lib/draft/layout.ts (derivadas de la formación),
// así que la estructura del campo refleja exactamente lo que el usuario eligió.

import { JugadorSeleccionado } from "@/lib/draft/types";
import { SlotLayout, posicionAbbr } from "@/lib/draft/layout";
import { draftKitUrl, KIT_FALLBACK } from "@/lib/draft/kit";

const FIELD = "#1a5c3a";
const LINE = "rgba(255,255,255,0.25)";
const GOLD = "#c9a84c";
const NAVY = "#0a0906";

interface SoccerFieldProps {
  slots: SlotLayout[];
  equipo: Record<number, JugadorSeleccionado>;
  /** Casilla resaltada (la siguiente a cubrir). */
  highlightSlot?: number | null;
}

export default function SoccerField({ slots, equipo, highlightSlot }: SoccerFieldProps) {
  return (
    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border"
      style={{ background: FIELD, borderColor: "rgba(255,255,255,0.1)" }}
    >
      {/* Campo. viewBox 75x100 = ratio 3:4 = el del contenedor, así la escala
          es uniforme y los círculos NO se deforman. */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 75 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="draft-turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c6e44" />
            <stop offset="100%" stopColor="#134d2f" />
          </linearGradient>
        </defs>

        {/* Césped + franjas de corte horizontales */}
        <rect x="0" y="0" width="75" height="100" fill="url(#draft-turf)" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x="0" y={i * 10} width="75" height="10"
            fill={i % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)"} />
        ))}

        {/* Marcaje */}
        <g stroke={LINE} strokeWidth="0.4" fill="none" strokeLinejoin="round">
          <rect x="3.5" y="3.5" width="68" height="93" rx="1" />
          <line x1="3.5" y1="50" x2="71.5" y2="50" />
          <circle cx="37.5" cy="50" r="9" />
          <circle cx="37.5" cy="50" r="0.7" fill={LINE} stroke="none" />

          {/* --- Portería rival (arriba) --- */}
          <rect x="18.5" y="3.5" width="38" height="15" />
          <rect x="28.5" y="3.5" width="18" height="6" />
          <circle cx="37.5" cy="13" r="0.6" fill={LINE} stroke="none" />
          <path d="M30.38 18.5 Q37.5 23 44.62 18.5" />
          <rect x="33.5" y="1.7" width="8" height="1.8" rx="0.4" />

          {/* --- Portería propia (abajo) --- */}
          <rect x="18.5" y="81.5" width="38" height="15" />
          <rect x="28.5" y="90.5" width="18" height="6" />
          <circle cx="37.5" cy="87" r="0.6" fill={LINE} stroke="none" />
          <path d="M30.38 81.5 Q37.5 77 44.62 81.5" />
          <rect x="33.5" y="96.5" width="8" height="1.8" rx="0.4" />

          {/* Córners */}
          <path d="M3.5 5.5 Q5.5 5.5 5.5 3.5" />
          <path d="M71.5 5.5 Q69.5 5.5 69.5 3.5" />
          <path d="M3.5 94.5 Q5.5 94.5 5.5 96.5" />
          <path d="M71.5 94.5 Q69.5 94.5 69.5 96.5" />
        </g>
      </svg>

      {/* Casillas */}
      {slots.map((slot) => {
        const jug = equipo[slot.id];
        const isHighlighted = slot.id === highlightSlot;

        // Hueco vacío → fantasma con la posición requerida.
        if (!jug) {
          return (
            <div
              key={slot.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dashed${isHighlighted ? " animate-pulse" : ""}`}
                  style={{
                    borderColor: isHighlighted ? GOLD : "rgba(255,255,255,0.35)",
                    color: isHighlighted ? GOLD : "rgba(255,255,255,0.6)",
                    background: isHighlighted ? `${GOLD}22` : "rgba(0,0,0,0.18)",
                  }}
                >
                  {isHighlighted ? "?" : ""}
                </div>
                <div className="px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5"
                  style={{ background: isHighlighted ? `${GOLD}44` : "rgba(0,0,0,0.4)", color: isHighlighted ? GOLD : "rgba(255,255,255,0.7)" }}>
                  {posicionAbbr(slot.pos)}
                </div>
              </div>
            </div>
          );
        }

        // Casilla cubierta → camiseta del jugador.
        const kitSrc = draftKitUrl(jug.seleccion);
        const fb = KIT_FALLBACK[jug.seleccion];

        return (
          <div
            key={slot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="relative">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2"
                  style={{
                    background: fb?.bg ?? "#e2e8f0",
                    borderColor: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {kitSrc ? (
                    <img
                      src={kitSrc}
                      alt={jug.seleccion}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold"
                      style={{ color: fb?.text ?? "#fff" }}>
                      {jug.seleccion.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Badge fuerza */}
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border"
                  style={{ background: NAVY, color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
                >
                  {jug.fuerza}
                </div>
              </div>
              {/* Nombre */}
              <div
                className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold whitespace-nowrap"
                style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
              >
                {jug.nombre.length > 8 ? jug.nombre.slice(0, 8) + "…" : jug.nombre}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
