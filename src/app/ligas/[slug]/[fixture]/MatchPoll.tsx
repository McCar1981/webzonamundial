"use client";

// Encuesta de comunidad "¿Quién ganará?" del Centro de Partido. Anónima, 1 voto
// por partido (guarda en localStorage). Antes de votar: tres botones; después:
// barras con el % de la comunidad, resaltando tu voto. Sin emojis.
// Datos: GET/POST /api/ligas/vote (KV, rate-limit por IP).

import { useCallback, useEffect, useState } from "react";

type Pick = "home" | "draw" | "away";
type Counts = { home: number; draw: number; away: number; total: number };

const GOLD = "#c9a84c";
const DIM = "#9db0c9";

export default function MatchPoll({
  fixtureId,
  homeName,
  awayName,
}: {
  fixtureId: number;
  homeName: string;
  awayName: string;
}) {
  const storeKey = `zl-voted-${fixtureId}`;
  const [counts, setCounts] = useState<Counts | null>(null);
  const [myPick, setMyPick] = useState<Pick | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storeKey);
      if (saved === "home" || saved === "draw" || saved === "away") setMyPick(saved);
    } catch {
      // localStorage no disponible: se puede votar igual
    }
    fetch(`/api/ligas/vote?fixtureId=${fixtureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) setCounts(j); })
      .catch(() => {});
  }, [fixtureId, storeKey]);

  const vote = useCallback(
    async (pick: Pick) => {
      if (busy || myPick) return;
      setBusy(true);
      setError("");
      try {
        const r = await fetch("/api/ligas/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fixtureId, pick }),
        });
        if (r.ok) {
          setCounts(await r.json());
          setMyPick(pick);
          try { localStorage.setItem(storeKey, pick); } catch { /* ignore */ }
        } else {
          const j = await r.json().catch(() => ({}));
          setError(j?.error === "rate_limited" ? "Demasiados votos. Prueba en unos minutos." : "No se pudo registrar tu voto.");
        }
      } catch {
        setError("Sin conexión. Inténtalo de nuevo.");
      } finally {
        setBusy(false);
      }
    },
    [busy, myPick, fixtureId, storeKey],
  );

  const options: { key: Pick; label: string }[] = [
    { key: "home", label: homeName },
    { key: "draw", label: "Empate" },
    { key: "away", label: awayName },
  ];

  const pct = (n: number) => (counts && counts.total > 0 ? Math.round((n / counts.total) * 100) : 0);

  return (
    <section style={{ marginTop: 22, padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.28)" }}>
      <h2 style={{ fontSize: 14.5, fontWeight: 500, color: "#fff", margin: "0 0 12px", textAlign: "center" }}>¿Quién ganará?</h2>

      {!myPick ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => vote(o.key)}
              disabled={busy}
              style={{ border: `1px solid rgba(201,168,76,0.4)`, background: "rgba(201,168,76,0.06)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "12px 6px", borderRadius: 10, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {options.map((o) => {
            const p = pct(counts ? counts[o.key] : 0);
            const mine = myPick === o.key;
            return (
              <div key={o.key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3, color: mine ? GOLD : "#cbd5e1" }}>
                  <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: mine ? 600 : 400 }}>{o.label}{mine ? " · tu voto" : ""}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{p}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${p}%`, height: "100%", background: mine ? "linear-gradient(90deg, #c9a84c, #e8d48b)" : "rgba(201,168,76,0.4)", borderRadius: 99, transition: "width .5s ease" }} />
                </div>
              </div>
            );
          })}
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: DIM, textAlign: "center" }}>
            {counts ? counts.total.toLocaleString("es") : 0} {counts && counts.total === 1 ? "voto" : "votos"} de la comunidad
          </p>
        </div>
      )}

      {error ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a", textAlign: "center" }}>{error}</p> : null}
    </section>
  );
}
