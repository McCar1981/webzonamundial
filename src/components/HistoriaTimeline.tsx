"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorldCupDetail } from "@/data/historia";

gsap.registerPlugin(ScrollTrigger);

interface HistoriaTimelineProps {
  data: WorldCupDetail[];
  isEN?: boolean;
}

function TimelineModal({
  wc,
  onClose,
  isEN,
}: {
  wc: WorldCupDetail;
  onClose: () => void;
  isEN: boolean;
}) {
  const labels = isEN
    ? {
        host: "Host",
        champion: "Champion",
        runnerUp: "Runner-up",
        final: "Final",
        topScorer: "Top scorer",
        anecdote: "Anecdote",
        close: "Close",
      }
    : {
        host: "Sede",
        champion: "Campeón",
        runnerUp: "Subcampeón",
        final: "Final",
        topScorer: "Goleador",
        anecdote: "Anécdota",
        close: "Cerrar",
      };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[#C9A84C]/30 p-6 sm:p-8"
        style={{ background: "#0B0F1A" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
          aria-label={labels.close}
        >
          ×
        </button>

        <div className="text-center mb-6">
          <span className="text-4xl sm:text-5xl font-black text-[#C9A84C]">
            {wc.year}
          </span>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-400">
            <img
              src={`https://flagcdn.com/w20/${wc.hostFlag}.png`}
              alt={wc.host}
              className="w-5 h-3.5 rounded-[1px] object-cover"
            />
            <span>{wc.host}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              {labels.champion}
            </p>
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/w20/${wc.champFlag}.png`}
                alt={wc.champion}
                className="w-5 h-3.5 rounded-[1px] object-cover"
              />
              <span className="text-sm font-bold text-white">{wc.champion}</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              {labels.runnerUp}
            </p>
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/w20/${wc.ruFlag}.png`}
                alt={wc.runnerUp}
                className="w-5 h-3.5 rounded-[1px] object-cover"
              />
              <span className="text-sm font-bold text-white">{wc.runnerUp}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#C9A84C]/5">
            <span className="text-xs text-gray-400">{labels.final}</span>
            <span className="text-sm font-bold text-[#C9A84C]">{wc.finalScore}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <span className="text-xs text-gray-400">{labels.topScorer}</span>
            <span className="text-sm font-bold text-white">{wc.topScorer}</span>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              {labels.anecdote}
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {isEN ? wc.anecdoteEN : wc.anecdoteES}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoriaTimeline({ data, isEN = false }: HistoriaTimelineProps) {
  const [selected, setSelected] = useState<WorldCupDetail | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        trackRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div ref={containerRef} className="relative">
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#C9A84C]/30 scrollbar-track-transparent"
        >
          {/* Left spacer */}
          <div className="flex-shrink-0 w-2 sm:w-4" />

          {data.map((wc, i) => {
            const isHostChamp = wc.host === wc.champion;
            return (
              <button
                key={wc.year}
                onClick={() => setSelected(wc)}
                className="group relative flex-shrink-0 w-[72px] sm:w-[88px] snap-start"
              >
                {/* Year label */}
                <div className="text-center mb-3">
                  <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-[#C9A84C] transition-colors">
                    {wc.year}
                  </span>
                </div>

                {/* Node */}
                <div className="relative h-12 sm:h-14 flex items-center justify-center">
                  {/* Horizontal line segments */}
                  <div
                    className="absolute h-[2px]"
                    style={{
                      background: "#C9A84C",
                      left: i === 0 ? "50%" : "0",
                      right: i === data.length - 1 ? "50%" : "0",
                      opacity: 0.4,
                    }}
                  />
                  {/* Circle */}
                  <div
                    className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      borderColor: isHostChamp ? "#22c55e" : "#C9A84C",
                      background: isHostChamp
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(201,168,76,0.12)",
                    }}
                  >
                    <img
                      src={`https://flagcdn.com/w20/${wc.champFlag}.png`}
                      alt={wc.champion}
                      className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-[1px] object-cover"
                    />
                  </div>
                </div>

                {/* Champion name */}
                <div className="text-center mt-2">
                  <span className="block text-[10px] sm:text-xs font-medium text-gray-300 truncate group-hover:text-white transition-colors">
                    {wc.champion}
                  </span>
                  {isHostChamp && (
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      {isEN ? "Host" : "Anfitrión"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Right spacer */}
          <div className="flex-shrink-0 w-2 sm:w-4" />
        </div>
      </div>

      {selected &&
        createPortal(
          <TimelineModal
            wc={selected}
            onClose={() => setSelected(null)}
            isEN={isEN}
          />,
          document.body
        )}
    </>
  );
}
