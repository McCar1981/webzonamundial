"use client";

// src/app/app/matchcenter/MicroDuels.tsx
//
// Duelo en Vivo ⚔️ (Fase 2): reto 1v1 a nivel de partido. Gana quien sume más
// puntos de micro-predicciones cuando el partido termina. Este panel lista los
// duelos del usuario para ESTE partido, permite retar por username y
// aceptar/rechazar los recibidos. La resolución y el pago los hace el cron.

import { useCallback, useEffect, useRef, useState } from "react";

const BG = "#060B14";
const SURFACE = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#e8d48b";
const OK = "#4ade80";
const BAD = "#ff6b6b";

interface Duel {
  id: string;
  match_id: string;
  status: string;
  challenger_id: string;
  opponent_id: string;
  challenger_points: number | null;
  opponent_points: number | null;
  winner_id: string | null;
  challenger_username: string | null;
  opponent_username: string | null;
}

export default function MicroDuels({ matchId }: { matchId: number }) {
  const mid = String(matchId);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/micro/duels`, { cache: "no-store" });
      if (res.status === 401) {
        if (aliveRef.current) { setMe(null); setLoaded(true); }
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (!aliveRef.current) return;
      setMe(data.me ?? null);
      const all = (Array.isArray(data.duels) ? data.duels : []) as Duel[];
      setDuels(all.filter((d) => d.match_id === mid));
      setLoaded(true);
    } catch {
      /* silencioso */
    }
  }, [mid]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, open ? 15000 : 45000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [load, open]);

  const challenge = useCallback(async () => {
    const name = opponent.trim().replace(/^@/, "");
    if (!name) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/micro/duels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponent: name, match_id: mid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!aliveRef.current) return;
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok) {
        setOpponent("");
        setMsg(`Reto enviado a @${name} ⚔️`);
        load();
      } else {
        const err = String(data.error ?? "error");
        setMsg(
          err === "opponent_not_found" ? "No existe ese usuario"
            : err === "cannot_duel_self" ? "No puedes retarte a ti mismo"
            : err === "duel_exists" ? "Ya tienes un duelo vivo con ese jugador en este partido"
            : "No se pudo crear el reto",
        );
      }
    } catch {
      if (aliveRef.current) setMsg("Error de red");
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }, [opponent, mid, load]);

  const respond = useCallback(async (duelId: string, accept: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/micro/duels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duel_id: duelId, accept }),
      });
      if (!aliveRef.current) return;
      if (res.ok) load();
    } catch {
      /* silencioso */
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }, [load]);

  // No mostramos el panel a usuarios sin sesión: el reto requiere login.
  if (loaded && !me) return null;

  return (
    <section
      style={{
        maxWidth: 760,
        margin: "16px auto",
        padding: "0 16px",
        fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)",
        color: "#fff",
      }}
    >
      <div
        style={{
          borderRadius: 18,
          background: `linear-gradient(180deg, ${SURFACE} 0%, ${BG} 100%)`,
          border: "1px solid rgba(201,168,76,0.22)",
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 18px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚔️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Duelo en Vivo</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                {duels.length > 0 ? `${duels.length} en este partido` : "Reta a un amigo a sumar más micro-puntos"}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: GOLD, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
        </button>

        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 14px 16px" }}>
            {/* Formulario de reto */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") challenge(); }}
                placeholder="@usuario a retar"
                disabled={busy}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(201,168,76,0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
              <button
                onClick={challenge}
                disabled={busy || !opponent.trim()}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
                  color: "#1a1207",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: busy || !opponent.trim() ? "not-allowed" : "pointer",
                  opacity: busy || !opponent.trim() ? 0.5 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                Retar ⚔️
              </button>
            </div>
            {msg && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", padding: "0 2px" }}>{msg}</div>
            )}

            {/* Lista de duelos */}
            {duels.map((d) => {
              const iAmChallenger = d.challenger_id === me;
              const myPts = iAmChallenger ? d.challenger_points : d.opponent_points;
              const rivalPts = iAmChallenger ? d.opponent_points : d.challenger_points;
              const rivalName = iAmChallenger ? d.opponent_username : d.challenger_username;
              const incomingPending = d.status === "pending" && !iAmChallenger;
              const iWon = d.status === "resolved" && d.winner_id === me;
              const isDraw = d.status === "resolved" && d.winner_id === null;
              return (
                <div
                  key={d.id}
                  style={{
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>
                      {iAmChallenger ? "Retaste a" : "Te retó"} <span style={{ color: GOLD_LIGHT }}>@{rivalName ?? "jugador"}</span>
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: d.status === "active" ? GOLD : "rgba(255,255,255,0.55)" }}>
                      {d.status === "pending" ? "Pendiente" : d.status === "active" ? "En juego" : d.status === "resolved" ? "Terminado" : "Rechazado"}
                    </span>
                  </div>

                  {d.status === "resolved" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700 }}>
                      <span>Tú: <span style={{ color: GOLD_LIGHT }}>{myPts ?? 0}</span> · Rival: <span style={{ color: GOLD_LIGHT }}>{rivalPts ?? 0}</span></span>
                      <span style={{ marginLeft: "auto", color: isDraw ? "#fff" : iWon ? OK : BAD, fontWeight: 800 }}>
                        {isDraw ? "Empate" : iWon ? "Ganaste +50 🪙" : "Perdiste"}
                      </span>
                    </div>
                  )}

                  {incomingPending && (
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => respond(d.id, true)}
                        disabled={busy}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                          background: "rgba(74,222,128,0.18)", color: OK, fontSize: 13, fontWeight: 800,
                          cursor: busy ? "wait" : "pointer",
                        }}
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => respond(d.id, false)}
                        disabled={busy}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid rgba(255,107,53,0.4)",
                          background: "transparent", color: BAD, fontSize: 13, fontWeight: 800,
                          cursor: busy ? "wait" : "pointer",
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}

                  {d.status === "pending" && iAmChallenger && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Esperando respuesta…</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
