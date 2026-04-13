import { Metadata } from 'next';
import MomentosIconicosClient from './MomentosIconicosClient';

export const metadata: Metadata = {
  title: 'Momentos Icónicos de los Mundiales de Fútbol | ZonaMundial',
  description: 'Revive los momentos más memorables de la historia de los Mundiales: el Maracanazo, la Mano de Dios, el Mineirazo, Messi campeón y más.',
  keywords: ['momentos iconicos mundiales', 'maracanazo', 'mano de dios', 'mineirazo', 'messi campeon mundial'],
  robots: { index: true, follow: true },
};

export default function MomentosIconicosPage() {
  return <MomentosIconicosClient />;
}
