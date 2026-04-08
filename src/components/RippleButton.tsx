"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function RippleButton({ children, onClick, className = "" }: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleClick = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Crear elemento ripple
      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201, 168, 76, 0.6) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
      `;
      
      button.appendChild(ripple);

      // Animar ripple
      gsap.to(ripple, {
        width: 400,
        height: 400,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => ripple.remove()
      });

      onClick?.();
    };

    button.addEventListener("click", handleClick);
    return () => button.removeEventListener("click", handleClick);
  }, [onClick]);

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      style={{ transform: "translateZ(0)" }}
    >
      {children}
    </button>
  );
}
