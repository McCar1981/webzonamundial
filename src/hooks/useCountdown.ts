"use client";

import { useState, useEffect } from "react";
import { OPENING_INSTANT } from "@/lib/calendario/time";

interface CountdownState {
  d: number;
  h: number;
  m: number;
  s: number;
  /** true cuando el target ya pasó (el llamador decide qué pintar). */
  done: boolean;
}

/** Cuenta atrás a un instante. Por defecto, el saque inaugural REAL del
 *  Mundial: 15:00 ET del 11-jun-2026 (19:00 UTC) — derivado de matches.ts,
 *  no de una fecha escrita a mano (la anterior, 12:00-05:00, llegaba a cero
 *  dos horas antes del partido y se quedaba congelada). */
export default function useCountdown(target: Date = OPENING_INSTANT): CountdownState {
  const [state, setState] = useState<CountdownState>({ d: 0, h: 0, m: 0, s: 0, done: false });

  useEffect(() => {
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setState((prev) => (prev.done ? prev : { d: 0, h: 0, m: 0, s: 0, done: true }));
        return;
      }
      setState({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
        done: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  return state;
}
