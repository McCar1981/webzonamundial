// src/lib/predictions/gamification.ts
//
// Capa de LÓGICA PURA de la gamificación de Predicciones. Sin I/O ni Supabase:
// solo funciones deterministas que el `store` y las APIs orquestan. Cubre las
// 6 mejoras del módulo:
//   1) Rachas reales            → computeStreak / streak multiplier
//   2) Bucle diario             → dailyChallenge / canClaimDaily / dailyReward
//   3) Progresión visible       → niveles/XP, logros, misiones
//   4) Competencia social        → helpers de ligas/duelos (puntuación 1v1)
//   5) Recompensa variable       → flash multiplier + cofres (loot)
//   6) Economía                  → monedas + catálogo de boosts
//
// La idea: todo lo "random" es determinista por semilla (fecha/usuario) para que
// sea reproducible en cliente y servidor sin desincronizarse.

// ─── RNG determinista (compartido) ───────────────────────────────────────────
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Día UTC en formato YYYY-MM-DD (clave de "hoy" para retos/checkin). */
export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) PROGRESIÓN — Niveles / XP
// ═══════════════════════════════════════════════════════════════════════════
//
// Curva cuadrática suave: el XP necesario para el nivel N es 50·N·(N+1).
// Acumulado para LLEGAR al nivel L = 50·(L-1)·L. Invertible en cerrado.

export interface LevelInfo {
  level: number;
  xp: number;
  xpIntoLevel: number;   // xp acumulado dentro del nivel actual
  xpForLevel: number;    // xp total que pide el nivel actual
  xpToNext: number;      // cuánto falta para subir
  progress: number;      // 0..1
  title: string;         // rango temático
}

/** XP total acumulado necesario para ALCANZAR un nivel (nivel 1 = 0). */
export function totalXpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 50 * (l - 1) * l;
}

/** Nivel correspondiente a un XP acumulado. */
export function levelForXp(xp: number): number {
  const x = Math.max(0, xp);
  // resolver 50·(L-1)·L <= x  →  L = floor((1 + sqrt(1 + 4x/50)) / 2)
  const l = Math.floor((1 + Math.sqrt(1 + (4 * x) / 50)) / 2);
  return Math.max(1, l);
}

const LEVEL_TITLES: { min: number; title: string }[] = [
  { min: 30, title: "Leyenda del Mundial" },
  { min: 22, title: "Oráculo" },
  { min: 15, title: "Maestro Quiniela" },
  { min: 10, title: "Estratega" },
  { min: 6, title: "Analista" },
  { min: 3, title: "Aficionado" },
  { min: 1, title: "Novato" },
];
export function levelTitle(level: number): string {
  return LEVEL_TITLES.find((t) => level >= t.min)?.title ?? "Novato";
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelForXp(xp);
  const base = totalXpForLevel(level);
  const next = totalXpForLevel(level + 1);
  const xpForLevel = next - base;
  const xpIntoLevel = xp - base;
  return {
    level,
    xp,
    xpIntoLevel,
    xpForLevel,
    xpToNext: Math.max(0, next - xp),
    progress: xpForLevel > 0 ? Math.min(1, xpIntoLevel / xpForLevel) : 1,
    title: levelTitle(level),
  };
}

/** XP que otorga una predicción resuelta (acertar paga, participar paga poco). */
export function xpForResolved(pointsEarned: number, correct: boolean): number {
  const fromPoints = Math.max(0, Math.round(pointsEarned * 0.5));
  return (correct ? 15 : 3) + fromPoints;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6) ECONOMÍA — Monedas (Fútcoins)
// ═══════════════════════════════════════════════════════════════════════════
//
// Las monedas se ganan al resolver predicciones (acertar paga más), con el
// check-in diario y al abrir cofres. Se gastan en boosts.

export const COIN_NAME = "Fútcoins";

/** Monedas que otorga una predicción resuelta. */
export function coinsForResolved(pointsEarned: number, correct: boolean): number {
  if (correct) return 10 + Math.max(0, Math.round(pointsEarned * 0.25));
  return 1;
}

