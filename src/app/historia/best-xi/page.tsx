import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getBestXI } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Best XI All-Time del Mundial — Equipo ideal histórico | ZonaMundial",
  description:
    "El Once Ideal histórico del Mundial: Yashin, Beckenbauer, Maldini, Maradona, Pelé, Messi, Ronaldo, Just Fontaine. Best XI por época: clásica, moderna, global, contemporánea.",
  alternates: { canonical: "https://zonamundial.app/historia/best-xi" },
  openGraph: {
    title: "Best XI All-Time del Mundial | ZonaMundial",
    description: "El equipo ideal histórico del Mundial.",
    url: "https://zonamundial.app/historia/best-xi",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function BestXIPage() {
  const data = getBestXI();
  const xi = data.bestXIAllTime;
  const epocas = data.bestXIPorEpoca;

  // Agrupar por línea
  const porLinea: Record<string, typeof xi.jugadores> = {
    GK: xi.jugadores.filter((j) => j.posicion === "GK"),
    DEF: xi.jugadores.filter((j) => j.posicion === "DEF"),
    MID: xi.jugadores.filter((j) => j.posicion === "MID"),
    FWD: xi.jugadores.filter((j) => j.posicion === "FWD"),
  };
  const lineaLabels: Record<string, string> = {
    GK: "Portería",
    DEF: "Defensa",
    MID: "Mediocampo",
    FWD: "Delantera",
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Best XI</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Once Ideal · {xi.formacion}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          {xi.titulo}
        </h1>
        <p className="italic text-base sm:text-lg text-gray-400 mb-3">«{xi.subtitulo}»</p>
      </header>

      {/* CAMPO VISUAL */}
      <section className="mb-12">
        {Object.entries(porLinea).map(([linea, jugs]) => (
          <div key={linea} className="mb-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-3">
              {lineaLabels[linea]} · {jugs.length}
            </div>
            <div className={`grid gap-3 ${jugs.length === 4 ? "grid-cols-2 sm:grid-cols-4" : jugs.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"}`}>
              {jugs.map((j) => (
                <article
                  key={j.nombre}
                  className="p-4 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/w40/${j.seleccion.iso2}.png`}
                      alt=""
                      className="w-6 h-4 object-cover rounded-[1px]"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-gray-500">{j.seleccion.pais}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">{j.nombre}</h3>
                  <div className="text-[10px] text-gray-500 mb-2 tabular-nums">
                    Mundiales: {j.mundiales.join(", ")}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{j.datoClave}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* BEST XI POR ÉPOCA */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Once Ideal por época
        </h2>
        <div className="space-y-4">
          {epocas.map((e) => (
            <article
              key={e.epoca}
              className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                {e.epoca}
              </h3>
              <p className="italic text-xs text-gray-400 mb-3">«{e.subtitulo}»</p>
              <div className="flex flex-wrap gap-1.5">
                {e.jugadores.map((j, i) => (
                  <span
                    key={`${e.epoca}-${i}`}
                    className="px-2 py-1 rounded text-[11px] font-semibold text-gray-300 bg-[#0B1825] border border-[#1E293B]"
                  >
                    {j}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="best-xi" />
    </>
  );
}
