"use client";

import { ParallaxImage } from "@/components/ParallaxImage";

interface CinematicDividerProps {
  src: string;
  alt?: string;
  height?: string;
  overlay?: string;
}

export function CinematicDivider({
  src,
  alt = "",
  height = "h-[300px] sm:h-[400px]",
  overlay = "from-[#060B14] via-transparent to-[#060B14]",
}: CinematicDividerProps) {
  return (
    <div className={`relative ${height} overflow-hidden`}>
      <ParallaxImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full"
        speed={0.4}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
      <div className="absolute inset-0 bg-[#060B14]/30" />
    </div>
  );
}
