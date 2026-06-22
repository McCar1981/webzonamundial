// src/app/grupos/mejores-terceros/PremiosPopup.tsx
//
// Popup del Gran Premio para la landing #1 de tráfico (mejores terceros).
// Cold traffic de Google con altísima intención: les enseñamos el premio real
// (Gift Cards 300/200/100 € al Top 3 por tasa de acierto) + urgencia honesta
// ("aún a tiempo": el concurso dura todo el Mundial) y los llevamos a registro.
//
// SEO: NO es un intersticial de entrada — aparece tras ~6 s de lectura, no al
// cargar, para no caer en la penalización de Google por popup intrusivo en la
// página que sostiene el tráfico. El contenido SEO es server-render y este
// componente no lo toca. Descartable + reaparece a los 2 días (localStorage).
//
// Premio y marco legal: ver /legal/bases-gran-premio. Competir es GRATIS y
// pagar NO da ventaja (gana quien más acierta), así que aquí no se vende nada:
// el único objetivo es el registro.
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const NAVY = "#0F1D32", BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0";
const DISMISS_KEY = "zm:premios-popup-terceros-at";
const SHOW_AFTER_MS = 6000;
const REAPPEAR_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

export default function PremiosPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissedRecently = false;
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || "0");
      dismissedRecently = at > 0 && Date.now() - at < REAPPEAR_AFTER_MS;
    } catch {
      /* sin localStorage: lo mostramos igualmente */
    }
    if (dismissedRecently) return;

    // No interrumpir el mini-juego: si el usuario tiene un pronóstico a medias
    // (1..7 de 8 grupos elegidos) NO abrimos el popup, para no taparle el juego
    // ni empujarle a registrarse antes de completar su pronóstico (que es justo
    // el momento de máxima implicación). Con 0 (no ha empezado) u 8 (ya lo
    // completó y vio el CTA) sí dejamos que aparezca.
    try {
      const raw = localStorage.getItem("zm:pronostico-terceros:v1");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length >= 1 && arr.length < 8) return;
      }
    } catch {
      /* ignore */
    }

    const timer = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(3,6,12,0.72)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gran Premio del Mundial"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          borderRadius: 20,
          border: "1px solid rgba(201,168,76,0.4)",
          background: `linear-gradient(180deg, ${NAVY}, ${BG})`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          padding: "18px 18px 20px",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "transparent",
            border: "none",
            color: MID,
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ×
        </button>

        <div style={{ color: GOLD, fontWeight: 900, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", paddingRight: 20 }}>
          Gran Premio del Mundial
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/email/premios.jpg"
          alt="Premios del Top 3: 300, 200 y 100 euros en Gift Cards"
          width={600}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 12, margin: "10px 0 4px", border: "1px solid rgba(255,255,255,0.08)" }}
        />

        <p style={{ margin: "8px 0 0", fontSize: 19, fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>
          300 €, 200 € y 100 € en Gift Cards al Top 3
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: MID, lineHeight: 1.55 }}>
          Gana quien más acierte sus predicciones — competir es <strong style={{ color: GOLD2 }}>gratis</strong> y sin apuestas.{" "}
          <strong style={{ color: "#fff" }}>Aún estás a tiempo:</strong> el concurso dura todo el Mundial.
        </p>

        <Link
          href="/registro"
          onClick={close}
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 16,
            padding: "13px 16px",
            borderRadius: 12,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: "#0A1422",
            fontSize: 15,
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          Participar gratis →
        </Link>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Link href="/legal/bases-gran-premio" style={{ color: MID, fontSize: 12, textDecoration: "underline" }}>
            Ver bases del concurso
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
