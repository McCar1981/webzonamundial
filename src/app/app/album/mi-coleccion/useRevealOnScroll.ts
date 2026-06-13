"use client";

import { useEffect } from "react";

export function useRevealOnScroll(deps: React.DependencyList = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.revealIn)"));
    if (!els.length) return;

    els.forEach((el) => el.classList.add("reveal"));

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("revealIn");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, deps);
}