// ─── Catálogo de boosts (se compran con monedas) ─────────────────────────────
export type BoostId = "double_next" | "shield" | "streak_freeze" | "early_insight" | "mega_chain";

export interface BoostDef {
  id: BoostId;
  name: string;
  emoji: string;
  description: string;
  cost: number;            // en monedas
  /** Multiplica el puntaje base de la PRÓXIMA predicción que se resuelva. */
  scoreMultiplier?: number;
  /** Convierte puntos negativos en 0 (protección de confianza). */
  shieldsNegative?: boolean;
  /** Mantiene viva la racha aunque falles una vez. */
  freezesStreak?: boolean;
}

export const BOOST_CATALOG: Record<BoostId, BoostDef> = {
  double_next: {
    id: "double_next", name: "Doble o Nada", emoji: "✨", cost: 120,
    description: "Duplica el puntaje base de tu próxima predicción acertada.",
    scoreMultiplier: 2,
  },
  shield: {
    id: "shield", name: "Escudo", emoji: "🛡️", cost: 80,
    description: "Si fallas un 'Ganador con confianza', no pierdes puntos.",
    shieldsNegative: true,
  },
  streak_freeze: {
    id: "streak_freeze", name: "Congelar Racha", emoji: "❄️", cost: 100,
    description: "Conserva tu racha aunque falles una predicción.",
    freezesStreak: true,
  },
  early_insight: {
    id: "early_insight", name: "Ojo de Halcón", emoji: "🦅", cost: 60,
    description: "Revela el % de la comunidad antes de predecir (Modo Manada).",
  },
  mega_chain: {
    id: "mega_chain", name: "Cadena Extendida", emoji: "🔗", cost: 150,
    description: "Permite una cadena de hasta 7 eslabones en un partido (sin Premium).",
  },
};

export const BOOST_IDS: BoostId[] = ["double_next", "shield", "streak_freeze", "early_insight", "mega_chain"];

export function boostDef(id: string): BoostDef | null {
  return (BOOST_CATALOG as Record<string, BoostDef>)[id] ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) RACHAS REALES
// ═══════════════════════════════════════════════════════════════════════════
//
// Una predicción cuenta para la racha cuando se resuelve. La racha se rompe al
// fallar (salvo "Congelar Racha"). A partir de STREAK_THRESHOLD aciertos
// seguidos, la siguiente predicción acertada se multiplica (×1.5 en el motor).

export const STREAK_THRESHOLD = 3;

// Una racha ACTIVA caduca si el usuario no vuelve a predecir dentro de esta
// ventana. Crea la urgencia de "vuelve hoy o pierdes tu racha".
export const STREAK_WINDOW_HOURS = 24;
export const STREAK_WINDOW_MS = STREAK_WINDOW_HOURS * 3_600_000;

export interface StreakState {
  current: number;
  best: number;
  active: boolean; // current >= STREAK_THRESHOLD → bonus en la próxima
}

/** ¿La racha activa ya caducó por inactividad? */
export function streakExpired(expiresAt: string | null, current: number, now = new Date()): boolean {
  return current >= STREAK_THRESHOLD && !!expiresAt && now.getTime() >= new Date(expiresAt).getTime();
}

/** Horas (decimal) que faltan hasta un instante ISO; null si no hay fecha. */
export function hoursUntil(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now.getTime();
  return diff <= 0 ? 0 : diff / 3_600_000;
}

/**
 * Calcula la racha a partir de los resultados (correct?) en orden cronológico
 * de resolución. `frozen` indica si hay un "Congelar Racha" disponible para
 * absorber el primer fallo reciente.
 */
