import type { Metadata } from "next";
import Link from "next/link";
import { getAllMomentos } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Momentos Mundialistas — Bisht Messi, Mano de Dios, Notti Magiche | ZonaMundial",
  description:
    "Los 40 momentos más memorables del Mundial más allá de los goles: bisht ceremonial Messi, llanto Maradona 1990, baile Milla, mordida Suárez, Banks-azo, Pussy Riot, lluvia papelitos.",
  alternates: { canonical: "https://zonamundial.app/historia/momentos" },
  openGraph: {
    title: "Momentos Mundialistas Inolvidables | ZonaMundial",
    description: "Las imágenes que definieron el Mundial más allá del fútbol.",
    url: "https://zonamundial.app/historia/momentos",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  celebracion: { label: "Celebración", color: "#22C55E" },
  consagracion: { label: "Consagración", color: "#C9A84C" },
  tragedia: { label: "Tragedia", color: "#9333EA" },
  polemica: { label: "Polémica", color: "#DC2626" },
};

export default function MomentosPage() {
  const momentos = getAllMomentos();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Momentos</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Top {momentos.length} momentos
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Momentos Mundialistas
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Los momentos imborrables más allá de los goles. Celebraciones, lágrimas,
          polémicas y consagraciones que definieron la cultura mundialista.
        </p>
      </header>

      <section>
        <div className="space-y-3">
          {momentos.map((m) => {
            const meta = TIPO_LABELS[m.tipo] ?? { label: m.tipo, color: "#94A3B8" };
            return (
              <Link
                key={m.ranking}
                href={`/historia/${m.edicionSlug}`}
                className="block p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
              >
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span
                    className="text-base font-black tabular-nums"
                    style={{ color: GOLD }}
                  >
                    #{m.ranking}
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
                  <h2 className="text-sm sm:text-base font-bold text-white">{m.titulo}</h2>
                  <span className="ml-auto text-xs text-gray-500 tabular-nums">{m.anio}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{m.descripcion}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
