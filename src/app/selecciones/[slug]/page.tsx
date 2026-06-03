// src/app/selecciones/[slug]/page.tsx
// ZonaMundial.app — Página de selección
//
// Routing dual: si existe data/teams/{slug}.json (BIBLIA Mundial 2026)
// se renderiza con el nuevo sistema (TeamPageBiblia, datos ricos).
// Si no, fallback al sistema viejo (selecciones-extended) para que las
// 47 selecciones sin JSON BIBLIA sigan funcionando.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeleccionesByGrupo, getAllSlugs } from '@/data/selecciones';
import { getExtendedSeleccion } from '@/data/selecciones-extended';
import { loadTeam } from '@/lib/biblia';
import SeleccionClient from './SeleccionClient';
import TeamPageBiblia from './TeamPageBiblia';

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Plantilla SEO consistente para TODAS las selecciones. El nombre del país
  // sale de la BIBLIA (name_es) o, en su defecto, del sistema extendido.
  const biblia = await loadTeam(params.slug);
  const team = getExtendedSeleccion(params.slug);
  const pais = biblia?.name_es ?? team?.nombre;

  if (!pais) {
    return {
      title: 'Selección no encontrada',
      robots: { index: false, follow: false },
    };
  }

  const title = `${pais}: plantilla y calendario del Mundial 2026`;
  const description = `Plantilla de ${pais} para el Mundial 2026, calendario de partidos, grupo y análisis. Sigue a ${pais} en ZonaMundial.`;
  const ogImage = biblia?.seo?.og_image_url || '/og-image.jpg';

  return {
    // `absolute` evita que la plantilla de marca duplique el sufijo.
    title: { absolute: title },
    description,
    alternates: { canonical: `/selecciones/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `/selecciones/${params.slug}`,
      type: 'article',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SeleccionPage({ params }: { params: { slug: string } }) {
  // Si hay JSON BIBLIA, renderiza con el nuevo sistema
  const biblia = await loadTeam(params.slug);
  if (biblia) {
    return <TeamPageBiblia team={biblia} />;
  }

  // Fallback al sistema viejo
  const team = getExtendedSeleccion(params.slug);
  if (!team) notFound();

  const companeros = getSeleccionesByGrupo(team.grupo).filter(t => t.slug !== team.slug);

  return <SeleccionClient team={team} companeros={companeros} />;
}