export function computeStreak(resultsChrono: boolean[], frozen = false): StreakState {
  let best = 0, run = 0;
  for (const ok of resultsChrono) {
    if (ok) { run++; best = Math.max(best, run); }
    else run = 0;
  }
  // racha "actual" = aciertos consecutivos al final.
  // FIX 7(a): si hay "Congelar Racha", absorbe UN fallo reciente: en vez de
  // cortar al primer !ok, lo saltamos una vez (consume el freeze) y seguimos
  // contando hacia atrás. `used` garantiza que solo se absorbe un fallo.
  let current = 0;
  let used = false;
  for (let i = resultsChrono.length - 1; i >= 0; i--) {
    if (resultsChrono[i]) current++;
    else {
      if (frozen && !used && current > 0) { used = true; continue; }
      break;
    }
  }
  return { current, best, active: current >= STREAK_THRESHOLD };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5) RECOMPENSA VARIABLE — Flash multiplier + Cofres
// ═══════════════════════════════════════════════════════════════════════════
//
// Flash: ventanas horarias deterministas (cambian cada hora) en las que un
// tipo de predicción aleatorio rinde ×1.5/×2. Crea el "¿estará activo ahora?"
// que engancha a abrir la app.

export interface FlashMultiplier {
  active: boolean;
  type: string | null;       // tipo de predicción potenciado (o "all")
  multiplier: number;        // 1, 1.5 o 2
  endsAt: string;            // ISO — fin de la ventana actual
  label: string;
}

const FLASH_TYPES = ["all", "exact_score", "winner", "first_scorer", "chain", "over_under", "minute_drama", "social"];

/** Estado del flash multiplier para "ahora" (ventanas horarias). */
export function flashMultiplier(now = new Date()): FlashMultiplier {
  const hourKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const rng = mulberry32(hashStr(`flash:${hourKey}`));
  const roll = rng();
  const endsAt = new Date(now);
  endsAt.setUTCMinutes(0, 0, 0);
  endsAt.setUTCHours(endsAt.getUTCHours() + 1);
  // 35% de las horas tienen flash activo.
  if (roll >= 0.35) {
    return { active: false, type: null, multiplier: 1, endsAt: endsAt.toISOString(), label: "Sin Hora Feliz ahora" };
  }
  const type = FLASH_TYPES[Math.floor(rng() * FLASH_TYPES.length)];
  const multiplier = rng() < 0.3 ? 2 : 1.5;
  return {
    active: true,
    type,
    multiplier,
    endsAt: endsAt.toISOString(),
    label: type === "all" ? `⚡ Hora Feliz: TODO ×${multiplier}` : `⚡ Hora Feliz: ${type} ×${multiplier}`,
  };
}

/** ¿Aplica el flash a este tipo de predicción ahora mismo? Devuelve el factor. */
export function flashFactorFor(type: string, now = new Date()): number {
  const f = flashMultiplier(now);
  if (!f.active) return 1;
  if (f.type === "all" || f.type === type) return f.multiplier;
  return 1;
}

// ─── Cofres (loot) ────────────────────────────────────────────────────────────
export type ChestRarity = "common" | "rare" | "epic" | "legendary";
export interface ChestReward {
  rarity: ChestRarity;
  coins: number;
  xp: number;
  boost: BoostId | null;
  label: string;
}

/** Abre un cofre de forma determinista por semilla (ej. "user:day:source"). */
export function openChest(seed: string): ChestReward {
  const rng = mulberry32(hashStr(`chest:${seed}`));
  const roll = rng();
  let rarity: ChestRarity;
  if (roll < 0.6) rarity = "common";
  else if (roll < 0.88) rarity = "rare";
  else if (roll < 0.98) rarity = "epic";
  else rarity = "legendary";

  const table: Record<ChestRarity, { coins: [number, number]; xp: [number, number]; boostChance: number; label: string }> = {
    common:    { coins: [10, 30],  xp: [5, 15],   boostChance: 0.1,  label: "Cofre Común" },
    rare:      { coins: [30, 70],  xp: [15, 30],  boostChance: 0.35, label: "Cofre Raro" },
    epic:      { coins: [70, 150], xp: [30, 60],  boostChance: 0.7,  label: "Cofre Épico" },
    legendary: { coins: [150, 300],xp: [60, 120], boostChance: 1,    label: "Cofre Legendario" },
  };
  const t = table[rarity];
  const coins = Math.round(t.coins[0] + rng() * (t.coins[1] - t.coins[0]));
  const xp = Math.round(t.xp[0] + rng() * (t.xp[1] - t.xp[0]));
  const boost = rng() < t.boostChance ? BOOST_IDS[Math.floor(rng() * BOOST_IDS.length)] : null;
  return { rarity, coins, xp, boost, label: t.label };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2) BUCLE DIARIO — Check-in + Reto diario
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyReward {
  day: number;      // posición en la cadena de 7 días
  coins: number;
  xp: number;
  chest: boolean;   // el 7º día regala cofre
}

