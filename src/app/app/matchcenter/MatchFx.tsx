"use client";

// Capa de EFECTOS de transmisión, superpuesta a la cancha como overlay HTML
// (no SVG): así disponemos de degradados, brillo, desenfoque, 3D y tipografía
// con calidad "broadcast". Cada efecto se monta con una `key` única, de modo que
// sus animaciones CSS arrancan de cero al dispararse el evento.

import { lastName } from "@/lib/match-center/names";
import type { MatchMeta } from "@/lib/match-center/types";
import GoalNet from "./GoalNet";

export interface GoalPulse { side: "home" | "away"; key: number; player?: string; ownGoal?: boolean }
export interface CardFx { side: "home" | "away"; color: string; key: number; player?: string }
export interface SubFx { side: "home" | "away"; key: number; playerOut?: string; playerIn?: string }

interface Props {
  meta: MatchMeta;
  goalPulse?: GoalPulse | null;
  cardFx?: CardFx | null;
  subFx?: SubFx | null;
}

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
  const goalTeam = goalPulse ? (goalPulse.side === "home" ? meta.home : meta.away) : null;
  const cardTeam = cardFx ? (cardFx.side === "home" ? meta.home : meta.away) : null;
  const isRed = cardFx?.color === "#ef4444" || cardFx?.color === "#f04444";
  const subTeam = subFx ? (subFx.side === "home" ? meta.home : meta.away) : null;

  return (
    <div style={overlay}>
      <style>{CSS}</style>

      {/* ---------- GOL: celebración a PANTALLA COMPLETA (red de portería, estilo Google).
           Se renderiza vía portal a <body> dentro de GoalNet. ---------- */}
      {goalPulse && goalTeam && (
        <GoalNet
          teamName={goalTeam.name}
          color={goalTeam.color}
          flag={goalTeam.flag}
          player={goalPulse.player}
          ownGoal={goalPulse.ownGoal}
          fxKey={goalPulse.key}
        />
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
.fx-card-wrap,.fx-sub{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
@keyframes fxLowerIn{0%{transform:translateY(34px) scale(.92);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}

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
}
@media (max-width:640px){
  .fx-card-stage{top:32%}
  .fx-card{width:clamp(72px,22vw,96px)}
  .fx-card-lower{bottom:10%;padding:7px 10px;gap:5px 8px}
  .fx-card-kind{font-size:11px;padding:3px 7px}
  .fx-card-name{font-size:18px}
  .fx-card-team{font-size:11px}
  .fx-sub-card{min-width:88vw}
}
`;
