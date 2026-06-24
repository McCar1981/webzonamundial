"use client";

/**
 * Marcador EN VIVO anclado arriba del todo, presente en TODA la web (pública y
 * /app). Estilo "ticker" tipo panel de resultados: banderas + marcador grande +
 * minuto latiendo. Enlaza al Match Center del partido.
 *
 *  - Solo se monta si hay algún partido EN JUEGO ahora mismo; sin partidos el
 *    componente devuelve null y NO ocupa espacio (la barra "se desactiva").
 *    El cambio aparición/desaparición provoca un pequeño desplazamiento del
 *    contenido (≈39px) en el saque y el pitido final: es INTENCIONADO — reservar
 *    el hueco siempre contradiría el requisito de ocultarla sin partido. Se
 *    suaviza con un fade-in (desactivado con prefers-reduced-motion).
 *  - Excluye el partido que ya estás viendo en su Match Center (ni se duplica el
 *    marcador ni el enlace apunta a la propia página). Si ese es el único en
 *    juego, la barra se oculta en esa página.
 *  - Si hay varios partidos simultáneos (habitual en fase de grupos) rota el
 *    destacado cada 6 s y muestra un contador. La rotación se pausa al pasar el
 *    ratón / enfocar y se congela al tocar, para que el toque caiga SIEMPRE en
 *    el partido visible (no en otro por un cambio a destiempo).
 *  - Publica su altura real en la variable CSS --zm-livebar-h (en un layout
 *    effect, antes del primer pintado) para que el header se ancle JUSTO debajo
 *    y no quede tapado mientras la barra está visible.
 *
 * Datos: /api/match-center/today (copias durables de KV, coste CERO contra
 * api-football; el CDN absorbe el polling). Sondeo 15 s con balón rodando, 60 s
 * si no, y SE PAUSA con la pestaña en segundo plano. Mismo contrato que
 * TodayLiveBoard.
 */

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveMatchId } from "@/lib/match-center/slug";

// useLayoutEffect avisa en SSR; en este componente "use client" lo degradamos a
// useEffect en el servidor (donde de todos modos devuelve null).
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface TodayTeam {
  name: string;
  flag: string;
}
interface TodayMatch {
  matchId: number;
  slug: string;
  status: string;
  live: boolean;
  finished: boolean;
  elapsed: number;
  score: [number | null, number | null];
  phase: string;
  group: string;
  home: TodayTeam;
  away: TodayTeam;
}

const BG = "#070D17";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const RED = "#e63946";
const MID = "#8a94b0";

const POLL_LIVE_MS = 15_000;
const POLL_IDLE_MS = 60_000;
const ROTATE_MS = 6_000;
const TAP_FREEZE_MS = 1_200;
/** Variable CSS donde publicamos la altura de la barra para que el header se
 *  ancle debajo. Debe coincidir con la que lee RootLayoutClient. */
const HEIGHT_VAR = "--zm-livebar-h";

function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code}.png`;
}

function setHeightVar(px: number): void {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.style.setProperty(HEIGHT_VAR, `${px}px`);
  } catch {
    /* ignore */
  }
}

/** Etiqueta del minuto/estado para la píldora central. */
function liveLabel(m: TodayMatch): string {
  if (m.status === "HT") return "DESC";
  if (m.status === "P" || m.status === "PEN") return "PEN";
  if (m.status === "INT" || m.status === "SUSP") return "INT";
  return `${m.elapsed}'`;
}

