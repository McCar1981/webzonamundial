// src/app/historia/selecciones/[slug]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSeleccionHistBySlug,
  getAllSeleccionesHistoricas,
  getEdicionBySlug,
} from "@/lib/content/ediciones";

export const dynamicParams = false;
export const revalidate = 86400;

const GOLD = "#c9a84c";

export async function generateStaticParams() {
  return getAllSeleccionesHistoricas().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getSeleccionHistBySlug(slug);
  if (!s) return { title: "Selección no encontrada · ZonaMundial" };

  const title = `${s.pais} en los Mundiales — ${s.titulos} títulos | ZonaMundial`;
  const desc = s.biografia.slice(0, 158) + "…";

  return {
    title,
    description: desc,
    alternates: { canonical: `https://zonamundial.app/historia/selecciones/${slug}` },
    openGraph: {
      title,
      description: desc,
      url: `https://zonamundial.app/historia/selecciones/${slug}`,
      siteName: "ZonaMundial",
      locale: "es_ES",
      type: "article",
    },
  };
}

const SLUG_MAP: Record<number, string> = {
  1930: "1930-uruguay",
  1934: "1934-italia",
  1938: "1938-francia",
  1950: "1950-brasil",
  1954: "1954-suiza",
  1958: "1958-suecia",
  1962: "1962-chile",
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
};

export default async function SeleccionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getSeleccionHistBySlug(slug);
  if (!s) notFound();

  const titulosLinks = s.aniosTitulos.map((y) => {
    const sl = SLUG_MAP[y];
    const e = sl ? getEdicionBySlug(sl) : null;
    return { anio: y, slug: sl, nombre: e?.meta.nombreCorto ?? `${y}` };
  });

  const subLinks = s.aniosSubcampeon.map((y) => {
    const sl = SLUG_MAP[y];
    const e = sl ? getEdicionBySlug(sl) : null;
    return { anio: y, slug: sl, nombre: e?.meta.nombreCorto ?? `${y}` };
  });

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li><Link href="/historia/selecciones" className="hover:text-[#C9A84C]">Selecciones</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{s.pais}</li>
        </ol>
      </nav>

      <header className="mb-10 pb-6 border-b border-[#1E293B]">
        <div className="flex items-center gap-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w160/${s.iso2}.png`}
            alt={s.pais}
            className="w-16 h-11 object-cover rounded"
            loading="lazy"
          />
          <span className="text-3xl tabular-nums" style={{ color: GOLD }}>
            {"★".repeat(s.titulos)}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-2 leading-[1.05]">
          {s.pais}
        </h1>
        <p className="italic text-base sm:text-lg text-gray-300">«{s.subtitulo}»</p>
      </header>

      <section className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-[#C9A84C]/30 bg-[#0F1D32]/60 text-center">
            <div className="text-3xl font-black tabular-nums" style={{ color: GOLD }}>{s.titulos}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Campeón</div>
          </div>
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 text-center">
            <div className="text-3xl font-black tabular-nums text-white">{s.subcampeonatos}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Subcampeón</div>
          </div>
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 text-center">
            <div className="text-3xl font-black tabular-nums text-white">{s.podios}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Podios</div>
          </div>
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 text-center">
            <div className="text-3xl font-black tabular-nums text-white">{s.participaciones}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Mundiales</div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Historia</h2>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-[68ch]">
          {s.biografia}
        </p>
      </section>

      {titulosLinks.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">Títulos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {titulosLinks.map((t) =>
              t.slug ? (
                <Link
                  key={t.anio}
                  href={`/historia/${t.slug}`}
                  className="p-4 rounded-xl border border-[#C9A84C]/40 bg-[#0F1D32]/80 text-center hover:border-[#C9A84C] no-underline"
                >
                  <div className="text-2xl font-black tabular-nums" style={{ color: GOLD }}>{t.anio}</div>
                  <div className="text-xs text-gray-300 mt-1">{t.nombre}</div>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}

      {subLinks.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">Subcampeonatos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {subLinks.map((t) =>
              t.slug ? (
                <Link
                  key={t.anio}
                  href={`/historia/${t.slug}`}
                  className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60 text-center hover:border-[#C9A84C]/40 no-underline"
                >
                  <div className="text-xl font-black tabular-nums text-white">{t.anio}</div>
                  <div className="text-xs text-gray-400 mt-1">{t.nombre}</div>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Estrellas icónicas</h2>
        <div className="flex flex-wrap gap-2">
          {s.estrellasIconicas.map((j) => (
            <span
              key={j}
              className="px-3 py-1.5 rounded-full bg-[#0F1D32] border border-[#1E293B] text-sm text-gray-300"
            >
              {j}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Técnicos campeones</h2>
        <ul className="space-y-1.5 text-sm text-gray-300">
          {s.tecnicosCampeones.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-[#C9A84C]">▸</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Dato clave</h2>
        <div className="p-5 rounded-xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80">
          <p className="text-sm text-gray-200 leading-relaxed">{s.datoClave}</p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Trofeos</h2>
        <p className="text-sm text-gray-300 leading-relaxed max-w-[68ch]">{s.trofeos}</p>
      </section>
    </>
  );
}
