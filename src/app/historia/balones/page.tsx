// src/app/historia/balones/page.tsx
// ZonaMundial — Cronología de los 23 balones oficiales del Mundial 1930-2026

import type { Metadata } from "next";
import Link from "next/link";
import { getAllBalones } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Balones Oficiales del Mundial — Tiento, Telstar, Tango, Trionda 1930-2026 | ZonaMundial",
  description:
    "Los 23 balones oficiales del Mundial: del Tiento de Uruguay 1930 al Trionda de Norteamérica 2026. Adidas y su monopolio de 56 años, paneles, evolución tecnológica.",
  keywords: [
    "balones mundial",
    "telstar 1970",
    "tango adidas",
    "jabulani",
    "brazuca",
    "al rihla",
    "trionda 2026",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/balones" },
  openGraph: {
    title: "Los 23 balones oficiales del Mundial 1930-2026 | ZonaMundial",
    description: "Cronología completa: Tiento, Telstar, Tango, Brazuca, Al Rihla, Trionda.",
    url: "https://zonamundial.app/historia/balones",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function BalonesPage() {
  const balones = getAllBalones();
  const adidasFrom = balones.find((b) => b.fabricante === "Adidas")?.anio ?? 1970;
  const adidasYears = 2026 - adidasFrom;

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li>
            <Link href="/" className="hover:text-[#C9A84C]">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/historia" className="hover:text-[#C9A84C]">
              Historia
            </Link>
          </li>
          <li>/</li>
          <li className="text-[#C9A84C]">Balones</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          1930 — 2026
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los Balones del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {balones.length} balones oficiales desde el Tiento uruguayo de 1930 hasta el
          Trionda tripartito de 2026. Adidas lleva {adidasYears} años de monopolio
          ininterrumpido (desde el Telstar 1970), evolucionando de 32 a solo 4 paneles.
        </p>
      </header>

      {/* RESUMEN STATS */}
      <section className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60">
          <div className="text-2xl font-black" style={{ color: GOLD }}>
            {balones.length}
          </div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">
            Balones oficiales
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60">
          <div className="text-2xl font-black" style={{ color: GOLD }}>
            {adidasYears}a
          </div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">
            Adidas ininterrumpido
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60">
          <div className="text-2xl font-black" style={{ color: GOLD }}>
            32 → 4
          </div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">
            Reducción paneles
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60">
          <div className="text-2xl font-black" style={{ color: GOLD }}>
            1986
          </div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">
            Primer 100% sintético
          </div>
        </div>
      </section>

      {/* CRONOLOGÍA */}
      <section>
        <div className="space-y-3 sm:space-y-4">
          {balones.map((b, i) => {
            const esAdidas = b.fabricante === "Adidas";
            return (
              <Link
                key={b.anio}
                href={`/historia/${b.edicionSlug}`}
                className="block p-4 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
              >
                <div className="flex items-baseline gap-3 sm:gap-5 flex-wrap mb-2">
                  <span
                    className="text-2xl sm:text-3xl font-black tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {b.anio}
                  </span>
                  <span className="text-base sm:text-xl font-bold text-white">
                    {b.nombre}
                  </span>
                  {esAdidas && (
                    <span className="text-[10px] font-bold text-white bg-[#000]/40 px-2 py-0.5 rounded">
                      ADIDAS
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-gray-500">#{i + 1}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-5 flex-wrap text-xs sm:text-sm text-gray-400 mb-3">
                  <span>
                    <span className="text-gray-500">Fabricante:</span>{" "}
                    <span className="text-gray-200">{b.fabricante}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-gray-500">Paneles:</span>{" "}
                    <span className="text-gray-200 tabular-nums">{b.paneles}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-gray-500">Color:</span>{" "}
                    <span className="text-gray-200">{b.color}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{b.datoClave}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
