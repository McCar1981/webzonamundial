// src/app/amistosos/page.tsx
//
// Amistosos de selecciones EN VIVO. Lista (en vivo / próximos / finalizados) con
// auto-refresco, vista de detalle con timeline de eventos y alineaciones, y un
// botón para activar las notificaciones push de la categoría "amistosos".
//
// Toda la información llega de api-football vía /api/friendlies. No usa logos
// protegidos: solo los escudos/banderas que sirve la propia API.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { subscribeToPush, getNotificationPermission } from "@/lib/push-client";
import type {
  FriendlyEvent,
  FriendlyFixture,
  FriendlyLineup,
  FriendlyLineupPlayer,
  FriendlySnapshot,
  FriendlyStat,
  FriendlyTeam,
} from "@/lib/friendlies/types";
import { isFinishedStatus, isLiveStatus } from "@/lib/friendlies/types";

const BG = "#060B14";
const PANEL = "#0B1A2D";
const GOLD = "#E6C85C";
const BLUE = "#2F80FF";
const OFF = "#F4F6FA";
const GRAY = "#8E9AB3";

interface ListResponse {
  live: FriendlyFixture[];
  upcoming: FriendlyFixture[];
  finished: FriendlyFixture[];
}

// ───────────────────────── helpers ─────────────────────────

function kickoffLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(f: FriendlyFixture): string {
  if (isLiveStatus(f.status)) {
    if (f.status === "HT") return "Descanso";
    return f.elapsed != null ? `${f.elapsed}'` : "En juego";
  }
  if (isFinishedStatus(f.status)) return "Final";
  if (f.status === "PST") return "Aplazado";
  if (f.status === "CANC") return "Cancelado";
  return kickoffLabel(f.date);
}

// ───────────────────────── iconos inline (SVG, sin emojis) ─────────────────────────

