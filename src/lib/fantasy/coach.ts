// src/lib/fantasy/coach.ts
//
// IA Draft Coach: heurísticas de recomendación (capitán, análisis del equipo,
// oportunidades "Diamante" y auto-draft de un once válido).

import { getPlayerById, getPlayerPool } from "./players";
import { buildSlots, getFormation } from "./rules";
import { longevityFactor } from "./tournament";
import { playerMatchLocked } from "./fixtures";
import { BUDGET, MAX_PER_NATION, type FantasyPlayer, type FantasyPos, type SquadSlot } from "./types";

export interface CoachTip {
  icon: string;
  title: string;
  body: string;
  tone: "good" | "warn" | "info";
}

function value(p: FantasyPlayer): number {
  // Relación calidad-precio ponderada por forma, multiplicador del partido,
  // probabilidad de ser titular (un suplente puntúa poco aunque sea barato) y
  // la ruta proyectada de su selección (avanzar = más partidos = más puntos).
  // Calidad = puntos REALES si ya los hay; antes de que existan, la forma
  // estimada hace de proxy (×7 ≈ misma escala) para que el draft no quede ciego.
  const quality = p.totalPoints > 0 ? p.totalPoints : p.form * 7;
  return (quality / p.price) * (0.7 + p.form / 20) * p.next.tier.multiplier * (0.55 + p.startProb / 222) * longevityFactor(p.teamSlug);
}

