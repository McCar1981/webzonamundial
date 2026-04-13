"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ModuleItem } from "../types";

export function CarouselRows({
  modules,
  label1,
  label2,
}: {
  modules: ModuleItem[];
  label1?: string;
  label2?: string;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const currentRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const handleDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    rowRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!rowRef.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    scrollStartX.current = rowRef.current.scrollLeft;
    currentRowRef.current = rowRef.current;
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !currentRowRef.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const walk = (clientX - dragStartX.current) * 1.5;
    currentRowRef.current.scrollLeft = scrollStartX.current - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    currentRowRef.current = null;
    setTimeout(() => setIsPaused(false), 100);
  };

  const row1Items = [...modules, ...modules];
  const row2Items = [...modules.slice(4), ...modules, ...modules.slice(0, 4)];

  return (
    <>
      {/* Carrusel fila 1 — izquierda */}
      <div className="relative mb-4">
        {label1 && (
          <div className="absolute -top-6 left-6 z-20 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            {label1}
          </div>
        )}
        <div
          ref={row1Ref}
          className={`relative overflow-x-auto overflow-y-hidden scrollbar-hide ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={(e) => handleDragStart(e, row1Ref)}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e, row1Ref)}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="flex gap-4"
            style={{
              width: "max-content",
              animation: reducedMotion ? "none" : "carousel-left 45s linear infinite",
              animationPlayState: reducedMotion || isPaused || isDragging ? "paused" : "running",
            }}
          >
            {row1Items.map((m, i) => (
              <Link
                key={i}
                href={m.href || "/la-app"}
                className="flex-shrink-0 w-64 group select-none"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => !isDragging && setIsPaused(false)}
                draggable={false}
              >
                <div
                  className="relative h-full p-5 rounded-2xl overflow-hidden transition-all duration-400 hover:border-opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}0D 0%, #0B1825 60%)`,
                    border: `1px solid ${m.color}22`,
                  }}
                >
                  <div
                    className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                    style={{ background: m.color }}
                  />
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: `${m.color}1A`,
                      boxShadow: `0 0 0 1px ${m.color}30`,
                    }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center drop-shadow-lg">
                      {m.icon}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-[15px] mb-2 leading-tight group-hover:text-opacity-80 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{m.desc}</p>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-50"
                    style={{
                      background: `linear-gradient(90deg, ${m.color}, transparent)`,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#060B14] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#060B14] to-transparent z-10 pointer-events-none" />
        </div>
      </div>

      {/* Carrusel fila 2 — derecha */}
      <div className="relative">
        {label2 && (
          <div className="absolute -top-6 right-6 z-20 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            {label2}
          </div>
        )}
        <div
          ref={row2Ref}
          className={`relative overflow-x-auto overflow-y-hidden scrollbar-hide ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={(e) => handleDragStart(e, row2Ref)}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e, row2Ref)}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="flex gap-4"
            style={{
              width: "max-content",
              animation: reducedMotion ? "none" : "carousel-right 55s linear infinite",
              animationPlayState: reducedMotion || isPaused || isDragging ? "paused" : "running",
            }}
          >
            {row2Items.map((m, i) => (
              <Link
                key={i}
                href={m.href || "/la-app"}
                className="flex-shrink-0 w-64 group select-none"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => !isDragging && setIsPaused(false)}
                draggable={false}
              >
                <div
                  className="relative h-full p-5 rounded-2xl overflow-hidden transition-all duration-400 hover:border-opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}0D 0%, #0B1825 60%)`,
                    border: `1px solid ${m.color}22`,
                  }}
                >
                  <div
                    className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                    style={{ background: m.color }}
                  />
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: `${m.color}1A`,
                      boxShadow: `0 0 0 1px ${m.color}30`,
                    }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center drop-shadow-lg">
                      {m.icon}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-[15px] mb-2 leading-tight group-hover:text-opacity-80 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{m.desc}</p>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-50"
                    style={{
                      background: `linear-gradient(90deg, ${m.color}, transparent)`,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#060B14] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#060B14] to-transparent z-10 pointer-events-none" />
        </div>
      </div>

      <style>{`
        @keyframes carousel-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes carousel-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
