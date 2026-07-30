// Taxonomía canónica de eventos de producto de Zona de Ligas.
//
// Este módulo es puro (sin window/React) para poder:
//   - compartir nombres y payloads entre componentes;
//   - validar los contratos con un test determinista;
//   - versionar el esquema sin depender de GA4.
//
// No se envían nombres, emails ni el pronóstico concreto del usuario. El user_id
// pseudónimo ya se configura globalmente cuando existe sesión.

export const PRODUCT_ANALYTICS_SCHEMA_VERSION = 1;

export type AnalyticsPrimitive = string | number | boolean;
export type MatchState = "scheduled" | "live" | "finished" | "interrupted" | "unknown";
export type MatchSurface = "match_center" | "match_poll" | "advanced_markets";
export type ClubSurface = "ligas_hub" | "club_page";

export type PredictionMarket =
  | "1x2"
  | "exact"
  | "ou_goals"
  | "first_goal"
  | "btts"
  | "ou_corners"
  | "ou_cards"
  | "first_goal_half"
  | "first_scorer"
  | "duel"
  | "chain";

export interface MatchEventContext {
  fixture_id: number;
  competition_slug: string;
  match_state: MatchState;
}

export interface ProductEventParams {
  matchday_opened: MatchEventContext & {
    surface: "match_center";
    home_team_id: number;
    away_team_id: number;
  };
  prediction_submitted: MatchEventContext & {
    surface: "match_poll" | "advanced_markets";
    market: PredictionMarket;
  };
  community_vote_submitted: MatchEventContext & {
    surface: "match_poll";
    authenticated: boolean;
  };
  club_followed: {
    club_id: number;
    competition_slug?: string;
    surface: ClubSurface;
  };
  club_unfollowed: {
    club_id: number;
    competition_slug?: string;
    surface: ClubSurface;
  };
  competition_preferences_updated: {
    selection_count: number;
    added_count: number;
    removed_count: number;
    surface: "ligas_hub";
  };
}

export type ProductEventName = keyof ProductEventParams;

export interface BuiltProductEvent<Name extends ProductEventName = ProductEventName> {
  name: Name;
  params: Record<string, AnalyticsPrimitive>;
}

const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);
const SCHEDULED = new Set(["NS", "TBD"]);
const INTERRUPTED = new Set(["PST", "CANC", "ABD", "AWD", "WO", "SUSP"]);

export function matchStateFromApiStatus(status: string): MatchState {
  const normalized = String(status || "").trim().toUpperCase();
  if (SCHEDULED.has(normalized)) return "scheduled";
  if (LIVE.has(normalized)) return "live";
  if (FINISHED.has(normalized)) return "finished";
  if (INTERRUPTED.has(normalized)) return "interrupted";
  return "unknown";
}

export function buildProductEvent<Name extends ProductEventName>(
  name: Name,
  params: ProductEventParams[Name],
): BuiltProductEvent<Name> {
  const clean: Record<string, AnalyticsPrimitive> = {
    event_schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
    product_area: "zona_de_ligas",
    sport: "football",
  };

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
    }
  }

  return { name, params: clean };
}
