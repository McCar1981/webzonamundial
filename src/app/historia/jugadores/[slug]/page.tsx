// src/app/historia/jugadores/[slug]/page.tsx
// ZonaMundial — Detalle de jugador legendario

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getJugadorBySlug,
  getAllJugadoresLegendarios,
  getEdicionBySlug,
} from "@/lib/content/ediciones";

export const dynamicParams = false;
export const revalidate = 86400;

const GOLD = "#c9a84c";

// Overrides SEO por jugador (CTR). Solo metadatos.
const SEO_OVERRIDES: Record<string, { title: string; description: string }> = {
  "lionel-messi": {
    title: "Lionel Messi en los Mundiales: partidos, goles y palmarés",
    description:
      "El recorrido de Lionel Messi en los Mundiales: ediciones jugadas, goles, récords y el título logrado con Argentina. Toda su trayectoria.",
  },
};

export async function generateStaticParams() {
  return getAllJugadoresLegendarios().map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const j = getJugadorBySlug(slug);
  if (!j) return { title: "Jugador no encontrado · ZonaMundial" };

  const override = SEO_OVERRIDES[slug];
  const titleMeta: Metadata["title"] = override
    ? { absolute: override.title }
    : `${j.nombre} en los Mundiales — ${j.subtitulo} | ZonaMundial`;
  const ogTitle = override
    ? override.title
    : `${j.nombre} en los Mundiales — ${j.subtitulo} | ZonaMundial`;
  const desc = override ? override.description : j.biografia.slice(0, 158) + "…";

  return {
    title: titleMeta,
    description: desc,
    alternates: { canonical: `https://zonamundial.app/historia/jugadores/${slug}` },
    openGraph: {
      title: ogTitle,
      description: desc,
      url: `https://zonamundial.app/historia/jugadores/${slug}`,
      siteName: "ZonaMundial",
      locale: "es_ES",
      type: "profile",
    },
    robots: { index: true, follow: true, "max-image-preview": "large" },
  };
}

export default async function JugadorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const j = getJugadorBySlug(slug);
  if (!j) notFound();

  const mundialesData = j.mundialesJugados.map((y) => {
    const slugCandidates: Record<number, string> = {
      1958: "1958-suecia",
      1962: "1962-chile",
      1966: "1966-inglaterra",
      1970: "1970-mexico",
      1974: "1974-alemania",
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
    };
    const s = slugCandidates[y];
    const e = s ? getEdicionBySlug(s) : null;
    return { anio: y, slug: s, esCampeon: j.anioTitulos.includes(y), nombre: e?.meta.nombreCorto ?? `Mundial ${y}` };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: j.nombre,
    alternateName: j.nombreCompleto,
    nationality: j.seleccion.pais,
    description: j.subtitulo,
    url: `https://zonamundial.app/historia/jugadores/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <li>
            <Link href="/historia/jugadores" className="hover:text-[#C9A84C]">
              Jugadores
            </Link>
          </li>
          <li>/</li>
          <li className="text-[#C9A84C]">{j.nombre}</li>
        </ol>
      </nav>

      {/* HERO */}
      <header className="mb-10 pb-6 border-b border-[#241e12]">
        <div className="flex items-center gap-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w80/${j.seleccion.iso2}.png`}
            alt={j.seleccion.pais}
            className="w-12 h-8 object-cover rounded"
            loading="lazy"
          />
          <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C]">
            {j.seleccion.pais} · {j.posicion} · {j.anios}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-2 leading-[1.05]">
          {j.nombre}
        </h1>
        <p className="text-sm text-gray-500 mb-4">{j.nombreCompleto}</p>
        <p className="italic text-base sm:text-lg text-gray-300">«{j.subtitulo}»</p>
      </header>

      {/* STATS */}
      <section className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Mundiales" value={String(j.mundialesJugados.length)} />
          <Stat label="Títulos" value={String(j.titulos)} highlight={j.titulos > 0} />
          <Stat label="Partidos" value={String(j.partidos)} />
          <Stat label="Goles" value={String(j.goles)} highlight />
        </div>
      </section>

      {/* BIOGRAFÍA */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Biografía</h2>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-[68ch]">
          {j.biografia}
        </p>
      </section>

      {/* MUNDIALES JUGADOS */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Mundiales disputados
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {mundialesData.map((m) =>
            m.slug ? (
              <Link
                key={m.anio}
                href={`/historia/${m.slug}`}
                className="p-3 rounded-xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 transition-all no-underline text-center"
                style={m.esCampeon ? { borderColor: "rgba(201,168,76,0.4)" } : undefined}
              >
                <div
                  className="text-base font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {m.anio}
                </div>
                <div className="text-[10px] text-gray-400 truncate">{m.nombre}</div>
                {m.esCampeon && (
                  <div className="text-[9px] font-bold text-[#C9A84C] mt-1">★ CAMPEÓN</div>
                )}
              </Link>
            ) : (
              <div
                key={m.anio}
                className="p-3 rounded-xl border border-[#241e12] bg-[#14110a]/60 text-center"
              >
                <div
                  className="text-base font-black tabular-nums"
                  style={{ color: GOLD }}
                >
                  {m.anio}
                </div>
                <div className="text-[10px] text-gray-400">Mundial {m.anio}</div>
              </div>
            )
          )}
        </div>
      </section>

      {/* LOGROS */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Logros mundialistas</h2>
        <ul className="space-y-2.5 max-w-[68ch]">
          {j.logros.map((logro, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#C9A84C] flex-shrink-0">▸</span>
              <span>{logro}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ANÉCDOTAS */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Anécdotas</h2>
        <div className="space-y-3">
          {j.anecdotas.map((a, i) => (
            <article
              key={i}
              className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60"
            >
              <p className="text-sm text-gray-300 leading-relaxed">{a}</p>
            </article>
          ))}
        </div>
      </section>

      {j.fuentes && j.fuentes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-3">Fuentes</h2>
          <ul className="text-xs text-gray-400 space-y-1.5">
            {j.fuentes.map((f, i) => (
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
        </section>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60">
      <div
        className="text-2xl font-black tabular-nums"
        style={{ color: highlight ? GOLD : "#fff" }}
      >
        {value}
      </div>
      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
