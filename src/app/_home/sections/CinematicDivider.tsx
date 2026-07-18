"use client";

import { ParallaxImage } from "@/components/ParallaxImage";

interface CinematicDividerProps {
  src: string;
  /** Opcional: WebP source (reduce ~35% peso en navegadores modernos). */
  srcWebp?: string;
  alt?: string;
  height?: string;
  overlay?: string;
}

export function CinematicDivider({
  src,
  srcWebp,
  alt = "",
  height = "h-[300px] sm:h-[400px]",
  overlay = "from-[#000000] via-transparent to-[#000000]",
}: CinematicDividerProps) {
  return (
    <div className={`relative ${height} overflow-hidden`}>
      <ParallaxImage
        src={src}
        srcWebp={srcWebp}
        alt={alt}
        className="absolute inset-0 w-full h-full"
        speed={0.4}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
      <div className="absolute inset-0 bg-[#000000]/30" />
    </div>
  );
}
