"use client";

// Ligas — ranking REAL (Fase 1) cuando hay sesión: clasificación global, semanal
// (jornada actual) y ligas privadas con código que agrupan managers de verdad
// (backend Supabase, /api/fantasy/*). Sin sesión, se muestra una previsualización
// simulada con bots y una invitación a iniciar sesión para competir de verdad.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPlayerById } from "@/lib/fantasy/players";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";
import {
  fetchLeaderboard,
  fetchMyLeagues,
  createServerLeague,
  joinServerLeague,
  fetchLeagueStandings,
  leaveServerLeague,
  renameServerLeague,
  kickServerMember,
  type FantasyLeague,
  type FantasyRankEntry,
  type FantasyLeagueStanding,
} from "./api";
import { useEntitlements } from "@/components/pro/EntitlementsProvider";
import { ProBadge } from "@/components/pro/ProBadge";
import { openProPaywall } from "@/lib/pro/paywall-client";

interface Props {
  team: FantasyTeamState;
  authed: boolean;
}

// ─── Simulación para invitados (preview) ─────────────────────────────────────
const BOT_NAMES = [
  "Tiki-Taka FC", "Los Underdogs", "Catenaccio XI", "Galácticos", "Búnker Azul", "Furia Roja", "Samba Stars",
  "Vikingos United", "Halcones del Sur", "Dinastía Dorada", "Panteras", "Tridente Mortal", "Muralla Verde",
  "Cometas", "Relámpago", "Los Profetas", "Tiburones", "Quetzales", "Dragones", "Centauros", "Albirroja Pro",
  "Joga Bonito", "El Búho Táctico", "Bestias Negras", "Reyes del Norte",
];
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
interface SimRow { name: string; points: number; you: boolean }
function simStandings(seed: number, size: number, spread: number, team: FantasyTeamState): SimRow[] {
  const rng = mulberry32(seed);
  const rows: SimRow[] = [{ name: team.teamName || "Mi Selección", points: team.totalPoints, you: true }];
  for (let i = 0; i < size; i++) {
    const offset = Math.round((rng() - 0.42) * spread + (team.totalPoints > 0 ? 0 : rng() * 30));
    rows.push({ name: BOT_NAMES[(seed + i * 2654435761) % BOT_NAMES.length], points: Math.max(0, team.totalPoints + offset), you: false });
  }
  rows.sort((a, b) => b.points - a.points || (a.you ? -1 : 1));
  return rows;
}

const inputStyle: React.CSSProperties = { background: BG3, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 13, fontWeight: 600, outline: "none" };

