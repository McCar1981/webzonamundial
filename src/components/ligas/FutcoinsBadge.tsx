"use client";

// Distintivo de saldo de Fútcoins para las pantallas de Zona de Ligas: hace VISIBLE
// la moneda (clave para que el bucle predecir->ganar->gastar se sienta). Lee
// /api/ligas/wallet. Si no hay sesión, se oculta. Sin emojis.

import { useEffect, useState } from "react";

const GOLD = "#c9a84c";

export default function FutcoinsBadge() {
  const [coins, setCoins] = useState<number | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/ligas/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) { setAuthed(false); return; }
        setAuthed(!!j.authed);
        setCoins(typeof j.coins === "number" ? j.coins : 0);
      })
      .catch(() => setAuthed(false));
  }, []);

  if (authed === false || coins === null) return null;

  return (
    <span
      title="Tu saldo de Fútcoins"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px",
        borderRadius: 99,
        background: "rgba(201,168,76,0.12)",
        border: "1px solid rgba(201,168,76,0.4)",
      }}
    >
      <span aria-hidden style={{ width: 14, height: 14, borderRadius: 99, background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{coins.toLocaleString("es")}</span>
      <span style={{ fontSize: 11.5, color: "#e6decb" }}>Fútcoins</span>
    </span>
  );
}
