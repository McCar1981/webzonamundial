"use client";

// Polling ligero del estado en vivo para la parrilla del calendario.
// El endpoint /api/calendario/live va cacheado en CDN (15-60s), así que este
// intervalo de 45s no multiplica carga por usuario. Fuera del torneo el
// llamador pasa active=false y no se hace ni una petición.

import { useEffect, useState } from "react";
import type { LiveMap } from "@/lib/calendario/live";

const POLL_MS = 45_000;

export function useLiveScores(active: boolean): LiveMap {
  const [map, setMap] = useState<LiveMap>({});

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/calendario/live", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as LiveMap;
        if (!cancelled) setMap(json);
      } catch {
        /* sin red o KV: la parrilla sigue mostrando horarios */
      }
    };

    load();
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active]);

  return map;
}
