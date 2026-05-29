"use client";

// Ligas — clasificaciones simuladas (global, creadores, privada y H2H) generadas
// de forma DETERMINISTA alrededor de los puntos totales del usuario. No hay
// backend: los rivales son bots estables para previsualizar la experiencia.

import { useMemo, useState } from "react";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";

interface Props {
  team: FantasyTeamState;
}

type LeagueId = "global" | "creator" | "private" | "h2h";

const LEAGUES: { id: LeagueId; label: string; icon: string; desc: string; size: number; spread: number }[] = [
  { id: "global", label: "Liga Global", icon: "🌍", desc: "Todos los managers del mundo", size: 14, spread: 60 },
  { id: "creator", label: "Liga Creadores", icon: "🎬", desc: "Reta a los streamers del torneo", size: 10, spread: 45 },
  { id: "private", label: "Mi Liga Privada", icon: "🔒", desc: "Amigos y rivales de siempre", size: 8, spread: 28 },
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

interface Row { name: string; points: number; you: boolean }

export default function LeaguesView({ team }: Props) {
  const [active, setActive] = useState<LeagueId>("global");

  const standings = useMemo<Record<Exclude<LeagueId, "h2h">, Row[]>>(() => {
    const out = {} as Record<Exclude<LeagueId, "h2h">, Row[]>;
    for (const lg of LEAGUES) {
      if (lg.id === "h2h") continue;
      const rng = mulberry32(hashStr(lg.id) ^ (team.gameweek * 2654435761));
      const rows: Row[] = [{ name: team.teamName || "Mi Selección", points: team.totalPoints, you: true }];
      for (let i = 0; i < lg.size; i++) {
        const offset = Math.round((rng() - 0.42) * lg.spread + (team.totalPoints > 0 ? 0 : rng() * 30));
        const pts = Math.max(0, team.totalPoints + offset);
        rows.push({ name: BOT_NAMES[(hashStr(lg.id + i) % BOT_NAMES.length)], points: pts, you: false });
      }
      rows.sort((a, b) => b.points - a.points || (a.you ? -1 : 1));
      out[lg.id] = rows;
    }
    return out;
  }, [team.totalPoints, team.teamName, team.gameweek]);

  // Rival H2H de la jornada.
  const h2h = useMemo(() => {
    const rng = mulberry32(hashStr("h2h:" + team.gameweek));
    const rivalName = BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)];
    const last = team.history[team.history.length - 1];
    const youGw = last?.points ?? 0;
    const rivalGw = Math.max(0, Math.round(youGw + (rng() - 0.5) * 36));
    return { rivalName, youGw, rivalGw };
  }, [team.gameweek, team.history]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {LEAGUES.map((lg) => (
          <button key={lg.id} onClick={() => setActive(lg.id)} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid " + (active === lg.id ? GOLD : "rgba(255,255,255,0.12)"), background: active === lg.id ? `${GOLD}22` : BG2, color: active === lg.id ? GOLD2 : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            <span style={{ marginRight: 6 }}>{lg.icon}</span>{lg.label}
          </button>
        ))}
      </div>

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
      ) : (
        <Table rows={standings[active]} desc={LEAGUES.find((l) => l.id === active)!.desc} />
      )}
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
