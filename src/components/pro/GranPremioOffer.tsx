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

const NAVY = "#14110a", BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82";
const DISMISS_KEY = "zm:gp-offer-dismissed-at";
// Reaparece N días después de cerrarlo (no para siempre): la oferta necesita
// varios impactos para convertir — la gente compra al 2º o 3º, no al primero.
const REAPPEAR_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
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
      const at = Number(localStorage.getItem(DISMISS_KEY) || "0");
      setDismissed(at > 0 && Date.now() - at < REAPPEAR_AFTER_MS);
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/email/premios.jpg"
        alt="Premios del Top 3: 300, 200 y 100 euros"
        width={600}
        style={{ display: "block", width: "100%", height: "auto", borderRadius: 10, margin: "8px 0 2px", border: "1px solid rgba(255,255,255,0.08)" }}
      />
      <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#fff", lineHeight: 1.5 }}>
        El Top 3 del ranking se lleva estas Gift Cards. Competir es gratis: <strong style={{ color: GOLD2 }}>gana quien más acierte</strong>.
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
          style={{ flex: "1 1 140px", textAlign: "center", padding: "11px 14px", borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#0a0906", fontSize: 14, fontWeight: 900, textDecoration: "none" }}
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
