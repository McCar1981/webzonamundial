"use client";

// Mercado Mundial — explorador del pool de jugadores con filtros (posición,
// selección, precio, búsqueda) y orden. Respeta el presupuesto, el máximo por
// nación y el hueco que se esté eligiendo (selectingSlot).

import { useMemo, useState } from "react";
import { getPlayerPool } from "@/lib/fantasy/players";
import type { FantasyPos, FantasyPlayer, SquadSlot } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money, flagUrl, lastName, POS_LABEL, POS_COLOR } from "./fx";

interface Props {
  ownedIds: Set<string>;
  nationCounts: Record<string, number>;
  budgetRemaining: number;
  selectingSlot: SquadSlot | null;
  onPick: (playerId: string, slotId?: string) => void;
}

type SortKey = "value" | "price" | "points" | "form" | "mult";

const POS_FILTERS: { id: FantasyPos | "ALL"; label: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "GK", label: "POR" },
  { id: "DEF", label: "DEF" },
  { id: "MID", label: "MED" },
  { id: "FWD", label: "DEL" },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "value", label: "Mejor valor" },
  { id: "points", label: "Más puntos" },
  { id: "form", label: "Mejor forma" },
  { id: "mult", label: "Multiplicador" },
  { id: "price", label: "Precio ↓" },
];

