"use client";

// src/components/pro/ProBadge.tsx
//
// Chip dorado "PRO" para perfil y rankings. Variante estática (se le pasa el
// flag, p.ej. en leaderboards donde el dato viene del server) y variante
// self (lee el contexto de entitlements del propio usuario).

import { useEntitlements } from "./EntitlementsProvider";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b";

export function ProBadge({ size = 11 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
        color: "#060B14",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 0.6,
        lineHeight: 1,
        padding: `${Math.round(size * 0.3)}px ${Math.round(size * 0.55)}px`,
        borderRadius: 6,
        verticalAlign: "middle",
      }}
    >
      PRO
    </span>
  );
}

/** Badge del propio usuario en sesión: solo se pinta si es Pro. */
export function OwnProBadge({ size = 11 }: { size?: number }) {
  const { isPro } = useEntitlements();
  if (!isPro) return null;
  return <ProBadge size={size} />;
}