function Icon({ path, color = OFF, size = 18 }: { path: string; color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const ICON = {
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  ball: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8l4 3-1.5 4.5h-5L8 11z",
  card: "M6 3h12a1 1 0 0 1 1 1v16l-7-3-7 3V4a1 1 0 0 1 1-1z",
  swap: "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
  back: "M19 12H5m0 0l7 7m-7-7l7-7",
};

function eventColor(t: FriendlyEvent["type"]): string {
  if (t === "goal" || t === "penalty_goal" || t === "own_goal") return GOLD;
  if (t === "red" || t === "second_yellow") return "#E5484D";
  if (t === "yellow") return "#E6C85C";
  return GRAY;
}

function eventText(e: FriendlyEvent): string {
  const who = e.player ?? "";
  switch (e.type) {
    case "goal":
      return `Gol${who ? ` — ${who}` : ""}${e.assist ? ` (asist. ${e.assist})` : ""}`;
    case "penalty_goal":
      return `Gol de penalti${who ? ` — ${who}` : ""}`;
    case "own_goal":
      return `Gol en propia${who ? ` — ${who}` : ""}`;
    case "penalty_miss":
      return `Penalti fallado${who ? ` — ${who}` : ""}`;
    case "yellow":
      return `Amarilla${who ? ` — ${who}` : ""}`;
    case "red":
      return `Roja${who ? ` — ${who}` : ""}`;
    case "second_yellow":
      return `2ª amarilla → roja${who ? ` — ${who}` : ""}`;
    case "sub":
      return `Cambio${e.playerIn ? `: entra ${e.playerIn}` : ""}${who ? `, sale ${who}` : ""}`;
    case "var":
      return `VAR${e.detail ? ` — ${e.detail}` : ""}`;
    default:
      return e.detail ?? "Evento";
  }
}

// ───────────────────────── tarjeta de partido ─────────────────────────

function TeamRow({ name, logo, goals }: { name: string; logo: string; goals: number | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" width={26} height={26} style={{ borderRadius: 4, flexShrink: 0 }} />
      <span style={{ color: OFF, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      <span style={{ marginLeft: "auto", color: GOLD, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
        {goals ?? "-"}
      </span>
    </div>
  );
}

function FixtureCard({
  f,
  onOpen,
}: {
  f: FriendlyFixture;
  onOpen?: (id: number) => void;
}) {
  const live = isLiveStatus(f.status);
  return (
    <button
      type="button"
      onClick={onOpen ? () => onOpen(f.fixtureId) : undefined}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: PANEL,
        border: `1px solid ${live ? "rgba(47,128,255,0.5)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 14,
        padding: 14,
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: live ? BLUE : GRAY,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {live && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#E5484D",
                display: "inline-block",
                animation: "zmPulse 1.2s ease-in-out infinite",
              }}
            />
          )}
          {statusLabel(f)}
        </span>
        {f.venue && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: GRAY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
            {f.venue}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <TeamRow name={f.home.name} logo={f.home.logo} goals={f.goals[0]} />
        <TeamRow name={f.away.name} logo={f.away.logo} goals={f.goals[1]} />
      </div>
    </button>
  );
}

// ───────────────────────── detalle (eventos + alineaciones) ─────────────────────────

function PlayerRow({ p }: { p: FriendlyLineupPlayer }) {
  return (
    <li style={{ color: OFF, fontSize: 13, display: "flex", gap: 8 }}>
      <span style={{ color: GRAY, width: 22, textAlign: "right", flexShrink: 0 }}>{p.num ?? "·"}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name ?? "—"}</span>
      {p.pos && <span style={{ color: GRAY, fontSize: 11, marginLeft: "auto" }}>{p.pos}</span>}
    </li>
  );
}

function LineupCol({ title, lineup }: { title: string; lineup: FriendlyLineup | null }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        {title}
        {lineup?.formation ? <span style={{ color: GRAY, fontWeight: 500 }}> · {lineup.formation}</span> : null}
      </div>
      {!lineup ? (
        <p style={{ color: GRAY, fontSize: 13 }}>Sin alineación todavía.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
            {lineup.starters.map((p, i) => (
              <PlayerRow key={i} p={p} />
            ))}
          </ul>
          {lineup.substitutes.length > 0 && (
            <>
              <div style={{ color: GRAY, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0 6px" }}>
                Suplentes
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
                {lineup.substitutes.map((p, i) => (
                  <PlayerRow key={i} p={p} />
                ))}
              </ul>
            </>
          )}
          {lineup.coach && (
            <div style={{ color: GRAY, fontSize: 12, marginTop: 8 }}>DT: {lineup.coach}</div>
          )}
        </>
      )}
    </div>
  );
}

/** Una fila de estadística con barra comparativa local vs visitante. */
function StatRow({ s }: { s: FriendlyStat }) {
  const toNum = (v: number | string | null): number => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const n = parseFloat(v.replace("%", ""));
    return Number.isFinite(n) ? n : 0;
  };
  const h = toNum(s.home);
  const a = toNum(s.away);
  const total = h + a;
  const hPct = total > 0 ? (h / total) * 100 : 50;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: OFF, fontWeight: 600 }}>{s.home ?? "-"}</span>
        <span style={{ color: GRAY }}>{s.label}</span>
        <span style={{ color: OFF, fontWeight: 600 }}>{s.away ?? "-"}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${hPct}%`, background: BLUE }} />
        <div style={{ width: `${100 - hPct}%`, background: GOLD }} />
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
      <span style={{ color: GRAY, minWidth: 78 }}>{label}</span>
      <span style={{ color: OFF, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}

interface GoalCeleb {
  team: FriendlyTeam;
  player?: string;
  own: boolean;
  key: number;
}

/** Celebración a pantalla completa cuando cae un gol (overlay sobre el detalle). */
function GoalCelebration({ celeb }: { celeb: GoalCeleb }) {
  const confetti = useMemo(() => {
    const palette = [GOLD, OFF, BLUE, "#ffffff", "#22c55e", "#ff5a8a"];
    return Array.from({ length: 48 }).map((_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 40;
      return {
        id: i,
        tx: Math.cos(ang) * dist,
        ty: Math.sin(ang) * dist + 20,
        rot: Math.random() * 720 - 360,
        color: palette[i % palette.length],
        dur: 1.8 + Math.random() * 1.4,
        delay: Math.random() * 0.2,
        w: 7 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        round: Math.random() < 0.4,
      };
    });
  }, [celeb.key]);

  return (
    <div
      key={celeb.key}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", overflow: "hidden" }}
    >
      <div className="zm-goal-flash" />
      {confetti.map((c) => (
        <span
          key={c.id}
          className="zm-conf"
          style={{
            background: c.color,
            width: c.w,
            height: c.h,
            borderRadius: c.round ? "50%" : 2,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
            ["--tx" as string]: `${c.tx}vw`,
            ["--ty" as string]: `${c.ty}vh`,
            ["--r" as string]: `${c.rot}deg`,
          }}
        />
      ))}
      <div className="zm-goal-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={celeb.team.logo} alt="" width={72} height={72} style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,.6))" }} />
        <div className="zm-goal-word">¡GOL!</div>
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 2 }}>
          <span style={{ color: GOLD, fontWeight: 900, fontSize: "clamp(16px,4vw,24px)", textTransform: "uppercase", letterSpacing: 1 }}>
            {celeb.team.name}
          </span>
          {celeb.player && (
            <span style={{ color: OFF, fontWeight: 700, fontSize: "clamp(14px,3vw,18px)" }}>
              {celeb.player}
              {celeb.own ? " (p.p.)" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const [snap, setSnap] = useState<FriendlySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalCeleb, setGoalCeleb] = useState<GoalCeleb | null>(null);
  const [tab, setTab] = useState<"crono" | "lineups" | "stats">("crono");
  const prevGoalsRef = useRef<{ h: number; a: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/friendlies/${id}`, { cache: "no-store" });
      if (r.ok) setSnap((await r.json()) as FriendlySnapshot);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 12_000);
    return () => clearInterval(t);
  }, [load]);

  // Detecta goles nuevos comparando el marcador entre snapshots y dispara la
  // celebración. En la primera carga solo memoriza (no celebra goles previos).
  useEffect(() => {
    if (!snap) return;
    const h = snap.goals[0] ?? 0;
    const a = snap.goals[1] ?? 0;
    const prev = prevGoalsRef.current;
    prevGoalsRef.current = { h, a };
    if (!prev) return;
    const scoredHome = h > prev.h;
    const scoredAway = a > prev.a;
    if (!scoredHome && !scoredAway) return;
    const benef: "home" | "away" = scoredHome ? "home" : "away";
    const goalEvents = snap.events.filter(
      (e) => e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal",
    );
    const last = [...goalEvents].reverse().find((e) => {
      const b = e.type === "own_goal" ? (e.side === "home" ? "away" : "home") : e.side;
      return b === benef;
    });
    setGoalCeleb({
      team: benef === "home" ? snap.home : snap.away,
      player: last?.player,
      own: last?.type === "own_goal",
      key: Date.now(),
    });
  }, [snap]);

  // Auto-cierre de la celebración.
  useEffect(() => {
    if (!goalCeleb) return;
    const t = setTimeout(() => setGoalCeleb(null), 4200);
    return () => clearTimeout(t);
  }, [goalCeleb]);

  return (
    <div>
      {goalCeleb && <GoalCelebration celeb={goalCeleb} />}
      <button
        type="button"
        onClick={onBack}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: BLUE, cursor: "pointer", fontWeight: 600, marginBottom: 16, padding: 0 }}
      >
        <Icon path={ICON.back} color={BLUE} size={18} /> Volver
      </button>

      {loading && !snap ? (
        <p style={{ color: GRAY }}>Cargando…</p>
      ) : !snap ? (
        <p style={{ color: GRAY }}>No se pudo cargar el partido.</p>
      ) : (
        <>
          <div style={{ background: PANEL, borderRadius: 16, padding: 18, marginBottom: 18, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ textAlign: "center", color: isLiveStatus(snap.status) ? BLUE : GRAY, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              {statusLabel(snap)}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snap.home.logo} alt="" width={48} height={48} />
                <span style={{ color: OFF, fontWeight: 600, fontSize: 13, textAlign: "center" }}>{snap.home.name}</span>
              </div>
              <div style={{ color: GOLD, fontWeight: 900, fontSize: 36, fontVariantNumeric: "tabular-nums" }}>
                {snap.goals[0] ?? 0} - {snap.goals[1] ?? 0}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snap.away.logo} alt="" width={48} height={48} />
                <span style={{ color: OFF, fontWeight: 600, fontSize: 13, textAlign: "center" }}>{snap.away.name}</span>
              </div>
            </div>
          </div>

          <section style={{ background: PANEL, borderRadius: 14, padding: 16, marginBottom: 18, border: "1px solid rgba(255,255,255,0.06)", display: "grid", gap: 6 }}>
            <InfoLine label="Competición" value={snap.league.name} />
            <InfoLine label="Fecha" value={kickoffLabel(snap.date)} />
            {snap.venue && <InfoLine label="Estadio" value={snap.venue} />}
            {snap.city && <InfoLine label="Ciudad" value={snap.city} />}
            {snap.referee && <InfoLine label="Árbitro" value={snap.referee} />}
          </section>

          {/* Pestañas: Cronología · Alineaciones · Estadísticas */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 18 }}>
            {([
              ["crono", "Cronología"],
              ["lineups", "Alineaciones"],
              ["stats", "Estadísticas"],
            ] as const).map(([key, label]) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${active ? GOLD : "transparent"}`,
                    color: active ? OFF : GRAY,
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    padding: "12px 4px",
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === "crono" && (
            <section>
              {snap.events.length === 0 ? (
                <p style={{ color: GRAY, fontSize: 14 }}>Sin sucesos todavía.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {snap.events.map((e) => (
                    <li
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: PANEL,
                        borderRadius: 10,
                        padding: "8px 12px",
                        borderLeft: `3px solid ${eventColor(e.type)}`,
                      }}
                    >
                      <span style={{ color: GOLD, fontWeight: 700, width: 38, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                        {e.minute}&apos;{e.extra ? `+${e.extra}` : ""}
                      </span>
                      <span style={{ color: OFF, fontSize: 13 }}>{eventText(e)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "lineups" && (
            <section>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <LineupCol title={snap.home.name} lineup={snap.homeLineup} />
                <LineupCol title={snap.away.name} lineup={snap.awayLineup} />
              </div>
            </section>
          )}

          {tab === "stats" && (
            <section>
              {snap.stats.length === 0 ? (
                <p style={{ color: GRAY, fontSize: 14 }}>Sin estadísticas todavía.</p>
              ) : (
                <div style={{ background: PANEL, borderRadius: 14, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                  {snap.stats.map((s) => (
                    <StatRow key={s.label} s={s} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ───────────────────────── página ─────────────────────────

export default function AmistososPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [pushState, setPushState] = useState<"idle" | "on" | "denied" | "loading">("idle");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/friendlies", { cache: "no-store" });
      if (r.ok) setData((await r.json()) as ListResponse);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  // Deep-link: si llegamos con ?match=<fixtureId> (p.ej. desde un push), abrimos
  // directamente el detalle de ese partido en vez de la lista.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = new URLSearchParams(window.location.search).get("match");
    if (!m) return;
    const id = parseInt(m, 10);
    if (Number.isInteger(id)) setOpenId(id);
  }, []);

  // Si el navegador ya tiene permiso DENEGADO, lo reflejamos. No marcamos
  // "on" solo por tener permiso: tener permiso (p.ej. por las noticias) no
  // significa estar suscrito a la categoría "amistosos". El usuario debe pulsar
  // para registrar la suscripción de amistosos.
  useEffect(() => {
    if (getNotificationPermission() === "denied") setPushState("denied");
  }, []);

  async function enablePush() {
    setPushState("loading");
    try {
      const sub = await subscribeToPush({ kinds: ["amistosos"] });
      setPushState(sub ? "on" : "denied");
    } catch {
      setPushState("denied");
    }
  }

  function openMatch(matchId: number) {
    setOpenId(matchId);
    // Al venir desde una tarjeta que puede estar al final de la lista, el
    // scroll se queda abajo (footer). Subimos arriba para ver el detalle.
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <main style={{ background: BG, minHeight: "100vh", color: OFF }}>
      <style>{`@keyframes zmPulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes zmGoalFlash{0%{opacity:.9}40%{opacity:0}60%{opacity:.4}100%{opacity:0}}
@keyframes zmGoalIn{0%{transform:scale(.4) rotate(-6deg);opacity:0}60%{transform:scale(1.12) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes zmGoalShine{0%{background-position:0 0}100%{background-position:280% 0}}
@keyframes zmConf{0%{opacity:1;transform:translate(-50%,-50%) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) rotate(var(--r))}}
.zm-goal-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.9),rgba(230,200,92,.45) 35%,rgba(0,0,0,0) 70%);animation:zmGoalFlash 1s ease forwards}
.zm-conf{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);opacity:0;animation-name:zmConf;animation-timing-function:cubic-bezier(.15,.7,.3,1);animation-fill-mode:forwards}
.zm-goal-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;animation:zmGoalIn .6s cubic-bezier(.2,1.5,.35,1) both}
.zm-goal-word{font-weight:900;letter-spacing:3px;line-height:.9;font-size:clamp(56px,16vw,140px);background:linear-gradient(100deg,#e8d48b,#fff 20%,#E6C85C 40%,#fff 60%,#e8d48b 82%);background-size:280% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;filter:drop-shadow(0 8px 20px rgba(0,0,0,.6));animation:zmGoalShine 1.8s linear infinite}
@media (prefers-reduced-motion: reduce){.zm-conf,.zm-goal-word{animation-duration:.01s!important}}`}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 64px" }}>
        {openId != null ? (
          <DetailView
            id={openId}
            onBack={() => {
              setOpenId(null);
              if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
            }}
          />
        ) : (
          <>
            <header style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: OFF }}>
                Amistosos de selecciones
              </h1>
              <p style={{ color: GRAY, marginTop: 6 }}>
                Resultados en vivo, goles, alineaciones y sucesos minuto a minuto.
              </p>
              <button
                type="button"
                onClick={enablePush}
                disabled={pushState === "on" || pushState === "loading"}
                style={{
                  marginTop: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: pushState === "on" ? "transparent" : GOLD,
                  color: pushState === "on" ? GRAY : "#0A0F1A",
                  border: pushState === "on" ? `1px solid ${GRAY}` : "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: pushState === "on" ? "default" : "pointer",
                }}
              >
                <Icon path={ICON.bell} color={pushState === "on" ? GRAY : "#0A0F1A"} size={16} />
                {pushState === "on"
                  ? "Avisos activados"
                  : pushState === "loading"
                  ? "Activando…"
                  : pushState === "denied"
                  ? "Permiso denegado"
                  : "Avisarme de goles y novedades"}
              </button>
            </header>

            <Section title="En vivo" items={data?.live ?? []} onOpen={openMatch} emptyText="No hay amistosos en juego ahora mismo." />
            <Section title="Próximos" items={data?.upcoming ?? []} onOpen={openMatch} emptyText="Sin amistosos próximos en las próximas horas." />
            <Section title="Finalizados hoy" items={data?.finished ?? []} onOpen={openMatch} emptyText={null} />
          </>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  items,
  onOpen,
  emptyText,
}: {
  title: string;
  items: FriendlyFixture[];
  onOpen: (id: number) => void;
  emptyText: string | null;
}) {
  if (items.length === 0 && emptyText === null) return null;
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: OFF, marginBottom: 12 }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ color: GRAY, fontSize: 14 }}>{emptyText}</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((f) => (
            <FixtureCard key={f.fixtureId} f={f} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
