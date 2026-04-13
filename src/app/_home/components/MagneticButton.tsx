"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { useMagneticButton } from "@/hooks/useGSAPAnimations";
import { useState, useCallback } from "react";

type Ripple = { id: number; x: number; y: number };

export function MagneticButton({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const buttonRef = useMagneticButton();
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const baseClasses =
    "relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 overflow-hidden";
  const variantClasses =
    variant === "primary"
      ? "bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] text-[#030712] hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] hover:scale-105"
      : "border-2 border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/60 hover:scale-105";

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev, { id, x, y }]);

    // Animate via GSAP on the DOM node after render
    setTimeout(() => {
      const el = document.getElementById(`ripple-${id}`);
      if (el) {
        gsap.to(el, {
          width: 500,
          height: 500,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => {
            setRipples((prev) => prev.filter((r) => r.id !== id));
          },
        });
      }
    }, 0);
  }, []);

  return (
    <Link href={href} passHref legacyBehavior>
      <a
        ref={buttonRef}
        className={`${baseClasses} ${variantClasses}`}
        onClick={handleClick}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            id={`ripple-${r.id}`}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: 0,
              height: 0,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        ))}
        {children}
      </a>
    </Link>
  );
}
