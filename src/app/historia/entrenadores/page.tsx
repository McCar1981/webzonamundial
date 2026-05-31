import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllEntrenadores } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Entrenadores Legendarios del Mundial — Pozzo, Zagallo, Beckenbauer, Deschamps | ZonaMundial",
  description:
    "Los entrenadores que escribieron la historia del Mundial: Vittorio Pozzo (único bicampeón consecutivo), Zagallo, Beckenbauer y Deschamps (campeones como jugador y DT), Bilardo, Menotti, Scaloni.",
  alternates: { canonical: "https://zonamundial.app/historia/entrenadores" },
  openGraph: {
    title: "Entrenadores Legendarios del Mundial | ZonaMundial",
    description: "Los técnicos que ganaron y marcaron el Mundial.",
    url: "https://zonamundial.app/historia/entrenadores",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function EntrenadoresPage() {
  const entrenadores = getAllEntrenadores();
  // Orden: campeones primero, luego por # mundiales dirigidos
  const sorted = [...entrenadores].sort((a, b) => {
    if (b.titulos.length !== a.titulos.length) return b.titulos.length - a.titulos.length;
    return b.mundialesDirigidos.length - a.mundialesDirigidos.length;
  });

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Entrenadores</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          {entrenadores.length} técnicos legendarios
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Entrenadores del Mundial
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          De Vittorio Pozzo (único bicampeón consecutivo, 1934-1938) a Lionel Scaloni
          (campeón en su debut como DT mundialista, 2022). Las leyendas del banco.
        </p>
      </header>

      <section>
        <div className="space-y-3 sm:space-y-4">
          {sorted.map((e) => (
            <article
              key={e.slug}
              className="p-4 sm:p-6 rounded-2xl border border-[#1E293B] bg-[#0F1D32]/60"
              style={e.titulos.length > 0 ? { borderColor: "rgba(201,168,76,0.2)" } : undefined}
            >
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${e.iso2}.png`}
                  alt=""
                  className="w-7 h-5 object-cover rounded-[1px]"
                  loading="lazy"
                />
                <h2 className="text-lg sm:text-xl font-bold text-white">{e.nombre}</h2>
                <span className="text-xs text-gray-500">{e.pais}</span>
                {e.titulos.length > 0 && (
                  <span className="text-base font-black tabular-nums" style={{ color: GOLD }}>
                    {"★".repeat(e.titulos.length)}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mb-3">
                {e.anios} · Mundiales: {e.mundialesDirigidos.join(", ")}
                {e.titulos.length > 0 && (
                  <span> · Campeón: {e.titulos.join(", ")}</span>
                )}
              </div>
              <p className="italic text-sm text-gray-300 mb-3">«{e.subtitulo}»</p>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">{e.datoClave}</p>
              {e.anecdotas.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[#1E293B]">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
                    Anécdotas
                  </div>
                  {e.anecdotas.map((a, i) => (
                    <p key={i} className="text-xs text-gray-400 leading-relaxed">
                      <span style={{ color: GOLD }}>▸</span> {a}
                    </p>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
      <EditorialBlock slug="entrenadores" />
    </>
  );
}
