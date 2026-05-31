// src/app/historia/eras/page.tsx
// ZonaMundial — Las 7 eras del Mundial

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllEras, getEdicionBySlug } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Las 7 Eras del Mundial — Pionera, Posguerra, Clásica, Moderna, Global, Contemporánea | ZonaMundial",
  description:
    "Las eras del Mundial: Pionera (1930), Entreguerras (1934-38), Posguerra (1950-54), Clásica (1958-70), Moderna (1974-90), Global (1994-2010), Contemporánea (2014-26).",
  alternates: { canonical: "https://zonamundial.app/historia/eras" },
  openGraph: {
    title: "Las 7 Eras del Mundial | ZonaMundial",
    description: "Cronología narrativa de la historia mundialista por épocas.",
    url: "https://zonamundial.app/historia/eras",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function ErasPage() {
  const eras = getAllEras();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Eras</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Cronología por épocas
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Las 7 Eras del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Casi un siglo de fútbol mundialista narrado por épocas. De la Era Pionera
          (1930) a la Contemporánea (2014-2026), pasando por la Clásica de Pelé y la
          Moderna de Maradona.
        </p>
      </header>

      <section>
        <div className="space-y-4 sm:space-y-6">
          {eras.map((era) => (
            <article
              key={era.slug}
              className="rounded-2xl border bg-[#0F1D32]/60 overflow-hidden"
              style={{ borderColor: `${era.color}33` }}
            >
              {/* Banda de color superior */}
              <div className="h-1.5" style={{ background: era.color }} />

              <div className="p-5 sm:p-6">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span
                    className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase"
                    style={{ color: era.color }}
                  >
                    {era.anios}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {era.nombre}
                  </h2>
                </div>
                <p className="italic text-sm text-gray-300 mb-4">«{era.subtitulo}»</p>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-5 max-w-[70ch]">
                  {era.descripcion}
                </p>

                <div
                  className="p-3 rounded-lg mb-5"
                  style={{
                    background: `${era.color}10`,
                    borderLeft: `3px solid ${era.color}`,
                  }}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: era.color }}
                  >
                    Dato clave
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{era.datoClave}</p>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {era.ediciones.length} edición{era.ediciones.length > 1 ? "es" : ""}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {era.ediciones.map((slug) => {
                      const ed = getEdicionBySlug(slug);
                      if (!ed) return null;
                      return (
                        <Link
                          key={slug}
                          href={`/historia/${slug}`}
                          className="px-3 py-1.5 rounded-full bg-[#0B1825] border border-[#1E293B] text-xs text-gray-300 hover:text-white hover:border-[#C9A84C]/40 no-underline transition-all"
                        >
                          {ed.meta.nombreCorto}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="eras" />
    </>
  );
}
