"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ShimmerCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ShimmerCard({ children, className = "" }: ShimmerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const shimmer = shimmerRef.current;
    if (!card || !shimmer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(shimmer, {
        x: x - 150,
        y: y - 150,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseEnter = () => {
      gsap.to(shimmer, {
        opacity: 1,
        scale: 1,
        duration: 0.3
      });
    };

    const handleMouseLeave = () => {
      gsap.to(shimmer, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={{ transform: "translateZ(0)" }}
    >
      {children}
      {/* Efecto shimmer dorado */}
      <div
        ref={shimmerRef}
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none opacity-0"
        style={{
          background: "radial-gradient(circle, rgba(201, 168, 76, 0.4) 0%, rgba(201, 168, 76, 0.1) 40%, transparent 70%)",
          filter: "blur(40px)",
          transform: "translate(-50%, -50%) scale(0.8)"
        }}
      />
    </div>
  );
}
