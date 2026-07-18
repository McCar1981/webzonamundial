"use client";

// Fantasy Mundial — experiencia interactiva client-side. Orquesta el estado del
// equipo (localStorage), la validación, y las 5 vistas: Equipo, Mercado,
// En Vivo, Ligas y Coach IA.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getPlayerById, applyRealStats } from "@/lib/fantasy/players";
import { remapFormation, validateTeam, transferCost, refundForElimination } from "@/lib/fantasy/rules";
import { isEliminated } from "@/lib/fantasy/tournament";
import { isFantasyLive } from "@/lib/fantasy/season";
import { playerMatchLocked, MATCH_LOCK_HOURS, gameweekLockedForFree, isKnockoutGameweek } from "@/lib/fantasy/fixtures";
import { FREE_LIMITS } from "@/lib/pro/limits";
import { openProPaywall } from "@/lib/pro/paywall-client";
import { autoDraft } from "@/lib/fantasy/coach";
import { defaultTeam, loadTeam, saveTeam, clearTeam, normalizeTeam } from "@/lib/fantasy/store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchServerTeam, saveServerTeam, fetchRealPlayerStats } from "./api";
import { BUDGET, FREE_TRANSFERS, MAX_FREE_TRANSFERS, type FantasyPos, type FantasyTeamState, type PowerUp, type SquadSlot } from "@/lib/fantasy/types";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money } from "./fx";
import { FORMATIONS } from "@/lib/fantasy/rules";
import TeamView from "./TeamView";
import MarketView from "./MarketView";
import LiveView from "./LiveView";
import LeaguesView from "./LeaguesView";
import CoachView from "./CoachView";
import AchievementsView from "./AchievementsView";
import GuideView from "./GuideView";
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

