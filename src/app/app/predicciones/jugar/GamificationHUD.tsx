"use client";

// HUD de gamificación de Predicciones: nivel/XP, racha, monedas, Hora Feliz
// (flash multiplier), check-in diario + reto, logros y tienda de boosts.
// Self-contained: se monta en la cabecera del módulo y consume /api/predictions/me.

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ACHIEVEMENT_ICON, BOOST_ICON, CHALLENGE_ICON,
  CheckCircle2, Coins, Flame, Gift, Medal, ShoppingCart,
} from "./icons";

const BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const GREEN = "#22c55e", RED = "#e5604d";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

/** "18h", "45m" o "5h" para la cuenta atrás de la racha. */
function formatHoursLeft(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  return `${Math.round(hours)}h`;
}

interface LevelInfo { level: number; xp: number; xpIntoLevel: number; xpForLevel: number; xpToNext: number; progress: number; title: string }
interface Achievement { id: string; name: string; emoji: string; description: string; unlocked: boolean; unlocked_at: string | null }
interface DailyChallenge { key: string; title: string; description: string; emoji: string; rewardCoins: number; rewardXp: number }
interface Flash { active: boolean; type: string | null; multiplier: number; endsAt: string; label: string }
interface BoostInv { id: string; name: string; emoji: string; count: number }
interface Summary {
  level: LevelInfo;
  coins: number;
  coin_name: string;
  streak: { current: number; best: number; active: boolean; expires_at: string | null; hours_left: number | null };
  achievements: Achievement[];
  daily: { challenge: DailyChallenge; challenge_progress: number; challenge_target: number; challenge_completed: boolean; can_claim: boolean; checkin_days: number; next_reward: { day: number; coins: number; xp: number; chest: boolean } };
  flash: Flash;
  boosts: BoostInv[];
}
interface CatalogItem { id: string; name: string; emoji: string; description: string; cost: number }

