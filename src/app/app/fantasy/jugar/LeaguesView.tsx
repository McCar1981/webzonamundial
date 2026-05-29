"use client";

// Ligas — clasificaciones simuladas (global, creadores, H2H) y ligas privadas
// con CÓDIGO: el usuario crea o se une a una liga por código y la clasificación
// se genera de forma DETERMINISTA a partir de ese código (mismos rivales y
// puntos siempre). No hay backend: los rivales son bots estables y las ligas a
// las que se une el usuario se guardan en localStorage.

import { useEffect, useMemo, useState } from "react";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";

interface Props {
  team: FantasyTeamState;
}

const LKEY = "zm-fantasy-leagues:v1";

interface SavedLeague { code: string; name: string }

const BUILTINS: { id: string; label: string; icon: string; desc: string; size: number; spread: number }[] = [
  { id: "global", label: "Liga Global", icon: "🌍", desc: "Todos los managers del mundo", size: 14, spread: 60 },
  { id: "creator", label: "Liga Creadores", icon: "🎬", desc: "Reta a los streamers del torneo", size: 10, spread: 45 },
  { id: "h2h", label: "Head-to-Head", icon: "⚔️", desc: "Duelo directo por jornada", size: 0, spread: 0 },
];

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

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(): string {
  let c = "";
  for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}
function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function leagueNameFromCode(code: string): string {
  const seed = hashStr("ln:" + code);
  return `Liga ${BOT_NAMES[seed % BOT_NAMES.length]}`;
}

interface Row { name: string; points: number; you: boolean }

function buildStandings(seed: number, size: number, spread: number, team: FantasyTeamState): Row[] {
  const rng = mulberry32(seed);
  const rows: Row[] = [{ name: team.teamName || "Mi Selección", points: team.totalPoints, you: true }];
  for (let i = 0; i < size; i++) {
    const offset = Math.round((rng() - 0.42) * spread + (team.totalPoints > 0 ? 0 : rng() * 30));
    const pts = Math.max(0, team.totalPoints + offset);
    rows.push({ name: BOT_NAMES[(seed + i * 2654435761) % BOT_NAMES.length], points: pts, you: false });
  }
  rows.sort((a, b) => b.points - a.points || (a.you ? -1 : 1));
  return rows;
}

