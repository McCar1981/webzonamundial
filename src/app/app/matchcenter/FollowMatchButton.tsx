"use client";

// Botón "Seguir / Fijar partido" (efecto pin de Google). Al activarlo, este
// dispositivo recibe una notificación FIJADA que se actualiza con el marcador y
// el minuto del partido (vía push, gestionado por el cron del Match Center).
//
// Es la mejor aproximación posible en una webapp (PWA): Web Push no puede crear
// la notificación "ongoing" nativa de Android, pero requireInteraction + tag
// único + ticks silenciosos consiguen una tarjeta persistente que se refresca.

import { useEffect, useState } from "react";
import {
  isPushSupported,
  getMatchFollow,
  setMatchFollow,
} from "@/lib/push-client";

interface Props {
  matchId: number;
  homeName: string;
  awayName: string;
}

export default function FollowMatchButton({ matchId, homeName, awayName }: Props) {
  const [supported, setSupported] = useState(true);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    let alive = true;
    getMatchFollow(matchId).then((f) => {
      if (alive) setFollowing(f);
    });
    return () => {
      alive = false;
    };
  }, [matchId]);

  if (!supported) return null;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const next = !following;
    const result = await setMatchFollow(matchId, next);
    if (result === null) {
      setMsg("Activa las notificaciones para fijar el partido.");
    } else {
      setFollowing(result);
      setMsg(
        result
          ? `Fijado. Verás ${homeName}–${awayName} en tus notificaciones.`
          : "Has dejado de seguir el partido.",
      );
    }
    setBusy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={following}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 999,
          border: following ? "1px solid #f5c518" : "1px solid rgba(255,255,255,0.25)",
          background: following ? "#f5c518" : "rgba(255,255,255,0.06)",
          color: following ? "#000000" : "#fff",
          fontWeight: 700,
          fontSize: 14,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.7 : 1,
          transition: "all .15s ease",
        }}
      >
        <span aria-hidden style={{ fontSize: 16 }}>📌</span>
        {following ? "Siguiendo este partido" : "Seguir partido"}
      </button>
      {msg ? (
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
          {msg}
        </span>
      ) : null}
    </div>
  );
}
