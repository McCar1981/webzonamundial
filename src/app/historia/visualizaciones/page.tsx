// src/app/historia/visualizaciones/page.tsx
// ZonaMundial — Visualizaciones de datos (CSS-only)

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllEdiciones,
  getRegistrosHistoricos,
  getAllConfederaciones,
} from "@/lib/content/ediciones";
import BarChart from "@/components/historia/BarChart";

export const metadata: Metadata = {
  title: "Visualizaciones del Mundial — Goles, asistencia, palmarés | ZonaMundial",
  description:
    "Visualizaciones de datos del Mundial: evolución de goles por edición, asistencia, palmarés all-time, distribución por confederación.",
  alternates: { canonical: "https://zonamundial.app/historia/visualizaciones" },
  openGraph: {
    title: "Visualizaciones del Mundial | ZonaMundial",
    description: "Datos del Mundial en gráficos: goles, asistencia, palmarés.",
    url: "https://zonamundial.app/historia/visualizaciones",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function VisualizacionesPage() {
  const ediciones = getAllEdiciones().filter((e) => !e.proximo);
  const registros = getRegistrosHistoricos();
  const confs = getAllConfederaciones();

  // Datasets
  const golesPorEdicion = ediciones.map((e) => ({
    label: String(e.meta.anio),
    value: e.estadisticas.totalGoles,
  }));

  const promedioGoles = ediciones.map((e) => ({
    label: String(e.meta.anio),
    value: e.estadisticas.promedioGolesPartido,
    highlight: e.estadisticas.promedioGolesPartido >= 3.5 || e.estadisticas.promedioGolesPartido <= 2.3,
  }));

  const asistenciaPromedio = ediciones
    .filter((e) => e.estadisticas.asistenciaPromedio)
    .map((e) => ({
      label: String(e.meta.anio),
      value: e.estadisticas.asistenciaPromedio!,
      highlight: e.meta.anio === 1994, // récord histórico
    }));

  const palmares = registros.tablaHistoricaSelecciones.slice(0, 8).map((s) => ({
    label: s.iso3,
    value: s.campeonatos,
    highlight: s.campeonatos >= 4,
  }));

  const confTitulos = confs
    .filter((c) => c.titulosMundiales > 0)
    .map((c) => ({
      label: c.codigo,
      value: c.titulosMundiales,
      highlight: c.titulosMundiales >= 10,
    }));

  const goleadoresTop = registros.topGoleadoresAllTime.map((g) => ({
    label: g.nombre.split(" ").slice(-1)[0].slice(0, 8),
    value: g.goles,
    highlight: g.goles >= 14,
  }));

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Visualizaciones</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Datos visualizados
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          El Mundial en gráficos
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Evolución de goles, asistencia, palmarés histórico, top scorers y distribución
          por confederación. Todos los datos en visualizaciones rápidas de leer.
        </p>
      </header>

      {/* Goles totales por edición */}
      <Section
        title="Goles totales por edición"
        subtitle="Total de goles anotados en cada Mundial. Récord: 172 (Catar 2022)."
      >
        <BarChart data={golesPorEdicion} unit="goles" />
      </Section>

      {/* Promedio goles */}
      <Section
        title="Promedio de goles por partido"
        subtitle="Récord histórico: 5,38 (Suiza 1954). Mínimo: 2,21 (Italia 1990). Las barras doradas marcan los extremos."
      >
        <BarChart data={promedioGoles} unit="g/p" decimals={2} />
      </Section>

      {/* Asistencia promedio */}
      <Section
        title="Asistencia promedio por partido"
        subtitle="Récord vigente: 68.991 espectadores/partido (EE.UU. 1994), destacado en dorado."
      >
        <BarChart data={asistenciaPromedio} />
      </Section>

      {/* Palmarés */}
      <Section
        title="Palmarés all-time"
        subtitle="Brasil pentacampeón. Alemania e Italia tetracampeones. Argentina tricampeón con Messi."
      >
        <BarChart data={palmares} unit="títulos" />
      </Section>

      {/* Confederaciones */}
      <Section
        title="Títulos por confederación"
        subtitle="UEFA y CONMEBOL acumulan los 22 títulos jugados. CAF, AFC, CONCACAF y OFC siguen sin título."
      >
        <BarChart data={confTitulos} unit="títulos" />
      </Section>

      {/* Top goleadores */}
      <Section
        title="Top goleadores all-time"
        subtitle="Klose 16 (récord vigente). Las barras doradas marcan los que tienen 14 o más goles."
      >
        <BarChart data={goleadoresTop} unit="goles" />
      </Section>

      {/* CTA */}
      <section className="mt-10">
        <Link
          href="/historia/records"
          className="block p-5 rounded-xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80 hover:border-[#C9A84C]/60 transition-all no-underline"
        >
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-base text-white">Ver récords absolutos completos</span>
          </div>
          <div className="text-xs text-gray-400">
            19 récords históricos vigentes con detalles, años y contexto
          </div>
        </Link>
      </section>
      <EditorialBlock slug="visualizaciones" />
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/40">
        {children}
      </div>
    </section>
  );
}
