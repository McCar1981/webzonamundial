// src/app/historia/curiosidades/page.tsx
// ZonaMundial — Catálogo de curiosidades y anécdotas del Mundial 1930-2026

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllCuriosidades } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Curiosidades y Anécdotas del Mundial — Datos increíbles 1930-2026 | ZonaMundial",
  description:
    "Más de 100 curiosidades y anécdotas verificadas del Mundial: Pickles el perro, la Mano de Dios, el Mineirazo, la convulsión de Ronaldo, la Vergüenza de Gijón, el bisht de Messi y mucho más.",
  keywords: [
    "curiosidades mundial",
    "anecdotas mundial futbol",
    "datos curiosos copa del mundo",
    "historias mundial",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/curiosidades" },
  openGraph: {
    title: "Curiosidades del Mundial 1930-2026 | ZonaMundial",
    description:
      "Más de 100 anécdotas verificadas del Mundial de Fútbol, edición por edición.",
    url: "https://zonamundial.app/historia/curiosidades",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

const CATEGORIA_LABELS: Record<string, { label: string; color: string }> = {
  politica: { label: "Política", color: "#DC2626" },
  tragedia: { label: "Tragedia", color: "#9333EA" },
  hito: { label: "Hito histórico", color: "#C9A84C" },
  balon: { label: "Balones", color: "#F59E0B" },
  mascota: { label: "Mascotas", color: "#10B981" },
  estadio: { label: "Estadios", color: "#3B82F6" },
  arbitro: { label: "Árbitros", color: "#8B5CF6" },
  jugador: { label: "Jugadores", color: "#EC4899" },
  misc: { label: "Misceláneas", color: "#64748B" },
};

const CATEGORIA_ORDER = [
  "hito",
  "jugador",
  "politica",
  "tragedia",
  "balon",
  "estadio",
  "mascota",
  "arbitro",
  "misc",
];

export default function CuriosidadesPage() {
  const all = getAllCuriosidades();

  // Agrupar por categoría
  const grouped = CATEGORIA_ORDER.map((cat) => ({
    cat,
    items: all.filter((c) => c.categoria === cat),
  })).filter((g) => g.items.length > 0);

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
          <li className="text-[#C9A84C]">Curiosidades</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Anécdotas verificadas
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Curiosidades del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          {all.length} curiosidades, anécdotas y datos extraños del Mundial desde 1930 hasta
          2026. Cada una verificada con dos fuentes mínimas y enlazada a su edición.
        </p>
      </header>

      {/* CONTADOR POR CATEGORÍA */}
      <section className="mb-10">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {CATEGORIA_ORDER.map((cat) => {
            const count = all.filter((c) => c.categoria === cat).length;
            const meta = CATEGORIA_LABELS[cat];
            return (
              <a
                key={cat}
                href={`#cat-${cat}`}
                className="p-3 rounded-lg border border-[#1E293B] bg-[#0F1D32]/60 text-center hover:border-[#C9A84C]/40 transition-all no-underline"
              >
                <div
                  className="text-base sm:text-lg font-black tabular-nums"
                  style={{ color: meta.color }}
                >
                  {count}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                  {meta.label}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* CURIOSIDADES POR CATEGORÍA */}
      {grouped.map(({ cat, items }) => {
        const meta = CATEGORIA_LABELS[cat];
        return (
          <section key={cat} id={`cat-${cat}`} className="mb-12 scroll-mt-24">
            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{meta.label}</h2>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: meta.color }}
              >
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {items.map((c, i) => (
                <article
                  key={`${c.edicionSlug}-${cat}-${i}`}
                  className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
                >
                  <Link
                    href={`/historia/${c.edicionSlug}`}
                    className="text-[11px] font-bold tracking-wider uppercase no-underline hover:opacity-80 inline-block mb-2"
                    style={{ color: GOLD }}
                  >
                    ▸ {c.edicionAnio} · {c.edicionNombre}
                  </Link>
                  <p className="text-sm text-gray-300 leading-relaxed">{c.texto}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      <EditorialBlock slug="curiosidades" />
    </>
  );
}
