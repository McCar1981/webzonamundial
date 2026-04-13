"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  labels: string[];
  playLabel: string;
}

export function BracketDiagram({ labels, playLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const lines = svgRef.current?.querySelectorAll(".bracket-line");
      const nodes = svgRef.current?.querySelectorAll(".bracket-node");
      const labelsEls = svgRef.current?.querySelectorAll(".bracket-label");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      if (lines) {
        lines.forEach((line) => {
          const length = (line as SVGPathElement).getTotalLength?.() || 100;
          gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
        });
        tl.to(lines, {
          strokeDashoffset: 0,
          duration: 1.2,
          stagger: 0.05,
          ease: "power2.out",
        });
      }

      if (nodes) {
        tl.fromTo(
          nodes,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, stagger: 0.03, ease: "back.out(1.7)" },
          "-=0.8"
        );
      }

      if (labelsEls) {
        tl.fromTo(
          labelsEls,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" },
          "-=0.6"
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const playChampionPath = () => {
    if (!svgRef.current || isPlaying) return;
    setIsPlaying(true);

    const championLines = svgRef.current.querySelectorAll(".champ-line");
    const championNodes = svgRef.current.querySelectorAll(".champ-node");

    const tl = gsap.timeline({
      onComplete: () => setIsPlaying(false),
    });

    championLines.forEach((line) => {
      const length = (line as SVGPathElement).getTotalLength?.() || 100;
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
    });

    tl.to(championLines, {
      strokeDashoffset: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power2.out",
    });

    tl.to(
      championNodes,
      { scale: 1.6, fill: "#e8d48b", duration: 0.3, stagger: 0.15, ease: "back.out(2)", yoyo: true, repeat: 1 },
      "-=0.4"
    );
  };

  const handleNodeEnter = (e: React.MouseEvent, text: string) => {
    const rect = (e.target as SVGCircleElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
      text,
    });
  };

  const handleNodeLeave = () => setTooltip(null);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto py-8">
      <div className="mb-4 flex justify-end">
        <button
          onClick={playChampionPath}
          disabled={isPlaying}
          className="rounded-lg border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-3 py-1.5 text-xs font-semibold text-[#c9a84c] transition hover:bg-[#c9a84c]/20 disabled:opacity-50"
        >
          {playLabel}
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 900 360"
        className="h-auto w-full min-w-[700px]"
        style={{ maxWidth: 900 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#c9a84c" stopOpacity="1" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="champGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8d48b" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#e8d48b" stopOpacity="1" />
            <stop offset="100%" stopColor="#e8d48b" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Líneas normales */}
        {[
          [20, 30, 120, 30], [20, 70, 120, 70], [20, 110, 120, 110], [20, 150, 120, 150],
          [20, 190, 120, 190], [20, 230, 120, 230], [20, 270, 120, 270], [20, 310, 120, 310],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={`l1-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} className="bracket-line" stroke="url(#lineGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
        {[
          [120, 30, 120, 70], [120, 110, 120, 150], [120, 190, 120, 230], [120, 270, 120, 310],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={`v1-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} className="bracket-line" stroke="url(#lineGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
        {[
          [120, 50, 240, 50], [120, 130, 240, 130], [120, 210, 240, 210], [120, 290, 240, 290],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={`l2-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} className="bracket-line" stroke="url(#lineGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ))}
        {[
          [240, 50, 240, 130], [240, 210, 240, 290],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={`v2-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} className="bracket-line" stroke="url(#lineGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ))}
        {[
          [240, 90, 380, 90], [240, 250, 380, 250],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={`l3-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} className="bracket-line" stroke="url(#lineGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
        ))}
        <path d="M 380 90 L 380 250" className="bracket-line" stroke="url(#lineGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 380 170 L 520 170" className="bracket-line" stroke="url(#lineGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 520 170 L 660 170" className="bracket-line" stroke="#e8d48b" strokeWidth="5" fill="none" strokeLinecap="round" />

        {/* Líneas doradas del campeón (superpuestas, ocultas inicialmente) */}
        {[
          [20, 30, 120, 30], [120, 30, 120, 70], [120, 70, 240, 70],
          [240, 70, 240, 130], [240, 130, 380, 130], [380, 130, 380, 170],
          [380, 170, 520, 170], [520, 170, 660, 170],
        ].map(([x1, y1, x2, y2], i) => (
          <path key={`c-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} className="champ-line" stroke="url(#champGradient)" strokeWidth={i >= 6 ? 5 : 3.5} fill="none" strokeLinecap="round" opacity={0} />
        ))}

        {/* Nodos */}
        {[
          [20, 30], [20, 70], [20, 110], [20, 150], [20, 190], [20, 230], [20, 270], [20, 310],
          [120, 50], [120, 130], [120, 210], [120, 290],
          [240, 90], [240, 250],
          [380, 170],
          [520, 170],
          [660, 170],
        ].map(([cx, cy], i) => (
          <circle
            key={`node-${i}`}
            cx={cx}
            cy={cy}
            r={i >= 14 ? 10 : 7}
            className={`bracket-node ${i >= 14 ? "champ-node" : ""}`}
            fill={i >= 14 ? "#e8d48b" : i < 8 ? "#f59e0b" : "#c9a84c"}
            stroke="#060B14"
            strokeWidth={2}
            style={{ opacity: 0, cursor: "pointer" }}
            onMouseEnter={(e) => handleNodeEnter(e, labels[Math.min(i < 8 ? 0 : i < 12 ? 1 : i < 14 ? 2 : i < 15 ? 3 : i < 16 ? 4 : 5, labels.length - 1)] || "")}
            onMouseLeave={handleNodeLeave}
          />
        ))}

        {/* Etiquetas de rondas */}
        {[
          { x: 70, y: 340, label: labels[0] || "32avos" },
          { x: 180, y: 340, label: labels[1] || "Octavos" },
          { x: 310, y: 340, label: labels[2] || "Cuartos" },
          { x: 450, y: 340, label: labels[3] || "Semifinales" },
          { x: 590, y: 340, label: labels[4] || "Final" },
          { x: 660, y: 140, label: labels[5] || "Campeón", size: "14px", weight: 800 },
        ].map((item, i) => (
          <text
            key={`label-${i}`}
            x={item.x}
            y={item.y}
            className="bracket-label"
            fill="#8a94b0"
            fontSize={(item as any).size || "12px"}
            fontWeight={(item as any).weight || 600}
            textAnchor="middle"
            style={{ opacity: 0 }}
          >
            {item.label}
          </text>
        ))}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-[#c9a84c]/30 bg-[#0B1825] px-2 py-1 text-xs font-semibold text-[#c9a84c] shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
