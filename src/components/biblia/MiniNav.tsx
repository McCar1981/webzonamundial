"use client";

import { useEffect, useRef, useState } from "react";

/*
  MiniNav (BIBLIA Mundial 2026)

  Barra horizontal sticky que aparece tras pasar el hero. Cada item
  hace scroll suave a su ancla. Resalta el ítem activo basándose en
  IntersectionObserver de las secciones.

  Aparece debajo del header global (top-16 ≈ 64px).
*/

interface Section {
  id: string;
  label: string;
}

export default function MiniNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const [visible, setVisible] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  // Aparece al pasar 70vh (debajo del hero)
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tracker de sección activa
  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Toma la sección más visible que esté arriba
        const topVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (topVisible) setActive(topVisible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 130; // header global + minimal margin
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <nav
      ref={navRef}
      aria-label="Secciones de la ficha"
      className="sticky top-16 z-30 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          background: "rgba(11,24,37,0.85)",
          backdropFilter: "blur(18px) saturate(180%)",
          WebkitBackdropFilter: "blur(18px) saturate(180%)",
          borderTop: "1px solid rgba(201,168,76,0.08)",
          borderBottom: "1px solid rgba(201,168,76,0.12)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ul
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5"
            style={{ scrollbarWidth: "none" }}
          >
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <li key={s.id} className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
                    style={{
                      color: isActive ? "#030712" : "#cbd5e1",
                      background: isActive
                        ? "linear-gradient(135deg, #C9A84C, #A8893D)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#C9A84C";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#cbd5e1";
                      }
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <style jsx>{`
        ul::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}
