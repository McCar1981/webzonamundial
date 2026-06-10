"use client";

// src/components/UpdateToast.tsx
//
// Aviso de versión nueva. El service worker es solo de push (no cachea la
// app), pero la PWA instalada y la caché HTTP pueden mantener al usuario en
// un deploy viejo durante horas. Este componente sondea /api/version (al
// montar, al volver a la pestaña y cada 5 min) y, si el SHA cambió, ofrece
// "Actualizar" con un reload. Sin red o en local ("dev") nunca molesta.

import { useEffect, useRef, useState } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const NAVY = "#0a1729";

const CHECK_EVERY_MS = 5 * 60_000;
// Mínimo entre comprobaciones disparadas por visibilitychange.
const MIN_GAP_MS = 60_000;

export default function UpdateToast() {
  const [fresh, setFresh] = useState<string | null>(null);
  const baseRef = useRef<string | null>(null);
  const dismissedRef = useRef<string | null>(null);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    let on = true;

    const check = async () => {
      lastCheckRef.current = Date.now();
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) return;
        const { version } = (await r.json()) as { version?: string };
        if (!on || !version || version === "dev") return;
        if (!baseRef.current) {
          // Primera lectura: es la versión con la que ya estamos corriendo.
          baseRef.current = version;
          return;
        }
        if (version !== baseRef.current && version !== dismissedRef.current) {
          setFresh(version);
        }
      } catch {
        /* sin red: silencio */
      }
    };

    check();
    const id = setInterval(() => {
      if (!document.hidden) check();
    }, CHECK_EVERY_MS);
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastCheckRef.current > MIN_GAP_MS) check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      on = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!fresh) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        // Por encima de la barra inferior de la app (zIndex 950) y de los pies
        // fijos de los juegos; por debajo de modales (≥2000).
        bottom: "calc(72px + env(safe-area-inset-bottom))",
        zIndex: 1500,
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: "calc(100vw - 28px)",
        padding: "11px 14px",
        borderRadius: 14,
        background: "rgba(12,27,50,0.97)",
        border: `1px solid ${GOLD}66`,
        boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
        color: "#eef2fb",
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      <span aria-hidden style={{ fontSize: 16 }}>✨</span>
      <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
        Hay una versión nueva de ZonaMundial
      </span>
      <button
        onClick={() => window.location.reload()}
        style={{
          flexShrink: 0,
          padding: "8px 15px",
          borderRadius: 999,
          border: "none",
          fontWeight: 800,
          fontSize: 12.5,
          color: NAVY,
          background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
          boxShadow: "0 4px 12px rgba(201,168,76,0.35)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Actualizar
      </button>
      <button
        onClick={() => {
          dismissedRef.current = fresh;
          setFresh(null);
        }}
        aria-label="Cerrar aviso"
        style={{ flexShrink: 0, background: "none", border: "none", color: "#93a1bd", fontSize: 17, cursor: "pointer", padding: 0, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
