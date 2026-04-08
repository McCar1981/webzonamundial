// src/app/grupos/[slug]/page.tsx
// ZonaMundial.app — Página individual de grupo con simulador (Diseño moderno)

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeleccionesByGrupo } from '@/data/selecciones';
import GrupoSlugClient from './GrupoSlugClient';

const VALID_GROUPS = ['a','b','c','d','e','f','g','h','i','j','k','l'];

const GROUP_META: Record<string, { title: string; desc: string; subtitle: string }> = {
  a: { title: 'Grupo A', desc: 'México debuta como anfitrión en el Azteca. Corea del Sur con Son Heung-min. Sudáfrica busca sorprender. Rep. Checa completa el grupo.', subtitle: 'Anfitrión: México' },
  b: { title: 'Grupo B', desc: 'Canadá debuta como anfitrión. Suiza siempre organizada. Qatar, incómodo rival asiático. Bosnia cierra el grupo.', subtitle: 'Anfitrión: Canadá' },
  c: { title: 'Grupo C', desc: 'Brasil, el máximo ganador con 5 títulos. Marruecos, semifinalista de Qatar 2022. Escocia y Haití completan.', subtitle: '5 Títulos Mundiales' },
  d: { title: 'Grupo D', desc: 'EE.UU. demuestra en casa. Australia, veterano asiático. Paraguay pelea y Turquía completa el grupo.', subtitle: 'Anfitrión: EE.UU.' },
  e: { title: 'Grupo E', desc: 'Alemania, campeón mundial 4 veces. Costa de Marfil y Ecuador pueden complicar. Curazao debuta histórico.', subtitle: '4 Títulos: Alemania' },
  f: { title: 'Grupo F', desc: 'Países Bajos vs Japón, choque de estilos. Túnez y Suecia completan un grupo muy parejo.', subtitle: 'Choque de estilos' },
  g: { title: 'Grupo G', desc: 'De Bruyne vs Salah, duelo de super estrellas. Irán siempre difícil. Nueva Zelanda de Oceanía.', subtitle: 'Estrellas del fútbol' },
  h: { title: 'Grupo H', desc: 'España vs Uruguay, duelo de campeones mundiales. Arabia Saudita y Cabo Verde completan.', subtitle: 'Duelo de campeones' },
  i: { title: 'Grupo I', desc: 'Francia, bicampeona mundial. Senegal busca revancha de 2002. Haaland vs Mbappé con Noruega. Irak completa el grupo.', subtitle: 'Bicampeón mundial' },
  j: { title: 'Grupo J', desc: 'Argentina, campeón vigente con Messi. Austria de Rangnick, Argelia y Jordania debutante.', subtitle: 'Campeón vigente' },
  k: { title: 'Grupo K', desc: 'Cristiano Ronaldo con Portugal vs Colombia. Uzbekistán debuta en la historia del Mundial. RD Congo cierra el grupo.', subtitle: 'Último Mundial de CR7' },
  l: { title: 'Grupo L', desc: 'Inglaterra vs Croacia, revancha de la semifinal 2018. Ghana y Panamá, outsiders peligrosos.', subtitle: 'Revancha 2018' },
};

export async function generateStaticParams() {
  return VALID_GROUPS.map(g => ({ slug: `grupo-${g}` }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const letter = params.slug.replace('grupo-', '').toUpperCase();
  const meta = GROUP_META[letter.toLowerCase()];
  if (!meta) return { title: 'Grupo no encontrado | ZonaMundial' };
  return {
    title: `${meta.title} — Mundial 2026 | ZonaMundial`,
    description: meta.desc,
    keywords: [`grupo ${letter.toLowerCase()} mundial 2026`, `mundial 2026 grupo ${letter.toLowerCase()}`, meta.subtitle.toLowerCase()],
    openGraph: {
      title: `${meta.title} — Mundial 2026 | ZonaMundial`,
      description: meta.desc,
      url: `https://zonamundial.app/grupos/grupo-${letter.toLowerCase()}`,
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
  };
}

export default function GrupoPage({ params }: { params: { slug: string } }) {
  const letter = params.slug.replace('grupo-', '').toUpperCase();
  if (!VALID_GROUPS.includes(letter.toLowerCase())) notFound();

  const selecciones = getSeleccionesByGrupo(letter);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zonamundial.app' },
          { '@type': 'ListItem', position: 2, name: 'Grupos', item: 'https://zonamundial.app/grupos' },
          { '@type': 'ListItem', position: 3, name: `Grupo ${letter}`, item: `https://zonamundial.app/grupos/grupo-${letter.toLowerCase()}` },
        ],
      })}} />
      <GrupoSlugClient letter={letter} selecciones={selecciones} />
    </>
  );
}
