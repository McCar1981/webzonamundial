import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllConfederaciones } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Confederaciones del Mundial — UEFA, CONMEBOL, CAF, AFC, CONCACAF, OFC | ZonaMundial",
  description:
    "Las 6 confederaciones FIFA: UEFA (12 títulos), CONMEBOL (10 títulos), CONCACAF, CAF, AFC, OFC. Estadísticas, hitos históricos y palmarés por región.",
  alternates: { canonical: "https://zonamundial.app/historia/confederaciones" },
  openGraph: {
    title: "Confederaciones del Mundial | ZonaMundial",
    description: "Las 6 confederaciones FIFA con su historia mundialista.",
    url: "https://zonamundial.app/historia/confederaciones",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function ConfederacionesPage() {
  const confs = getAllConfederaciones();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Confederaciones</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          6 confederaciones FIFA
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Las Confederaciones
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          UEFA y CONMEBOL acumulan los 22 títulos mundiales jugados (12+10). CAF, AFC,
          CONCACAF y OFC siguen en busca de su primera estrella.
        </p>
      </header>

      <section className="mb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {confs.map((c) => (
            <article
              key={c.slug}
              className="p-4 sm:p-5 rounded-2xl border bg-[#0F1D32]/60"
              style={{ borderColor: `${c.color}33` }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: c.color }}
              >
                {c.codigo} · fundada {c.fundacion}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">
                {c.codigo}
              </h2>
              <div className="text-[10px] text-gray-500 mb-3 truncate">{c.nombre}</div>
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className="text-2xl sm:text-3xl font-black tabular-nums"
                  style={{ color: c.color }}
                >
                  {c.titulosMundiales}
                </span>
                <span className="text-[10px] text-gray-500 tabular-nums">
                  {c.selecciones} selec.
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mb-3">
                títulos / selecciones afiliadas
              </div>
              <p className="italic text-xs text-gray-300 leading-relaxed">«{c.subtitulo}»</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="space-y-4">
          {confs.map((c) => (
            <article
              key={c.slug}
              id={c.slug}
              className="rounded-2xl border bg-[#0F1D32]/60 overflow-hidden scroll-mt-24"
              style={{ borderColor: `${c.color}33` }}
            >
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-5 sm:p-6">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <h2
                    className="text-xl sm:text-2xl font-black tracking-wider"
                    style={{ color: c.color }}
                  >
                    {c.codigo}
                  </h2>
                  <span className="text-xs text-gray-400">{c.nombre}</span>
                </div>
                <p className="italic text-sm text-gray-300 mb-4">«{c.subtitulo}»</p>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <Stat label="Fundación" value={String(c.fundacion)} />
                  <Stat label="Selecciones" value={String(c.selecciones)} />
                  <Stat
                    label="Títulos Mundial"
                    value={String(c.titulosMundiales)}
                    highlight
                  />
                </div>

                <p className="text-sm text-gray-200 leading-relaxed mb-4">{c.biografia}</p>

                {c.selccionesCampeonas.length > 0 && (
                  <div className="mb-4">
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: c.color }}
                    >
                      Campeones
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.selccionesCampeonas.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: `${c.color}15`,
                            border: `1px solid ${c.color}40`,
                            color: c.color,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: `${c.color}10`,
                    borderLeft: `3px solid ${c.color}`,
                  }}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: c.color }}
                  >
                    Dato clave
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{c.datoClave}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="confederaciones" />
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0F1D32]/40 text-center">
      <div
        className="text-xl sm:text-2xl font-black tabular-nums"
        style={{ color: highlight ? GOLD : "#fff" }}
      >
        {value}
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
