// src/components/FeatureIcon.tsx
// Componente para mostrar iconos de características como SVG

import React from 'react';
import { IMAGE_TO_ICON } from '@/components/icons';

interface FeatureIconProps {
  title: string;
  size?: number;
  className?: string;
}

// Mapeo de títulos a claves de IMAGE_TO_ICON
const TITLE_TO_KEY: Record<string, string> = {
  'Match Center': 'match center',
  'Predicciones': 'predicciones',
  'Fantasy': 'fantasy',
  'IA Coach': 'ia coach',
  'Zona Streaming': 'streaming',
  'Trivia Diaria': 'trivia',
  'Modo Carrera': 'modo carrera',
  'Ligas Privadas': 'ligas privadas',
  'Rankings': 'ranking',
  'Chat en Vivo': 'chat en vivo',
  'Micro-predicciones': 'micro-predicciones',
  'Stories': 'stories',
  'Chat': 'chat en vivo',
  'Logros': 'ligas privadas',
  'Streaming': 'streaming',
  'Trivia': 'trivia',
  '48 Selecciones': '48 selecciones',
  'Creadores': 'creadores',
  'Formato 2026': 'formato 2026',
  'Historia': 'historia',
  'Los 12 Grupos': 'los 12 grupos',
  'Únete Ahora': 'unete ahora',
  'IA Coach Pro': 'ia coach',
  'Estadísticas Avanzadas': 'ranking',
  'Predicciones Ilimitadas': 'predicciones',
  'Badge y Perfil Premium': 'fantasy',
  'Ligas Premium Exclusivas': 'ligas privadas',
  'Soporte Prioritario': 'chat en vivo',
  'Exportar Datos': 'ranking',
  'Acceso Anticipado': 'micro-predicciones',
  'Todo lo que necesitas': 'fantasy',
  'Explora la Plataforma': 'predicciones',
  'Con tus creadores favoritos': 'creadores',
  'Descubre ZonaMundial': 'match center',
};

export function FeatureIcon({ title, size = 56, className = '' }: FeatureIconProps) {
  const key = TITLE_TO_KEY[title];
  if (!key) return null;
  const icon = IMAGE_TO_ICON[key];
  if (!icon) return null;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 [&_svg]:w-full [&_svg]:h-full ${className}`}
      style={{
        width: size,
        height: size,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }}
    >
      {icon}
    </span>
  );
}

// Función auxiliar para obtener el icono por título (retorna ReactNode)
export function getFeatureIcon(title: string): React.ReactNode | null {
  const key = TITLE_TO_KEY[title];
  if (!key) return null;
  return IMAGE_TO_ICON[key] || null;
}

export default FeatureIcon;
