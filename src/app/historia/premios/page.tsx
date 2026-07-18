// src/app/historia/premios/page.tsx
// ZonaMundial — Premios individuales del Mundial

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getPremios } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Premios Individuales del Mundial — Balón Oro, Bota Oro, Guante Oro | ZonaMundial",
  description:
    "Todos los premios individuales del Mundial: Balón de Oro (mejor jugador), Bota de Oro (goleador), Guante de Oro (portero), Mejor Jugador Joven, Fair Play. Lista completa 1930-2022.",
  keywords: [
    "balon de oro mundial",
    "bota de oro mundial",
    "guante de oro mundial",
    "mejor joven mundial",
    "premios mundial",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/premios" },
  openGraph: {
    title: "Premios Individuales del Mundial 1930-2022 | ZonaMundial",
    description:
      "Balón de Oro, Bota de Oro, Guante de Oro, Mejor Joven y Fair Play de cada edición.",
    url: "https://zonamundial.app/historia/premios",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function PremiosPage() {
  const p = getPremios();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Premios</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Premios individuales · 1930–2022
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los Premios del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Balón de Oro (mejor jugador), Bota de Oro (goleador), Guante de Oro (portero),
          Mejor Joven y Fair Play. Todos los premios desde 1930.
        </p>
      </header>

      {/* RANKING BALONES DE ORO */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          ★ Balones de Oro all-time
        </h2>
        <div className="rounded-2xl border border-[#241e12] overflow-hidden bg-[#14110a]/40">
          {p.rankingsAllTime.balonesOro.map((b, i) => (
            <div
              key={`${b.jugador}-${i}`}
              className="grid items-center gap-3 px-3 sm:px-5 py-3 border-b border-[#14110a] last:border-b-0"
              style={{
                gridTemplateColumns: "32px 28px 1fr auto",
                background: i % 2 === 0 ? "transparent" : "rgba(20,17,10,0.3)",
              }}
            >
              <span
                className="text-sm sm:text-base font-bold tabular-nums text-center"
                style={{ color: i < 3 ? GOLD : "#8b8168" }}
              >
                {i + 1}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${b.seleccion.iso2}.png`}
                alt=""
                className="w-7 h-5 object-cover rounded-[1px]"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {b.jugador}
                </div>
                <div className="text-[10px] text-gray-500">
                  {b.seleccion.pais} · {b.anios.join(", ")}
                </div>
              </div>
              <span
                className="text-lg font-black tabular-nums"
                style={{ color: GOLD }}
              >
                {b.veces > 1 ? `★×${b.veces}` : "★"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* RANKING BOTAS DE ORO */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          ⚽ Botas de Oro all-time
        </h2>
        <div className="rounded-2xl border border-[#241e12] overflow-hidden bg-[#14110a]/40">
          {p.rankingsAllTime.botasOro.map((b, i) => (
            <div
              key={`${b.jugador}-${i}`}
              className="grid items-center gap-3 px-3 sm:px-5 py-3 border-b border-[#14110a] last:border-b-0"
              style={{
                gridTemplateColumns: "60px 28px 1fr auto",
                background: i % 2 === 0 ? "transparent" : "rgba(20,17,10,0.3)",
              }}
            >
              <span
                className="text-sm font-bold tabular-nums tracking-tight"
                style={{ color: GOLD }}
              >
                {b.anios[0]}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${b.seleccion.iso2}.png`}
                alt=""
                className="w-7 h-5 object-cover rounded-[1px]"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {b.jugador}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {b.seleccion.pais}
                </div>
              </div>
              <span
                className="text-lg font-black tabular-nums"
                style={{ color: GOLD }}
              >
                {b.goles}g
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* RANKING GUANTES DE ORO */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          🥅 Guantes de Oro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {p.rankingsAllTime.guantesOro.map((g) => (
            <div
              key={`${g.jugador}-${g.anio}`}
              className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-base font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {g.anio}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${g.seleccion.iso2}.png`}
                  alt=""
                  className="w-6 h-4 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <span className="text-sm font-bold text-white">{g.jugador}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{g.datoClave}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREMIOS POR EDICIÓN */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Edición por edición
        </h2>
        <div className="space-y-3">
          {p.premiosPorEdicion.map((e) => (
            <Link
              key={e.anio}
              href={`/historia/${e.edicionSlug}`}
              className="block p-4 sm:p-5 rounded-2xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span
                  className="text-2xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {e.anio}
                </span>
                <span className="text-sm font-bold text-white">
                  Mundial {e.anio}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {e.balonOro && (
                  <PremioRow icon="★" label="Balón Oro" value={e.balonOro} />
                )}
                {e.botaOro && (
                  <PremioRow icon="⚽" label="Bota Oro" value={e.botaOro} />
                )}
                {e.guanteOro && (
                  <PremioRow icon="🥅" label="Guante Oro" value={e.guanteOro} />
                )}
                {e.mejorJoven && (
                  <PremioRow icon="🌟" label="Mejor Joven" value={e.mejorJoven} />
                )}
                {e.fairPlay && (
                  <PremioRow icon="🤝" label="Fair Play" value={e.fairPlay} />
                )}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed italic">
                «{e.datoClave}»
              </p>
            </Link>
          ))}
        </div>
      </section>
      <EditorialBlock slug="premios" />
    </>
  );
}

function PremioRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-gray-500 uppercase tracking-wider text-[10px] flex-shrink-0">
        {label}:
      </span>
      <span className="text-gray-200 font-medium truncate">{value}</span>
    </div>
  );
}
