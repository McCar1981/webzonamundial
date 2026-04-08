// src/components/FeatureIcon.tsx
// Componente para mostrar iconos de características como imágenes

import React from 'react';

interface FeatureIconProps {
  title: string;
  size?: number;
  className?: string;
}

// Mapeo de títulos a archivos de imagen
const ICON_MAP: Record<string, string> = {
  // Módulos de la landing page
  'Match Center': 'match center.png',
  'Predicciones': 'predicciones.png',
  'Fantasy': 'fantasy.png',
  'IA Coach': 'ia coach.png',
  'Zona Streaming': 'streaming.png',
  'Trivia Diaria': 'trivia.png',
  'Modo Carrera': 'modo carrera.png',
  'Ligas Privadas': 'ligas privadas.png',
  'Rankings': 'ranking.png',
  'Chat en Vivo': 'chat en vivo.png',
  'Micro-predicciones': 'micro-predicciones.png',
  'Stories': 'stories.png',
  
  // Features del registro (tienen nombres ligeramente diferentes)
  'Chat': 'chat en vivo.png',
  'Logros': 'ligas privadas.png',
  'Streaming': 'streaming.png',
  'Trivia': 'trivia.png',
  
  // Otras páginas
  '48 Selecciones': '48 selecciones.png',
  'Creadores': 'creadores.png',
  'Formato 2026': 'formato 2026.png',
  'Historia': 'historia.png',
  'Los 12 Grupos': 'los 12 grupos.png',
  'Únete Ahora': 'unete ahora.png',
  
  // Premium features
  'IA Coach Pro': 'ia coach.png',
  'Estadísticas Avanzadas': 'ranking.png',
  'Predicciones Ilimitadas': 'predicciones.png',
  'Badge y Perfil Premium': 'fantasy.png',
  'Ligas Premium Exclusivas': 'ligas privadas.png',
  'Soporte Prioritario': 'chat en vivo.png',
  
  // Features para headers de sección (usando imágenes temáticas)
  'Todo lo que necesitas': 'fantasy.png',
  'Explora la Plataforma': 'predicciones.png',
  'Con tus creadores favoritos': 'creadores.png',
  'Descubre ZonaMundial': 'match center.png',
};

const BASE_PATH = '/img/zonamundial-images/imagenes/logos para sustuir emojis/';

export function FeatureIcon({ title, size = 56, className = '' }: FeatureIconProps) {
  const imageFile = ICON_MAP[title];
  
  if (!imageFile) {
    // Si no hay mapeo, no mostrar nada
    return null;
  }
  
  return (
    <img
      src={`${BASE_PATH}${imageFile}`}
      alt={title}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ 
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }}
    />
  );
}

// Función auxiliar para obtener el path de la imagen
export function getFeatureIconPath(title: string): string | null {
  const imageFile = ICON_MAP[title];
  if (!imageFile) return null;
  return `${BASE_PATH}${imageFile}`;
}

export default FeatureIcon;