/** Recompensa del check-in según los días seguidos (cadena de 7, luego repite). */
export function dailyCheckinReward(consecutiveDays: number): DailyReward {
  const day = ((Math.max(1, consecutiveDays) - 1) % 7) + 1;
  const coins = 10 + (day - 1) * 5;      // 10,15,20,25,30,35,40
  const xp = 5 + (day - 1) * 3;
  return { day, coins, xp, chest: day === 7 };
}

export interface DailyChallenge {
  key: string;          // "exact_score", "streak2", "any3", ...
  title: string;
  description: string;
  emoji: string;
  rewardCoins: number;
  rewardXp: number;
}

const CHALLENGE_POOL: Omit<DailyChallenge, "rewardCoins" | "rewardXp">[] = [
  { key: "make_3", title: "Triplete", emoji: "🎯", description: "Haz 3 predicciones hoy." },
  { key: "exact_score", title: "Bola de Cristal", emoji: "🔮", description: "Haz una predicción de Resultado Exacto." },
  { key: "contrarian", title: "Contra la Manada", emoji: "🐑", description: "Haz una predicción contrarian en Modo Manada." },
  { key: "high_conf", title: "Todo o Nada", emoji: "🔥", description: "Apuesta una confianza ×3 en un Ganador." },
  { key: "chain", title: "Narrador", emoji: "🔗", description: "Crea una Predicción Encadenada." },
  { key: "diamond", title: "Cazador de Diamantes", emoji: "💎", description: "Predice en un partido Diamante (×2)." },
  { key: "early", title: "Madrugador", emoji: "🐦", description: "Predice un partido 24h+ antes (early bird)." },
];

/** Reto del día (rotación determinista por fecha UTC). */
export function dailyChallenge(now = new Date()): DailyChallenge {
  const rng = mulberry32(hashStr(`challenge:${utcDayKey(now)}`));
  const pick = CHALLENGE_POOL[Math.floor(rng() * CHALLENGE_POOL.length)];
  return { ...pick, rewardCoins: 50, rewardXp: 40 };
}

/** Señales de una predicción recién creada que pueden avanzar el reto del día. */
export interface ChallengeSignals {
  predictionType: string;
  isContrarian: boolean;
  confidence: number;
  matchMult: number;
  isEarlyBird: boolean;
}

/** Cuántos "pasos" pide cada reto para considerarse completo. */
export function challengeTarget(key: string): number {
  return key === "make_3" ? 3 : 1;
}

