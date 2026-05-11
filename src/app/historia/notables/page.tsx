import type { Metadata } from "next";
import Link from "next/link";
import { getAllSeleccionesNotables } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Selecciones Notables sin Mundial — Países Bajos, Hungría, Croacia, Marruecos | ZonaMundial",
  description:
    "Las grandes selecciones que NO ganaron el Mundial: Países Bajos (3 finales perdidas), Hungría 1954 dorada, Croacia, Camerún, Marruecos primera africana en semifinales.",
  alternates: { canonical: "https://zonamundial.app/historia/notables" },
  openGraph: {
    title: "Selecciones Notables sin Mundial | ZonaMundial",
    description: "Las mejores selecciones que no ganaron el Mundial.",
    url: "https://zonamundial.app/historia/notables",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function NotablesPage() {
  const sels = getAllSeleccionesNotables();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Selecciones notables</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          {sels.length} selecciones notables sin Mundial
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los grandes que no ganaron
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Países Bajos perdió 3 finales, Hungría tuvo el mejor equipo de los 50, Marruecos
          rompió la barrera africana en 2022. Las selecciones notables que no levantaron
          la copa pero marcaron historia.
        </p>
      </header>

      <section>
        <div className="space-y-3 sm:space-y-4">
          {sels.map((s) => (
            <article
              key={s.slug}
              className="p-5 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w80/${s.iso2}.png`}
                  alt={s.pais}
                  className="w-12 h-8 object-cover rounded"
                  loading="lazy"
                />
                <h2 className="text-xl sm:text-2xl font-bold text-white">{s.pais}</h2>
                <span
                  className="ml-auto text-xs font-semibold px-2 py-1 rounded"
                  style={{ background: "rgba(201,168,76,0.15)", color: GOLD }}
                >
                  {s.mejorDesempeno}
                </span>
              </div>
              <p className="italic text-sm text-gray-300 mb-3">«{s.subtitulo}»</p>

              <div className="flex items-center gap-3 mb-3 flex-wrap text-[11px]">
                {s.subcampeon.length > 0 && (
                  <span className="text-gray-400">
                    <span className="text-gray-500">Subcampeón:</span>{" "}
                    <span className="tabular-nums">{s.subcampeon.join(", ")}</span>
                  </span>
                )}
                {s.tercerPuesto.length > 0 && (
                  <span className="text-gray-400">
                    <span className="text-gray-500">3er puesto:</span>{" "}
                    <span className="tabular-nums">{s.tercerPuesto.join(", ")}</span>
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-200 leading-relaxed mb-4">{s.biografia}</p>

              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Estrellas icónicas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.estrellasIconicas.map((j) => (
                    <span
                      key={j}
                      className="px-2 py-0.5 rounded text-[11px] text-gray-300 bg-[#0B1825] border border-[#1E293B]"
                    >
                      {j}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="p-3 rounded-lg"
                style={{
                  background: "rgba(201,168,76,0.08)",
                  borderLeft: `3px solid ${GOLD}`,
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
                  Dato clave
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">{s.datoClave}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
