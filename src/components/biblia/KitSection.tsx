"use client";

// KitSection — Equipación Mundial 2026.
// Toggle Titular / Visitante (decisión Carlos #4). Si visitante no
// tiene imagen, se ve un placeholder elegante "Próximamente".

import { useState } from "react";
import type { NationalTeam } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";

type KitVariant = "home" | "away";

export default function KitSection({ team }: { team: NationalTeam }) {
  const kit = team.kit?.wc_2026;
  const [variant, setVariant] = useState<KitVariant>("home");

  if (!kit) return null;

  const home = kit.home;
  const away = kit.away;
  const current = variant === "home" ? home : away;

  const trivia = team.kit?.trivia ?? [];
  const validatedTrivia = trivia.filter(
    (t) => t.status === "validated" || t.status === "single_source"
  );

  const hasImage = current.front_url && !current.front_url.startsWith("[");

  return (
    <SectionCard id="equipacion">
      <SectionHeader
        eyebrow="Equipación · Mundial 2026"
        title={`Camiseta oficial${kit.brand ? ` · ${kit.brand}` : ""}`}
        action={
          <div
            className="inline-flex rounded-xl border border-[var(--bb-border-subtle)] p-1"
            style={{ background: "rgba(11,24,37,0.6)" }}
            role="tablist"
            aria-label="Variante de camiseta"
          >
            <ToggleBtn
              active={variant === "home"}
              onClick={() => setVariant("home")}
              label="Titular"
            />
            <ToggleBtn
              active={variant === "away"}
              onClick={() => setVariant("away")}
              label="Visitante"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        {/* Imagen del kit grande */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            aspectRatio: "1 / 1",
            background: hasImage
              ? `radial-gradient(ellipse at center, ${hex(current.primary_color, 0.18)} 0%, transparent 70%), #0B1825`
              : "#0B1825",
            border: "1px solid var(--bb-border-subtle)",
          }}
        >
          {hasImage ? (
            <img
              src={current.front_url ?? ""}
              alt={current.alt_text}
              className="w-full h-full object-contain p-[10%]"
              style={{
                filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))",
              }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <KitPlaceholder
              primary={current.primary_color}
              secondary={current.secondary_color}
              variant={variant}
            />
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[10px] font-bold text-[var(--bb-gold)] uppercase tracking-[0.25em]">
              {variant === "home" ? "Titular" : "Visitante"}
            </div>
            <span className="flex items-center gap-1.5">
              <ColorChip color={current.primary_color} />
              <ColorChip color={current.secondary_color} />
            </span>
          </div>

          <p className="text-base text-[var(--bb-text-soft)] leading-relaxed mb-5">
            {current.description}
          </p>

          {/* Trivia validada */}
          {validatedTrivia.length > 0 ? (
            <div className="space-y-3">
              {validatedTrivia.map((t, i) => (
                <article
                  key={i}
                  className="rounded-xl p-4 text-sm leading-relaxed text-[var(--bb-text-soft)] border border-[var(--bb-gold)]/15"
                  style={{ background: "rgba(201,168,76,0.04)" }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[var(--bb-gold)] flex-shrink-0"
                      aria-hidden
                    >
                      ★
                    </span>
                    <div>
                      <p>{t.text}</p>
                      <p className="text-[10px] text-[var(--bb-text-dim)] mt-1.5 italic">
                        Fuente: {t.source}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

/* ─────── Sub-components ─────── */

function ToggleBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="bb-focusable px-4 py-2 rounded-lg text-xs font-bold transition-all bb-touch"
      style={{
        background: active
          ? "linear-gradient(135deg, #C9A84C, #A8893D)"
          : "transparent",
        color: active ? "#030712" : "var(--bb-text-soft)",
      }}
    >
      {label}
    </button>
  );
}

function ColorChip({ color }: { color: string }) {
  return (
    <span
      className="w-5 h-5 rounded-full border border-white/15"
      style={{ background: color }}
      title={color}
      aria-label={`Color ${color}`}
    />
  );
}

function KitPlaceholder({
  primary,
  secondary,
  variant,
}: {
  primary: string;
  secondary: string;
  variant: KitVariant;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-[18%]">
      <div
        className="w-full h-full rounded-2xl flex items-center justify-center text-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          opacity: 0.2,
        }}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-2">
            {variant === "home" ? "Titular" : "Visitante"}
          </div>
          <div className="text-sm font-semibold text-white/80">
            Próximamente
          </div>
        </div>
      </div>
    </div>
  );
}

function hex(c: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
  if (!m) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}
