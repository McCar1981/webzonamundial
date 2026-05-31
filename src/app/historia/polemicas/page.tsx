import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPolemicas } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Polémicas Arbitrales del Mundial — Mano de Dios, Wembley-Tor, Lampard | ZonaMundial",
  description:
    "Las 12 polémicas arbitrales más recordadas del Mundial: Mano de Dios (1986), Wembley-Tor (1966), gol fantasma de Lampard (2010), Vergüenza de Gijón (1982), Corea-Italia (2002), cabezazo Zidane (2006).",
  alternates: { canonical: "https://zonamundial.app/historia/polemicas" },
  openGraph: {
    title: "Polémicas Arbitrales del Mundial | ZonaMundial",
    description: "Los escándalos arbitrales que marcaron la historia mundialista.",
    url: "https://zonamundial.app/historia/polemicas",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function PolemicasPage() {
  const polemicas = getAllPolemicas();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Polémicas</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#DC2626] mb-3">
          {polemicas.length} escándalos verificados
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Polémicas del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Las decisiones arbitrales, episodios extraños y escándalos que cambiaron la
          historia mundialista. De la Vergüenza de Gijón al cabezazo de Zidane.
        </p>
      </header>

      <section>
        <div className="space-y-4">
          {polemicas.map((p, i) => (
            <article
              key={`${p.anio}-${i}`}
              className="p-5 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <Link
                  href={`/historia/${p.edicionSlug}`}
                  className="text-base font-black tabular-nums no-underline hover:opacity-80"
                  style={{ color: GOLD }}
                >
                  {p.anio}
                </Link>
                <h2 className="text-lg sm:text-xl font-bold text-white">{p.titulo}</h2>
                <span className="text-xs text-gray-500 ml-auto tabular-nums">{p.minuto}</span>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {p.partido}
              </div>
              <p className="italic text-sm text-gray-300 mb-3">«{p.subtitulo}»</p>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">{p.descripcion}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-[#0B1825] border-l-2 border-[#DC2626]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626] mb-1">
                    Consecuencia
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{p.consecuencia}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0B1825] border-l-2 border-[#C9A84C]">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
                    Vigencia
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{p.vigencia}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="polemicas" />
    </>
  );
}
