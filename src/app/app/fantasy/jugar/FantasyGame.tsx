"use client";

// Fantasy Mundial — experiencia interactiva client-side. Orquesta el estado del
// equipo (localStorage), la validación, y las 5 vistas: Equipo, Mercado,
// En Vivo, Ligas y Coach IA.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getPlayerById, ROSTERED_COUNT } from "@/lib/fantasy/players";
import { remapFormation, validateTeam, transferCost } from "@/lib/fantasy/rules";
import { autoDraft } from "@/lib/fantasy/coach";
import { defaultTeam, loadTeam, saveTeam, clearTeam, normalizeTeam } from "@/lib/fantasy/store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchServerTeam, saveServerTeam } from "./api";
import { BUDGET, FREE_TRANSFERS, MAX_FREE_TRANSFERS, type FantasyPos, type FantasyTeamState, type PowerUp, type SquadSlot } from "@/lib/fantasy/types";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money } from "./fx";
import { FORMATIONS } from "@/lib/fantasy/rules";
import TeamView from "./TeamView";
import MarketView from "./MarketView";
import LiveView from "./LiveView";
import LeaguesView from "./LeaguesView";
import CoachView from "./CoachView";
import AchievementsView from "./AchievementsView";
import Onboarding from "./Onboarding";

const ONBOARDED_KEY = "zm-fantasy-onboarded:v1";

// Fondo propio del Fantasy: estadio de noche bajo focos. Dos conos de luz cruzados
// desde lo alto (como reflectores), un halo verde césped al pie y una textura sutil
// de "gradas" para diferenciar el Fantasy del resto de Zona Mundial.
const FANTASY_BG =
  "conic-gradient(from 200deg at 18% -8%, rgba(255,245,210,0.20), transparent 22%)," + // reflector superior izq.
  "conic-gradient(from 160deg at 82% -8%, rgba(255,245,210,0.20), transparent 22%)," + // reflector superior der.
  "radial-gradient(1000px 520px at 50% -6%, rgba(201,168,76,0.22), transparent 62%)," + // resplandor dorado del marcador
  "radial-gradient(1400px 760px at 50% 110%, rgba(20,150,86,0.34), transparent 60%)," + // verde césped al pie
  "linear-gradient(180deg, #0b1a30 0%, #091324 50%, #060c18 100%)"; // base azul noche

type Tab = "equipo" | "mercado" | "vivo" | "ligas" | "logros" | "coach";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "equipo", label: "Mi Equipo", icon: "🧩" },
  { id: "mercado", label: "Mercado", icon: "📈" },
  { id: "vivo", label: "En Vivo", icon: "🔴" },
  { id: "ligas", label: "Ligas", icon: "🏟️" },
  { id: "logros", label: "Logros", icon: "🏅" },
  { id: "coach", label: "Coach IA", icon: "🤖" },
];

