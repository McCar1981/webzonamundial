"use client";

// Ligas — ranking REAL (Fase 1) cuando hay sesión: clasificación global, semanal
// (jornada actual) y ligas privadas con código que agrupan managers de verdad
// (backend Supabase, /api/fantasy/*). Sin sesión, se muestra una previsualización
// simulada con bots y una invitación a iniciar sesión para competir de verdad.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";
import {
  fetchLeaderboard,
  fetchMyLeagues,
  createServerLeague,
  joinServerLeague,
  fetchLeagueStandings,
  leaveServerLeague,
  type FantasyLeague,
  type FantasyRankEntry,
  type FantasyLeagueStanding,
} from "./api";

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

export default function LeaguesView({ team, authed }: Props) {
  if (!authed) return <GuestPreview team={team} />;
  return <RealLeagues team={team} />;
}

// ─── Modo invitado: preview simulada + CTA de login ──────────────────────────
function GuestPreview({ team }: { team: FantasyTeamState }) {
  const rows = useMemo(() => simStandings(hashStr("global") ^ (team.gameweek * 2654435761), 14, 60, team), [team]);
  return (
    <div>
      <div style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}44`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: GOLD2, flex: 1, minWidth: 200 }}>
          Inicia sesión para competir en el ranking REAL y crear ligas privadas con tus amigos.
        </span>
        <Link href="/login?next=/app/fantasy/jugar" style={{ padding: "8px 16px", borderRadius: 9, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>Iniciar sesión</Link>
      </div>
      <div style={{ fontSize: 12, color: DIM, fontWeight: 700, marginBottom: 10 }}>Vista previa · Liga Global</div>
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
  const [active, setActive] = useState<RealTab>("global");
  const [leagues, setLeagues] = useState<FantasyLeague[]>([]);
  const [global, setGlobal] = useState<{ rankings: FantasyRankEntry[]; my: number | null } | null>(null);
  const [weekly, setWeekly] = useState<{ rankings: FantasyRankEntry[]; my: number | null } | null>(null);
  const [standings, setStandings] = useState<FantasyLeagueStanding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const currentGw = Math.max(1, team.gameweek - (team.history.length ? 1 : 0));

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
        const s = await fetchLeagueStandings(id);
        if (!cancel) setStandings(s);
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [active, currentGw]);

  const create = async () => {
    const name = newName.trim();
    if (!name) { setMsg("Ponle nombre a tu liga."); return; }
    const res = await createServerLeague(name);
    if (res.ok && res.league) {
      await reloadLeagues();
      setNewName(""); setPanel(false); setActive("code:" + res.league.id);
      setMsg(`Liga creada. Comparte el código ${res.league.code}.`);
    } else setMsg("No se pudo crear la liga.");
  };
  const join = async () => {
    const code = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (code.length !== 6) { setMsg("El código debe tener 6 caracteres."); return; }
    const res = await joinServerLeague(code);
    if (res.ok && res.league) {
      await reloadLeagues();
      setJoinCode(""); setPanel(false); setActive("code:" + res.league.id);
      setMsg(`Te uniste a ${res.league.name}.`);
    } else setMsg(res.error === "league_not_found" ? "No existe una liga con ese código." : "No se pudo unir.");
  };
  const leave = async (id: string) => {
    await leaveServerLeague(id);
    await reloadLeagues();
    if (active === "code:" + id) setActive("global");
    setMsg("Has salido de la liga.");
  };

  const activeLeague = active.startsWith("code:") ? leagues.find((l) => l.id === active.slice(5)) ?? null : null;
  const myId = active === "global" ? global?.my : active === "weekly" ? weekly?.my : null;

  const tabBtn = (id: string, label: string, icon: string) => (
    <button key={id} onClick={() => { setActive(id); setMsg(null); }} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid " + (active === id ? GOLD : "rgba(255,255,255,0.12)"), background: active === id ? `${GOLD}22` : BG2, color: active === id ? GOLD2 : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
      <span style={{ marginRight: 6 }}>{icon}</span>{label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {tabBtn("global", "Global", "🌍")}
        {tabBtn("weekly", "Jornada", "📅")}
        {leagues.map((lg) => tabBtn("code:" + lg.id, lg.name, "🔒"))}
        <button onClick={() => { setPanel((v) => !v); setMsg(null); }} style={{ padding: "8px 14px", borderRadius: 10, border: "1px dashed " + (panel ? GOLD : "rgba(255,255,255,0.25)"), background: panel ? `${GOLD}18` : "transparent", color: panel ? GOLD2 : MID, fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>＋ Liga con código</button>
      </div>

      {panel && (
        <div style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 16, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8 }}>🆕 Crear liga privada</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la liga" style={{ ...inputStyle, width: "100%", marginBottom: 8 }} />
            <button onClick={create} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Crear y generar código</button>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8 }}>🔑 Unirse con código</div>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Código de 6 caracteres" style={{ ...inputStyle, width: "100%", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }} />
            <button onClick={join} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)", background: BG3, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Unirme a la liga</button>
          </div>
        </div>
      )}

      {msg && <div style={{ background: `${GREEN}14`, border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, fontWeight: 700, color: GREEN }}>{msg}</div>}

      {activeLeague && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>{activeLeague.name}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: GOLD2, background: `${GOLD}1c`, borderRadius: 8, padding: "4px 10px", letterSpacing: 2 }}>Código: {activeLeague.code}</span>
          <button onClick={() => { navigator.clipboard?.writeText(activeLeague.code); setMsg(`Código ${activeLeague.code} copiado.`); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Copiar</button>
          <span style={{ fontSize: 12, color: MID }}>{activeLeague.member_count} managers</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => leave(activeLeague.id)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${RED}55`, background: "transparent", color: "#fca5a5", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Salir</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: MID, fontSize: 13 }}>Cargando ranking…</div>
      ) : active === "global" ? (
        <RealTable rows={global?.rankings ?? []} myPos={myId ?? null} desc="Clasificación global del torneo" />
      ) : active === "weekly" ? (
        <RealTable rows={weekly?.rankings ?? []} myPos={myId ?? null} desc={`Mejores de la jornada ${currentGw}`} />
      ) : (
        <LeagueTable rows={standings ?? []} />
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

function LeagueTable({ rows }: { rows: FantasyLeagueStanding[] }) {
  if (rows.length === 0) {
    return <div style={{ textAlign: "center", padding: 30, color: MID, fontSize: 13 }}>Comparte el código para que se unan tus amigos. La clasificación aparecerá aquí.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((r) => (
        <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: BG2, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px" }}>
          <span style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 900, color: r.position === 1 ? GOLD2 : r.position <= 3 ? "#fff" : DIM }}>{r.position}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.team_name}</div>
            <div style={{ fontSize: 11, color: MID }}>{r.display_name}</div>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.points}</span>
        </div>
      ))}
    </div>
  );
}
