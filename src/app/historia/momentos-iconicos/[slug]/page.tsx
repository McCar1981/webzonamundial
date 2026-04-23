import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MomentoSlugClient from './MomentoSlugClient';
import { MOMENTS_ES, getAllMomentSlugs } from '@/data/momentos-iconicos';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllMomentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const moment = MOMENTS_ES.find((m) => m.id === slug);
  if (!moment) {
    return {
      title: 'Momento no encontrado',
      robots: { index: false, follow: false },
    };
  }

  const title = `${moment.title} (${moment.year}): el momento icónico del Mundial`;
  return {
    title,
    description: moment.description,
    keywords: [
      moment.title.toLowerCase(),
      moment.country.toLowerCase(),
      `mundial ${moment.year}`,
      'momento iconico mundial',
      'historia fútbol',
    ],
    alternates: { canonical: `/historia/momentos-iconicos/${slug}` },
    openGraph: {
      title,
      description: moment.description,
      url: `/historia/momentos-iconicos/${slug}`,
      type: 'article',
      images: ['/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: moment.description,
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export default async function MomentoSlugPage({ params }: Props) {
  const { slug } = await params;
  const exists = MOMENTS_ES.some((m) => m.id === slug);
  if (!exists) notFound();

  return <MomentoSlugClient slug={slug} />;
}
