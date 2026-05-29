"use client";

// Fantasy Mundial — experiencia interactiva client-side. Orquesta el estado del
// equipo (localStorage), la validación, y las 5 vistas: Equipo, Mercado,
// En Vivo, Ligas y Coach IA.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPlayerById, ROSTERED_COUNT } from "@/lib/fantasy/players";
import { remapFormation, validateTeam } from "@/lib/fantasy/rules";
import { autoDraft } from "@/lib/fantasy/coach";
import { defaultTeam, loadTeam, saveTeam, clearTeam } from "@/lib/fantasy/store";
import { BUDGET, type FantasyPos, type FantasyTeamState, type PowerUp, type SquadSlot } from "@/lib/fantasy/types";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money } from "./fx";
import { FORMATIONS } from "@/lib/fantasy/rules";
import TeamView from "./TeamView";
import MarketView from "./MarketView";
import LiveView from "./LiveView";
import LeaguesView from "./LeaguesView";
import CoachView from "./CoachView";
import Onboarding from "./Onboarding";

const ONBOARDED_KEY = "zm-fantasy-onboarded:v1";

type Tab = "equipo" | "mercado" | "vivo" | "ligas" | "coach";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "equipo", label: "Mi Equipo", icon: "🧩" },
  { id: "mercado", label: "Mercado", icon: "📈" },
  { id: "vivo", label: "En Vivo", icon: "🔴" },
  { id: "ligas", label: "Ligas", icon: "🏟️" },
  { id: "coach", label: "Coach IA", icon: "🤖" },
];

