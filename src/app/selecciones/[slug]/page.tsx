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
  if (!team) return { title: 'Selección no encontrada | ZonaMundial' };
  return {
    title: `${team.nombre} — Mundial 2026 | ZonaMundial`,
    description: `Todo sobre ${team.nombre} en el Mundial 2026`,
  };
}

export default function SeleccionPage({ params }: { params: { slug: string } }) {
  const team = getExtendedSeleccion(params.slug);
  if (!team) notFound();

  const companeros = getSeleccionesByGrupo(team.grupo).filter(t => t.slug !== team.slug);

  return <SeleccionClient team={team} companeros={companeros} />;
}
