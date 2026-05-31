import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllGolesLegendarios } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Goles Legendarios del Mundial — Gol del Siglo, Carlos Alberto, Iniesta | ZonaMundial",
  description:
    "Top goles del Mundial: Gol del Siglo de Maradona (1986), Pelé sombrero (1958), Carlos Alberto coral (1970), Negrete tijera (1986), Bergkamp control orientado (1998), Iniesta final (2010).",
  alternates: { canonical: "https://zonamundial.app/historia/goles" },
  openGraph: {
    title: "Goles Legendarios del Mundial | ZonaMundial",
    description: "Los goles más bellos y memorables de la historia mundialista.",
    url: "https://zonamundial.app/historia/goles",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function GolesPage() {
  const goles = getAllGolesLegendarios()
    .filter((g) => g.anio !== null)
    .sort((a, b) => a.ranking - b.ranking);

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Goles legendarios</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          {goles.length} goles inolvidables
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Goles Legendarios
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          De la Mano de Dios al Gol del Siglo en 4 minutos. De Pelé adolescente al
          Wembley-Tor. Los goles que definieron la historia mundialista, ranqueados.
        </p>
      </header>

      <section>
        <div className="space-y-3 sm:space-y-4">
          {goles.map((g) => (
            <article
              key={`${g.ranking}-${g.jugador}`}
              className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span
                  className="text-2xl sm:text-3xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  #{g.ranking}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${g.seleccion.iso2}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <h2 className="text-lg sm:text-xl font-bold text-white">{g.jugador}</h2>
                {g.edicionSlug && (
                  <Link
                    href={`/historia/${g.edicionSlug}`}
                    className="text-xs text-[#C9A84C] hover:opacity-80 no-underline tabular-nums"
                  >
                    {g.anio}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3 flex-wrap">
                <span>vs {g.rival.pais}</span>
                <span>•</span>
                <span>{g.fase}</span>
                <span>•</span>
                <span className="tabular-nums">{g.minuto}</span>
                <span>•</span>
                <span className="tabular-nums">{g.marcador}</span>
              </div>
              <p className="italic text-sm text-gray-300 mb-3">«{g.subtitulo}»</p>
              <p className="text-sm text-gray-200 leading-relaxed">{g.descripcion}</p>
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="goles" />
    </>
  );
}
