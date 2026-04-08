// src/app/historia/page.tsx
import { Metadata } from 'next';
import HistoriaClient from './HistoriaClient';

export const metadata: Metadata = {
  title: 'Historia de los Mundiales de Fútbol (1930-2026) | ZonaMundial',
  description: 'Revive la historia del torneo más importante del fútbol mundial. Desde Uruguay 1930 hasta Qatar 2022, con todos los campeones, momentos icónicos y récords.',
  keywords: ['historia mundiales futbol', 'mundiales de futbol historia', 'campeones mundiales', 'copa del mundo historia'],
  robots: { index: true, follow: true },
};

export default function HistoriaPage() {
  return <HistoriaClient />;
}
