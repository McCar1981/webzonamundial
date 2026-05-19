"use client";

/**
 * Banner social-proof: muestra qué creators de ZonaMundial están EN
 * DIRECTO en Twitch ahora mismo.
 *
 * Estilo: urbano streamer.
 *  - Gradient violeta → rosa neon estilo Twitch
 *  - LIVE dot rojo pulsante + ruido sutil
 *  - Avatar circular del creator con borde glow
 *  - Typography mono punky
 *  - Marquee horizontal si hay más de 1 creator
 *  - Click → va a /creadores/[slug] (mantiene al user dentro de ZM)
 *
 * Datos: hace fetch a /api/creators/live cada 60s. Si vacío, el
 * componente NO se renderiza (no ocupa espacio si nadie en live).
 *
 * Solo se monta en client — para no bloquear el SSR del layout root.
 */

import { useEffect, useRef, useState } from "react";

interface LiveCreator {
  slug: string;
  nombre: string;
  imagen: string;
  paisFlag: string;
  twitchUser: string;
  title: string;
  gameName: string;
  thumbnailUrl: string;
  viewerCount: number;
  startedAt: string;
  perfilUrl: string;
  twitchUrl: string;
}

interface LiveStore {
  updatedAt: string;
  live: LiveCreator[];
}

const POLL_INTERVAL_MS = 60_000;
const DISMISS_KEY = "zm.live-banner.dismissedAt";
const DISMISS_TTL_MS = 30 * 60 * 1000; // 30 min

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const t = parseInt(v, 10);
    if (isNaN(t)) return false;
    return Date.now() - t < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function LiveCreatorsBanner() {
  const [creators, setCreators] = useState<LiveCreator[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [idx, setIdx] = useState(0); // índice para rotar el highlight
  const rotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial dismissed check
  useEffect(() => {
    setDismissed(isDismissed());
  }, []);

  // Polling
  useEffect(() => {
    if (dismissed) return;

    let cancelled = false;
    async function poll() {
      try {
        const r = await fetch("/api/creators/live", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as LiveStore;
        if (!cancelled) {
          setCreators(Array.isArray(data.live) ? data.live : []);
        }
      } catch {
        /* network errors silently ignored */
      }
    }
    void poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [dismissed]);

  // Rotar highlight cada 6s si hay más de 1.
  useEffect(() => {
    if (creators.length <= 1) {
      if (rotateRef.current) clearInterval(rotateRef.current);
      setIdx(0);
      return;
    }
    rotateRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % creators.length);
    }, 6000);
    return () => {
      if (rotateRef.current) clearInterval(rotateRef.current);
    };
  }, [creators.length]);

  if (dismissed || creators.length === 0) return null;

  const current = creators[idx % creators.length];
  if (!current) return null;

  const truncatedTitle =
    current.title.length > 80 ? current.title.slice(0, 77) + "..." : current.title;

  return (
    <div
      role="region"
      aria-label="Creators en directo"
      style={{
        position: "relative",
        background:
          "linear-gradient(90deg, #1a0d2e 0%, #6441a5 35%, #e91e63 70%, #1a0d2e 100%)",
        borderBottom: "1px solid rgba(233, 30, 99, 0.4)",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {/* Scanline / noise overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />

      {/* Linkea a la página interna del creador (con Twitch player
          embebido) para mantener al user dentro de ZonaMundial. */}
      <a
        href={current.perfilUrl}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 16px",
          maxWidth: 1280,
          margin: "0 auto",
          textDecoration: "none",
          color: "#fff",
          fontFamily: "var(--zm-font-mono, 'JetBrains Mono', monospace)",
        }}
      >
        {/* LIVE badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: "#ef0e2c",
            color: "#fff",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.22em",
            borderRadius: 4,
            flexShrink: 0,
            boxShadow: "0 0 14px rgba(239,14,44,0.7)",
            textShadow: "0 0 4px rgba(0,0,0,0.4)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#fff",
              animation: "zm-live-pulse 1.2s ease-in-out infinite",
            }}
            aria-hidden
          />
          LIVE
        </span>

        {/* Avatar circular con glow */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            boxShadow:
              "0 0 0 2px #fff, 0 0 0 4px #e91e63, 0 0 16px rgba(233,30,99,0.5)",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imagen}
            alt={current.nombre}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Texto */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ color: "#FDE68A" }}>{current.nombre}</span>{" "}
            <span style={{ color: "#fff", fontWeight: 500 }}>
              está en directo ahora mismo
            </span>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "rgba(255,255,255,0.8)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 500,
            }}
            className="zm-live-subtitle"
          >
            “{truncatedTitle}”
          </div>
        </div>

        {/* Viewers + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
          }}
          className="zm-live-meta"
        >
          {/* Viewers */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "0.02em",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {formatViewers(current.viewerCount)}
          </span>

          {/* CTA */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              background: "#fff",
              color: "#6441a5",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.12em",
              borderRadius: 6,
              textTransform: "uppercase",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
          >
            Ver en directo
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>

          {/* Counter si hay más de 1 */}
          {creators.length > 1 && (
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 700,
                letterSpacing: "0.18em",
                fontVariantNumeric: "tabular-nums",
              }}
              aria-label={`${idx + 1} de ${creators.length} en directo`}
            >
              {idx + 1}/{creators.length}
            </span>
          )}
        </div>
      </a>

      {/* Close button */}
      <button
        type="button"
        aria-label="Ocultar banner"
        onClick={(e) => {
          e.preventDefault();
          markDismissed();
          setDismissed(true);
        }}
        style={{
          position: "absolute",
          top: "50%",
          right: 6,
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          padding: 6,
          lineHeight: 1,
          fontSize: 14,
          fontFamily: "inherit",
          fontWeight: 700,
        }}
        className="zm-live-close"
      >
        ×
      </button>

      <style>{`
        @keyframes zm-live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.7); }
        }
        @media (max-width: 720px) {
          .zm-live-subtitle { display: none; }
          .zm-live-meta { gap: 8px !important; }
          .zm-live-close { right: 2px !important; }
        }
        @media (max-width: 480px) {
          .zm-live-meta span:first-child { display: none; }
        }
      `}</style>
    </div>
  );
}