export default function LiveMatchBar() {
  const pathname = usePathname();
  const [live, setLive] = useState<TodayMatch[]>([]);
  const [idx, setIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const anyLiveRef = useRef(false);
  const loadingRef = useRef(false);
  const pausedRef = useRef(false); // rotación en pausa por interacción del usuario

  // Partido que el usuario está viendo ahora mismo (si está en su Match Center),
  // para no duplicarlo ni autoenlazar a la página en la que ya estás.
  const focusedId = useMemo(() => {
    const mm = pathname?.match(/^\/app\/matchcenter\/([^/?#]+)/);
    if (!mm) return null;
    try {
      return resolveMatchId(decodeURIComponent(mm[1]));
    } catch {
      return null;
    }
  }, [pathname]);

  // Partidos a mostrar: en juego, excluyendo el que ya estás viendo.
  const visible = useMemo(
    () => (focusedId != null ? live.filter((m) => m.matchId !== focusedId) : live),
    [live, focusedId],
  );
  const count = visible.length;

  // Sondeo del estado de hoy; nos quedamos SOLO con los partidos en juego. Se
  // pausa cuando la pestaña está oculta y se reanuda al volver a primer plano.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (alive && !document.hidden) {
        timer = setTimeout(load, anyLiveRef.current ? POLL_LIVE_MS : POLL_IDLE_MS);
      }
    };

    const load = async () => {
      if (loadingRef.current) return; // ya hay una carga en vuelo
      loadingRef.current = true;
      try {
        const r = await fetch("/api/match-center/today", { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as { matches?: TodayMatch[] };
          if (alive && Array.isArray(data.matches)) {
            const playing = data.matches.filter((m) => m.live);
            setLive(playing);
            anyLiveRef.current = playing.length > 0;
          }
        }
      } catch {
        /* errores de red: reintenta en el siguiente tick */
      } finally {
        loadingRef.current = false;
        schedule();
      }
    };
    void load();

    // Al volver a primer plano: refresca ya y reanuda el sondeo (móvil descarta
    // timers, y mientras estaba oculta el bucle se había detenido).
    const onVisible = () => {
      if (!alive || document.visibilityState !== "visible") return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Rota el destacado cuando hay más de un partido en juego. Acota el índice al
  // cambiar el conjunto (evita que los puntitos se queden sin destacado) y no
  // avanza mientras el usuario interactúa ni con la pestaña en segundo plano.
  useEffect(() => {
    setIdx((i) => (count > 0 ? i % count : 0));
    if (count <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      setIdx((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  // Publica la altura real de la barra ANTES del primer pintado (layout effect),
  // para que el header se ancle debajo sin un frame de solape. Sin partidos la
  // altura es 0 (el header vuelve a top:0).
  useIsoLayoutEffect(() => {
    if (count === 0) {
      setHeightVar(0);
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    const update = () => setHeightVar(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      setHeightVar(0);
    };
  }, [count]);

  if (count === 0) return null;

  // Pausa de la rotación mientras el usuario mira/interactúa con la barra.
  const pauseRotation = () => {
    pausedRef.current = true;
  };
  const resumeRotation = () => {
    pausedRef.current = false;
  };
  // Al tocar: congela un instante para que el clic navegue al partido visible
  // (el enlace se resuelve al soltar, no al pulsar; sin esto un cambio a
  // destiempo te llevaría a otro partido).
  const freezeForTap = () => {
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, TAP_FREEZE_MS);
  };

  // ════════ MODO DUAL: 2+ partidos EN JUEGO a la vez (jornada simultánea) ════════
  // Se muestran AMBOS a la vez como chips compactos (banderas + marcador + minuto),
  // cada uno enlaza a su Match Center. Si hubiera 3+, los 2 primeros + "+N" al hub.
  if (count >= 2) {
    const shown = visible.slice(0, 2);
    const extra = count - 2;
    return (
      <div
        ref={rootRef}
        role="region"
        aria-label="Marcadores en directo"
        className="zm-mb-root"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1001,
          background: `linear-gradient(90deg, ${BG} 0%, #0d1726 50%, ${BG} 100%)`,
          borderBottom: "1px solid rgba(201,168,76,0.18)",
          boxShadow: "0 6px 22px -8px rgba(0,0,0,0.6)",
        }}
      >
        <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${RED}, transparent)`, opacity: 0.8 }} />
        <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", maxWidth: 1100, margin: "0 auto", height: 38 }}>
          {shown.map((mm, i) => {
            const hg = mm.score[0] ?? 0;
            const ag = mm.score[1] ?? 0;
            const label = liveLabel(mm);
            return (
              <Fragment key={mm.matchId}>
                {i > 0 && <span aria-hidden style={{ width: 1, alignSelf: "center", height: 20, background: "rgba(255,255,255,0.14)" }} />}
                <Link
                  href={`/app/matchcenter/${mm.slug}`}
                  aria-label={`En directo: ${mm.home.name} ${hg}, ${mm.away.name} ${ag}, minuto ${mm.elapsed}`}
                  className="zm-mb-chip"
                  style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 8px", textDecoration: "none", color: "#fff", minWidth: 0 }}
                >
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: RED, flexShrink: 0, boxShadow: `0 0 8px ${RED}`, animation: "zm-mb-pulse 1.2s ease-in-out infinite" }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagUrl(mm.home.flag)} alt="" width={22} height={14} style={{ width: 22, height: 14, borderRadius: 2, objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }} />
                  <span style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums", minWidth: 12, textAlign: "right" }}>{hg}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: label === "DESC" || label === "INT" ? MID : GOLD2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.22)", borderRadius: 4, padding: "1px 4px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{label}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums", minWidth: 12, textAlign: "left" }}>{ag}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagUrl(mm.away.flag)} alt="" width={22} height={14} style={{ width: 22, height: 14, borderRadius: 2, objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }} />
                </Link>
              </Fragment>
            );
          })}
          {extra > 0 && (
            <Link href="/app/matchcenter" aria-label={`Ver ${extra} partidos más en directo`} style={{ display: "inline-flex", alignItems: "center", padding: "0 10px", color: GOLD, fontSize: 11, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>+{extra}</Link>
          )}
        </div>
        <style>{`
          @keyframes zm-mb-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.65)} }
          @keyframes zm-mb-in { from{opacity:0} to{opacity:1} }
          .zm-mb-root { animation: zm-mb-in .3s ease both; }
          @media (prefers-reduced-motion: reduce){ .zm-mb-root{animation:none!important} .zm-mb-chip span[aria-hidden]{animation:none!important} }
        `}</style>
      </div>
    );
  }

  // ════════ MODO SIMPLE: un solo partido en juego → barra completa con nombres ════════
  const safeIdx = idx % count;
  const m = visible[safeIdx];
  if (!m) return null;

  const hg = m.score[0] ?? 0;
  const ag = m.score[1] ?? 0;
  const label = liveLabel(m);
  const aria = `Partido en directo: ${m.home.name} ${hg}, ${m.away.name} ${ag}. ${
    m.status === "HT" ? "Descanso" : `Minuto ${m.elapsed}`
  }.`;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label="Marcador en directo"
      onMouseEnter={pauseRotation}
      onMouseLeave={resumeRotation}
      onFocus={pauseRotation}
      onBlur={resumeRotation}
      onPointerDown={freezeForTap}
      className="zm-mb-root"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1001,
        background: `linear-gradient(90deg, ${BG} 0%, #0d1726 50%, ${BG} 100%)`,
        borderBottom: "1px solid rgba(201,168,76,0.18)",
        boxShadow: "0 6px 22px -8px rgba(0,0,0,0.6)",
      }}
    >
      {/* Acento rojo "en vivo" en el borde superior */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${RED}, transparent)`,
          opacity: 0.8,
        }}
      />

      <Link
        href={`/app/matchcenter/${m.slug}`}
        aria-label={aria}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "7px 40px 7px 14px",
          height: 38,
          textDecoration: "none",
          color: "#fff",
        }}
      >
        {/* LIVE badge */}
        <span
          className="zm-mb-live"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            background: RED,
            color: "#fff",
            fontSize: 9.5,
            fontWeight: 900,
            letterSpacing: "0.18em",
            borderRadius: 4,
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(230,57,70,0.55)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
              animation: "zm-mb-pulse 1.2s ease-in-out infinite",
            }}
          />
          LIVE
        </span>

        {/* Local: bandera + nombre */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0, justifyContent: "flex-end", flex: "1 1 0" }}>
          <span className="zm-mb-name zm-mb-name-h">{m.home.name}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(m.home.flag)}
            alt=""
            width={26}
            height={17}
            style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }}
          />
        </span>

        {/* Marcador + minuto */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, minWidth: 14, textAlign: "right" }}>
            {hg}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: label === "DESC" || label === "INT" ? MID : GOLD2,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(201,168,76,0.22)",
              borderRadius: 5,
              padding: "2px 6px",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1, minWidth: 14, textAlign: "left" }}>
            {ag}
          </span>
        </span>

        {/* Visitante: nombre + bandera */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0, justifyContent: "flex-start", flex: "1 1 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(m.away.flag)}
            alt=""
            width={26}
            height={17}
            style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }}
          />
          <span className="zm-mb-name zm-mb-name-a">{m.away.name}</span>
        </span>

        {/* Chevron "ir al partido" */}
        <span aria-hidden className="zm-mb-go" style={{ display: "inline-flex", alignItems: "center", color: GOLD, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>

        {/* Contador / puntos si hay varios en juego */}
        {count > 1 && (
          <span
            className="zm-mb-dots"
            aria-label={`${safeIdx + 1} de ${count} partidos en directo`}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}
          >
            {visible.map((mm, i) => (
              <span
                key={mm.matchId}
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: i === safeIdx ? GOLD : "rgba(255,255,255,0.28)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </span>
        )}
      </Link>

      <style>{`
        @keyframes zm-mb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.65); }
        }
        @keyframes zm-mb-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .zm-mb-root { animation: zm-mb-in 0.3s ease both; }
        .zm-mb-name {
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }
        @media (max-width: 720px) {
          .zm-mb-name { max-width: 92px; font-size: 13px; }
        }
        /* En móvil estrecho ocultamos los nombres: mandan banderas + marcador. */
        @media (max-width: 520px) {
          .zm-mb-name { display: none; }
        }
        @media (max-width: 380px) {
          .zm-mb-live { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .zm-mb-root { animation: none !important; }
          .zm-mb-live span[aria-hidden] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
