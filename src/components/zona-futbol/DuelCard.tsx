"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ShimmerCard } from "../ShimmerCard";
import SectionCard from "../biblia/SectionCard";

interface TeamDuelInfo {
  id: string;
  name: string;
  avatar?: string;
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
  prediction?: number;
  badge?: string;
}

interface DuelCardProps {
  leftTeam: TeamDuelInfo;
  rightTeam: TeamDuelInfo;
  title?: string;
  description?: string;
  type?: "vs" | "prediction" | "fantasy";
  href?: string;
  size?: "sm" | "md" | "lg";
}

export default function DuelCard({
  leftTeam,
  rightTeam,
  title,
  description,
  type = "vs",
  href,
  size = "md",
}: DuelCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Animación parallax en hover
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;

      gsap.to(leftRef.current, {
        x: x * -15,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(rightRef.current, {
        x: x * 15,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to([leftRef.current, rightRef.current], {
        x: 0,
        duration: 0.3,
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const avatarSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const predictionPercent = type === "prediction"
    ? [
        leftTeam.prediction ?? 0.5,
        rightTeam.prediction ?? 0.5,
      ]
    : null;

  return (
    <div ref={cardRef}>
      <ShimmerCard>
        <SectionCard
          variant={type === "prediction" ? "accent" : "solid"}
          className={`${sizeClasses[size]} group`}
        >
          {/* Header */}
          {(title || description) && (
            <div className="text-center mb-6">
              {title && (
                <p className="text-xs font-bold uppercase tracking-wider text-zm-gold mb-1">
                  {title}
                </p>
              )}
              {description && (
                <p className="text-sm text-zm-text-muted">{description}</p>
              )}
            </div>
          )}

          {/* Duelo principal */}
          <div className="flex items-center justify-between gap-6">
            {/* Left team */}
            <div
              ref={leftRef}
              className="flex-1 text-center transition-transform"
            >
              {leftTeam.avatar && (
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <img
                      src={leftTeam.avatar}
                      alt={leftTeam.name}
                      className={`${avatarSizes[size]} rounded-2xl object-cover`}
                    />
                    {leftTeam.badge && (
                      <span
                        className="absolute -bottom-2 -right-2 px-2 py-1 text-xs font-bold rounded-lg"
                        style={{
                          background: "rgba(201,168,76,0.3)",
                          color: "#c9a84c",
                          border: "1px solid rgba(201,168,76,0.5)",
                        }}
                      >
                        {leftTeam.badge}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <h3 className="font-bold text-white mb-2 line-clamp-2">
                {leftTeam.name}
              </h3>

              {/* Stats */}
              {leftTeam.stats && leftTeam.stats.length > 0 && (
                <div className="space-y-1 mb-3">
                  {leftTeam.stats.map((stat) => (
                    <div key={stat.label} className="flex justify-between text-xs">
                      <span className="text-zm-text-muted">{stat.label}</span>
                      <span className="font-semibold text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Predicción */}
              {predictionPercent && (
                <div className="mt-2 p-2 rounded-lg bg-zm-surface/50">
                  <div className="text-2xl font-black text-zm-gold">
                    {Math.round(predictionPercent[0] * 100)}%
                  </div>
                  <p className="text-xs text-zm-text-muted mt-1">Probabilidad</p>
                </div>
              )}
            </div>

            {/* Center: VS badge */}
            <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  background:
                    type === "prediction"
                      ? "linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.1))"
                      : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <span
                  style={{
                    color: type === "prediction" ? "#c9a84c" : "#94a3b8",
                  }}
                >
                  VS
                </span>
              </div>

              {/* Línea divisoria */}
              <div
                className="h-8 w-px"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(201,168,76,0.2), transparent)",
                }}
              />
            </div>

            {/* Right team (mirror) */}
            <div
              ref={rightRef}
              className="flex-1 text-center transition-transform"
            >
              {rightTeam.avatar && (
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <img
                      src={rightTeam.avatar}
                      alt={rightTeam.name}
                      className={`${avatarSizes[size]} rounded-2xl object-cover`}
                    />
                    {rightTeam.badge && (
                      <span
                        className="absolute -bottom-2 -left-2 px-2 py-1 text-xs font-bold rounded-lg"
                        style={{
                          background: "rgba(201,168,76,0.3)",
                          color: "#c9a84c",
                          border: "1px solid rgba(201,168,76,0.5)",
                        }}
                      >
                        {rightTeam.badge}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <h3 className="font-bold text-white mb-2 line-clamp-2">
                {rightTeam.name}
              </h3>

              {rightTeam.stats && rightTeam.stats.length > 0 && (
                <div className="space-y-1 mb-3">
                  {rightTeam.stats.map((stat) => (
                    <div key={stat.label} className="flex justify-between text-xs">
                      <span className="text-zm-text-muted">{stat.label}</span>
                      <span className="font-semibold text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {predictionPercent && (
                <div className="mt-2 p-2 rounded-lg bg-zm-surface/50">
                  <div className="text-2xl font-black text-zm-gold">
                    {Math.round(predictionPercent[1] * 100)}%
                  </div>
                  <p className="text-xs text-zm-text-muted mt-1">Probabilidad</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          {href && (
            <Link
              href={href}
              className="block mt-6 pt-6 border-t border-zm-border/30 text-center font-semibold text-sm transition-all group-hover:text-zm-gold"
              style={{ color: "var(--zm-text-muted)" }}
            >
              Ver detalles del duelo
            </Link>
          )}
        </SectionCard>
      </ShimmerCard>
    </div>
  );
}
