"use client";

// Celebración de GOL CINEMATOGRÁFICA a pantalla completa, FÍSICA. Cámara detrás
// de la portería:
//   1) la RED aparece PRIMERO y cubre la pantalla (fondo OPACO + viñeta de cine);
//   2) DESPUÉS el balón entra en PRIMER PLANO (grande, de frente) y vuela HACIA
//      la red ALEJÁNDOSE — se hace pequeño = entra en PROFUNDIDAD, no por un
//      lateral;
//   3) la red forma una BOLSA que se hunde en profundidad (rombos más densos y
//      oscuros = embudo) justo donde queda el balón, y el balón queda ANIDADO
//      ahí dentro;
//   4) impacto sobrio (destello + onda de la red + leve sacudida) y ¡GOOOL!.
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
.gnet{position:fixed;inset:-18px;z-index:2147483000;pointer-events:none;overflow:hidden;animation:gnetFade 6.6s ease forwards, gnetShake .5s cubic-bezier(.36,.07,.19,.97) 2.4s}
@keyframes gnetFade{0%{opacity:1}88%{opacity:1}100%{opacity:0}}
@keyframes gnetShake{0%,100%{transform:translate(0,0)}16%{transform:translate(-5px,3px)}34%{transform:translate(4px,-4px)}52%{transform:translate(-3px,-2px)}70%{transform:translate(3px,3px)}86%{transform:translate(-2px,1px)}}

/* ── 1) La RED aparece PRIMERO. El fondo OPACO TAPA la pantalla DE GOLPE (fade
   rápido) para que NO se vea el match center en ningún momento; encima, la malla
   de rombos se DIBUJA desde el centro. ── */
.gnet-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgb(9,13,20) 0%, rgb(5,8,13) 55%, rgb(2,4,8) 100%);opacity:0;animation:gnetBgIn .42s ease forwards}
@keyframes gnetBgIn{0%{opacity:0}100%{opacity:1}}
/* Glow del color del equipo, ADITIVO (screen) SOBRE el fondo opaco: tinta el
   centro SIN transparentar. */
.gnet-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgba(var(--teamrgb),.06) 0%, rgba(var(--teamrgb),.6) 24%, rgba(var(--teamrgb),.14) 48%, transparent 66%);mix-blend-mode:screen;opacity:0;animation:gnetBgIn .55s ease forwards}
.gnet-mesh{position:absolute;inset:0;opacity:.9;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 calc(3.4vmin - 1px), rgba(255,255,255,.5) calc(3.4vmin - 1px) calc(3.4vmin + 1px), rgba(255,255,255,0) calc(3.4vmin + 1px) 6.8vmin),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 calc(3.4vmin - 1px), rgba(255,255,255,.5) calc(3.4vmin - 1px) calc(3.4vmin + 1px), rgba(255,255,255,0) calc(3.4vmin + 1px) 6.8vmin);
  -webkit-mask-image:radial-gradient(circle at 50% 46%, #000 52%, rgba(0,0,0,.4) 100%);mask-image:radial-gradient(circle at 50% 46%, #000 52%, rgba(0,0,0,.4) 100%);
  clip-path:circle(0% at 50% 46%);transform-origin:50% 46%;animation:gnetReveal 1.3s cubic-bezier(.25,.7,.3,1) forwards}
@keyframes gnetReveal{0%{clip-path:circle(0% at 50% 46%)}100%{clip-path:circle(165% at 50% 46%)}}

/* ── 3) BOLSA de la red (se forma con el impacto): justo donde entra el balón la
   red se HUNDE en PROFUNDIDAD — los rombos se vuelven más pequeños/densos
   (perspectiva hacia el fondo) y un pozo oscuro marca el fondo del embudo. El
   balón queda ANIDADO en este hueco. Se forma en el impacto y SE QUEDA. ── */
.gnet-pocket{position:absolute;left:50%;top:46%;width:62vmin;height:62vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.18);opacity:0;
  background-image:
    radial-gradient(circle, rgba(0,0,0,.93) 0%, rgba(0,0,0,.74) 18%, rgba(0,0,0,.42) 38%, rgba(0,0,0,.13) 58%, transparent 72%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 calc(1.3vmin - .5px), rgba(255,255,255,.4) calc(1.3vmin - .5px) calc(1.3vmin + .5px), rgba(255,255,255,0) calc(1.3vmin + .5px) 2.6vmin),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 calc(1.3vmin - .5px), rgba(255,255,255,.4) calc(1.3vmin - .5px) calc(1.3vmin + .5px), rgba(255,255,255,0) calc(1.3vmin + .5px) 2.6vmin);
  -webkit-mask-image:radial-gradient(circle, #000 0%, #000 32%, rgba(0,0,0,.42) 54%, transparent 72%);
  mask-image:radial-gradient(circle, #000 0%, #000 32%, rgba(0,0,0,.42) 54%, transparent 72%);
  animation:gnetPocket .95s cubic-bezier(.2,.8,.3,1) 2.3s forwards}
@keyframes gnetPocket{0%{opacity:0;transform:translate(-50%,-50%) scale(.14)}55%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:1;transform:translate(-50%,-50%) scale(1.04)}}

