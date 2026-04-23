"use client";

import Link from "next/link";
import { RefObject } from "react";
import { BG } from "../constants";
import { useCountdown } from "../hooks/useCountdown";

const CARDS = [
  {
    num: "01",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="i-col1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="3" y="4" width="7.5" height="16" rx="1.5" fill="url(#i-col1)" stroke="#c9a84c" strokeWidth="1.4" />
        <rect x="12.5" y="4" width="3.5" height="16" rx="1" fill="url(#i-col1)" stroke="#c9a84c" strokeWidth="1.2" />
        <rect x="17.5" y="4" width="4" height="16" rx="1" fill="url(#i-col1)" stroke="#c9a84c" strokeWidth="1.2" />
        <circle cx="6.75" cy="17" r="1.3" fill="#c9a84c" />
        <circle cx="14.25" cy="17" r="1" fill="#c9a84c" />
        <circle cx="19.5" cy="17" r="1.1" fill="#c9a84c" />
      </svg>
    ),
  },
  {
    num: "02",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <defs>
          <radialGradient id="i-star" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.08" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="9.5" fill="url(#i-star)" stroke="#c9a84c" strokeWidth="1.4" />
        <path d="M12 4l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 10.6l6.2-.9z" fill="#c9a84c" fillOpacity="0.3" stroke="#c9a84c" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "03",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="i-swap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d48a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8a6f2a" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect x="4" y="5.5" width="7.5" height="13" rx="2" fill="url(#i-swap)" stroke="#c9a84c" strokeWidth="1.3" />
        <rect x="13.5" y="5.5" width="7.5" height="13" rx="2" fill="url(#i-swap)" stroke="#c9a84c" strokeWidth="1.3" />
        <path d="M11.5 8.5l3.5 3.5-3.5 3.5" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 12h6" stroke="#c9a84c" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function AlbumSection({
  h,
  albumRef,
}: {
  h: any;
  albumRef: RefObject<HTMLDivElement | null>;
}) {
  const cd = useCountdown("2026-05-01T00:00:00-05:00");

  const texts = [
    { title: h.albumSection.card1Title, desc: h.albumSection.card1Desc },
    { title: h.albumSection.card2Title, desc: h.albumSection.card2Desc },
    { title: h.albumSection.card3Title, desc: h.albumSection.card3Desc },
  ];

  const units = [
    { v: cd.d, l: h.albumSection.countdownDays },
    { v: cd.h, l: h.albumSection.countdownHours },
    { v: cd.m, l: h.albumSection.countdownMin },
    { v: cd.s, l: h.albumSection.countdownSec },
  ];

  return (
    <section ref={albumRef} className="py-24 px-4 relative overflow-hidden" style={{ background: BG }}>
      {/* Background spotlights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#C9A84C]/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-[#ff6b35]/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Decorative floating stickers */}
      <div className="absolute top-16 right-[10%] w-20 h-24 rounded-xl border-2 border-[#C9A84C]/20 bg-gradient-to-br from-[#C9A84C]/10 to-transparent rotate-12 opacity-60 pointer-events-none hidden lg:block" />
      <div className="absolute bottom-24 left-[8%] w-16 h-20 rounded-xl border-2 border-[#C9A84C]/15 bg-gradient-to-br from-[#C9A84C]/8 to-transparent -rotate-6 opacity-50 pointer-events-none hidden lg:block" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with hero image */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14 mb-14">
          {/* Image */}
          <div className="flex-shrink-0 relative group">
            <div className="absolute -inset-4 bg-[#C9A84C]/15 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative rounded-3xl border-2 border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1D32] to-[#0B1825] p-4 sm:p-5 shadow-[0_0_60px_rgba(201,168,76,0.15)] group-hover:border-[#C9A84C]/60 group-hover:shadow-[0_0_80px_rgba(201,168,76,0.3)] transition-all duration-500">
              <img
                src="/img/zonamundial-images/4250c5f8-7831-4fcd-bd97-7a82a51df125.webp"
                alt="Álbum Mundial 2026"
                className="w-[240px] sm:w-[290px] lg:w-[330px] h-auto rounded-2xl group-hover:scale-[1.03] transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#C9A84C]/5 to-transparent pointer-events-none" />
            </div>
          </div>
          {/* Text */}
          <div className="text-center lg:text-left flex-1">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-[#E8D48B] to-[#ff6b35]">
                {h.albumSection.title}
              </span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto lg:mx-0 text-lg sm:text-xl leading-relaxed">
              {h.albumSection.subtitle}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {texts.map((t, i) => (
            <div
              key={i}
              className="album-card group relative p-7 sm:p-8 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0F1D32] to-[#0B1825] transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{
                boxShadow: "0 0 0 0 transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.35)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 25px 60px rgba(201,168,76,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 transparent";
              }}
            >
              {/* Large number watermark */}
              <span className="absolute top-3 right-4 text-7xl font-black text-[#C9A84C]/[0.04] leading-none select-none">
                {CARDS[i].num}
              </span>

              {/* Top accent line */}
              <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center border border-[#C9A84C]/25 bg-[#C9A84C]/10 mb-6 group-hover:scale-110 group-hover:border-[#C9A84C]/50 group-hover:shadow-[0_0_30px_rgba(201,168,76,0.2)] transition-all duration-300">
                {CARDS[i].icon}
              </div>

              {/* Content */}
              <h3 className="relative z-10 text-2xl font-bold text-white mb-3 group-hover:text-[#C9A84C] transition-colors duration-300">
                {t.title}
              </h3>
              <p className="relative z-10 text-gray-400 text-[15px] leading-loose">
                {t.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Founder offer + countdown */}
        <div className="relative rounded-3xl border border-dashed border-[#C9A84C]/30 bg-gradient-to-b from-[#0F1D32] to-[#0B1825] p-8 sm:p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-5">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
              {h.albumSection.founderLabel}
            </span>

            {/* Countdown */}
            <div className="flex gap-3 sm:gap-4 mb-8">
              {units.map((u, idx) => (
                <div key={idx} className="text-center">
                  <div className="relative w-[64px] sm:w-[80px] h-[64px] sm:h-[80px] rounded-2xl bg-gradient-to-br from-[#0F1D32] to-[#0B1825] border border-[#C9A84C]/20 flex items-center justify-center shadow-lg">
                    <span className="text-2xl sm:text-3xl font-black text-[#C9A84C] tabular-nums">
                      {String(u.v).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-gray-500 font-semibold mt-2 block tracking-widest uppercase">
                    {u.l}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/registro"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] text-[#030712] hover:shadow-[0_0_50px_rgba(201,168,76,0.45)] hover:scale-105 transition-all duration-300 mb-4"
            >
              {h.albumSection.cta}
              <span className="text-xl">→</span>
            </Link>

            <p className="text-sm text-gray-500">
              {h.albumSection.countdownSub}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