// ─── Iconos SVG (sustituyen a los emojis: trazos limpios, heredan currentColor) ─
type IconProps = { size?: number; color?: string };
const svg = (size: number, color: string | undefined, children: React.ReactNode): React.ReactNode => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, verticalAlign: "middle" }}>{children}</svg>
);
const IconGlobe = ({ size = 15, color }: IconProps) => svg(size, color, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></>);
const IconCalendar = ({ size = 15, color }: IconProps) => svg(size, color, <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>);
const IconLock = ({ size = 15, color }: IconProps) => svg(size, color, <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>);
const IconPlus = ({ size = 15, color }: IconProps) => svg(size, color, <><path d="M12 5v14M5 12h14" /></>);
const IconKey = ({ size = 15, color }: IconProps) => svg(size, color, <><circle cx="8" cy="15" r="5" /><path d="m11.5 11.5 8-8M17 7l2.5 2.5M14 4l3 3" /></>);
const IconCrown = ({ size = 15, color }: IconProps) => svg(size, color, <><path d="M3 7l4 5 5-7 5 7 4-5v11H3V7Z" /><path d="M3 18h18" /></>);
const IconTrophy = ({ size = 15, color }: IconProps) => svg(size, color, <><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 18h6M10 18v3M14 18v3" /></>);
const IconCopy = ({ size = 14, color }: IconProps) => svg(size, color, <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>);

export default function LeaguesView({ team, authed }: Props) {
  if (!authed) return <GuestPreview team={team} />;
  return <RealLeagues team={team} />;
}

// ─── Modo invitado: flujo de crear/unirse (lleva al login) + preview simulada ──
const LOGIN_HREF = "/login?next=/app/fantasy/jugar";
function GuestPreview({ team }: { team: FantasyTeamState }) {
  const rows = useMemo(() => simStandings(hashStr("global") ^ (team.gameweek * 2654435761), 14, 60, team), [team]);
  return (
    <div>
      <div style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}44`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: GOLD2, flex: 1, minWidth: 200 }}>
          Crea tu liga privada e invita a tus amigos con un código — unirse es gratis. Inicia sesión para competir de verdad.
        </span>
        <Link href={LOGIN_HREF} style={{ padding: "8px 16px", borderRadius: 9, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>Iniciar sesión</Link>
      </div>

      {/* Flujo visible de crear/unirse — aquí sólo redirige al login */}
      <div style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 16, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><IconPlus />Crear liga privada<ProBadge size={9} /></div>
          <input placeholder="Nombre de la liga" style={{ ...inputStyle, width: "100%", marginBottom: 8 }} />
          <Link href={LOGIN_HREF} style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "9px 12px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 13 }}>Crear y generar código</Link>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><IconKey />Unirse con código</div>
          <input placeholder="Código de 6 caracteres" style={{ ...inputStyle, width: "100%", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }} />
          <Link href={LOGIN_HREF} style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)", background: BG3, color: "#fff", fontWeight: 800, fontSize: 13 }}>Unirme a la liga</Link>
        </div>
      </div>

      <div style={{ fontSize: 12, color: DIM, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><IconGlobe size={14} color={DIM} />Vista previa · Liga Global</div>
      <SimTable rows={rows} />
    </div>
  );
}
function SimTable({ rows }: { rows: SimRow[] }) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: r.you ? `${GOLD}1c` : BG2, border: "1px solid " + (r.you ? GOLD : "rgba(255,255,255,0.05)"), borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 900, color: i === 0 ? GOLD2 : i < 3 ? "#fff" : DIM }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: r.you ? 900 : 700, color: r.you ? GOLD2 : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}{r.you && " (tú)"}</span>
            <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.points}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 12, textAlign: "center" }}>Clasificación simulada. Con sesión iniciada competirás contra managers reales.</div>
    </div>
  );
}

// ─── Modo real (con sesión) ──────────────────────────────────────────────────
type RealTab = "global" | "weekly" | string; // string = "code:<leagueId>"

function RealLeagues({ team }: { team: FantasyTeamState }) {
  const { isPro } = useEntitlements();
  const [active, setActive] = useState<RealTab>("global");
  const [leagues, setLeagues] = useState<FantasyLeague[]>([]);
  const [global, setGlobal] = useState<{ rankings: FantasyRankEntry[]; my: number | null } | null>(null);
  const [weekly, setWeekly] = useState<{ rankings: FantasyRankEntry[]; my: number | null } | null>(null);
  const [standings, setStandings] = useState<FantasyLeagueStanding[] | null>(null);
  const [leagueOwner, setLeagueOwner] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [leaguePeriod, setLeaguePeriod] = useState<"total" | "weekly">("total");
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // bloquea doble-clic en crear/unirse
  const [panel, setPanel] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDraft, setNewDraft] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "error" } | null>(null);
  const flash = useCallback((text: string, kind: "ok" | "error" = "ok") => setMsg({ text, kind }), []);

  // Última jornada CONFIRMADA (la que tiene puntos en el ranking semanal). Antes
  // se restaba 1 a team.gameweek, lo que en la jornada final mostraba la 7 en vez
  // de la 8. Tomamos el máximo gw del historial (0 → aún ninguna, cae a 1).
  const currentGw = Math.min(8, team.history.reduce((mx, h) => Math.max(mx, h.gw), 0) || 1);

  const reloadLeagues = useCallback(async () => { setLeagues(await fetchMyLeagues()); }, []);
  useEffect(() => { reloadLeagues(); }, [reloadLeagues]);

  // Carga del ranking activo.
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      if (active === "global") {
        const r = await fetchLeaderboard("tournament");
        if (!cancel) setGlobal({ rankings: r.rankings, my: r.my_position });
      } else if (active === "weekly") {
        const r = await fetchLeaderboard("weekly", currentGw);
        if (!cancel) setWeekly({ rankings: r.rankings, my: r.my_position });
      } else if (active.startsWith("code:")) {
        const id = active.slice(5);
        const r = await fetchLeagueStandings(id, leaguePeriod === "weekly" ? currentGw : undefined);
        if (!cancel) { setStandings(r.standings); setLeagueOwner(r.is_owner); setMe(r.me); }
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [active, currentGw, leaguePeriod]);

  const create = async () => {
    if (busy) return;
    // Crear ligas privadas es Pro: a un Free le abrimos el paywall directo en vez
    // de dejar que escriba el nombre y choque con el 403. Unirse (abajo) es libre.
    if (!isPro) { openProPaywall({ feature: "leagues_create" }); return; }
    const name = newName.trim();
    if (!name) { flash("Ponle nombre a tu liga.", "error"); return; }
    setBusy(true);
    const res = await createServerLeague(name, newDraft);
    setBusy(false);
    if (res.ok && res.league) {
      await reloadLeagues();
      setNewName(""); setNewDraft(false); setPanel(false); setActive("code:" + res.league.id);
      flash(`Liga ${res.league.is_draft ? "Draft " : ""}creada. Comparte el código ${res.league.code}.`, "ok");
    } else if (!res.proRequired) {
      // proRequired ya abrió el paywall; no duplicamos con un error rojo.
      flash(res.error === "draft_limit" ? "Solo puedes estar en una liga Draft a la vez." : "No se pudo crear la liga.", "error");
    }
  };
  const join = async () => {
    if (busy) return;
    const code = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (code.length !== 6) { flash("El código debe tener 6 caracteres.", "error"); return; }
    setBusy(true);
    const res = await joinServerLeague(code);
    setBusy(false);
    if (res.ok && res.league) {
      await reloadLeagues();
      setJoinCode(""); setPanel(false); setActive("code:" + res.league.id);
      if (res.conflicts?.length) {
        // Liga Draft: entró, pero parte de su plantilla ya tiene dueño aquí.
        const who = res.conflicts
          .map((c) => `${getPlayerById(c.player_id)?.name ?? c.player_id} (de ${c.held_by})`)
          .join(", ");
        flash(`Te uniste a ${res.league.name} (Draft). Ya tienen dueño: ${who}. Véndelos para poder cambiar tu equipo.`, "error");
      } else {
        flash(`Te uniste a ${res.league.name}.`, "ok");
      }
    } else {
      flash(
        res.error === "league_not_found" ? "No existe una liga con ese código."
          : res.error === "draft_limit" ? "Solo puedes estar en una liga Draft a la vez."
          : "No se pudo unir.",
        "error",
      );
    }
  };
  const leave = async (id: string, owner: boolean) => {
    if (owner && !confirm("Eres el dueño: salir BORRARÁ la liga para todos. ¿Continuar?")) return;
    const action = await leaveServerLeague(id);
    await reloadLeagues();
    if (active === "code:" + id) setActive("global");
    flash(action === "deleted" ? "Liga borrada." : "Has salido de la liga.", "ok");
  };
  const rename = async (id: string) => {
    const name = renameVal.trim();
    if (!name) { flash("Escribe un nombre.", "error"); return; }
    const ok = await renameServerLeague(id, name);
    if (ok) { await reloadLeagues(); setRenaming(false); flash("Liga renombrada.", "ok"); }
    else flash("No se pudo renombrar.", "error");
  };
  const kick = async (id: string, memberId: string, name: string) => {
    if (!confirm(`¿Expulsar a ${name} de la liga?`)) return;
    const ok = await kickServerMember(id, memberId);
    if (ok) { const r = await fetchLeagueStandings(id, leaguePeriod === "weekly" ? currentGw : undefined); setStandings(r.standings); flash(`${name} expulsado.`, "ok"); }
    else flash("No se pudo expulsar.", "error");
  };

  const activeLeague = active.startsWith("code:") ? leagues.find((l) => l.id === active.slice(5)) ?? null : null;
  const myId = active === "global" ? global?.my : active === "weekly" ? weekly?.my : null;

  const tabBtn = (id: string, label: string, icon: React.ReactNode) => (
    <button key={id} onClick={() => { setActive(id); setMsg(null); setRenaming(false); setLeaguePeriod("total"); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid " + (active === id ? GOLD : "rgba(255,255,255,0.12)"), background: active === id ? `${GOLD}22` : BG2, color: active === id ? GOLD2 : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
      {icon}{label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {tabBtn("global", "Global", <IconGlobe />)}
        {tabBtn("weekly", "Jornada", <IconCalendar />)}
        {leagues.map((lg) => tabBtn("code:" + lg.id, lg.name, <IconLock />))}
        <button onClick={() => { setPanel((v) => !v); setMsg(null); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px dashed " + (panel ? GOLD : "rgba(255,255,255,0.25)"), background: panel ? `${GOLD}18` : "transparent", color: panel ? GOLD2 : MID, fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}><IconPlus />Crear o unirse</button>
      </div>

      {panel && (
        <div style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 16, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><IconPlus />Crear liga privada{!isPro && <ProBadge size={9} />}</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la liga" style={{ ...inputStyle, width: "100%", marginBottom: 8 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: newDraft ? GOLD2 : MID, marginBottom: 4, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={newDraft} onChange={(e) => setNewDraft(e.target.checked)} style={{ accentColor: GOLD, width: 14, height: 14, cursor: "pointer" }} />
              <IconLock size={13} />Draft: jugadores exclusivos
            </label>
            <div style={{ fontSize: 11, color: DIM, lineHeight: 1.5, marginBottom: 8 }}>
              {newDraft
                ? "El primero que ficha a un jugador se lo queda: nadie más de la liga podrá tenerlo. Solo se puede estar en una liga Draft a la vez."
                : "Liga clásica: cada manager ficha con libertad (los equipos pueden repetir jugadores)."}
            </div>
            <button onClick={create} disabled={busy} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Creando…" : "Crear y generar código"}</button>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><IconKey />Unirse con código</div>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Código de 6 caracteres" style={{ ...inputStyle, width: "100%", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }} />
            <button onClick={join} disabled={busy} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)", background: BG3, color: "#fff", fontWeight: 800, fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Uniéndote…" : "Unirme a la liga"}</button>
          </div>
        </div>
      )}

      {msg && (
        <div style={{ background: `${msg.kind === "error" ? RED : GREEN}14`, border: `1px solid ${msg.kind === "error" ? RED : GREEN}44`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, fontWeight: 700, color: msg.kind === "error" ? "#fca5a5" : GREEN }}>{msg.text}</div>
      )}

      {activeLeague && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {renaming && leagueOwner ? (
            <>
              <input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} placeholder="Nuevo nombre" style={{ ...inputStyle, width: 180 }} />
              <button onClick={() => rename(activeLeague.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Guardar</button>
              <button onClick={() => setRenaming(false)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{activeLeague.name}</span>
              {activeLeague.is_draft && <span title="Jugadores exclusivos: si un manager tiene a un jugador, nadie más de la liga puede ficharlo." style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: GOLD2, border: `1px solid ${GOLD}66`, background: `${GOLD}1c`, borderRadius: 6, padding: "2px 7px" }}><IconLock size={11} />Draft</span>}
              {leagueOwner && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#060B14", background: GOLD2, borderRadius: 6, padding: "2px 7px" }}><IconCrown size={12} color="#060B14" />Dueño</span>}
              {leagueOwner && <button onClick={() => { setRenaming(true); setRenameVal(activeLeague.name); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Renombrar</button>}
            </>
          )}
          <span style={{ fontSize: 12, fontWeight: 800, color: GOLD2, background: `${GOLD}1c`, borderRadius: 8, padding: "4px 10px", letterSpacing: 2 }}>Código: {activeLeague.code}</span>
          <button onClick={() => { navigator.clipboard?.writeText(activeLeague.code); flash(`Código ${activeLeague.code} copiado.`, "ok"); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}><IconCopy />Copiar</button>
          <span style={{ fontSize: 12, color: MID }}>{activeLeague.member_count} managers</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => leave(activeLeague.id, leagueOwner)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${RED}55`, background: "transparent", color: "#fca5a5", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{leagueOwner ? "Borrar liga" : "Salir"}</button>
        </div>
      )}

      {activeLeague?.is_draft && (
        <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <IconLock size={12} color={DIM} />Liga Draft: cada jugador pertenece al primero que lo fichó. Los pillados aparecen bloqueados en el Mercado.
        </div>
      )}

      {activeLeague && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["total", "weekly"] as const).map((p) => (
            <button key={p} onClick={() => setLeaguePeriod(p)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid " + (leaguePeriod === p ? GOLD : "rgba(255,255,255,0.12)"), background: leaguePeriod === p ? `${GOLD}1c` : BG2, color: leaguePeriod === p ? GOLD2 : MID, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              {p === "total" ? <><IconTrophy size={13} />Total</> : <><IconCalendar size={13} />Jornada {currentGw}</>}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: MID, fontSize: 13 }}>Cargando ranking…</div>
      ) : active === "global" ? (
        <RealTable rows={global?.rankings ?? []} myPos={myId ?? null} desc="Clasificación global del torneo" />
      ) : active === "weekly" ? (
        <RealTable rows={weekly?.rankings ?? []} myPos={myId ?? null} desc={`Mejores de la jornada ${currentGw}`} />
      ) : (
        <LeagueTable rows={standings ?? []} me={me} canKick={leagueOwner} onKick={activeLeague ? (uid, name) => kick(activeLeague.id, uid, name) : undefined} />
      )}
    </div>
  );
}

