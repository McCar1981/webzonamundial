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
/* Destello de impacto cuando el balón golpea la red */
.gnet-flash{position:absolute;left:50%;top:44%;width:62vmin;height:62vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.2);opacity:0;
  background:radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(var(--teamrgb),.55) 32%, rgba(255,255,255,0) 66%);
  mix-blend-mode:screen;animation:gnetFlash .55s ease-out .42s forwards}
@keyframes gnetFlash{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}28%{opacity:.95}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
/* Balón (imagen real): entra desde el lateral GIRANDO, CRECE al acercarse
   (perspectiva), proyecta SOMBRA creciente (volumen) con leve motion-blur, y
   se hunde en la red al entrar al arco. */
.gnet-ball{position:absolute;left:50%;top:44%;height:clamp(66px,20vw,140px);width:auto;transform-origin:center center;will-change:transform,filter;animation:gnetBall .64s cubic-bezier(.28,.5,.35,1) forwards}
@keyframes gnetBall{
  0%{transform:translate(calc(-50% - 72vw), calc(-50% + 42vh)) scale(.3) rotate(0);opacity:0;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4)) blur(2.4px)}
  14%{opacity:1;filter:drop-shadow(0 8px 12px rgba(0,0,0,.45)) blur(1.4px)}
  50%{transform:translate(calc(-50% - 18vw), calc(-50% - 15vh)) scale(.9) rotate(380deg);opacity:1;filter:drop-shadow(0 18px 26px rgba(0,0,0,.5)) blur(.4px)}
  74%{transform:translate(-50%,-50%) scale(1.24) rotate(660deg);opacity:1;filter:drop-shadow(0 26px 40px rgba(0,0,0,.6)) blur(0)}
  100%{transform:translate(-50%,calc(-50% + 5vh)) scale(.72) rotate(760deg);opacity:0;filter:drop-shadow(0 10px 16px rgba(0,0,0,.4)) blur(3px)}
}
/* Texto */
.gnet-text{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.gnet-word{font-weight:900;letter-spacing:2px;line-height:.86;font-size:clamp(50px,15vw,132px);color:#fff;text-shadow:0 6px 22px rgba(0,0,0,.6),0 0 28px rgba(var(--teamrgb),.9);opacity:0;animation:gnetWord .55s cubic-bezier(.2,1.5,.35,1) .5s both}
@keyframes gnetWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet-name{font-weight:900;font-size:clamp(22px,5.5vw,38px);color:#fff;text-shadow:0 3px 12px rgba(0,0,0,.6);opacity:0;animation:gnetUp .5s ease .82s both}
.gnet-sub{font-weight:800;font-size:clamp(12px,3vw,17px);letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.9);opacity:0;animation:gnetUp .5s ease .96s both}
@keyframes gnetUp{0%{transform:translateY(18px);opacity:0}100%{transform:translateY(0);opacity:1}}
@media (prefers-reduced-motion: reduce){
  .gnet-ball,.gnet-ring,.gnet-flash{display:none!important}
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
      <div className="gnet-flash" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gnet-ball" src="/img/matchcenter/balon.png" alt="" draggable={false} />
      <div className="gnet-text">
        <div className="gnet-word">{ownGoal ? "¡GOL!" : "¡GOOOL!"}</div>
        <div className="gnet-name">{name}</div>
        <div className="gnet-sub">{sub}</div>
      </div>
    </div>
  );

  return createPortal(node, target);
}
