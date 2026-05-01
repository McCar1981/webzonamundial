// src/components/blog/ReadingProgress.tsx
// Barra dorada fija en la parte superior que se llena conforme el usuario
// lee el artículo. Calculada por scrollY relativo al alto del article.

"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const compute = () => {
      const article = document.querySelector("article[data-article]");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const ratio = Math.max(0, Math.min(1, scrolled / Math.max(1, total)));
      setPct(ratio * 100);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #C9A84C, #FDE68A)",
          boxShadow: "0 0 14px rgba(253, 230, 138, 0.6)",
          transition: "width 80ms linear",
        }}
      />
    </div>
  );
}
