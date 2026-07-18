// src/app/historia/comparar-jugadores/page.tsx
// ZonaMundial — Comparativa entre dos jugadores legendarios

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllJugadoresLegendarios,
  getJugadorBySlug,
} from "@/lib/content/ediciones";
import type { JugadorLegendario } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Comparar Jugadores Legendarios del Mundial | ZonaMundial",
  description:
    "Compara dos jugadores legendarios lado a lado: Mundiales, partidos, goles, títulos y biografías. Por defecto: Pelé vs Maradona.",
  alternates: { canonical: "https://zonamundial.app/historia/comparar-jugadores" },
  openGraph: {
    title: "Comparar Jugadores Legendarios | ZonaMundial",
    description: "Compara dos leyendas mundialistas lado a lado.",
    url: "https://zonamundial.app/historia/comparar-jugadores",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const GOLD = "#c9a84c";

export default async function CompararJugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const slugA = params.a ?? "pele";
  const slugB = params.b ?? "diego-maradona";

  const all = getAllJugadoresLegendarios();
  const a = getJugadorBySlug(slugA) ?? all[0];
  const b = getJugadorBySlug(slugB) ?? all[1];

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li><Link href="/historia/jugadores" className="hover:text-[#C9A84C]">Jugadores</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Comparar</li>
        </ol>
      </nav>

      <header className="mb-8">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Comparativa de leyendas
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-[1.05]">
          {a.nombre} <span className="text-gray-500">vs</span>{" "}
          <span style={{ color: GOLD }}>{b.nombre}</span>
        </h1>
      </header>

      <section className="mb-8">
        <form className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Jugador A
            </label>
            <select
              name="a"
              defaultValue={slugA}
              className="w-full p-3 rounded-lg border border-[#241e12] bg-[#14110a] text-white text-sm"
            >
              {all.map((j) => (
                <option key={j.slug} value={j.slug}>
                  {j.nombre} ({j.seleccion.pais})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Jugador B
            </label>
            <select
              name="b"
              defaultValue={slugB}
              className="w-full p-3 rounded-lg border border-[#241e12] bg-[#14110a] text-white text-sm"
            >
              {all.map((j) => (
                <option key={j.slug} value={j.slug}>
                  {j.nombre} ({j.seleccion.pais})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="p-3 rounded-lg font-bold text-sm text-[#000000]"
            style={{ background: "linear-gradient(135deg, #c9a84c, #e8d48b)" }}
          >
            Comparar
          </button>
        </form>
      </section>

      {/* HEROS */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        <JugadorHero j={a} />
        <JugadorHero j={b} />
      </section>

      {/* STATS */}
      <section className="space-y-3 mb-8">
        <CompareRow label="Mundiales jugados" a={a.mundialesJugados.length} b={b.mundialesJugados.length} />
        <CompareRow label="Títulos" a={a.titulos} b={b.titulos} highlight />
        <CompareRow label="Partidos" a={a.partidos} b={b.partidos} />
        <CompareRow label="Goles" a={a.goles} b={b.goles} highlight />
        <CompareRow
          label="Goles / partido"
          a={Number((a.goles / Math.max(a.partidos, 1)).toFixed(2))}
          b={Number((b.goles / Math.max(b.partidos, 1)).toFixed(2))}
          decimals={2}
        />
      </section>

      {/* SUBTÍTULOS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Quote j={a} />
        <Quote j={b} />
      </section>

      {/* AÑOS DE TÍTULOS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <TitulosBox j={a} />
        <TitulosBox j={b} />
      </section>

      {/* LOGROS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <LogrosBox j={a} />
        <LogrosBox j={b} />
      </section>
      <EditorialBlock slug="comparar-jugadores" />
    </>
  );
}

function compareNum(a: number, b: number) {
  if (a > b) return { aWins: true, bWins: false };
  if (b > a) return { aWins: false, bWins: true };
  return { aWins: false, bWins: false };
}

function JugadorHero({ j }: { j: JugadorLegendario }) {
  return (
    <Link
      href={`/historia/jugadores/${j.slug}`}
      className="block p-3 sm:p-4 rounded-2xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 no-underline transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/w80/${j.seleccion.iso2}.png`}
        alt=""
        className="w-12 h-8 object-cover rounded mb-2"
        loading="lazy"
      />
      <div className="text-base sm:text-xl font-black text-white truncate">{j.nombre}</div>
      <div className="text-[10px] text-gray-500 mt-1 truncate">
        {j.seleccion.pais} · {j.posicion} · {j.anios}
      </div>
    </Link>
  );
}

function CompareRow({
  label,
  a,
  b,
  decimals = 0,
  highlight,
}: {
  label: string;
  a: number;
  b: number;
  decimals?: number;
  highlight?: boolean;
}) {
  const cmp = compareNum(a, b);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 p-3 rounded-xl border border-[#241e12] bg-[#14110a]/40">
      <div
        className="text-right text-base sm:text-2xl font-black tabular-nums"
        style={{
          color: cmp.aWins ? GOLD : highlight ? "#fff" : "#a69a82",
        }}
      >
        {decimals > 0 ? a.toFixed(decimals) : a}
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center min-w-[90px]">
        {label}
      </div>
      <div
        className="text-left text-base sm:text-2xl font-black tabular-nums"
        style={{
          color: cmp.bWins ? GOLD : highlight ? "#fff" : "#a69a82",
        }}
      >
        {decimals > 0 ? b.toFixed(decimals) : b}
      </div>
    </div>
  );
}

function Quote({ j }: { j: JugadorLegendario }) {
  return (
    <div className="p-4 rounded-xl border border-[#C9A84C]/20 bg-[#14110a]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
        {j.nombre}
      </div>
      <p className="italic text-sm text-gray-200 leading-relaxed">«{j.subtitulo}»</p>
    </div>
  );
}

function TitulosBox({ j }: { j: JugadorLegendario }) {
  return (
    <div className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
        {j.nombre} · Mundiales
      </div>
      <div className="flex flex-wrap gap-1.5">
        {j.mundialesJugados.map((y) => {
          const ganado = j.anioTitulos.includes(y);
          return (
            <span
              key={y}
              className="px-2 py-0.5 rounded text-[11px] font-bold tabular-nums"
              style={{
                background: ganado ? "rgba(201,168,76,0.2)" : "#0a0906",
                color: ganado ? GOLD : "#a69a82",
                border: `1px solid ${ganado ? "rgba(201,168,76,0.5)" : "#241e12"}`,
              }}
            >
              {ganado && "★ "}
              {y}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function LogrosBox({ j }: { j: JugadorLegendario }) {
  return (
    <div className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
        {j.nombre} · Logros mundialistas
      </div>
      <ul className="space-y-1.5 text-xs text-gray-300">
        {j.logros.slice(0, 5).map((l, i) => (
          <li key={i} className="flex gap-2">
            <span style={{ color: GOLD }}>▸</span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
