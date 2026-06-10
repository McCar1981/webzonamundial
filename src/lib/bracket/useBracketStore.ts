// src/lib/bracket/useBracketStore.ts
// Hook React que gestiona el estado del bracket con persistencia en localStorage.
// Anónimo, sin login. La firma queda lista para enchufar Vercel KV en C2.
//
// Store COMPARTIDO (singleton + useSyncExternalStore): todas las instancias del
// hook leen y escriben el MISMO estado en memoria. Antes cada `useBracketStore()`
// tenía su propia copia con useState, así que el IA Coach (montado en el layout
// raíz) nunca veía los picks hechos en /bracket dentro de la misma sesión y
// mostraba "0/8". Ahora un pick en cualquier componente notifica a todos —incluido
// el widget— y además sincroniza entre pestañas vía el evento `storage`.

"use client";

import { useCallback, useSyncExternalStore } from "react";
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

// ─────────────── Store singleton (compartido entre instancias) ───────────────

interface Snapshot {
  state: BracketState;
  canUndo: boolean;
  hydrated: boolean;
}

// Snapshot de servidor: estable y determinista (sin localStorage) para que la
// hidratación SSR no produzca mismatch. hydrated=false hasta que el cliente lee.
const SERVER_SNAPSHOT: Snapshot = {
  state: createInitialState(),
  canUndo: false,
  hydrated: false,
};

let _state: BracketState = createInitialState();
let _hydrated = false;
let _snapshot: Snapshot = { state: _state, canUndo: false, hydrated: false };
const listeners = new Set<() => void>();

function recomputeSnapshot() {
  _snapshot = {
    state: _state,
    canUndo: _state.history.length > 0,
    hydrated: _hydrated,
  };
}

function emit() {
  for (const l of listeners) l();
}

/** Aplica una transición, persiste y notifica a todas las instancias. */
function commit(next: BracketState) {
  _state = next;
  recomputeSnapshot();
  persist(_state);
  emit();
}

/** Lee localStorage una sola vez (primer montaje en cliente). */
function ensureHydrated() {
  if (_hydrated) return;
  _hydrated = true;
  _state = hydrate(loadPersisted());
  recomputeSnapshot();
  emit();
}

/** Re-lee localStorage cuando otra pestaña modifica el bracket. */
function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  _state = hydrate(loadPersisted());
  recomputeSnapshot();
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  // Hidrata en el primer montaje del cliente (idempotente).
  ensureHydrated();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getSnapshot(): Snapshot {
  return _snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

export function useBracketStore(): BracketStore {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const pick = useCallback(
    (matchId: string, data: Omit<Pick, "matchId" | "ts">) => {
      commit(applyPick(_state, matchId, data));
    },
    []
  );

  const undo = useCallback(() => {
    commit(undoPick(_state));
  }, []);

  const reset = useCallback(() => {
    commit(resetState());
  }, []);

  return {
    state: snap.state,
    pick,
    undo,
    reset,
    canUndo: snap.canUndo,
    hydrated: snap.hydrated,
  };
}
