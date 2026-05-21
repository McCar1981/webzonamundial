import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Formato del Torneo 2026: 48 Equipos, 12 Grupos, 104 Partidos Explicados | ZonaMundial',
  description: 'Cómo funciona el nuevo formato de 48 equipos del torneo 2026: 12 grupos de 4, mejores terceros, dieciseisavos de final, y el camino a la final. Todo explicado paso a paso.',
  keywords: ['formato mundial 2026', '48 equipos mundial 2026', 'mejores terceros mundial', 'dieciseisavos de final mundial', 'cómo funciona mundial 2026', 'nuevo formato copa del mundo'],
  // ~1.238 palabras pero contenido casi idéntico al de /formato (duplicate
  // content). Marcamos noindex para evitar penalización por duplicate.
  robots: { index: false, follow: true, 'max-image-preview': 'large' },
};

export default function Formato2026Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
