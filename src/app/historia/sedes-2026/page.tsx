import type { Metadata } from "next";
import Link from "next/link";
import { getSedes2026 } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Sedes Mundial 2026 — Los 16 estadios de CAN/MEX/USA | ZonaMundial",
  description:
    "Las 16 sedes del Mundial 2026: Estadio Banorte (Azteca), MetLife (final), SoFi Stadium, AT&T Stadium, Mercedes-Benz, BC Place, BMO Field. Capacidad, partidos y datos.",
  alternates: { canonical: "https://zonamundial.app/historia/sedes-2026" },
  openGraph: {
    title: "Sedes Mundial 2026 | ZonaMundial",
    description: "Los 16 estadios del Mundial 2026 con sus partidos asignados.",
    url: "https://zonamundial.app/historia/sedes-2026",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

function fmt(n: number) {
  return new Intl.NumberFormat("es-ES").format(n);
}

export default function Sedes2026Page() {
  const data = getSedes2026();
  const totalCap = data.sedes.reduce((s, x) => s + x.capacidad, 0);
  const totalPartidos = data.sedes.reduce((s, x) => s + x.partidosAlbergados, 0);

  // Agrupar por país
  const porPais: Record<string, typeof data.sedes> = {};
  for (const s of data.sedes) {
    if (!porPais[s.pais]) porPais[s.pais] = [];
    porPais[s.pais].push(s);
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Sedes 2026</li>
        </ol>
      </nav>

      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#22C55E] mb-3">
          16 sedes · 3 países
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05]">
          Las 16 sedes del Mundial 2026
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
          11 estadios en EE.UU., 3 en México y 2 en Canadá. Final en MetLife (East
          Rutherford) el 19 de julio de 2026. Inaugural en el Estadio Banorte (Azteca).
        </p>
      </header>

      <section className="mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat n="16" label="Sedes" />
          <Stat n="3" label="Países" />
          <Stat n={fmt(totalCap)} label="Capacidad total" />
          <Stat n={String(totalPartidos)} label="Partidos asignados" />
        </div>
      </section>

      {Object.entries(porPais).map(([pais, sedes]) => (
        <section key={pais} className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
            {pais} · {sedes.length} sede{sedes.length > 1 ? "s" : ""}
          </h2>
          <div className="space-y-3">
            {sedes.map((s) => (
              <article
                key={s.estadio}
                className="p-4 sm:p-5 rounded-2xl border bg-[#0F1D32]/60"
                style={s.rolEspecial ? { borderColor: "rgba(201,168,76,0.4)" } : { borderColor: "#1E293B" }}
              >
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${s.iso2}.png`}
                    alt=""
                    className="w-6 h-4 object-cover rounded-[1px]"
                    loading="lazy"
                  />
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {s.estadio}
                  </h3>
                  <span className="text-xs text-gray-500">{s.ciudad}</span>
                  {s.rolEspecial && (
                    <span
                      className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "rgba(201,168,76,0.15)", color: GOLD }}
                    >
                      ★ {s.rolEspecial}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-3 flex-wrap text-[11px] text-gray-400">
                  <span>
                    <span className="text-gray-500">Capacidad:</span>{" "}
                    <span className="tabular-nums text-gray-200">{fmt(s.capacidad)}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <span className="text-gray-500">Partidos:</span>{" "}
                    <span className="tabular-nums text-gray-200">{s.partidosAlbergados}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{s.datoClave}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10">
        <div className="p-5 rounded-xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1D32]/80 to-[#0B1825]/80">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Resumen
          </div>
          <p className="text-sm text-gray-200 leading-relaxed italic">«{data.datoCierre}»</p>
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#1E293B] bg-[#0F1D32]/60">
      <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: GOLD }}>
        {n}
      </div>
      <div className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
