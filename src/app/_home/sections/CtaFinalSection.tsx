import { RefObject } from "react";
import { MagneticButton } from "../components/MagneticButton";
import { BG3 } from "../constants";
import { ParallaxImage } from "@/components/ParallaxImage";

export function CtaFinalSection({
  ctaRef,
  h,
}: {
  ctaRef: RefObject<HTMLDivElement | null>;
  h: any;
}) {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: BG3 }}>
      <div className="max-w-5xl mx-auto" ref={ctaRef}>
        <div className="relative rounded-3xl border-2 border-dashed border-[#C9A84C]/30 overflow-hidden group">
          {/* Imagen de estadio como fondo con parallax */}
          <ParallaxImage
            src="/img/imagenessilviu/Estadio Atmosphere.png"
            alt=""
            className="absolute inset-0 w-full h-full"
            speed={0.3}
          />
          {/* Overlay oscuro para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/85 to-[#060B14]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/10 via-transparent to-[#C9A84C]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-10 sm:p-16">
            {/* Balón dorado */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-[#C9A84C]/20 blur-[60px] rounded-full" />
                <img
                  src="/img/zonamundial-images/imagenes/logos para sustuir emojis/unete ahora.png"
                  alt="Únete ahora"
                  className="relative w-48 h-48 sm:w-60 sm:h-60 object-contain float-animation drop-shadow-[0_0_40px_rgba(201,168,76,0.4)]"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Texto + CTA */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
                {h.ctaFinal.title}
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl text-lg leading-relaxed">
                {h.ctaFinal.desc}
              </p>
              <MagneticButton href="/registro" variant="primary">
                {h.ctaFinal.cta}
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
