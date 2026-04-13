// src/components/FlagImage.tsx
// Muestra banderas usando country-flag-icons (SVG local, sin CDN)

"use client";

import type { CSSProperties, ReactNode } from 'react';
import Flags from 'country-flag-icons/react/3x2';

interface FlagImageProps {
  code: string;
  alt: string;
  width?: number;
  className?: string;
  fallback?: string | ReactNode;
}

const CODE_OVERRIDES: Record<string, string> = {
  'gb-eng': 'GB',
  'gb-sct': 'GB',
  'gb-wls': 'GB',
  'uk': 'GB',
};

export default function FlagImage({
  code,
  alt,
  width = 80,
  className = "",
  fallback,
}: FlagImageProps) {
  const upperCode = code.toUpperCase();
  const resolvedCode = CODE_OVERRIDES[code.toLowerCase()] || upperCode;
  const FlagComponent = (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[resolvedCode];

  const displayFallback = fallback || upperCode;
  const hasExplicitSize =
    /\b(w-\d+|h-\d+|w-px|h-px|w-full|h-full|w-auto|h-auto|w-screen|h-screen|w-fit|h-fit)\b/.test(
      className
    );

  const height = Math.round(width * 0.67);
  const wrapperStyle: CSSProperties = hasExplicitSize
    ? {}
    : { width, height };

  if (!FlagComponent) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden ${className}`}
        style={wrapperStyle}
        title={alt}
      >
        {typeof displayFallback === 'string' ? (
          <span
            className="flex items-center justify-center leading-none select-none text-[#c9a84c]"
            style={{ fontSize: width * 0.5 }}
          >
            {displayFallback}
          </span>
        ) : (
          <span className="flex items-center justify-center leading-none select-none">
            {displayFallback}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      style={wrapperStyle}
      title={alt}
    >
      <FlagComponent title={alt} className="h-full w-full object-cover" />
    </span>
  );
}