export default function LeaguesView({ team }: Props) {
  const [active, setActive] = useState<string>("global");
  const [leagues, setLeagues] = useState<SavedLeague[]>([]);
  const [panel, setPanel] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LKEY);
      if (raw) setLeagues(JSON.parse(raw) as SavedLeague[]);
    } catch { /* ignore */ }
  }, []);

  const persist = (next: SavedLeague[]) => {
    setLeagues(next);
    try { window.localStorage.setItem(LKEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const createLeague = () => {
    const code = randomCode();
    const name = newName.trim().slice(0, 32) || leagueNameFromCode(code);
    persist([...leagues, { code, name }]);
    setNewName("");
    setActive("code:" + code);
    setPanel(false);
    setMsg(`Liga creada. Comparte el código ${code} con tus amigos.`);
  };

  const joinLeague = () => {
    const code = normalizeCode(joinCode);
    if (code.length !== 6) { setMsg("El código debe tener 6 caracteres."); return; }
    if (leagues.find((l) => l.code === code)) { setMsg("Ya estás en esa liga."); setActive("code:" + code); setPanel(false); return; }
    persist([...leagues, { code, name: leagueNameFromCode(code) }]);
    setJoinCode("");
    setActive("code:" + code);
    setPanel(false);
    setMsg(`Te uniste a la liga ${code}.`);
  };

  const leaveLeague = (code: string) => {
    persist(leagues.filter((l) => l.code !== code));
    if (active === "code:" + code) setActive("global");
  };

  const activeCode = active.startsWith("code:") ? active.slice(5) : null;
  const activeLeague = activeCode ? leagues.find((l) => l.code === activeCode) : null;

  const standings = useMemo<Row[] | null>(() => {
    if (active === "h2h") return null;
    const b = BUILTINS.find((x) => x.id === active);
    if (b) return buildStandings(hashStr(b.id) ^ (team.gameweek * 2654435761), b.size, b.spread, team);
    if (activeLeague) {
      const seed = hashStr(activeLeague.code) ^ (team.gameweek * 2654435761);
      const size = 6 + (hashStr(activeLeague.code) % 7); // 6..12
      return buildStandings(seed, size, 30, team);
    }
    return null;
  }, [active, activeLeague, team]);

  const h2h = useMemo(() => {
    const rng = mulberry32(hashStr("h2h:" + team.gameweek));
    const rivalName = BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)];
    const last = team.history[team.history.length - 1];
    const youGw = last?.points ?? 0;
    const rivalGw = Math.max(0, Math.round(youGw + (rng() - 0.5) * 36));
    return { rivalName, youGw, rivalGw };
  }, [team.gameweek, team.history]);

  const tabBtn = (id: string, label: string, icon: string) => (
    <button key={id} onClick={() => { setActive(id); setMsg(null); }} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid " + (active === id ? GOLD : "rgba(255,255,255,0.12)"), background: active === id ? `${GOLD}22` : BG2, color: active === id ? GOLD2 : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
      <span style={{ marginRight: 6 }}>{icon}</span>{label}
    </button>
  );

  const inputStyle: React.CSSProperties = { background: BG3, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 13, fontWeight: 600, outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {BUILTINS.map((lg) => tabBtn(lg.id, lg.label, lg.icon))}
        {leagues.map((lg) => tabBtn("code:" + lg.code, lg.name, "🔒"))}
        <button onClick={() => { setPanel((v) => !v); setMsg(null); }} style={{ padding: "8px 14px", borderRadius: 10, border: "1px dashed " + (panel ? GOLD : "rgba(255,255,255,0.25)"), background: panel ? `${GOLD}18` : "transparent", color: panel ? GOLD2 : MID, fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>＋ Liga con código</button>
      </div>

      {panel && (
        <div style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 16, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8 }}>🆕 Crear liga privada</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la liga (opcional)" style={{ ...inputStyle, width: "100%", marginBottom: 8 }} />
            <button onClick={createLeague} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#060B14", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Crear y generar código</button>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 8 }}>🔑 Unirse con código</div>
            <input value={joinCode} onChange={(e) => setJoinCode(normalizeCode(e.target.value))} placeholder="Código de 6 caracteres" style={{ ...inputStyle, width: "100%", marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }} />
            <button onClick={joinLeague} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)", background: BG3, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Unirme a la liga</button>
          </div>
        </div>
      )}

      {msg && <div style={{ background: `${GREEN}14`, border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, fontWeight: 700, color: GREEN }}>{msg}</div>}

      {activeLeague && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>{activeLeague.name}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: GOLD2, background: `${GOLD}1c`, borderRadius: 8, padding: "4px 10px", letterSpacing: 2 }}>Código: {activeLeague.code}</span>
          <button onClick={() => { navigator.clipboard?.writeText(activeLeague.code); setMsg(`Código ${activeLeague.code} copiado.`); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Copiar</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => leaveLeague(activeLeague.code)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${RED}55`, background: "transparent", color: "#fca5a5", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Salir</button>
        </div>
      )}

      {active === "h2h" ? (
        <div style={{ background: BG2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Duelo · Jornada {Math.max(1, team.gameweek - (team.history.length ? 1 : 0))}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{team.teamName || "Mi Selección"}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: h2h.youGw >= h2h.rivalGw ? GREEN : "#fff" }}>{h2h.youGw}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: GOLD2 }}>VS</div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{h2h.rivalName}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: h2h.rivalGw > h2h.youGw ? RED : "#fff" }}>{h2h.rivalGw}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: h2h.youGw > h2h.rivalGw ? GREEN : h2h.youGw < h2h.rivalGw ? RED : MID }}>
            {team.history.length === 0 ? "Juega tu primera jornada en «En Vivo» para puntuar el duelo." : h2h.youGw > h2h.rivalGw ? "🏆 ¡Victoria!" : h2h.youGw < h2h.rivalGw ? "Derrota — a remontar la próxima." : "Empate técnico."}
          </div>
        </div>
      ) : standings ? (
        <Table rows={standings} desc={activeLeague ? "Liga privada" : BUILTINS.find((l) => l.id === active)!.desc} />
      ) : null}
    </div>
  );
}

function Table({ rows, desc }: { rows: Row[]; desc: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: DIM, fontWeight: 700, marginBottom: 10 }}>{desc} · {rows.length} managers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: r.you ? `${GOLD}1c` : BG2, border: "1px solid " + (r.you ? GOLD : "rgba(255,255,255,0.05)"), borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 900, color: i === 0 ? GOLD2 : i < 3 ? "#fff" : DIM }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: r.you ? 900 : 700, color: r.you ? GOLD2 : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name}{r.you && " (tú)"}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.points}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 12, textAlign: "center" }}>Clasificación simulada para previsualizar las ligas. En el torneo serán managers reales.</div>
    </div>
  );
}
