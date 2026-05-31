import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllSociopolitica } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "El Mundial y la Política — Boicots, Dictaduras, Propaganda, DDHH | ZonaMundial",
  description:
    "El Mundial como reflejo geopolítico: Mussolini 1934, dictadura argentina 1978, boicot africano 1966, Malvinas 1982, Pussy Riot 2018, DDHH Catar 2022, OneLove prohibidos.",
  alternates: { canonical: "https://zonamundial.app/historia/sociopolitica" },
  openGraph: {
    title: "El Mundial y la Política | ZonaMundial",
    description: "Los eventos sociopolíticos que marcaron el Mundial.",
    url: "https://zonamundial.app/historia/sociopolitica",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

const CAT_LABELS: Record<string, { label: string; color: string }> = {
  propaganda: { label: "Propaganda", color: "#DC2626" },
  guerra: { label: "Guerra", color: "#9333EA" },
  boicot: { label: "Boicot", color: "#F59E0B" },
  dictadura: { label: "Dictadura", color: "#EC4899" },
  diplomacia: { label: "Diplomacia", color: "#3B82F6" },
  protesta: { label: "Protesta", color: "#22C55E" },
  ddhh: { label: "DDHH", color: "#DC2626" },
  lgtb: { label: "LGTBQ+", color: "#A78BFA" },
  politica: { label: "Política", color: "#94A3B8" },
  tragedia: { label: "Tragedia", color: "#9333EA" },
};

export default function SociopoliticaPage() {
  const eventos = getAllSociopolitica();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Sociopolítica</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#DC2626] mb-3">
          {eventos.length} eventos verificados
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          El Mundial y la Política
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Boicots, dictaduras, guerras, propaganda fascista, censura LGTBQ+, protestas y
          ejercicios diplomáticos. El Mundial es y siempre ha sido reflejo de su tiempo geopolítico.
        </p>
      </header>

      <section>
        <div className="space-y-4">
          {eventos.map((e, i) => {
            const meta = CAT_LABELS[e.categoria] ?? { label: e.categoria, color: "#94A3B8" };
            const inner = (
              <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span
                    className="text-base font-black tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {e.anio}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: meta.color,
                      background: `${meta.color}15`,
                    }}
                  >
                    {meta.label}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">{e.titulo}</h2>
                </div>
                <p className="italic text-sm text-gray-300 mb-3">«{e.subtitulo}»</p>
                <p className="text-sm text-gray-200 leading-relaxed">{e.descripcion}</p>
              </div>
            );
            if (e.edicionSlug) {
              return (
                <Link
                  key={`${e.anio}-${i}`}
                  href={`/historia/${e.edicionSlug}`}
                  className="block no-underline"
                >
                  {inner}
                </Link>
              );
            }
            return (
              <article key={`${e.anio}-${i}`}>
                {inner}
              </article>
            );
          })}
        </div>
      </section>
      <EditorialBlock slug="sociopolitica" />
    </>
  );
}
