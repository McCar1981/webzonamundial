// src/data/creadores.ts
// Datos de los creadores de ZonaMundial

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
}

// Importar imágenes desde el archivo de imágenes
import { CREADORES_IMGS } from './creadores-images';

export const CREADORES: Creador[] = [
  {
    slug: 'josecobo',
    nombre: 'José Cobo',
    seguidores: '4.7M',
    seguidoresNum: 4700000,
    colorPrimario: '#C9A84C',
    colorSecundario: '#E8D48B',
    emoji: '⚽',
    plataformaPrincipal: 'YouTube',
    bio: 'Comentarista deportivo especializado en fútbol internacional. Análisis táctico y predicciones del Mundial.',
    contenido: 'Análisis táctico, directos y contenido premium',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.josecobo,
    handle: '@josecobo',
  },
  {
    slug: 'svgiago',
    nombre: 'SVGiago',
    seguidores: '2.5M',
    seguidoresNum: 2500000,
    colorPrimario: '#00D4FF',
    colorSecundario: '#0099CC',
    emoji: '🎮',
    plataformaPrincipal: 'Twitch',
    bio: 'Streamer especializado en fútbol y gaming. Compite en ZonaMundial con su comunidad de fieles seguidores.',
    contenido: 'Streams en vivo, reacciones y gameplay',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.svgiago,
    handle: '@svgiago',
  },
  {
    slug: 'pimpeano',
    nombre: 'Pimpeano',
    seguidores: '2.3M',
    seguidoresNum: 2300000,
    colorPrimario: '#FF6B35',
    colorSecundario: '#FF8F5A',
    emoji: '🔥',
    plataformaPrincipal: 'TikTok',
    bio: 'Creador de contenido viral sobre fútbol. Sus predicciones son leyenda entre sus seguidores.',
    contenido: 'Videos virales, memes y reacciones',
    paisFlag: 'ar',
    pais: 'Argentina',
    imagen: CREADORES_IMGS.pimpeano,
    handle: '@pimpeano',
  },
  {
    slug: 'nachocp',
    nombre: 'Nacho CP',
    seguidores: '1.6M',
    seguidoresNum: 1600000,
    colorPrimario: '#22C55E',
    colorSecundario: '#4ADE80',
    emoji: '📊',
    plataformaPrincipal: 'YouTube',
    bio: 'Experto en estadísticas y datos del fútbol. Análisis profundo de cada selección del Mundial 2026.',
    contenido: 'Estadísticas, análisis de datos y scouting',
    paisFlag: 'ar',
    pais: 'Argentina / España',
    imagen: CREADORES_IMGS.nachocp,
    handle: '@nachocp',
  },
  {
    slug: 'nereita',
    nombre: 'Nereita',
    seguidores: '500K',
    seguidoresNum: 500000,
    colorPrimario: '#E879F9',
    colorSecundario: '#F0ABFC',
    emoji: '✨',
    plataformaPrincipal: 'Instagram',
    bio: 'Influencer de fútbol femenino y lifestyle. Conecta el deporte con su estilo de vida único.',
    contenido: 'Lifestyle, fútbol femenino y entrevistas',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.nereita,
    handle: '@nereita',
  },
  {
    slug: 'elopi23',
    nombre: 'Elopi23',
    seguidores: '300K',
    seguidoresNum: 300000,
    colorPrimario: '#38BDF8',
    colorSecundario: '#7DD3FC',
    emoji: '🎯',
    plataformaPrincipal: 'YouTube',
    bio: 'Creador de contenido especializado en fichajes y mercado de futbolistas sudamericanos.',
    contenido: 'Fichajes, rumores y análisis de mercado',
    paisFlag: 'es',
    pais: 'España',
    imagen: CREADORES_IMGS.elopi23,
    handle: '@elopi23',
  },
  {
    slug: 'salvador',
    nombre: 'Salvador',
    seguidores: '300K',
    seguidoresNum: 300000,
    colorPrimario: '#F97316',
    colorSecundario: '#FB923C',
    emoji: '🎙️',
    plataformaPrincipal: 'Twitch',
    bio: 'Narrador deportivo y comentarista. Transmite partidos en vivo con su estilo único y apasionado.',
    contenido: 'Narraciones en vivo y análisis post-partido',
    paisFlag: 'mx',
    pais: 'México',
    imagen: CREADORES_IMGS.salvador,
    handle: '@salvador',
  },
  {
    slug: 'franbar',
    nombre: 'Franbar',
    seguidores: '130K',
    seguidoresNum: 130000,
    colorPrimario: '#A78BFA',
    colorSecundario: '#C4B5FD',
    emoji: '🎨',
    plataformaPrincipal: 'Twitter',
    bio: 'Diseñador gráfico y amante del fútbol. Crea contenido visual espectacular sobre el deporte rey.',
    contenido: 'Diseño gráfico, infografías y datos visuales',
    paisFlag: 'ar',
    pais: 'Argentina',
    imagen: CREADORES_IMGS.franbar,
    handle: '@franbar',
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
