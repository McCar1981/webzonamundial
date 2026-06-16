// src/components/CookieConsent.tsx
// Banner GDPR / ePrivacy para usuarios europeos.
//
// Implementa Google Consent Mode v2: por defecto consent denegado, AdSense
// se carga en modo no-personalizado (sin tracking). Cuando el usuario acepta,
// emitimos `gtag('consent', 'update', { ad_storage: 'granted', ... })`.
//
// Si el usuario rechaza, mantenemos AdSense en modo no-personalizado pero
// seguimos mostrando ads (legal en EU si no hay tracking).
//
// Persistencia en localStorage. Se vuelve a preguntar si pasan 6 meses.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConsentStatus = "granted" | "denied" | null;

const STORAGE_KEY = "zm_consent_v1";
const RECHECK_AFTER_MS = 180 * 24 * 60 * 60 * 1000; // 6 meses

interface ConsentRecord {
  status: ConsentStatus;
  at: string;
}

function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed.status) return null;
    // Recheck si pasaron 6 meses
    const ageMs = Date.now() - new Date(parsed.at).getTime();
    if (ageMs > RECHECK_AFTER_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(status: "granted" | "denied"): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ status, at: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

/** Aplica el consent al gtag de Google. Seguro si gtag no existe aún. */
function applyConsentToGoogle(status: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  // Inicializa dataLayer si no existe (gtag.js lo crea normalmente)
  const w = window as unknown as { dataLayer: unknown[] };
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer.push(args);
  }
  gtag("consent", "update", {
    ad_storage: status,
    ad_user_data: status,
    ad_personalization: status,
    analytics_storage: status,
  });
}

export default function CookieConsent() {
  // Empieza oculto SIEMPRE en SSR para evitar mismatch de hidratación.
  // El estado real se decide en useEffect (cliente).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      // Reaplica el consent al gtag por si acaso (page load fresca)
      if (existing.status === "granted" || existing.status === "denied") {
        applyConsentToGoogle(existing.status);
      }
      return;
    }
    // Sin decisión guardada — mostrar el banner tras un mini delay para no
    // pisar el primer paint del hero.
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    writeConsent("granted");
    applyConsentToGoogle("granted");
    setVisible(false);
  };

  const handleReject = () => {
    writeConsent("denied");
    applyConsentToGoogle("denied");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(720px, calc(100% - 24px))",
        zIndex: 9997, // Debajo del PromoPopup (9998-9999) y modales
        padding: "18px 20px",
        borderRadius: 16,
        background: "linear-gradient(180deg, rgba(15,23,42,0.97), rgba(11,24,37,0.97))",
        border: "1px solid rgba(201,168,76,0.30)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
        color: "#e5e7eb",
        fontFamily: "Outfit, system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#C9A84C",
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Cookies y privacidad
          </div>
          <p style={{ margin: 0 }}>
            Usamos cookies propias y de terceros (Google AdSense) para mostrarte
            publicidad y mejorar tu experiencia. Puedes aceptar todas, rechazarlas o
            consultar la{" "}
            <Link
              href="/legal/cookies"
              style={{ color: "#FDE68A", textDecoration: "underline" }}
            >
              política de cookies
            </Link>
            .
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flex: "0 0 auto",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={handleReject}
            style={{
              padding: "9px 16px",
              borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "#e5e7eb",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Solo esenciales
          </button>
          <button
            type="button"
            onClick={handleAccept}
            style={{
              padding: "9px 18px",
              borderRadius: 99,
              border: "none",
              background: "linear-gradient(135deg,#C9A84C,#FDE68A)",
              color: "#1A1208",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 0 24px -8px rgba(201,168,76,0.6)",
            }}
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
