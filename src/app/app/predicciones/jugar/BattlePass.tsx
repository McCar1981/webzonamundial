"use client";

// Battle Pass de temporada (mejora E): pista de recompensas de ~30 días con XP
// de temporada. Dos tramos (gratis / Founders premium). Self-contained: consume
// /api/predictions/battlepass y reclama niveles desbloqueados. Solo iconos SVG.

import { useCallback, useEffect, useState } from "react";
import {
  BOOST_ICON, CheckCircle2, Clock, Coins, Crown, Gift, Lock, Sparkles, Trophy,
} from "./icons";

const BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const GREEN = "#22c55e", PURPLE = "#a78bfa";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

interface TierReward { coins: number; boost: string | null; highlight: boolean; claimed: boolean }
interface TierState { tier: number; threshold: number; unlocked: boolean; free: TierReward; premium: TierReward }
interface SeasonInfo { key: string; index: number; start: string; end: string; day_of_season: number; days_left: number }
interface BattlePassView {
  season: SeasonInfo;
  premium: boolean;
  season_xp: number;
  tier: number;
  tier_count: number;
  xp_into_tier: number;
  xp_for_tier: number;
  progress: number;
  tiers: TierState[];
}

export default function BattlePass() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BattlePassView | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/predictions/battlepass");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (flash) { const id = setTimeout(() => setFlash(null), 3500); return () => clearTimeout(id); } }, [flash]);

  const claim = useCallback(async (tier: number, track: "free" | "premium") => {
    setBusy(true);
    try {
      const res = await fetch("/api/predictions/battlepass/claim", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier, track }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setFlash(`Nivel ${tier} reclamado · recompensa cobrada`);
        await load();
      } else {
        setFlash(j.error === "premium_required" ? "Necesitas Founders para el tramo premium"
          : j.error === "tier_locked" ? "Aún no desbloqueas ese nivel"
          : j.error === "already_claimed" ? "Ya reclamaste ese nivel"
          : "No se pudo reclamar");
      }
    } finally { setBusy(false); }
  }, [load]);

  if (!data) return null;
  const { season, premium, tier, tier_count, xp_into_tier, xp_for_tier, progress, tiers } = data;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
      {/* Cabecera resumida + toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer", background: BG2,
          border: CARD_BORDER, borderRadius: 14, padding: "12px 14px", color: "inherit",
          display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ fontSize: 11, color: DIM, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <Trophy size={13} color={GOLD2} /> Pase de temporada {season.key}
            {premium && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: PURPLE, fontWeight: 800 }}><Crown size={12} /> Founders</span>}
          </div>
          <div style={{ fontWeight: 800, marginTop: 3, display: "flex", alignItems: "center", gap: 7 }}>
            Nivel {tier}<span style={{ color: DIM, fontWeight: 700, fontSize: 12 }}>/ {tier_count}</span>
            <span style={{ color: MID, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} /> {season.days_left}d restantes
            </span>
          </div>
          {/* Progreso al siguiente nivel */}
          <div style={{ height: 9, background: BG3, borderRadius: 99, marginTop: 8, overflow: "hidden", border: CARD_BORDER }}>
            <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: `linear-gradient(90deg,${GOLD},${GOLD2})`, transition: "width .4s" }} />
          </div>
          <div style={{ color: DIM, fontSize: 10.5, marginTop: 5 }}>
            {tier < tier_count ? `${xp_into_tier}/${xp_for_tier} XP de temporada al nivel ${tier + 1}` : "Pista completa"}
          </div>
        </div>
        <span style={{ color: GOLD2, fontWeight: 800, fontSize: 13 }}>{open ? "Ocultar" : "Ver pista"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
          {tiers.map((t) => (
            <div
              key={t.tier}
              style={{
                background: BG2,
                border: t.free.highlight ? `1px solid ${GOLD}` : CARD_BORDER,
                borderRadius: 12, padding: "10px 11px", opacity: t.unlocked ? 1 : 0.62,
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 900, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {t.unlocked ? <CheckCircle2 size={14} color={GREEN} /> : <Lock size={13} color={DIM} />}
                  Nivel {t.tier}
                </span>
                {t.free.highlight && <Sparkles size={14} color={GOLD2} />}
              </div>

              <RewardRow
                label="Gratis"
                reward={t.free}
                unlocked={t.unlocked}
                accent={GOLD2}
                busy={busy}
                onClaim={() => claim(t.tier, "free")}
              />
              <RewardRow
                label="Founders"
                reward={t.premium}
                unlocked={t.unlocked}
                accent={PURPLE}
                locked={!premium}
                busy={busy}
                onClaim={() => claim(t.tier, "premium")}
              />
            </div>
          ))}
        </div>
      )}

      {flash && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          {flash}
        </div>
      )}
    </div>
  );
}

function RewardRow({ label, reward, unlocked, accent, locked, busy, onClaim }: {
  label: string; reward: TierReward; unlocked: boolean; accent: string;
  locked?: boolean; busy: boolean; onClaim: () => void;
}) {
  const Boost = reward.boost ? BOOST_ICON[reward.boost] ?? Gift : null;
  const canClaim = unlocked && !reward.claimed && !locked;
  return (
    <div style={{ background: BG3, border: CARD_BORDER, borderRadius: 9, padding: "7px 8px" }}>
      <div style={{ fontSize: 10, color: accent, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
        {label === "Founders" ? <Crown size={11} /> : <Gift size={11} />} {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12.5, fontWeight: 700 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Coins size={13} color={accent} /> {reward.coins}</span>
        {Boost && <Boost size={14} color={accent} />}
      </div>
      <button
        onClick={onClaim}
        disabled={!canClaim || busy}
        style={{
          marginTop: 6, width: "100%", cursor: canClaim ? "pointer" : "default",
          background: reward.claimed ? "transparent" : canClaim ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "transparent",
          color: reward.claimed ? GREEN : canClaim ? "#1a1206" : DIM,
          border: reward.claimed ? `1px solid ${GREEN}` : CARD_BORDER, borderRadius: 8,
          fontWeight: 800, fontSize: 11, padding: "5px 6px",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}
      >
        {reward.claimed ? <><CheckCircle2 size={12} /> Reclamado</>
          : locked ? <><Lock size={11} /> Founders</>
          : !unlocked ? <><Lock size={11} /> Bloqueado</>
          : "Reclamar"}
      </button>
    </div>
  );
}
