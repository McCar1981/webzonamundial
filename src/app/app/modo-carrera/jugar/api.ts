// src/app/app/modo-carrera/jugar/api.ts
// Wrappers de fetch del Modo Carrera (cliente). Espejan a fantasy/jugar/api.ts.

import type { CareerState, CareerRankEntry, NarrativeEntry, NarrativeKind } from "@/lib/modo-carrera/types";
import type { NarrativeContext } from "@/lib/modo-carrera/narrative";

export interface CareerEntitlement {
  authed: boolean;
  paseDT: boolean;
}

/**
 * Lee el acceso premium (Pase DT) del usuario. Ante cualquier fallo devuelve
 * sin acceso: nunca desbloqueamos premium por un error de red.
 */
export async function fetchEntitlement(): Promise<CareerEntitlement> {
  try {
    const res = await fetch("/api/modo-carrera/entitlement");
    if (!res.ok) return { authed: false, paseDT: false };
    const data = (await res.json()) as Partial<CareerEntitlement>;
    return { authed: !!data.authed, paseDT: !!data.paseDT };
  } catch {
    return { authed: false, paseDT: false };
  }
}

/** Trae el ranking global de DTs. Devuelve [] ante cualquier fallo. */
export async function fetchLeaderboard(): Promise<CareerRankEntry[]> {
  try {
    const res = await fetch("/api/modo-carrera/leaderboard");
    if (!res.ok) return [];
    const { entries } = (await res.json()) as { entries?: CareerRankEntry[] };
    return entries ?? [];
  } catch {
    return [];
  }
}

export async function fetchServerCareer(): Promise<CareerState | null> {
  try {
    const res = await fetch("/api/modo-carrera/save");
    if (!res.ok) return null;
    const { career } = (await res.json()) as { career: CareerState | null };
    return career ?? null;
  } catch {
    return null;
  }
}

/** Resultado del guardado: Fútcoins/XP abonados por misiones recién liquidadas. */
export interface SaveCareerResult {
  futcoins: number;
  xpAwarded: number;
}

export async function saveServerCareer(state: CareerState): Promise<SaveCareerResult> {
  try {
    const res = await fetch("/api/modo-carrera/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) return { futcoins: 0, xpAwarded: 0 };
    const data = (await res.json()) as { futcoins?: number; xpAwarded?: number };
    return { futcoins: data.futcoins ?? 0, xpAwarded: data.xpAwarded ?? 0 };
  } catch {
    /* offline: queda el guardado local */
    return { futcoins: 0, xpAwarded: 0 };
  }
}

export interface RefillResult {
  ok: boolean;
  /** Generaciones IA añadidas (0 si falló). */
  added: number;
  /** Saldo de Fútcoins resultante (si lo devolvió el servidor). */
  coins: number | null;
  /** Código de error cuando ok=false. */
  error?: string;
}

/**
 * Compra una recarga de cupo de narrativa IA con Fútcoins. Devuelve cuántas
 * generaciones se añadieron y el saldo resultante. Ante fallo de red devuelve
 * ok=false sin añadir nada (no se cobra: el backend solo amplía si cobró).
 */
export async function refillNarrative(): Promise<RefillResult> {
  try {
    const res = await fetch("/api/modo-carrera/narrativa/refill", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      added?: number;
      coins?: number;
      error?: string;
    };
    return {
      ok: !!data.ok,
      added: data.added ?? 0,
      coins: typeof data.coins === "number" ? data.coins : null,
      error: data.error,
    };
  } catch {
    return { ok: false, added: 0, coins: null, error: "network" };
  }
}

export interface NarrativeResult {
  entry: NarrativeEntry | null;
  /** ¿La entrada se generó con IA (true) o por plantilla por cupo agotado (false)? */
  ai: boolean;
  /** Generaciones IA restantes hoy (null = ilimitado o desconocido). */
  remaining: number | null;
  /** ¿El cupo IA está agotado (se sirvió plantilla)? */
  exceeded: boolean;
}

/**
 * Pide al servidor una entrada de narrativa (IA con fallback a plantilla). Si la
 * red falla, devuelve entry=null y el llamador genera la versión por plantilla
 * local. Incluye el estado de cupo IA para que la UI muestre lo que queda y el
 * upsell del Pase DT.
 */
export async function requestNarrative(
  kind: NarrativeKind,
  context: NarrativeContext,
): Promise<NarrativeResult> {
  try {
    const res = await fetch("/api/modo-carrera/narrativa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, context }),
    });
    if (!res.ok) return { entry: null, ai: false, remaining: null, exceeded: false };
    const data = (await res.json()) as {
      ok?: boolean;
      entry?: NarrativeEntry;
      ai?: boolean;
      remaining?: number | null;
      exceeded?: boolean;
    };
    if (!data.ok || !data.entry) return { entry: null, ai: false, remaining: null, exceeded: false };
    return {
      entry: data.entry,
      ai: data.ai ?? true,
      remaining: typeof data.remaining === "number" ? data.remaining : null,
      exceeded: data.exceeded ?? false,
    };
  } catch {
    return { entry: null, ai: false, remaining: null, exceeded: false };
  }
}
