// src/app/formato/page.tsx

import { Metadata } from 'next';
import FormatoClient from './FormatoClient';

export const metadata: Metadata = {
  title: 'Formato del Mundial 2026: 48 Equipos, 104 Partidos | ZonaMundial',
  description: 'Todo sobre el nuevo formato del Mundial 2026: 48 equipos, 12 grupos, dieciseisavos de final, mejores terceros y 104 partidos en 3 países. Entiende cómo funciona.',
  keywords: ['formato mundial 2026', '48 equipos mundial', 'mejores terceros mundial', 'nuevo formato copa del mundo', 'mundial 2026 explicado'],
  robots: { index: true, follow: true },
};

export default function FormatoPage() {
  return <FormatoClient />;
}
