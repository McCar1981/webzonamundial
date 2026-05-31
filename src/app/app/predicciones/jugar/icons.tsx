"use client";

// Mapeo central de iconos SVG (lucide-react) para el módulo de Predicciones.
// La capa de datos (backend) sigue almacenando IDs estables; aquí los traducimos
// a componentes SVG profesionales. Nada de emojis en la UI.

import {
  ArrowLeft, Award, BarChart3, Bird, Brain, Calendar, Check, CheckCircle2,
  Circle, Clock, Coins, Crosshair, Dices, Eye, Flame, Gem, Gift, Globe, Goal,
  Link2, Medal, Pencil, PawPrint, Rocket, ShieldCheck, ShoppingCart, Snowflake,
  Sparkles, Star, Swords, Target, Timer, TrendingUp, Trophy, Users, X, Zap,
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

// Iconos sueltos reutilizados por la UI.
export {
  ArrowLeft, Award, Calendar, Check, CheckCircle2, Circle, Clock, Coins,
  Crosshair, Flame, Gem, Gift, Globe, Medal, Pencil, ShoppingCart, Sparkles,
  Star, Swords, Trophy, TrendingUp, Users, X, Zap,
};