export default function FantasyGame() {
  const [team, setTeam] = useState<FantasyTeamState>(defaultTeam);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("equipo");
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setTeam(loadTeam() ?? defaultTeam());
    setLoaded(true);
    try {
      if (!window.localStorage.getItem(ONBOARDED_KEY)) setShowOnboarding(true);
    } catch { /* ignore */ }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try { window.localStorage.setItem(ONBOARDED_KEY, "1"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (loaded) saveTeam(team);
  }, [team, loaded]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout((flash as unknown as { _t?: number })._t);
    (flash as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const validation = useMemo(() => validateTeam(team.slots, getPlayerById, team.formation), [team.slots, team.formation]);
  const ownedIds = useMemo(() => new Set(team.slots.map((s) => s.playerId).filter(Boolean) as string[]), [team.slots]);
  const nationCounts = validation.nationCounts;
  const spent = validation.totalCost;
  const budgetRemaining = validation.budgetRemaining;

  const update = useCallback((mut: (t: FantasyTeamState) => FantasyTeamState) => setTeam((t) => mut(structuredCloneSafe(t))), []);

  const setFormation = useCallback(
    (code: string) => {
      update((t) => {
        const slots = remapFormation(t.slots, code, (id) => getPlayerById(id)?.pos);
        const starterIds = new Set(slots.filter((s) => !s.bench && s.playerId).map((s) => s.playerId!));
        return { ...t, formation: code, slots, captainId: t.captainId && starterIds.has(t.captainId) ? t.captainId : null, viceId: t.viceId && starterIds.has(t.viceId) ? t.viceId : null };
      });
    },
    [update],
  );

  const assignPlayer = useCallback(
    (playerId: string, slotId?: string) => {
      const p = getPlayerById(playerId);
      if (!p) return;
      if (ownedIds.has(playerId)) {
        flash("Ya tienes a ese jugador.");
        return;
      }
      // Hueco destino: el indicado o el primero compatible vacío.
      const target = slotId
        ? team.slots.find((s) => s.slot === slotId)
        : team.slots.find((s) => !s.playerId && slotAccepts(s, p.pos));
      if (!target) {
        flash(slotId ? "Ese hueco no admite esa posición." : `No hay hueco libre para un ${p.pos}.`);
        return;
      }
      if (!slotAccepts(target, p.pos)) {
        flash("Posición incompatible con ese hueco.");
        return;
      }
      const prevId = target.playerId;
      const prev = prevId ? getPlayerById(prevId) : null;
      // Límite por selección (sin contar al que se reemplaza si es del mismo país).
      const sameNation = (nationCounts[p.teamSlug] ?? 0) - (prev?.teamSlug === p.teamSlug ? 1 : 0);
      if (sameNation >= 3) {
        flash(`Máximo 3 de ${p.teamName}.`);
        return;
      }
      const newSpent = spent - (prev?.price ?? 0) + p.price;
      if (newSpent > BUDGET + 1e-6) {
        flash(`Te pasas del presupuesto (${newSpent.toFixed(1)}M / ${BUDGET}M).`);
        return;
      }
      update((t) => {
        const slots = t.slots.map((s) => (s.slot === target.slot ? { ...s, playerId } : s));
        let captainId = t.captainId;
        let viceId = t.viceId;
        if (prevId && captainId === prevId) captainId = null;
        if (prevId && viceId === prevId) viceId = null;
        return { ...t, slots, captainId, viceId };
      });
      flash(`Fichado: ${p.name} (${money(p.price)}).`);
      setSelectingSlot(null);
    },
    [team.slots, ownedIds, nationCounts, spent, update, flash],
  );

  const removePlayer = useCallback(
    (slotId: string) => {
      update((t) => {
        const s = t.slots.find((x) => x.slot === slotId);
        const pid = s?.playerId ?? null;
        return {
          ...t,
          slots: t.slots.map((x) => (x.slot === slotId ? { ...x, playerId: null } : x)),
          captainId: t.captainId === pid ? null : t.captainId,
          viceId: t.viceId === pid ? null : t.viceId,
        };
      });
    },
    [update],
  );

  // Intercambia (o mueve) los jugadores de dos huecos respetando posiciones.
  const swapSlots = useCallback(
    (a: string, b: string) => {
      if (a === b) return;
      const sa = team.slots.find((s) => s.slot === a);
      const sb = team.slots.find((s) => s.slot === b);
      if (!sa || !sb) return;
      const pa = sa.playerId ? getPlayerById(sa.playerId) : null;
      const pb = sb.playerId ? getPlayerById(sb.playerId) : null;
      if ((pa && !slotAccepts(sb, pa.pos)) || (pb && !slotAccepts(sa, pb.pos))) {
        flash("Ese intercambio no respeta las posiciones.");
        return;
      }
      update((t) => {
        const slots = t.slots.map((s) => (s.slot === a ? { ...s, playerId: sb.playerId } : s.slot === b ? { ...s, playerId: sa.playerId } : s));
        const starterIds = new Set(slots.filter((s) => !s.bench && s.playerId).map((s) => s.playerId!));
        return { ...t, slots, captainId: t.captainId && starterIds.has(t.captainId) ? t.captainId : null, viceId: t.viceId && starterIds.has(t.viceId) ? t.viceId : null };
      });
    },
    [team.slots, update, flash],
  );

  const setCaptain = useCallback(
    (id: string) => update((t) => ({ ...t, captainId: id, viceId: t.viceId === id ? null : t.viceId })),
    [update],
  );
  const setVice = useCallback(
    (id: string) => update((t) => ({ ...t, viceId: id, captainId: t.captainId === id ? null : t.captainId })),
    [update],
  );

  const setPowerUp = useCallback(
    (pu: PowerUp) => {
      if (team.powerUpsUsed.includes(pu)) {
        flash("Ese power-up ya lo usaste en el torneo.");
        return;
      }
      update((t) => ({ ...t, powerUp: t.powerUp === pu ? null : pu }));
    },
    [team.powerUpsUsed, update, flash],
  );

  const doAutoDraft = useCallback(() => {
    const { slots, captainId, viceId } = autoDraft(team.formation);
    update((t) => ({ ...t, slots, captainId, viceId }));
    flash("Auto-draft IA completado.");
    setTab("equipo");
  }, [team.formation, update, flash]);

  const resetTeam = useCallback(() => {
    clearTeam();
    setTeam({ ...defaultTeam(), teamName: team.teamName });
    flash("Equipo reiniciado.");
  }, [team.teamName, flash]);

  const startSelecting = useCallback((slotId: string) => {
    setSelectingSlot(slotId);
    setTab("mercado");
  }, []);

  // Confirma la jornada: guarda puntos en el historial y avanza.
  const commitGameweek = useCallback(
    (points: number) => {
      update((t) => {
        const usedPU = t.powerUp;
        return {
          ...t,
          totalPoints: t.totalPoints + points,
          history: [...t.history.filter((h) => h.gw !== t.gameweek), { gw: t.gameweek, points, powerUp: usedPU }],
          powerUpsUsed: usedPU && !t.powerUpsUsed.includes(usedPU) ? [...t.powerUpsUsed, usedPU] : t.powerUpsUsed,
          gameweek: Math.min(7, t.gameweek + 1),
          powerUp: null,
        };
      });
      flash(`Jornada confirmada: +${points} pts.`);
      setTab("ligas");
    },
    [update, flash],
  );

  if (!loaded) {
    return <div style={{ minHeight: "100vh", background: BG, color: MID, display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando…</div>;
  }

  const pct = Math.min(100, (spent / BUDGET) * 100);

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: `${BG}f2`, backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/app/fantasy" style={{ color: MID, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>← Fantasy</Link>
            <input
              value={team.teamName}
              onChange={(e) => update((t) => ({ ...t, teamName: e.target.value.slice(0, 40) }))}
              style={{ flex: "1 1 160px", minWidth: 120, background: "transparent", border: "none", borderBottom: "1px dashed rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, fontWeight: 800, padding: "4px 2px", outline: "none" }}
            />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: GOLD, textTransform: "uppercase" }}>Jornada {team.gameweek}/7</span>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginTop: 12 }}>
            <Stat label="Presupuesto" value={money(budgetRemaining)} sub={`Coste ${money(spent)}`} bar={pct} barColor={budgetRemaining < 0 ? RED : GOLD} />
            <Stat label="Puntos totales" value={String(team.totalPoints)} sub={`${team.history.length} jornadas`} />
            <Stat label="Plantilla" value={`${ownedIds.size}/15`} sub={validation.ok ? "Válida ✓" : "Incompleta"} valueColor={validation.ok ? GREEN : RED} />
            <Stat label="Capitán" value={team.captainId ? short(getPlayerById(team.captainId)?.name) : "—"} sub={team.viceId ? `V: ${short(getPlayerById(team.viceId)?.name)}` : "sin vice"} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: "0 0 auto", padding: "8px 14px", borderRadius: 10, border: "1px solid " + (tab === tb.id ? GOLD : "rgba(255,255,255,0.1)"), background: tab === tb.id ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG2, color: tab === tb.id ? BG : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                <span style={{ marginRight: 6 }}>{tb.icon}</span>{tb.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selecting banner */}
      {selectingSlot && tab === "mercado" && (
        <div style={{ background: `${GOLD}22`, borderBottom: `1px solid ${GOLD}55`, padding: "8px 16px", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
          Eligiendo para el hueco <b>{selectingSlot}</b> · <button onClick={() => setSelectingSlot(null)} style={{ background: "none", border: "none", color: GOLD2, fontWeight: 800, cursor: "pointer" }}>cancelar</button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        {tab === "equipo" && (
          <TeamView
            team={team}
            validation={validation}
            onSlotClickEmpty={startSelecting}
            onRemove={removePlayer}
            onCaptain={setCaptain}
            onVice={setVice}
            onSwap={swapSlots}
            onSetFormation={setFormation}
            onSetPowerUp={setPowerUp}
            onAutoDraft={doAutoDraft}
            onReset={resetTeam}
            formations={FORMATIONS}
          />
        )}
        {tab === "mercado" && (
          <MarketView
            ownedIds={ownedIds}
            nationCounts={nationCounts}
            budgetRemaining={budgetRemaining}
            selectingSlot={selectingSlot ? team.slots.find((s) => s.slot === selectingSlot) ?? null : null}
            onPick={assignPlayer}
          />
        )}
        {tab === "vivo" && <LiveView team={team} onCommit={commitGameweek} />}
        {tab === "ligas" && <LeaguesView team={team} />}
        {tab === "coach" && <CoachView team={team} ownedIds={ownedIds} budgetRemaining={budgetRemaining} onAutoDraft={doAutoDraft} onCaptain={setCaptain} onGoMarket={() => setTab("mercado")} />}
      </div>

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 50, background: BG3, border: `1px solid ${GOLD}55`, borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>{toast}</div>
      )}

      {showOnboarding && <Onboarding onClose={dismissOnboarding} onAutoDraft={doAutoDraft} />}

      <div style={{ textAlign: "center", padding: "30px 16px", color: DIM, fontSize: 12 }}>
        Jugadores reales de las {ROSTERED_COUNT} selecciones con convocatoria confirmada (act. 29 may 2026). Precios, puntos, forma, probabilidad de titularidad y estado físico son una simulación interactiva para previsualizar el Fantasy. Las {48 - ROSTERED_COUNT} selecciones restantes se añadirán al confirmarse sus listas.
      </div>
    </div>
  );
}

function slotAccepts(slot: SquadSlot, pos: FantasyPos): boolean {
  if (slot.bench) return slot.pos === "GK" ? pos === "GK" : pos !== "GK";
  return slot.pos === pos;
}

function short(name?: string): string {
  if (!name) return "—";
  const parts = name.split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function structuredCloneSafe<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

function Stat({ label, value, sub, bar, barColor, valueColor }: { label: string; value: string; sub?: string; bar?: number; barColor?: string; valueColor?: string }) {
  return (
    <div style={{ background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: valueColor ?? "#fff", lineHeight: 1.2 }}>{value}</div>
      {typeof bar === "number" && (
        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.1)", marginTop: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar}%`, background: barColor ?? GOLD, transition: "width .3s" }} />
        </div>
      )}
      {sub && <div style={{ fontSize: 10, color: MID, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
