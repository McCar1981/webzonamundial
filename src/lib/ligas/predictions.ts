// src/lib/ligas/predictions.ts
//
// Capa de datos (lado usuario) de las predicciones 1X2 de Zona de Ligas. Usa el
// cliente de servidor AUTENTICADO (respeta RLS: cada quien ve/crea solo lo suyo).
// La resolución y el abono de Fútcoins los hace el cron con service role.
//
// TODO fail-soft: si la migración 2026-42 aún no está aplicada (tabla ausente,
// código Postgres 42P01), las funciones devuelven un estado "not_available" en
// vez de reventar — así este código puede vivir en prod dormido hasta que se
// aplique el SQL, sin romper nada.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TYPED_MARKETS, type TypedMarket, type MarketData } from "./predict-markets";

export type LigaPick = "home" | "draw" | "away";
export type LigaMarket = "1x2" | "exact" | TypedMarket;

export function isMissingTable(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: string }).code === "42P01";
}

// 42703 = columna inexistente: la migración 2026-44 (mercado exacto) aún no está
// aplicada. Igual de fail-soft que la tabla ausente.
export function isMissingColumn(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: string }).code === "42703";
}

export type SavePickResult = { ok: boolean; reason?: "exists" | "not_available" | "error" };

export async function savePick(
  userId: string,
  fixtureId: number,
  competitionSlug: string,
  pick: LigaPick,
  kickoffIso: string,
): Promise<SavePickResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("liga_predictions").insert({
    user_id: userId,
    fixture_id: fixtureId,
    competition_slug: competitionSlug,
    pick,
    kickoff: kickoffIso,
  });
  if (!error) return { ok: true };
  if ((error as { code?: string }).code === "23505") return { ok: false, reason: "exists" }; // unique_violation
  if (isMissingTable(error)) return { ok: false, reason: "not_available" };
  console.error("[liga-predictions] savePick failed:", error.message);
  return { ok: false, reason: "error" };
}

export async function getUserPick(userId: string, fixtureId: number): Promise<LigaPick | null> {
  const supa = createSupabaseServerClient();
  // `pick not null` en vez de filtrar por market: excluye las filas de marcador
  // exacto (pick NULL) tras la migración 2026-44 y sigue funcionando si la
  // columna market aún no existe. maybeSingle queda a salvo en ambos mundos.
  const { data, error } = await supa
    .from("liga_predictions")
    .select("pick")
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId)
    .not("pick", "is", null)
    .maybeSingle();
  if (error) return null; // incluye tabla ausente: la UI cae a la encuesta anónima
  return (data as { pick?: LigaPick } | null)?.pick ?? null;
}

// ─── Mercado "marcador exacto" (migración 2026-44) ───────────────────────────

export async function saveScorePick(
  userId: string,
  fixtureId: number,
  competitionSlug: string,
  scoreHome: number,
  scoreAway: number,
  kickoffIso: string,
): Promise<SavePickResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("liga_predictions").insert({
    user_id: userId,
    fixture_id: fixtureId,
    competition_slug: competitionSlug,
    market: "exact",
    score_home: scoreHome,
    score_away: scoreAway,
    kickoff: kickoffIso,
  });
  if (!error) return { ok: true };
  if ((error as { code?: string }).code === "23505") return { ok: false, reason: "exists" };
  if (isMissingTable(error) || isMissingColumn(error)) return { ok: false, reason: "not_available" };
  console.error("[liga-predictions] saveScorePick failed:", error.message);
  return { ok: false, reason: "error" };
}

export async function getUserScorePick(
  userId: string,
  fixtureId: number,
): Promise<{ home: number; away: number } | null> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("liga_predictions")
    .select("score_home,score_away")
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId)
    .eq("market", "exact")
    .maybeSingle();
  if (error || !data) return null; // incluye tabla/columna ausente
  const row = data as { score_home: number | null; score_away: number | null };
  if (row.score_home == null || row.score_away == null) return null;
  return { home: row.score_home, away: row.score_away };
}

// ─── Mercados tipados (migración 2026-47): ou_goals / first_goal / btts ──────

