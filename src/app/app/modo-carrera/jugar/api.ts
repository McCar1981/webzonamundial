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

export async function saveServerCareer(state: CareerState): Promise<void> {
  try {
    await fetch("/api/modo-carrera/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  } catch {
    /* offline: queda el guardado local */
  }
}

/**
 * Pide al servidor una entrada de narrativa (IA con fallback a plantilla). Si la
 * red falla, devuelve null y el llamador genera la versión por plantilla local.
 */
export async function requestNarrative(
  kind: NarrativeKind,
  context: NarrativeContext,
): Promise<NarrativeEntry | null> {
  try {
    const res = await fetch("/api/modo-carrera/narrativa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, context }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; entry?: NarrativeEntry };
    return data.ok && data.entry ? data.entry : null;
  } catch {
    return null;
  }
}
