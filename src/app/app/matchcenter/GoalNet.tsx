"use client";

// Celebración de GOL CINEMATOGRÁFICA a pantalla completa. Cámara detrás de la
// portería: 1) la RED aparece y cubre la pantalla con profundidad de campo
// (desenfoque del fondo) y viñeta de cine; 2) el balón REAL entra desde el
// lateral, girando y creciendo (perspectiva, sombra, motion-blur); 3) al
// golpear, la red SE HUNDE hacia el espectador con destello + lens-flare +
// sacudida de cámara; 4) ¡GOOOL! + goleador. Grano de película sobre todo.
// Se monta en un PORTAL a document.body para ocupar el viewport ENTERO.

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
/* Contenedor a pantalla completa (un poco mayor para que la SACUDIDA de cámara
   no deje huecos). Fundido global al final + shake en el impacto. */
.gnet{position:fixed;inset:-16px;z-index:2147483000;pointer-events:none;overflow:hidden;animation:gnetFade 5s ease forwards, gnetShake .5s cubic-bezier(.36,.07,.19,.97) 1.86s}
@keyframes gnetFade{0%{opacity:1}87%{opacity:1}100%{opacity:0}}
@keyframes gnetShake{0%,100%{transform:translate(0,0)}12%{transform:translate(-7px,5px)}26%{transform:translate(6px,-6px)}40%{transform:translate(-5px,-4px)}55%{transform:translate(5px,5px)}70%{transform:translate(-4px,3px)}85%{transform:translate(3px,-2px)}}

/* ── 1) RED + profundidad de campo (desenfoque del fondo) que se revelan ── */
.gnet-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgba(var(--teamrgb),.5) 0%, rgba(5,9,16,.92) 64%);-webkit-backdrop-filter:blur(5px) saturate(.85);backdrop-filter:blur(5px) saturate(.85);clip-path:circle(0% at 50% 46%);transform-origin:50% 46%;animation:gnetReveal 1.05s cubic-bezier(.25,.7,.3,1) forwards, gnetBillow 1.1s cubic-bezier(.3,1.5,.4,1) 1.86s}
.gnet-mesh{position:absolute;inset:0;opacity:.9;
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 calc(3.4vmin - 1px), rgba(255,255,255,.5) calc(3.4vmin - 1px) calc(3.4vmin + 1px), rgba(255,255,255,0) calc(3.4vmin + 1px) 6.8vmin),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 calc(3.4vmin - 1px), rgba(255,255,255,.5) calc(3.4vmin - 1px) calc(3.4vmin + 1px), rgba(255,255,255,0) calc(3.4vmin + 1px) 6.8vmin);
  -webkit-mask-image:radial-gradient(circle at 50% 46%, #000 55%, rgba(0,0,0,.45) 100%);mask-image:radial-gradient(circle at 50% 46%, #000 55%, rgba(0,0,0,.45) 100%);
  clip-path:circle(0% at 50% 46%);transform-origin:50% 46%;animation:gnetReveal 1.05s cubic-bezier(.25,.7,.3,1) forwards, gnetBillow 1.1s cubic-bezier(.3,1.5,.4,1) 1.86s}
@keyframes gnetReveal{0%{clip-path:circle(0% at 50% 46%)}100%{clip-path:circle(160% at 50% 46%)}}
/* La red se HUNDE hacia el espectador con el impacto (empuje 3D + reposo) */
@keyframes gnetBillow{0%{transform:scale(1)}30%{transform:scale(1.18)}62%{transform:scale(.98)}100%{transform:scale(1)}}
/* Abombamiento luminoso de la red en el punto de impacto (volumen hacia ti) */
.gnet-bulge{position:absolute;left:50%;top:46%;width:90vmin;height:90vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.1);opacity:0;background:radial-gradient(circle, rgba(255,255,255,.35) 0%, rgba(var(--teamrgb),.25) 40%, transparent 68%);mix-blend-mode:screen;animation:gnetBulge .9s cubic-bezier(.2,.9,.3,1) 1.86s forwards}
@keyframes gnetBulge{0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}30%{opacity:.9}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}

