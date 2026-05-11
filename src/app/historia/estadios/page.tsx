// src/app/historia/estadios/page.tsx
// ZonaMundial — Estadios míticos del Mundial 1930-2026

import type { Metadata } from "next";
import Link from "next/link";
import { getAllEstadios } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Estadios Míticos del Mundial — Maracanã, Wembley, Azteca, Lusail | ZonaMundial",
  description:
    "Los estadios más míticos del Mundial: Maracanã, Wembley original, Azteca (único con 3 ediciones), Stade de France, Soccer City, Lusail, MetLife. Capacidades, momentos épicos.",
  keywords: [
    "estadios mundial",
    "maracana",
    "wembley",
    "estadio azteca",
    "lusail",
    "metlife stadium",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/estadios" },
  openGraph: {
    title: "Los estadios míticos del Mundial 1930-2026 | ZonaMundial",
    description: "Los templos del fútbol mundialista con sus momentos épicos.",
    url: "https://zonamundial.app/historia/estadios",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

function fmt(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

export default function EstadiosPage() {
  const estadios = getAllEstadios();
  const totalCap = estadios.reduce((s, e) => s + e.capacidad, 0);

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
          <li className="text-[#C9A84C]">Estadios</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Templos del fútbol
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los Estadios Míticos
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {estadios.length} estadios que escribieron historia en finales mundialistas.
          Del Centenario uruguayo de 1930 al MetLife neoyorquino de 2026, pasando por el
          Azteca (único con tres ediciones) y el Maracaná de la asistencia récord histórica.
        </p>
      </header>

      <section>
        <div className="space-y-3 sm:space-y-4">
          {estadios.map((s) => {
            const finalSlugs = s.mundiales
              .map((y) => {
                const candidates: Record<number, string> = {
                  1930: "1930-uruguay",
                  1934: "1934-italia",
                  1950: "1950-brasil",
                  1954: "1954-suiza",
                  1958: "1958-suecia",
                  1966: "1966-inglaterra",
                  1970: "1970-mexico",
                  1974: "1974-alemania",
                  1978: "1978-argentina",
                  1982: "1982-espana",
                  1986: "1986-mexico",
                  1990: "1990-italia",
                  1994: "1994-eeuu",
                  1998: "1998-francia",
                  2002: "2002-corea-japon",
                  2006: "2006-alemania",
                  2010: "2010-sudafrica",
                  2014: "2014-brasil",
                  2018: "2018-rusia",
                  2022: "2022-qatar",
                  2026: "2026-norteamerica",
                };
                return { anio: y, slug: candidates[y] };
              })
              .filter((x) => x.slug);
            return (
              <article
                key={`${s.nombre}-${s.inauguracion}`}
                className="p-4 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
              >
                <div className="flex items-baseline gap-3 flex-wrap mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${s.iso2}.png`}
                    alt={s.pais}
                    className="w-7 h-5 object-cover rounded-[1px]"
                    loading="lazy"
                  />
                  <h2 className="text-lg sm:text-2xl font-bold text-white">
                    {s.nombre}
                  </h2>
                  <span className="text-xs text-gray-500">
                    {s.ciudad}, {s.pais}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-gray-400 mb-3">
                  <span>
                    <span className="text-gray-500">Capacidad:</span>{" "}
                    <span className="tabular-nums text-gray-200">
                      {fmt(s.capacidad)}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-gray-500">Inaugurado:</span>{" "}
                    <span className="tabular-nums text-gray-200">{s.inauguracion}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-gray-500">Mundiales:</span>{" "}
                    {finalSlugs.map((m, i) => (
                      <span key={m.anio}>
                        <Link
                          href={`/historia/${m.slug}`}
                          className="text-[#C9A84C] hover:opacity-80 no-underline tabular-nums"
                        >
                          {m.anio}
                        </Link>
                        {i < finalSlugs.length - 1 && ", "}
                      </span>
                    ))}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{s.datoClave}</p>
                <div className="p-3 rounded-lg bg-[#0B1825] border-l-2 border-[#C9A84C]">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
                    Momento épico
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed italic">
                    «{s.momentoEpico}»
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
