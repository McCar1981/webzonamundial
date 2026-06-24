"use client";

/**
 * GoalCelebrationGlobal — la celebración de GOL (GoalNet, escena 3D a pantalla
 * completa) disparada en TODA la plataforma, no solo dentro del Match Center.
 *
 * Va montado UNA vez en el layout raíz (junto a LiveMatchBar), así que esté
 * donde esté el usuario —leyendo una noticia, en un módulo, en el lobby— si cae
 * un GOL en cualquier partido EN VIVO, la pantalla "explota" como en la tele.
 *
 *  - Datos: /api/match-center/today (KV + CDN, coste ~0), mismo contrato que
 *    LiveMatchBar. Sondeo 12 s con balón rodando, 60 s si no; pausa en segundo
 *    plano.
 *  - Detección: comparamos el marcador entre sondeos; si SUBE el de un equipo
 *    es gol. El lado que marca = el lado cuyo marcador subió (vale también para
 *    el autogol: el beneficiario es quien sube). NUNCA dispara en el PRIMER
 *    sondeo (línea base): al entrar a mitad de partido no relanza goles viejos.
 *  - Excluye el partido que el usuario está viendo en su Match Center: ese lo
 *    celebra el propio MatchCenterLive; aquí lo saltamos para no duplicar.
 *  - Cola: una celebración a la vez (~7 s); si caen varios goles seguidos se
 *    encolan (máx. 4) y se muestran en orden.
 *  - El color del equipo se resuelve del kit por bandera (kits-2026), sin tocar
 *    la API. GoalNet es pointer-events:none y se auto-desvanece: no bloquea.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import GoalNet from "@/app/app/matchcenter/GoalNet";
import { kitColors } from "@/data/kits-2026";
import { resolveMatchId } from "@/lib/match-center/slug";

interface TodayTeam { name: string; flag: string }
interface TodayMatch {
  matchId: number;
  status: string;
  live: boolean;
  elapsed: number;
  score: [number | null, number | null];
  home: TodayTeam;
  away: TodayTeam;
  lastEvent: { minute: number; type: string; player: string | null } | null;
}

interface Celebration {
  teamName: string;
  color: string;
  flag: string;
  player?: string;
  ownGoal?: boolean;
}

const GOLD = "#c9a84c";
const POLL_LIVE_MS = 12_000;
const POLL_IDLE_MS = 60_000;
/** Duración de la celebración (GoalNet ~7 s) + margen antes de la siguiente. */
const CELEBRATION_MS = 7_500;
const MAX_QUEUE = 4;

function teamColor(flag: string): string {
  try {
    return kitColors(flag)?.primary || GOLD;
  } catch {
    return GOLD;
  }
}

export default function GoalCelebrationGlobal() {
  const pathname = usePathname();
  const [active, setActive] = useState<(Celebration & { fxKey: number }) | null>(null);

  // Marcador conocido por partido ("h-a"); ref para no re-renderizar en cada poll.
  const scoresRef = useRef<Map<number, string>>(new Map());
  const initializedRef = useRef(false);
  const queueRef = useRef<Celebration[]>([]);
  const activeRef = useRef(false);
  const fxKeyRef = useRef(0);
  const loadingRef = useRef(false);
  const anyLiveRef = useRef(false);

  // Partido que el usuario está viendo ahora (su Match Center ya celebra ese gol).
  const focusedIdRef = useRef<number | null>(null);
  useEffect(() => {
    const mm = pathname?.match(/^\/app\/matchcenter\/([^/?#]+)/);
    if (!mm) { focusedIdRef.current = null; return; }
    try { focusedIdRef.current = resolveMatchId(decodeURIComponent(mm[1])); }
    catch { focusedIdRef.current = null; }
  }, [pathname]);

  const showNext = () => {
    const next = queueRef.current.shift();
    if (next) {
      activeRef.current = true;
      fxKeyRef.current += 1;
      setActive({ ...next, fxKey: fxKeyRef.current });
    } else {
      activeRef.current = false;
      setActive(null);
    }
  };

  const enqueue = (cel: Celebration) => {
    if (queueRef.current.length >= MAX_QUEUE) return;
    queueRef.current.push(cel);
    if (!activeRef.current) showNext();
  };

  // Al activarse una celebración, programa el paso a la siguiente (o a vacío).
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(showNext, CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [active]);

  // Sondeo del estado de hoy + detección de goles por delta de marcador.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (alive && !document.hidden) {
        timer = setTimeout(load, anyLiveRef.current ? POLL_LIVE_MS : POLL_IDLE_MS);
      }
    };

    const load = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        const r = await fetch("/api/match-center/today", { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as { matches?: TodayMatch[] };
          if (alive && Array.isArray(data.matches)) {
            anyLiveRef.current = data.matches.some((m) => m.live);
            for (const m of data.matches) {
              const [hg, ag] = m.score;
              if (hg == null || ag == null) continue;
              const key = `${hg}-${ag}`;
              const prev = scoresRef.current.get(m.matchId);
              scoresRef.current.set(m.matchId, key);
              if (!initializedRef.current || prev === undefined) continue; // línea base
              // ¿Subió el marcador? (gol). Excluye tanda de penaltis y el
              // partido que el usuario está viendo.
              const [ph, pa] = prev.split("-").map(Number);
              const scored = hg > ph || ag > pa;
              if (!scored || !m.live || m.status === "P" || m.status === "PEN") continue;
              if (m.matchId === focusedIdRef.current) continue;
              const side: "home" | "away" = hg > ph ? "home" : "away";
              const team = side === "home" ? m.home : m.away;
              enqueue({
                teamName: team.name,
                color: teamColor(team.flag),
                flag: team.flag,
                player: m.lastEvent?.player ?? undefined,
                ownGoal: m.lastEvent?.type === "own_goal",
              });
            }
            initializedRef.current = true;
          }
        }
      } catch {
        /* siguiente tick */
      } finally {
        loadingRef.current = false;
        schedule();
      }
    };
    void load();

    const onVisible = () => {
      if (!alive || document.visibilityState !== "visible") return;
      if (timer) { clearTimeout(timer); timer = null; }
      void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!active) return null;
  return (
    <GoalNet
      teamName={active.teamName}
      color={active.color}
      flag={active.flag}
      player={active.player}
      ownGoal={active.ownGoal}
      fxKey={active.fxKey}
    />
  );
}
