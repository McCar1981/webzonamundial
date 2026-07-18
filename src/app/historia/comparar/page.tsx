// src/app/historia/comparar/page.tsx
// ZonaMundial — Comparativa entre dos ediciones del Mundial

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllEdiciones, getEdicionBySlug } from "@/lib/content/ediciones";
import type { EdicionMundial } from "@/types/edicion";

export const metadata: Metadata = {
  title: "Comparar Ediciones del Mundial | ZonaMundial",
  description:
    "Compara dos ediciones del Mundial lado a lado: estadísticas, finales, asistencia, goleadores y formato. Por defecto: 1970 vs 2022.",
  alternates: { canonical: "https://zonamundial.app/historia/comparar" },
  openGraph: {
    title: "Comparar Ediciones del Mundial | ZonaMundial",
    description: "Comparativa interactiva entre dos ediciones del Mundial.",
    url: "https://zonamundial.app/historia/comparar",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const GOLD = "#c9a84c";

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("es-ES").format(n);
}

function compareNum(a: number, b: number): { aWins: boolean; bWins: boolean; tie: boolean } {
  if (a > b) return { aWins: true, bWins: false, tie: false };
  if (b > a) return { aWins: false, bWins: true, tie: false };
  return { aWins: false, bWins: false, tie: true };
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const slugA = params.a ?? "1970-mexico";
  const slugB = params.b ?? "2022-qatar";

  const a = getEdicionBySlug(slugA) ?? getEdicionBySlug("1970-mexico")!;
  const b = getEdicionBySlug(slugB) ?? getEdicionBySlug("2022-qatar")!;

  const ediciones = getAllEdiciones();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Comparar</li>
        </ol>
      </nav>

      <header className="mb-8">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Comparativa
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-[1.05]">
          {a.meta.anio} <span className="text-gray-500">vs</span>{" "}
          <span style={{ color: GOLD }}>{b.meta.anio}</span>
        </h1>
        <p className="text-sm text-gray-400">
          Compara dos ediciones lado a lado. Cambia los selectores para explorar cualquier
          combinación de las 23 ediciones.
        </p>
      </header>

      {/* SELECTORES */}
      <section className="mb-8">
        <form className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Edición A
            </label>
            <select
              name="a"
              defaultValue={slugA}
              className="w-full p-3 rounded-lg border border-[#241e12] bg-[#14110a] text-white text-sm"
            >
              {ediciones.map((e) => (
                <option key={e.meta.slug} value={e.meta.slug}>
                  {e.meta.anio} · {e.meta.nombreCorto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Edición B
            </label>
            <select
              name="b"
              defaultValue={slugB}
              className="w-full p-3 rounded-lg border border-[#241e12] bg-[#14110a] text-white text-sm"
            >
              {ediciones.map((e) => (
                <option key={e.meta.slug} value={e.meta.slug}>
                  {e.meta.anio} · {e.meta.nombreCorto}
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
      <section className="mb-8 grid grid-cols-2 gap-3">
        <EdicionCard e={a} />
        <EdicionCard e={b} />
      </section>

      {/* COMPARATIVAS */}
      <section className="space-y-3 mb-8">
        <CompareRow
          label="Equipos"
          a={a.formato.numEquipos}
          b={b.formato.numEquipos}
        />
        <CompareRow
          label="Partidos"
          a={a.formato.numPartidos}
          b={b.formato.numPartidos}
        />
        <CompareRow
          label="Goles totales"
          a={a.estadisticas.totalGoles}
          b={b.estadisticas.totalGoles}
        />
        <CompareRow
          label="Goles por partido"
          a={a.estadisticas.promedioGolesPartido}
          b={b.estadisticas.promedioGolesPartido}
          decimals={2}
        />
        <CompareRow
          label="Asistencia total"
          a={a.estadisticas.asistenciaTotal}
          b={b.estadisticas.asistenciaTotal}
        />
        <CompareRow
          label="Asistencia / partido"
          a={a.estadisticas.asistenciaPromedio}
          b={b.estadisticas.asistenciaPromedio}
        />
      </section>

      {/* FINAL FACE-OFF */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Final cara a cara</h2>
        <div className="grid grid-cols-2 gap-3">
          <FinalCard e={a} />
          <FinalCard e={b} />
        </div>
      </section>

      {/* TOP GOLEADOR */}
      {a.topGoleadores && b.topGoleadores && a.topGoleadores[0] && b.topGoleadores[0] && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Bota de Oro</h2>
          <div className="grid grid-cols-2 gap-3">
            <TopGoleador e={a} />
            <TopGoleador e={b} />
          </div>
        </section>
      )}
      <EditorialBlock slug="comparar" />
    </>
  );
}

function EdicionCard({ e }: { e: EdicionMundial }) {
  return (
    <Link
      href={`/historia/${e.meta.slug}`}
      className="block p-4 rounded-2xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 no-underline transition-all"
    >
      <div className="text-2xl sm:text-4xl font-black tabular-nums" style={{ color: GOLD }}>
        {e.meta.anio}
      </div>
      <div className="text-xs sm:text-sm font-bold text-white truncate mt-1">
        {e.meta.nombreCorto}
      </div>
      <div className="text-[10px] text-gray-500 mt-1">{e.fechas.inicio} → {e.fechas.final}</div>
      {e.resultados?.campeon && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#241e12]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${e.resultados.campeon.iso2}.png`}
            alt=""
            className="w-5 h-3.5 object-cover rounded-[1px]"
            loading="lazy"
          />
          <span className="text-xs font-bold text-white truncate">
            ★ {e.resultados.campeon.pais}
          </span>
        </div>
      )}
    </Link>
  );
}

function CompareRow({
  label,
  a,
  b,
  decimals = 0,
}: {
  label: string;
  a: number | undefined;
  b: number | undefined;
  decimals?: number;
}) {
  if (a === undefined || b === undefined) return null;
  const cmp = compareNum(a, b);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 p-3 rounded-xl border border-[#241e12] bg-[#14110a]/40">
      <div
        className="text-right text-base sm:text-lg font-black tabular-nums"
        style={{ color: cmp.aWins ? GOLD : "#a69a82" }}
      >
        {decimals > 0 ? a.toFixed(decimals) : fmt(a)}
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center min-w-[80px]">
        {label}
      </div>
      <div
        className="text-left text-base sm:text-lg font-black tabular-nums"
        style={{ color: cmp.bWins ? GOLD : "#a69a82" }}
      >
        {decimals > 0 ? b.toFixed(decimals) : fmt(b)}
      </div>
    </div>
  );
}

function FinalCard({ e }: { e: EdicionMundial }) {
  const f = e.partidoFinal;
  if (!f) {
    return (
      <div className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/40 text-center text-xs text-gray-500">
        Sin final disputada
      </div>
    );
  }
  return (
    <div className="p-3 rounded-xl border border-[#241e12] bg-[#14110a]/60 text-center">
      <div className="text-[10px] text-gray-500 mb-2 tabular-nums">{f.fecha}</div>
      <div className="flex items-center justify-center gap-2 mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w40/${f.local.iso2}.png`}
          alt=""
          className="w-5 h-3.5 object-cover rounded-[1px]"
          loading="lazy"
        />
        <span className="text-xs font-semibold text-white">{f.local.pais}</span>
      </div>
      <div className="text-base font-black tabular-nums my-1" style={{ color: GOLD }}>
        {f.marcador}
      </div>
      <div className="flex items-center justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w40/${f.visitante.iso2}.png`}
          alt=""
          className="w-5 h-3.5 object-cover rounded-[1px]"
          loading="lazy"
        />
        <span className="text-xs font-semibold text-white">{f.visitante.pais}</span>
      </div>
    </div>
  );
}

function TopGoleador({ e }: { e: EdicionMundial }) {
  const top = e.topGoleadores?.[0];
  if (!top) return null;
  return (
    <div className="p-3 rounded-xl border border-[#241e12] bg-[#14110a]/60 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/w40/${top.seleccion.iso2}.png`}
        alt=""
        className="w-7 h-5 object-cover rounded-[1px] mx-auto mb-2"
        loading="lazy"
      />
      <div className="text-sm font-bold text-white">{top.nombre}</div>
      <div className="text-[10px] text-gray-500">{top.seleccion.pais}</div>
      <div className="text-2xl font-black tabular-nums mt-2" style={{ color: GOLD }}>
        {top.goles}
      </div>
    </div>
  );
}
