"use client";

import Link from "next/link";
import { ShimmerCard } from "../ShimmerCard";
import SectionCard from "../biblia/SectionCard";

interface FeatureTeaserProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  onClick?: () => void;
  isDynamic?: boolean;
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
}

export default function FeatureTeaser({
  icon,
  title,
  description,
  color = "#c9a84c",
  badge,
  badgeColor,
  href,
  onClick,
  isDynamic = false,
  stats,
}: FeatureTeaserProps) {
  const content = (
    <ShimmerCard className="h-full">
      <SectionCard
        variant="ghost"
        className="p-5 sm:p-6 h-full flex flex-col justify-between group hover:bg-zm-surface/50 transition-colors"
      >
        {/* Icon con glow */}
        <div>
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 group-hover:scale-110 transition-transform"
            style={{
              background: `${color}20`,
              border: `1px solid ${color}40`,
            }}
          >
            <span style={{ color }}>{icon}</span>
          </div>

          {/* Badge */}
          {badge && (
            <span
              className="inline-block mb-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: badgeColor ? `${badgeColor}20` : "rgba(201,168,76,0.15)",
                color: badgeColor ?? "#c9a84c",
                border: `1px solid ${
                  badgeColor ? `${badgeColor}40` : "rgba(201,168,76,0.3)"
                }`,
              }}
            >
              {badge}
            </span>
          )}

          {/* Título + Descripción */}
          <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
          <p className="text-sm text-zm-text-muted leading-relaxed">
            {description}
          </p>

          {/* Stats (si existen) */}
          {stats && stats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zm-border/30 grid grid-cols-2 gap-2">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] text-zm-text-muted uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="font-bold text-white text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {(href || onClick) && (
          <div className="mt-5">
            <span
              className="inline-flex items-center gap-2 font-semibold text-sm transition-all group-hover:gap-3 cursor-pointer"
              style={{ color: color ?? "#c9a84c" }}
            >
              Explorar
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </div>
        )}
      </SectionCard>
    </ShimmerCard>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0}>
        {content}
      </div>
    );
  }

  return content;
}
