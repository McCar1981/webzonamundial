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
/* La celebración entera se desvanece al final (fade global del contenedor). */
.gnet{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;animation:gnetFade 4.7s ease forwards}
@keyframes gnetFade{0%{opacity:1}86%{opacity:1}100%{opacity:0}}

/* ── 1) La RED aparece PRIMERO: fondo tintado + malla de rombos se revelan
   (clip-path circular) hasta cubrir TODA la pantalla. ── */
.gnet-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgba(var(--teamrgb),.55) 0%, rgba(6,11,20,.9) 66%);clip-path:circle(0% at 50% 46%);transform-origin:50% 46%;animation:gnetReveal .9s cubic-bezier(.25,.7,.3,1) forwards, gnetBillow 1s cubic-bezier(.3,1.45,.4,1) 1.7s}
.gnet-mesh{position:absolute;inset:0;opacity:.92;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 calc(3.6vmin - 1.1px), rgba(255,255,255,.55) calc(3.6vmin - 1.1px) calc(3.6vmin + 1.1px), rgba(255,255,255,0) calc(3.6vmin + 1.1px) 7.2vmin),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 calc(3.6vmin - 1.1px), rgba(255,255,255,.55) calc(3.6vmin - 1.1px) calc(3.6vmin + 1.1px), rgba(255,255,255,0) calc(3.6vmin + 1.1px) 7.2vmin);
  clip-path:circle(0% at 50% 46%);transform-origin:50% 46%;animation:gnetReveal .9s cubic-bezier(.25,.7,.3,1) forwards, gnetBillow 1s cubic-bezier(.3,1.45,.4,1) 1.7s}
@keyframes gnetReveal{0%{clip-path:circle(0% at 50% 46%)}100%{clip-path:circle(155% at 50% 46%)}}
/* La red SE HUNDE / abomba cuando el balón la golpea (empuje hacia el espectador y reposo). */
@keyframes gnetBillow{0%{transform:scale(1)}34%{transform:scale(1.14)}68%{transform:scale(.985)}100%{transform:scale(1)}}

/* Destello + onda de impacto (cuando el balón golpea la red, ~1.7s) */
.gnet-flash{position:absolute;left:50%;top:46%;width:64vmin;height:64vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.2);opacity:0;
  background:radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(var(--teamrgb),.55) 32%, rgba(255,255,255,0) 66%);
  mix-blend-mode:screen;animation:gnetFlash .6s ease-out 1.66s forwards}
@keyframes gnetFlash{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}26%{opacity:.95}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
.gnet-ring{position:absolute;left:50%;top:46%;width:44px;height:44px;border-radius:50%;border:5px solid rgba(255,255,255,.92);transform:translate(-50%,-50%) scale(.2);animation:gnetRing 1.1s cubic-bezier(.2,.7,.3,1) 1.66s forwards}
@keyframes gnetRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.95}100%{transform:translate(-50%,-50%) scale(40);opacity:0}}

/* ── 2) El BALÓN entra DESPUÉS (la red ya está): desde el lateral, GIRANDO,
   CRECE al acercarse (perspectiva), SOMBRA creciente (volumen) + leve
   motion-blur, y se HUNDE en la red al entrar al arco. ── */
.gnet-ball{position:absolute;left:50%;top:46%;height:clamp(70px,21vw,150px);width:auto;transform-origin:center center;will-change:transform,filter;animation:gnetBall 1s cubic-bezier(.3,.48,.4,1) .9s forwards}
@keyframes gnetBall{
  0%{transform:translate(calc(-50% - 80vw), calc(-50% + 48vh)) scale(.32) rotate(0);opacity:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45)) blur(2.6px)}
  12%{opacity:1;filter:drop-shadow(0 10px 14px rgba(0,0,0,.45)) blur(1.5px)}
  58%{transform:translate(calc(-50% - 16vw), calc(-50% - 12vh)) scale(.92) rotate(440deg);opacity:1;filter:drop-shadow(0 18px 28px rgba(0,0,0,.5)) blur(.3px)}
  80%{transform:translate(-50%,-50%) scale(1.24) rotate(680deg);opacity:1;filter:drop-shadow(0 28px 42px rgba(0,0,0,.62)) blur(0)}
  100%{transform:translate(-50%,calc(-50% + 4vh)) scale(.58) rotate(760deg);opacity:0;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35)) blur(2.4px)}
}

/* ── 3) Texto: aparece DESPUÉS del impacto y se mantiene ── */
.gnet-text{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.gnet-word{font-weight:900;letter-spacing:2px;line-height:.86;font-size:clamp(52px,15vw,134px);color:#fff;text-shadow:0 6px 22px rgba(0,0,0,.6),0 0 30px rgba(var(--teamrgb),.95);opacity:0;animation:gnetWord .6s cubic-bezier(.2,1.5,.35,1) 1.8s both}
@keyframes gnetWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet-name{font-weight:900;font-size:clamp(22px,5.5vw,38px);color:#fff;text-shadow:0 3px 12px rgba(0,0,0,.6);opacity:0;animation:gnetUp .5s ease 2.1s both}
.gnet-sub{font-weight:800;font-size:clamp(12px,3vw,17px);letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.9);opacity:0;animation:gnetUp .5s ease 2.24s both}
@keyframes gnetUp{0%{transform:translateY(18px);opacity:0}100%{transform:translateY(0);opacity:1}}

@media (prefers-reduced-motion: reduce){
  .gnet-ball,.gnet-ring,.gnet-flash{display:none!important}
  .gnet-bg,.gnet-mesh{clip-path:none!important;animation:none!important;opacity:.92}
  .gnet-word{animation:gnetWord .3s ease 0s both!important}
  .gnet-name,.gnet-sub{animation:gnetUp .3s ease 0s both!important}
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
