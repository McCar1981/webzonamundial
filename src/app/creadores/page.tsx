// src/app/creadores/page.tsx
// ZonaMundial.app — Roster público de creadores

import { Metadata } from 'next';
import { getCreadoresActivos, getTotalSeguidores } from '@/data/creadores';
import CreadoresClient from './CreadoresClient';

export const metadata: Metadata = {
  title: 'Nuestros Creadores — El Equipo de ZonaMundial 2026',
  description: `${getTotalSeguidores()} seguidores combinados. Conoce a los creadores de contenido que lideran ZonaMundial durante el torneo de selecciones 2026.`,
  keywords: ['creadores zonamundial', 'influencers mundial 2026', 'creadores contenido futbol'],
  robots: { index: true, follow: true },
};

export default function CreadoresPage() {
  const creadores = getCreadoresActivos();
  const total = getTotalSeguidores();

  return <CreadoresClient creadores={creadores} total={total} />;
}
