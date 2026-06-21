"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import SectionCard, { SectionHeader } from "../biblia/SectionCard";

interface RankingEntry {
  id: string;
  position: number;
  name: string;
  value: number | string;
  change?: -1 | 0 | 1;
  avatar?: string;
  badge?: string;
  badgeColor?: string;
  [key: string]: any;
}

interface RankingPreviewProps {
  title: string;
  entries: RankingEntry[];
  columns?: Array<{
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    width?: string;
    formatFn?: (val: any) => string;
  }>;
  href?: string;
  compact?: boolean;
  animated?: boolean;
  variant?: "teams" | "players" | "users";
}

// Iconos simples inline
function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M7 16V4m0 0l3.29 3.29M7 4L3.71 7.29"
      />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M17 8v12m0 0l-3.29-3.29M17 20l3.29-3.29"
      />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M20 12H4"
      />
    </svg>
  );
}

const DEFAULT_COLUMNS = [
  { key: "position", label: "Pos", width: "w-12", align: "center" as const },
  { key: "name", label: "Nombre", align: "left" as const },
  { key: "value", label: "Puntos", width: "w-24", align: "right" as const },
];

export default function RankingPreview({
  title,
  entries,
  columns = DEFAULT_COLUMNS,
  href,
  compact = false,
  animated = true,
  variant = "teams",
}: RankingPreviewProps) {
  const [displayEntries, setDisplayEntries] = useState(entries);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!animated) {
      setDisplayEntries(entries);
      return;
    }

    // Animar cambios de posición
    entries.forEach((entry, idx) => {
      const rowEl = rowsRef.current[idx];
      if (rowEl && entry.change !== 0) {
        gsap.fromTo(
          rowEl,
          { opacity: 0.5, y: entry.change === 1 ? -10 : 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      }
    });

    setDisplayEntries(entries);
  }, [entries, animated]);

  const displayLimit = compact ? 5 : entries.length;

  return (
    <SectionCard variant="ghost">
      <SectionHeader
        title={title}
        action={
          href && (
            <Link
              href={href}
              className="text-zm-gold text-sm font-semibold hover:underline"
            >
              Ver más
            </Link>
          )
        }
      />

      <div className="space-y-2">
        {/* Header row */}
        <div
          className="grid gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-zm-text-muted border-b border-zm-border/30"
          style={{
            gridTemplateColumns: columns
              .map((c) => c.width || "1fr")
              .join(" "),
          }}
        >
          {columns.map((col) => (
            <div key={col.key} className={`text-${col.align || "left"}`}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {displayEntries.slice(0, displayLimit).map((entry, idx) => (
            <div
              key={entry.id}
              ref={(el) => {
                rowsRef.current[idx] = el;
              }}
              className="grid gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-zm-surface/30"
              style={{
                gridTemplateColumns: columns
                  .map((c) => c.width || "1fr")
                  .join(" "),
                background:
                  variant === "teams" && idx % 2 === 0
                    ? "transparent"
                    : variant === "teams"
                      ? "rgba(255,255,255,0.02)"
                      : "transparent",
              }}
            >
              {columns.map((col) => {
                const value = entry[col.key as keyof RankingEntry];
                const formatted = col.formatFn
                  ? col.formatFn(value)
                  : String(value);

                // Columna: posición con cambio
                if (col.key === "position") {
                  return (
                    <div
                      key={col.key}
                      className="flex items-center gap-2 text-center"
                    >
                      <span className="font-bold text-white text-base w-6">
                        {entry.position}
                      </span>
                      {entry.change === 1 && (
                        <ArrowUpIcon className="w-3 h-3 text-green-400" />
                      )}
                      {entry.change === -1 && (
                        <ArrowDownIcon className="w-3 h-3 text-red-400" />
                      )}
                      {entry.change === 0 && (
                        <MinusIcon className="w-3 h-3 text-zm-text-muted" />
                      )}
                    </div>
                  );
                }

                // Columna: avatar + nombre
                if (col.key === "name") {
                  return (
                    <div key={col.key} className="flex items-center gap-2 min-w-0">
                      {entry.avatar && (
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <span className="font-semibold text-white truncate">
                        {entry.name}
                      </span>
                      {entry.badge && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                          style={{
                            background: entry.badgeColor
                              ? `${entry.badgeColor}30`
                              : "rgba(201,168,76,0.2)",
                            color: entry.badgeColor ?? "#c9a84c",
                          }}
                        >
                          {entry.badge}
                        </span>
                      )}
                    </div>
                  );
                }

                // Resto de columnas
                return (
                  <div
                    key={col.key}
                    className={`text-${col.align || "right"} text-sm font-semibold text-white`}
                  >
                    {formatted}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
