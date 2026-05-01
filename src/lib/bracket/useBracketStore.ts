// src/lib/bracket/useBracketStore.ts
// Hook React que gestiona el estado del bracket con persistencia en localStorage.
// Anónimo, sin login. La firma queda lista para enchufar Vercel KV en C2.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyPick,
  createInitialState,
  resetState,
  undoPick,
} from "./engine";
import type { BracketState, Pick } from "./types";

const STORAGE_KEY = "zm:bracket:v1";

// Sólo serializamos lo que cambia (picks). Las matches se reconstruyen en cada load.
interface PersistedShape {
  picks: Record<string, Pick>;
  history: Array<Record<string, Pick>>;
}

function loadPersisted(): PersistedShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!parsed.picks) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(state: BracketState) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedShape = {
      picks: state.picks,
      history: state.history.slice(-20), // último 20 niveles de undo
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

/** Reconstruye estado completo a partir de los picks persistidos. */
function hydrate(persisted: PersistedShape | null): BracketState {
  let s = createInitialState();
  if (!persisted) return s;
  // re-aplicar picks en orden de timestamp para reconstruir history
  const orderedPicks = Object.values(persisted.picks).sort((a, b) => a.ts - b.ts);
  for (const p of orderedPicks) {
    s = applyPick(s, p.matchId, {
      winner: p.winner,
      scoreA: p.scoreA,
      scoreB: p.scoreB,
    });
  }
  return s;
}

export interface BracketStore {
  state: BracketState;
  pick: (matchId: string, data: Omit<Pick, "matchId" | "ts">) => void;
  undo: () => void;
  reset: () => void;
  canUndo: boolean;
  hydrated: boolean;
}

export function useBracketStore(): BracketStore {
  const [state, setState] = useState<BracketState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Hidratar desde localStorage al montar
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = loadPersisted();
    setState(hydrate(persisted));
    setHydrated(true);
  }, []);

  // Persistir en cada cambio (post-hidratación)
  useEffect(() => {
    if (!hydrated) return;
    persist(state);
  }, [state, hydrated]);

  const pick = useCallback(
    (matchId: string, data: Omit<Pick, "matchId" | "ts">) => {
      setState((prev) => applyPick(prev, matchId, data));
    },
    []
  );

  const undo = useCallback(() => {
    setState((prev) => undoPick(prev));
  }, []);

  const reset = useCallback(() => {
    setState(resetState());
  }, []);

  return {
    state,
    pick,
    undo,
    reset,
    canUndo: state.history.length > 0,
    hydrated,
  };
}
