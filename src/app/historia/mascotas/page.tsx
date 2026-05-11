// src/app/historia/mascotas/page.tsx
// ZonaMundial — Cronología de mascotas oficiales del Mundial 1966-2026

import type { Metadata } from "next";
import Link from "next/link";
import { getAllMascotas } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Mascotas Oficiales del Mundial — Willie, Naranjito, Pique, La'eeb 1966-2026 | ZonaMundial",
  description:
    "Las mascotas oficiales del Mundial: del primer Willie de 1966 al trío Maple/Zayu/Clutch de 2026. Naranjito, Pique, Footix, Zakumi, Fuleco y todas las demás.",
  keywords: [
    "mascotas mundial",
    "naranjito 1982",
    "pique 1986",
    "footix 1998",
    "zakumi 2010",
    "la'eeb 2022",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/mascotas" },
  openGraph: {
    title: "Las mascotas oficiales del Mundial 1966-2026 | ZonaMundial",
    description: "Cronología completa de mascotas mundialistas con su historia.",
    url: "https://zonamundial.app/historia/mascotas",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function MascotasPage() {
  const mascotas = getAllMascotas();

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
          <li className="text-[#C9A84C]">Mascotas</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          1966 — 2026
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Mascotas del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {mascotas.length} mascotas oficiales desde el primer Willie inglés de 1966.
          Iconos pop, controversias comerciales, naranjas con serie de animación, y
          un trío para 2026.
        </p>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {mascotas.map((m, i) => (
            <Link
              key={m.anio}
              href={`/historia/${m.edicionSlug}`}
              className="block p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-2xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {m.anio}
                </span>
                <span className="text-base sm:text-lg font-bold text-white">{m.nombre}</span>
                <span className="ml-auto text-[10px] text-gray-500 tabular-nums">#{i + 1}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
                <span>
                  <span className="text-gray-500">Tipo:</span> {m.tipo}
                </span>
                <span>•</span>
                <span>
                  <span className="text-gray-500">Diseño:</span> {m.diseñador}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{m.datoClave}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
