// src/data/creadores.ts
// Datos de los creadores de ZonaMundial

export interface RedSocial {
  plataforma: 'youtube' | 'twitch' | 'tiktok' | 'instagram' | 'twitter' | 'threads';
  url: string;
  usuario: string;
}

export interface Creador {
  slug: string;
  nombre: string;
  seguidores: string;
  seguidoresNum: number;
  colorPrimario: string;
  colorSecundario: string;
  emoji: string;
  plataformaPrincipal: string;
  bio: string;
  contenido: string;
  paisFlag: string;
  pais: string;
  imagen: string;
  handle: string;
  redes: RedSocial[];
}

// Importar imágenes desde el archivo de imágenes
import { CREADORES_IMGS } from './creadores-images';

export const CREADORES: Creador[] = [
  {
    slug: 'svgiago',
    nombre: 'SVGiago',
    seguidores: '2.5M',
    seguidoresNum: 2500000,
    colorPrimario: '#00D4FF',
    colorSecundario: '#0099CC',
    emoji: '',
    plataformaPrincipal: 'Twitch',
    bio: 'Streamer especializado en fútbol y gaming. Compite en ZonaMundial con su comunidad de fieles seguidores.',
    contenido: 'Streams en vivo, reacciones y gameplay',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.svgiago,
    handle: '@svgiago',
    redes: [
      { plataforma: 'twitch', url: 'https://twitch.tv/svgiago', usuario: 'svgiago' },
      { plataforma: 'youtube', url: 'https://youtube.com/@svgiago', usuario: '@svgiago' },
      { plataforma: 'twitter', url: 'https://x.com/svgiago', usuario: '@svgiago' },
    ],
  },
  {
    slug: 'josecobo',
    nombre: 'José Cobo',
    seguidores: '4.7M',
    seguidoresNum: 4700000,
    colorPrimario: '#C9A84C',
    colorSecundario: '#E8D48B',
    emoji: '',
    plataformaPrincipal: 'YouTube',
    bio: 'Comentarista deportivo especializado en fútbol internacional. Análisis táctico y predicciones del Mundial.',
    contenido: 'Análisis táctico, directos y contenido premium',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.josecobo,
    handle: '@josecobo',
    redes: [
      { plataforma: 'youtube', url: 'https://youtube.com/@josecobo', usuario: '@josecobo' },
      { plataforma: 'instagram', url: 'https://instagram.com/josecobo', usuario: '@josecobo' },
      { plataforma: 'twitter', url: 'https://x.com/josecobo', usuario: '@josecobo' },
    ],
  },
  {
    slug: 'elopi23',
    nombre: 'Elopi23',
    seguidores: '300K',
    seguidoresNum: 300000,
    colorPrimario: '#38BDF8',
    colorSecundario: '#7DD3FC',
    emoji: '',
    plataformaPrincipal: 'Twitch',
    bio: 'Creador de contenido especializado en fichajes y mercado de futbolistas sudamericanos.',
    contenido: 'Fichajes, rumores y análisis de mercado',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.elopi23,
    handle: '@elopi23',
    redes: [
      { plataforma: 'twitch', url: 'https://twitch.tv/elopi23', usuario: 'elopi23' },
      { plataforma: 'youtube', url: 'https://youtube.com/@elopi23', usuario: '@elopi23' },
      { plataforma: 'twitter', url: 'https://x.com/elopi23', usuario: '@elopi23' },
      { plataforma: 'instagram', url: 'https://instagram.com/elopi23', usuario: '@elopi23' },
    ],
  },
  {
    slug: 'niku',
    nombre: 'Niku',
    seguidores: '—',
    seguidoresNum: 0,
    colorPrimario: '#F43F5E',
    colorSecundario: '#FB7185',
    emoji: '',
    plataformaPrincipal: 'Instagram',
    bio: 'Creador de contenido de fútbol en Instagram y TikTok.',
    contenido: 'Contenido viral, reacciones y fútbol',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.niku,
    handle: '@niku2310',
    redes: [
      { plataforma: 'instagram', url: 'https://www.instagram.com/niku2310/', usuario: '@niku2310' },
      { plataforma: 'tiktok', url: 'https://www.tiktok.com/@niku.2310', usuario: '@niku.2310' },
    ],
  },
  {
    slug: 'nereita',
    nombre: 'Nereita',
    seguidores: '500K',
    seguidoresNum: 500000,
    colorPrimario: '#E879F9',
    colorSecundario: '#F0ABFC',
    emoji: '',
    plataformaPrincipal: 'Instagram',
    bio: 'Influencer de fútbol femenino y lifestyle. Conecta el deporte con su estilo de vida único.',
    contenido: 'Lifestyle, fútbol femenino y entrevistas',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.nereita,
    handle: '@nereita',
    redes: [
      { plataforma: 'instagram', url: 'https://instagram.com/nereita', usuario: '@nereita' },
      { plataforma: 'tiktok', url: 'https://tiktok.com/@nereita', usuario: '@nereita' },
      { plataforma: 'youtube', url: 'https://youtube.com/@nereita', usuario: '@nereita' },
    ],
  },
];

export function getCreadoresActivos(): Creador[] {
  return CREADORES;
}

export function getTotalSeguidores(): string {
  const total = CREADORES.reduce((sum, c) => sum + c.seguidoresNum, 0);
  if (total >= 1000000) {
    return `${(total / 1000000).toFixed(1)}M`;
  }
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)}K`;
  }
  return total.toString();
}

export function getCreadorBySlug(slug: string): Creador | undefined {
  return CREADORES.find(c => c.slug === slug);
}

export function getAllCreadorSlugs(): string[] {
  return CREADORES.map(c => c.slug);
}