export default function FantasyGame() {
  const [team, setTeam] = useState<FantasyTeamState>(defaultTeam);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("equipo");
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isWide, setIsWide] = useState(false); // ≥1024px → fondo claro (en prueba)
  const [authed, setAuthed] = useState<boolean | null>(null);
  // syncReady evita que el autoguardado pise el equipo del servidor con el
  // estado por defecto durante el breve instante previo a la carga inicial.
  const syncReady = useRef(false);

  useEffect(() => {
    const local = loadTeam() ?? defaultTeam();
    setTeam(local);
    setLoaded(true);
    try {
      if (!window.localStorage.getItem(ONBOARDED_KEY)) setShowOnboarding(true);
    } catch { /* ignore */ }
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);

    // Sesión + sincronización con el backend real (Fase 1). El localStorage
    // queda como modo invitado; al iniciar sesión se prioriza el equipo del
    // servidor y, si está vacío pero el invitado tenía progreso, se migra.
    (async () => {
      let isAuthed = false;
      try {
        const supa = createSupabaseBrowserClient();
        const { data } = await supa.auth.getUser();
        isAuthed = !!data.user;
      } catch { /* sin sesión */ }
      setAuthed(isAuthed);
      if (isAuthed) {
        const server = await fetchServerTeam();
        if (server) {
          setTeam(normalizeTeam(server));
        } else if (hasProgress(local)) {
          await saveServerTeam(local); // migra el progreso de invitado
        }
      }
      syncReady.current = true;
    })();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try { window.localStorage.setItem(ONBOARDED_KEY, "1"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (loaded) saveTeam(team);
  }, [team, loaded]);

  // Autoguardado en el servidor (debounce) cuando hay sesión. No se dispara
  // hasta que la carga inicial terminó (syncReady) para no pisar lo del backend.
  useEffect(() => {
    if (!loaded || !authed || !syncReady.current) return;
    const id = window.setTimeout(() => { saveServerTeam(team).catch(() => {}); }, 1200);
    return () => window.clearTimeout(id);
  }, [team, loaded, authed]);

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

  // Coste de fichajes de la jornada respecto a la plantilla confirmada (Fase 2).
  // El comodín ("comodin") deja todos los fichajes gratis.
  const transfers = useMemo(
    () => transferCost(team.committedSlots, team.slots, team.freeTransfers, team.powerUp === "comodin"),
    [team.committedSlots, team.slots, team.freeTransfers, team.powerUp],
  );

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

  // Confirma la jornada: aplica el coste de fichajes, guarda puntos netos en el
  // historial, consume el chip, repone fichajes gratis y avanza de jornada.
  // Si hay sesión, persiste de inmediato y registra la puntuación semanal.
  const commitGameweek = useCallback(
    (points: number) => {
      const tc = transferCost(team.committedSlots, team.slots, team.freeTransfers, team.powerUp === "comodin");
      const net = points - tc.penalty;
      const usedPU = team.powerUp;
      const next: FantasyTeamState = {
        ...team,
        totalPoints: team.totalPoints + net,
        history: [...team.history.filter((h) => h.gw !== team.gameweek), { gw: team.gameweek, points: net, powerUp: usedPU }],
        powerUpsUsed: usedPU && !team.powerUpsUsed.includes(usedPU) ? [...team.powerUpsUsed, usedPU] : team.powerUpsUsed,
        gameweek: Math.min(7, team.gameweek + 1),
        powerUp: null,
        // Fija la plantilla actual como base para contar los fichajes de la próxima
        // jornada y repone un fichaje gratis (tope MAX_FREE_TRANSFERS).
        committedSlots: team.slots.map((s) => ({ ...s })),
        freeTransfers: Math.min(MAX_FREE_TRANSFERS, (tc.wildcard ? team.freeTransfers : Math.max(0, team.freeTransfers - tc.transfers)) + FREE_TRANSFERS),
      };
      setTeam(next);
      if (authed) {
        saveServerTeam(next, { gw: team.gameweek, points: net, powerUp: usedPU }).catch(() => {});
      }
      flash(tc.penalty > 0 ? `Jornada confirmada: +${points} −${tc.penalty} (fichajes) = +${net} pts.` : `Jornada confirmada: +${net} pts.`);
      setTab("ligas");
    },
    [team, authed, flash],
  );

  if (!loaded) {
    return <div style={{ minHeight: "100vh", background: BG, color: MID, display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando…</div>;
  }

  const pct = Math.min(100, (spent / BUDGET) * 100);

  return (
    <div style={{ background: FANTASY_BG, backgroundAttachment: "fixed", color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", position: "relative" }}>
      {/* Ambiente de noche de estadio: focos dorados, halo de césped y degradado profundo */}
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: `${BG}f2`, backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "9px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/app/fantasy" style={{ color: MID, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>← Fantasy</Link>
            <input
              value={team.teamName}
              placeholder="Nombra tu equipo ✏️"
              onChange={(e) => update((t) => ({ ...t, teamName: e.target.value.slice(0, 40) }))}
              style={{ flex: "1 1 160px", minWidth: 120, background: "transparent", border: "none", borderBottom: "1px dashed rgba(255,255,255,0.22)", color: "#fff", fontSize: 17, fontWeight: 800, padding: "3px 2px", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: GOLD, textTransform: "uppercase" }}>Jornada {team.gameweek}/7</span>
              {/* Capitán como chip compacto → libera la fila de stats y sube el campo */}
              <span title="Capitán" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, border: "1px solid " + (team.captainId ? GOLD : "rgba(255,255,255,0.14)"), background: team.captainId ? `${GOLD}1f` : "rgba(255,255,255,0.04)", color: team.captainId ? GOLD2 : MID, whiteSpace: "nowrap" }}>
                ⭐ {team.captainId ? short(getPlayerById(team.captainId)?.name) : "Sin capitán"}
                {team.captainId && team.viceId && <span style={{ color: MID, fontWeight: 700 }}>· V: {short(getPlayerById(team.viceId)?.name)}</span>}
              </span>
            </div>
          </div>

          {/* Stats — tira compacta de 3 (capitán vive en la cabecera) para subir el campo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(112px,1fr))", gap: 8, marginTop: 9 }}>
            <Stat label="Presupuesto" value={money(budgetRemaining)} sub={`Coste ${money(spent)}`} bar={pct} barColor={budgetRemaining < 0 ? RED : GOLD} />
            <Stat label="Puntos totales" value={String(team.totalPoints)} sub={`${team.history.length} jornadas`} />
            <Stat label="Plantilla" value={`${ownedIds.size}/15`} sub={validation.ok ? "Válida ✓" : "Incompleta"} valueColor={validation.ok ? GREEN : RED} />
          </div>

          {/* Tabs — fundido a la derecha en móvil para insinuar que hay más */}
          <div style={{ display: "flex", gap: 6, marginTop: 9, overflowX: "auto", paddingBottom: 2, WebkitMaskImage: isWide ? undefined : "linear-gradient(90deg,#000 90%,transparent)", maskImage: isWide ? undefined : "linear-gradient(90deg,#000 90%,transparent)" }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: "0 0 auto", padding: "9px 14px", borderRadius: 10, border: "1px solid " + (tab === tb.id ? GOLD : "rgba(255,255,255,0.1)"), background: tab === tb.id ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG2, color: tab === tb.id ? BG : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
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
            wide={isWide}
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
        {tab === "vivo" && <LiveView team={team} onCommit={commitGameweek} transfers={transfers} />}
        {tab === "ligas" && <LeaguesView team={team} authed={authed === true} />}
        {tab === "logros" && <AchievementsView team={team} />}
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

/** ¿El equipo invitado tiene progreso digno de migrar al servidor? */
function hasProgress(t: FantasyTeamState): boolean {
  return t.totalPoints > 0 || t.history.length > 0 || t.slots.some((s) => s.playerId);
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
    <div style={{ background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "6px 11px" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: valueColor ?? "#fff", lineHeight: 1.15 }}>{value}</div>
      {typeof bar === "number" && (
        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.1)", marginTop: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar}%`, background: barColor ?? GOLD, transition: "width .3s" }} />
        </div>
      )}
      {sub && <div style={{ fontSize: 9.5, color: MID, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
