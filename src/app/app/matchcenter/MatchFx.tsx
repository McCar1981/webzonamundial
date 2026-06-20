"use client";

// Capa de EFECTOS de transmisión, superpuesta a la cancha como overlay HTML
// (no SVG): así disponemos de degradados, brillo, desenfoque, 3D y tipografía
// con calidad "broadcast". Cada efecto se monta con una `key` única, de modo que
// sus animaciones CSS arrancan de cero al dispararse el evento.

import { useMemo } from "react";
import { lastName } from "@/lib/match-center/names";
import type { MatchMeta } from "@/lib/match-center/types";

export interface GoalPulse { side: "home" | "away"; key: number; player?: string; ownGoal?: boolean }
export interface CardFx { side: "home" | "away"; color: string; key: number; player?: string }
export interface SubFx { side: "home" | "away"; key: number; playerOut?: string; playerIn?: string }

interface Props {
  meta: MatchMeta;
  goalPulse?: GoalPulse | null;
  cardFx?: CardFx | null;
  subFx?: SubFx | null;
}

const GOLD = "#c9a84c", GOLD2 = "#e8d48b";

// Balón (regla del proyecto: SVG, nunca emojis).
const BallSvg = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10.2" fill="#fff" stroke="#0b1825" strokeWidth="1.1" />
    <path d="M12 6.6l3.4 2.5-1.3 4h-4.2l-1.3-4L12 6.6z" fill="#0b1825" />
    <path d="M12 1.9l1.7 3.2M3.9 8.3l3.2.7M5.9 18.8l2.1-2.9M18.1 18.8l-2.1-2.9M20.1 9l-3.2.7" stroke="#0b1825" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// Iconos SVG (regla del proyecto: nunca emojis). Heredan el color con currentColor.
const SwapIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowUpIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowDownIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M12 19l-6-6M12 19l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function MatchFx({ meta, goalPulse, cardFx, subFx }: Props) {
  const confetti = useMemo(() => {
    if (!goalPulse) return [];
    // Lluvia de confeti DOMINADA por el color de la selección que celebra
    // (estilo Google), con acentos claros para contraste.
    const team = goalPulse.side === "home" ? meta.home.color : meta.away.color;
    const palette = [team, team, team, lighten(team), "#ffffff", GOLD, GOLD2];
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // % del ancho
      drift: (Math.random() * 2 - 1) * 14, // vw de deriva lateral al caer
      rot: Math.random() * 1080 - 540,
      color: palette[i % palette.length],
      dur: 2.2 + Math.random() * 1.4,
      delay: Math.random() * 0.7,
      w: 6 + Math.random() * 7,
      h: 9 + Math.random() * 9,
      round: Math.random() < 0.35,
    }));
  }, [goalPulse, meta.home.color, meta.away.color]);

  const goalTeam = goalPulse ? (goalPulse.side === "home" ? meta.home : meta.away) : null;
  const cardTeam = cardFx ? (cardFx.side === "home" ? meta.home : meta.away) : null;
  const isRed = cardFx?.color === "#ef4444" || cardFx?.color === "#f04444";
  const subTeam = subFx ? (subFx.side === "home" ? meta.home : meta.away) : null;

  return (
    <div style={overlay}>
      <style>{CSS}</style>

      {/* ---------- GOL (estilo Google: lluvia de confeti del color del equipo) ---------- */}
      {goalPulse && goalTeam && (
        <div
          key={`g-${goalPulse.key}`}
          className="fxg"
          style={{ ["--team" as string]: goalTeam.color, ["--teamrgb" as string]: hexToRgb(goalTeam.color).join(",") }}
        >
          <div className="fxg-glow" />
          <div className="fxg-rain">
            {confetti.map((c) => (
              <span
                key={c.id}
                className="fxg-piece"
                style={{
                  left: `${c.left}%`,
                  background: c.color,
                  width: c.w,
                  height: c.h,
                  borderRadius: c.round ? "50%" : 2,
                  animationDuration: `${c.dur}s`,
                  animationDelay: `${c.delay}s`,
                  ["--drift" as string]: `${c.drift}vw`,
                  ["--r" as string]: `${c.rot}deg`,
                }}
              />
            ))}
          </div>
          <div className="fxg-center">
            <div className="fxg-badge">
              <span className="fxg-ball"><BallSvg size={34} /></span>
              <span className="fxg-word">{goalPulse.ownGoal ? "¡GOL!" : "¡GOOOL!"}</span>
            </div>
            <div className="fxg-lower">
              <span className="fxg-bar" />
              <span className="fxg-name">{goalPulse.ownGoal ? goalTeam.name : (goalPulse.player ? lastName(goalPulse.player) : "Gol")}</span>
              <span className="fxg-sub">{goalPulse.ownGoal ? `En propia${goalPulse.player ? ` · ${lastName(goalPulse.player)}` : ""}` : goalTeam.name}</span>
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
              <span className="fx-sub-icon"><SwapIcon size={14} /></span> CAMBIO
              <span className="fx-sub-team" style={{ color: subTeam.color }}>{subTeam.name}</span>
            </div>
            <div className="fx-sub-row">
              <span className="fx-sub-in"><ArrowUpIcon size={12} /> ENTRA</span>
              <b>{subFx.playerIn ? lastName(subFx.playerIn) : "—"}</b>
            </div>
            <div className="fx-sub-row">
              <span className="fx-sub-out"><ArrowDownIcon size={12} /> SALE</span>
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
.fxg,.fx-card-wrap,.fx-sub{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}

/* ---- GOL (estilo Google: lluvia de confeti del color de la seleccion) ---- */
.fxg{overflow:hidden}
@keyframes fxLowerIn{0%{transform:translateY(34px) scale(.92);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
.fxg-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%, rgba(var(--teamrgb),.5), rgba(var(--teamrgb),0) 60%);animation:fxgGlow 2.8s ease forwards}
@keyframes fxgGlow{0%{opacity:0}10%{opacity:1}70%{opacity:.7}100%{opacity:0}}
.fxg-rain{position:absolute;inset:0;pointer-events:none}
.fxg-piece{position:absolute;top:-12vh;opacity:0;will-change:transform;animation-name:fxgFall;animation-timing-function:cubic-bezier(.3,.25,.45,1);animation-fill-mode:forwards}
@keyframes fxgFall{0%{opacity:0;transform:translateY(0) translateX(0) rotate(0)}8%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateY(124vh) translateX(var(--drift)) rotate(var(--r))}}
.fxg-center{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:14px}
.fxg-badge{display:flex;align-items:center;gap:12px}
.fxg-ball{display:inline-flex;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));animation:fxgBall .7s cubic-bezier(.2,1.4,.3,1) both}
@keyframes fxgBall{0%{transform:translateY(-46px) scale(.4) rotate(-120deg);opacity:0}60%{transform:translateY(6px) scale(1.12) rotate(12deg);opacity:1}100%{transform:translateY(0) scale(1) rotate(0)}}
.fxg-word{font-weight:900;letter-spacing:2px;line-height:.9;font-size:clamp(46px,11vw,120px);
  background:linear-gradient(100deg, var(--team) 0%, #fff 26%, var(--team) 52%, #fff 78%, var(--team) 100%);background-size:260% 100%;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;
  filter:drop-shadow(0 8px 20px rgba(0,0,0,.6));animation:fxgPop .6s cubic-bezier(.2,1.5,.35,1) both, fxgShine 1.8s linear .3s infinite}
@keyframes fxgPop{0%{transform:scale(.3) rotate(-6deg);opacity:0}60%{transform:scale(1.12) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes fxgShine{0%{background-position:0 0}100%{background-position:260% 0}}
.fxg-lower{display:flex;align-items:center;gap:0;max-width:94vw;background:linear-gradient(90deg, rgba(11,24,37,.96), rgba(11,24,37,.82));border:1px solid rgba(255,255,255,.14);border-radius:12px;overflow:hidden;backdrop-filter:blur(4px);box-shadow:0 14px 36px rgba(0,0,0,.5);animation:fxLowerIn .5s .25s cubic-bezier(.2,1,.3,1) both}
.fxg-bar{width:8px;align-self:stretch;background:var(--team)}
.fxg-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:10px 14px;font-size:clamp(18px,3.4vw,30px);font-weight:900;color:#fff}
.fxg-sub{padding:10px 16px 10px 6px;font-size:clamp(12px,2vw,16px);font-weight:800;color:var(--team);text-transform:uppercase;letter-spacing:1px;white-space:nowrap}

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
.fx-sub-icon{color:#c9a84c;display:inline-flex;align-items:center}
.fx-sub-team{margin-left:auto;letter-spacing:1px}
.fx-sub-row{display:flex;align-items:center;gap:10px;font-size:clamp(15px,2.6vw,20px);padding:3px 0}
.fx-sub-row b{font-weight:900;color:#fff}
.fx-sub-in{font-size:12px;font-weight:900;color:#22c55e;min-width:78px;display:inline-flex;align-items:center;gap:4px}
.fx-sub-out{font-size:12px;font-weight:900;color:#ef4444;min-width:78px;display:inline-flex;align-items:center;gap:4px}
.fx-sub-dim{color:#8a94b0!important}

@media (prefers-reduced-motion: reduce){
  .fx-card,.fx-card-sheen{animation-duration:.01s!important}
  .fxg-rain{display:none}
  .fxg-word{animation:fxgPop .4s ease both!important}
  .fxg-glow{animation-duration:.5s!important}
  .fxg-ball{animation-duration:.4s!important}
}
@media (max-width:640px){
  .fx-card-stage{top:32%}
  .fx-card{width:clamp(72px,22vw,96px)}
  .fx-card-lower{bottom:10%;padding:7px 10px;gap:5px 8px}
  .fx-card-kind{font-size:11px;padding:3px 7px}
  .fx-card-name{font-size:18px}
  .fx-card-team{font-size:11px}
  .fxg-lower{max-width:96vw}
  .fxg-name{font-size:20px;padding:8px 10px}
  .fxg-sub{font-size:12px;padding:8px 10px 8px 4px}
  .fx-sub-card{min-width:88vw}
}
`;
