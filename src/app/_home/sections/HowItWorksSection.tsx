"use client";

import { RefObject } from "react";
import { BG2 } from "../constants";
import { LuxuryTextReveal } from "@/components/LuxuryTextReveal";

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      </svg>
    ),
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h12v5a6 6 0 0 1-12 0V3z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6 5H4a2.5 2.5 0 0 0 0 5h1M18 5h2a2.5 2.5 0 0 1 0 5h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M10 13.5v4h-1.5a1 1 0 0 0-1 1V21h9v-2.5a1 1 0 0 0-1-1H14v-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 5.5l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8L9.4 7.4l1.8-.3z" fill="currentColor" />
      </svg>
    ),
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="1.5" y="5.5" width="21" height="13" rx="2.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 14.5v-5l5 2.5z" fill="currentColor" fillOpacity="0.7" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="18" cy="9" r="2" fill="#060B14" stroke="currentColor" strokeWidth="1" />
        <circle cx="18" cy="9" r="0.8" fill="#ff4444" />
      </svg>
    ),
  },
];

export function HowItWorksSection({
  h,
  sectionRef,
}: {
  h: any;
  sectionRef: RefObject<HTMLDivElement | null>;
}) {
  const steps = [
    { num: h.howItWorks.step1Num, title: h.howItWorks.step1Title, desc: h.howItWorks.step1Desc },
    { num: h.howItWorks.step2Num, title: h.howItWorks.step2Title, desc: h.howItWorks.step2Desc },
    { num: h.howItWorks.step3Num, title: h.howItWorks.step3Title, desc: h.howItWorks.step3Desc },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-4 relative overflow-hidden" style={{ background: BG2 }}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 via-transparent to-[#C9A84C]/5 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <span className="inline-block px-5 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold tracking-wider uppercase mb-6">
            {h.howItWorks.badge}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            <LuxuryTextReveal>{h.howItWorks.title}</LuxuryTextReveal>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            {h.howItWorks.subtitle}
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Línea conectora en desktop */}
          <div className="hidden md:block absolute top-[3.25rem] left-[16.666%] right-[16.666%] h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

          {steps.map((s, i) => (
            <div key={i} className="howitworks-card relative text-center">
              <div className="mx-auto mb-6 relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full border border-[#C9A84C]/20 bg-[#0B1825] shadow-[0_0_40px_rgba(201,168,76,0.08)] group hover:shadow-[0_0_60px_rgba(201,168,76,0.18)] hover:border-[#C9A84C]/40 transition-all duration-500">
                <div className="text-[#C9A84C] group-hover:scale-110 transition-transform duration-300">
                  {STEPS[i].icon}
                </div>
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-sm font-black mb-4">
                {s.num}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm sm:text-base max-w-xs mx-auto leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
