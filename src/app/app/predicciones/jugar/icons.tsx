"use client";

// Mapeo central de iconos SVG (lucide-react) para el módulo de Predicciones.
// La capa de datos (backend) sigue almacenando IDs estables; aquí los traducimos
// a componentes SVG profesionales. Nada de emojis en la UI.

import {
  ArrowLeft, Award, BarChart3, Bird, Brain, Calendar, Check, CheckCircle2,
  ChevronRight, Circle, Clock, Coins, Crosshair, Crown, Dices, Eye, Flame, Gem, Gift, Globe, Goal,
  Link2, Lock, Medal, Pencil, PawPrint, Radio, Rocket, ShieldCheck, ShoppingCart,
  Snowflake, Sparkles, Star, Swords, Target, Timer, TrendingDown, TrendingUp, Trophy, Users,
  X, Zap,
  type LucideIcon,
} from "lucide-react";

import type { PredictionType } from "@/lib/predictions/types";

// ─── Tipos de predicción ─────────────────────────────────────────────────────
export const TYPE_ICON: Record<PredictionType, LucideIcon> = {
  exact_score: Goal,
  winner: Trophy,
  first_scorer: Zap,
  chain: Link2,
  duel: Swords,
  over_under: BarChart3,
  minute_drama: Timer,
  social: Users,
};

// ─── Logros ──────────────────────────────────────────────────────────────────
export const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  first_blood: CheckCircle2,
  ten_correct: TrendingUp,
  fifty_correct: Medal,
  streak_3: Flame,
  streak_7: Rocket,
  perfect_match: Target,
  oracle_score: Sparkles,
  jackpot: Dices,
  lone_wolf: PawPrint,
  diamond_hands: Gem,
  level_10: Brain,
  point_1000: Trophy,
};

// ─── Boosts ──────────────────────────────────────────────────────────────────
export const BOOST_ICON: Record<string, LucideIcon> = {
  double_next: Sparkles,
  shield: ShieldCheck,
  streak_freeze: Snowflake,
  early_insight: Eye,
  mega_chain: Link2,
};

// ─── Retos diarios ───────────────────────────────────────────────────────────
export const CHALLENGE_ICON: Record<string, LucideIcon> = {
  make_3: Target,
  exact_score: Sparkles,
  contrarian: Users,
  high_conf: Flame,
  chain: Link2,
  diamond: Gem,
  early: Bird,
};

// ─── Tiers "Modo Underdog" ───────────────────────────────────────────────────
export const TIER_ICON: Record<string, LucideIcon> = {
  Estelar: Circle,
  Bronce: Award,
  Oro: Star,
  Diamante: Gem,
};

// ─── El Oráculo (icono propio: ojo con balón de iris y destellos) ────────────
export function OracleIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* párpados */}
      <path d="M2.2 12c2.8-4.6 6-6.9 9.8-6.9s7 2.3 9.8 6.9c-2.8 4.6-6 6.9-9.8 6.9S5 16.6 2.2 12Z" />
      {/* iris-balón: pentágono central y radios */}
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 9.4v1.5M9.4 11.2l1.3.9M14.6 11.2l-1.3.9M10.5 14.7l.7-1.3M13.5 14.7l-.7-1.3" strokeWidth="1.3" />
      {/* destellos de clarividencia */}
      <path d="M12 2.2v1.4M4.4 4.9l1 1M19.6 4.9l-1 1" strokeWidth="1.3" />
    </svg>
  );
}

// Iconos sueltos reutilizados por la UI.
export {
  ArrowLeft, Award, Brain, Calendar, Check, CheckCircle2, ChevronRight, Circle, Clock, Coins,
  Crosshair, Crown, Eye, Flame, Gem, Gift, Globe, Goal, Lock, Medal, Pencil, Radio,
  ShieldCheck, ShoppingCart, Snowflake, Sparkles, Star, Swords, Timer, Trophy,
  TrendingDown, TrendingUp, Users, X, Zap,
};
