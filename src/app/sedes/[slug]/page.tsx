// src/app/sedes/[slug]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSedeBySlug, getAllSedeSlugs } from '@/data/sedes';
import SedeSlugClient from './SedeSlugClient';
import SedeEditorial from '@/components/sedes/SedeEditorial';

export async function generateStaticParams() {
  return getAllSedeSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const sede = getSedeBySlug(params.slug);
  if (!sede) {
    return {
      title: 'Sede no encontrada',
      robots: { index: false, follow: false },
    };
  }
  return {
    title: sede.seoTitle,
    description: sede.seoDescription,
    keywords: sede.seoKeywords,
    alternates: { canonical: `/sedes/${sede.slug}` },
    openGraph: {
      title: sede.seoTitle,
      description: sede.seoDescription,
      url: `/sedes/${sede.slug}`,
      type: 'article',
      siteName: 'ZonaMundial',
      images: ['/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: sede.seoTitle,
      description: sede.seoDescription,
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export default function SedePage({ params }: { params: { slug: string } }) {
  const sede = getSedeBySlug(params.slug);
  if (!sede) notFound();

  return (
    <>
      <SedeSlugClient sede={sede} />
      {/* Editorial al pie (~800 palabras) que aprovecha todos los campos
          ricos del JSON (historia, clima, transporte, guiaViaje,
          partidosDestacados...) y los expande con prosa contextual.
          Sube cada página de sede de ~900 → ~1.700 palabras. */}
      <SedeEditorial sede={sede} />
    </>
  );
}
