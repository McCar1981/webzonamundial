// src/app/selecciones/[slug]/page.tsx
// ZonaMundial.app — Página de selección (Diseño 2025)

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeleccionesByGrupo, getAllSlugs } from '@/data/selecciones';
import { getExtendedSeleccion } from '@/data/selecciones-extended';
import SeleccionClient from './SeleccionClient';

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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

export default function SeleccionPage({ params }: { params: { slug: string } }) {
  const team = getExtendedSeleccion(params.slug);
  if (!team) notFound();

  const companeros = getSeleccionesByGrupo(team.grupo).filter(t => t.slug !== team.slug);

  return <SeleccionClient team={team} companeros={companeros} />;
}
