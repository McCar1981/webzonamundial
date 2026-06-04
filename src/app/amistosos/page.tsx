// src/app/amistosos/page.tsx
//
// Amistosos de selecciones EN VIVO. Lista (en vivo / próximos / finalizados) con
// auto-refresco, vista de detalle con timeline de eventos y alineaciones, y un
// botón para activar las notificaciones push de la categoría "amistosos".
//
// Toda la información llega de api-football vía /api/friendlies. No usa logos
// protegidos: solo los escudos/banderas que sirve la propia API.

"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToPush, getNotificationPermission } from "@/lib/push-client";
import type {
  FriendlyEvent,
  FriendlyFixture,
  FriendlyLineup,
  FriendlySnapshot,
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
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
          {lineup.starters.map((p, i) => (
            <li key={i} style={{ color: OFF, fontSize: 13, display: "flex", gap: 8 }}>
              <span style={{ color: GRAY, width: 22, textAlign: "right", flexShrink: 0 }}>{p.num ?? "·"}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name ?? "—"}</span>
            </li>
          ))}
          {lineup.coach && (
            <li style={{ color: GRAY, fontSize: 12, marginTop: 4 }}>DT: {lineup.coach}</li>
          )}
        </ul>
      )}
    </div>
  );
}

function DetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const [snap, setSnap] = useState<FriendlySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

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
    const t = setInterval(load, 25_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div>
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

          {snap.events.length > 0 && (
            <section style={{ marginBottom: 18 }}>
              <h3 style={{ color: OFF, fontSize: 16, marginBottom: 10 }}>Sucesos del partido</h3>
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
            </section>
          )}

          <section>
            <h3 style={{ color: OFF, fontSize: 16, marginBottom: 10 }}>Alineaciones</h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <LineupCol title={snap.home.name} lineup={snap.homeLineup} />
              <LineupCol title={snap.away.name} lineup={snap.awayLineup} />
            </div>
          </section>
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
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (getNotificationPermission() === "granted") setPushState("on");
  }, []);

  async function enablePush() {
    setPushState("loading");
    const sub = await subscribeToPush({ kinds: ["amistosos"] });
    setPushState(sub ? "on" : "denied");
  }

  return (
    <main style={{ background: BG, minHeight: "100vh", color: OFF }}>
      <style>{`@keyframes zmPulse{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 64px" }}>
        {openId != null ? (
          <DetailView id={openId} onBack={() => setOpenId(null)} />
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

            <Section title="En vivo" items={data?.live ?? []} onOpen={setOpenId} emptyText="No hay amistosos en juego ahora mismo." />
            <Section title="Próximos" items={data?.upcoming ?? []} onOpen={setOpenId} emptyText="Sin amistosos próximos en las próximas horas." />
            <Section title="Finalizados hoy" items={data?.finished ?? []} onOpen={setOpenId} emptyText={null} />
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
