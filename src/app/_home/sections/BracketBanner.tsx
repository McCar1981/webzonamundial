// BracketBanner — anuncia el Bracket Challenge desde el home.
// Mismo patrón visual que CalendarBanner para coherencia de marca.

"use client";

import Link from "next/link";

export function BracketBanner() {
  return (
    <section className="relative px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(11,24,37,0.85))",
          }}
        >
          {/* Glows decorativos */}
          <div
            aria-hidden
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,168,76,0.30), transparent 70%)",
              filter: "blur(48px)",
            }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(117,170,219,0.18), transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.25em] mb-3">
                🏆 Nuevo · Bracket Challenge
              </div>
              <h2
                className="font-black text-white mb-3 leading-tight"
                style={{
                  fontSize: "clamp(22px, 3.6vw, 36px)",
                  letterSpacing: "-0.02em",
                }}
              >
                Construye tu{" "}
                <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
                  Bracket Mundial 2026
                </span>
              </h2>
              <p className="text-sm text-[#cbd5e1] leading-relaxed max-w-2xl">
                Predice los 104 partidos: 48 selecciones, 12 grupos, fase de
                grupos, 32avos hasta la final. Dos vistas: clásica tipo árbol o{" "}
                <b className="text-[#FDE68A]">cósmica Supernova</b>. Anónimo,
                sin registro, se guarda en tu dispositivo.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#94a3b8]">
                <span>⚡ 104 partidos</span>
                <span>🎨 Vista clásica + cósmica</span>
                <span>🔒 Sin login</span>
                <span>📤 Comparte tu bracket</span>
              </div>
            </div>
            <div className="flex md:justify-end">
              <Link
                href="/bracket"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-[#1A1208] transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, #C9A84C 0%, #E8C76B 50%, #FDE68A 100%)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)",
                }}
              >
                Empezar mi Bracket
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
