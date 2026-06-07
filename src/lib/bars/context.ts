// src/lib/bars/context.ts
//
// Contexto de bar para la experiencia ZM (/app/*). Lee la cookie zm_bar (fijada
// al entrar en la porra) y resuelve el bar + su tema. Lo usan el layout de /app
// (para inyectar la paleta del bar como variables CSS) y el banner de marca.

import { cookies } from "next/headers";
import { getBarBySlug, type BarRow } from "./store";
import { getTheme, type BarTheme } from "./themes";

export interface BarContext {
  bar: BarRow;
  theme: BarTheme;
}

export async function getBarContext(): Promise<BarContext | null> {
  const slug = cookies().get("zm_bar")?.value;
  if (!slug) return null;
  const bar = await getBarBySlug(slug);
  if (!bar) return null;
  return { bar, theme: getTheme(bar.theme_id) };
}

// Variables CSS que adoptan los módulos de /app cuando hay contexto de bar. Los
// valores por defecto (en el propio CSS de cada módulo) son la paleta de ZM.
export function barThemeCssVars(t: BarTheme): React.CSSProperties {
  return {
    ["--zm-bg" as string]: t.bg,
    ["--zm-surface" as string]: t.surface,
    ["--zm-surface2" as string]: t.surface2,
    ["--zm-border" as string]: t.border,
    ["--zm-accent" as string]: t.primary,
    ["--zm-accent2" as string]: t.secondary,
    ["--zm-ink" as string]: t.primaryInk,
    ["--zm-text" as string]: t.text,
    ["--zm-text-muted" as string]: t.textMuted,
  };
}
