"use client";

/**
 * Página individual de creador. Layout:
 *
 *  - Hero: avatar circular + nombre + país + bio + redes sociales
 *  - Player Twitch embebido (si tiene cuenta twitch): channel live o
 *    último VOD. Si está EN DIRECTO, badge "🔴 LIVE" + viewer count
 *    (consultando /api/creators/live).
 *  - Lista de redes sociales con icono + handle.
 *  - CTA volver al roster.
 *
 * Diseño coherente con el resto de la web (gold accents, dark bg).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Creador } from "@/data/creadores";

const BG = "#060B14";
const BG2 = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

interface LiveCreator {
  slug: string;
  viewerCount: number;
  title: string;
  gameName: string;
  thumbnailUrl: string;
  twitchUser: string;
}

interface LiveStore {
  updatedAt: string;
  live: LiveCreator[];
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function getTwitchUser(creador: Creador): string | null {
  const r = creador.redes.find((red) => red.plataforma === "twitch");
  if (!r) return null;
  return r.usuario.toLowerCase().trim() || null;
}

interface SocialIconProps {
  plataforma: string;
}

function SocialIcon({ plataforma }: SocialIconProps) {
  const common = { width: 18, height: 18, fill: "currentColor" } as const;
  switch (plataforma) {
    case "twitch":
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
        </svg>
      );
    case "threads":
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path d="M17.36 11.13c-.07-.04-.15-.07-.22-.1-.13-2.47-1.47-3.89-3.74-3.91-.99 0-1.83.41-2.36 1.18l1.31.86c.36-.55.94-.66 1.45-.66.62 0 1.09.19 1.41.55.23.27.39.65.46 1.13-.5-.08-1.04-.11-1.59-.07-1.81.1-2.97 1.16-2.89 2.62.04.74.41 1.38 1.04 1.79.53.35 1.21.52 1.92.48 1.59-.09 2.65-1 2.98-2.31.18-.07.36-.16.53-.27.84-.55 1.42-1.4 1.42-2.47-.01-.93-.46-1.78-1.72-2.32m-2.47 3.32c-.91.05-1.59-.36-1.62-.92-.04-.66.65-1.06 1.62-1.11.13-.01.25-.01.37-.01.34 0 .67.02 1 .07-.18.92-.71 1.92-1.37 1.97" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CreadorDetailClient({
  creador,
}: {
  creador: Creador;
}) {
  const twitchUser = getTwitchUser(creador);
  const [liveData, setLiveData] = useState<LiveCreator | null>(null);
  const [parentDomain, setParentDomain] = useState<string>("zonamundial.app");

  // Set parent (necesario para el iframe de Twitch).
  useEffect(() => {
    setParentDomain(window.location.hostname);
  }, []);

  // Polling cada 60s a /api/creators/live para saber si está en directo.
  useEffect(() => {
    if (!twitchUser) return;
    let cancelled = false;
    async function poll() {
      try {
        const r = await fetch("/api/creators/live", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as LiveStore;
        if (cancelled) return;
        const mine = data.live.find((c) => c.twitchUser === twitchUser);
        setLiveData(mine || null);
      } catch {
        /* ignore */
      }
    }
    void poll();
    const id = setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [twitchUser]);

  const isLive = liveData !== null;

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "var(--zm-font-outfit, system-ui, sans-serif)",
        paddingBottom: 80,
      }}
    >
      {/* Hero */}
      <section
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${creador.colorPrimario}22, transparent 60%), linear-gradient(180deg, ${BG2} 0%, ${BG} 100%)`,
          padding: "80px 24px 56px",
          borderBottom: "1px solid rgba(201,168,76,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            alignItems: "center",
          }}
        >
          {/* Avatar + LIVE badge */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                overflow: "hidden",
                border: `4px solid ${isLive ? "#ef0e2c" : creador.colorPrimario}`,
                boxShadow: isLive
                  ? "0 0 32px rgba(239,14,44,0.5)"
                  : `0 0 32px ${creador.colorPrimario}40`,
                transition: "all 0.4s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creador.imagen}
                alt={creador.nombre}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {isLive && (
              <span
                style={{
                  position: "absolute",
                  bottom: -6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ef0e2c",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  padding: "5px 12px",
                  borderRadius: 4,
                  boxShadow: "0 0 14px rgba(239,14,44,0.7)",
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
                />
                LIVE
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: GOLD,
                fontSize: 12,
                letterSpacing: "0.22em",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <span>{creador.plataformaPrincipal}</span>
              <span style={{ color: DIM }}>·</span>
              <span style={{ color: MID }}>{creador.pais}</span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(34px, 6vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                background: `linear-gradient(135deg, #fff 0%, ${creador.colorSecundario} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {creador.nombre}
            </h1>
            <p
              style={{
                marginTop: 12,
                fontSize: 14,
                color: GOLD2,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {creador.handle} · {creador.seguidores} seguidores
            </p>
            <p
              style={{
                marginTop: 20,
                fontSize: 16,
                lineHeight: 1.65,
                color: MID,
                maxWidth: 620,
              }}
            >
              {creador.bio}
            </p>
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: DIM,
                fontStyle: "italic",
              }}
            >
              Contenido: {creador.contenido}
            </p>

            {/* Redes */}
            <div
              style={{
                marginTop: 24,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {creador.redes.map((red) => (
                <a
                  key={red.plataforma + red.url}
                  href={red.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = GOLD;
                    e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.15)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  <SocialIcon plataforma={red.plataforma} />
                  <span>{red.usuario}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Twitch player */}
      {twitchUser && (
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "48px 24px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 18,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              {isLive ? "🔴 En directo ahora" : "Canal de Twitch"}
            </h2>
            {isLive && liveData && (
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  fontSize: 13,
                  color: MID,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "#ef0e2c", fontWeight: 800 }}>
                  {formatViewers(liveData.viewerCount)} viewers
                </span>
                {liveData.gameName && (
                  <span style={{ color: GOLD }}>{liveData.gameName}</span>
                )}
              </div>
            )}
          </div>

          {isLive && liveData?.title && (
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 15,
                color: GOLD2,
                fontWeight: 600,
              }}
            >
              “{liveData.title}”
            </p>
          )}

          <div
            style={{
              position: "relative",
              paddingTop: "56.25%", // 16:9
              background: "#000",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(201,168,76,0.18)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            <iframe
              src={`https://player.twitch.tv/?channel=${twitchUser}&parent=${parentDomain}&autoplay=false`}
              title={`${creador.nombre} en Twitch`}
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </div>

          {/* Chat opcional debajo del player (Twitch chat embed). */}
          <details
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            <summary
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: MID,
                listStyle: "none",
              }}
            >
              Ver chat en vivo →
            </summary>
            <div
              style={{
                marginTop: 14,
                position: "relative",
                height: 480,
                background: "#000",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <iframe
                src={`https://www.twitch.tv/embed/${twitchUser}/chat?parent=${parentDomain}&darkpopout`}
                title={`Chat de ${creador.nombre}`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
              />
            </div>
          </details>
        </section>
      )}

      {/* Volver */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px 0",
        }}
      >
        <Link
          href="/creadores"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: GOLD,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          ← Volver al roster
        </Link>
      </section>

      <style>{`
        @keyframes zm-live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
