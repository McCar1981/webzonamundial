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
  // Prefer SEO BIBLIA si está disponible
  const biblia = await loadTeam(params.slug);
  if (biblia?.seo) {
    return {
      title: biblia.seo.meta_title,
      description: biblia.seo.meta_description,
      alternates: { canonical: `/selecciones/${params.slug}` },
      openGraph: {
        title: biblia.seo.meta_title,
        description: biblia.seo.meta_description,
        url: `/selecciones/${params.slug}`,
        type: 'article',
        images: biblia.seo.og_image_url ? [biblia.seo.og_image_url] : ['/og-image.jpg'],
      },
      twitter: {
        card: 'summary_large_image',
        title: biblia.seo.meta_title,
        description: biblia.seo.meta_description,
      },
    };
  }

  // Fallback al sistema viejo
  const team = getExtendedSeleccion(params.slug);
  if (!team) {
    return {
      title: 'Selección no encontrada',
      robots: { index: false, follow: false },
    };
  }
  const title = `${team.nombre} en el Mundial 2026: plantilla, historia y predicciones`;
  const description = `Todo sobre ${team.nombre} en el Mundial 2026: plantilla, calendario de partidos, historia, estadísticas y predicciones. Grupo ${team.grupo}.`;
  return {
    title,
    description,
    keywords: [
      `${team.nombre} mundial 2026`,
      `selección ${team.nombre}`,
      `${team.nombre} plantilla`,
      `${team.nombre} partidos mundial`,
      'mundial 2026 selecciones',
    ],
    alternates: { canonical: `/selecciones/${params.slug}` },
    openGraph: {
      title: `${team.nombre} en el Mundial 2026`,
      description,
      url: `/selecciones/${params.slug}`,
      type: 'article',
      images: ['/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${team.nombre} en el Mundial 2026`,
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
