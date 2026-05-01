// src/components/bracket/CosmosBackground.tsx
// Canvas con estrellas + partículas doradas para la vista cósmica.
// Pausa el RAF cuando la pestaña no está visible (ahorro de batería).

"use client";

import { useEffect, useRef } from "react";

export default function CosmosBackground() {
  const starsRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stars = starsRef.current;
    const particles = particlesRef.current;
    if (!stars || !particles) return;

    let raf = 0;
    let running = true;

    const fit = (c: HTMLCanvasElement) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      c.getContext("2d")?.scale(dpr, dpr);
    };
    fit(stars);
    fit(particles);

    const starsArr = Array.from({ length: 140 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * 0.02,
      gold: Math.random() < 0.05,
    }));
    const particlesArr = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.4 - 0.1,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.5 + 0.1,
    }));

    const drawStars = () => {
      const ctx = stars.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, stars.width, stars.height);
      starsArr.forEach((s) => {
        s.a += s.tw * (Math.random() > 0.5 ? 1 : -1);
        s.a = Math.max(0.1, Math.min(1, s.a));
        ctx.fillStyle = s.gold ? `rgba(253,230,138,${s.a})` : `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawParticles = () => {
      const ctx = particles.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, particles.width, particles.height);
      particlesArr.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = window.innerHeight + 10;
          p.x = Math.random() * window.innerWidth;
        }
        if (p.x < -10 || p.x > window.innerWidth + 10) p.x = Math.random() * window.innerWidth;
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grd.addColorStop(0, `rgba(253,230,138,${p.a})`);
        grd.addColorStop(1, `rgba(253,230,138,0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = () => {
      if (!running) return;
      drawStars();
      drawParticles();
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => {
      fit(stars);
      fit(particles);
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        loop();
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <canvas
        ref={starsRef}
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      />
      <canvas
        ref={particlesRef}
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />
    </>
  );
}
