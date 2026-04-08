// src/components/FlagImage.tsx
// Componente para mostrar banderas usando next/image

"use client";

import Image from 'next/image';

interface FlagImageProps {
  code: string;
  alt: string;
  width?: number;
  className?: string;
}

export default function FlagImage({ code, alt, width = 80, className = "" }: FlagImageProps) {
  const height = Math.round(width * 0.67);
  
  return (
    <Image
      src={`https://flagcdn.com/w${width}/${code}.png`}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}
