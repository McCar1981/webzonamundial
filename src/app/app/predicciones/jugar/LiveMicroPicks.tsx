"use client";

// Micro-picks en vivo: panel que aparece SOLO mientras el partido está en juego.
// Hace polling al endpoint /live-picks, ofrece mercados rápidos (gol en 10 min,
// próxima jugada, quién marca) y muestra el resultado de los picks resueltos.
// Recompensa en Fútcoins/XP, otorgada por el backend.

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, Coins, Goal, Radio, Timer, X, Zap } from "./icons";

const BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const GREEN = "#22c55e", RED = "#ef4444", LIVE = "#e5604d";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

interface MarketOption { key: string; label: string }
interface Market {
  market: string;
  title: string;
  windowMin: number;
  rewardCoins: number;
  rewardXp: number;
  options: MarketOption[];
}
interface Pick {
  id: string;
  market: string;
  choice: string;
  open_minute: number;
  resolve_minute: number;
  status: "pending" | "won" | "lost";
  reward_coins: number;
  reward_xp: number;
}
interface LiveResponse {
  live: boolean;
  minute: number;
  finished: boolean;
  markets: Market[];
  picks: Pick[];
}

const MARKET_ICON: Record<string, typeof Goal> = {
  next_goal: Goal,
  next_event: Zap,
  next_team: Timer,
};

const CHOICE_LABEL: Record<string, string> = {
  yes: "Sí", no: "No", goal: "Gol", card: "Tarjeta", corner: "Córner",
  none: "Nada", home: "Local", away: "Visitante",
};

const POLL_MS = 20_000;

export default function LiveMicroPicks({ matchId }: { matchId: string }) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // market en envío
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/predictions/match/${matchId}/live-picks`);
      if (!res.ok) { if (alive.current) setData(null); return; }
      const json = (await res.json()) as LiveResponse;
      if (alive.current) setData(json);
    } catch {
      /* reintenta en el próximo ciclo */
    }
  }, [matchId]);

  useEffect(() => {
    alive.current = true;
    void load();
    const tick = () => {
      timer.current = setTimeout(async () => {
        await load();
        if (alive.current) tick();
      }, POLL_MS);
    };
    tick();
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 3000);
    return () => clearTimeout(id);
  }, [flash]);

  const place = useCallback(async (market: string, choice: string) => {
    setBusy(market);
    try {
      const res = await fetch(`/api/predictions/match/${matchId}/live-picks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market, choice }),
      });
      if (res.ok) {
        setFlash({ kind: "ok", msg: "¡Pick en vivo registrado!" });
        await load();
      } else {
        const j = await res.json().catch(() => ({}));
        const msg = j.error === "too_late" ? "Ya es tarde para este pick"
          : j.error === "match_not_live" ? "El partido no está en juego"
          : "No se pudo registrar el pick";
        setFlash({ kind: "err", msg });
      }
    } finally {
      setBusy(null);
    }
  }, [matchId, load]);

  // Solo se muestra durante el partido (o si hay picks recientes que mostrar).
  if (!data) return null;
  if (!data.live && data.picks.length === 0) return null;

  const pending = data.picks.filter((p) => p.status === "pending");
  const resolved = data.picks.filter((p) => p.status !== "pending").slice(0, 6);

  return (
    <section
      style={{
        background: BG2, border: `1px solid ${LIVE}55`, borderRadius: 16,
        padding: 16, marginTop: 16, boxShadow: `0 0 0 1px ${LIVE}22, 0 8px 30px rgba(0,0,0,0.35)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: `${LIVE}22`,
            color: LIVE, fontWeight: 800, fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
            padding: "4px 10px", borderRadius: 99,
          }}>
            <Radio size={13} /> {data.live ? "En vivo" : "Finalizado"}
          </span>
          <h3 style={{ fontSize: 17, fontWeight: 900, display: "flex", alignItems: "center", gap: 7 }}>
            <Zap size={18} color={GOLD2} /> Picks relámpago
          </h3>
        </div>
        {data.minute > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: MID, fontSize: 13, fontWeight: 700 }}>
            <Clock size={14} /> Minuto {data.minute}{"'"}
          </span>
        )}
      </div>
      <p style={{ color: DIM, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
        Apuestas rápidas que se resuelven en minutos. Suman Fútcoins y XP al instante, sin afectar tu predicción del partido.
      </p>

      {/* Mercados disponibles */}
      {data.live && data.markets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
          {data.markets.map((m) => {
            const Icon = MARKET_ICON[m.market] ?? Goal;
            return (
              <div key={m.market} style={{ background: BG3, border: CARD_BORDER, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 13.5 }}>
                  <Icon size={16} color={GOLD} /> {m.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, color: GOLD2, fontSize: 11.5, fontWeight: 700 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Coins size={12} /> +{m.rewardCoins}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Zap size={12} /> +{m.rewardXp} XP</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {m.options.map((o) => (
                    <button
                      key={o.key}
                      disabled={busy === m.market}
                      onClick={() => place(m.market, o.key)}
                      style={{
                        flex: "1 1 auto", minWidth: 64, cursor: busy === m.market ? "wait" : "pointer",
                        background: "rgba(255,255,255,0.04)", border: CARD_BORDER, borderRadius: 9,
                        color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 10px",
                        opacity: busy === m.market ? 0.6 : 1,
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Picks pendientes */}
      {pending.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: MID, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>En juego</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pending.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: BG3, border: CARD_BORDER, borderRadius: 9, padding: "8px 11px" }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Timer size={14} color={GOLD} /> {pickLabel(p)}
                </span>
                <span style={{ color: DIM, fontSize: 11.5, fontWeight: 700 }}>resuelve al {p.resolve_minute}{"'"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Picks resueltos */}
      {resolved.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: MID, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Resueltos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {resolved.map((p) => {
              const won = p.status === "won";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: BG3, border: `1px solid ${(won ? GREEN : RED)}33`, borderRadius: 9, padding: "8px 11px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 }}>
                    {won ? <Check size={14} color={GREEN} /> : <X size={14} color={RED} />} {pickLabel(p)}
                  </span>
                  <span style={{ color: won ? GREEN : RED, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {won ? <><Coins size={12} /> +{p.reward_coins}</> : "Fallado"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {flash && (
        <div style={{
          marginTop: 12, textAlign: "center", fontSize: 12.5, fontWeight: 700,
          color: flash.kind === "ok" ? GREEN : RED,
        }}>
          {flash.msg}
        </div>
      )}
    </section>
  );
}

const MARKET_TITLE: Record<string, string> = {
  next_goal: "Gol en 10 min",
  next_event: "Próxima jugada",
  next_team: "Quién marca",
};

function pickLabel(p: Pick): string {
  const title = MARKET_TITLE[p.market] ?? p.market;
  const choice = CHOICE_LABEL[p.choice] ?? p.choice;
  return `${title}: ${choice}`;
}
