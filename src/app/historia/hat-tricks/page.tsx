import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getHatTricks } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Hat-Tricks Históricos del Mundial — Salenko 5 goles, Hurst final, Mbappé 2022 | ZonaMundial",
  description:
    "Los hat-tricks más recordados del Mundial: Salenko 5 goles vs Camerún (récord), Hurst final 1966, Mbappé final 2022, Müller dos consecutivos 1970, Fontaine 4 vs RFA, László Kiss desde el banco.",
  alternates: { canonical: "https://zonamundial.app/historia/hat-tricks" },
  openGraph: {
    title: "Hat-Tricks Históricos del Mundial | ZonaMundial",
    description: "Los hat-tricks más recordados del Mundial.",
    url: "https://zonamundial.app/historia/hat-tricks",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function HatTricksPage() {
  const data = getHatTricks();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Hat-tricks</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Hat-tricks legendarios
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Hat-Tricks Históricos
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {data.datoIntroductorio}
        </p>
      </header>

      <section>
        <div className="space-y-3">
          {data.destacados.map((h, i) => (
            <Link
              key={`${h.anio}-${h.jugador}-${i}`}
              href={`/historia/${h.edicionSlug}`}
              className="block p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span
                  className="text-base font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {h.anio}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${h.iso2}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <h2 className="text-base sm:text-lg font-bold text-white">{h.jugador}</h2>
                <span
                  className="ml-auto text-2xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {h.goles}g
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mb-2">
                {h.fase} vs {h.rival} · {h.marcador}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{h.datoClave}</p>
            </Link>
          ))}
        </div>
      </section>
      <EditorialBlock slug="hat-tricks" />
    </>
  );
}
