"use client";

// "Jugador del partido" del Match Center: el mejor por NOTA REAL de api-football
// (/fixtures/players → games.rating), más el mejor de cada selección. Datos 100%
// reales vía /api/match-center/mvp; si la API aún no publicó notas, no pinta nada.
// En vivo refresca cada 60s (el endpoint está cacheado, coste ~0).

import { useEffect, useState } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const DIM = "#6e6552";

type Side = "home" | "away";

interface Player {
  name: string;
  rating: number;
  side: Side | null;
  num: number | null;
  pos: string | null;
}

interface MvpData {
  found: boolean;
  mvp?: Player;
  home?: Player | null;
  away?: Player | null;
  status?: string;
}

const FINISHED = new Set(["FT", "AET", "PEN"]);
const POS_ES: Record<string, string> = { G: "POR", D: "DEF", M: "MED", F: "DEL" };

function flagUrl(code: string): string {
  return `https://flagcdn.com/w80/${code}.png`;
}

function posLabel(pos: string | null): string {
  if (!pos) return "";
  return POS_ES[pos[0]?.toUpperCase()] ?? pos.toUpperCase();
}

// Verde (notazo) → ámbar → gris según la nota (api-football va ~5..10).
function ratingColor(r: number): string {
  if (r >= 8) return "#2fbf6e";
  if (r >= 7) return GOLD;
  return "#a69a82";
}

export default function MatchMVP({
  matchId,
  home,
  away,
  live,
}: {
  matchId: number;
  home: { name: string; flag: string; color: string };
  away: { name: string; flag: string; color: string };
  live: boolean;
}) {
  const [data, setData] = useState<MvpData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch(`/api/match-center/mvp/${matchId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: MvpData | null) => {
          if (alive && d) setData(d);
        })
        .catch(() => {});
    };
    load();
    // En vivo el ranking de notas cambia; al terminar es definitivo.
    const t = live ? setInterval(load, 60_000) : null;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [matchId, live]);

  if (!data?.found || !data.mvp) return null;

  const finished = FINISHED.has(data.status ?? "");
  const mvp = data.mvp;
  const mvpTeam = mvp.side === "home" ? home : mvp.side === "away" ? away : null;

  const sideChip = (label: string, p: Player | null | undefined, team: { name: string; flag: string; color: string }) => {
    if (!p) return null;
    return (
      <div style={{ flex: 1, minWidth: 130, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "9px 11px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={flagUrl(team.flag)} alt="" style={{ width: 22, height: 15, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#eaf0fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: ratingColor(p.rating), fontVariantNumeric: "tabular-nums" }}>
            {p.rating.toFixed(1)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section style={{ background: "#14110a", borderRadius: 16, border: `1px solid ${GOLD}2e`, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ color: GOLD2 }}>★</span>
          {finished ? "Jugador del partido" : "Mejor valorado ahora"}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: DIM }}>Nota api-football</span>
      </div>

      {/* MVP destacado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: data.home || data.away ? 12 : 0 }}>
        <div
          style={{
            width: 52, height: 52, flexShrink: 0, borderRadius: 14,
            background: `linear-gradient(145deg, ${GOLD}, #9c7e2f)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(201,168,76,0.35)",
          }}
        >
          <span style={{ fontSize: 21, fontWeight: 900, color: "#000000", fontVariantNumeric: "tabular-nums" }}>{mvp.rating.toFixed(1)}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {mvpTeam && <img src={flagUrl(mvpTeam.flag)} alt="" style={{ width: 26, height: 17, borderRadius: 3, objectFit: "cover" }} />}
            <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mvp.name}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: DIM, marginTop: 2 }}>
            {[mvpTeam?.name, mvp.num != null ? `#${mvp.num}` : null, posLabel(mvp.pos)].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      {/* Mejor de cada selección */}
      {(data.home || data.away) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sideChip("Mejor local", data.home, home)}
          {sideChip("Mejor visitante", data.away, away)}
        </div>
      )}
    </section>
  );
}
