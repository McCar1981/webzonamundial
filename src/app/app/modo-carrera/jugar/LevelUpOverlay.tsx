// src/app/app/modo-carrera/jugar/LevelUpOverlay.tsx
// Pilar 2 — Celebración de SUBIDA DE NIVEL. Overlay a pantalla completa con flash
// dorado, ráfaga de partículas y el nuevo overall en grande. Se autocierra a los
// ~2.8s o al pulsar. SVG-only, sin emojis.

"use client";

import { useEffect } from "react";
import { BG, GOLD, GOLD2, MID } from "./fx";

// Partículas deterministas (sin random en render para evitar parpadeos).
const SPARKS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  return {
    dx: Math.cos(angle) * (120 + (i % 5) * 22),
    dy: Math.sin(angle) * (120 + (i % 5) * 22),
    delay: (i % 6) * 0.04,
    size: 6 + (i % 3) * 3,
    color: [GOLD, GOLD2, "#fff", "#d9c27a"][i % 4],
  };
});

export default function LevelUpOverlay({
  overall,
  levels,
  onClose,
}: {
  overall: number;
  levels: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subida de nivel"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 45%, rgba(201,168,76,0.28), rgba(0,0,0,0.92) 60%)",
        animation: "mcLvlFade .35s ease both",
        overflow: "hidden",
        padding: 20,
      }}
    >
      <style>{`
        @keyframes mcLvlFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mcLvlFlash { 0% { opacity: 0; transform: scale(.4); } 30% { opacity: .9; } 100% { opacity: 0; transform: scale(2.2); } }
        @keyframes mcLvlPop { 0% { transform: scale(.5); opacity: 0; } 55% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes mcLvlText { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mcLvlSpark { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(.2); opacity: 0; } }
      `}</style>

      {/* Vídeo de celebración (de fondo; si no carga, quedan flash + partículas) */}
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
          opacity: 0.45,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
        onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
      >
        <source src="/img/modo-carrera/video/subida-nivel.mp4" type="video/mp4" />
      </video>

      {/* Flash dorado */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD2}, ${GOLD} 50%, transparent 72%)`,
          animation: "mcLvlFlash 1s ease-out both",
          pointerEvents: "none",
        }}
      />

      {/* Ráfaga de partículas */}
      <div aria-hidden style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        {SPARKS.map((s, i) => (
          <span
            key={i}
            style={
              {
                position: "absolute",
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                background: s.color,
                boxShadow: `0 0 8px ${s.color}`,
                animation: `mcLvlSpark .95s ease-out ${s.delay}s both`,
                ["--dx" as string]: `${s.dx}px`,
                ["--dy" as string]: `${s.dy}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Contenido */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: GOLD, animation: "mcLvlText .6s ease .15s both" }}>
          {levels > 1 ? `¡Subiste ${levels} niveles!` : "¡Subiste de nivel!"}
        </div>
        <div
          style={{
            fontSize: "clamp(72px,18vw,120px)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
            margin: "6px 0",
            textShadow: "0 6px 30px rgba(201,168,76,0.6)",
            animation: "mcLvlPop .8s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          {overall}
        </div>
        <div style={{ fontSize: 13, color: MID, animation: "mcLvlText .6s ease .35s both" }}>Nuevo overall</div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            marginTop: 22,
            padding: "11px 26px",
            borderRadius: 10,
            border: "none",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: BG,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            animation: "mcLvlText .6s ease .5s both",
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
