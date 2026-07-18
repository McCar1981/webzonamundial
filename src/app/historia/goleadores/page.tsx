// src/app/historia/goleadores/page.tsx
// ZonaMundial — Goleadores históricos del Mundial

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllEdiciones,
  getRegistrosHistoricos,
} from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Goleadores Históricos del Mundial — Klose, Ronaldo, Müller, Messi | ZonaMundial",
  description:
    "Todos los goleadores del Mundial: top scorers all-time, ganadores de la Bota de Oro 1930-2022 y goleadores edición por edición. Datos verificados.",
  keywords: [
    "goleadores mundial",
    "bota de oro mundial",
    "klose 16 goles",
    "fontaine 13 goles",
    "ronaldo mundial",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/goleadores" },
  openGraph: {
    title: "Goleadores Históricos del Mundial | ZonaMundial",
    description:
      "Top scorers all-time, Botas de Oro y máximos artilleros de cada edición desde 1930.",
    url: "https://zonamundial.app/historia/goleadores",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function GoleadoresPage() {
  const r = getRegistrosHistoricos();
  const ediciones = getAllEdiciones().filter((e) => !e.proximo);

  // Bota de oro por edición
  const botasOro = ediciones
    .map((e) => {
      const bo = e.topGoleadores?.find((g) => g.botaOro);
      return bo
        ? {
            anio: e.meta.anio,
            slug: e.meta.slug,
            nombreCorto: e.meta.nombreCorto,
            nombre: bo.nombre,
            seleccion: bo.seleccion,
            goles: bo.goles,
          }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li>
            <Link href="/" className="hover:text-[#C9A84C]">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/historia" className="hover:text-[#C9A84C]">
              Historia
            </Link>
          </li>
          <li>/</li>
          <li className="text-[#C9A84C]">Goleadores</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          1930 — 2022
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Goleadores Históricos
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Klose 16, Ronaldo 15, Gerd Müller 14, Fontaine y Messi 13. Los grandes
          artilleros de la historia mundialista y todas las Botas de Oro.
        </p>
      </header>

      {/* TOP ALL-TIME */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Top goleadores all-time
        </h2>
        <div className="rounded-2xl border border-[#241e12] overflow-hidden bg-[#14110a]/40">
          {r.topGoleadoresAllTime.map((g, i) => {
            const isPodium = i < 3;
            return (
              <div
                key={g.nombre}
                className="grid items-center gap-3 px-3 sm:px-5 py-3.5 border-b border-[#14110a] last:border-b-0"
                style={{
                  gridTemplateColumns: "40px 36px 1fr auto",
                  background: i % 2 === 0 ? "transparent" : "rgba(20,17,10,0.3)",
                }}
              >
                <div className="text-center">
                  <span
                    className="text-base sm:text-xl font-black tabular-nums"
                    style={{ color: isPodium ? GOLD : "#8b8168" }}
                  >
                    {i + 1}
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w80/${g.seleccion.iso2}.png`}
                  alt={g.seleccion.pais}
                  className="w-9 h-6 object-cover rounded"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-white truncate">
                    {g.nombre}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {g.seleccion.pais} · {g.mundiales.length} Mundial
                    {g.mundiales.length > 1 ? "es" : ""} ({g.mundiales.join(", ")})
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="text-2xl sm:text-3xl font-black tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {g.goles}
                  </span>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    goles
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTAS DE ORO POR EDICIÓN */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Botas de Oro · 1930–2022
        </h2>
        <div className="rounded-2xl border border-[#241e12] overflow-hidden bg-[#14110a]/40">
          {botasOro.map((b, i) => (
            <Link
              key={b.anio}
              href={`/historia/${b.slug}`}
              className="grid items-center gap-3 px-3 sm:px-5 py-3 border-b border-[#14110a] last:border-b-0 hover:bg-white/5 no-underline transition-colors"
              style={{
                gridTemplateColumns: "60px 32px 1fr auto",
                background: i % 2 === 0 ? "transparent" : "rgba(20,17,10,0.3)",
              }}
            >
              <span
                className="text-base font-black tabular-nums"
                style={{ color: GOLD }}
              >
                {b.anio}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${b.seleccion.iso2}.png`}
                alt={b.seleccion.pais}
                className="w-7 h-5 object-cover rounded-[1px]"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {b.nombre}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {b.seleccion.pais} · {b.nombreCorto}
                </div>
              </div>
              <span
                className="text-lg font-black tabular-nums"
                style={{ color: GOLD }}
              >
                {b.goles}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
        <Link
          href="/historia/records"
          className="p-4 rounded-xl border border-[#241e12] bg-[#0a0906] hover:border-[#C9A84C] hover:text-[#C9A84C] text-gray-300 transition-all no-underline"
        >
          <div className="font-bold text-sm mb-1">📊 Récords absolutos</div>
          <div className="text-xs text-gray-500">
            Todos los récords del Mundial
          </div>
        </Link>
        <Link
          href="/historia"
          className="p-4 rounded-xl border border-[#241e12] bg-[#0a0906] hover:border-[#C9A84C] hover:text-[#C9A84C] text-gray-300 transition-all no-underline"
        >
          <div className="font-bold text-sm mb-1">🏆 Las 23 ediciones</div>
          <div className="text-xs text-gray-500">Cronología completa</div>
        </Link>
      </section>
      <EditorialBlock slug="goleadores" />
    </>
  );
}
