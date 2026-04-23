import { Metadata } from 'next';
import MomentosIconicosClient from './MomentosIconicosClient';

export const metadata: Metadata = {
  title: 'Momentos Icónicos de los Mundiales de Fútbol',
  description: 'Revive los momentos más memorables de los Mundiales: Maracanazo, Mano de Dios, Mineirazo, España 2010, Messi campeón 2022 y muchos más.',
  keywords: [
    'momentos iconicos mundiales',
    'maracanazo',
    'mano de dios',
    'mineirazo',
    'messi campeon mundial',
    'españa campeon 2010',
    'zidane 2006',
  ],
  alternates: { canonical: '/historia/momentos-iconicos' },
  openGraph: {
    title: 'Momentos Icónicos de los Mundiales de Fútbol',
    description: 'Maracanazo, Mano de Dios, Mineirazo, España 2010, Messi campeón 2022 y más.',
    url: '/historia/momentos-iconicos',
    type: 'article',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Momentos Icónicos de los Mundiales',
    description: 'Los instantes más memorables de la historia del fútbol.',
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
};

export default function MomentosIconicosPage() {
  return <MomentosIconicosClient />;
}
