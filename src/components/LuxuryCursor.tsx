"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function LuxuryCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Solo en desktop
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const dot = cursorDotRef.current;
    if (!cursor || !dot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      // Smooth follow con easing
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;

      gsap.set(cursor, {
        x: cursorX - 20,
        y: cursorY - 20
      });

      gsap.set(dot, {
        x: mouseX - 4,
        y: mouseY - 4
      });

      requestAnimationFrame(animate);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Detectar elementos interactivos
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select")) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select")) {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    animate();

    // Ocultar cursor nativo
    document.body.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.body.style.cursor = "auto";
    };
  }, []);

  // No mostrar en móvil
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Círculo exterior dorado */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          border: "2px solid rgba(201, 168, 76, 0.8)",
          borderRadius: "50%",
          transform: `scale(${isHovering ? 1.5 : 1}) ${isClicking ? "scale(0.9)" : ""}`,
          transition: "transform 0.2s ease-out, border-color 0.2s ease",
          boxShadow: isHovering 
            ? "0 0 30px rgba(201, 168, 76, 0.6), inset 0 0 20px rgba(201, 168, 76, 0.2)" 
            : "0 0 10px rgba(201, 168, 76, 0.3)"
        }}
      />
      {/* Punto central */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 pointer-events-none z-[9999]"
        style={{
          background: "radial-gradient(circle, #C9A84C 0%, #E8D48B 100%)",
          borderRadius: "50%",
          boxShadow: "0 0 10px rgba(201, 168, 76, 0.8)",
          transform: `scale(${isClicking ? 0.5 : 1})`,
          transition: "transform 0.1s ease"
        }}
      />
    </>
  );
}
