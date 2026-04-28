/**
 * BIBLIA Mundial 2026 — TypeScript Types
 *
 * Tipos oficiales para fichas de selección.
 * Importar en zonamundial-web: import type { NationalTeam } from '@/types/team'
 *
 * Schema version: 1.0.0
 * Última actualización: 2026-04-28
 */

// ============================================================================
// ROOT INTERFACE
// ============================================================================

export interface NationalTeam {
  // === META ===
  slug: string;
  iso: string;
  iso3: string;
  name_es: string;
  name_en?: string;
  name_local?: string;
  nicknames?: string[];

  // === IDENTIDAD VISUAL ===
  flag?: {
    colors: TeamColors;
  };

  // === PAÍS Y FEDERACIÓN ===
  country?: Country;
  federation?: Federation;

  // === FIFA / CONFEDERACIÓN ===
  confederation: Confederation;
  fifa_ranking?: FifaRanking;

  // === EQUIPACIÓN ===
  kit?: Kit;

  // === MUNDIAL 2026 ===
  wc_2026?: WorldCup2026;

  // === HISTORIA ===
  history?: TeamHistory;

  // === RÉCORDS ===
  records?: TeamRecords;

  // === STORYTELLING ===
  iconic_matches?: IconicMatch[];
  curiosities?: Trivia[];
  fan_culture?: FanCulture;

  // === SEO ===
  seo?: SeoData;

  // === META DE LA FICHA ===
  _meta: TeamMeta;
}

// ============================================================================
// CONFEDERATION
// ============================================================================

export type Confederation =
  | "UEFA"
  | "CONMEBOL"
  | "CAF"
  | "AFC"
  | "CONCACAF"
  | "OFC";

// ============================================================================
// COLORS & IDENTITY
// ============================================================================

export interface TeamColors {
  primary: string;        // hex #RRGGBB
  secondary: string;
  tertiary?: string;
  contrast_text: string;
}

// ============================================================================
// COUNTRY & FEDERATION
// ============================================================================

export interface Country {
  capital: string;
  language_official: string[];
  population: number;
  area_km2: number;
  timezone: string;
  continent: string;
}

export interface Federation {
  name: string;
  abbreviation: string;
  founded: number;
  headquarters: string;
  website: string;
}

export interface FifaRanking {
  current: number;
  last_updated: string;     // ISO date
  all_time_high?: { rank: number; date: string };
  all_time_low?: { rank: number; date: string };
}

// ============================================================================
// KIT
// ============================================================================

export interface Kit {
  wc_2026: {
    brand: string;
    season: string;
    home: KitVariant;
    away: KitVariant;
    third?: KitVariant;
  };
  trivia?: Trivia[];
}

export interface KitVariant {
  front_url: string | null;
  back_url: string | null;
  primary_color: string;
  secondary_color: string;
  description: string;
  alt_text: string;
}

// ============================================================================
// WORLD CUP 2026
// ============================================================================

export interface WorldCup2026 {
  qualified_via: "host" | "direct" | "playoff_intercontinental" | "playoff_uefa";
  qualifying_summary: string;
  qualifying: QualifyingData;
  group_2026: Group2026;
  schedule: WCMatch2026[];
  base_camp?: BaseCamp;
  coach: Coach;
  captain: { name: string; club: string };
  star_player: { name: string; club: string; reason: string };
  likely_squad?: Player[];
  starting_xi?: StartingXI;
  analysis?: Analysis;
}

export interface QualifyingData {
  confederation_round: string;
  format?: string;
  duration?: string;
  final_position: number;
  total_teams_in_group: number;
  stats: MatchStats;
  coach_during_qualifying: string;
  matches: QualifyingMatch[];
  top_scorers: Array<{
    player: string;
    goals: number;
    notes?: string;
  }>;
  best_match: { match_ref: string; reason: string };
  worst_match: { match_ref: string; reason: string };
  decisive_match: { match_ref: string; reason: string };
}

export interface MatchStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference?: number;
  points?: number;
  win_percentage?: number;
  clean_sheets?: number;
}

export interface QualifyingMatch {
  matchday: number;
  date: string;
  home: MatchTeam;
  away: MatchTeam;
  venue: Venue;
  goals_arg?: Goal[];
  goals_opponent?: Goal[];
  notes?: string;
  is_decisive_match?: boolean;
}

export interface MatchTeam {
  iso: string;
  name: string;
  score: number;
}

export interface Venue {
  stadium: string;
  city: string;
  country_iso?: string;
}

export interface Goal {
  player: string;
  minute: string;
  type?: "goal" | "penalty" | "og" | "freekick";
}

export interface Group2026 {
  letter: string;
  label?: string;
  teams: Array<{
    iso: string;
    name: string;
    fifa_rank: number | null;
    is_seed?: boolean;
  }>;
  notes?: string;
}

