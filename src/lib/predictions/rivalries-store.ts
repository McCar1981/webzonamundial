// Mejora I: rivalidades 1v1 persistentes.
//
// Agrega el historial cara a cara entre dos usuarios a partir de los duelos
// resueltos (prediction_duels). Una sola fila por pareja en orden canónico
// (user_low < user_high). `recordDuelResult` se llama desde la resolución de
// duelos; `myRivalries` lo lee desde la perspectiva del usuario.
//
// Server-only. Importa solo admin + cosmetics-store (sin ciclo con gamification-store).

import { adminClient } from "./admin";
import { cosmeticsByUser } from "./cosmetics-store";
import type { CosmeticDisplay } from "./cosmetics";

/** Orden canónico de la pareja: el id menor es `low`. */
function pairKey(a: string, b: string): { low: string; high: string } {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

interface RivalryRow {
  user_low: string; user_high: string;
  wins_low: number; wins_high: number; draws: number; duels_count: number;
  points_low: number; points_high: number;
  streak_holder: string | null; streak_len: number;
  last_match_id: string | null; last_winner_id: string | null; last_duel_at: string | null;
}

/**
 * Acumula el resultado de un duelo resuelto en la rivalidad de la pareja.
 * Idempotencia: NO se reintenta por diseño — la resolución de un duelo corre
 * una sola vez (status pasa a 'resolved' y no se vuelve a procesar).
 */
export async function recordDuelResult(opts: {
  challengerId: string;
  opponentId: string;
  challengerPoints: number;
  opponentPoints: number;
  winnerId: string | null;
  matchId: string;
}): Promise<void> {
  const admin = adminClient();
  const { low, high } = pairKey(opts.challengerId, opts.opponentId);

  // Puntos en perspectiva low/high.
  const pointsLow = opts.challengerId === low ? opts.challengerPoints : opts.opponentPoints;
  const pointsHigh = opts.challengerId === high ? opts.challengerPoints : opts.opponentPoints;

  const { data } = await admin
    .from("prediction_rivalries")
    .select("*")
    .eq("user_low", low).eq("user_high", high)
    .maybeSingle();
  const prev = (data as RivalryRow | null);

  const winsLow = (prev?.wins_low ?? 0) + (opts.winnerId === low ? 1 : 0);
  const winsHigh = (prev?.wins_high ?? 0) + (opts.winnerId === high ? 1 : 0);
  const draws = (prev?.draws ?? 0) + (opts.winnerId === null ? 1 : 0);

  // Racha: si hay empate se corta; si gana el mismo de antes, suma; si cambia, reinicia a 1.
  let streakHolder: string | null;
  let streakLen: number;
  if (opts.winnerId === null) {
    streakHolder = null; streakLen = 0;
  } else if (prev?.streak_holder === opts.winnerId) {
    streakHolder = opts.winnerId; streakLen = (prev?.streak_len ?? 0) + 1;
  } else {
    streakHolder = opts.winnerId; streakLen = 1;
  }

  await admin.from("prediction_rivalries").upsert({
    user_low: low,
    user_high: high,
    wins_low: winsLow,
    wins_high: winsHigh,
    draws,
    duels_count: (prev?.duels_count ?? 0) + 1,
    points_low: (prev?.points_low ?? 0) + pointsLow,
    points_high: (prev?.points_high ?? 0) + pointsHigh,
    streak_holder: streakHolder,
    streak_len: streakLen,
    last_match_id: opts.matchId,
    last_winner_id: opts.winnerId,
    last_duel_at: new Date().toISOString(),
  }, { onConflict: "user_low,user_high" });
}

export interface RivalryView {
  opponent: { id: string; name: string; avatar_url: string | null; cosmetics: CosmeticDisplay | null };
  duels_count: number;
  my_wins: number;
  their_wins: number;
  draws: number;
  my_points: number;
  their_points: number;
  lead: "me" | "them" | "even";
  streak: { holder: "me" | "them" | null; len: number };
  last_match_id: string | null;
  last_duel_at: string | null;
}

/**
 * Rivalidades del usuario, desde su perspectiva. Ordenadas por nº de duelos
 * (las némesis más asentadas primero).
 */
export async function myRivalries(uid: string): Promise<RivalryView[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_rivalries")
    .select("*")
    .or(`user_low.eq.${uid},user_high.eq.${uid}`)
    .order("duels_count", { ascending: false });
  const rows = (data as RivalryRow[] | null) ?? [];
  if (!rows.length) return [];

  const oppIds = rows.map((r) => (r.user_low === uid ? r.user_high : r.user_low));
  const [profiles, cmap] = await Promise.all([
    admin.from("profiles").select("id,username,avatar_url").in("id", oppIds),
    cosmeticsByUser(oppIds),
  ]);
  const profMap = new Map<string, { username: string | null; avatar_url: string | null }>();
  for (const p of (profiles.data ?? []) as { id: string; username: string | null; avatar_url: string | null }[]) {
    profMap.set(p.id, { username: p.username, avatar_url: p.avatar_url });
  }

  return rows.map((r) => {
    const meIsLow = r.user_low === uid;
    const oppId = meIsLow ? r.user_high : r.user_low;
    const myWins = meIsLow ? r.wins_low : r.wins_high;
    const theirWins = meIsLow ? r.wins_high : r.wins_low;
    const myPoints = meIsLow ? r.points_low : r.points_high;
    const theirPoints = meIsLow ? r.points_high : r.points_low;
    const lead: "me" | "them" | "even" = myWins > theirWins ? "me" : theirWins > myWins ? "them" : "even";
    const holder: "me" | "them" | null =
      r.streak_holder == null ? null : r.streak_holder === uid ? "me" : "them";
    const prof = profMap.get(oppId);
    return {
      opponent: {
        id: oppId,
        name: prof?.username?.trim() || "Rival",
        avatar_url: prof?.avatar_url ?? null,
        cosmetics: cmap.get(oppId) ?? null,
      },
      duels_count: r.duels_count,
      my_wins: myWins,
      their_wins: theirWins,
      draws: r.draws,
      my_points: myPoints,
      their_points: theirPoints,
      lead,
      streak: { holder, len: r.streak_len },
      last_match_id: r.last_match_id,
      last_duel_at: r.last_duel_at,
    };
  });
}
