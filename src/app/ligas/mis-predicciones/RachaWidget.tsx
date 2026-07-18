"use client";

// Racha diaria de Fútcoins. Reutiliza el MISMO check-in global del resto de la app
// (POST /api/predictions/daily, idempotente por día UTC) -> una sola racha y una
// sola economía en Mundial y en Zona de Ligas (cierra el bucle entre módulos).
// GET del mismo endpoint para pintar el estado sin reclamar. Sin emojis.

import { useCallback, useEffect, useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";

export default function RachaWidget() {
  const [streak, setStreak] = useState(0);
  const [claimed, setClaimed] = useState<boolean | null>(null); // null = cargando
  const [busy, setBusy] = useState(false);
  const [gain, setGain] = useState<number | null>(null); // Fútcoins ganados al reclamar

  useEffect(() => {
    fetch("/api/predictions/daily")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) { setClaimed(false); return; }
        setStreak(j.streak ?? 0);
        setClaimed(!!j.claimedToday);
      })
      .catch(() => setClaimed(false));
  }, []);

  const claim = useCallback(async () => {
    if (busy || claimed) return;
    setBusy(true);
    try {
      const r = await fetch("/api/predictions/daily", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setClaimed(true);
        setStreak(j.checkin_days ?? streak + 1);
        const coins = (j.reward?.coins ?? 0) + (j.chest?.coins ?? 0);
        setGain(coins > 0 ? coins : (j.reward?.coins ?? 0));
      } else if (j?.error === "already_claimed") {
        setClaimed(true);
        setStreak(j.checkin_days ?? streak);
      }
    } catch {
      // sin conexión: se puede reintentar
    } finally {
      setBusy(false);
    }
  }, [busy, claimed, streak]);

  return (
    <section style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.32)" }}>
      <div style={{ textAlign: "center", minWidth: 56 }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: GOLD, lineHeight: 1 }}>{streak}</div>
        <div style={{ fontSize: 10.5, color: DIM }}>{streak === 1 ? "día" : "días"}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Tu racha diaria</div>
        <div style={{ fontSize: 12.5, color: DIM, marginTop: 2 }}>
          {claimed === null
            ? "Cargando…"
            : gain != null
              ? `+${gain} Fútcoins. Vuelve mañana para no perder la racha.`
              : claimed
                ? "Ya la reclamaste hoy. Vuelve mañana."
                : "Entra cada día y suma Fútcoins; a más racha, más premio."}
        </div>
      </div>
      {claimed === false && (
        <button
          onClick={claim}
          disabled={busy}
          style={{ flexShrink: 0, border: "none", cursor: busy ? "default" : "pointer", background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, color: "#0a0906", fontWeight: 600, fontSize: 13.5, padding: "10px 16px", borderRadius: 10, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "…" : "Reclamar"}
        </button>
      )}
    </section>
  );
}
