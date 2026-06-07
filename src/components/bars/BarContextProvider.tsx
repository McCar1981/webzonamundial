"use client";

// Contexto de bar para los módulos cliente de /app (predicciones, etc.). El
// layout de /app resuelve el bar de la cookie zm_bar en el servidor y expone
// aquí su slug + nombre, para que la experiencia conserve la identidad de la
// peña (textos "de la peña de [Nombre]", enlaces a /b/<slug>...). Fuera de una
// peña el valor es null y los módulos se comportan como ZonaMundial normal.

import { createContext, useContext } from "react";

export interface BarClientContext {
  slug: string;
  name: string;
}

const Ctx = createContext<BarClientContext | null>(null);

export function BarContextProvider({
  value,
  children,
}: {
  value: BarClientContext | null;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBarContext(): BarClientContext | null {
  return useContext(Ctx);
}