function RealTable({ rows, myPos, desc }: { rows: FantasyRankEntry[]; myPos: number | null; desc: string }) {
  if (rows.length === 0) {
    return <div style={{ textAlign: "center", padding: 30, color: MID, fontSize: 13 }}>Aún no hay managers en este ranking. ¡Sé el primero al confirmar tu jornada!</div>;
  }
  return (
    <div>
      <div style={{ fontSize: 12, color: DIM, fontWeight: 700, marginBottom: 10 }}>{desc} · {rows.length} managers{myPos ? ` · tu posición: #${myPos}` : ""}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((r) => {
          const you = myPos != null && r.position === myPos;
          return (
            <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: you ? `${GOLD}1c` : BG2, border: "1px solid " + (you ? GOLD : "rgba(255,255,255,0.05)"), borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 900, color: r.position === 1 ? GOLD2 : r.position <= 3 ? "#fff" : DIM }}>{r.position}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: you ? 900 : 700, color: you ? GOLD2 : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.team_name}{you && " (tú)"}</div>
                <div style={{ fontSize: 11, color: MID }}>{r.display_name}</div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.points}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeagueTable({ rows, me, canKick, onKick }: { rows: FantasyLeagueStanding[]; me?: string | null; canKick?: boolean; onKick?: (uid: string, name: string) => void }) {
  if (rows.length === 0) {
    // Mensaje según rol: el dueño aún no tiene a nadie; a un miembro le decimos
    // que aún no hay clasificación (p.ej. si el dueño borró la liga).
    return <div style={{ textAlign: "center", padding: 30, color: MID, fontSize: 13 }}>{canKick ? "Comparte el código para que se unan tus amigos. La clasificación aparecerá aquí." : "Aún no hay clasificación en esta liga."}</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((r) => {
        const you = me != null && r.user_id === me;
        return (
          <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: you ? `${GOLD}1c` : BG2, border: "1px solid " + (you ? GOLD : "rgba(255,255,255,0.05)"), borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 900, color: r.position === 1 ? GOLD2 : r.position <= 3 ? "#fff" : DIM }}>{r.position}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: you ? 900 : 700, color: you ? GOLD2 : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 5 }}>{r.team_name}{you && " (tú)"}{r.is_owner && <IconCrown size={13} color={GOLD2} />}</div>
              <div style={{ fontSize: 11, color: MID }}>{r.display_name}</div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.points}</span>
            {canKick && !r.is_owner && onKick && (
              <button onClick={() => onKick(r.user_id, r.display_name)} title="Expulsar" style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${RED}55`, background: "transparent", color: "#fca5a5", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>Expulsar</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
