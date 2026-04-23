// src/app/historia/campeones/page.tsx
import { Metadata } from 'next';
import CampeonesClient from './CampeonesClient';

export const metadata: Metadata = {
  title: 'Todos los Campeones del Mundial (1930–2022): historia completa',
  description: 'Historia completa de todos los campeones mundiales de fútbol desde Uruguay 1930 hasta Argentina 2022. Subcampeones, sedes, goleadores y datos clave de cada Mundial.',
  keywords: [
    'campeones mundiales futbol',
    'historia mundiales',
    'ganadores copa del mundo',
    'todos los campeones mundial',
    'palmarés mundiales',
  ],
  alternates: { canonical: '/historia/campeones' },
  openGraph: {
    title: 'Todos los Campeones del Mundial (1930–2022)',
    description: 'Historia completa: campeones, subcampeones, sedes y goleadores de cada Mundial.',
    url: '/historia/campeones',
    type: 'article',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Todos los Campeones del Mundial',
    description: 'Historia completa desde Uruguay 1930 hasta Argentina 2022.',
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
};

export default function CampeonesPage() {
  return <CampeonesClient />;
}
