"use client";

import Link from "next/link";
import { ShimmerCard } from "../ShimmerCard";
import SectionCard from "../biblia/SectionCard";
import { BallIcon, CalendarIcon } from "../icons";

interface LeagueCardProps {
  id: string;
  name: string;
  shortName?: string;
  country?: string;
  logoUrl: string;
  color: string;
  accentColor?: string;
  totalTeams: number;
  currentMatchday: number;
  nextMatch?: {
    homeTeam: string;
    awayTeam: string;
    date: string;
  };
  href: string;
  compact?: boolean;
}

export default function LeagueCard({
  id,
  name,
  shortName,
  country,
  logoUrl,
  color,
  accentColor,
  totalTeams,
  currentMatchday,
  nextMatch,
  href,
  compact = false,
}: LeagueCardProps) {
  return (
    <Link href={href}>
      <ShimmerCard className="h-full">
        <SectionCard
          variant="ghost"
          className="p-4 sm:p-5 h-full flex flex-col justify-between group hover:bg-zm-surface/50 transition-colors"
        >
          {/* Header: Logo + nombre */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border backdrop-blur-sm"
                style={{
                  background: `${color}15`,
                  borderColor: `${color}30`,
                }}
              >
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm truncate">{name}</h3>
                <p className="text-xs text-zm-text-muted">{country}</p>
              </div>
            </div>

            {/* Stats: Equipos y Jornada */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatPill
                icon={<BallIcon className="w-4 h-4" />}
                value={totalTeams}
                label="Equipos"
                color={color}
              />
              <StatPill
                icon={<CalendarIcon className="w-4 h-4" />}
                value={currentMatchday}
                label="Jornada"
                color={color}
              />
            </div>
          </div>

          {/* Próximo partido (si existe y no es compact) */}
          {nextMatch && !compact && (
            <div className="mt-4 pt-4 border-t border-zm-border/30">
              <p className="text-[10px] text-zm-text-muted uppercase tracking-wide mb-2">
                Próximo
              </p>
              <div className="flex items-center justify-between text-xs gap-1">
                <span className="truncate font-semibold text-white">
                  {nextMatch.homeTeam}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0"
                  style={{
                    background: `${color}25`,
                    color,
                  }}
                >
                  VS
                </span>
                <span className="truncate font-semibold text-white">
                  {nextMatch.awayTeam}
                </span>
              </div>
              <p className="text-xs text-zm-text-muted mt-1">{nextMatch.date}</p>
            </div>
          )}

          {/* CTA implícito (Link wrappea toda la tarjeta) */}
          <div className="mt-4 pt-4 border-t border-zm-border/30 text-center">
            <span
              className="text-xs font-semibold transition-colors group-hover:text-zm-gold"
              style={{ color: accentColor || color }}
            >
              Ver liga →
            </span>
          </div>
        </SectionCard>
      </ShimmerCard>
    </Link>
  );
}

function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-2.5 flex flex-col items-center justify-center border"
      style={{
        background: `${color}12`,
        borderColor: `${color}2a`,
      }}
    >
      <span
        className="inline-flex items-center justify-center mb-1"
        style={{ color }}
      >
        {icon}
      </span>
      <span className="font-black text-white text-xs leading-none">{value}</span>
      <span className="text-[9px] text-zm-text-muted mt-1 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
