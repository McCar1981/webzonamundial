"use client";

// Banner discreto que pregunta al usuario si quiere activar notificaciones
// push del navegador. Aparece tras 1 visita (rastreado en localStorage)
// y solo si:
//   - El navegador soporta Web Push
//   - El permiso aún es "default" (no granted, no denied)
//   - El user no lo ha descartado antes (rastreado en localStorage)
//
// Usar en layout root o en /noticias para captar a los más interesados.
//
// FASE Mundial 2026: el banner se incluye en home + noticias para
// maximizar tasa de suscripción (la base original era ~1 suscriptor con
// MIN_VISITS=3 y banner solo en /noticias).

import { useEffect, useState } from "react";
import { isPushSupported, getNotificationPermission, subscribeToPush } from "@/lib/push-client";

const VISIT_KEY = "zm.push.visits";
const DISMISS_KEY = "zm.push.dismissedAt";
// Antes 3; bajado a 1 para que aparezca en la primera visita real, no
// tras un mes de uso ocasional. La FOMO del Mundial juega a favor del CTA.
const MIN_VISITS = 1;
const REASK_DAYS = 14;

function shouldShowBanner(): boolean {
  if (!isPushSupported()) return false;
  if (getNotificationPermission() !== "default") return false;
  try {
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10);
    if (visits < MIN_VISITS) return false;
    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (dismissedAt > 0) {
      const daysAgo = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysAgo < REASK_DAYS) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function incrementVisits(): void {
  try {
    const prev = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10);
    localStorage.setItem(VISIT_KEY, String(prev + 1));
  } catch {
    /* localStorage no disponible */
  }
}

export default function PushOptInBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    incrementVisits();
    // Pequeño delay para no asustar al user nada más cargar la página.
    // 7s en vez de 4s — da tiempo a que el usuario lea algo antes del CTA.
    const t = setTimeout(() => {
      if (shouldShowBanner()) setVisible(true);
    }, 7000);
    return () => clearTimeout(t);
  }, []);

  async function activate() {
    setLoading(true);
    const sub = await subscribeToPush({ kinds: ["news"] });
    setLoading(false);
    if (sub) {
      setVisible(false);
    } else {
      // Si el user denegó el permiso, no insistimos más.
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      setVisible(false);
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Activar notificaciones del Mundial 2026"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        left: 20,
        maxWidth: 380,
        marginLeft: "auto",
        zIndex: 9000,
        background: "linear-gradient(180deg, #0F1F30, #0B1825)",
        border: "1px solid rgba(201,168,76,0.35)",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        padding: 18,
        color: "#E5E7EB",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg,#C9A84C,#E8C76B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
          aria-hidden="true"
        >
          🔔
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontFamily: "'Outfit','Segoe UI',sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            Noticias del Mundial 2026 al instante
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94A3B8", lineHeight: 1.45 }}>
            Activa las notificaciones y no te pierdas convocatorias,
            lesiones, alineaciones y resultados. Máx. 1-2 alertas al día.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={dismiss}
          disabled={loading}
          style={{
            background: "transparent",
            color: "#94A3B8",
            border: "none",
            fontSize: 13,
            cursor: loading ? "wait" : "pointer",
            padding: "8px 12px",
          }}
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={activate}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg,#C9A84C,#E8C76B)",
            color: "#1A1208",
            border: "none",
            borderRadius: 10,
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? "Activando…" : "Activar"}
        </button>
      </div>
    </div>
  );
}
