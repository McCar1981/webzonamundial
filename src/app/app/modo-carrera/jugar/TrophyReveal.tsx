// src/app/app/modo-carrera/jugar/TrophyReveal.tsx
// Pilar 7 — Reveal de trofeo a PANTALLA COMPLETA: rayos de luz girando, copa con
// zoom y confeti dorado. Usa la imagen del trofeo si existe; si no, una copa
// dibujada en CSS hace de fallback. Sin emojis (confeti = divs SVG-friendly).

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BG, GOLD, GOLD2, MID } from "./fx";
import type { Trophy } from "@/lib/modo-carrera/types";

const TROPHY_IMG = "/img/modo-carrera/trofeos/trofeo-mundial.png";

// Piezas de confeti deterministas (sin random en render para evitar parpadeos).
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 9) * 0.12,
  dur: 1.8 + (i % 5) * 0.25,
  color: [GOLD, GOLD2, "#fff", "#d9c27a"][i % 4],
  size: 6 + (i % 3) * 3,
}));

export default function TrophyReveal({ trophy, paseDT = false, onClose }: { trophy: Trophy; paseDT?: boolean; onClose: () => void }) {
  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Trofeo: ${trophy.name}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.22), rgba(6,11,20,0.92) 60%, ${BG} 100%)`,
        animation: "mcTrFade .4s ease both",
        overflow: "hidden",
        padding: 20,
      }}
    >
      <style>{`
        @keyframes mcTrFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mcTrRays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mcTrRise { 0% { transform: translateY(40px) scale(.6); opacity: 0; } 60% { transform: translateY(-6px) scale(1.06); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes mcTrText { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mcTrConfetti { 0% { transform: translateY(-12vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(96vh) rotate(540deg); opacity: 0; } }
      `}</style>

      {/* Vídeo de reveal (de fondo; si no carga, quedan rayos + confeti + copa) */}
      <video
        aria-hidden
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.4,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
        onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
      >
        <source src="/img/modo-carrera/video/trofeo-reveal.mp4" type="video/mp4" />
      </video>

      {/* Rayos de luz girando */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "150vmax",
          height: "150vmax",
          background: `repeating-conic-gradient(from 0deg, rgba(201,168,76,0.10) 0deg 6deg, transparent 6deg 16deg)`,
          animation: "mcTrRays 22s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Confeti */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.6,
              background: c.color,
              borderRadius: 2,
              animation: `mcTrConfetti ${c.dur}s ease-in ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Copa */}
      <div style={{ position: "relative", zIndex: 1, animation: "mcTrRise 1s cubic-bezier(.2,.8,.2,1) both" }}>
        {/* Fallback CSS (copa dibujada) — queda detrás de la imagen si existe. */}
        <div aria-hidden style={{ position: "relative", width: 180, height: 240, margin: "0 auto" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={150} height={210} viewBox="0 0 150 210" aria-hidden>
              <defs>
                <linearGradient id="mcCup" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={GOLD2} />
                  <stop offset="0.6" stopColor={GOLD} />
                  <stop offset="1" stopColor="#8a6f28" />
                </linearGradient>
              </defs>
              <path d="M40 20 h70 v34 a35 35 0 0 1-70 0z" fill="url(#mcCup)" />
              <path d="M40 28 H22 a14 14 0 0 0 18 22 M110 28 h18 a14 14 0 0 1-18 22" fill="none" stroke="url(#mcCup)" strokeWidth="7" />
              <rect x="68" y="86" width="14" height="34" fill="url(#mcCup)" />
              <rect x="50" y="120" width="50" height="12" rx="3" fill="url(#mcCup)" />
              <rect x="44" y="134" width="62" height="16" rx="4" fill="url(#mcCup)" />
            </svg>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TROPHY_IMG}
            alt=""
            aria-hidden
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </div>

      {/* Texto */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginTop: 18, animation: "mcTrText .7s ease .5s both" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: GOLD }}>
          Trofeo conquistado
        </div>
        <h2 style={{ fontSize: "clamp(24px,5vw,40px)", fontWeight: 900, color: "#fff", margin: "8px 0 4px" }}>{trophy.name}</h2>
        <div style={{ fontSize: 14, color: MID }}>Temporada {trophy.season}</div>

        {/* Upsell en el pico de euforia: solo para quien aún no tiene Pase DT. */}
        {!paseDT && (
          <div style={{ marginTop: 18, maxWidth: 420, marginInline: "auto" }}>
            <div style={{ fontSize: 13, color: GOLD2, fontWeight: 700, lineHeight: 1.5 }}>
              Inmortaliza esta gesta: con el Pase DT desbloqueas narrativa con IA sin límite y tu legado completo.
            </div>
            <Link
              href="/premium"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "11px 24px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                color: "#1a1407",
                fontWeight: 800,
                fontSize: 13.5,
                textDecoration: "none",
                boxShadow: "0 10px 30px rgba(201,168,76,0.4)",
              }}
            >
              Conseguir Pase DT
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            display: "block",
            marginTop: paseDT ? 24 : 14,
            marginInline: "auto",
            padding: paseDT ? "12px 28px" : "9px 22px",
            borderRadius: 12,
            border: paseDT ? "none" : `1px solid ${GOLD}55`,
            background: paseDT ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : "transparent",
            color: paseDT ? BG : MID,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: paseDT ? "0 10px 30px rgba(201,168,76,0.4)" : "none",
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
