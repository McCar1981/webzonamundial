"use client";

import { useState } from "react";
import { getPlayerById } from "@/lib/fantasy/players";
import { POWER_UPS } from "@/lib/fantasy/scoring";
import type { FantasyPlayer, FantasyTeamState, FormationRule, PowerUp, SquadSlot } from "@/lib/fantasy/types";
import type { TeamValidation } from "@/lib/fantasy/rules";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money, flagUrl, kitUrl, lastName, POS_COLOR, POS_LABEL } from "./fx";
import PlayerModal from "./PlayerModal";

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
  wide?: boolean;
}

export default function TeamView({ team, validation, onSlotClickEmpty, onRemove, onCaptain, onVice, onSwap, onSetFormation, onSetPowerUp, onAutoDraft, onReset, formations, wide }: Props) {
  const [menu, setMenu] = useState<string | null>(null);
  const [detail, setDetail] = useState<FantasyPlayer | null>(null);

  const lineSlots = (prefix: string) => team.slots.filter((s) => !s.bench && s.slot.startsWith(prefix));
  const benchSlots = team.slots.filter((s) => s.bench);

  // Botón de formación (reutilizado en escritorio y móvil).
  const fButton = (f: FormationRule) => (
    <button key={f.code} onClick={() => onSetFormation(f.code)} title={f.estilo} style={{ flex: "0 0 auto", minHeight: 40, padding: "8px 13px", borderRadius: 8, border: "1px solid " + (team.formation === f.code ? GOLD : "rgba(255,255,255,0.12)"), background: team.formation === f.code ? `${GOLD}22` : BG2, color: team.formation === f.code ? GOLD2 : "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{f.code}</button>
  );
  const lblStyle: React.CSSProperties = { flex: "0 0 auto", fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 };

  return (
    <div>
      <style>{`
        @keyframes zmRise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes zmPop { from { opacity: 0; transform: translateY(6px) scale(.94) } to { opacity: 1; transform: none } }
        @keyframes zmFieldGlow {
          0%, 100% { box-shadow: 0 16px 40px rgba(8,20,40,.18), 0 0 0 1px rgba(20,150,86,.25) }
          50% { box-shadow: 0 20px 54px rgba(8,20,40,.24), 0 0 26px rgba(20,150,86,.42) }
        }
      `}</style>

      {/* Formación + acciones */}
      {wide ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span style={lblStyle}>Formación</span>
          {formations.map(fButton)}
          <div style={{ flex: 1 }} />
          <button onClick={onAutoDraft} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>🤖 Auto-draft IA</button>
          <button onClick={onReset} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: BG2, color: MID, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Reiniciar</button>
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {/* Línea única deslizable → ocupa menos alto y sube el campo */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
            <span style={lblStyle}>Formación</span>
            {formations.map(fButton)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={onAutoDraft} style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>🤖 Auto-draft IA</button>
            <button onClick={onReset} style={{ flex: "0 0 auto", padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", background: BG2, color: MID, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Reiniciar</button>
          </div>
        </div>
      )}

      {/* Errores de validación */}
      {!validation.ok && (
        <div style={{ background: `${RED}14`, border: `1px solid ${RED}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#fecaca" }}>
          {validation.errors.map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: DIM, fontWeight: 700, marginBottom: 6 }}>Arrastra un jugador sobre otro para intercambiarlos · toca para capitán/quitar.</div>

      {/* Campo SVG moderno y futurista (líneas vectoriales con resplandor neón).
          Escritorio (wide) → horizontal (porterías a los lados).
          Móvil → vertical (porterías arriba/abajo).
          Las columnas/filas usan flex, así que soportan cualquier formación (1–5 por línea). */}
      {wide ? (
        // Panel blanco bajo el campo → mismo "héroe" que en móvil, máximo contraste.
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 12, borderRadius: 20, background: "linear-gradient(180deg,#ffffff 0%,#e9eff7 100%)", animation: "zmRise .5s ease both, zmFieldGlow 6s ease-in-out infinite .6s" }}>
          <div style={{ position: "relative", aspectRatio: "900 / 560", borderRadius: 14, boxShadow: "inset 0 0 0 1px rgba(125,255,206,0.14)" }}>
            {/* El césped se recorta a esquinas redondeadas; los jugadores NO, para que
                el menú emergente pueda salir totalmente al frente sin recortarse. */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden" }}>
              <PitchSVG orientation="h" />
            </div>

            {/* Capa de jugadores DENTRO del césped: portero a la izquierda → delanteros a la derecha. */}
            <div style={{ position: "absolute", inset: 0, padding: "6% 8%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "stretch", zIndex: 2 }}>
              {(["GK", "DEF", "MID", "FWD"] as const).map((pref, li) => (
                <div key={pref} style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 6 }}>
                  {lineSlots(pref).map((s, i) => (
                    <SlotCard key={s.slot} slot={s} team={team} menu={menu} setMenu={setMenu} onSlotClickEmpty={onSlotClickEmpty} onRemove={onRemove} onCaptain={onCaptain} onVice={onVice} onSwap={onSwap} onProfile={setDetail} delay={(li * 3 + i) * 40} compact />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Panel blanco bajo el campo → contraste y base para animaciones.
        <div style={{ maxWidth: 470, margin: "0 auto", padding: 9, borderRadius: 22, background: "linear-gradient(180deg,#ffffff 0%,#e9eff7 100%)", animation: "zmRise .5s ease both, zmFieldGlow 6s ease-in-out infinite .6s" }}>
          <div style={{ position: "relative", aspectRatio: "400 / 680", borderRadius: 15, boxShadow: "inset 0 0 0 1px rgba(125,255,206,0.14)" }}>
            {/* El césped se recorta a esquinas redondeadas; los jugadores NO, para que
                el menú emergente pueda salir totalmente al frente sin recortarse. */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 15, overflow: "hidden" }}>
              <PitchSVG orientation="v" />
            </div>

            {/* Capa de jugadores: delanteros arriba (portería rival) → portero abajo (la nuestra).
                Campo más alto + más aire arriba/abajo → todas las líneas (incl. el portero,
                que se ancla al borde inferior) caben sin recortarse contra la portería. */}
            <div style={{ position: "absolute", inset: 0, padding: "5% 3% 6%", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 2 }}>
              {(["FWD", "MID", "DEF", "GK"] as const).map((pref, li) => (
                <div key={pref} style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                  {lineSlots(pref).map((s, i) => (
                    <SlotCard key={s.slot} slot={s} team={team} menu={menu} setMenu={setMenu} onSlotClickEmpty={onSlotClickEmpty} onRemove={onRemove} onCaptain={onCaptain} onVice={onVice} onSwap={onSwap} onProfile={setDetail} delay={(li * 5 + i) * 35} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banquillo */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Banquillo</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {benchSlots.map((s) => (
            <SlotCard key={s.slot} slot={s} team={team} menu={menu} setMenu={setMenu} onSlotClickEmpty={onSlotClickEmpty} onRemove={onRemove} onCaptain={onCaptain} onVice={onVice} onSwap={onSwap} onProfile={setDetail} bench />
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

      {/* Ficha del jugador (reutiliza el modal del Mercado). */}
      {detail && <PlayerModal players={[detail]} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Campo de fútbol dibujado en SVG: césped con degradado + franjas de corte,
   rejilla tecnológica tenue, viñeta de estadio y líneas con resplandor neón.
   Vectorial → nítido a cualquier tamaño y sin distorsión (el contenedor mantiene
   el mismo aspect-ratio que el viewBox).
─────────────────────────────────────────────────────────────────────────── */
function PitchSVG({ orientation }: { orientation: "v" | "h" }) {
  const NEON = "#cdfff0";
  const lineProps = { fill: "none" as const, stroke: NEON, strokeWidth: 2, strokeOpacity: 0.92, strokeLinecap: "round" as const };

  if (orientation === "h") {
    return (
      <svg viewBox="0 0 900 560" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} aria-hidden>
        <defs>
          <linearGradient id="turfH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c241b" />
            <stop offset="0.5" stopColor="#10402e" />
            <stop offset="1" stopColor="#0a2a1f" />
          </linearGradient>
          <radialGradient id="spotH" cx="0.5" cy="0.5" r="0.65">
            <stop offset="0" stopColor="#1f7a51" stopOpacity="0.5" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vigH" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
          <pattern id="gridH" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0H0V30" fill="none" stroke="#7dffce" strokeWidth="0.5" strokeOpacity="0.05" />
          </pattern>
          <filter id="glowH" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="900" height="560" fill="url(#turfH)" />
        {Array.from({ length: 12 }).map((_, i) => (i % 2 === 0 ? <rect key={i} x={i * 75} y="0" width="75" height="560" fill="#ffffff" opacity="0.022" /> : null))}
        <rect x="0" y="0" width="900" height="560" fill="url(#spotH)" />
        <rect x="0" y="0" width="900" height="560" fill="url(#gridH)" />

        <g filter="url(#glowH)" {...lineProps}>
          <rect x="14" y="14" width="872" height="532" rx="10" />
          <line x1="450" y1="14" x2="450" y2="546" />
          <circle cx="450" cy="280" r="46" />
          <circle cx="450" cy="280" r="3" fill={NEON} stroke="none" />
          {/* portería izquierda */}
          <rect x="14" y="170" width="90" height="220" />
          <rect x="14" y="220" width="40" height="120" />
          <circle cx="78" cy="280" r="2.5" fill={NEON} stroke="none" />
          <path d="M104 242 A46 46 0 0 1 104 318" />
          {/* portería derecha */}
          <rect x="796" y="170" width="90" height="220" />
          <rect x="846" y="220" width="40" height="120" />
          <circle cx="822" cy="280" r="2.5" fill={NEON} stroke="none" />
          <path d="M796 242 A46 46 0 0 0 796 318" />
          {/* córneres */}
          <path d="M14 24 A10 10 0 0 0 24 14" />
          <path d="M876 14 A10 10 0 0 0 886 24" />
          <path d="M14 536 A10 10 0 0 1 24 546" />
          <path d="M876 546 A10 10 0 0 1 886 536" />
        </g>
        <rect x="0" y="0" width="900" height="560" fill="url(#vigH)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 600" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} aria-hidden>
      <defs>
        <linearGradient id="turfV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c241b" />
          <stop offset="0.5" stopColor="#10402e" />
          <stop offset="1" stopColor="#0a2a1f" />
        </linearGradient>
        <radialGradient id="spotV" cx="0.5" cy="0.5" r="0.65">
          <stop offset="0" stopColor="#1f7a51" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vigV" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <pattern id="gridV" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" fill="none" stroke="#7dffce" strokeWidth="0.5" strokeOpacity="0.05" />
        </pattern>
        <filter id="glowV" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="400" height="600" fill="url(#turfV)" />
      {Array.from({ length: 12 }).map((_, i) => (i % 2 === 0 ? <rect key={i} x="0" y={i * 50} width="400" height="50" fill="#ffffff" opacity="0.022" /> : null))}
      <rect x="0" y="0" width="400" height="600" fill="url(#spotV)" />
      <rect x="0" y="0" width="400" height="600" fill="url(#gridV)" />

      <g filter="url(#glowV)" {...lineProps}>
        <rect x="14" y="14" width="372" height="572" rx="10" />
        <line x1="14" y1="300" x2="386" y2="300" />
        <circle cx="200" cy="300" r="46" />
        <circle cx="200" cy="300" r="3" fill={NEON} stroke="none" />
        {/* portería superior */}
        <rect x="90" y="14" width="220" height="90" />
        <rect x="140" y="14" width="120" height="40" />
        <circle cx="200" cy="78" r="2.5" fill={NEON} stroke="none" />
        <path d="M162 104 A46 46 0 0 0 238 104" />
        {/* portería inferior */}
        <rect x="90" y="496" width="220" height="90" />
        <rect x="140" y="546" width="120" height="40" />
        <circle cx="200" cy="522" r="2.5" fill={NEON} stroke="none" />
        <path d="M162 496 A46 46 0 0 1 238 496" />
        {/* córneres */}
        <path d="M14 24 A10 10 0 0 0 24 14" />
        <path d="M376 14 A10 10 0 0 0 386 24" />
        <path d="M14 576 A10 10 0 0 1 24 586" />
        <path d="M376 586 A10 10 0 0 1 386 576" />
      </g>
      <rect x="0" y="0" width="400" height="600" fill="url(#vigV)" />
    </svg>
  );
}

function SlotCard({ slot, team, menu, setMenu, onSlotClickEmpty, onRemove, onCaptain, onVice, onSwap, onProfile, bench, compact, delay }: { slot: SquadSlot; team: FantasyTeamState; menu: string | null; setMenu: (s: string | null) => void; onSlotClickEmpty: (id: string) => void; onRemove: (id: string) => void; onCaptain: (id: string) => void; onVice: (id: string) => void; onSwap: (a: string, b: string) => void; onProfile: (p: FantasyPlayer) => void; bench?: boolean; compact?: boolean; delay?: number }) {
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

  // Tamaños: normal (móvil/banquillo) vs compacto (campo horizontal de escritorio).
  const W = compact ? 78 : 86;
  const K = compact ? 48 : 52;
  const nameFs = compact ? 11 : 12;
  const priceFs = compact ? 9.5 : 10.5;
  const anim = delay != null ? { animation: `zmPop .45s ease both`, animationDelay: `${delay}ms` } : {};

  // Dirección del menú emergente: las líneas bajas del campo vertical (defensas y
  // portero) y el banquillo abren HACIA ARRIBA, sobre la propia tarjeta, para no
  // desbordar bajo el campo y quedar tapados por los suplentes. El resto abre
  // hacia abajo. En el campo horizontal (compact) siempre hacia abajo.
  const openUp = !compact && (bench || slot.pos === "DEF" || slot.pos === "GK");

  if (!p) {
    return (
      <button {...dropProps} onClick={() => onSlotClickEmpty(slot.slot)} style={{ width: W, height: compact ? 88 : 112, borderRadius: compact ? 10 : 12, border: "2px dashed " + (overRing ?? "rgba(255,255,255,0.3)"), background: over ? `${GREEN}1a` : "rgba(0,0,0,0.22)", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, ...anim }}>
        <span style={{ fontSize: compact ? 18 : 22, color: GOLD2 }}>+</span>
        <span style={{ fontSize: compact ? 9 : 10, fontWeight: 800, color: POS_COLOR[slot.pos] }}>{bench ? (slot.pos === "GK" ? "POR" : "SUP") : POS_LABEL[slot.pos]}</span>
      </button>
    );
  }

  return (
    <div style={{ position: "relative", zIndex: open ? 60 : undefined, ...anim }} {...dropProps}>
      <button draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", slot.slot); e.dataTransfer.effectAllowed = "move"; }} onClick={() => setMenu(open ? null : slot.slot)} style={{ width: W, borderRadius: compact ? 10 : 12, border: "1px solid " + (overRing ?? (isCap ? GOLD : "rgba(255,255,255,0.16)")), background: `linear-gradient(180deg, ${BG2} 0%, ${BG} 100%)`, color: "#fff", cursor: "grab", padding: compact ? "4px 3px" : "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 2 : 3, boxShadow: (isCap ? `0 0 0 1px ${GOLD}55, ` : "") + "0 8px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
        <div style={{ position: "relative" }}>
          <img src={kitUrl(p.teamSlug)} alt={p.teamName} style={{ width: K, height: K, objectFit: "contain", filter: p.available ? "drop-shadow(0 2px 3px rgba(0,0,0,0.45))" : "grayscale(0.7) opacity(0.55)" }} />
          <img src={flagUrl(p.flag)} alt={p.teamName} style={{ position: "absolute", bottom: -2, left: -4, width: compact ? 15 : 18, height: compact ? 10 : 12, borderRadius: 2, objectFit: "cover", border: `1px solid ${p.color}`, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }} />
          {(isCap || isVice) && <span style={{ position: "absolute", top: -6, right: -6, width: compact ? 14 : 16, height: compact ? 14 : 16, borderRadius: "50%", background: isCap ? GOLD : "#94a3b8", color: BG, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{isCap ? "C" : "V"}</span>}
        </div>
        <div style={{ fontSize: nameFs, fontWeight: 700, lineHeight: 1.05, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: W - 8 }}>{lastName(p.name)}</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: priceFs, fontWeight: 800, color: GOLD2 }}>{money(p.price)}</span>
          {p.next.tier.multiplier > 1 && <span title={`Partido ${p.next.tier.label}`} style={{ fontSize: priceFs }}>{p.next.tier.emoji}{p.next.tier.multiplier}</span>}
        </div>
        {!p.available && <span style={{ fontSize: 8, color: RED, fontWeight: 800 }}>BAJA</span>}
      </button>

      {open && (
        <div style={{ position: "absolute", ...(openUp ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }), left: "50%", transform: "translateX(-50%)", zIndex: 10, background: BG2, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: 6, display: "flex", flexDirection: "column", gap: 4, minWidth: 110, boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
          <MenuBtn label="📋 Ver ficha" onClick={() => { onProfile(p); setMenu(null); }} />
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
