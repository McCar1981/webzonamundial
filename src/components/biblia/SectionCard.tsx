// SectionCard — UN SOLO patrón de tarjeta para todas las secciones.
// Sustituye los 12 estilos diferentes que había antes (cada componente
// montaba su propio gradient/borde/blur).
//
// Variants:
//   - solid (default): borde sutil, fondo card opaco
//   - ghost: borde casi invisible, fondo translúcido (para sub-cards)
//   - accent: con highlight dorado (1 vez por página máximo)

import { type ReactNode } from "react";

interface SectionCardProps {
  id?: string;
  variant?: "solid" | "ghost" | "accent";
  className?: string;
  children: ReactNode;
}

const VARIANT_STYLES: Record<NonNullable<SectionCardProps["variant"]>, string> =
  {
    solid:
      "border border-[var(--bb-border-subtle)] bg-[var(--bb-card)] backdrop-blur-md",
    ghost:
      "border border-[var(--bb-border-subtle)] bg-[var(--bb-card-ghost)] backdrop-blur-sm",
    accent: "bb-card-accent border",
  };

export default function SectionCard({
  id,
  variant = "solid",
  className = "",
  children,
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={`relative rounded-3xl p-6 sm:p-8 ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * SectionHeader — header consistente arriba de cada SectionCard.
 *
 * <SectionHeader eyebrow="Camino al Mundial" title="Cómo llegó Argentina" />
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={`mb-6 sm:mb-8 ${
        align === "center" ? "text-center" : "flex items-start justify-between flex-wrap gap-4"
      }`}
    >
      <div>
        {eyebrow ? (
          <div className="text-[10px] font-bold text-[var(--bb-gold)] uppercase tracking-[0.25em] mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h2
          className="font-black text-white leading-tight"
          style={{
            fontSize: "clamp(24px, 3.6vw, 36px)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-[var(--bb-text-muted)] mt-2 max-w-2xl">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