/* Destello sobrio del impacto + onda de la red (vibración) */
.gnet-flash{position:absolute;left:50%;top:46%;width:66vmin;height:66vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.3);opacity:0;background:radial-gradient(circle, rgba(255,255,255,.7) 0%, rgba(var(--teamrgb),.3) 24%, transparent 52%);mix-blend-mode:screen;animation:gnetFlash .65s ease-out 2.38s forwards}
@keyframes gnetFlash{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}26%{opacity:.8}100%{opacity:0;transform:translate(-50%,-50%) scale(.92)}}
.gnet-ring{position:absolute;left:50%;top:46%;width:36px;height:36px;border-radius:50%;border:3px solid rgba(255,255,255,.5);opacity:0;transform:translate(-50%,-50%) scale(.2);animation:gnetRing 1s cubic-bezier(.2,.7,.3,1) 2.38s forwards}
@keyframes gnetRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.7}100%{transform:translate(-50%,-50%) scale(30);opacity:0}}

/* ── 2) El BALÓN entra DESPUÉS (la red ya está): aparece en PRIMER PLANO
   (grande, de frente, cerca de la cámara) y vuela HACIA la red ALEJÁNDOSE — se
   hace pequeño = entra en PROFUNDIDAD (NO por un lateral) — hasta HUNDIRSE en la
   bolsa de la red, donde queda ANIDADO (pequeño y profundo). ── */
.gnet-ball{position:absolute;left:50%;top:46%;height:clamp(82px,24vw,178px);width:auto;opacity:0;transform-origin:center center;will-change:transform,filter;animation:gnetBall 1.55s cubic-bezier(.3,.5,.3,1) 1.5s forwards}
@keyframes gnetBall{
  /* primer plano: GRANDE y de frente (cerca de la cámara), motion-blur */
  0%{transform:translate(-50%, calc(-50% + 16vh)) scale(2.1) rotate(0);opacity:0;filter:drop-shadow(0 28px 42px rgba(0,0,0,.6)) blur(6px)}
  12%{opacity:1;filter:drop-shadow(0 26px 38px rgba(0,0,0,.6)) blur(3px)}
  /* vuela HACIA la red ALEJÁNDOSE (encoge = entra en profundidad) */
  58%{transform:translate(-50%, calc(-50% + 2vh)) scale(.84) rotate(430deg);opacity:1;filter:drop-shadow(0 12px 20px rgba(0,0,0,.5)) blur(.5px)}
  /* se HUNDE en la bolsa de la red: pequeño y profundo, descansa en el fondo */
  100%{transform:translate(-50%, calc(-50% + 3vh)) scale(.4) rotate(560deg);opacity:.97;filter:drop-shadow(0 6px 11px rgba(0,0,0,.55)) blur(.4px)}
}

/* ── 4) Texto cinematográfico (tras el impacto) ── */
.gnet-text{position:absolute;left:50%;top:63%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
.gnet-word{font-weight:900;letter-spacing:2px;line-height:.84;font-size:clamp(54px,16vw,140px);color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.65),0 0 34px rgba(var(--teamrgb),.95);opacity:0;animation:gnetWord .7s cubic-bezier(.2,1.5,.35,1) 2.7s both}
@keyframes gnetWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet-name{font-weight:900;font-size:clamp(22px,5.5vw,40px);color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.65);opacity:0;animation:gnetUp .6s ease 3.05s both}
.gnet-sub{font-weight:800;font-size:clamp(12px,3vw,18px);letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.92);opacity:0;animation:gnetUp .6s ease 3.2s both}
@keyframes gnetUp{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}

/* Viñeta (encuadre de cine), por encima de todo. */
.gnet-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%, transparent 36%, rgba(0,0,0,.34) 72%, rgba(0,0,0,.66) 100%);opacity:0;animation:gnetVig .7s ease forwards}
@keyframes gnetVig{0%{opacity:0}100%{opacity:1}}

@media (prefers-reduced-motion: reduce){
  .gnet{animation:gnetFade 4.5s ease forwards!important}
  .gnet-ball,.gnet-ring,.gnet-flash,.gnet-pocket{display:none!important}
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
      <div className="gnet-pocket" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gnet-ball" src="/img/matchcenter/balon.png" alt="" draggable={false} />
      <div className="gnet-flash" />
      <div className="gnet-ring" />
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
