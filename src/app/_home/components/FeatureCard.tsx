"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useHoverAnimation } from "@/hooks/useGSAPAnimations";
import { ModuleItem } from "../types";

export function FeatureCard({
  module,
  exploreLabel,
}: {
  module: ModuleItem;
  exploreLabel: string;
}) {
  const cardRef = useHoverAnimation();
  const shimmerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!shimmerRef.current || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(shimmerRef.current, {
      x: x - 100,
      y: y - 100,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseEnter = () => {
    if (!shimmerRef.current) return;
    gsap.to(shimmerRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
    });
  };

  const handleMouseLeave = () => {
    if (!shimmerRef.current) return;
    gsap.to(shimmerRef.current, {
      opacity: 0,
      scale: 0.5,
      duration: 0.3,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="feature-card relative p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-[#0F1D32] to-[#0B1825] hover:border-[#C9A84C]/30 transition-all duration-500 group cursor-pointer overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Efecto shimmer dorado */}
      <div
        ref={shimmerRef}
        className="absolute w-[200px] h-[200px] rounded-full pointer-events-none opacity-0"
        style={{
          background:
            "radial-gradient(circle, rgba(201, 168, 76, 0.5) 0%, rgba(201, 168, 76, 0.2) 40%, transparent 70%)",
          filter: "blur(30px)",
          transform: "translate(-50%, -50%) scale(0.5)",
        }}
      />

      <div className="mb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative float-animation w-14 h-14 flex items-center justify-center">
          {module.icon}
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#C9A84C] transition-colors">
        {module.title}
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed">{module.desc}</p>
      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span className="text-xs font-semibold" style={{ color: module.color }}>
          {exploreLabel}
        </span>
        <span style={{ color: module.color }}>→</span>
      </div>
    </div>
  );
}