export default function MarketView({ ownedIds, nationCounts, budgetRemaining, selectingSlot, onPick }: Props) {
  const pool = useMemo(() => getPlayerPool(), []);
  const teams = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of pool) if (!seen.has(p.teamSlug)) seen.set(p.teamSlug, p.teamName);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [pool]);

  // Si hay un hueco seleccionado, el filtro de posición arranca acorde.
  const forcedPos: FantasyPos | null = selectingSlot ? (selectingSlot.bench ? (selectingSlot.pos === "GK" ? "GK" : null) : selectingSlot.pos) : null;
  const [pos, setPos] = useState<FantasyPos | "ALL">(forcedPos ?? "ALL");
  const [team, setTeam] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(15);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("value");
  const [onlyAffordable, setOnlyAffordable] = useState(false);

  // Para huecos de banquillo no-GK, sólo se admiten jugadores de campo.
  const benchNonGk = !!(selectingSlot?.bench && selectingSlot.pos !== "GK");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const value = (p: FantasyPlayer) => (p.totalPoints / p.price) * (0.7 + p.form / 20) * p.next.tier.multiplier;
    let arr = pool.filter((p) => {
      if (pos !== "ALL" && p.pos !== pos) return false;
      if (benchNonGk && p.pos === "GK") return false;
      if (team !== "ALL" && p.teamSlug !== team) return false;
      if (p.price > maxPrice) return false;
      if (onlyAffordable && p.price > budgetRemaining + 1e-6) return false;
      if (term && !p.name.toLowerCase().includes(term) && !p.teamName.toLowerCase().includes(term)) return false;
      return true;
    });
    arr = arr.sort((a, b) => {
      switch (sort) {
        case "price": return b.price - a.price;
        case "points": return b.totalPoints - a.totalPoints;
        case "form": return b.form - a.form;
        case "mult": return b.next.tier.multiplier - a.next.tier.multiplier || value(b) - value(a);
        default: return value(b) - value(a);
      }
    });
    return arr.slice(0, 80);
  }, [pool, pos, team, maxPrice, q, sort, onlyAffordable, budgetRemaining, benchNonGk]);

  const inputStyle: React.CSSProperties = { background: BG3, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 13, fontWeight: 600, outline: "none" };

  return (
    <div>
      {selectingSlot && (
        <div style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, fontWeight: 700, color: GOLD2 }}>
          Eligiendo para <b>{selectingSlot.slot}</b> ({selectingSlot.bench ? "banquillo" : "titular"} · {POS_LABEL[selectingSlot.pos]}). Toca «Fichar» en un jugador compatible.
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {POS_FILTERS.map((pf) => (
          <button key={pf.id} onClick={() => setPos(pf.id)} disabled={benchNonGk && pf.id === "GK"} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (pos === pf.id ? GOLD : "rgba(255,255,255,0.12)"), background: pos === pf.id ? `${GOLD}22` : BG2, color: pos === pf.id ? GOLD2 : "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", opacity: benchNonGk && pf.id === "GK" ? 0.4 : 1 }}>{pf.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={inputStyle}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jugador o selección…" style={{ ...inputStyle, flex: "1 1 200px" }} />
        <select value={team} onChange={(e) => setTeam(e.target.value)} style={inputStyle}>
          <option value="ALL">Todas las selecciones</option>
          {teams.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: MID }}>
          ≤ {money(maxPrice)}
          <input type="range" min={3.8} max={15} step={0.1} value={maxPrice} onChange={(e) => setMaxPrice(parseFloat(e.target.value))} style={{ accentColor: GOLD }} />
        </label>
        <button onClick={() => setOnlyAffordable((v) => !v)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid " + (onlyAffordable ? GREEN : "rgba(255,255,255,0.12)"), background: onlyAffordable ? `${GREEN}22` : BG2, color: onlyAffordable ? GREEN : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Dentro de presupuesto</button>
      </div>

      <div style={{ fontSize: 11, color: DIM, fontWeight: 700, marginBottom: 8 }}>{list.length} jugadores · Presupuesto libre {money(budgetRemaining)}</div>

      {/* Lista */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
        {list.map((p) => {
          const owned = ownedIds.has(p.id);
          const tooPricey = p.price > budgetRemaining + 1e-6;
          const nationFull = (nationCounts[p.teamSlug] ?? 0) >= 3 && !owned;
          const disabled = owned || tooPricey || nationFull || !p.available;
          return (
            <div key={p.id} style={{ background: BG2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={flagUrl(p.flag)} alt={p.teamName} style={{ width: 34, height: 23, borderRadius: 3, objectFit: "cover", border: `1px solid ${p.color}` }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lastName(p.name)} {p.real && <span title="Jugador real" style={{ fontSize: 10, color: GOLD2 }}>★</span>}
                  </div>
                  <div style={{ fontSize: 11, color: MID, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.teamName}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: POS_COLOR[p.pos], background: `${POS_COLOR[p.pos]}1e`, borderRadius: 6, padding: "3px 7px" }}>{POS_LABEL[p.pos]}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11 }}>
                <Pill label="Precio" value={money(p.price)} color={GOLD2} />
                <Pill label="Pts" value={String(p.totalPoints)} />
                <Pill label="Forma" value={`${p.form}`} color={p.form >= 7 ? GREEN : p.form <= 4 ? RED : "#fff"} />
                <Pill label="Prop." value={`${p.ownership}%`} color={MID} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MID }}>
                <span title="Próximo partido (Modo Underdog)" style={{ fontWeight: 800, color: p.next.tier.color }}>{p.next.tier.emoji} {p.next.tier.label} ×{p.next.tier.multiplier}</span>
                <span style={{ color: DIM }}>vs {p.next.opponentName}</span>
              </div>

              {!p.available && <div style={{ fontSize: 11, color: RED, fontWeight: 800 }}>⛔ Baja / no disponible</div>}

              <button
                onClick={() => onPick(p.id, selectingSlot?.slot)}
                disabled={disabled}
                style={{ marginTop: "auto", padding: "8px 10px", borderRadius: 9, border: "none", fontWeight: 800, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${GOLD},${GOLD2})`, color: disabled ? MID : "#060B14" }}
              >
                {owned ? "✓ En tu equipo" : nationFull ? "Máx. 3 de su país" : tooPricey ? "Fuera de presupuesto" : "＋ Fichar"}
              </button>
            </div>
          );
        })}
      </div>

      {list.length === 0 && <div style={{ textAlign: "center", padding: 40, color: DIM, fontSize: 14 }}>Sin jugadores para esos filtros.</div>}
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ background: BG3, borderRadius: 6, padding: "3px 7px", fontWeight: 700 }}>
      <span style={{ color: DIM }}>{label} </span>
      <span style={{ color: color ?? "#fff" }}>{value}</span>
    </span>
  );
}
