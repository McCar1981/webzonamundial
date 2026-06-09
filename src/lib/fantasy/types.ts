// src/lib/fantasy/types.ts
//
// Modelo de datos del Fantasy Mundial. El módulo es una experiencia
// interactiva client-side: el pool de jugadores se genera de forma
// DETERMINISTA a partir de las selecciones reales (con las estrellas reales
// incluidas). No hay base de datos; el equipo del usuario vive en localStorage.

export type FantasyPos = "GK" | "DEF" | "MID" | "FWD";

export type PowerUp = "tridente" | "muro" | "francotirador" | "comodin" | "joker";

/** Estado físico/disciplinario del jugador para el próximo partido. */
export type PlayerStatus = "apto" | "duda" | "lesionado" | "sancionado";

/** Tier del multiplicador "Modo Underdog" de un partido. */
export interface MatchTier {
  multiplier: number; // 1.0 | 1.25 | 1.5 | 2.0
  label: string; // "Estelar" | "Bronce" | "Oro" | "Diamante"
  emoji: string; // 🟢 🟡 💎
  color: string;
}

/** Próximo partido de una selección dentro del fantasy. */
export interface NextMatch {
  opponentCode: string; // flagCode rival
  opponentName: string;
  tier: MatchTier;
  difficulty: "easy" | "medium" | "hard";
}

export interface FantasyPlayer {
  id: string; // slug-pos-idx
  name: string;
  club: string; // club real del jugador
  teamSlug: string;
  teamName: string;
  flag: string; // flagCode
  color: string;
  pos: FantasyPos;
  price: number; // millones € (coste fantasy; deriva del valor de mercado real cuando existe)
  /** Valor de mercado REAL (Transfermarkt) en millones €, si se dispone del dato. */
  marketValue?: number;
  /** Movimiento de precio de la semana (mercado dinámico, simulado). */
  priceTrend: "up" | "down" | "flat";
  priceDelta: number; // variación en millones (≥ 0; signo lo da priceTrend)
  totalPoints: number;
  avgPoints: number;
  form: number; // 0..10
  ownership: number; // %
  available: boolean;
  /** Probabilidad simulada de ser titular en el próximo partido (0..100). */
  startProb: number;
  /** true si entra en el once probable de su selección. */
  xiProbable: boolean;
  /** Estado físico/disciplinario simulado. */
  status: PlayerStatus;
  /** true si es un jugador real (estrella de la selección). */
  real: boolean;
  stats: { goals: number; assists: number; minutes: number; cleanSheets: number };
  next: NextMatch;
}

/** Un hueco de la alineación con el jugador asignado (o vacío). */
export interface SquadSlot {
  slot: string; // GK1, DEF1.. MID1.. FWD1.. BENCH1..BENCH4
  pos: FantasyPos;
  bench: boolean;
  playerId: string | null;
}

export interface FantasyTeamState {
  teamName: string;
  /**
   * Slug del creador con el que el usuario se registró (profiles.fav_creator).
   * Marca el fantasy como "de ese creador": su nombre e imagen de perfil se
   * muestran como branding. null si el usuario no llegó vía creador.
   */
  creatorSlug?: string | null;
  formation: string; // "4-3-3"
  slots: SquadSlot[];
  captainId: string | null;
  viceId: string | null;
  powerUp: PowerUp | null; // power-up (chip) armado para la jornada
  powerUpsUsed: PowerUp[]; // chips ya gastados en el torneo (un solo uso cada uno)
  wildcardUsed: boolean;
  gameweek: number;
  totalPoints: number;
  history: { gw: number; points: number; powerUp: PowerUp | null }[];
  /** Fichajes gratis disponibles esta jornada (acumulables hasta MAX_FREE_TRANSFERS). */
  freeTransfers: number;
  /** Plantilla "fichada" al confirmar la última jornada: base para contar fichajes. */
  committedSlots: SquadSlot[];
  /**
   * Crédito EXTRA de presupuesto acumulado por reembolsos de jugadores cuya
   * selección quedó eliminada (las demás piezas suben de valor en el mercado).
   * Se suma al BUDGET base al validar el equipo.
   */
  budgetBonus: number;
  /** Ids de jugadores ya reembolsados (un solo reembolso por jugador). */
  refundedIds: string[];
}

/** Reglas de una formación: cuántos por línea (sin contar banquillo). */
export interface FormationRule {
  code: string;
  def: number;
  mid: number;
  fwd: number;
  estilo: string;
}

export const BUDGET = 100; // €100M
export const SQUAD_SIZE = 15; // 11 titulares + 4 banquillo
export const MAX_PER_NATION = 3;
export const FREE_TRANSFERS = 1; // fichajes gratis por jornada
export const MAX_FREE_TRANSFERS = 1; // tope de fichajes gratis acumulables
export const TRANSFER_PENALTY = 6; // puntos que descuenta cada fichaje extra
export const ELIM_REFUND_PER_POINT = 0.5; // M€ de reembolso por punto del jugador eliminado
export const ELIM_REFUND_FLOOR = 2; // M€ mínimo de reembolso por eliminación
