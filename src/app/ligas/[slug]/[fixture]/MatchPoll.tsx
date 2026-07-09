"use client";

// "¿Quién ganará?" del Centro de Partido, con dos caminos:
//  - LOGUEADO: predicción real -> POST /api/ligas/predict (se guarda a tu nombre y
//    cobras Fútcoins si aciertas) + cuenta también en la barra de comunidad.
//  - ANÓNIMO: encuesta de comunidad -> POST /api/ligas/vote (KV), con empujón a
//    registrarse para jugar por Fútcoins.
// 1 interacción por partido (localStorage + unique en BD). Sin emojis.

import { useCallback, useEffect, useState } from "react";

type Pick = "home" | "draw" | "away";
type Counts = { home: number; draw: number; away: number; total: number };

const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const REWARD = 10;
const EXACT_REWARD = 40;

export default function MatchPoll({
  fixtureId,
  slug,
  homeName,
  awayName,
  notStarted = false,
}: {
  fixtureId: number;
  slug: string;
  homeName: string;
  awayName: string;
  notStarted?: boolean;
}) {
  const storeKey = `zl-voted-${fixtureId}`;
  const [counts, setCounts] = useState<Counts | null>(null);
  const [myPick, setMyPick] = useState<Pick | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null); // null = aún no sabido
  const [rewarded, setRewarded] = useState(false); // hay predicción con Fútcoins guardada
  const [boosted, setBoosted] = useState(false); // premio amplificado (x3) comprado
  const [boostBusy, setBoostBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Mercado "marcador exacto" (segunda oportunidad de ganar en el mismo partido).
  const [exact, setExact] = useState<{ home: number; away: number } | null>(null);
  const [eh, setEh] = useState(1);
  const [ea, setEa] = useState(0);
  const [exactBusy, setExactBusy] = useState(false);
  const [exactError, setExactError] = useState("");

  useEffect(() => {
    // Estado de sesión + predicción guardada del usuario.
    fetch(`/api/ligas/predict?fixtureId=${fixtureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setAuthed(!!j.authed);
        setBoosted(!!j.boosted);
        if (j.exact && typeof j.exact.home === "number" && typeof j.exact.away === "number") {
          setExact(j.exact);
        }
        if (j.pick === "home" || j.pick === "draw" || j.pick === "away") {
          setMyPick(j.pick);
          setRewarded(true);
        } else if (!j.authed) {
          // anónimo: respeta el guardado local de esta sesión
          try {
            const saved = localStorage.getItem(storeKey);
            if (saved === "home" || saved === "draw" || saved === "away") setMyPick(saved);
          } catch { /* ignore */ }
        }
      })
      .catch(() => setAuthed(false));

    fetch(`/api/ligas/vote?fixtureId=${fixtureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) setCounts(j); })
      .catch(() => {});
  }, [fixtureId, storeKey]);

  const vote = useCallback(
    async (pick: Pick) => {
      if (busy || myPick || authed === null) return;
      setBusy(true);
      setError("");
      try {
        if (authed) {
          // Predicción con Fútcoins (server valida que el partido no ha empezado).
          const pr = await fetch("/api/ligas/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fixtureId, slug, pick }),
          });
          const pj = await pr.json().catch(() => ({}));
          if (pr.ok || pj?.error === "already_predicted") setRewarded(true);
          // si el partido ya empezó / no disponible, seguimos solo con la encuesta
        }
        // Voto de comunidad (para la barra; cuenta anónimos y logueados).
        const vr = await fetch("/api/ligas/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fixtureId, pick }),
        });
        if (vr.ok) setCounts(await vr.json());
        setMyPick(pick);
        try { localStorage.setItem(storeKey, pick); } catch { /* ignore */ }
      } catch {
        setError("Sin conexión. Inténtalo de nuevo.");
      } finally {
        setBusy(false);
      }
    },
    [busy, myPick, authed, fixtureId, slug, storeKey],
  );

  const doBoost = useCallback(async () => {
    if (boostBusy || boosted) return;
    setBoostBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ligas/predict/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok || j?.error === "already_boosted") {
        setBoosted(true);
      } else if (j?.error === "insufficient_coins") {
        setError("No tienes Fútcoins suficientes para el boost.");
      } else if (j?.error === "match_started") {
        setError("El partido ya empezó: el boost cierra al saque.");
      } else {
        setError("No se pudo activar el boost.");
      }
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setBoostBusy(false);
    }
  }, [boostBusy, boosted, fixtureId]);

  const saveExact = useCallback(async () => {
    if (exactBusy || exact) return;
    setExactBusy(true);
    setExactError("");
    try {
      const r = await fetch("/api/ligas/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, slug, market: "exact", scoreHome: eh, scoreAway: ea }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok || j?.error === "already_predicted") {
        setExact({ home: eh, away: ea });
      } else if (j?.error === "match_started") {
        setExactError("El partido ya empezó: el marcador cierra al saque.");
      } else if (j?.error === "not_available") {
        setExactError("El marcador exacto estará disponible en breve.");
      } else {
        setExactError("No se pudo guardar. Inténtalo de nuevo.");
      }
    } catch {
      setExactError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setExactBusy(false);
    }
  }, [exactBusy, exact, fixtureId, slug, eh, ea]);

  const options: { key: Pick; label: string }[] = [
    { key: "home", label: homeName },
    { key: "draw", label: "Empate" },
    { key: "away", label: awayName },
  ];
  const pct = (n: number) => (counts && counts.total > 0 ? Math.round((n / counts.total) * 100) : 0);

  return (
    <section style={{ marginTop: 22, padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.28)" }}>
      <h2 style={{ fontSize: 14.5, fontWeight: 500, color: "#fff", margin: "0 0 4px", textAlign: "center" }}>¿Quién ganará?</h2>
      {!myPick && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: authed ? GOLD : DIM, textAlign: "center" }}>
          {authed ? `Predice y gana ${REWARD} Fútcoins si aciertas` : "Vota y mira la opinión de la comunidad"}
        </p>
      )}

      {!myPick ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => vote(o.key)}
              disabled={busy || authed === null}
              style={{ border: `1px solid rgba(201,168,76,0.4)`, background: "rgba(201,168,76,0.06)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "12px 6px", borderRadius: 10, cursor: busy || authed === null ? "default" : "pointer", opacity: busy || authed === null ? 0.6 : 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
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
                  <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: mine ? 600 : 400 }}>{o.label}{mine ? " · tu apuesta" : ""}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{p}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${p}%`, height: "100%", background: mine ? "linear-gradient(90deg, #c9a84c, #e8d48b)" : "rgba(201,168,76,0.4)", borderRadius: 99, transition: "width .5s ease" }} />
                </div>
              </div>
            );
          })}
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: rewarded ? GOLD : DIM, textAlign: "center" }}>
            {rewarded
              ? `Predicción guardada. +${REWARD} Fútcoins si aciertas.`
              : `${counts ? counts.total.toLocaleString("es") : 0} ${counts && counts.total === 1 ? "voto" : "votos"} de la comunidad`}
          </p>
        </div>
      )}

      {!myPick && authed === false && (
        <p style={{ margin: "12px 0 0", fontSize: 12, color: DIM, textAlign: "center" }}>
          <a href="/registro" style={{ color: GOLD, textDecoration: "none" }}>Inicia sesión</a> para predecir y ganar Fútcoins.
        </p>
      )}
      {/* Boost: sumidero de Fútcoins. Solo si ya predijo y el partido no ha empezado. */}
      {authed && rewarded && notStarted && (
        boosted ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, fontWeight: 500, color: GOLD, textAlign: "center" }}>
            Premio ×3 activado. Si aciertas, ganas 30 Fútcoins.
          </p>
        ) : (
          <button
            onClick={doBoost}
            disabled={boostBusy}
            style={{ display: "block", width: "100%", marginTop: 12, border: "1px solid rgba(201,168,76,0.5)", background: "rgba(201,168,76,0.08)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 12px", borderRadius: 10, cursor: boostBusy ? "default" : "pointer", opacity: boostBusy ? 0.7 : 1 }}
          >
            {boostBusy ? "Activando…" : "Sube tu premio de 10 a 30 Fútcoins · cuesta 10"}
          </button>
        )
      )}
      {error ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a", textAlign: "center" }}>{error}</p> : null}

      {/* Marcador exacto: segunda oportunidad de ganar en el mismo partido (x4 premio). */}
      {authed && notStarted && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {exact ? (
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: GOLD, textAlign: "center" }}>
              Marcador exacto guardado: {exact.home}-{exact.away}. +{EXACT_REWARD} Fútcoins si lo clavas.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#cbd5e1", textAlign: "center" }}>
                ¿Te atreves con el marcador exacto? <span style={{ color: GOLD, fontWeight: 500 }}>+{EXACT_REWARD} Fútcoins</span> si lo clavas
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Stepper label={homeName} value={eh} onChange={setEh} disabled={exactBusy} />
                <span style={{ fontSize: 18, color: DIM, paddingTop: 16 }}>-</span>
                <Stepper label={awayName} value={ea} onChange={setEa} disabled={exactBusy} />
              </div>
              <button
                onClick={saveExact}
                disabled={exactBusy}
                style={{ display: "block", width: "100%", marginTop: 12, border: "1px solid rgba(201,168,76,0.5)", background: "rgba(201,168,76,0.08)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "10px 12px", borderRadius: 10, cursor: exactBusy ? "default" : "pointer", opacity: exactBusy ? 0.7 : 1 }}
              >
                {exactBusy ? "Guardando…" : `Predecir ${eh}-${ea}`}
              </button>
            </>
          )}
          {exactError ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a", textAlign: "center" }}>{exactError}</p> : null}
        </div>
      )}

      {authed && (rewarded || exact) && (
        <p style={{ margin: "12px 0 0", textAlign: "center" }}>
          <a href="/ligas/mis-predicciones" style={{ fontSize: 12.5, color: GOLD, textDecoration: "none" }}>Ver mis predicciones</a>
        </p>
      )}
    </section>
  );
}

// Contador táctil 0-9 (botones grandes para pulgares; 87% móvil).
function Stepper({ label, value, onChange, disabled }: { label: string; value: number; onChange: (n: number) => void; disabled: boolean }) {
  const btn: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: "1px solid rgba(201,168,76,0.4)",
    background: "rgba(201,168,76,0.06)",
    color: "#fff",
    fontSize: 17,
    lineHeight: 1,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: DIM, marginBottom: 5, maxWidth: 96, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" aria-label={`Menos goles ${label}`} style={btn} disabled={disabled || value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>-</button>
        <span style={{ fontSize: 22, fontWeight: 600, color: "#fff", minWidth: 22, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        <button type="button" aria-label={`Más goles ${label}`} style={btn} disabled={disabled || value >= 9} onClick={() => onChange(Math.min(9, value + 1))}>+</button>
      </div>
    </div>
  );
}