/** Cuánto avanza el reto `key` con esta predicción (0 = no cuenta). */
export function challengeIncrement(key: string, s: ChallengeSignals): number {
  switch (key) {
    case "make_3":
      return 1;
    case "exact_score":
      return s.predictionType === "exact_score" ? 1 : 0;
    case "contrarian":
      return s.isContrarian ? 1 : 0;
    case "high_conf":
      return s.predictionType === "winner" && s.confidence >= 3 ? 1 : 0;
    case "chain":
      return s.predictionType === "chain" ? 1 : 0;
    case "diamond":
      return s.matchMult >= 2 ? 1 : 0;
    case "early":
      return s.isEarlyBird ? 1 : 0;
    default:
      return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) PROGRESIÓN — Logros
// ═══════════════════════════════════════════════════════════════════════════
//
// Snapshot de stats del usuario que evalúa qué logros desbloquea. El store
// construye este snapshot tras cada resolución y persiste los nuevos.

export interface AchievementStats {
  totalPredictions: number;
  correctPredictions: number;
  totalPoints: number;
  bestStreak: number;
  perfectMatches: number;
  contrarianHits: number;
  exactScoreHits: number;
  chainJackpots: number;       // cadenas completas
  diamondHits: number;         // aciertos en partidos ×2
  level: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  check: (s: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_blood", name: "Primer Acierto", emoji: "✅", description: "Acierta tu primera predicción.", rewardCoins: 30, rewardXp: 20, check: (s) => s.correctPredictions >= 1 },
  { id: "ten_correct", name: "En Forma", emoji: "📈", description: "Acierta 10 predicciones.", rewardCoins: 60, rewardXp: 40, check: (s) => s.correctPredictions >= 10 },
  { id: "fifty_correct", name: "Especialista", emoji: "🎖️", description: "Acierta 50 predicciones.", rewardCoins: 150, rewardXp: 100, check: (s) => s.correctPredictions >= 50 },
  { id: "streak_3", name: "Racha Caliente", emoji: "🔥", description: "Consigue una racha de 3.", rewardCoins: 50, rewardXp: 30, check: (s) => s.bestStreak >= 3 },
  { id: "streak_7", name: "Imparable", emoji: "🌋", description: "Consigue una racha de 7.", rewardCoins: 120, rewardXp: 80, check: (s) => s.bestStreak >= 7 },
  { id: "perfect_match", name: "Partido Perfecto", emoji: "💯", description: "Acierta los 8 tipos de un partido.", rewardCoins: 300, rewardXp: 200, check: (s) => s.perfectMatches >= 1 },
  { id: "oracle_score", name: "Bola de Cristal", emoji: "🔮", description: "Clava 5 resultados exactos.", rewardCoins: 100, rewardXp: 70, check: (s) => s.exactScoreHits >= 5 },
  { id: "jackpot", name: "Jackpot", emoji: "🎰", description: "Completa una cadena entera.", rewardCoins: 200, rewardXp: 150, check: (s) => s.chainJackpots >= 1 },
  { id: "lone_wolf", name: "Lobo Solitario", emoji: "🐺", description: "Acierta 5 predicciones contrarian.", rewardCoins: 120, rewardXp: 90, check: (s) => s.contrarianHits >= 5 },
  { id: "diamond_hands", name: "Manos de Diamante", emoji: "💎", description: "Acierta 3 partidos Diamante.", rewardCoins: 150, rewardXp: 110, check: (s) => s.diamondHits >= 3 },
  { id: "level_10", name: "Estratega", emoji: "🧠", description: "Alcanza el nivel 10.", rewardCoins: 200, rewardXp: 0, check: (s) => s.level >= 10 },
  { id: "point_1000", name: "Cuatro Cifras", emoji: "🏆", description: "Acumula 1000 puntos.", rewardCoins: 250, rewardXp: 0, check: (s) => s.totalPoints >= 1000 },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Devuelve los logros recién desbloqueados (no presentes en `unlocked`). */
export function newlyUnlocked(stats: AchievementStats, unlocked: Set<string>): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(stats));
}

// ═══════════════════════════════════════════════════════════════════════════
// 4) COMPETENCIA SOCIAL — Helpers de ligas / duelos 1v1
// ═══════════════════════════════════════════════════════════════════════════

/** Código corto para invitar a una liga privada (determinista por semilla). */
export function leagueCode(seed: string): string {
  const rng = mulberry32(hashStr(`league:${seed}`));
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alpha[Math.floor(rng() * alpha.length)];
  return code;
}

export type DuelOutcome = "challenger" | "opponent" | "draw";
/** Resuelve un duelo 1v1 comparando puntos en una ventana. */
export function resolveDuelScore(challengerPoints: number, opponentPoints: number): DuelOutcome {
  if (challengerPoints > opponentPoints) return "challenger";
  if (opponentPoints > challengerPoints) return "opponent";
  return "draw";
}

/** Inicio (lunes 00:00 UTC) de la semana ISO de una fecha — para leaderboard semanal. */
export function weekStart(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // lunes = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}
