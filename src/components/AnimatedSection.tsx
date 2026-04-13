"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delay?: number;
  selector?: string;
  y?: number;
  duration?: number;
  once?: boolean;
}

export function AnimatedSection({
  children,
  className = "",
  style,
  stagger = 0.08,
  delay = 0,
  selector = "> *",
  y = 40,
  duration = 0.6,
  once = true,
}: AnimatedSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const normalizedSelector = selector.startsWith(">")
        ? `:scope ${selector}`
        : selector;
      const targets = containerRef.current?.querySelectorAll(normalizedSelector);
      if (!targets || targets.length === 0) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 82%",
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [selector, stagger, delay, y, duration, once]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}