export interface WCMatch2026 {
  matchday: 1 | 2 | 3;
  opponent: { iso: string; name: string };
  date: string;
  kickoff_local?: string;
  kickoff_madrid?: string;
  venue?: { stadium: string; city: string; country_iso?: string };
  status: "scheduled" | "live" | "finished";
}

export interface BaseCamp {
  city: string;
  country: string;
  facility_name?: string;
  coordinates?: [number, number];
  status: "confirmed" | "needs_review" | "pending";
}

export interface Coach {
  name: string;
  age?: number;
  nationality: string;
  since?: string;
  previous_teams?: string[];
  profile_summary?: string;
}

export interface Player {
  id?: string;
  full_name: string;
  display_name?: string;
  birthdate?: string;
  age?: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  detailed_position?: string;
  club: { name: string; country_iso: string; league: string };
  shirt_number_expected?: number;
  caps?: number;
  goals_national?: number;
  market_value_eur?: number;
  status: "fixed" | "probable" | "bubble";
  photo_url?: string;
}

export interface StartingXI {
  formation: string;
  players: Array<{
    player_id: string;
    position: { x: number; y: number };
  }>;
}

export interface Analysis {
  style: string;
  strengths: string[];
  weaknesses: string[];
  x_factor: { player: string; reason: string };
  prediction_text: string;
  probabilities: {
    advance_groups: number;
    round_of_32: number;
    round_of_16: number;
    quarter_finals: number;
    semi_finals: number;
    final: number;
    champion: number;
  };
  vs_last_3_wcs?: string;
}

// ============================================================================
// HISTORY
// ============================================================================

export interface TeamHistory {
  first_appearance: number;
  appearances_count_before_2026: number;
  appearances_count_with_2026: number;
  consecutive_streak_since: number | null;
  titles: number;
  titles_years: number[];
  finals: number;
  finals_years: number[];
  semi_finals: number;
  best_result: string;
  aggregate_stats_through_2022: AggregateStats;
  by_world_cup?: WorldCupParticipation[];
  palmares?: Trophy[];
}

export interface AggregateStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  win_percentage: number;
  notes?: string;
}

export interface WorldCupParticipation {
  year: number;
  host: { countries: string[]; iso: string[] };
  result: string;
  group?: string;
  coach: string;
  captain?: string;
  squad_size?: number;
  matches: WorldCupMatch[];
  team_top_scorers: Array<{ player: string; goals: number }>;
  goals_scored: number;
  goals_conceded: number;
  notable_facts: string[];
  narrative: string;
  hero_image_url?: string;
}

export interface WorldCupMatch {
  date: string;
  stage: string;
  opponent: { iso: string; name: string };
  result: {
    our: number;
    them: number;
    ot?: boolean;
    pen?: { our: number; them: number };
  };
  venue: Venue;
  goals_for?: Goal[];
  goals_against?: Goal[];
  attendance?: number;
}

export interface Trophy {
  competition: string;
  year: number;
  position: "Campeón" | "Subcampeón" | "Tercero" | "Cuarto";
  host: string;
}

// ============================================================================
// RECORDS
// ============================================================================

export interface TeamRecords {
  top_scorer_history?: PlayerRecord;
  most_capped?: PlayerRecord;
  youngest_debut?: PlayerRecord;
  biggest_win?: MatchRecord;
  worst_loss?: MatchRecord;
}

export interface PlayerRecord {
  name: string;
  value: number | string;
  period?: string;
  notes?: string;
}

export interface MatchRecord {
  result: string;
  opponent: string;
  date: string;
  competition: string;
}

// ============================================================================
// STORYTELLING
// ============================================================================

export interface IconicMatch {
  title: string;
  date: string;
  opponent: { iso: string; name: string };
  score: string;
  competition: string;
  narrative: string;
  image_url?: string;
  site_link?: string;
}

export interface Trivia {
  text: string;
  source: string;
  verified_at: string;
  status: "validated" | "needs_review" | "single_source" | "pending" | "discarded";
}

export interface FanCulture {
  famous_chants?: string[];
  main_rival?: { iso: string; name: string; story: string };
  home_stadium?: { name: string; capacity: number; city: string };
}

// ============================================================================
// SEO
// ============================================================================

export interface SeoData {
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  schema_org: Record<string, unknown>;
}

// ============================================================================
// META
// ============================================================================

export interface TeamMeta {
  schema_version: string;
  last_updated: string;
  sources_validated?: string[];
  validation_method?: string;
  review_status: "draft" | "validated" | "published";
  completion_status?: Record<
    string,
    "complete" | "partial" | "needs_review" | "pending"
  >;
}
