"use client";

// Celebración de GOL CINEMATOGRÁFICA a pantalla completa. Cámara detrás de la
// portería: 1) la RED aparece y cubre la pantalla (fondo OPACO + viñeta de
// cine — sin backdrop-filter, que parpadeaba en móvil); 2) el balón REAL entra
// DESPUÉS, desde el lateral, girando, va HACIA la red y se HUNDE en ella con
// PROFUNDIDAD (se aleja/encoge mientras la red se abomba hacia ti); 3) impacto
// con destello + lens-flare + leve sacudida de cámara; 4) ¡GOOOL! + goleador.
// Portal a document.body para ocupar el viewport ENTERO. Cámara lenta ~6,5 s.

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
/* Contenedor a pantalla completa (un poco mayor para que la sacudida de cámara
   no deje huecos). Fundido global al final + shake breve en el impacto. */
.gnet{position:fixed;inset:-18px;z-index:2147483000;pointer-events:none;overflow:hidden;animation:gnetFade 6.6s ease forwards, gnetShake .55s cubic-bezier(.36,.07,.19,.97) 2.58s}
@keyframes gnetFade{0%{opacity:1}88%{opacity:1}100%{opacity:0}}
@keyframes gnetShake{0%,100%{transform:translate(0,0)}14%{transform:translate(-6px,4px)}30%{transform:translate(5px,-5px)}46%{transform:translate(-4px,-3px)}62%{transform:translate(4px,4px)}80%{transform:translate(-3px,2px)}}

/* ── 1) La RED aparece PRIMERO. El fondo OPACO TAPA la pantalla DE GOLPE (fade
   rápido, sin clip-path) para que NO se vea el match center en ningún momento
   (era la "intermitencia"); encima, la malla de rombos se DIBUJA desde el
   centro. Sin backdrop-filter (parpadeaba en móvil). ── */
.gnet-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgb(9,13,20) 0%, rgb(5,8,13) 55%, rgb(2,4,8) 100%);opacity:0;animation:gnetBgIn .42s ease forwards}
@keyframes gnetBgIn{0%{opacity:0}100%{opacity:1}}
/* Glow del color del equipo, ADITIVO (screen) SOBRE el fondo opaco: tinta el
   centro SIN transparentar (antes el centro era rgba(team,.5) y dejaba ver el
   match center por el medio = la "intermitencia"). */
.gnet-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgba(var(--teamrgb),.62) 0%, rgba(var(--teamrgb),.14) 38%, transparent 62%);mix-blend-mode:screen;opacity:0;transform-origin:50% 46%;animation:gnetBgIn .55s ease forwards, gnetBillow 1.2s cubic-bezier(.3,1.5,.4,1) 2.58s}
.gnet-mesh{position:absolute;inset:0;opacity:.9;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 calc(3.4vmin - 1px), rgba(255,255,255,.5) calc(3.4vmin - 1px) calc(3.4vmin + 1px), rgba(255,255,255,0) calc(3.4vmin + 1px) 6.8vmin),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 calc(3.4vmin - 1px), rgba(255,255,255,.5) calc(3.4vmin - 1px) calc(3.4vmin + 1px), rgba(255,255,255,0) calc(3.4vmin + 1px) 6.8vmin);
  -webkit-mask-image:radial-gradient(circle at 50% 46%, #000 52%, rgba(0,0,0,.4) 100%);mask-image:radial-gradient(circle at 50% 46%, #000 52%, rgba(0,0,0,.4) 100%);
  clip-path:circle(0% at 50% 46%);transform-origin:50% 46%;animation:gnetReveal 1.3s cubic-bezier(.25,.7,.3,1) forwards, gnetBillow 1.2s cubic-bezier(.3,1.5,.4,1) 2.58s}
@keyframes gnetReveal{0%{clip-path:circle(0% at 50% 46%)}100%{clip-path:circle(165% at 50% 46%)}}
/* La red se HUNDE/abomba hacia el espectador con el impacto del balón. */
@keyframes gnetBillow{0%{transform:scale(1)}30%{transform:scale(1.2)}62%{transform:scale(.98)}100%{transform:scale(1)}}
/* Abombamiento luminoso de la red en el punto de impacto (volumen hacia ti) */
.gnet-bulge{position:absolute;left:50%;top:46%;width:92vmin;height:92vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.1);opacity:0;background:radial-gradient(circle, rgba(255,255,255,.35) 0%, rgba(var(--teamrgb),.25) 40%, transparent 68%);mix-blend-mode:screen;animation:gnetBulge 1s cubic-bezier(.2,.9,.3,1) 2.58s forwards}
@keyframes gnetBulge{0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}30%{opacity:.9}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3)}}

