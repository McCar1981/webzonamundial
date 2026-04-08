"use client";

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";

interface PathPoint {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export function LuxuryBallBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLImageElement>(null);
  const isAnimatingRef = useRef(false);

  // Generar puntos de trayectoria aleatoria
  const generatePath = useCallback((containerWidth: number, containerHeight: number) => {
    const ballSize = 450;
    const points: PathPoint[] = [];
    
    // Configuración aleatoria
    const startY = containerHeight * (0.75 + Math.random() * 0.2);
    const endY = containerHeight * (0.75 + Math.random() * 0.2);
    const peakY = containerHeight * (0.1 + Math.random() * 0.25);
    const midY1 = containerHeight * (0.3 + Math.random() * 0.2);
    const midY2 = containerHeight * (0.3 + Math.random() * 0.2);
    
    const startX = -ballSize;
    const endX = containerWidth + ballSize;
    const totalDistance = endX - startX;
    
    const startScale = 0.5 + Math.random() * 0.2;
    const peakScale = 0.9 + Math.random() * 0.4;
    const totalRotation = 360 + Math.random() * 720;
    
    // Crear 20 puntos para trayectoria suave
    for (let i = 0; i <= 20; i++) {
      const progress = i / 20;
      const x = startX + (totalDistance * progress);
      
      // Interpolación de altura con curva bezier
      let y;
      if (progress < 0.5) {
        // Primera mitad - subida
        const localProgress = progress * 2;
        y = startY + (peakY - startY) * (1 - Math.pow(1 - localProgress, 2));
      } else {
        // Segunda mitad - bajada
        const localProgress = (progress - 0.5) * 2;
        y = peakY + (endY - peakY) * Math.pow(localProgress, 2);
      }
      
      // Escala con curva suave
      let scale;
      if (progress < 0.5) {
        scale = startScale + (peakScale - startScale) * Math.sin(progress * Math.PI);
      } else {
        scale = peakScale - (peakScale - startScale) * Math.sin((progress - 0.5) * Math.PI);
      }
      
      // Rotación lineal continua
      const rotation = totalRotation * progress;
      
      // Opacidad con fade in/out suaves
      let opacity = 0.5;
      if (progress < 0.15) {
        opacity = 0.5 * (progress / 0.15);
      } else if (progress > 0.85) {
        opacity = 0.5 * ((1 - progress) / 0.15);
      }
      
      points.push({ x, y, scale, rotation, opacity });
    }
    
    return { points, duration: 7 + Math.random() * 5 };
  }, []);

  // Animación fluida continua
  const startContinuousAnimation = useCallback(() => {
    const ball = ballRef.current;
    const container = containerRef.current;
    
    if (!ball || !container || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    
    const animate = () => {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const { points, duration } = generatePath(containerWidth, containerHeight);
      
      // Timeline sin pausas
      const tl = gsap.timeline({
        onComplete: () => {
          // Inmediatamente iniciar siguiente animación
          animate();
        }
      });
      
      // Animar a través de todos los puntos
      points.forEach((point, index) => {
        if (index === 0) {
          // Set initial position sin animación
          gsap.set(ball, {
            x: point.x,
            y: point.y,
            scale: point.scale,
            rotation: point.rotation,
            opacity: point.opacity
          });
        } else {
          // Animar a cada punto
          const segmentDuration = duration / 20;
          tl.to(ball, {
            x: point.x,
            y: point.y,
            scale: point.scale,
            rotation: point.rotation,
            opacity: point.opacity,
            duration: segmentDuration,
            ease: index === points.length - 1 ? "power2.in" : "none"
          });
        }
      });
    };
    
    // Iniciar primera animación
    animate();
  }, [generatePath]);

  useEffect(() => {
    const ball = ballRef.current;
    const container = containerRef.current;
    
    if (!ball || !container) return;

    // Esperar a que el DOM esté listo
    const timeout = setTimeout(() => {
      startContinuousAnimation();
    }, 100);

    return () => {
      clearTimeout(timeout);
      isAnimatingRef.current = false;
      gsap.killTweensOf(ball);
    };
  }, [startContinuousAnimation]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      {/* Fondo con patrón */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url('/img/imagenessilviu/Background Patterns.png')`,
          backgroundSize: '600px',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Fondo con estadio */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url('/img/imagenessilviu/Estadio Atmosphere.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          filter: 'blur(40px)'
        }}
      />

      {/* Brillo ambiental */}
      <div 
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(201, 168, 76, 0.05) 0%, transparent 70%)',
          filter: 'blur(120px)'
        }}
      />

      {/* Trayectoria guía sutil */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0" />
            <stop offset="50%" stopColor="#C9A84C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -300 850 Q 500 80 1300 850"
          fill="none"
          stroke="url(#trailGrad)"
          strokeWidth="2"
          strokeDasharray="30,50"
        />
      </svg>

      {/* Balón de fútbol */}
      <img 
        ref={ballRef}
        src="/img/imagenessilviu/balondefutbol.png" 
        alt=""
        className="absolute w-[400px] sm:w-[500px] md:w-[600px] h-auto object-contain"
        style={{
          filter: 'drop-shadow(0 60px 120px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 100px rgba(201, 168, 76, 0.2))',
          willChange: 'transform',
          transformOrigin: 'center center',
          opacity: 0
        }}
      />

      {/* Partículas doradas */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const seed = i * 7 + 3;
          const w = 1 + (seed % 20) / 10;
          const h = 1 + ((seed * 3) % 20) / 10;
          const left = ((seed * 13) % 100);
          const top = ((seed * 17) % 100);
          const op = 0.1 + ((seed * 7) % 20) / 100;
          const dur = 5 + ((seed * 11) % 50) / 10;
          const delay = ((seed * 19) % 50) / 10;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-[#C9A84C]"
              style={{
                width: `${w}px`,
                height: `${h}px`,
                left: `${left}%`,
                top: `${top}%`,
                opacity: op,
                animation: `float ${dur}s ease-in-out infinite`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>

      {/* Destello central */}
      <div 
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, transparent 50%)',
          filter: 'blur(100px)'
        }}
      />
    </div>
  );
}
