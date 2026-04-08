// src/app/registro/[creador]/page.tsx
// ZonaMundial.app — Landing personalizada por creador (white-label)

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCreadorBySlug, getAllCreadorSlugs, getCreadoresActivos } from '@/data/creadores';
import RegistroCreadorClient from './RegistroCreadorClient';

export async function generateStaticParams() {
  return getAllCreadorSlugs().map(creador => ({ creador }));
}

export async function generateMetadata({ params }: { params: { creador: string } }): Promise<Metadata> {
  const c = getCreadorBySlug(params.creador);
  if (!c) return { title: 'Creador no encontrado | ZonaMundial' };
  return {
    title: `Únete al Equipo de ${c.nombre} — ZonaMundial 2026`,
    description: `${c.nombre} te invita a unirte a ZonaMundial. Predicciones, Fantasy, Streaming y más durante el torneo de selecciones 2026. Regístrate gratis.`,
    keywords: [`${c.nombre.toLowerCase()} zonamundial`, `${c.nombre.toLowerCase()} mundial 2026`, 'predicciones mundial gratis'],
    openGraph: {
      title: `Únete al Equipo de ${c.nombre} — ZonaMundial`,
      description: `${c.seguidores} fans ya siguen a ${c.nombre}. Únete y compite durante el torneo 2026.`,
      url: `https://zonamundial.app/registro/${c.slug}`,
      images: [{ url: `https://zonamundial.app/api/og/creador?c=${c.slug}`, width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
  };
}

export default function CreadorRegistroPage({ params }: { params: { creador: string } }) {
  const c = getCreadorBySlug(params.creador);
  if (!c) notFound();

  const otrosCreadores = getCreadoresActivos().filter(cr => cr.slug !== c.slug).slice(0, 3);

  return <RegistroCreadorClient c={c} otrosCreadores={otrosCreadores} />;
}
