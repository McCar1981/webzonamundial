// src/app/historia/jugadores/page.tsx
// ZonaMundial — Jugadores legendarios del Mundial

import type { Metadata } from "next";
import Link from "next/link";
import { getAllJugadoresLegendarios } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Jugadores Legendarios del Mundial — Pelé, Maradona, Messi, Klose y más | ZonaMundial",
  description:
    "Los 15 jugadores más legendarios de la historia mundialista: Pelé (3 Mundiales), Maradona, Messi, Klose (16 goles), Ronaldo, Müller, Fontaine (13 en una edición), Garrincha, Cruyff, Beckenbauer, Mbappé.",
  keywords: [
    "jugadores legendarios mundial",
    "pele mundiales",
    "maradona mundial 86",
    "messi mundial 2022",
    "klose 16 goles",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/jugadores" },
  openGraph: {
    title: "Jugadores Legendarios del Mundial | ZonaMundial",
    description: "15 leyendas del Mundial con biografía, logros y anécdotas verificadas.",
    url: "https://zonamundial.app/historia/jugadores",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function JugadoresIndex() {
  const jugadores = getAllJugadoresLegendarios();
  // Ordenar por títulos primero, luego por goles
  const sorted = [...jugadores].sort((a, b) => {
    if (b.titulos !== a.titulos) return b.titulos - a.titulos;
    return b.goles - a.goles;
  });

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
          <li className="text-[#C9A84C]">Jugadores</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          {jugadores.length} leyendas mundialistas
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Jugadores Legendarios
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          De Pelé (único tricampeón) a Mbappé (hat-trick en final 2022). Quince jugadores
          que escribieron la historia mundialista con biografías completas, logros verificados y
          anécdotas únicas.
        </p>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sorted.map((j) => (
            <Link
              key={j.slug}
              href={`/historia/jugadores/${j.slug}`}
              className="block p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${j.seleccion.iso2}.png`}
                  alt={j.seleccion.pais}
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <h2 className="text-lg sm:text-xl font-bold text-white">{j.nombre}</h2>
                {j.titulos > 0 && (
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: GOLD }}
                  >
                    ★{j.titulos > 1 ? `×${j.titulos}` : ""}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mb-3">
                {j.seleccion.pais} · {j.posicion} · {j.anios}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3 italic">
                «{j.subtitulo}»
              </p>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                <span>
                  <span className="text-gray-500">Mundiales:</span>{" "}
                  <span className="tabular-nums">{j.mundialesJugados.length}</span>
                </span>
                <span>•</span>
                <span>
                  <span className="text-gray-500">Partidos:</span>{" "}
                  <span className="tabular-nums">{j.partidos}</span>
                </span>
                <span>•</span>
                <span>
                  <span className="text-gray-500">Goles:</span>{" "}
                  <span className="tabular-nums" style={{ color: GOLD }}>{j.goles}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
