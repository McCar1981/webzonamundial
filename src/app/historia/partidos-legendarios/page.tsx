import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPartidosLegendarios } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Top 25 Partidos Legendarios del Mundial — Maracanazo, Mineirazo, Mano de Dios | ZonaMundial",
  description:
    "Los 25 partidos más recordados de la historia mundialista: Mano de Dios + Gol del Siglo (1986), Maracanazo (1950), Mineirazo (2014), final 2022 hat-trick Mbappé, Milagro de Berna (1954).",
  alternates: { canonical: "https://zonamundial.app/historia/partidos-legendarios" },
  openGraph: {
    title: "Top 25 Partidos Legendarios del Mundial | ZonaMundial",
    description: "Los partidos que marcaron la historia mundialista.",
    url: "https://zonamundial.app/historia/partidos-legendarios",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function PartidosPage() {
  const partidos = getAllPartidosLegendarios();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Partidos legendarios</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Top {partidos.length} partidos
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Partidos Legendarios
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Los partidos que cambiaron la historia del Mundial. Del Maracanazo a la final de
          Catar 2022, pasando por la Batalla de Santiago y el Mineirazo.
        </p>
      </header>

      <section>
        <div className="space-y-3">
          {partidos.map((p) => (
            <Link
              key={p.ranking}
              href={`/historia/${p.edicionSlug}`}
              className="block p-4 sm:p-5 rounded-2xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span
                  className="text-2xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  #{p.ranking}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white">{p.titulo}</h2>
                <span className="text-xs text-gray-500 ml-auto tabular-nums">{p.fecha}</span>
              </div>
              <div className="text-[11px] text-gray-500 mb-3">
                📍 {p.estadio}
              </div>
              <p className="italic text-sm text-gray-300 mb-3">«{p.subtitulo}»</p>
              <p className="text-sm text-gray-200 leading-relaxed">{p.datoClave}</p>
            </Link>
          ))}
        </div>
      </section>
      <EditorialBlock slug="partidos-legendarios" />
    </>
  );
}
