"use client";

// src/components/pro/PaseOffer.tsx
//
// Oferta IN-APP del Pase (PRO), SIN premio/sorteo — sustituye a GranPremioOffer
// tras retirar el Gran Premio del Mundial. Tarjeta flotante, descartable, SOLO
// para usuarios AUTENTICADOS que aún NO han pagado (no molesta a los Pro).
// Reaparece a los 3 días de cerrarla (la conversión necesita varios impactos).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { useEntitlements } from "./EntitlementsProvider";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82";
const DISMISS_KEY = "zm:pase-offer-dismissed-at";
const REAPPEAR_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export default function PaseOffer() {
  const { loading, authenticated, isPro } = useEntitlements();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || "0");
      setDismissed(at > 0 && Date.now() - at < REAPPEAR_AFTER_MS);
    } catch {
      setDismissed(false);
    }
  }, []);

  // Solo para quien está dentro, identificado y SIN pagar todavía.
  if (!mounted || dismissed) return null;
  if (loading || !authenticated || isPro) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        zIndex: 60,
        width: "min(440px, calc(100vw - 24px))",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #14110a, #000000)",
          border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: 16,
          padding: "16px 18px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={close}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: MID,
            cursor: "pointer",
          }}
        >
          <X size={15} />
        </button>

        <div style={{ color: GOLD, fontWeight: 800, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
          Pase ZonaMundial
        </div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16.5, marginTop: 4 }}>Predice sin límites</div>
        <p style={{ color: MID, fontSize: 13, lineHeight: 1.5, marginTop: 6, paddingRight: 20 }}>
          Con el Pase predices <b style={{ color: GOLD2 }}>todos los partidos</b> de tus ligas (no solo 3 al día),
          con multiplicadores de racha y sin anuncios.
        </p>
        <Link
          href="/pro"
          onClick={close}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 12,
            padding: "10px 18px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: "#0a0906",
            fontWeight: 800,
            fontSize: 13.5,
            textDecoration: "none",
          }}
        >
          Conseguir el Pase <span aria-hidden>→</span>
        </Link>
      </div>
    </div>,
    document.body,
  );
}
