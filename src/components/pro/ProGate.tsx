"use client";

// src/components/pro/ProGate.tsx
//
// Candado de UI para features Pro. Si el usuario es Pro renderiza children;
// si no, una tarjeta de upgrade con el copy del límite y CTA a /pro.
//
// SOLO presentación — el server sigue validando con isPro(). Úsalo para no
// pintar controles que el backend va a rechazar igualmente.

import Link from "next/link";
import { Lock } from "lucide-react";
import { useEntitlements } from "./EntitlementsProvider";
import { PRO_PRICE_DISPLAY } from "@/lib/pro/limits";

const BG2 = "#0F1D32", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0";

interface ProGateProps {
  /** Qué desbloquea Pro aquí, p.ej. "Los 8 tipos de predicción". */
  title: string;
  /** Detalle opcional del límite, p.ej. "En Free solo Resultado Exacto". */
  description?: string;
  /** Variante compacta (inline, sin tarjeta grande). */
  compact?: boolean;
  children: React.ReactNode;
}

export default function ProGate({ title, description, compact, children }: ProGateProps) {
  const { loading, isPro } = useEntitlements();

  // Mientras resolvemos no enseñamos ni el contenido ni el candado: evita el
  // flash de paywall a usuarios Pro (la respuesta llega en <100ms con caché).
  if (loading) return null;
  if (isPro) return <>{children}</>;

  if (compact) {
    return (
      <Link
        href="/pro"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: GOLD, fontSize: 13, fontWeight: 700, textDecoration: "none",
          border: `1px solid rgba(201,168,76,0.35)`, borderRadius: 8, padding: "4px 10px",
        }}
      >
        <Lock size={12} />
        {title}
      </Link>
    );
  }

  return (
    <div
      style={{
        background: BG2,
        border: "1px solid rgba(201,168,76,0.25)",
        borderRadius: 16,
        padding: "22px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 12, margin: "0 auto 10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(201,168,76,0.12)",
        }}
      >
        <Lock size={18} color={GOLD} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginBottom: 4 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 13.5, color: MID, marginBottom: 14, lineHeight: 1.45 }}>{description}</div>
      )}
      <Link
        href="/pro"
        style={{
          display: "inline-block",
          background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
          color: "#060B14", fontWeight: 800, fontSize: 13.5,
          padding: "9px 18px", borderRadius: 10, textDecoration: "none",
        }}
      >
        Hazte Pro — {PRO_PRICE_DISPLAY.yearly}
      </Link>
    </div>
  );
}
