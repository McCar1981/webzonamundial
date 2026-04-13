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
  if (!moment) return { title: 'Momento no encontrado | ZonaMundial' };

  return {
    title: `${moment.title} | Momentos Icónicos | ZonaMundial`,
    description: moment.description,
    keywords: [moment.title, moment.country, 'mundial', 'momento iconico', `${moment.year}`],
    robots: { index: true, follow: true },
  };
}

export default async function MomentoSlugPage({ params }: Props) {
  const { slug } = await params;
  const exists = MOMENTS_ES.some((m) => m.id === slug);
  if (!exists) notFound();

  return <MomentoSlugClient slug={slug} />;
}
