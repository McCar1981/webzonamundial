"use client";

// Celebración de GOL a PANTALLA COMPLETA, estilo Google: un balón de fútbol
// entra desde un lateral hacia la portería y la RED (malla de rombos) se
// expande desde el impacto hasta cubrir toda la pantalla, tintada con el color
// de la selección que marca. Se monta en un PORTAL a document.body para escapar
// del contenedor 3D de la cancha y ocupar el viewport ENTERO (clave en móvil).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { lastName } from "@/lib/match-center/names";

export interface GoalNetProps {
  teamName: string;
  color: string;
  player?: string;
  ownGoal?: boolean;
  /** Cambia en cada gol: fuerza el remontaje y reinicia la animación. */
  fxKey: number;
}

function hexToRgb(hex: string): string {
  const h = (hex || "#c9a84c").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "201,168,76";
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Balón de fútbol clásico (blanco con pentágonos negros). SVG, nunca emoji. */
function SoccerBall() {
  return (
    <svg className="gnet-ball" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id="gnetBallG" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cfd6de" />
        </radialGradient>
        <clipPath id="gnetBallClip">
          <circle cx="50" cy="50" r="47" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#gnetBallG)" stroke="#0b0f16" strokeWidth="2.5" />
      <g clipPath="url(#gnetBallClip)">
        {/* Pentágono central */}
        <polygon points="50,33 64,43.5 58.6,60.5 41.4,60.5 36,43.5" fill="#0b0f16" />
        {/* Costuras hacia el borde */}
        <g stroke="#0b0f16" strokeWidth="3.2" fill="none" strokeLinecap="round">
          <path d="M50,33 L50,8" />
          <path d="M64,43.5 L86,34" />
          <path d="M58.6,60.5 L72,82" />
          <path d="M41.4,60.5 L28,82" />
          <path d="M36,43.5 L14,34" />
        </g>
        {/* Pentágonos del borde (el clip los recorta al contorno del balón) */}
        <g fill="#0b0f16">
          <polygon points="50,1 62,-8 50,-19 38,-8" />
          <polygon points="92,28 105,23 107,7 94,12" />
          <polygon points="75,88 88,99 99,86 87,76" />
          <polygon points="25,88 12,99 1,86 13,76" />
          <polygon points="8,28 -5,23 -7,7 6,12" />
        </g>
      </g>
    </svg>
  );
}

const GN_CSS = `
.gnet{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden}
/* Fondo tintado que se revela en círculo desde el punto de impacto */
.gnet-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 44%, rgba(var(--teamrgb),.55) 0%, rgba(6,11,20,.88) 64%);clip-path:circle(0% at 50% 44%);animation:gnetReveal 2.7s cubic-bezier(.2,.85,.25,1) .34s forwards}
/* Malla de RED de portería (rombos) que se expande hasta cubrir la pantalla */
.gnet-mesh{position:absolute;inset:0;opacity:0;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 calc(3.6vmin - 1.1px), rgba(255,255,255,.55) calc(3.6vmin - 1.1px) calc(3.6vmin + 1.1px), rgba(255,255,255,0) calc(3.6vmin + 1.1px) 7.2vmin),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 calc(3.6vmin - 1.1px), rgba(255,255,255,.55) calc(3.6vmin - 1.1px) calc(3.6vmin + 1.1px), rgba(255,255,255,0) calc(3.6vmin + 1.1px) 7.2vmin);
  clip-path:circle(0% at 50% 44%);animation:gnetReveal 2.7s cubic-bezier(.2,.85,.25,1) .34s forwards, gnetMesh 2.9s ease .34s forwards}
@keyframes gnetReveal{0%{clip-path:circle(0% at 50% 44%)}48%{clip-path:circle(145% at 50% 44%)}100%{clip-path:circle(145% at 50% 44%)}}
@keyframes gnetMesh{0%{opacity:0}10%{opacity:1}72%{opacity:.92}100%{opacity:0}}
/* Onda de impacto */
.gnet-ring{position:absolute;left:50%;top:44%;width:42px;height:42px;border-radius:50%;border:5px solid rgba(255,255,255,.92);transform:translate(-50%,-50%) scale(.2);animation:gnetRing 1s cubic-bezier(.2,.7,.3,1) .34s forwards}
@keyframes gnetRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.95}100%{transform:translate(-50%,-50%) scale(36);opacity:0}}
/* Balón que entra desde el lateral inferior hacia la portería (centro) */
.gnet-ball{position:absolute;left:50%;top:44%;width:clamp(58px,18vw,124px);height:clamp(58px,18vw,124px);filter:drop-shadow(0 10px 20px rgba(0,0,0,.55));animation:gnetBall .6s cubic-bezier(.3,.5,.35,1) forwards}
@keyframes gnetBall{
  0%{transform:translate(calc(-50% - 64vw), calc(-50% + 36vh)) scale(.5) rotate(0);opacity:0}
  16%{opacity:1}
  48%{transform:translate(calc(-50% - 22vw), calc(-50% - 16vh)) scale(.96) rotate(320deg);opacity:1}
  74%{transform:translate(-50%,-50%) scale(1.06) rotate(560deg);opacity:1}
  100%{transform:translate(-50%,-50%) scale(.72) rotate(640deg);opacity:0}
}
/* Texto */
.gnet-text{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.gnet-word{font-weight:900;letter-spacing:2px;line-height:.86;font-size:clamp(50px,15vw,132px);color:#fff;text-shadow:0 6px 22px rgba(0,0,0,.6),0 0 28px rgba(var(--teamrgb),.9);opacity:0;animation:gnetWord .55s cubic-bezier(.2,1.5,.35,1) .5s both}
@keyframes gnetWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet-name{font-weight:900;font-size:clamp(22px,5.5vw,38px);color:#fff;text-shadow:0 3px 12px rgba(0,0,0,.6);opacity:0;animation:gnetUp .5s ease .82s both}
.gnet-sub{font-weight:800;font-size:clamp(12px,3vw,17px);letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.9);opacity:0;animation:gnetUp .5s ease .96s both}
@keyframes gnetUp{0%{transform:translateY(18px);opacity:0}100%{transform:translateY(0);opacity:1}}
@media (prefers-reduced-motion: reduce){
  .gnet-ball,.gnet-ring{display:none!important}
  .gnet-bg{clip-path:none!important;animation:gnetMesh 2.2s ease forwards!important}
  .gnet-mesh{clip-path:none!important;animation:gnetMesh 2.2s ease forwards!important}
  .gnet-word{animation:gnetWord .3s ease both!important}
}
`;

export default function GoalNet({ teamName, color, player, ownGoal, fxKey }: GoalNetProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.body);
  }, []);
  if (!target) return null;

  const name = ownGoal ? teamName : player ? lastName(player) : "Gol";
  const sub = ownGoal ? `En propia${player ? ` · ${lastName(player)}` : ""}` : teamName;

  const node = (
    <div key={fxKey} className="gnet" style={{ ["--teamrgb" as string]: hexToRgb(color) }}>
      <style>{GN_CSS}</style>
      <div className="gnet-bg" />
      <div className="gnet-mesh" />
      <div className="gnet-ring" />
      <SoccerBall />
      <div className="gnet-text">
        <div className="gnet-word">{ownGoal ? "¡GOL!" : "¡GOOOL!"}</div>
        <div className="gnet-name">{name}</div>
        <div className="gnet-sub">{sub}</div>
      </div>
    </div>
  );

  return createPortal(node, target);
}
