"use client";

import { useState } from "react";
import { getPlayerById } from "@/lib/fantasy/players";
import { POWER_UPS } from "@/lib/fantasy/scoring";
import type { FantasyTeamState, FormationRule, PowerUp, SquadSlot } from "@/lib/fantasy/types";
import type { TeamValidation } from "@/lib/fantasy/rules";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money, flagUrl, lastName, POS_COLOR, POS_LABEL } from "./fx";

interface Props {
  team: FantasyTeamState;
  validation: TeamValidation;
  onSlotClickEmpty: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onCaptain: (id: string) => void;
  onVice: (id: string) => void;
  onSwap: (a: string, b: string) => void;
  onSetFormation: (code: string) => void;
  onSetPowerUp: (pu: PowerUp) => void;
  onAutoDraft: () => void;
  onReset: () => void;
  formations: FormationRule[];
}

export default function TeamView({ team, validation, onSlotClickEmpty, onRemove, onCaptain, onVice, onSwap, onSetFormation, onSetPowerUp, onAutoDraft, onReset, formations }: Props) {
  const [menu, setMenu] = useState<string | null>(null);

  const lineSlots = (prefix: string) => team.slots.filter((s) => !s.bench && s.slot.startsWith(prefix));
  const benchSlots = team.slots.filter((s) => s.bench);

  return (
    <div>
      {/* Formación + acciones */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>Formación</span>
        {formations.map((f) => (
          <button key={f.code} onClick={() => onSetFormation(f.code)} title={f.estilo} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid " + (team.formation === f.code ? GOLD : "rgba(255,255,255,0.12)"), background: team.formation === f.code ? `${GOLD}22` : BG2, color: team.formation === f.code ? GOLD2 : "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{f.code}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={onAutoDraft} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>🤖 Auto-draft IA</button>
        <button onClick={onReset} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: BG2, color: MID, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Reiniciar</button>
      </div>

      {/* Errores de validación */}
      {!validation.ok && (
        <div style={{ background: `${RED}14`, border: `1px solid ${RED}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#fecaca" }}>
          {validation.errors.map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: DIM, fontWeight: 700, marginBottom: 6 }}>Arrastra un jugador sobre otro para intercambiarlos · toca para capitán/quitar.</div>

      {/* Campo */}
      <div style={{ borderRadius: 18, padding: "18px 8px", background: "linear-gradient(180deg,#0c5a35,#0a3f26)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 40px, transparent 40px 80px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
          {(["FWD", "MID", "DEF", "GK"] as const).map((pref) => (
            <div key={pref} style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {lineSlots(pref).map((s) => (
                <SlotCard key={s.slot} slot={s} team={team} menu={menu} setMenu={setMenu} onSlotClickEmpty={onSlotClickEmpty} onRemove={onRemove} onCaptain={onCaptain} onVice={onVice} onSwap={onSwap} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Banquillo */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Banquillo</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {benchSlots.map((s) => (
            <SlotCard key={s.slot} slot={s} team={team} menu={menu} setMenu={setMenu} onSlotClickEmpty={onSlotClickEmpty} onRemove={onRemove} onCaptain={onCaptain} onVice={onVice} onSwap={onSwap} bench />
          ))}
        </div>
      </div>

      {/* Power-ups */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Power-ups · uno por jornada</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {POWER_UPS.map((pu) => {
            const used = team.powerUpsUsed.includes(pu.id);
            const active = team.powerUp === pu.id;
            return (
              <button key={pu.id} disabled={used} onClick={() => onSetPowerUp(pu.id)} style={{ textAlign: "left", padding: 12, borderRadius: 12, border: "1px solid " + (active ? GOLD : "rgba(255,255,255,0.08)"), background: active ? `${GOLD}22` : BG2, opacity: used ? 0.45 : 1, cursor: used ? "not-allowed" : "pointer", color: "#fff" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{pu.emoji} {pu.name}{used && " ✓"}</div>
                <div style={{ fontSize: 11, color: MID, marginTop: 3, lineHeight: 1.4 }}>{pu.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SlotCard({ slot, team, menu, setMenu, onSlotClickEmpty, onRemove, onCaptain, onVice, onSwap, bench }: { slot: SquadSlot; team: FantasyTeamState; menu: string | null; setMenu: (s: string | null) => void; onSlotClickEmpty: (id: string) => void; onRemove: (id: string) => void; onCaptain: (id: string) => void; onVice: (id: string) => void; onSwap: (a: string, b: string) => void; bench?: boolean }) {
  const p = slot.playerId ? getPlayerById(slot.playerId) : null;
  const isCap = p && team.captainId === p.id;
  const isVice = p && team.viceId === p.id;
  const open = menu === slot.slot;
  const [over, setOver] = useState(false);

  // Recibe un jugador arrastrado desde otro hueco.
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(false);
      const from = e.dataTransfer.getData("text/plain");
      if (from) onSwap(from, slot.slot);
    },
  };
  const overRing = over ? GREEN : null;

  if (!p) {
    return (
      <button {...dropProps} onClick={() => onSlotClickEmpty(slot.slot)} style={{ width: 78, height: 92, borderRadius: 12, border: "2px dashed " + (overRing ?? "rgba(255,255,255,0.25)"), background: over ? `${GREEN}1a` : "rgba(0,0,0,0.18)", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <span style={{ fontSize: 22, color: GOLD2 }}>+</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: POS_COLOR[slot.pos] }}>{bench ? (slot.pos === "GK" ? "POR" : "SUP") : POS_LABEL[slot.pos]}</span>
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }} {...dropProps}>
      <button draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", slot.slot); e.dataTransfer.effectAllowed = "move"; }} onClick={() => setMenu(open ? null : slot.slot)} style={{ width: 78, borderRadius: 12, border: "1px solid " + (overRing ?? (isCap ? GOLD : "rgba(255,255,255,0.12)")), background: BG3, color: "#fff", cursor: "grab", padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <div style={{ position: "relative" }}>
          <img src={flagUrl(p.flag)} alt={p.teamName} style={{ width: 30, height: 20, borderRadius: 3, objectFit: "cover", border: `1px solid ${p.color}` }} />
          {(isCap || isVice) && <span style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: isCap ? GOLD : "#94a3b8", color: BG, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{isCap ? "C" : "V"}</span>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.05, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 70 }}>{lastName(p.name)}</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: GOLD2 }}>{money(p.price)}</span>
          {p.next.tier.multiplier > 1 && <span title={`Partido ${p.next.tier.label}`} style={{ fontSize: 9 }}>{p.next.tier.emoji}{p.next.tier.multiplier}</span>}
        </div>
        {!p.available && <span style={{ fontSize: 8, color: RED, fontWeight: 800 }}>BAJA</span>}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", zIndex: 10, background: BG2, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: 6, display: "flex", flexDirection: "column", gap: 4, minWidth: 110, boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          {!bench && <MenuBtn label="⭐ Capitán" onClick={() => { onCaptain(p.id); setMenu(null); }} />}
          {!bench && <MenuBtn label="🅥 Vice-capitán" onClick={() => { onVice(p.id); setMenu(null); }} />}
          <MenuBtn label="🗑️ Quitar" danger onClick={() => { onRemove(slot.slot); setMenu(null); }} />
          <MenuBtn label="Cerrar" onClick={() => setMenu(null)} />
        </div>
      )}
    </div>
  );
}

function MenuBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent", color: danger ? "#fca5a5" : "#fff", fontWeight: 700, fontSize: 12, textAlign: "left", cursor: "pointer" }}>{label}</button>
  );
}
