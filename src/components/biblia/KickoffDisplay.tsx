"use client";

// KickoffDisplay — fecha y hora de un partido en MÚLTIPLES husos horarios.
//
// Estrategia de UX:
//   1. Por defecto muestra la HORA DEL USUARIO (auto-detectada).
//   2. Toggle compacto para alternar a HORA DEL ESTADIO.
//   3. Hover/tap → tooltip con 4 zonas: usuario, estadio, Madrid, Buenos Aires.
//
// SSR-safe: en el primer render usa la hora del estadio (sin window).
// Tras hidratar, useEffect detecta el huso del visitante y cambia.
// El espacio reservado es el mismo en ambos casos → cero layout shift.

import { useEffect, useState } from "react";
import {
  buildKickoffDate,
  detectViewerTimezone,
  formatKickoff,
  humanizeTz,
  REFERENCE_TIMEZONES,
  resolveVenueTimezone,
} from "@/lib/timezone";

interface KickoffDisplayProps {
  /** "2026-06-16" */
  localDate: string;
  /** "12:00" */
  localTime: string;
  /** Ciudad del estadio (para inferir timezone si no viene explícito) */
  city?: string;
  /** ISO del país del estadio: "us", "mx", "ca" */
  countryIso?: string;
  /** IANA timezone explícito (ej. "America/New_York"). Si no, se infiere. */
  timezone?: string;
  /** Compacto: solo hora + label, sin fecha */
  compact?: boolean;
  /** "stadium" o "viewer" — fuerza un modo. Por defecto "viewer" tras hidratar. */
  defaultMode?: "stadium" | "viewer";
}

export default function KickoffDisplay({
  localDate,
  localTime,
  city,
  countryIso,
  timezone: explicitTz,
  compact = false,
  defaultMode = "viewer",
}: KickoffDisplayProps) {
  const venueTz = explicitTz ?? resolveVenueTimezone(city, countryIso);

  // Construir el Date UTC del kickoff (mismo en server y cliente)
  const kickoffUtc = buildKickoffDate(localDate, localTime, venueTz);

  // Estado de huso del usuario (solo se conoce tras hidratar)
  const [viewerTz, setViewerTz] = useState<string>(venueTz);
  const [mode, setMode] = useState<"viewer" | "stadium">(defaultMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const tz = detectViewerTimezone();
    setViewerTz(tz);
    setHydrated(true);
  }, []);

  if (!kickoffUtc) {
    return (
      <div className="text-center">
        <div className="text-sm text-white font-semibold">
          Fecha por confirmar
        </div>
      </div>
    );
  }

  // Antes de hidratar: usar hora del estadio (consistente con SSR)
  const activeTz = !hydrated || mode === "stadium" ? venueTz : viewerTz;
  const formatted = formatKickoff(kickoffUtc, activeTz);
  const venueFormatted = formatKickoff(kickoffUtc, venueTz);

  // ¿Cambia el día entre estadio y usuario?
  const dayDiffers =
    hydrated &&
    mode === "viewer" &&
    formatted.date !== venueFormatted.date;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Fecha + hora primarias */}
      {!compact ? (
        <div className="text-sm font-semibold text-white text-center">
          {formatted.date}
        </div>
      ) : null}

      <div className="flex items-baseline gap-1.5 text-center">
        <span className="text-base font-bold text-white">
          {formatted.time}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--bb-gold)]">
          {formatted.tzLabel}
        </span>
      </div>

      {/* Toggle viewer/stadium + mini referencia */}
      {hydrated ? (
        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "viewer" ? "stadium" : "viewer"))
          }
          className="bb-focusable group inline-flex items-center gap-1 text-[10px] text-[var(--bb-text-muted)] hover:text-[var(--bb-gold)] transition-colors mt-0.5"
          aria-label={
            mode === "viewer"
              ? "Cambiar a hora local del estadio"
              : "Cambiar a tu hora local"
          }
        >
          <SwapIcon />
          <span>
            {mode === "viewer"
              ? `Hora local en ${humanizeTz(activeTz)}`
              : `Hora estadio · ${city ?? humanizeTz(venueTz)}`}
          </span>
        </button>
      ) : null}

      {/* Aviso si el partido es otro día en zona del visitante */}
      {dayDiffers ? (
        <span
          className="text-[9px] text-[var(--bb-text-dim)] italic"
          title={`En ${city ?? humanizeTz(venueTz)} es ${venueFormatted.date}`}
        >
          ({venueFormatted.date} en estadio)
        </span>
      ) : null}

      {/* Multi-zona pequeñito (solo si NO es compact) */}
      {!compact && hydrated ? (
        <details className="text-[10px] mt-1.5 group">
          <summary className="bb-focusable list-none cursor-pointer text-[var(--bb-text-muted)] hover:text-[var(--bb-gold)] transition-colors">
            <span className="underline decoration-dotted underline-offset-2">
              Ver en otras zonas
            </span>
          </summary>
          <div className="mt-2 grid grid-cols-1 gap-0.5 text-left bg-[var(--bb-card-ghost)] rounded-lg p-2 border border-[var(--bb-border-subtle)] min-w-[180px]">
            {REFERENCE_TIMEZONES.filter((tz) => tz !== activeTz).map((tz) => {
              const f = formatKickoff(kickoffUtc, tz);
              return (
                <div
                  key={tz}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-[var(--bb-text-muted)]">
                    {humanizeTz(tz)}
                  </span>
                  <span className="font-mono text-white">
                    {f.time}
                    <span className="text-[var(--bb-text-dim)] ml-1">
                      {f.tzLabel}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function SwapIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
