import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getEconomia } from "@/lib/content/ediciones";
import BarChart from "@/components/historia/BarChart";

export const metadata: Metadata = {
  title:
    "Economía del Mundial — Premios FIFA 1982-2026 | ZonaMundial",
  description:
    "Premios económicos del Mundial: de 138.000 USD para Italia 1982 a 42M USD para Argentina 2022. Bolsas FIFA, derechos TV, ingresos. Crecimiento de +434.000% en 44 años.",
  alternates: { canonical: "https://zonamundial.app/historia/economia" },
  openGraph: {
    title: "Economía del Mundial | ZonaMundial",
    description: "El dinero detrás del Mundial: premios FIFA y derechos TV.",
    url: "https://zonamundial.app/historia/economia",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return new Intl.NumberFormat("en-US").format(n);
}

export default function EconomiaPage() {
  const data = getEconomia();
  const dg = data.datosGenerales;

  const evolucionPremio = data.premiosPorEdicion.map((p) => ({
    label: String(p.anio),
    value: p.premioCampeon / 1_000_000,
    highlight: p.anio === 2026 || p.anio === 1982,
  }));

  const evolucionTotal = data.premiosPorEdicion.map((p) => ({
    label: String(p.anio),
    value: p.premioTotal / 1_000_000,
  }));

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Economía</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          El dinero del Mundial
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Economía del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {data.datoIntroductorio}
        </p>
      </header>

      {/* Charts */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
          Premio al campeón (millones USD)
        </h2>
        <div className="p-4 sm:p-5 rounded-2xl border border-[#241e12] bg-[#14110a]/40">
          <BarChart data={evolucionPremio} unit="M$" decimals={1} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
          Bolsa total FIFA (millones USD)
        </h2>
        <div className="p-4 sm:p-5 rounded-2xl border border-[#241e12] bg-[#14110a]/40">
          <BarChart data={evolucionTotal} unit="M$" decimals={1} />
        </div>
      </section>

      {/* Tabla detallada */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Detalle por edición
        </h2>
        <div className="space-y-2">
          {data.premiosPorEdicion.map((p) => (
            <Link
              key={p.anio}
              href={`/historia/${p.edicionSlug}`}
              className="block p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 transition-all no-underline"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span className="text-xl font-black tabular-nums" style={{ color: GOLD }}>
                  {p.anio}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Campeón
                </span>
                <span className="text-base font-bold text-white tabular-nums">
                  ${fmtUSD(p.premioCampeon)}
                </span>
                <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wider">
                  Bolsa total
                </span>
                <span className="text-base font-bold text-gray-300 tabular-nums">
                  ${fmtUSD(p.premioTotal)}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{p.datoClave}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Datos generales */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Datos generales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(dg).map(([k, v]) => (
            <div key={k} className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-2">
                {k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <EditorialBlock slug="economia" />
    </>
  );
}
