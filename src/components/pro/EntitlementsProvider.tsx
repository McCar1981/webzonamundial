"use client";

// src/components/pro/EntitlementsProvider.tsx
//
// Contexto global con el estado Pro/Founder del usuario (un solo fetch a
// /api/me/entitlements por carga, compartido por ads, badges y paywalls).
//
// SOLO presentación: decide qué pintar (candados, anuncios, contadores).
// El enforcement real de cada límite vive en las rutas API server-side.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ClientEntitlements {
  /** null = aún cargando. */
  loading: boolean;
  authenticated: boolean;
  isPro: boolean;
  isFounder: boolean;
  source: "subscription" | "founder" | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Refresca tras un checkout exitoso o un cambio de sesión. */
  refresh: () => Promise<void>;
}

const DEFAULT_STATE: Omit<ClientEntitlements, "refresh"> = {
  loading: true,
  authenticated: false,
  isPro: false,
  isFounder: false,
  source: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
};

const EntitlementsContext = createContext<ClientEntitlements>({
  ...DEFAULT_STATE,
  refresh: async () => {},
});

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me/entitlements", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setState({
        loading: false,
        authenticated: !!data.authenticated,
        isPro: !!data.isPro,
        isFounder: !!data.isFounder,
        source: data.source ?? null,
        periodEnd: data.periodEnd ?? null,
        cancelAtPeriodEnd: !!data.cancelAtPeriodEnd,
      });
    } catch {
      // Degrada a Free: ante un fallo de red nunca regalamos UI Pro.
      setState({ ...DEFAULT_STATE, loading: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <EntitlementsContext.Provider value={{ ...state, refresh }}>
      {children}
    </EntitlementsContext.Provider>
  );
}

/** Estado Pro/Founder del usuario actual (client-side, solo presentación). */
export function useEntitlements(): ClientEntitlements {
  return useContext(EntitlementsContext);
}
