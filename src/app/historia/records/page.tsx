// src/app/historia/records/page.tsx
// ZonaMundial — Récords absolutos del Mundial 1930-2022

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getRegistrosHistoricos } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Récords del Mundial — Goleadores, partidos, asistencias y datos absolutos | ZonaMundial",
  description:
    "Récords absolutos del Mundial de Fútbol: Klose 16 goles, Messi 26 partidos, Fontaine 13 goles en una edición, Maracanazo 173.850 asistentes. Todos los récords históricos verificados.",
  keywords: [
    "records mundial futbol",
    "goleador historico mundial",
    "klose 16 goles",
    "messi mundiales",
    "asistencia mundial",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/records" },
  openGraph: {
    title: "Récords del Mundial 1930-2022 | ZonaMundial",
    description:
      "Todos los récords históricos del Mundial: goleadores, partidos, asistencias, jugadores más jóvenes y veteranos.",
    url: "https://zonamundial.app/historia/records",
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

export default function RecordsPage() {
  const r = getRegistrosHistoricos();

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
          <li className="text-[#C9A84C]">Récords</li>
        </ol>
      </nav>

      {/* HERO */}
      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Récords absolutos · 1930–2022
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Los récords del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {r.recordsAbsolutos.length} récords históricos verificados, desde el Maracanazo de 1950
          hasta el Mineirazo de 2014. Datos cruzados con FIFA, RSSSF y Guinness.
        </p>
      </header>

      {/* RÉCORDS ABSOLUTOS */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Récords absolutos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {r.recordsAbsolutos.map((rec, i) => (
            <article
              key={i}
              className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-2">
                {rec.categoria}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                {rec.titulo}
              </h3>
              <div
                className="text-xl sm:text-2xl font-black tabular-nums mb-2"
                style={{ color: GOLD }}
              >
                {rec.valor}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {rec.detalle}
              </p>
              {rec.vigente && (
                <div className="mt-3 inline-flex items-center text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                  ▸ VIGENTE
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* TOP GOLEADORES ALL-TIME */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Top goleadores históricos
        </h2>
        <div className="rounded-2xl border border-[#1E293B] overflow-hidden bg-[#0F1D32]/40">
          {r.topGoleadoresAllTime.map((g, i) => (
            <div
              key={g.nombre}
              className="grid items-center gap-3 px-3 sm:px-4 py-3 border-b border-[#0F172A] last:border-b-0"
              style={{
                gridTemplateColumns: "32px 28px 1fr auto auto",
                background: i % 2 === 0 ? "transparent" : "rgba(15,23,42,0.3)",
              }}
            >
              <span
                className="text-xs sm:text-sm font-bold tabular-nums text-center"
                style={{ color: i < 3 ? GOLD : "#64748B" }}
              >
                {i + 1}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${g.seleccion.iso2}.png`}
                alt={g.seleccion.pais}
                className="w-7 h-5 object-cover rounded-[1px]"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {g.nombre}
                </div>
                <div className="text-[11px] text-gray-500">
                  {g.mundiales.length} Mundial{g.mundiales.length > 1 ? "es" : ""} ·{" "}
                  {g.mundiales.join(", ")}
                </div>
              </div>
              <span className="hidden sm:inline text-[11px] text-gray-500">
                {g.seleccion.pais}
              </span>
              <span
                className="text-lg sm:text-2xl font-black tabular-nums"
                style={{ color: GOLD }}
              >
                {g.goles}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* MÁS PARTIDOS Y MUNDIALES */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Más partidos disputados
          </h2>
          <div className="rounded-2xl border border-[#1E293B] overflow-hidden bg-[#0F1D32]/40">
            {r.masPartidosJugados.map((p, i) => (
              <div
                key={p.nombre}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-[#0F172A] last:border-b-0"
                style={{
                  background: i % 2 === 0 ? "transparent" : "rgba(15,23,42,0.3)",
                }}
              >
                <span
                  className="text-xs font-bold tabular-nums w-6 text-center"
                  style={{ color: i < 3 ? GOLD : "#64748B" }}
                >
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${p.seleccion.iso2}.png`}
                  alt=""
                  className="w-5 h-3.5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <span className="text-sm font-semibold text-white flex-1 truncate">
                  {p.nombre}
                </span>
                <span
                  className="text-base font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {p.partidos}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Más Mundiales jugados
          </h2>
          <div className="rounded-2xl border border-[#1E293B] overflow-hidden bg-[#0F1D32]/40">
            {r.masMundialesJugados.map((p, i) => (
              <div
                key={p.nombre}
                className="px-3 py-2.5 border-b border-[#0F172A] last:border-b-0"
                style={{
                  background: i % 2 === 0 ? "transparent" : "rgba(15,23,42,0.3)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold tabular-nums w-6 text-center"
                    style={{ color: GOLD }}
                  >
                    {p.mundiales}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${p.seleccion.iso2}.png`}
                    alt=""
                    className="w-5 h-3.5 object-cover rounded-[1px]"
                    loading="lazy"
                  />
                  <span className="text-sm font-semibold text-white flex-1 truncate">
                    {p.nombre}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 ml-9 mt-0.5">
                  {p.anios.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TABLA HISTÓRICA */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Tabla histórica de selecciones
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[#1E293B] bg-[#0F1D32]/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-[#0F172A]">
                <th className="text-left px-3 py-3">#</th>
                <th className="text-left px-3 py-3">Selección</th>
                <th className="text-center px-3 py-3" title="Participaciones">
                  P
                </th>
                <th className="text-center px-3 py-3" title="Campeonatos">
                  ★
                </th>
                <th className="text-center px-3 py-3" title="Subcampeonatos">
                  2°
                </th>
                <th className="text-center px-3 py-3" title="Podios">
                  3°+
                </th>
                <th className="text-right px-3 py-3 hidden sm:table-cell">Pts</th>
              </tr>
            </thead>
            <tbody>
              {r.tablaHistoricaSelecciones.map((s, i) => (
                <tr
                  key={s.iso3}
                  className="border-b border-[#0F172A] last:border-b-0"
                  style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(15,23,42,0.3)",
                  }}
                >
                  <td
                    className="px-3 py-2.5 font-bold tabular-nums text-xs"
                    style={{ color: i < 3 ? GOLD : "#64748B" }}
                  >
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/w40/${s.iso2}.png`}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-[1px]"
                        loading="lazy"
                      />
                      <span className="font-semibold text-white">{s.pais}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-300">
                    {s.participaciones}
                  </td>
                  <td
                    className="px-3 py-2.5 text-center font-black"
                    style={{ color: GOLD }}
                  >
                    {s.campeonatos}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-400">
                    {s.subcampeonatos}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-400">
                    {s.podios}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-300 hidden sm:table-cell">
                    {fmt(s.puntos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CAMPEONES COMO JUGADOR Y DT */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Únicos campeones del Mundo como jugador y DT
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {r.campeonesComoJugadorYDT.map((c) => (
            <div
              key={c.nombre}
              className="p-4 rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-2">
                {c.seleccion}
              </div>
              <h3 className="text-base font-bold text-white mb-3">{c.nombre}</h3>
              <div className="space-y-1.5 text-xs">
                <div className="text-gray-400">
                  <span className="text-gray-500">Jugador: </span>
                  <span className="text-white font-semibold">
                    {c.campeonJugador.join(", ")}
                  </span>
                </div>
                <div className="text-gray-400">
                  <span className="text-gray-500">DT: </span>
                  <span className="text-white font-semibold">
                    {c.campeonDT.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DTs MÁS MUNDIALES */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Entrenadores con más Mundiales
        </h2>
        <div className="space-y-3">
          {r.dtMasMundiales.map((dt) => (
            <div
              key={dt.nombre}
              className="p-4 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-base font-bold text-white">{dt.nombre}</h3>
                <span
                  className="text-xl font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {dt.mundiales}
                </span>
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">
                {dt.selecciones.join(" · ")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUENTES */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3">Fuentes</h2>
        <ul className="text-xs sm:text-sm text-gray-400 space-y-1.5">
          {r.fuentes.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#C9A84C] flex-shrink-0">→</span>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-[#C9A84C] underline-offset-2 hover:underline break-all"
              >
                {f.nombre}
              </a>
            </li>
          ))}
        </ul>
        <div className="text-[11px] text-gray-600 mt-3">
          Última actualización: {r.actualizadoEn}
        </div>
      </section>
      <EditorialBlock slug="records" />
    </>
  );
}