type Tab = "equipo" | "mercado" | "vivo" | "ligas" | "logros" | "coach" | "guia";

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
  const [confirmReset, setConfirmReset] = useState(false);
  const [isWide, setIsWide] = useState(false); // ≥1024px → fondo claro (en prueba)
  const [authed, setAuthed] = useState<boolean | null>(null);
  // Puntos PROVISIONALES de la jornada en curso (server-authoritative, del GET de
  // equipo): permiten que la cabecera "Puntos totales" avance EN VIVO sin esperar
  // a confirmar la jornada entera.
  const [liveGw, setLiveGw] = useState<{ gw: number; points: number } | null>(null);
  // El servidor rechazó un guardado por el lock Free (plantilla cerrada). En vez
  // de reabrir el modal Pro en cada cambio, se muestra UN banner fijo y se pausa
  // el autoguardado mientras dure el cierre de la jornada.
  const [freeLocked, setFreeLocked] = useState(false);
  // syncReady evita que el autoguardado pise el equipo del servidor con el
  // estado por defecto durante el breve instante previo a la carga inicial.
  const syncReady = useRef(false);

  useEffect(() => {
    // Deep-link a una pestaña concreta (?tab=ligas) — permite que la card del
    // lobby y el menú entren DIRECTOS al módulo de Ligas privadas, sin pasar
    // por "Mi Equipo". Solo se aceptan pestañas válidas; cualquier otra cae al
    // valor por defecto. No afecta a la liga del creador (eso vive en el equipo).
    try {
      const wanted = new URLSearchParams(window.location.search).get("tab");
      const valid: Tab[] = ["equipo", "mercado", "vivo", "ligas", "logros", "coach", "guia"];
      if (wanted && (valid as string[]).includes(wanted)) setTab(wanted as Tab);
    } catch { /* ignore */ }

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
        const { team: server, liveGameweek } = await fetchServerTeam();
        if (liveGameweek) setLiveGw(liveGameweek);
        if (server) {
          setTeam(normalizeTeam(server));
        } else {
          setTeam(local);
          if (hasProgress(local)) {
            await saveServerTeam(local); // migra el equipo del invitado
          }
        }
      }
      syncReady.current = true;
    })();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Estadísticas REALES del torneo: el pool arranca a 0 y aquí se vuelca el
  // acumulado de api-football sobre él (una vez por visita; el servidor cachea
  // 30 min). El bump fuerza el re-render con el pool ya actualizado.
  const [, bumpRealStats] = useState(0);
  useEffect(() => {
    if (!isFantasyLive()) return;
    let alive = true;
    fetchRealPlayerStats().then((stats) => {
      if (!alive || Object.keys(stats).length === 0) return;
      applyRealStats(stats);
      bumpRealStats((v) => v + 1);
    });
    return () => { alive = false; };
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
  // Si el servidor rechaza por el lock Free, se enciende el banner y se PAUSA el
  // autoguardado mientras dure el cierre (sin 403 en bucle ni paywall en cada
  // fichaje); al terminar la jornada se reactiva solo.
  useEffect(() => {
    if (!loaded || !authed || !syncReady.current) return;
    if (freeLocked && gameweekLockedForFree(team.gameweek, FREE_LIMITS.fantasy.lockHoursBeforeGameweek)) return;
    const id = window.setTimeout(() => {
      saveServerTeam(team)
        .then((r) => { if (r.proRequired) setFreeLocked(true); })
        .catch(() => {});
    }, 1200);
    return () => window.clearTimeout(id);
  }, [team, loaded, authed, freeLocked]);

  // Al cambiar de pestaña, vuelve arriba. Sin esto, si venías scrolleado abajo
  // en una vista larga (p.ej. Mercado) la siguiente se quedaba "cargada desde
  // el footer". Se omite el primer render para no pisar el scroll inicial.
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout((flash as unknown as { _t?: number })._t);
    (flash as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const validation = useMemo(() => validateTeam(team.slots, getPlayerById, team.formation, team.budgetBonus), [team.slots, team.formation, team.budgetBonus]);
  const ownedIds = useMemo(() => new Set(team.slots.map((s) => s.playerId).filter(Boolean) as string[]), [team.slots]);
  const nationCounts = validation.nationCounts;
  const spent = validation.totalCost;
  const budgetRemaining = validation.budgetRemaining;

  const update = useCallback((mut: (t: FantasyTeamState) => FantasyTeamState) => setTeam((t) => mut(structuredCloneSafe(t))), []);

  // Coste de fichajes de la jornada respecto a la plantilla confirmada (Fase 2).
  // El comodín ("comodin") deja todos los fichajes gratis.
  const transfers = useMemo(
    () => transferCost(team.committedSlots, team.slots, team.freeTransfers, team.powerUp === "comodin" || isKnockoutGameweek(team.gameweek)),
    [team.committedSlots, team.slots, team.freeTransfers, team.powerUp, team.gameweek],
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
      // No se ficha a jugadores de selecciones ya eliminadas (no volverán a puntuar).
      if (isEliminated(p.teamSlug, team.gameweek)) {
        flash(`${p.teamName} está eliminada del Mundial.`);
        return;
      }
      // Cierre por partido: no entra nadie cuyo partido esté a <3h o en juego.
      if (playerMatchLocked(p.flag, team.gameweek)) {
        flash(`🔒 ${p.name} está cerrado: su partido empieza en menos de ${MATCH_LOCK_HOURS} h o ya se juega.`);
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
      // El que sale también respeta el cierre: cerrado = intocable hasta confirmar.
      if (prev && playerMatchLocked(prev.flag, team.gameweek)) {
        flash(`🔒 ${prev.name} está cerrado hasta confirmar la jornada (su partido ya llegó).`);
        return;
      }
      // Límite por selección (sin contar al que se reemplaza si es del mismo país).
      const sameNation = (nationCounts[p.teamSlug] ?? 0) - (prev?.teamSlug === p.teamSlug ? 1 : 0);
      if (sameNation >= 3) {
        flash(`Máximo 3 de ${p.teamName}.`);
        return;
      }
      const newSpent = spent - (prev?.price ?? 0) + p.price;
      const budgetCap = BUDGET + team.budgetBonus;
      if (newSpent > budgetCap + 1e-6) {
        flash(`Te pasas del presupuesto (${newSpent.toFixed(1)}M / ${budgetCap.toFixed(1)}M).`);
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
    [team.slots, team.gameweek, ownedIds, nationCounts, spent, update, flash],
  );

  const removePlayer = useCallback(
    (slotId: string) => {
      const sx = team.slots.find((x) => x.slot === slotId);
      const px = sx?.playerId ? getPlayerById(sx.playerId) : null;
      // Cierre por partido: con el saque a <3h (o jugado) nadie sale del equipo.
      if (px && playerMatchLocked(px.flag, team.gameweek)) {
        flash(`🔒 ${px.name} está cerrado: su partido empieza en menos de ${MATCH_LOCK_HOURS} h o ya se disputó.`);
        return;
      }
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
    [team.slots, team.gameweek, update, flash],
  );

  // Reembolso por eliminación: da de baja a un jugador cuya selección ya quedó
  // eliminada y acredita un crédito EXTRA de presupuesto (0.5M/punto, suelo 2M).
  // Requisitos anti-abuso: la selección debe estar realmente eliminada en la
  // jornada actual, el jugador tiene que estar en la plantilla CONFIRMADA (no
  // recién fichado para exprimir el crédito) y solo se reembolsa una vez.
  const refundPlayer = useCallback(
    (slotId: string) => {
      const s = team.slots.find((x) => x.slot === slotId);
      const pid = s?.playerId ?? null;
      const p = pid ? getPlayerById(pid) : null;
      if (!p || !pid) return;
      if (!isEliminated(p.teamSlug, team.gameweek)) {
        flash(`${p.teamName} sigue en competición.`);
        return;
      }
      if (team.refundedIds.includes(pid)) {
        flash("Ese jugador ya fue reembolsado.");
        return;
      }
      const committed = team.committedSlots.some((c) => c.playerId === pid);
      if (!committed) {
        flash("Solo se reembolsan jugadores que ya tenías fichados.");
        return;
      }
      const refund = refundForElimination(p.totalPoints);
      update((t) => ({
        ...t,
        slots: t.slots.map((x) => (x.slot === slotId ? { ...x, playerId: null } : x)),
        captainId: t.captainId === pid ? null : t.captainId,
        viceId: t.viceId === pid ? null : t.viceId,
        budgetBonus: Math.round((t.budgetBonus + refund) * 10) / 10,
        refundedIds: [...t.refundedIds, pid],
      }));
      flash(`💸 Reembolso por ${p.name} (eliminado): +${money(refund)}.`);
    },
    [team.slots, team.gameweek, team.refundedIds, team.committedSlots, update, flash],
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
      // Cierre por partido: entrar/salir del once cambia la puntuación, así que
      // un jugador cerrado no cruza entre campo y banquillo (reordenar dentro
      // del banquillo sí se permite).
      if (sa.bench !== sb.bench) {
        const lockedP = [pa, pb].find((p) => p && playerMatchLocked(p.flag, team.gameweek));
        if (lockedP) {
          flash(`🔒 ${lockedP.name} está cerrado: no puede entrar ni salir del once con su partido a menos de ${MATCH_LOCK_HOURS} h o ya jugado.`);
          return;
        }
      }
      update((t) => {
        const slots = t.slots.map((s) => (s.slot === a ? { ...s, playerId: sb.playerId } : s.slot === b ? { ...s, playerId: sa.playerId } : s));
        const starterIds = new Set(slots.filter((s) => !s.bench && s.playerId).map((s) => s.playerId!));
        return { ...t, slots, captainId: t.captainId && starterIds.has(t.captainId) ? t.captainId : null, viceId: t.viceId && starterIds.has(t.viceId) ? t.viceId : null };
      });
    },
    [team.slots, team.gameweek, update, flash],
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
    // Pasa la jornada para que el auto-draft EXCLUYA a los jugadores cerrados por
    // el cierre de 3h (los que ya jugaron): así el equipo generado es válido y se
    // puede guardar, incluso reconstruyendo a mitad de jornada.
    const { slots, captainId, viceId } = autoDraft(team.formation, team.gameweek);
    update((t) => ({ ...t, slots, captainId, viceId }));
    flash("Auto-draft IA completado.");
    setTab("equipo");
  }, [team.formation, team.gameweek, update, flash]);

  // "Reiniciar" SOLO limpia el borrador editable (alineación, capitán, formación,
  // chip armado). PRESERVA el progreso del torneo: puntos, historial, plantilla
  // confirmada, chips ya gastados y la jornada. Así un reinicio (sobre todo si es
  // por error) nunca cuesta puntos ni la posición en el ranking. Pasa por una
  // confirmación previa (ver confirmReset).
  const resetTeam = useCallback(() => {
    const fresh = defaultTeam();
    clearTeam();
    setTeam((t) => ({
      ...t,
      slots: fresh.slots,
      captainId: null,
      viceId: null,
      formation: fresh.formation,
      powerUp: null,
    }));
    setConfirmReset(false);
    flash("Borrador reiniciado · tus puntos y posición están a salvo.");
  }, [flash]);

  const startSelecting = useCallback((slotId: string) => {
    setSelectingSlot(slotId);
    setTab("mercado");
  }, []);

  // Confirma la jornada. Con sesión, el SERVIDOR es la autoridad: recalcula los
  // puntos con DATOS REALES (no se fía del número del cliente), registra el
  // ranking y abona Fútcoins. Por eso confirmamos PRIMERO contra el servidor y
  // solo avanzamos de jornada con su veredicto — así jamás se avanza sin haber
  // puntuado (perdiendo puntos). Invitado: confirmación solo local (no compite).
  const commitGameweek = useCallback(
    (points: number) => {
      const gwBeing = team.gameweek;
      // Evita reconfirmar una jornada ya cerrada (sobre todo la 8, que no avanza
      // más): sin esto, cada clic volvería a sumar puntos al total local.
      if (team.history.some((h) => h.gw === gwBeing)) { flash("Esta jornada ya está confirmada."); return; }
      const tc = transferCost(team.committedSlots, team.slots, team.freeTransfers, team.powerUp === "comodin" || isKnockoutGameweek(gwBeing));
      const usedPU = team.powerUp;
      // Construye el estado de la próxima jornada con los puntos NETOS confirmados.
      const advance = (net: number): FantasyTeamState => ({
        ...team,
        totalPoints: team.totalPoints + net,
        history: [...team.history.filter((h) => h.gw !== gwBeing), { gw: gwBeing, points: net, powerUp: usedPU }],
        powerUpsUsed: usedPU && !team.powerUpsUsed.includes(usedPU) ? [...team.powerUpsUsed, usedPU] : team.powerUpsUsed,
        gameweek: Math.min(8, gwBeing + 1),
        powerUp: null,
        // Fija la plantilla actual como base para contar los fichajes de la próxima
        // jornada y repone un fichaje gratis (tope MAX_FREE_TRANSFERS).
        committedSlots: team.slots.map((s) => ({ ...s })),
        freeTransfers: Math.min(MAX_FREE_TRANSFERS, (tc.wildcard ? team.freeTransfers : Math.max(0, team.freeTransfers - tc.transfers)) + FREE_TRANSFERS),
      });

      if (!authed) {
        // Invitado: confirmación local con la estimación del cliente (no compite
        // en ranking ni gana Fútcoins; eso requiere cuenta y validación server-side).
        const net = Math.max(0, points - tc.penalty);
        setTeam(advance(net));
        flash(tc.penalty > 0 ? `Jornada confirmada: +${points} −${tc.penalty} = +${net} pts.` : `Jornada confirmada: +${net} pts.`);
        setTab("ligas");
        return;
      }

      flash("Confirmando jornada…");
      saveServerTeam(team, { gw: gwBeing, points, powerUp: usedPU })
        .then((r) => {
          if (!r.ok) { flash("⚠️ No se pudo confirmar la jornada. Reintenta en un momento."); return; }
          if (!r.confirmed) { flash("Aún no se puede confirmar: espera a que terminen todos tus partidos."); return; }
          const net = r.gameweekPoints ?? Math.max(0, points - tc.penalty);
          setTeam(advance(net));
          const base = tc.penalty > 0
            ? `Jornada confirmada: +${net + tc.penalty} −${tc.penalty} = +${net} pts.`
            : `Jornada confirmada: +${net} pts.`;
          flash(r.futcoins > 0 ? `${base} +${r.futcoins} Fútcoins · +${r.xpAwarded} XP` : base);
          setTab("ligas");
        })
        .catch(() => flash("⚠️ No se pudo confirmar la jornada. Reintenta en un momento."));
    },
    [team, authed, flash],
  );

  if (!loaded) {
    // Skeleton (no el texto plano "Cargando…"): una tira de cabecera + un
    // marcador de campo con pulso de opacidad. Guardado para reduced-motion.
    return (
      <div style={{ minHeight: "100vh", background: FANTASY_BG, backgroundAttachment: "fixed", padding: 16 }} aria-busy="true" aria-label="Cargando Fantasy">
        <style>{`
          @keyframes zmSkelPulse { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
          .zm-skel { animation: zmSkelPulse 1.3s ease-in-out infinite }
          @media (prefers-reduced-motion: reduce) { .zm-skel { animation: none } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Tira de cabecera */}
          <div className="zm-skel" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: "1 1 200px", height: 34, borderRadius: 10, background: BG2 }} />
            <div style={{ flex: "0 0 90px", height: 34, borderRadius: 10, background: BG2 }} />
          </div>
          <div className="zm-skel" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[0, 1, 2].map((k) => <div key={k} style={{ height: 52, borderRadius: 12, background: BG2 }} />)}
          </div>
          {/* Marcador de campo */}
          <div className="zm-skel" style={{ maxWidth: 470, margin: "0 auto", aspectRatio: "400 / 680", borderRadius: 22, background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
      </div>
    );
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
            <button
              onClick={() => setTab("guia")}
              title="Guía de uso: normas y reglas"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, border: "1px solid " + (tab === "guia" ? GOLD : GOLD + "55"), background: tab === "guia" ? GOLD + "22" : GOLD + "12", color: GOLD2, fontSize: 11.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              📖 Guía
            </button>
            <input
              value={team.teamName}
              placeholder="Nombra tu equipo ✏️"
              onChange={(e) => update((t) => ({ ...t, teamName: e.target.value.slice(0, 40) }))}
              style={{ flex: "1 1 160px", minWidth: 120, background: "transparent", border: "none", borderBottom: "1px dashed rgba(255,255,255,0.22)", color: "#fff", fontSize: 17, fontWeight: 800, padding: "3px 2px", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: GOLD, textTransform: "uppercase" }}>Jornada {team.gameweek}/8</span>
              {/* Capitán como chip compacto → libera la fila de stats y sube el campo */}
              {(() => {
                const capP = team.captainId ? getPlayerById(team.captainId) : null;
                const capElim = !!capP && isEliminated(capP.teamSlug, team.gameweek);
                return (
                  <span title={capElim ? "Tu capitán está eliminado: reasígnalo o su ×2 será sobre 0" : "Capitán"} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, border: "1px solid " + (capElim ? RED : team.captainId ? GOLD : "rgba(255,255,255,0.14)"), background: capElim ? `${RED}1f` : team.captainId ? `${GOLD}1f` : "rgba(255,255,255,0.04)", color: capElim ? RED : team.captainId ? GOLD2 : MID, whiteSpace: "nowrap" }}>
                    ⭐ {team.captainId ? short(capP?.name) : "Sin capitán"}
                    {capElim && <span style={{ fontWeight: 900 }}> ⚠️ eliminado</span>}
                    {team.captainId && team.viceId && <span style={{ color: MID, fontWeight: 700 }}>· V: {short(getPlayerById(team.viceId)?.name)}</span>}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Stats — tira compacta de 3 (capitán vive en la cabecera) para subir el campo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(112px,1fr))", gap: 8, marginTop: 9 }}>
            <Stat label="Presupuesto" value={money(budgetRemaining)} sub={`Coste ${money(spent)}${team.budgetBonus > 0 ? ` · +${money(team.budgetBonus)} reemb.` : ""}`} bar={pct} barColor={budgetRemaining < 0 ? RED : GOLD} />
            {(() => {
              // Total con el provisional EN VIVO de la jornada en curso sumado:
              // team.totalPoints solo incluye jornadas YA confirmadas; liveGw es
              // lo que llevas esta jornada (server-authoritative). Así el header
              // avanza durante la semana en vez de quedarse clavado en 0.
              const liveActive = !!liveGw && liveGw.gw === team.gameweek && liveGw.points > 0;
              const shown = team.totalPoints + (liveActive ? liveGw!.points : 0);
              return (
                <Stat
                  label="Puntos totales"
                  value={String(shown)}
                  valueColor={liveActive ? GOLD2 : undefined}
                  sub={liveActive ? `${team.history.length} conf. · +${liveGw!.points} en vivo 🔴` : `${team.history.length} jornadas`}
                />
              );
            })()}
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

      {/* Lock Free: UN banner fijo en vez del modal en cada cambio. El enlace a
          Pro es acción explícita del usuario, así que abre el paywall normal. */}
      {freeLocked && gameweekLockedForFree(team.gameweek, FREE_LIMITS.fantasy.lockHoursBeforeGameweek) && (
        <div style={{ background: "rgba(201,168,76,0.10)", borderBottom: "1px solid rgba(201,168,76,0.35)", padding: "8px 16px", fontSize: 12.5, fontWeight: 700, textAlign: "center", color: GOLD2 }}>
          🔒 Jornada en curso: tu alineación está cerrada y los cambios no se guardarán.{" "}
          <button
            onClick={() => openProPaywall({ feature: "fantasy_lock" })}
            style={{ background: "none", border: "none", color: "#fff", fontWeight: 800, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12.5 }}
          >
            Con Pro haces cambios en vivo
          </button>
        </div>
      )}

      {/* Banner de invitado: honesto y persistente. Solo cuando NO hay sesión
          (authed===false, no durante la comprobación inicial). Un invitado
          construye su equipo en localStorage pero NO compite en ranking. */}
      {authed === false && (
        <div style={{ background: "rgba(56,189,248,0.08)", borderBottom: "1px solid rgba(56,189,248,0.28)", padding: "8px 16px", fontSize: 12.5, fontWeight: 700, textAlign: "center", color: "#bfe6ff" }}>
          👤 Juegas como invitado ·{" "}
          <Link href="/login?next=/app/fantasy/jugar" style={{ color: GOLD2, fontWeight: 800, textDecoration: "underline" }}>inicia sesión para competir</Link>
        </div>
      )}

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
            onRefund={refundPlayer}
            onCaptain={setCaptain}
            onVice={setVice}
            onSwap={swapSlots}
            onSetFormation={setFormation}
            onSetPowerUp={setPowerUp}
            onAutoDraft={doAutoDraft}
            onReset={() => setConfirmReset(true)}
            formations={FORMATIONS}
            wide={isWide}
          />
        )}
        {tab === "mercado" && (
          <MarketView
            ownedIds={ownedIds}
            nationCounts={nationCounts}
            budgetRemaining={budgetRemaining}
            gameweek={team.gameweek}
            selectingSlot={selectingSlot ? team.slots.find((s) => s.slot === selectingSlot) ?? null : null}
            onPick={assignPlayer}
          />
        )}
        {tab === "vivo" && <LiveView team={team} onCommit={commitGameweek} transfers={transfers} />}
        {tab === "ligas" && <LeaguesView team={team} authed={authed === true} />}
        {tab === "logros" && <AchievementsView team={team} />}
        {tab === "coach" && <CoachView team={team} ownedIds={ownedIds} budgetRemaining={budgetRemaining} onAutoDraft={doAutoDraft} onCaptain={setCaptain} onGoMarket={() => setTab("mercado")} />}
        {tab === "guia" && <GuideView />}
      </div>

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 50, background: BG3, border: `1px solid ${GOLD}55`, borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>{toast}</div>
      )}

      {showOnboarding && <Onboarding onClose={dismissOnboarding} onAutoDraft={doAutoDraft} />}

      {confirmReset && (
        <div onClick={() => setConfirmReset(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, width: "100%", background: BG2, border: `1px solid ${GOLD}44`, borderRadius: 18, padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>¿Reiniciar tu alineación?</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: MID, margin: "0 0 8px" }}>
              Esto vacía tu <b>alineación actual</b> para que la rearmes desde cero.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: GREEN, fontWeight: 700, margin: "0 0 18px" }}>
              ✓ Tus <b>puntos</b>, tu <b>historial</b> y tu <b>posición en el ranking</b> NO se pierden.
            </p>
            {liveGw && liveGw.gw === team.gameweek && (
              <p style={{ fontSize: 12, lineHeight: 1.55, color: GOLD2, margin: "0 0 18px" }}>
                Ojo: la jornada está en juego. Los jugadores cuyo partido ya empezó quedan cerrados y no podrás volver a alinearlos hasta la próxima jornada.
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "transparent", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={resetTeam} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: RED, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Reiniciar</button>
            </div>
          </div>
        </div>
      )}
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