/* Bloom + LENS FLARE + onda de impacto */
.gnet-bloom{position:absolute;left:50%;top:46%;width:130vmin;height:130vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.3);opacity:0;background:radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(var(--teamrgb),.45) 16%, transparent 44%);mix-blend-mode:screen;animation:gnetBloom .9s ease-out 2.58s forwards}
@keyframes gnetBloom{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}24%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.15)}}
.gnet-flare{position:absolute;left:50%;top:46%;width:160vw;height:6px;transform:translate(-50%,-50%) scaleX(0);opacity:0;background:linear-gradient(90deg, transparent, rgba(255,255,255,.95) 42%, rgba(var(--teamrgb),.8) 50%, rgba(255,255,255,.95) 58%, transparent);filter:blur(2px);mix-blend-mode:screen;animation:gnetFlare .8s ease-out 2.62s forwards}
@keyframes gnetFlare{0%{opacity:0;transform:translate(-50%,-50%) scaleX(0)}22%{opacity:.95;transform:translate(-50%,-50%) scaleX(1)}100%{opacity:0;transform:translate(-50%,-50%) scaleX(1.25)}}
.gnet-ring{position:absolute;left:50%;top:46%;width:46px;height:46px;border-radius:50%;border:5px solid rgba(255,255,255,.92);transform:translate(-50%,-50%) scale(.2);animation:gnetRing 1.3s cubic-bezier(.2,.7,.3,1) 2.58s forwards}
@keyframes gnetRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.95}100%{transform:translate(-50%,-50%) scale(44);opacity:0}}

/* ── 2) El BALÓN entra DESPUÉS (la red ya está): desde el lateral, girando, va
   HACIA la red creciendo (perspectiva) y se HUNDE en ella con PROFUNDIDAD
   (se aleja/encoge al entrar mientras la red se abomba hacia ti). ── */
.gnet-ball{position:absolute;left:50%;top:46%;height:clamp(74px,22vw,162px);width:auto;transform-origin:center center;will-change:transform,filter;animation:gnetBall 1.5s cubic-bezier(.32,.42,.4,1) 1.45s forwards}
@keyframes gnetBall{
  0%{transform:translate(calc(-50% - 86vw), calc(-50% + 52vh)) scale(.28) rotate(0);opacity:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45)) blur(3px)}
  12%{opacity:1;filter:drop-shadow(0 10px 14px rgba(0,0,0,.45)) blur(1.8px)}
  55%{transform:translate(calc(-50% - 16vw), calc(-50% - 11vh)) scale(.88) rotate(420deg);opacity:1;filter:drop-shadow(0 22px 32px rgba(0,0,0,.5)) blur(.4px)}
  78%{transform:translate(-50%,-50%) scale(1.32) rotate(680deg);opacity:1;filter:drop-shadow(0 32px 48px rgba(0,0,0,.66)) blur(0)}
  /* se hunde en la red: se aleja (encoge) con profundidad */
  100%{transform:translate(-50%,calc(-50% + 6vh)) scale(.42) rotate(800deg);opacity:0;filter:drop-shadow(0 8px 14px rgba(0,0,0,.3)) blur(2.8px)}
}

/* ── 3) Texto cinematográfico (tras el impacto) ── */
.gnet-text{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.gnet-word{font-weight:900;letter-spacing:2px;line-height:.84;font-size:clamp(54px,16vw,140px);color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.65),0 0 34px rgba(var(--teamrgb),.95);opacity:0;animation:gnetWord .7s cubic-bezier(.2,1.5,.35,1) 2.85s both}
@keyframes gnetWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet-name{font-weight:900;font-size:clamp(22px,5.5vw,40px);color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.65);opacity:0;animation:gnetUp .6s ease 3.2s both}
.gnet-sub{font-weight:800;font-size:clamp(12px,3vw,18px);letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.92);opacity:0;animation:gnetUp .6s ease 3.36s both}
@keyframes gnetUp{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}

/* Viñeta (encuadre de cine), por encima de todo. (Sin grano animado ni
   backdrop-filter: causaban parpadeo en móvil.) */
.gnet-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%, transparent 36%, rgba(0,0,0,.34) 72%, rgba(0,0,0,.66) 100%);opacity:0;animation:gnetVig .7s ease forwards}
@keyframes gnetVig{0%{opacity:0}100%{opacity:1}}

@media (prefers-reduced-motion: reduce){
  .gnet{animation:gnetFade 4.5s ease forwards!important}
  .gnet-ball,.gnet-ring,.gnet-bloom,.gnet-flare,.gnet-bulge{display:none!important}
  .gnet-bg,.gnet-mesh{clip-path:none!important;animation:none!important;opacity:.9}
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
      <div className="gnet-glow" />
      <div className="gnet-mesh" />
      <div className="gnet-bulge" />
      <div className="gnet-bloom" />
      <div className="gnet-flare" />
      <div className="gnet-ring" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gnet-ball" src="/img/matchcenter/balon.png" alt="" draggable={false} />
      <div className="gnet-text">
        <div className="gnet-word">{ownGoal ? "¡GOL!" : "¡GOOOL!"}</div>
        <div className="gnet-name">{name}</div>
        <div className="gnet-sub">{sub}</div>
      </div>
      <div className="gnet-vig" />
    </div>
  );

  return createPortal(node, target);
}
