"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LuxuryTextRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export function LuxuryTextReveal({ children, className = "", delay = 0 }: LuxuryTextRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated.current) return;

    const chars = container.querySelectorAll(".char");
    
    const ctx = gsap.context(() => {
      gsap.fromTo(chars,
        {
          opacity: 0,
          y: 100,
          rotationX: -90,
          transformOrigin: "center bottom"
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.03,
          delay: delay,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            once: true,
            onEnter: () => {
              hasAnimated.current = true;
            }
          }
        }
      );
    }, container);

    return () => ctx.revert();
  }, [delay]);

  // Dividir texto en caracteres
  const characters = children.split("").map((char, index) => (
    <span
      key={index}
      className="char inline-block"
      style={{ 
        display: char === " " ? "inline" : "inline-block",
        whiteSpace: char === " " ? "pre" : "normal"
      }}
    >
      {char}
    </span>
  ));

  return (
    <span ref={containerRef} className={className} style={{ perspective: "1000px" }}>
      {characters}
    </span>
  );
}