export function suggestCaptain(slots: SquadSlot[]): { player: FantasyPlayer; why: string } | null {
  const starters = slots
    .filter((s) => !s.bench && s.playerId)
    .map((s) => getPlayerById(s.playerId!))
    .filter((p): p is FantasyPlayer => !!p && p.available);
  if (starters.length === 0) return null;
  const ranked = starters
    .map((p) => ({ p, score: (p.form * p.next.tier.multiplier + p.avgPoints * 0.4) * (p.startProb / 100) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0].p;
  const tierTxt = best.next.tier.multiplier > 1 ? ` y juega en partido ${best.next.tier.label} ${best.next.tier.emoji} (×${best.next.tier.multiplier})` : "";
  const probTxt = best.startProb >= 80 ? " Es titular fijo" : best.startProb >= 60 ? " Tiene minutos casi asegurados" : "";
  return {
    player: best,
    why: `${best.name} llega con forma ${best.form}/10${tierTxt}.${probTxt ? probTxt + " (" + best.startProb + "% de ser titular)." : ""} Su capitanía rinde mejor que el resto de tu once.`,
  };
}

export function analyzeSquad(slots: SquadSlot[]): CoachTip[] {
  const players = slots.map((s) => (s.playerId ? getPlayerById(s.playerId) : null)).filter((p): p is FantasyPlayer => !!p);
  const tips: CoachTip[] = [];
  if (players.length < 15) {
    tips.push({ icon: "🧩", title: "Equipo incompleto", body: `Te faltan ${15 - players.length} fichajes para completar tu plantilla de 15.`, tone: "warn" });
    return tips;
  }
  const starters = slots.filter((s) => !s.bench && s.playerId).map((s) => getPlayerById(s.playerId!)!).filter(Boolean);
  const avgForm = (pos: FantasyPos) => {
    const g = starters.filter((p) => p.pos === pos);
    return g.length ? g.reduce((a, p) => a + p.form, 0) / g.length : 0;
  };
  const att = (avgForm("FWD") + avgForm("MID")) / 2;
  const def = (avgForm("DEF") + avgForm("GK")) / 2;
  if (att - def > 1.2) tips.push({ icon: "⚔️", title: "Fuerte en ataque", body: "Tu once pega arriba pero está flojo atrás. Considera reforzar defensa en la próxima ventana.", tone: "info" });
  else if (def - att > 1.2) tips.push({ icon: "🛡️", title: "Sólido atrás", body: "Buena defensa, pero te faltan puntos arriba. Un delantero en forma marcaría la diferencia.", tone: "info" });
  else tips.push({ icon: "⚖️", title: "Equipo equilibrado", body: "Buen balance entre líneas. Mantén y ajusta por multiplicadores.", tone: "good" });

  const inDiamond = starters.filter((p) => p.next.tier.multiplier >= 1.5).length;
  if (inDiamond === 0) tips.push({ icon: "💎", title: "Sin partidos Diamante", body: "Ningún titular juega en partido de multiplicador alto esta jornada. Estás dejando puntos en la mesa.", tone: "warn" });
  else tips.push({ icon: "💎", title: `${inDiamond} titulares en Oro/Diamante`, body: "Aprovecha el multiplicador moviendo la capitanía a uno de ellos.", tone: "good" });

  const injured = players.filter((p) => !p.available);
  if (injured.length) tips.push({ icon: "➕", title: "Bajas en tu plantilla", body: `${injured.map((p) => p.name).join(", ")} no está${injured.length > 1 ? "n" : ""} disponible${injured.length > 1 ? "s" : ""} (lesión/sanción). Revisa transfers.`, tone: "warn" });

  // Titulares tuyos con baja probabilidad de jugar (riesgo de suplencia).
  const benchRisk = starters.filter((p) => p.available && p.startProb < 55);
  if (benchRisk.length) tips.push({ icon: "🪑", title: "Riesgo de suplencia", body: `${benchRisk.map((p) => `${p.name} (${p.startProb}%)`).join(", ")} en tu once tiene${benchRisk.length > 1 ? "n" : ""} pocas opciones de ser titular. Plantéate alternativas más fijas.`, tone: "warn" });
  return tips;
}

export function diamondOpportunities(ownedIds: Set<string>, limit = 6): FantasyPlayer[] {
  return getPlayerPool()
    .filter((p) => !ownedIds.has(p.id) && p.available && p.startProb >= 60 && p.price <= 7.5 && p.next.tier.multiplier >= 1.5)
    .sort((a, b) => value(b) - value(a))
    .slice(0, limit);
}

export function bestAvailable(pos: FantasyPos, maxPrice: number, ownedIds: Set<string>, limit = 5): FantasyPlayer[] {
  return getPlayerPool()
    .filter((p) => p.pos === pos && !ownedIds.has(p.id) && p.available && p.price <= maxPrice)
    .sort((a, b) => value(b) - value(a))
    .slice(0, limit);
}

/**
 * Auto-draft: arma un once válido (4-3-3) maximizando valor dentro del presupuesto.
 * Si se pasa `gw`, EXCLUYE a los jugadores CERRADOS por el cierre de 3h de su
 * partido (los que ya jugaron o están a <3h del saque): incluirlos generaría un
 * equipo que el servidor rechaza al guardar. Así un usuario que reinicia a mitad
 * de jornada obtiene un equipo válido y fichable con los jugadores aún disponibles.
 */
export function autoDraft(formationCode = "4-3-3", gw?: number): { slots: SquadSlot[]; captainId: string | null; viceId: string | null } {
  const f = getFormation(formationCode);
  const slots = buildSlots(formationCode);
  const pool = [...getPlayerPool()]
    .filter((p) => p.available && (gw == null || !playerMatchLocked(p.flag, gw)))
    .sort((a, b) => value(b) - value(a));
  const nationCount: Record<string, number> = {};
  const taken = new Set<string>();
  let spent = 0;

  const need: Record<FantasyPos, number> = { GK: 2, DEF: f.def + 1, MID: f.mid + 1, FWD: f.fwd + 1 };
  // 15 = 2 GK + (def+1) + (mid+1) + (fwd+1) ⇒ def+mid+fwd = 10, +3 banquillo +2 GK = 15 ✓

  const remainingSlotsAfter = (filled: number) => 15 - filled;

  const pickFor = (slot: SquadSlot) => {
    for (const p of pool) {
      if (taken.has(p.id)) continue;
      const ok = slot.bench ? (slot.pos === "GK" ? p.pos === "GK" : p.pos !== "GK") : p.pos === slot.pos;
      if (!ok) continue;
      if ((nationCount[p.teamSlug] ?? 0) >= MAX_PER_NATION) continue;
      // Deja presupuesto mínimo (~4M) para los huecos restantes.
      const filled = slots.filter((s) => s.playerId).length;
      const reserve = remainingSlotsAfter(filled + 1) * 4.0;
      if (spent + p.price > BUDGET - reserve) continue;
      slot.playerId = p.id;
      taken.add(p.id);
      nationCount[p.teamSlug] = (nationCount[p.teamSlug] ?? 0) + 1;
      spent += p.price;
      need[p.pos]--;
      return true;
    }
    return false;
  };

  // Rellena titulares primero (más caros), luego banquillo.
  for (const s of slots.filter((s) => !s.bench)) pickFor(s);
  for (const s of slots.filter((s) => s.bench)) pickFor(s);

  const cap = suggestCaptain(slots);
  const starters = slots.filter((s) => !s.bench && s.playerId).map((s) => getPlayerById(s.playerId!)!);
  const vice = starters.filter((p) => p.id !== cap?.player.id).sort((a, b) => b.form * b.next.tier.multiplier - a.form * a.next.tier.multiplier)[0];

  return { slots, captainId: cap?.player.id ?? null, viceId: vice?.id ?? null };
}
