"use client";

import { useState } from "react";
import { BG2, IMGS } from "../constants";

export function AppBannerSection({ h }: { h: any }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ background: BG2 }}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 via-transparent to-[#C9A84C]/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff6b35]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-xl mx-auto relative z-10">
        <div className="relative rounded-3xl border-2 border-dashed border-[#ff6b35]/40 bg-[#0B1825] p-8 sm:p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 to-transparent pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ff6b35]/30 bg-[#ff6b35]/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse" />
              <span className="text-[#ff6b35] text-xs font-bold tracking-widest uppercase">{h.appBanner.coming}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {h.waitlist.title}
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              {h.waitlist.subtitle}
            </p>

            {submitted ? (
              <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-6 py-5 text-center">
                <p className="text-[#C9A84C] font-bold text-lg">{h.waitlist.successTitle}</p>
                <p className="text-gray-400 text-sm mt-1">{h.waitlist.successSubtitle}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={h.waitlist.placeholder}
                  className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#ff6b35]/60 focus:ring-1 focus:ring-[#ff6b35]/30 transition-all"
                />
                <button
                  type="submit"
                  className="px-7 py-4 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#ff8f5a] text-white font-bold hover:shadow-[0_0_30px_rgba(255,107,53,0.4)] hover:scale-[1.02] transition-all"
                >
                  {h.waitlist.cta}
                </button>
              </form>
            )}

            {!submitted && (
              <p className="text-gray-400 text-sm mb-6">{h.waitlist.hint}</p>
            )}

            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[IMGS.c_jose_cobo, IMGS.c_svgiago, IMGS.c_pimpeano, IMGS.c_nachocp].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-[#0B1825] object-cover"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                <span className="font-bold text-white">1.247</span> {h.waitlist.counterLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