export default function GamificationHUD() {
  const [data, setData] = useState<Summary | null>(null);
  const [tab, setTab] = useState<null | "achievements" | "shop">(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/predictions/me");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (tab === "shop" && !catalog.length) {
      fetch("/api/predictions/boosts").then((r) => r.json()).then((j) => setCatalog(j.catalog ?? [])).catch(() => {});
    }
  }, [tab, catalog.length]);
  useEffect(() => { if (flash) { const id = setTimeout(() => setFlash(null), 3500); return () => clearTimeout(id); } }, [flash]);

  const claimDaily = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/predictions/daily", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        const chest = j.chest ? ` + ${j.chest.label} (${j.chest.coins} monedas)` : "";
        setFlash(`Check-in día ${j.reward?.day}: +${j.reward?.coins} monedas +${j.reward?.xp} XP${chest}`);
        await load();
      } else {
        setFlash(j.message || "Ya reclamaste hoy");
      }
    } finally { setBusy(false); }
  }, [load]);

  const buyBoost = useCallback(async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/predictions/boosts", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boost_id: id }),
      });
      const j = await res.json().catch(() => ({}));
      setFlash(res.ok ? "Boost comprado" : (j.error === "insufficient_coins" ? "Monedas insuficientes" : (j.message || "No se pudo comprar")));
      if (res.ok) await load();
    } finally { setBusy(false); }
  }, [load]);

  if (!data) return null;
  const { level, coins, streak, daily, flash: fl, boosts } = data;
  const unlockedCount = data.achievements.filter((a) => a.unlocked).length;

  const challengePct = Math.round((Math.min(daily.challenge_progress, daily.challenge_target) / daily.challenge_target) * 100);

  return (
    <>
      {/* Recuadro 1 · Nivel + XP (ancho) */}
      <div style={{ flex: "3 1 240px", background: BG2, border: CARD_BORDER, borderRadius: 14, padding: "11px 13px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "2px 6px" }}>
          <span style={{ fontWeight: 900, fontSize: 15 }}>
            <span style={{ color: GOLD2 }}>Nivel {level.level}</span>{" "}
            <span style={{ color: MID, fontSize: 12, fontWeight: 700 }}>{level.title}</span>
          </span>
          <span style={{ color: DIM, fontSize: 11 }}>{level.xpIntoLevel}/{level.xpForLevel} XP</span>
        </div>
        <div style={{ height: 9, background: BG3, borderRadius: 99, marginTop: 8, overflow: "hidden", border: CARD_BORDER }}>
          <div style={{ width: `${Math.round(level.progress * 100)}%`, height: "100%", background: `linear-gradient(90deg,${GOLD},${GOLD2})`, transition: "width .4s" }} />
        </div>
        <div style={{ color: DIM, fontSize: 10.5, marginTop: 5 }}>Faltan {level.xpToNext} XP para subir</div>
      </div>

      {/* Recuadro 2 · Racha (con cuenta atrás de caducidad) */}
      <Stat
        icon={Flame}
        value={streak.current}
        label={
          streak.active && streak.hours_left != null
            ? `Expira en ${formatHoursLeft(streak.hours_left)} · ×1.5`
            : streak.active
              ? "Racha activa ×1.5"
              : `Racha · récord ${streak.best}`
        }
        glow={streak.active}
        urgent={streak.active && streak.hours_left != null && streak.hours_left <= 6}
      />
      {/* Recuadro 3 · Fútcoins */}
      <Stat icon={Coins} value={coins} label={data.coin_name} />

      {/* Recuadro 4 · Reto de hoy (compacto, con check-in) */}
      <div style={{ flex: "2 1 210px", background: BG2, border: CARD_BORDER, borderRadius: 14, padding: "10px 13px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: DIM, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          Reto de hoy
          {daily.challenge_completed && <CheckCircle2 size={13} color={GREEN} />}
        </div>
        <div style={{ fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          {challengeIcon(daily.challenge.key)}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{daily.challenge.title}</span>
        </div>
        <div style={{ height: 7, background: BG3, borderRadius: 99, overflow: "hidden", border: CARD_BORDER }}>
          <div style={{ width: `${challengePct}%`, height: "100%", background: daily.challenge_completed ? GREEN : `linear-gradient(90deg,${GOLD},${GOLD2})`, transition: "width .4s" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: daily.challenge_completed ? GREEN : GOLD2, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Coins size={12} /> {daily.challenge.rewardCoins} · +{daily.challenge.rewardXp} XP
          </span>
          <button
            onClick={claimDaily}
            disabled={!daily.can_claim || busy}
            title={daily.can_claim ? `+${daily.next_reward.coins} día ${daily.next_reward.day}${daily.next_reward.chest ? " + cofre" : ""}` : `${daily.checkin_days} días seguidos`}
            style={{
              cursor: daily.can_claim ? "pointer" : "default", whiteSpace: "nowrap",
              background: daily.can_claim ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG3,
              color: daily.can_claim ? "#1a1206" : DIM, border: CARD_BORDER, borderRadius: 9,
              fontWeight: 800, fontSize: 11.5, padding: "6px 10px",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            {daily.can_claim ? <><Gift size={13} /> Check-in</> : <><CheckCircle2 size={13} /> Hecho</>}
          </button>
        </div>
      </div>

      {/* Bloque desplegable a lo ancho (cae bajo la tira) */}
      <div className="strip-wide" style={{ order: 2, flexBasis: "100%", width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Hora Feliz (flash) */}
        {fl.active && (
          <div style={{ background: "rgba(232,212,139,0.12)", border: `1px solid ${GOLD}`, borderRadius: 14, padding: "9px 14px", color: GOLD2, fontWeight: 800, fontSize: 13.5, textAlign: "center" }}>
            {fl.label} — termina a las {new Date(fl.endsAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}

        {/* Tabs: logros / tienda + inventario */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <TabBtn active={tab === "achievements"} onClick={() => setTab(tab === "achievements" ? null : "achievements")}>
            <Medal size={15} /> Logros {unlockedCount}/{data.achievements.length}
          </TabBtn>
          <TabBtn active={tab === "shop"} onClick={() => setTab(tab === "shop" ? null : "shop")}>
            <ShoppingCart size={15} /> Tienda de boosts
          </TabBtn>
          {boosts.length > 0 && (
            <span style={{ color: MID, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 10 }}>
              Inventario:
              {boosts.map((b) => (
                <span key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {boostIcon(b.id)}{b.count}
                </span>
              ))}
            </span>
          )}
        </div>

        {tab === "achievements" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {data.achievements.map((a) => (
              <div key={a.id} style={{ background: BG2, border: a.unlocked ? `1px solid ${GREEN}` : CARD_BORDER, borderRadius: 12, padding: "10px 12px", opacity: a.unlocked ? 1 : 0.55 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}>
                  {achievementIcon(a.id)}
                  {a.name}
                  {a.unlocked && <CheckCircle2 size={14} color={GREEN} />}
                </div>
                <div style={{ color: MID, fontSize: 12, marginTop: 2 }}>{a.description}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "shop" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
            {catalog.map((c) => (
              <div key={c.id} style={{ background: BG2, border: CARD_BORDER, borderRadius: 12, padding: "11px 13px" }}>
                <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}>
                  {boostIcon(c.id)}
                  {c.name}
                </div>
                <div style={{ color: MID, fontSize: 12, marginTop: 3, minHeight: 32 }}>{c.description}</div>
                <button
                  onClick={() => buyBoost(c.id)}
                  disabled={busy || coins < c.cost}
                  style={{
                    marginTop: 8, width: "100%", cursor: coins >= c.cost ? "pointer" : "default",
                    background: coins >= c.cost ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG3,
                    color: coins >= c.cost ? "#1a1206" : DIM, border: CARD_BORDER, borderRadius: 9,
                    fontWeight: 800, fontSize: 13, padding: "8px 10px",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>Comprar · <Coins size={13} /> {c.cost}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {flash && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          {flash}
        </div>
      )}
    </>
  );
}

function challengeIcon(key: string) {
  const Icon = CHALLENGE_ICON[key] ?? Gift;
  return <Icon size={16} color={GOLD2} />;
}
function boostIcon(id: string) {
  const Icon = BOOST_ICON[id] ?? Gift;
  return <Icon size={15} color={GOLD2} />;
}
function achievementIcon(id: string) {
  const Icon = ACHIEVEMENT_ICON[id] ?? Medal;
  return <Icon size={16} color={GOLD2} />;
}

function Stat({ icon: Icon, value, label, glow, urgent }: { icon: LucideIcon; value: number; label: string; glow?: boolean; urgent?: boolean }) {
  const border = urgent ? `1px solid ${RED}` : glow ? `1px solid ${GOLD}` : CARD_BORDER;
  const shadow = urgent ? "0 0 18px rgba(229,96,77,0.3)" : glow ? "0 0 18px rgba(201,168,76,0.25)" : "none";
  return (
    <div style={{ flex: "1 1 130px", background: BG2, border, borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: shadow }}>
      <div style={{ fontWeight: 900, fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={20} color={urgent ? RED : GOLD2} strokeWidth={2.2} />
        {value}
      </div>
      <div style={{ color: urgent ? RED : MID, fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: "pointer", background: active ? "rgba(201,168,76,0.15)" : BG2,
        border: active ? `1px solid ${GOLD}` : CARD_BORDER, borderRadius: 99,
        color: active ? GOLD2 : MID, fontWeight: 700, fontSize: 13, padding: "8px 14px",
        display: "inline-flex", alignItems: "center", gap: 6,
      }}
    >
      {children}
    </button>
  );
}
