"use client";

// La tira de hábito de Zona de Ligas: racha diaria (con reclamo), cadena de 7 días
// con el cofre del día 7 visible, saldo de Fútcoins y acceso a Mis predicciones —
// en la PUERTA de entrada del producto (hub /ligas y páginas de liga), no enterrada.
//
// Reutiliza el check-in global (GET/POST /api/predictions/daily: una sola racha y
// una sola economía en toda la plataforma) y /api/ligas/wallet para sesión+saldo.
// Anónimo: degrada a un empujón de registro con la racha como gancho. Sin emojis;
// dorado solo como acento; sin librerías (CSS/estado mínimo).

import { useCallback, useEffect, useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const CYCLE = 7; // la curva de premio del check-in va en ciclos de 7 días (día 7 = cofre)

export default function HabitStrip() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [streak, setStreak] = useState(0);
  const [claimed, setClaimed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [gain, setGain] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/ligas/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || !j.authed) { setAuthed(false); return; }
        setAuthed(true);
        setCoins(typeof j.coins === "number" ? j.coins : 0);
        return fetch("/api/predictions/daily")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d) { setClaimed(false); return; }
            setStreak(d.streak ?? 0);
            setClaimed(!!d.claimedToday);
          });
      })
      .catch(() => setAuthed(false));
  }, []);

  const claim = useCallback(async () => {
    if (busy || claimed !== false) return;
    setBusy(true);
    try {
      const r = await fetch("/api/predictions/daily", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setClaimed(true);
        setStreak(j.checkin_days ?? streak + 1);
        const total = (j.reward?.coins ?? 0) + (j.chest?.coins ?? 0);
        setGain(total > 0 ? total : null);
        setCoins((c) => c + total);
      } else if (j?.error === "already_claimed") {
        setClaimed(true);
        setStreak(j.checkin_days ?? streak);
      }
    } catch {
      // sin conexión: reintentable
    } finally {
      setBusy(false);
    }
  }, [busy, claimed, streak]);

  // Cargando: hueco estable (evita saltos de layout).
  if (authed === null) {
    return <div aria-hidden style={{ height: 74, marginTop: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />;
  }

  // Anónimo: la racha como gancho de registro.
  if (!authed) {
    return (
      <a
        href="/registro?next=/ligas"
        className="zl-card--raised zl-tap"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, padding: "13px 16px", textDecoration: "none" }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#fff" }}>Arranca tu racha diaria</span>
          <span style={{ display: "block", fontSize: 12, color: DIM }}>Cuenta gratis: Fútcoins cada día, más premio a más racha.</span>
        </span>
        <span className="zl-cta" style={{ flexShrink: 0, fontSize: 13, padding: "9px 14px" }}>Empezar</span>
      </a>
    );
  }

  // Posición en el ciclo de 7 días (día 7 = cofre). Tras reclamar, la racha ya
  // incluye el día de hoy; sin reclamar, hoy es el siguiente paso del ciclo.
  const doneInCycle = streak > 0 ? ((streak - 1) % CYCLE) + 1 : 0;
  const dots = Array.from({ length: CYCLE }, (_, i) => i < (claimed ? doneInCycle : Math.min(doneInCycle, CYCLE - 1)));

  return (
    <section className={gain != null ? "zl-card--raised zl-reward" : "zl-card--raised"} style={{ marginTop: 16, padding: "13px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 150 }}>
          <div style={{ textAlign: "center", minWidth: 40 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: GOLD, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{streak}</div>
            <div style={{ fontSize: 10, color: DIM }}>{streak === 1 ? "día" : "días"}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#fff" }}>Racha diaria</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }} aria-label={`Ciclo de ${CYCLE} días: día 7 con cofre`}>
              {dots.map((filled, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={{
                    width: i === CYCLE - 1 ? 11 : 7,
                    height: i === CYCLE - 1 ? 11 : 7,
                    borderRadius: i === CYCLE - 1 ? 3 : 99,
                    background: filled ? `linear-gradient(135deg, ${GOLD}, #e8d48b)` : "rgba(255,255,255,0.12)",
                    border: i === CYCLE - 1 && !filled ? `1px solid ${GOLD}` : "none",
                    flexShrink: 0,
                  }}
                  title={i === CYCLE - 1 ? "Día 7: cofre" : undefined}
                />
              ))}
              <span style={{ fontSize: 10.5, color: DIM, marginLeft: 3 }}>día 7: cofre</span>
            </div>
          </div>
        </div>

        {claimed === false ? (
          <button
            onClick={claim}
            disabled={busy}
            className="zl-cta"
            style={{ flexShrink: 0, fontSize: 13, padding: "9px 14px" }}
          >
            {busy ? "…" : "Reclamar hoy"}
          </button>
        ) : (
          <span className={gain != null ? "zl-gain" : undefined} style={{ flexShrink: 0, fontSize: 12, color: gain != null ? GOLD : DIM, fontWeight: gain != null ? 600 : 400 }}>
            {gain != null ? `+${gain} Fútcoins` : claimed ? "Hecho hoy" : ""}
          </span>
        )}

        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, padding: "5px 11px", borderRadius: 99, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)" }} title="Tu saldo de Fútcoins">
          <span aria-hidden style={{ width: 12, height: 12, borderRadius: 99, background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{coins.toLocaleString("es")}</span>
        </span>

        <a href="/ligas/mis-predicciones" style={{ flexShrink: 0, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>Mis predicciones &rsaquo;</a>
      </div>
      {gain == null && claimed === false && streak > 0 && (
        <p style={{ margin: "8px 0 0", fontSize: 11.5, color: DIM }}>Reclama hoy o tu racha de {streak} {streak === 1 ? "día" : "días"} vuelve a cero.</p>
      )}
    </section>
  );
}
