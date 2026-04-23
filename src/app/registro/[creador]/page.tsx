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
  if (!c) {
    return {
      title: 'Creador no encontrado',
      robots: { index: false, follow: false },
    };
  }
  const title = `Juega el Mundial 2026 con ${c.nombre} — ZonaMundial`;
  const description = `${c.nombre} te invita a unirte a ZonaMundial. Predicciones, Fantasy, Streaming y más durante el Mundial 2026. Regístrate gratis y compite con su comunidad.`;
  return {
    title,
    description,
    keywords: [
      `${c.nombre.toLowerCase()} zonamundial`,
      `${c.nombre.toLowerCase()} mundial 2026`,
      `${c.nombre.toLowerCase()} fantasy`,
      `${c.nombre.toLowerCase()} predicciones`,
      'predicciones mundial gratis',
    ],
    alternates: { canonical: `/registro/${c.slug}` },
    openGraph: {
      title,
      description: `${c.seguidores} fans ya siguen a ${c.nombre}. Únete y compite durante el Mundial 2026.`,
      url: `/registro/${c.slug}`,
      type: 'profile',
      images: ['/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export default function CreadorRegistroPage({ params }: { params: { creador: string } }) {
  const c = getCreadorBySlug(params.creador);
  if (!c) notFound();

  const otrosCreadores = getCreadoresActivos().filter(cr => cr.slug !== c.slug).slice(0, 3);

  return <RegistroCreadorClient c={c} otrosCreadores={otrosCreadores} />;
}
