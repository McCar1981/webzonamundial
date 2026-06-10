// src/app/app/predicciones/jugar/Powerups.tsx
//
// UI de los comodines de pago del módulo de predicciones:
//   · DoubleMatchCard    — "⚡ Partido x2" (se compra antes del cierre)
//   · SecondChanceButton — "⏪ Segunda Oportunidad" (cambiar un pick cerrado,
//                          hasta el descanso), con mini-modal para el nuevo pick
//
// El cobro es Stripe Checkout (redirect); el efecto lo aplica el webhook
// server-side. Aquí solo: estado, elegibilidad aproximada (el servidor revalida
// siempre) y arranque del checkout.

"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Zap, RotateCcw } from "lucide-react";
import { POWERUPS } from "@/lib/powerups/catalog";

const BG3 = "#0B1825";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TEXT = "#E2E8F0";
const MID = "#94A3B8";
const DIM = "#64748B";
const CARD_BORDER = "1px solid #1E293B";

// ─── Estado de comodines del partido ─────────────────────────────────────────

export interface PowerupState {
  doubleDown: boolean;
  secondChancePredictions: string[];
  currency: "eur" | "usd";
  reload: () => void;
}

/** Comodines efectivos del usuario en este partido (una consulta por vista). */
export function usePowerupState(matchId: string): PowerupState {
  const [doubleDown, setDoubleDown] = useState(false);
  const [scPreds, setScPreds] = useState<string[]>([]);
  const [currency, setCurrency] = useState<"eur" | "usd">("eur");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/powerups/status?match_id=${encodeURIComponent(matchId)}`);
      if (!r.ok) return; // anónimo o error: la UI simplemente no marca nada
      const j = (await r.json()) as {
        double_down?: boolean;
        second_chance_predictions?: string[];
        currency?: "eur" | "usd";
      };
      setDoubleDown(Boolean(j.double_down));
      setScPreds(j.second_chance_predictions ?? []);
      if (j.currency === "usd" || j.currency === "eur") setCurrency(j.currency);
    } catch {
      /* sin red: sin marcas */
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { doubleDown, secondChancePredictions: scPreds, currency, reload: () => void load() };
}

// ─── Checkout común ──────────────────────────────────────────────────────────

type CheckoutBody = {
  sku: "second_chance" | "double_down";
  match_id?: string;
  prediction_id?: string;
  payload?: unknown;
};

async function startCheckout(body: CheckoutBody): Promise<{ ok: boolean; message?: string }> {
  try {
    const r = await fetch("/api/powerups/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => null)) as { url?: string; message?: string } | null;
    if (r.status === 401) return { ok: false, message: "Inicia sesión para comprar comodines." };
    if (!r.ok || !j?.url) return { ok: false, message: j?.message ?? "No se pudo iniciar el pago." };
    window.location.href = j.url;
    return { ok: true };
  } catch {
    return { ok: false, message: "Sin conexión, reintenta." };
  }
}

// ─── Partido x2 ──────────────────────────────────────────────────────────────

export function DoubleMatchCard({ matchId, closed, active, currency = "eur", onPurchased }: {
  matchId: string;
  closed: boolean;
  active: boolean;
  currency?: "eur" | "usd";
  onPurchased?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const def = POWERUPS.double_down;

  // Activo: recordatorio permanente. Cerrado sin comprar: no hay nada que vender.
  if (!active && closed) return null;

  const buy = async () => {
    setBusy(true);
    setErr(null);
    const res = await startCheckout({ sku: "double_down", match_id: matchId });
    if (!res.ok) {
      setErr(res.message ?? "No se pudo iniciar el pago.");
      setBusy(false);
    } else {
      onPurchased?.();
    }
  };

  return (
    <div style={{ background: BG3, border: `1px solid color-mix(in srgb, ${GOLD} 35%, transparent)`, borderRadius: 14, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: GOLD2, display: "inline-flex" }}><Zap size={18} /></span>
        <span style={{ fontWeight: 900, fontSize: 14, color: TEXT }}>Partido x2</span>
        {active && (
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: GOLD2, background: "color-mix(in srgb, var(--zm-accent, #c9a84c) 14%, transparent)", border: `1px solid color-mix(in srgb, ${GOLD} 40%, transparent)`, borderRadius: 99, padding: "4px 10px" }}>
            ⚡ Activo
          </span>
        )}
      </div>
      {active ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: MID, lineHeight: 1.5 }}>
          Todos tus aciertos de este partido puntuarán <b style={{ color: GOLD2 }}>×2</b>. ¡A por ello!
        </p>
      ) : (
        <>
          <p style={{ margin: "8px 0 10px", fontSize: 13, color: MID, lineHeight: 1.5 }}>
            Duplica los puntos de <b style={{ color: TEXT }}>todas</b> tus predicciones acertadas en este partido.
            No multiplica las aseguradas ni amplifica fallos.
          </p>
          <button
            onClick={buy}
            disabled={busy}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, cursor: busy ? "wait" : "pointer",
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, border: "none", color: "#0B1220",
              fontWeight: 900, fontSize: 13.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Zap size={15} /> {busy ? "Abriendo pago…" : `Activar Partido x2 · ${def.prices[currency].display}`}
          </button>
          {err && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#fca5a5" }}>{err}</p>}
        </>
      )}
    </div>
  );
}

// ─── Segunda Oportunidad ─────────────────────────────────────────────────────

type WinnerPick = "home" | "draw" | "away";

export function SecondChanceButton({ predictionId, type, currentData, matchHome, matchAway, alreadyUsed, currency = "eur" }: {
  predictionId: string;
  type: "winner" | "exact_score";
  currentData: unknown;
  matchHome: string;
  matchAway: string;
  alreadyUsed: boolean;
  currency?: "eur" | "usd";
}) {
  const [open, setOpen] = useState(false);
  const def = POWERUPS.second_chance;

  if (alreadyUsed) {
    return (
      <p style={{ margin: "10px 0 0", fontSize: 12, color: DIM, display: "flex", alignItems: "center", gap: 5 }}>
        <RotateCcw size={12} /> Segunda Oportunidad usada en esta predicción.
      </p>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 10, width: "100%", padding: "9px 12px", borderRadius: 8, cursor: "pointer",
          background: "color-mix(in srgb, var(--zm-accent, #c9a84c) 12%, transparent)",
          border: `1px solid color-mix(in srgb, ${GOLD} 33%, transparent)`, color: GOLD2,
          fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <RotateCcw size={13} /> Segunda Oportunidad · cambia tu pick · {def.prices[currency].display}
      </button>
      {open && (
        <SecondChanceModal
          predictionId={predictionId}
          type={type}
          currentData={currentData}
          matchHome={matchHome}
          matchAway={matchAway}
          currency={currency}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SecondChanceModal({ predictionId, type, currentData, matchHome, matchAway, currency, onClose }: {
  predictionId: string;
  type: "winner" | "exact_score";
  currentData: unknown;
  matchHome: string;
  matchAway: string;
  currency: "eur" | "usd";
  onClose: () => void;
}) {
  const cur = currentData as { result?: WinnerPick; home_goals?: number; away_goals?: number };
  const [winner, setWinner] = useState<WinnerPick | null>(null);
  const [homeGoals, setHomeGoals] = useState<number>(cur.home_goals ?? 0);
  const [awayGoals, setAwayGoals] = useState<number>(cur.away_goals ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const def = POWERUPS.second_chance;

  const samePick = type === "winner"
    ? winner === null || winner === cur.result
    : homeGoals === cur.home_goals && awayGoals === cur.away_goals;

  const pay = async () => {
    if (samePick) return;
    setBusy(true);
    setErr(null);
    const payload = type === "winner"
      ? { result: winner }
      : { home_goals: homeGoals, away_goals: awayGoals };
    const res = await startCheckout({ sku: "second_chance", prediction_id: predictionId, payload });
    if (!res.ok) {
      setErr(res.message ?? "No se pudo iniciar el pago.");
      setBusy(false);
    }
  };

  const chip = (value: WinnerPick, label: string) => {
    const sel = winner === value;
    const isCurrent = cur.result === value;
    return (
      <button
        key={value}
        onClick={() => setWinner(value)}
        disabled={isCurrent}
        style={{
          flex: 1, padding: "10px 6px", borderRadius: 10, cursor: isCurrent ? "default" : "pointer",
          background: sel ? "color-mix(in srgb, var(--zm-accent, #c9a84c) 22%, transparent)" : "rgba(255,255,255,0.04)",
          border: sel ? `1px solid ${GOLD}` : CARD_BORDER,
          color: isCurrent ? DIM : sel ? GOLD2 : TEXT, fontWeight: 800, fontSize: 13,
          opacity: isCurrent ? 0.55 : 1,
        }}
      >
        {label}
        {isCurrent && <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: DIM }}>tu pick actual</span>}
      </button>
    );
  };

  const goalInput = (value: number, set: (n: number) => void, label: string) => (
    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: MID, fontWeight: 700 }}>
      {label}
      <input
        type="number"
        min={0}
        max={20}
        value={value}
        onChange={(e) => set(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
        style={{
          background: "rgba(255,255,255,0.05)", border: CARD_BORDER, borderRadius: 10,
          color: TEXT, fontWeight: 900, fontSize: 18, textAlign: "center", padding: "10px 6px", width: "100%", boxSizing: "border-box",
        }}
      />
    </label>
  );

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(6,11,20,0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#0F1D32", border: `1px solid color-mix(in srgb, ${GOLD} 30%, transparent)`, borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>{def.emoji}</span>
          <h3 style={{ margin: 0, color: TEXT, fontSize: 16, fontWeight: 900 }}>Segunda Oportunidad</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ marginLeft: "auto", background: "none", border: "none", color: DIM, cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: MID, lineHeight: 1.5 }}>
          Elige tu nuevo pick. El cambio se aplica al confirmarse el pago y solo es posible hasta el descanso.
        </p>

        {type === "winner" ? (
          <div style={{ display: "flex", gap: 8 }}>
            {chip("home", matchHome)}
            {chip("draw", "Empate")}
            {chip("away", matchAway)}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            {goalInput(homeGoals, setHomeGoals, matchHome)}
            <span style={{ color: DIM, fontWeight: 900, paddingBottom: 12 }}>—</span>
            {goalInput(awayGoals, setAwayGoals, matchAway)}
          </div>
        )}

        {err && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#fca5a5" }}>{err}</p>}

        <button
          onClick={pay}
          disabled={busy || samePick}
          style={{
            marginTop: 16, width: "100%", padding: "12px 14px", borderRadius: 12,
            cursor: busy || samePick ? "default" : "pointer",
            background: samePick ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            border: "none", color: samePick ? DIM : "#0B1220", fontWeight: 900, fontSize: 14,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Abriendo pago…" : samePick ? "Elige un pick distinto" : `Cambiar mi pick · ${def.prices[currency].display}`}
        </button>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: DIM, textAlign: "center", lineHeight: 1.45 }}>
          Si el descanso termina antes de completarse el pago, te devolvemos el importe automáticamente.
        </p>
      </div>
    </div>,
    document.body,
  );
}
