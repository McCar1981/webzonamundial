"use client";

// Selector del once de la jornada: elige 5 jugadores del pool (agrupado por equipo,
// con búsqueda) y marca tu capitán (x2). Guarda vía POST /api/ligas/fantasy. Si ya
// tienes once esta jornada, se muestra en modo lectura. Sin emojis.

import { useMemo, useState } from "react";
import type { FantasyPlayer } from "@/lib/ligas/fantasy";
import type { UserFantasyPick, SquadPick } from "@/lib/ligas/fantasy-store";

const SQUAD = 5;
const GOLD = "#c9a84c";
const DIM = "#9db0c9";
const POS_ES: Record<string, string> = { GK: "POR", DEF: "DEF", MID: "MED", FWD: "DEL" };

export default function FantasyPicker({
  slug,
  round,
  pool,
  existing,
}: {
  slug: string;
  round: string;
  pool: FantasyPlayer[];
  existing: UserFantasyPick | null;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [captain, setCaptain] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(!!existing);
  const [error, setError] = useState("");

  const byId = useMemo(() => new Map(pool.map((p) => [p.id, p])), [pool]);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const m = new Map<string, FantasyPlayer[]>();
    for (const p of pool) {
      if (query && !p.name.toLowerCase().includes(query)) continue;
      const arr = m.get(p.teamName);
      if (arr) arr.push(p);
      else m.set(p.teamName, [p]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [pool, q]);

  const toggle = (id: number) => {
    setSelected((cur) => {
      if (cur.includes(id)) {
        if (captain === id) setCaptain(null);
        return cur.filter((x) => x !== id);
      }
      if (cur.length >= SQUAD) return cur;
      return [...cur, id];
    });
  };

  const save = async () => {
    if (busy || selected.length !== SQUAD) return;
    setBusy(true);
    setError("");
    const players: SquadPick[] = selected
      .map((id) => byId.get(id))
      .filter((p): p is FantasyPlayer => !!p)
      .map((p) => ({ id: p.id, pos: p.position, teamId: p.teamId, name: p.name }));
    try {
      const r = await fetch("/api/ligas/fantasy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, round, players, captainId: captain }),
      });
      if (r.ok) { setSaved(true); return; }
      const j = await r.json().catch(() => ({}));
      setError(
        j?.error === "already_picked" ? "Ya montaste tu once de esta jornada."
        : j?.error === "round_closed" ? "La jornada ya empezó."
        : j?.error === "not_available" ? "El fantasy se activa en breve."
        : "No se pudo guardar. Inténtalo de nuevo.",
      );
      if (j?.error === "already_picked") setSaved(true);
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  // Modo lectura si ya hay once guardado.
  if (saved) {
    const shown = existing?.players?.length ? existing.players : selected.map((id) => byId.get(id)).filter(Boolean).map((p) => ({ id: p!.id, name: p!.name, pos: p!.position, teamId: p!.teamId } as SquadPick));
    const cap = existing?.captainId ?? captain;
    return (
      <div style={{ marginTop: 18 }}>
        <div style={{ padding: 14, borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#8ff0b0", fontSize: 14, fontWeight: 500, marginBottom: 14 }}>
          Tu once está montado. Se puntúa al terminar la jornada y ganas Fútcoins por su rendimiento.
        </div>
        {shown.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
            <span style={{ width: 34, fontSize: 11, color: DIM }}>{POS_ES[p.pos] ?? p.pos}</span>
            <span style={{ flex: 1, color: "#fff" }}>{p.name}</span>
            {cap === p.id ? <span style={{ fontSize: 11, fontWeight: 700, color: "#0A1422", background: GOLD, borderRadius: 6, padding: "2px 7px" }}>CAP x2</span> : null}
          </div>
        ))}
      </div>
    );
  }

  const selPlayers = selected.map((id) => byId.get(id)).filter((p): p is FantasyPlayer => !!p);

  return (
    <div style={{ marginTop: 16 }}>
      {/* Barra de elegidos */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, padding: "12px 0", background: "linear-gradient(180deg, #060B14 70%, transparent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: DIM }}>Elegidos: <b style={{ color: selected.length === SQUAD ? GOLD : "#fff" }}>{selected.length}/{SQUAD}</b> · toca la estrella para el capitán</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, minHeight: 4 }}>
          {selPlayers.map((p) => (
            <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.34)", borderRadius: 99, padding: "4px 8px" }}>
              <button onClick={() => setCaptain(captain === p.id ? null : p.id)} title="Capitán" style={{ border: "none", background: "none", cursor: "pointer", color: captain === p.id ? GOLD : DIM, fontSize: 13, padding: 0, lineHeight: 1 }}>{captain === p.id ? "★" : "☆"}</button>
              {p.name}
              <button onClick={() => toggle(p.id)} aria-label="Quitar" style={{ border: "none", background: "none", cursor: "pointer", color: DIM, fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
        <button
          onClick={save}
          disabled={busy || selected.length !== SQUAD}
          style={{ width: "100%", border: "none", cursor: selected.length === SQUAD && !busy ? "pointer" : "default", background: selected.length === SQUAD ? `linear-gradient(135deg, ${GOLD}, #e8d48b)` : "rgba(255,255,255,0.08)", color: selected.length === SQUAD ? "#0A1422" : DIM, fontWeight: 600, fontSize: 15, padding: "12px", borderRadius: 12 }}
        >
          {busy ? "Guardando…" : selected.length === SQUAD ? "Guardar mi once" : `Elige ${SQUAD - selected.length} más`}
        </button>
        {error ? <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ef6a6a", textAlign: "center" }}>{error}</p> : null}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jugador…"
          aria-label="Buscar jugador"
          style={{ width: "100%", marginTop: 10, padding: "10px 14px", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", outline: "none" }}
        />
      </div>

      {/* Pool por equipo */}
      {groups.map(([team, players]) => (
        <div key={team} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 4 }}>{team}</div>
          {players.map((p) => {
            const on = selected.includes(p.id);
            const full = selected.length >= SQUAD && !on;
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                disabled={full}
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "9px 8px", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", background: on ? "rgba(201,168,76,0.14)" : "transparent", color: "#fff", cursor: full ? "default" : "pointer", fontSize: 14, textAlign: "left", opacity: full ? 0.4 : 1 }}
              >
                <span style={{ width: 34, fontSize: 11, color: DIM }}>{POS_ES[p.position] ?? p.position}</span>
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 16, color: on ? GOLD : DIM }}>{on ? "−" : "+"}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
