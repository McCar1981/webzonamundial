// src/app/historia/selecciones/page.tsx

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllSeleccionesHistoricas } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Selecciones Campeonas del Mundial — Brasil, Alemania, Italia, Argentina | ZonaMundial",
  description:
    "Las 8 selecciones campeonas del Mundial: Brasil (5), Alemania (4), Italia (4), Argentina (3), Francia (2), Uruguay (2), Inglaterra (1), España (1). Perfiles completos.",
  alternates: { canonical: "https://zonamundial.app/historia/selecciones" },
  openGraph: {
    title: "Selecciones Campeonas del Mundial | ZonaMundial",
    description: "Perfiles completos de las 8 selecciones que han ganado el Mundial.",
    url: "https://zonamundial.app/historia/selecciones",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function SeleccionesIndex() {
  const selecciones = getAllSeleccionesHistoricas();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Selecciones</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          8 selecciones campeonas
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Selecciones campeonas del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Las únicas 8 selecciones que han levantado la Copa del Mundo en 22 ediciones.
          22 títulos repartidos: Brasil (5), Alemania (4), Italia (4), Argentina (3), Francia (2),
          Uruguay (2), Inglaterra (1), España (1).
        </p>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {selecciones.map((s) => (
            <Link
              key={s.slug}
              href={`/historia/selecciones/${s.slug}`}
              className="block p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w80/${s.iso2}.png`}
                  alt={s.pais}
                  className="w-12 h-8 object-cover rounded"
                  loading="lazy"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-white">{s.pais}</h2>
                <span
                  className="ml-auto text-2xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {"★".repeat(s.titulos)}
                </span>
              </div>
              <p className="text-sm text-gray-300 italic mb-3">«{s.subtitulo}»</p>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                <span>{s.titulos} ★ campeón</span>
                <span>•</span>
                <span>{s.subcampeonatos} subcampeón</span>
                <span>•</span>
                <span>{s.podios} podios</span>
                <span>•</span>
                <span>{s.participaciones} Mundiales</span>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Títulos: {s.aniosTitulos.join(", ")}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <EditorialBlock slug="selecciones" />
    </>
  );
}
