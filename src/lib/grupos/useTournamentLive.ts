"use client";

// Polling ligero del estado en vivo para las superficies de Grupos (índice y
// detalle de cada grupo). Reusa el endpoint /api/calendario/live, que va
// cacheado en CDN (15-60s), así que el intervalo de 45s no multiplica carga por
// usuario. La ventana activa es la misma del calendario: desde 1h antes del
// saque inaugural hasta que acaba la final; fuera de ese rango no se hace ni una
// petición y la tabla/parrilla se quedan con horarios y ceros.

import { useEffect, useState } from "react";
import type { LiveMap } from "@/lib/calendario/live";
import { OPENING_INSTANT, FINAL_INSTANT, POSTMATCH_MS } from "@/lib/calendario/time";

const POLL_MS = 45_000;

export function useTournamentLive(): LiveMap {
  const [map, setMap] = useState<LiveMap>({});

  useEffect(() => {
    const now = Date.now();
    const active =
      now >= OPENING_INSTANT.getTime() - 3_600_000 &&
      now <= FINAL_INSTANT.getTime() + POSTMATCH_MS;
    if (!active) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/calendario/live", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as LiveMap;
        if (!cancelled) setMap(json);
      } catch {
        /* sin red o KV: la tabla sigue mostrando horarios y ceros */
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
  }, []);

  return map;
}
