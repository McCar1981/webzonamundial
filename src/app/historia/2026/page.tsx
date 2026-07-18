// src/app/historia/2026/page.tsx
// ZonaMundial — Preview dedicado al Mundial 2026

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import { getEdicionBySlug } from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title:
    "Mundial 2026 Norteamérica — 48 selecciones, 104 partidos, 39 días | ZonaMundial",
  description:
    "Todo sobre el Mundial 2026 (CAN/MEX/USA): primer Mundial con 48 selecciones, 12 grupos, 104 partidos en 39 días. Inaugural en el Azteca, final en MetLife. Mascotas Maple/Zayu/Clutch.",
  keywords: [
    "mundial 2026",
    "copa del mundo 2026",
    "norteamerica 2026",
    "48 selecciones mundial",
    "trionda balon 2026",
    "azteca 2026",
  ],
  alternates: { canonical: "https://zonamundial.app/historia/2026" },
  openGraph: {
    title: "Mundial 2026 Norteamérica | ZonaMundial",
    description: "El Mundial más grande de la historia: 48 equipos, 104 partidos, 39 días, 3 países.",
    url: "https://zonamundial.app/historia/2026",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "article",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const GOLD = "#c9a84c";

export default function Mundial2026Page() {
  const e = getEdicionBySlug("2026-norteamerica");
  if (!e) return null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Mundial 2026</li>
        </ol>
      </nav>

      {/* HERO MEGA */}
      <header className="mb-10 sm:mb-14">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#22C55E] mb-3">
          Próximo Mundial · 11 jun – 19 jul 2026
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white mb-4 leading-[0.95]">
          <span style={{ color: GOLD }}>2026</span>
          <span className="block text-3xl sm:text-4xl md:text-5xl text-gray-300 mt-2">
            Norteamérica
          </span>
        </h1>
        <p className="italic text-base sm:text-lg text-gray-400 mb-6">
          «We are 26»
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {e.sede.paises.map((p) => (
            <span
              key={p.iso3}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14110a] border border-[#241e12] text-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${p.iso2}.png`}
                alt={p.nombre}
                className="w-5 h-3.5 object-cover rounded-[1px]"
                loading="lazy"
              />
              <span className="font-semibold text-white">{p.nombre}</span>
            </span>
          ))}
        </div>
      </header>

      {/* MEGA STATS */}
      <section className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MegaStat n="48" label="Selecciones" />
          <MegaStat n="12" label="Grupos" />
          <MegaStat n="104" label="Partidos" />
          <MegaStat n="39" label="Días" />
          <MegaStat n="16" label="Sedes" small />
          <MegaStat n="3" label="Países" small />
          <MegaStat n="6" label="Confederaciones" small />
          <MegaStat n="6,5M" label="Asientos esperados" small />
        </div>
      </section>

      {/* CALENDARIO CLAVE */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Calendario clave
        </h2>
        <div className="space-y-3">
          <CalendarRow
            fecha="11 jun 2026"
            evento="Partido inaugural"
            detalle="México vs por confirmar · Estadio Banorte (Azteca), CDMX"
            highlight
          />
          <CalendarRow
            fecha="11–27 jun"
            evento="Fase de grupos"
            detalle="72 partidos · 12 grupos de 4 selecciones"
          />
          <CalendarRow
            fecha="28 jun – 3 jul"
            evento="16avos de final"
            detalle="ESTRENO en la historia: 32 selecciones a KO · 16 partidos"
          />
          <CalendarRow
            fecha="4–7 jul"
            evento="Octavos de final"
            detalle="8 partidos"
          />
          <CalendarRow
            fecha="9–11 jul"
            evento="Cuartos de final"
            detalle="4 partidos"
          />
          <CalendarRow
            fecha="14–15 jul"
            evento="Semifinales"
            detalle="2 partidos"
          />
          <CalendarRow
            fecha="18 jul"
            evento="Tercer puesto"
            detalle="Estadio TBD"
          />
          <CalendarRow
            fecha="19 jul 2026"
            evento="🏆 GRAN FINAL"
            detalle="MetLife Stadium, East Rutherford (NY metro)"
            highlight
          />
        </div>
      </section>

      {/* RÉCORDS */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Récords del Mundial 2026
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RecordCard
            titulo="Primer Mundial tripartito"
            descripcion="3 países anfitriones por primera vez en la historia: Canadá + México + EE.UU."
          />
          <RecordCard
            titulo="48 selecciones (récord)"
            descripcion="De 32 a 48: el formato más grande de la historia. 16 selecciones más que en 2022."
          />
          <RecordCard
            titulo="104 partidos (récord)"
            descripcion="40 partidos más que en 2022 (64). Casi el doble que las primeras ediciones."
          />
          <RecordCard
            titulo="Azteca 3 ediciones (récord)"
            descripcion="Primer estadio del mundo en albergar 3 Mundiales (1970, 1986, 2026). Rebautizado Estadio Banorte temporalmente."
          />
          <RecordCard
            titulo="39 días (más largo)"
            descripcion="El Mundial más largo de la historia. Antes de 2026 el más largo eran los 32-33 días desde 1998."
          />
          <RecordCard
            titulo="Adidas 56 años seguidos"
            descripcion="Monopolio del balón oficial desde el Telstar 1970 hasta el Trionda 2026."
          />
        </div>
      </section>

      {/* DEBUTANTES */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Debutantes 2026
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Debutante pais="Cabo Verde" iso2="cv" detalle="Su primera vez tras 4 intentos" />
          <Debutante pais="Curazao" iso2="cw" detalle="Nación más pequeña por población en clasificar" />
          <Debutante pais="Jordania" iso2="jo" detalle="Primer mundialista de la liga jordana" />
          <Debutante pais="Uzbekistán" iso2="uz" detalle="Primer Mundial centroasiático" />
        </div>
      </section>

      {/* IDENTIDAD VISUAL */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          Identidad visual 2026
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <IdentidadCard
            label="Eslogan"
            value="We are 26"
            detalle="Identidad de unidad tripartita norteamericana"
          />
          <IdentidadCard
            label="Mascota"
            value="Maple · Zayu · Clutch"
            detalle="Trío inédito: alce (Canadá), jaguar (México), águila (EE.UU.). Personajes jugables del videojuego oficial FIFA Heroes."
          />
          <IdentidadCard
            label="Balón oficial"
            value="Trionda"
            detalle="Solo 4 paneles, RÉCORD MÍNIMO histórico. Su nombre evoca 'tres olas' por los 3 países anfitriones."
          />
        </div>
      </section>

      {/* CONTEXTO Y CTA */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
          ¿Quién será el campeón #23?
        </h2>
        <div className="p-5 rounded-xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#14110a]/80 to-[#0a0906]/80">
          <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-4">
            Argentina llega como vigente bicampeón consecutivo tras 2022. Brasil busca
            la sexta estrella. Francia (Mbappé) y Alemania querrán recuperar protagonismo.
            Cristiano Ronaldo podría convertirse en el primer jugador con SEIS Mundiales si
            participa. Italia está ausente por tercera vez consecutiva.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/grupos"
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#000000] no-underline"
              style={{ background: "linear-gradient(135deg, #c9a84c, #e8d48b)" }}
            >
              Ver los 12 Grupos →
            </Link>
            <Link
              href="/historia/2026-norteamerica"
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#C9A84C] border border-[#C9A84C]/40 no-underline hover:bg-[#C9A84C]/10"
            >
              Ficha completa
            </Link>
          </div>
        </div>
      </section>
      <EditorialBlock slug="2026" />
    </>
  );
}

function MegaStat({ n, label, small }: { n: string; label: string; small?: boolean }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-[#241e12] bg-[#14110a]/60">
      <div className={`font-black tabular-nums ${small ? "text-2xl" : "text-3xl sm:text-4xl"}`} style={{ color: GOLD }}>
        {n}
      </div>
      <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function CalendarRow({
  fecha,
  evento,
  detalle,
  highlight,
}: {
  fecha: string;
  evento: string;
  detalle: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="grid items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-[#14110a]/60"
      style={{
        gridTemplateColumns: "auto 1fr",
        borderColor: highlight ? "rgba(201,168,76,0.3)" : "#241e12",
      }}
    >
      <div
        className="text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap"
        style={{ color: highlight ? GOLD : "#a69a82" }}
      >
        {fecha}
      </div>
      <div>
        <div className="text-sm sm:text-base font-bold text-white">{evento}</div>
        <div className="text-xs text-gray-400 mt-0.5">{detalle}</div>
      </div>
    </div>
  );
}

function RecordCard({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#C9A84C]/20 bg-[#14110a]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
        Récord
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{titulo}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{descripcion}</p>
    </div>
  );
}

function Debutante({
  pais,
  iso2,
  detalle,
}: {
  pais: string;
  iso2: string;
  detalle: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#22C55E]/30 bg-[#14110a]/60 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/w80/${iso2}.png`}
        alt={pais}
        className="w-12 h-8 object-cover rounded mx-auto mb-2"
        loading="lazy"
      />
      <div className="text-sm font-bold text-white">{pais}</div>
      <div className="text-[10px] text-gray-500 mt-1">{detalle}</div>
    </div>
  );
}

function IdentidadCard({
  label,
  value,
  detalle,
}: {
  label: string;
  value: string;
  detalle: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] mb-1">
        {label}
      </div>
      <div className="text-sm sm:text-base font-bold text-white mb-2">{value}</div>
      <p className="text-xs text-gray-400 leading-relaxed">{detalle}</p>
    </div>
  );
}
