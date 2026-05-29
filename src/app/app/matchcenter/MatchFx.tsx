"use client";

// Capa de EFECTOS de transmisión, superpuesta a la cancha como overlay HTML
// (no SVG): así disponemos de degradados, brillo, desenfoque, 3D y tipografía
// con calidad "broadcast". Cada efecto se monta con una `key` única, de modo que
// sus animaciones CSS arrancan de cero al dispararse el evento.

import { useMemo } from "react";
import { lastName } from "@/lib/match-center/names";
import type { MatchMeta } from "@/lib/match-center/types";

export interface GoalPulse { side: "home" | "away"; key: number; player?: string }
export interface CardFx { side: "home" | "away"; color: string; key: number; player?: string }
export interface SubFx { side: "home" | "away"; key: number; playerOut?: string; playerIn?: string }

interface Props {
  meta: MatchMeta;
  goalPulse?: GoalPulse | null;
  cardFx?: CardFx | null;
  subFx?: SubFx | null;
}

const GOLD = "#c9a84c", GOLD2 = "#e8d48b";

export default function MatchFx({ meta, goalPulse, cardFx, subFx }: Props) {
  const confetti = useMemo(() => {
    if (!goalPulse) return [];
    const palette = [GOLD, GOLD2, "#ffffff", meta.home.color, meta.away.color, "#22c55e", "#ff5a8a", "#3b82f6"];
    return Array.from({ length: 56 }).map((_, i) => {
      const ang = (Math.random() * 360 * Math.PI) / 180;
      const dist = 28 + Math.random() * 42; // % del overlay
      return {
        id: i,
        tx: Math.cos(ang) * dist,
        ty: Math.sin(ang) * dist + 22,
        rot: Math.random() * 720 - 360,
        color: palette[i % palette.length],
        dur: 1.8 + Math.random() * 1.6,
        delay: Math.random() * 0.25,
        w: 7 + Math.random() * 7,
        h: 10 + Math.random() * 10,
        round: Math.random() < 0.4,
      };
    });
  }, [goalPulse, meta.home.color, meta.away.color]);

  const goalTeam = goalPulse ? (goalPulse.side === "home" ? meta.home : meta.away) : null;
  const cardTeam = cardFx ? (cardFx.side === "home" ? meta.home : meta.away) : null;
  const isRed = cardFx?.color === "#ef4444" || cardFx?.color === "#f04444";
  const subTeam = subFx ? (subFx.side === "home" ? meta.home : meta.away) : null;

  return (
    <div style={overlay}>
      <style>{CSS}</style>

      {/* ---------- GOL ---------- */}
      {goalPulse && goalTeam && (
        <div key={`g-${goalPulse.key}`} className="fx-goal">
          <div className="fx-flash" />
          <div className="fx-beams" style={{ ["--accent" as string]: goalTeam.color }} />
          <div className="fx-shock" />
          {confetti.map((c) => (
            <span
              key={c.id}
              className="fx-conf"
              style={{
                background: c.color,
                width: c.w,
                height: c.h,
                borderRadius: c.round ? "50%" : 2,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
                ["--tx" as string]: `${c.tx}vw`,
                ["--ty" as string]: `${c.ty}vh`,
                ["--r" as string]: `${c.rot}deg`,
              }}
            />
          ))}
          <div className="fx-goal-center">
            <div className="fx-goal-word" data-text="¡GOOOL!">¡GOOOL!</div>
            <div className="fx-lower" style={{ ["--team" as string]: goalTeam.color }}>
              <span className="fx-lower-bar" />
              <span className="fx-lower-name">{goalPulse.player || "Gol"}</span>
              <span className="fx-lower-team">{goalTeam.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------- TARJETA ---------- */}
      {cardFx && cardTeam && (
        <div key={`c-${cardFx.key}`} className="fx-card-wrap">
          <div className="fx-card-dim" />
          <div className="fx-card-stage">
            <div
              className="fx-card"
              style={{
                ["--card" as string]: cardFx.color,
                background: `linear-gradient(150deg, ${lighten(cardFx.color)} 0%, ${cardFx.color} 48%, ${darken(cardFx.color)} 100%)`,
                boxShadow: `0 18px 50px ${cardFx.color}99, 0 0 0 2px rgba(0,0,0,0.35)`,
              }}
            >
              <span className="fx-card-sheen" />
            </div>
          </div>
          <div className="fx-card-lower" style={{ ["--team" as string]: cardTeam.color }}>
            <span className="fx-card-kind" style={{ background: cardFx.color, color: isRed ? "#fff" : "#1a1400" }}>
              {isRed ? "TARJETA ROJA" : "TARJETA AMARILLA"}
            </span>
            <span className="fx-card-name">{cardFx.player ? lastName(cardFx.player) : "Jugador"}</span>
            <span className="fx-card-team">{cardTeam.name}</span>
          </div>
        </div>
      )}

      {/* ---------- CAMBIO ---------- */}
      {subFx && subTeam && (
        <div key={`s-${subFx.key}`} className="fx-sub">
          <div className="fx-sub-card" style={{ ["--team" as string]: subTeam.color }}>
            <div className="fx-sub-head">
              <span className="fx-sub-icon">⇄</span> CAMBIO
              <span className="fx-sub-team" style={{ color: subTeam.color }}>{subTeam.name}</span>
            </div>
            <div className="fx-sub-row">
              <span className="fx-sub-in">▲ ENTRA</span>
              <b>{subFx.playerIn ? lastName(subFx.playerIn) : "—"}</b>
            </div>
            <div className="fx-sub-row">
              <span className="fx-sub-out">▼ SALE</span>
              <b className="fx-sub-dim">{subFx.playerOut ? lastName(subFx.playerOut) : "—"}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- utilidades de color (mezcla simple con blanco/negro) ---
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(hex: string, target: number, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (target - c) * f);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function lighten(hex: string): string { return mix(hex, 255, 0.45); }
function darken(hex: string): string { return mix(hex, 0, 0.35); }

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: 16,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 5,
};

const CSS = `
.fx-goal,.fx-card-wrap,.fx-sub{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}

/* ---- GOL ---- */
.fx-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, rgba(255,255,255,.95), rgba(255,221,128,.5) 35%, rgba(0,0,0,0) 70%);animation:fxFlash .9s ease forwards}
@keyframes fxFlash{0%{opacity:.95}30%{opacity:0}50%{opacity:.5}100%{opacity:0}}
.fx-beams{position:absolute;left:50%;top:46%;width:200%;height:200%;transform:translate(-50%,-50%);
  background:repeating-conic-gradient(from 0deg, rgba(255,236,170,0) 0deg, rgba(255,236,170,.16) 5deg, rgba(255,236,170,0) 10deg, rgba(255,236,170,0) 18deg);
  mix-blend-mode:screen;filter:blur(2px);animation:fxSpin 5.5s linear infinite, fxBeamFade 4s ease forwards}
@keyframes fxSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes fxBeamFade{0%{opacity:0}12%{opacity:1}80%{opacity:1}100%{opacity:0}}
.fx-shock{position:absolute;left:50%;top:46%;width:40px;height:40px;border-radius:50%;border:4px solid rgba(255,255,255,.85);transform:translate(-50%,-50%) scale(0);animation:fxShock 1.1s ease-out forwards}
@keyframes fxShock{0%{transform:translate(-50%,-50%) scale(0);opacity:.9}100%{transform:translate(-50%,-50%) scale(18);opacity:0}}
.fx-conf{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);opacity:0;animation-name:fxConf;animation-timing-function:cubic-bezier(.15,.7,.3,1);animation-fill-mode:forwards}
@keyframes fxConf{0%{opacity:1;transform:translate(-50%,-50%) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) rotate(var(--r))}}
.fx-goal-center{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
.fx-goal-word{position:relative;font-weight:900;letter-spacing:3px;line-height:.9;font-size:clamp(54px,13vw,148px);
  background:linear-gradient(100deg,#e8d48b 0%,#fff 18%,#c9a84c 38%,#fff 58%,#e8d48b 80%);background-size:280% 100%;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;
  filter:drop-shadow(0 8px 20px rgba(0,0,0,.65));animation:fxWordIn .65s cubic-bezier(.2,1.5,.35,1) both, fxShine 1.8s linear .3s infinite}
.fx-goal-word::after{content:attr(data-text);position:absolute;inset:0;-webkit-text-fill-color:transparent;color:transparent;-webkit-text-stroke:2px rgba(0,0,0,.35);z-index:-1}
@keyframes fxWordIn{0%{transform:scale(.3) rotate(-7deg);opacity:0}60%{transform:scale(1.14) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes fxShine{0%{background-position:0% 0}100%{background-position:280% 0}}
.fx-lower{display:flex;align-items:center;gap:0;max-width:94vw;background:linear-gradient(90deg, rgba(11,24,37,.96), rgba(11,24,37,.82));border:1px solid rgba(255,255,255,.14);border-radius:12px;overflow:hidden;backdrop-filter:blur(4px);box-shadow:0 14px 36px rgba(0,0,0,.5);animation:fxLowerIn .5s .25s cubic-bezier(.2,1,.3,1) both}
.fx-lower-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@keyframes fxLowerIn{0%{transform:translateY(34px) scale(.92);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
.fx-lower-bar{width:8px;align-self:stretch;background:var(--team)}
.fx-lower-name{padding:10px 14px;font-size:clamp(18px,3.4vw,30px);font-weight:900;color:#fff}
.fx-lower-team{padding:10px 16px 10px 6px;font-size:clamp(12px,2vw,16px);font-weight:800;color:var(--team);text-transform:uppercase;letter-spacing:1px}

/* ---- TARJETA ---- */
.fx-card-dim{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%, rgba(0,0,0,0), rgba(0,0,0,.55));animation:fxDim 2.6s ease forwards}
@keyframes fxDim{0%{opacity:0}14%{opacity:1}80%{opacity:1}100%{opacity:0}}
.fx-card-stage{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);perspective:700px}
.fx-card{position:relative;width:clamp(96px,15vw,132px);aspect-ratio:5/7;border-radius:12px;transform-style:preserve-3d;animation:fxCardIn .75s cubic-bezier(.2,1.3,.35,1) both, fxCardFloat 2.6s ease-in-out .75s}
@keyframes fxCardIn{0%{transform:rotateY(105deg) rotateZ(-14deg) scale(.6);opacity:0}55%{transform:rotateY(-16deg) rotateZ(-8deg) scale(1.07);opacity:1}100%{transform:rotateY(0) rotateZ(-8deg) scale(1)}}
@keyframes fxCardFloat{0%,100%{transform:rotateY(0) rotateZ(-8deg) translateY(0)}50%{transform:rotateY(10deg) rotateZ(-8deg) translateY(-6px)}}
.fx-card-sheen{position:absolute;inset:0;border-radius:12px;background:linear-gradient(120deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 65%);background-size:250% 100%;animation:fxSheen 1.6s ease .4s 2}
@keyframes fxSheen{0%{background-position:160% 0}100%{background-position:-60% 0}}
.fx-card-lower{position:absolute;left:50%;bottom:14%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 12px;max-width:92vw;text-align:center;background:rgba(11,24,37,.95);border:1px solid rgba(255,255,255,.14);border-left:6px solid var(--team);border-radius:10px;padding:8px 14px;backdrop-filter:blur(4px);box-shadow:0 12px 30px rgba(0,0,0,.5);animation:fxLowerIn .5s .3s cubic-bezier(.2,1,.3,1) both, fxDim 2.6s ease forwards}
.fx-card-kind{font-size:clamp(10px,1.7vw,13px);font-weight:900;letter-spacing:1px;padding:4px 9px;border-radius:6px;white-space:nowrap}
.fx-card-name{font-size:clamp(16px,3vw,26px);font-weight:900;color:#fff}
.fx-card-team{font-size:clamp(11px,1.8vw,14px);font-weight:800;color:var(--team);text-transform:uppercase;letter-spacing:1px}

/* ---- CAMBIO ---- */
.fx-sub{align-items:flex-start;justify-content:center;padding-top:6%}
.fx-sub-card{min-width:min(78%,360px);background:linear-gradient(180deg, rgba(15,29,50,.97), rgba(11,24,37,.97));border:1px solid rgba(255,255,255,.12);border-top:3px solid var(--team);border-radius:14px;padding:12px 16px;backdrop-filter:blur(6px);box-shadow:0 16px 40px rgba(0,0,0,.55);animation:fxLowerIn .5s cubic-bezier(.2,1,.3,1) both, fxDim 3s ease forwards}
.fx-sub-head{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;letter-spacing:2px;color:#8a94b0;text-transform:uppercase;margin-bottom:8px}
.fx-sub-icon{color:#c9a84c;font-size:15px}
.fx-sub-team{margin-left:auto;letter-spacing:1px}
.fx-sub-row{display:flex;align-items:center;gap:10px;font-size:clamp(15px,2.6vw,20px);padding:3px 0}
.fx-sub-row b{font-weight:900;color:#fff}
.fx-sub-in{font-size:12px;font-weight:900;color:#22c55e;min-width:78px}
.fx-sub-out{font-size:12px;font-weight:900;color:#ef4444;min-width:78px}
.fx-sub-dim{color:#8a94b0!important}

@media (prefers-reduced-motion: reduce){
  .fx-beams,.fx-card,.fx-card-sheen{animation-duration:.01s!important}
}
@media (max-width:640px){
  .fx-card-stage{top:32%}
  .fx-card{width:clamp(72px,22vw,96px)}
  .fx-card-lower{bottom:10%;padding:7px 10px;gap:5px 8px}
  .fx-card-kind{font-size:11px;padding:3px 7px}
  .fx-card-name{font-size:18px}
  .fx-card-team{font-size:11px}
  .fx-lower{max-width:96vw}
  .fx-lower-name{font-size:20px;padding:8px 10px}
  .fx-lower-team{font-size:12px;padding:8px 10px 8px 4px}
  .fx-sub-card{min-width:88vw}
}
`;