/* Bloom + LENS FLARE de impacto (cine) */
.gnet-bloom{position:absolute;left:50%;top:46%;width:130vmin;height:130vmin;border-radius:50%;transform:translate(-50%,-50%) scale(.3);opacity:0;background:radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(var(--teamrgb),.45) 16%, transparent 44%);mix-blend-mode:screen;animation:gnetBloom .85s ease-out 1.86s forwards}
@keyframes gnetBloom{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}24%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.15)}}
.gnet-flare{position:absolute;left:50%;top:46%;width:160vw;height:6px;transform:translate(-50%,-50%) scaleX(0);opacity:0;background:linear-gradient(90deg, transparent, rgba(255,255,255,.95) 42%, rgba(var(--teamrgb),.8) 50%, rgba(255,255,255,.95) 58%, transparent);filter:blur(2px);mix-blend-mode:screen;animation:gnetFlare .75s ease-out 1.9s forwards}
@keyframes gnetFlare{0%{opacity:0;transform:translate(-50%,-50%) scaleX(0)}22%{opacity:.95;transform:translate(-50%,-50%) scaleX(1)}100%{opacity:0;transform:translate(-50%,-50%) scaleX(1.25)}}
.gnet-ring{position:absolute;left:50%;top:46%;width:46px;height:46px;border-radius:50%;border:5px solid rgba(255,255,255,.92);transform:translate(-50%,-50%) scale(.2);animation:gnetRing 1.2s cubic-bezier(.2,.7,.3,1) 1.86s forwards}
@keyframes gnetRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.95}100%{transform:translate(-50%,-50%) scale(42);opacity:0}}

/* ── 2) Balón REAL: entra DESPUÉS (red ya puesta), desde el lateral, gira,
   crece (perspectiva), sombra creciente (volumen) + motion-blur, y se hunde. ── */
.gnet-ball{position:absolute;left:50%;top:46%;height:clamp(72px,22vw,158px);width:auto;transform-origin:center center;will-change:transform,filter;animation:gnetBall 1.15s cubic-bezier(.3,.46,.4,1) 1s forwards}
@keyframes gnetBall{
  0%{transform:translate(calc(-50% - 84vw), calc(-50% + 50vh)) scale(.3) rotate(0);opacity:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45)) blur(3px)}
  12%{opacity:1;filter:drop-shadow(0 10px 14px rgba(0,0,0,.45)) blur(1.7px)}
  56%{transform:translate(calc(-50% - 16vw), calc(-50% - 12vh)) scale(.92) rotate(420deg);opacity:1;filter:drop-shadow(0 20px 30px rgba(0,0,0,.5)) blur(.4px)}
  78%{transform:translate(-50%,-50%) scale(1.28) rotate(660deg);opacity:1;filter:drop-shadow(0 30px 46px rgba(0,0,0,.64)) blur(0)}
  100%{transform:translate(-50%,calc(-50% + 5vh)) scale(.56) rotate(760deg);opacity:0;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35)) blur(2.6px)}
}

/* ── 3) Texto cinematográfico ── */
.gnet-text{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.gnet-word{font-weight:900;letter-spacing:2px;line-height:.84;font-size:clamp(54px,16vw,140px);color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.65),0 0 34px rgba(var(--teamrgb),.95);opacity:0;animation:gnetWord .65s cubic-bezier(.2,1.5,.35,1) 2s both}
@keyframes gnetWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet-name{font-weight:900;font-size:clamp(22px,5.5vw,40px);color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.65);opacity:0;animation:gnetUp .55s ease 2.34s both}
.gnet-sub{font-weight:800;font-size:clamp(12px,3vw,18px);letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.92);opacity:0;animation:gnetUp .55s ease 2.48s both}
@keyframes gnetUp{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}

/* Grano de película + viñeta (encuadre de cine), por encima de todo */
.gnet-grain{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");animation:gnetGrain .45s steps(2) infinite}
@keyframes gnetGrain{0%{background-position:0 0}50%{background-position:32px -22px}100%{background-position:-18px 26px}}
.gnet-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%, transparent 38%, rgba(0,0,0,.32) 72%, rgba(0,0,0,.62) 100%);opacity:0;animation:gnetVig .6s ease forwards}
@keyframes gnetVig{0%{opacity:0}100%{opacity:1}}

@media (prefers-reduced-motion: reduce){
  .gnet{animation:gnetFade 4s ease forwards!important}
  .gnet-ball,.gnet-ring,.gnet-bloom,.gnet-flare,.gnet-bulge,.gnet-grain{display:none!important}
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
      <div className="gnet-grain" />
      <div className="gnet-vig" />
    </div>
  );

  return createPortal(node, target);
}
