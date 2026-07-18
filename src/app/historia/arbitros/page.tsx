import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllArbitros } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Árbitros Legendarios del Mundial — Collina, Aston, Bahramov | ZonaMundial",
  description:
    "Los árbitros que escribieron la historia del Mundial: Collina (mejor de la historia), Ken Aston (inventor de tarjetas), Bahramov (gol fantasma 1966), Belqola (1er africano), Pitana (VAR debut).",
  alternates: { canonical: "https://zonamundial.app/historia/arbitros" },
  openGraph: {
    title: "Árbitros Legendarios del Mundial | ZonaMundial",
    description: "Las leyendas del arbitraje mundialista con historias y anécdotas.",
    url: "https://zonamundial.app/historia/arbitros",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function ArbitrosPage() {
  const arbitros = getAllArbitros();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Árbitros</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          {arbitros.length} leyendas del silbato
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Árbitros Legendarios
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          De Pierluigi Collina (mejor árbitro de la historia, 6 veces IFFHS) a Ken Aston
          (inventor de las tarjetas amarilla y roja). Las figuras imborrables del arbitraje mundialista.
        </p>
      </header>

      <section>
        <div className="space-y-3 sm:space-y-4">
          {arbitros.map((a) => (
            <article
              key={a.nombre}
              className="p-4 sm:p-6 rounded-2xl border border-[#241e12] bg-[#14110a]/60"
            >
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${a.iso2}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-white">{a.nombre}</h2>
                <span className="text-xs text-gray-500">
                  {a.pais} · {a.anios}
                </span>
              </div>
              <p className="italic text-sm text-gray-300 mb-3">«{a.subtitulo}»</p>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4 flex-wrap">
                <span>
                  <span className="text-gray-500">Mundiales:</span>{" "}
                  <span className="tabular-nums">{a.mundialesPitados.join(", ")}</span>
                </span>
                {a.finalesPitadas.length > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      <span className="text-gray-500">Final:</span>{" "}
                      <span style={{ color: GOLD }}>{a.finalesPitadas.join(", ")}</span>
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">{a.datoClave}</p>
              {a.anecdotas.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#241e12]">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                    Anécdotas
                  </div>
                  {a.anecdotas.map((an, i) => (
                    <p key={i} className="text-xs text-gray-400 leading-relaxed">
                      <span className="text-[#C9A84C]">▸</span> {an}
                    </p>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="arbitros" />
    </>
  );
}
