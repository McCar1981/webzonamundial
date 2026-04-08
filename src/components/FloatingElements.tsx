"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function FloatingElements() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(".floating-element");
    
    const ctx = gsap.context(() => {
      elements.forEach((el, i) => {
        // Movimiento flotante aleatorio
        gsap.to(el, {
          y: `random(-30, 30)`,
          x: `random(-20, 20)`,
          rotation: `random(-15, 15)`,
          duration: `random(3, 6)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.5
        });

        // Opacidad pulsante
        gsap.to(el, {
          opacity: `random(0.3, 0.8)`,
          duration: `random(2, 4)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3
        });
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Elementos geométricos flotantes */}
      <div className="floating-element absolute top-[10%] left-[5%] w-4 h-4 border border-[#C9A84C]/40 rotate-45" />
      <div className="floating-element absolute top-[20%] right-[10%] w-6 h-6 rounded-full border border-[#C9A84C]/30" />
      <div className="floating-element absolute top-[40%] left-[8%] w-3 h-3 bg-[#C9A84C]/20 rotate-12" />
      <div className="floating-element absolute top-[60%] right-[5%] w-5 h-5 border-2 border-[#C9A84C]/25 rotate-[30deg]" />
      <div className="floating-element absolute top-[75%] left-[15%] w-4 h-4 rounded-full bg-[#C9A84C]/15" />
      <div className="floating-element absolute top-[85%] right-[20%] w-3 h-3 border border-[#C9A84C]/35" />
      
      {/* Hexágonos */}
      <svg className="floating-element absolute top-[15%] left-[20%] w-8 h-8 text-[#C9A84C]/20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z"/>
      </svg>
      <svg className="floating-element absolute top-[50%] right-[15%] w-6 h-6 text-[#C9A84C]/15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z"/>
      </svg>
      <svg className="floating-element absolute top-[70%] left-[25%] w-10 h-10 text-[#C9A84C]/10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z"/>
      </svg>

      {/* Estrellas */}
      <svg className="floating-element absolute top-[25%] right-[25%] w-4 h-4 text-[#C9A84C]/30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <svg className="floating-element absolute top-[45%] left-[30%] w-3 h-3 text-[#C9A84C]/25" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </div>
  );
}
