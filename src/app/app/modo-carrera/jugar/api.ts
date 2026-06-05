// src/app/app/modo-carrera/jugar/api.ts
// Wrappers de fetch del Modo Carrera (cliente). Espejan a fantasy/jugar/api.ts.

import type { CareerState } from "@/lib/modo-carrera/types";

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
