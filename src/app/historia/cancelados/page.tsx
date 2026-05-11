import type { Metadata } from "next";
import Link from "next/link";
import { getCancelados } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Mundiales Cancelados — 1942 y 1946 (WWII) | ZonaMundial",
  description:
    "Los dos Mundiales cancelados de la historia: 1942 (Hitler quería organizarlo en Berlín) y 1946 (reconstrucción post-WWII). Historia, candidatos y consecuencias.",
  alternates: { canonical: "https://zonamundial.app/historia/cancelados" },
  openGraph: {
    title: "Mundiales Cancelados 1942 y 1946 | ZonaMundial",
    description: "Los Mundiales que la Segunda Guerra Mundial impidió celebrar.",
    url: "https://zonamundial.app/historia/cancelados",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function CanceladosPage() {
  const { cancelados, datoCierre } = getCancelados();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Mundiales cancelados</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#9333EA] mb-3">
          1942 · 1946
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los Mundiales Perdidos
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Dos Mundiales no se celebraron por la Segunda Guerra Mundial: 12 años de
          paréntesis entre Francia 1938 y Brasil 1950. Lo que pudo ser y nunca fue.
        </p>
      </header>

      <section>
        <div className="space-y-6">
          {cancelados.map((c) => (
            <article
              key={c.anio}
              className="p-5 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span className="text-3xl font-black tabular-nums" style={{ color: GOLD }}>
                  {c.anio}
                </span>
                <h2 className="text-xl font-bold text-white">
                  Mundial cancelado · Edición {c.edicionPlanificada}ª
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-[#0B1825] border-l-2 border-[#9333EA]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9333EA] mb-1">
                    Motivo
                  </div>
                  <p className="text-sm text-gray-200">{c.motivo}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0B1825] border-l-2 border-[#C9A84C]">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
                    Sedes candidatas
                  </div>
                  <p className="text-sm text-gray-200">{c.sedeCandidata.join(", ")}</p>
                </div>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed mb-4">{c.datoClave}</p>
              <div className="space-y-2 pt-3 border-t border-[#1E293B]">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                  Anécdotas
                </div>
                {c.anecdotas.map((a, i) => (
                  <p key={i} className="text-xs text-gray-300 leading-relaxed">
                    <span style={{ color: GOLD }}>▸</span> {a}
                  </p>
                ))}
              </div>
            </article>
          ))}

          {datoCierre && (
            <div className="p-5 rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                Dato histórico
              </div>
              <p className="text-sm text-gray-200 leading-relaxed italic">«{datoCierre}»</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
