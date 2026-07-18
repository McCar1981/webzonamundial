"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import type { HLMode } from "@/lib/higher-lower/types";

const GOLD = "#c9a84c";

interface ModeOption {
  mode: HLMode;
  emoji: string;
}

const MODES: ModeOption[] = [
  { mode: "selecciones", emoji: "🏆" },
  { mode: "jugadores", emoji: "👤" },
];

export default function HigherLowerLanding() {
  const { t } = useLanguage();
  const hl = t.higherLower;

  return (
    <main className="min-h-screen bg-zm-bg text-zm-text font-outfit flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <span className="inline-block px-3 py-1 rounded-full border border-zm-gold/30 text-zm-gold text-sm mb-6">
          {hl.badge}
        </span>

        <h1 className="text-4xl md:text-6xl font-bold mb-4">{hl.title}</h1>
        <p className="text-lg text-zm-text-muted mb-10 max-w-xl">{hl.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {MODES.map(({ mode, emoji }) => (
            <Link
              key={mode}
              href={`/app/higher-lower/jugar?mode=${mode}`}
              className="group block rounded-2xl border border-zm-border bg-zm-surface p-8 transition hover:border-zm-gold/60 hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">{emoji}</div>
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-zm-gold transition">
                {mode === "selecciones" ? hl.menu.seleccionesTitle : hl.menu.jugadoresTitle}
              </h2>
              <p className="text-zm-text-muted mb-6">
                {mode === "selecciones" ? hl.menu.seleccionesDesc : hl.menu.jugadoresDesc}
              </p>
              <span
                className="inline-block px-6 py-2.5 rounded-full font-medium text-zm-bg transition"
                style={{ background: GOLD }}
              >
                {hl.menu.play}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
