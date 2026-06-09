// src/lib/fantasy/rules.ts
//
// Formaciones tácticas, construcción de huecos y validación de equipo.

import {
  BUDGET,
  ELIM_REFUND_FLOOR,
  ELIM_REFUND_PER_POINT,
  MAX_PER_NATION,
  TRANSFER_PENALTY,
  type FantasyPlayer,
  type FantasyPos,
  type FormationRule,
  type SquadSlot,
} from "./types";

export const FORMATIONS: FormationRule[] = [
  { code: "4-3-3", def: 4, mid: 3, fwd: 3, estilo: "Ofensivo clásico" },
  { code: "4-4-2", def: 4, mid: 4, fwd: 2, estilo: "Equilibrado" },
  { code: "4-2-3-1", def: 4, mid: 5, fwd: 1, estilo: "Control de medio" },
  { code: "3-5-2", def: 3, mid: 5, fwd: 2, estilo: "Carrileros" },
  { code: "3-4-3", def: 3, mid: 4, fwd: 3, estilo: "Máximo ataque" },
  { code: "5-3-2", def: 5, mid: 3, fwd: 2, estilo: "Sólido atrás" },
  { code: "5-4-1", def: 5, mid: 4, fwd: 1, estilo: "Ultra defensivo" },
];

export function getFormation(code: string): FormationRule {
  return FORMATIONS.find((f) => f.code === code) ?? FORMATIONS[0];
}

/** Construye los 15 huecos (11 titulares + 4 banquillo) de una formación. */
export function buildSlots(code: string): SquadSlot[] {
  const f = getFormation(code);
  const slots: SquadSlot[] = [{ slot: "GK1", pos: "GK", bench: false, playerId: null }];
  for (let i = 1; i <= f.def; i++) slots.push({ slot: `DEF${i}`, pos: "DEF", bench: false, playerId: null });
  for (let i = 1; i <= f.mid; i++) slots.push({ slot: `MID${i}`, pos: "MID", bench: false, playerId: null });
  for (let i = 1; i <= f.fwd; i++) slots.push({ slot: `FWD${i}`, pos: "FWD", bench: false, playerId: null });
  slots.push({ slot: "BENCH_GK", pos: "GK", bench: true, playerId: null });
  slots.push({ slot: "BENCH1", pos: "DEF", bench: true, playerId: null });
  slots.push({ slot: "BENCH2", pos: "MID", bench: true, playerId: null });
  slots.push({ slot: "BENCH3", pos: "FWD", bench: true, playerId: null });
  return slots;
}

/** ¿Puede este jugador ocupar este hueco? */
export function slotAccepts(slot: SquadSlot, pos: FantasyPos): boolean {
  if (slot.bench) return slot.pos === "GK" ? pos === "GK" : pos !== "GK";
  return slot.pos === pos;
}

/**
 * Reasigna los huecos al cambiar de formación, conservando los jugadores que
 * encajen por posición. Los que no entren en el once bajan al banquillo; si el
 * banquillo se llena, quedan liberados.
 */
export function remapFormation(prev: SquadSlot[], code: string, posOf: (id: string) => FantasyPos | undefined): SquadSlot[] {
  const next = buildSlots(code);
  const assigned = new Set<string>();
  const pending = prev.filter((s) => s.playerId).map((s) => s.playerId!) as string[];

  const place = (bench: boolean) => {
    for (const id of pending) {
      if (assigned.has(id)) continue;
      const pos = posOf(id);
      if (!pos) continue;
      const target = next.find((s) => s.bench === bench && !s.playerId && slotAccepts(s, pos));
      if (target) {
        target.playerId = id;
        assigned.add(id);
      }
    }
  };
  place(false); // primero rellena el once
  place(true); // luego el banquillo
  return next;
}

/**
 * Cuenta los FICHAJES hechos respecto a la plantilla confirmada en la última
 * jornada: cada jugador que está ahora y no estaba antes es un fichaje. Si no
 * hay plantilla base (primer equipo), el armado inicial es gratis (0 fichajes).
 */
