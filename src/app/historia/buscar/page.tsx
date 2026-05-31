// src/app/historia/buscar/page.tsx
// ZonaMundial — Búsqueda global

import EditorialBlock from "@/components/historia/EditorialBlock";
import type { Metadata } from "next";
import Link from "next/link";
import BuscadorGlobal, { type SearchItem } from "@/components/historia/BuscadorGlobal";
import {
  getAllEdiciones,
  getAllJugadoresLegendarios,
  getAllSeleccionesHistoricas,
  getAllBalones,
  getAllMascotas,
  getAllEstadios,
  getAllArbitros,
  getAllPolemicas,
  getAllGolesLegendarios,
  getAllTrofeos,
  getPremios,
  getAllEras,
  getAllCuriosidades,
  getAllEntrenadores,
  getAllPartidosLegendarios,
  getAllConfederaciones,
  getAllCamisetas,
  getAllMomentos,
  getAllSociopolitica,
} from "@/lib/content/ediciones";

export const metadata: Metadata = {
  title: "Buscar en la Historia del Mundial | ZonaMundial",
  description:
    "Busca cualquier dato del Mundial: jugadores, ediciones, goles, polémicas, balones, mascotas, estadios, árbitros, trofeos, eras y curiosidades.",
  alternates: { canonical: "https://zonamundial.app/historia/buscar" },
  openGraph: {
    title: "Buscar en la Historia del Mundial | ZonaMundial",
    description: "Búsqueda unificada sobre todos los datos del Mundial.",
    url: "https://zonamundial.app/historia/buscar",
    siteName: "ZonaMundial",
    locale: "es_ES",
    type: "website",
  },
  robots: { index: true, follow: true },
};

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  // Ediciones
  for (const e of getAllEdiciones()) {
    items.push({
      type: "edicion",
      title: `${e.meta.anio} · ${e.meta.nombreCorto}`,
      subtitle:
        e.resultados?.campeon
          ? `Campeón: ${e.resultados.campeon.pais}${e.resultados?.subcampeon ? ` · vs ${e.resultados.subcampeon.pais}` : ""}`
          : "Próxima edición",
      href: `/historia/${e.meta.slug}`,
      searchExtra: `${e.meta.tituloOficial} ${e.sede.paises.map((p) => p.nombre).join(" ")}`,
    });
  }

  // Jugadores
  for (const j of getAllJugadoresLegendarios()) {
    items.push({
      type: "jugador",
      title: j.nombre,
      subtitle: `${j.seleccion.pais} · ${j.subtitulo}`,
      href: `/historia/jugadores/${j.slug}`,
      searchExtra: `${j.nombreCompleto} ${j.posicion} ${j.anios}`,
    });
  }

  // Selecciones
  for (const s of getAllSeleccionesHistoricas()) {
    items.push({
      type: "seleccion",
      title: s.pais,
      subtitle: `${s.titulos} título${s.titulos > 1 ? "s" : ""} · ${s.subtitulo}`,
      href: `/historia/selecciones/${s.slug}`,
      searchExtra: s.estrellasIconicas.join(" "),
    });
  }

  // Balones
  for (const b of getAllBalones()) {
    items.push({
      type: "balon",
      title: `${b.nombre} (${b.anio})`,
      subtitle: `${b.fabricante} · ${b.paneles} paneles · ${b.color}`,
      href: `/historia/${b.edicionSlug}`,
      searchExtra: b.datoClave,
    });
  }

  // Mascotas
  for (const m of getAllMascotas()) {
    items.push({
      type: "mascota",
      title: `${m.nombre} (${m.anio})`,
      subtitle: `${m.tipo} · diseño: ${m.diseñador}`,
      href: `/historia/${m.edicionSlug}`,
      searchExtra: m.datoClave,
    });
  }

  // Estadios
  for (const s of getAllEstadios()) {
    items.push({
      type: "estadio",
      title: s.nombre,
      subtitle: `${s.ciudad}, ${s.pais} · capacidad ${s.capacidad.toLocaleString("es-ES")}`,
      href: `/historia/estadios`,
      searchExtra: `${s.datoClave} ${s.momentoEpico}`,
    });
  }

  // Árbitros
  for (const a of getAllArbitros()) {
    items.push({
      type: "arbitro",
      title: a.nombre,
      subtitle: `${a.pais} · ${a.subtitulo}`,
      href: `/historia/arbitros`,
      searchExtra: a.datoClave,
    });
  }

  // Polémicas
  for (const p of getAllPolemicas()) {
    items.push({
      type: "polemica",
      title: p.titulo,
      subtitle: `${p.anio} · ${p.partido}`,
      href: `/historia/polemicas`,
      searchExtra: `${p.subtitulo} ${p.descripcion}`,
    });
  }

  // Goles legendarios
  for (const g of getAllGolesLegendarios()) {
    if (!g.anio || !g.edicionSlug) continue;
    items.push({
      type: "gol",
      title: `${g.jugador} (${g.anio})`,
      subtitle: `${g.fase} vs ${g.rival.pais} · ${g.subtitulo}`,
      href: `/historia/${g.edicionSlug}`,
      searchExtra: g.descripcion,
    });
  }

  // Trofeos
  for (const t of getAllTrofeos()) {
    items.push({
      type: "trofeo",
      title: t.nombre,
      subtitle: `${t.vigencia} · ${t.subtitulo}`,
      href: `/historia/trofeos`,
      searchExtra: t.descripcion,
    });
  }

  // Premios por edición
  const premios = getPremios();
  for (const e of premios.premiosPorEdicion) {
    if (e.balonOro) {
      items.push({
        type: "premio",
        title: `Balón de Oro ${e.anio}: ${e.balonOro}`,
        subtitle: e.datoClave.slice(0, 100),
        href: `/historia/${e.edicionSlug}`,
      });
    }
    if (e.botaOro) {
      items.push({
        type: "premio",
        title: `Bota de Oro ${e.anio}: ${e.botaOro}`,
        subtitle: e.datoClave.slice(0, 100),
        href: `/historia/${e.edicionSlug}`,
      });
    }
  }

  // Eras
  for (const era of getAllEras()) {
    items.push({
      type: "era",
      title: era.nombre,
      subtitle: `${era.anios} · ${era.subtitulo}`,
      href: `/historia/eras`,
      searchExtra: era.descripcion,
    });
  }

  // Curiosidades (top 30 más representativas; el catálogo completo está en /curiosidades)
  const curiosidades = getAllCuriosidades().slice(0, 30);
  for (const c of curiosidades) {
    items.push({
      type: "curiosidad",
      title: c.texto.slice(0, 80) + (c.texto.length > 80 ? "…" : ""),
      subtitle: `${c.edicionAnio} · ${c.edicionNombre} · ${c.categoria}`,
      href: `/historia/${c.edicionSlug}`,
      searchExtra: c.texto,
    });
  }

  // Entrenadores legendarios
  for (const e of getAllEntrenadores()) {
    items.push({
      type: "entrenador",
      title: e.nombre,
      subtitle: `${e.pais} · ${e.subtitulo}`,
      href: `/historia/entrenadores`,
      searchExtra: `${e.datoClave} ${e.anios}`,
    });
  }

  // Partidos legendarios
  for (const p of getAllPartidosLegendarios()) {
    items.push({
      type: "partido",
      title: p.titulo,
      subtitle: `#${p.ranking} · ${p.anio} · ${p.subtitulo}`,
      href: `/historia/${p.edicionSlug}`,
      searchExtra: `${p.estadio} ${p.datoClave}`,
    });
  }

  // Confederaciones
  for (const c of getAllConfederaciones()) {
    items.push({
      type: "confederacion",
      title: `${c.codigo} (${c.nombre})`,
      subtitle: c.subtitulo,
      href: `/historia/confederaciones`,
      searchExtra: c.biografia,
    });
  }

  // Camisetas
  for (const c of getAllCamisetas()) {
    items.push({
      type: "camiseta",
      title: c.titulo,
      subtitle: `#${c.ranking} · ${c.subtitulo}`,
      href: `/historia/${c.edicionSlug}`,
      searchExtra: c.descripcion,
    });
  }

  // Momentos
  for (const m of getAllMomentos()) {
    items.push({
      type: "momento",
      title: m.titulo,
      subtitle: `#${m.ranking} · ${m.anio} · ${m.tipo}`,
      href: `/historia/${m.edicionSlug}`,
      searchExtra: m.descripcion,
    });
  }

  // Sociopolítica
  for (const s of getAllSociopolitica()) {
    items.push({
      type: "sociopolitica",
      title: s.titulo,
      subtitle: `${s.anio} · ${s.subtitulo}`,
      href: s.edicionSlug ? `/historia/${s.edicionSlug}` : `/historia/sociopolitica`,
      searchExtra: s.descripcion,
    });
  }

  return items;
}

export default function BuscarPage() {
  const items = buildIndex();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <ol className="flex gap-2 flex-wrap">
          <li><Link href="/" className="hover:text-[#C9A84C]">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/historia" className="hover:text-[#C9A84C]">Historia</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">Buscar</li>
        </ol>
      </nav>

      <header className="mb-6 sm:mb-8">
        <div className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#C9A84C] mb-3">
          Búsqueda global
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-[1.05]">
          Buscar en toda la Historia
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Filtra por tipo, escribe lo que recuerdes, presiona <kbd className="px-1.5 py-0.5 rounded bg-[#0F1D32] border border-[#1E293B] text-[10px]">Ctrl+K</kbd> o
          <kbd className="px-1.5 py-0.5 rounded bg-[#0F1D32] border border-[#1E293B] text-[10px] ml-1">⌘K</kbd> desde cualquier lugar.
        </p>
      </header>

      <BuscadorGlobal items={items} />
      <EditorialBlock slug="buscar" />
    </>
  );
}
