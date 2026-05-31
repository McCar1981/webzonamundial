import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllTrofeos } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Trofeos del Mundial — Jules Rimet y FIFA Cup | ZonaMundial",
  description:
    "Los dos trofeos del Mundial: la Copa Jules Rimet (1930-1970, perdida en 1983) y el actual Trofeo FIFA (Gazzaniga, desde 1974). Historia, robos, escondites y datos.",
  alternates: { canonical: "https://zonamundial.app/historia/trofeos" },
  openGraph: {
    title: "Trofeos del Mundial Jules Rimet y FIFA | ZonaMundial",
    description: "La historia de los dos trofeos mundialistas.",
    url: "https://zonamundial.app/historia/trofeos",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function TrofeosPage() {
  const trofeos = getAllTrofeos();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Trofeos</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          1930 — presente
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los Trofeos del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          La Copa Jules Rimet (perdida en 1983) y el actual Trofeo FIFA. Historia, robos,
          escondites bajo la cama y secuestros aduaneros: el oro del fútbol mundial.
        </p>
      </header>

      <section>
        <div className="space-y-6">
          {trofeos.map((t) => (
            <article
              key={t.nombre}
              className="p-5 sm:p-6 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <h2 className="text-xl sm:text-3xl font-black text-white">{t.nombre}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: GOLD, background: "rgba(201,168,76,0.1)" }}>
                  {t.vigencia}
                </span>
              </div>
              <p className="italic text-sm text-gray-300 mb-4">«{t.subtitulo}»</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Stat label="Diseñador" value={t.diseñador} />
                <Stat label="Material" value={t.material} small />
                <Stat label="Altura" value={t.altura} />
                <Stat label="Peso" value={t.peso} />
              </div>

              <p className="text-sm text-gray-200 leading-relaxed mb-5">{t.descripcion}</p>

              <div className="space-y-2 pt-4 border-t border-[#1E293B]">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                  Anécdotas y curiosidades
                </div>
                {t.anecdotas.map((a, i) => (
                  <p key={i} className="text-xs text-gray-300 leading-relaxed">
                    <span style={{ color: GOLD }}>▸</span> {a}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="trofeos" />
    </>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="p-3 rounded-lg border border-[#1E293B] bg-[#0F1D32]/40">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={small ? "text-xs text-gray-200 leading-tight" : "text-sm font-bold text-white"}>
        {value}
      </div>
    </div>
  );
}
