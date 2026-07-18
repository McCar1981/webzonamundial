import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllCamisetas } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Camisetas Icónicas del Mundial — Brasil 70, Maradona 86, Croacia cuadros | ZonaMundial",
  description:
    "Las 25 camisetas más icónicas de la historia del Mundial: Brasil 1970 (verdeamarela del tricampeonato), Argentina 1986 (la 10 de Maradona, vendida en 9M USD), Holanda Naranja Mecánica, Croacia a cuadros y más.",
  alternates: { canonical: "https://zonamundial.app/historia/camisetas" },
  openGraph: {
    title: "Camisetas Icónicas del Mundial | ZonaMundial",
    description: "Top 25 camisetas más icónicas del Mundial con su historia.",
    url: "https://zonamundial.app/historia/camisetas",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function CamisetasPage() {
  const camisetas = getAllCamisetas();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Camisetas</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Top {camisetas.length} jerseys
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Camisetas Icónicas
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          De la verdeamarela brasileña 1970 a la celeste argentina 2022, pasando por la
          Naranja Mecánica de Cruyff y la 10 de Maradona vendida por 9 millones de dólares.
        </p>
      </header>

      <section>
        <div className="space-y-3 sm:space-y-4">
          {camisetas.map((c) => (
            <Link
              key={c.ranking}
              href={`/historia/${c.edicionSlug}`}
              className="block p-4 sm:p-5 rounded-2xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span className="text-2xl font-black tabular-nums" style={{ color: GOLD }}>
                  #{c.ranking}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${c.seleccion.iso2}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <h2 className="text-base sm:text-lg font-bold text-white">{c.titulo}</h2>
                <span className="ml-auto text-xs text-gray-500 tabular-nums">{c.anio}</span>
              </div>
              <p className="italic text-sm text-gray-300 mb-2">«{c.subtitulo}»</p>
              <p className="text-sm text-gray-200 leading-relaxed">{c.descripcion}</p>
            </Link>
          ))}
        </div>
      </section>
      <EditorialBlock slug="camisetas" />
    </>
  );
}
