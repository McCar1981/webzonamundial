// src/app/historia/campeones/page.tsx
import { Metadata } from 'next';
import CampeonesClient from './CampeonesClient';

export const metadata: Metadata = {
  title: 'Todos los Campeones del Mundo de Fútbol (1930–2022) — Historia Completa | ZonaMundial',
  description: 'Historia completa de todos los campeones mundiales de fútbol desde Uruguay 1930 hasta Argentina 2022. Campeonas, subcampeonas, sedes, goleadores y datos clave.',
  keywords: ['campeones mundiales futbol', 'historia mundiales', 'ganadores copa del mundo', 'todos los campeones mundial', 'palmarés mundiales'],
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
};

export default function CampeonesPage() {
  return <CampeonesClient />;
}
