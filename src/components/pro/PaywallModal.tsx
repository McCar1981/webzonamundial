"use client";

// src/components/pro/PaywallModal.tsx
//
// Paywall contextual GLOBAL: se monta una vez en el layout y escucha el evento
// zm:pro-required (ver lib/pro/paywall-client.ts). Cualquier juego que reciba
// un error `pro_required` de la API lo abre con handleProRequired(json) — el
// modal pinta el copy del límite concreto y el CTA a /pro.

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Lock, X } from "lucide-react";
import {
  PRO_PAYWALL_EVENT,
  PAYWALL_COPY,
  type PaywallDetail,
} from "@/lib/pro/paywall-client";
import { PRO_PRICE_DISPLAY } from "@/lib/pro/limits";
import { trackEvent } from "@/lib/analytics/track-event";
import { isPostFreeWeekendWindow } from "@/lib/pro/free-weekend";
import { hasUsedAnyPro } from "@/lib/pro/free-weekend-usage";

const BG2 = "#0F1D32", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0";

function retryCountdown(retryAt: string | null | undefined): string | null {
  if (!retryAt) return null;
  const ms = new Date(retryAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.ceil((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export default function PaywallModal() {
  const [detail, setDetail] = useState<PaywallDetail | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<PaywallDetail>).detail;
      setDetail(d);
      // EMBUDO: el usuario ve la oferta Pro (capa AWARENESS/INTENT).
      trackEvent("paywall_view", { feature: d?.feature ?? "generic" });
    };
    window.addEventListener(PRO_PAYWALL_EVENT, onOpen);
    return () => window.removeEventListener(PRO_PAYWALL_EVENT, onOpen);
  }, []);

  if (!mounted || !detail) return null;

  const copy = PAYWALL_COPY[detail.feature] ?? PAYWALL_COPY.generic;
  const countdown = retryCountdown(detail.retryAt);
  const close = () => setDetail(null);

  // Lunes tras el finde gratis: si el usuario probó Pro durante la campaña, el
  // paywall lo recuerda ("la probaste gratis") en vez del copy genérico.
  const postWeekend = isPostFreeWeekendWindow() && hasUsedAnyPro();
  const title = postWeekend ? "Esta función volvió a ser Pro" : copy.title;
  const perk = postWeekend
    ? "La probaste gratis durante el fin de semana. Actívala de nuevo con el precio fundador."
    : copy.perk;
  const ctaLabel = postWeekend ? "Activar Pro" : "Empezar 3 días gratis";

  return createPortal(
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(6,11,20,0.78)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: BG2,
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: 20, padding: "28px 24px 24px",
          maxWidth: 400, width: "100%", position: "relative", textAlign: "center",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={close}
          aria-label="Cerrar"
          style={{
            position: "absolute", top: 12, right: 12, background: "none",
            border: "none", cursor: "pointer", color: MID, padding: 6,
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(201,168,76,0.12)",
          }}
        >
          <Lock size={22} color={GOLD} />
        </div>

        <div style={{ fontWeight: 900, fontSize: 19, color: "#fff", marginBottom: 8, lineHeight: 1.25 }}>
          {title}
        </div>
        <p style={{ fontSize: 14, color: MID, lineHeight: 1.5, margin: "0 0 6px" }}>{perk}</p>
        {countdown && (
          <p style={{ fontSize: 12.5, color: MID, margin: "0 0 6px" }}>
            O continúa gratis en <strong style={{ color: "#fff" }}>{countdown}</strong>.
          </p>
        )}

        <Link
          href="/pro"
          onClick={close}
          style={{
            display: "block", marginTop: 16,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: "#060B14", fontWeight: 800, fontSize: 15,
            padding: "13px 18px", borderRadius: 12, textDecoration: "none",
            boxShadow: "0 6px 24px rgba(201,168,76,0.25)",
          }}
        >
          {ctaLabel}
        </Link>
        <div style={{ marginTop: 8, fontSize: 11.5, color: MID, lineHeight: 1.45 }}>
          Luego {PRO_PRICE_DISPLAY.yearly} · cancela cuando quieras.{" "}
          <strong style={{ color: GOLD2 }}>Precio fundador durante el Mundial.</strong>
        </div>
        <button
          onClick={close}
          style={{
            marginTop: 10, background: "none", border: "none", cursor: "pointer",
            color: MID, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          Seguir en Free
        </button>
      </div>
    </div>,
    document.body,
  );
}