/** Guarda un pick de mercado tipado (payload en `data jsonb`). */
export async function saveTypedPick(
  userId: string,
  fixtureId: number,
  competitionSlug: string,
  market: TypedMarket,
  data: MarketData,
  kickoffIso: string,
): Promise<SavePickResult> {
  const supa = createSupabaseServerClient();
  const { error } = await supa.from("liga_predictions").insert({
    user_id: userId,
    fixture_id: fixtureId,
    competition_slug: competitionSlug,
    market,
    data,
    kickoff: kickoffIso,
  });
  if (!error) return { ok: true };
  if ((error as { code?: string }).code === "23505") return { ok: false, reason: "exists" };
  // 23514 = el CHECK de `market` aún no incluye este mercado (migración A2b sin
  // aplicar) -> degradar limpio como "no disponible", nunca 500.
  if ((error as { code?: string }).code === "23514") return { ok: false, reason: "not_available" };
  if (isMissingTable(error) || isMissingColumn(error)) return { ok: false, reason: "not_available" };
  console.error("[liga-predictions] saveTypedPick failed:", error.message);
  return { ok: false, reason: "error" };
}

/** Picks tipados del usuario para un partido: mapa market -> data guardado. */
export async function getUserTypedPicks(
  userId: string,
  fixtureId: number,
): Promise<Partial<Record<TypedMarket, MarketData>>> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("liga_predictions")
    .select("market,data")
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId)
    .in("market", TYPED_MARKETS as unknown as string[]);
  if (error || !data) return {}; // tabla/columna ausente: la UI simplemente no ofrece los mercados
  const out: Partial<Record<TypedMarket, MarketData>> = {};
  for (const row of data as { market: TypedMarket; data: MarketData | null }[]) {
    if (row.data) out[row.market] = row.data;
  }
  return out;
}

export type LigaPredictionStatus = "pending" | "won" | "lost" | "void";

export interface LigaPredictionRow {
  fixtureId: number;
  competitionSlug: string;
  market: LigaMarket;
  pick: LigaPick | null; // null en el mercado exacto
  scoreHome: number | null; // solo mercado exacto
  scoreAway: number | null;
  status: LigaPredictionStatus;
  kickoff: string;
  resolvedAt: string | null;
}

interface RawHistoryRow {
  fixture_id: number;
  competition_slug: string;
  market?: LigaMarket | null;
  pick: LigaPick | null;
  score_home?: number | null;
  score_away?: number | null;
  status: LigaPredictionStatus;
  kickoff: string;
  resolved_at: string | null;
}

function mapHistoryRow(r: RawHistoryRow): LigaPredictionRow {
  return {
    fixtureId: r.fixture_id,
    competitionSlug: r.competition_slug,
    market: r.market ?? "1x2",
    pick: r.pick ?? null,
    scoreHome: r.score_home ?? null,
    scoreAway: r.score_away ?? null,
    status: r.status,
    kickoff: r.kickoff,
    resolvedAt: r.resolved_at,
  };
}

// Historial de predicciones de ligas del usuario (RLS: solo las suyas). Fail-soft
// a [] (tabla ausente). Ordenadas de más reciente a más antigua. Si la migración
// 2026-44 no está aplicada (columna market ausente), reintenta con el select
// legado para que el historial 1X2 nunca desaparezca.
export async function getUserLigaPredictions(userId: string, limit = 30): Promise<LigaPredictionRow[]> {
  const supa = createSupabaseServerClient();
  const { data, error } = await supa
    .from("liga_predictions")
    .select("fixture_id,competition_slug,market,pick,score_home,score_away,status,kickoff,resolved_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!error && data) return (data as RawHistoryRow[]).map(mapHistoryRow);
  if (isMissingColumn(error)) {
    const legacy = await supa
      .from("liga_predictions")
      .select("fixture_id,competition_slug,pick,status,kickoff,resolved_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (legacy.error || !legacy.data) return [];
    return (legacy.data as RawHistoryRow[]).map(mapHistoryRow);
  }
  return [];
}
