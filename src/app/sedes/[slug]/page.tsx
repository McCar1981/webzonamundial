// src/app/sedes/[slug]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSedeBySlug, getAllSedeSlugs } from '@/data/sedes';
import SedeSlugClient from './SedeSlugClient';

export async function generateStaticParams() {
  return getAllSedeSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const sede = getSedeBySlug(params.slug);
  if (!sede) return { title: 'Sede no encontrada | ZonaMundial' };
  return {
    title: sede.seoTitle,
    description: sede.seoDescription,
    keywords: sede.seoKeywords,
    openGraph: {
      title: sede.seoTitle,
      description: sede.seoDescription,
      url: `https://zonamundial.app/sedes/${sede.slug}`,
      siteName: 'ZonaMundial',
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export default function SedePage({ params }: { params: { slug: string } }) {
  const sede = getSedeBySlug(params.slug);
  if (!sede) notFound();

  return <SedeSlugClient sede={sede} />;
}