export function countTransfers(committed: SquadSlot[], current: SquadSlot[]): number {
  const before = new Set(committed.map((s) => s.playerId).filter(Boolean) as string[]);
  if (before.size === 0) return 0; // armado inicial: gratis
  let incoming = 0;
  for (const id of current.map((s) => s.playerId).filter(Boolean) as string[]) {
    if (!before.has(id)) incoming++;
  }
  return incoming;
}

export interface TransferCost {
  transfers: number;      // fichajes hechos esta jornada
  free: number;           // fichajes gratis disponibles
  paid: number;           // fichajes que cuestan puntos
  penalty: number;        // puntos descontados (paid × TRANSFER_PENALTY)
  wildcard: boolean;      // comodín activo → todo gratis
}

/** Coste en puntos de los fichajes de la jornada (el comodín lo anula). */
export function transferCost(committed: SquadSlot[], current: SquadSlot[], freeTransfers: number, wildcard: boolean): TransferCost {
  const transfers = countTransfers(committed, current);
  if (wildcard) return { transfers, free: freeTransfers, paid: 0, penalty: 0, wildcard: true };
  const paid = Math.max(0, transfers - Math.max(0, freeTransfers));
  return { transfers, free: freeTransfers, paid, penalty: paid * TRANSFER_PENALTY, wildcard: false };
}

/**
 * Reembolso (en M€) por dar de baja a un jugador cuya selección quedó eliminada.
 * Se basa en los PUNTOS que acumuló, no en su precio: 0.5M por punto, con suelo
 * de 2M. Es un crédito EXTRA de presupuesto (las piezas que siguen vivas suben
 * de valor al salir las eliminadas del mercado), no un simple "deshacer fichaje".
 */
export function refundForElimination(points: number): number {
  const r = Math.max(ELIM_REFUND_FLOOR, ELIM_REFUND_PER_POINT * Math.max(0, points));
  return Math.round(r * 10) / 10;
}

export interface TeamValidation {
  ok: boolean;
  errors: string[];
  totalCost: number;
  budgetRemaining: number;
  counts: Record<FantasyPos, number>;
  nationCounts: Record<string, number>;
}

/** Valida presupuesto, formación, límite por selección y huecos llenos. */
export function validateTeam(
  slots: SquadSlot[],
  byId: (id: string) => FantasyPlayer | undefined,
  formationCode: string,
  budgetBonus = 0,
): TeamValidation {
  const errors: string[] = [];
  const budget = BUDGET + (budgetBonus || 0);
  const f = getFormation(formationCode);
  let totalCost = 0;
  const counts: Record<FantasyPos, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const nationCounts: Record<string, number> = {};
  let filled = 0;

  for (const s of slots) {
    if (!s.playerId) continue;
    const p = byId(s.playerId);
    if (!p) continue;
    filled++;
    totalCost += p.price;
    nationCounts[p.teamSlug] = (nationCounts[p.teamSlug] ?? 0) + 1;
    if (!s.bench) counts[p.pos]++;
  }

  if (filled < 15) errors.push(`Faltan ${15 - filled} jugadores por fichar.`);
  if (totalCost > budget + 1e-6)
    errors.push(`Presupuesto excedido: ${totalCost.toFixed(1)}M de ${budget.toFixed(1)}M.`);
  if (counts.DEF !== f.def || counts.MID !== f.mid || counts.FWD !== f.fwd) {
    errors.push(`La formación ${f.code} requiere ${f.def} DEF, ${f.mid} MED y ${f.fwd} DEL en el once.`);
  }
  for (const [slug, n] of Object.entries(nationCounts)) {
    if (n > MAX_PER_NATION) {
      const p = slots.map((s) => s.playerId && byId(s.playerId)).find((x) => x && x.teamSlug === slug);
      errors.push(`Máximo ${MAX_PER_NATION} por selección. Tienes ${n}${p ? ` de ${(p as FantasyPlayer).teamName}` : ""}.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    totalCost: Math.round(totalCost * 10) / 10,
    budgetRemaining: Math.round((budget - totalCost) * 10) / 10,
    counts,
    nationCounts,
  };
}
