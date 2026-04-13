"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const STORAGE_KEY = "zm_promo_v2";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.dismissed === true;
  } catch {
    return false;
  }
}

function markDismissed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dismissed: true, at: new Date().toISOString() })
    );
  } catch {
    // ignore
  }
}

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const { t } = useLanguage();
  const isEs = t.nav.inicio === "Inicio";

  useEffect(() => {
    if (isDismissed()) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
    markDismissed();
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 9998,
          opacity: closing ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: closing
            ? "translate(-50%, -50%) scale(0.9)"
            : "translate(-50%, -50%) scale(1)",
          zIndex: 9999,
          width: "min(420px, 90vw)",
          borderRadius: 24,
          overflow: "hidden",
          opacity: closing ? 0 : 1,
          transition: "all 0.3s ease",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(201,168,76,0.15)",
        }}
      >
        {/* Gold top accent */}
        <div
          style={{
            height: 4,
            background: "linear-gradient(90deg, #c9a84c, #e8d48b, #c9a84c)",
          }}
        />

        <div
          style={{
            background: "linear-gradient(180deg, #0F1D32 0%, #060B14 100%)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderTop: "none",
            borderRadius: "0 0 24px 24px",
            padding: "32px 28px 28px",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6a7a9a",
              fontSize: 16,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "#6a7a9a";
            }}
          >
            ✕
          </button>

          {/* Glow effect */}
          <div
            style={{
              position: "absolute",
              top: -60,
              left: "50%",
              transform: "translateX(-50%)",
              width: 300,
              height: 200,
              background:
                "radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Badge */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 18px",
                borderRadius: 20,
                background: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "#e8d48b",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {isEs ? "Oferta de lanzamiento" : "Launch offer"}
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(22px, 5vw, 28px)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            {isEs
              ? "Pre-regístrate ahora y "
              : "Pre-register now and "}
            <span style={{ color: "#c9a84c" }}>
              {isEs ? "ahorra en Premium" : "save on Premium"}
            </span>
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#8a94b0",
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {isEs
              ? "Los primeros en registrarse tendrán un descuento exclusivo en la suscripción Premium."
              : "Early registrants get an exclusive discount on the Premium subscription."}
          </p>

          {/* Pricing cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {/* Europa */}
            <div
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: 16,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  color: "#6a7a9a",
                  marginBottom: 8,
                }}
              >
                {isEs ? "Europa" : "Europe"}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#c9a84c",
                  }}
                >
                  -2€
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#8a94b0" }}>
                {isEs ? "en tu suscripción" : "on your subscription"}
              </p>
            </div>

            {/* Latinoamérica */}
            <div
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: 16,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  color: "#6a7a9a",
                  marginBottom: 8,
                }}
              >
                {isEs ? "Latinoamérica" : "Latin America"}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#c9a84c",
                  }}
                >
                  -2$
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#8a94b0" }}>
                {isEs ? "en tu suscripción" : "on your subscription"}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleClose}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #c9a84c 0%, #e8d48b 50%, #c9a84c 100%)",
              backgroundSize: "200% 200%",
              color: "#060B14",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 1,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundPosition = "100% 0";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(201,168,76,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundPosition = "0 0";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isEs ? "¡Quiero el descuento!" : "I want the discount!"}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#4a5570",
              marginTop: 12,
            }}
          >
            {isEs
              ? "Oferta válida solo para pre-registros antes del Mundial 2026"
              : "Offer valid only for pre-registrations before the 2026 World Cup"}
          </p>
        </div>
      </div>
    </>
  );
}
