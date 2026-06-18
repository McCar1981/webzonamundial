"use client";

// src/components/pro/GranPremioOffer.tsx
//
// Oferta IN-APP del Gran Premio + Pase, para los usuarios ENGANCHADOS que ya
// están dentro de /app jugando — donde de verdad convierte, no el email (que
// cae en Promociones de Gmail y casi nadie ve). Tarjeta flotante, descartable,
// SOLO para usuarios AUTENTICADOS que aún NO han pagado (no molesta a los Pro).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { useEntitlements } from "./EntitlementsProvider";

const NAVY = "#0F1D32", BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0";
const DISMISS_KEY = "zm:gp-offer-dismissed";
// El -30% (código FINDE30) vence el 20-jun 23:59 CEST. Tras esa fecha, ocultamos
// esa línea para no anunciar un descuento caducado.
const DISCOUNT_UNTIL = Date.parse("2026-06-21T00:00:00+02:00");

export default function GranPremioOffer() {
  const { loading, authenticated, isPro } = useEntitlements();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // Solo para quien está dentro, identificado y SIN pagar todavía.
  if (!mounted || dismissed) return null;
  if (loading || !authenticated || isPro) return null;

  const discountActive = Date.now() < DISCOUNT_UNTIL;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        // Por encima de la barra inferior de la app (deja sitio al safe-area).
        bottom: "calc(82px + env(safe-area-inset-bottom, 0px))",
        zIndex: 9990,
        width: "min(430px, calc(100vw - 20px))",
        borderRadius: 18,
        border: "1px solid rgba(201,168,76,0.4)",
        background: `linear-gradient(180deg, ${NAVY}, ${BG})`,
        boxShadow: "0 16px 50px rgba(0,0,0,0.55)",
        padding: "14px 16px 16px",
      }}
    >
      <button
        onClick={close}
        aria-label="Cerrar"
        style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: MID, padding: 4, lineHeight: 0 }}
      >
        <X size={16} />
      </button>

      <div style={{ color: GOLD, fontWeight: 900, fontSize: 12.5, letterSpacing: 1, textTransform: "uppercase", paddingRight: 18 }}>
        Gran Premio del Mundial
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#fff", lineHeight: 1.5 }}>
        El Top 3 del ranking gana <strong style={{ color: GOLD2 }}>Gift Cards de 300, 200 y 100 €</strong>. Competir es gratis: gana quien más acierte.
      </p>
      <p style={{ margin: "8px 0 12px", fontSize: 12.5, color: MID, lineHeight: 1.5 }}>
        Y desbloquea TODO hasta la final: <strong style={{ color: "#fff" }}>8 € pago único</strong>
        {discountActive ? (
          <>, o el año a <strong style={{ color: "#fff" }}>14 €</strong> con el código <strong style={{ color: GOLD2 }}>FINDE30</strong> (hasta el 20 de junio)</>
        ) : (
          <> o el plan anual completo</>
        )}.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          href="/pro"
          onClick={close}
          style={{ flex: "1 1 140px", textAlign: "center", padding: "11px 14px", borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#0A1422", fontSize: 14, fontWeight: 900, textDecoration: "none" }}
        >
          Conseguir el Pase
        </Link>
        <Link
          href="/app/rankings"
          onClick={close}
          style={{ flex: "1 1 120px", textAlign: "center", padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
        >
          Ver el premio
        </Link>
      </div>
    </div>,
    document.body,
  );
}
