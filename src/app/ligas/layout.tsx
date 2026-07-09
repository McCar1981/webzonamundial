// src/app/ligas/layout.tsx
//
// Sistema visual "Palco bajo Focos" de Zona de Ligas. Un solo fichero inyecta
// los tokens y las clases zl-* que elevan las 5 pantallas: fondo atmosférico
// (foco dorado arriba, neblina fría abajo), superficies sólidas con sombra
// real, jerarquía tipográfica (Outfit 700-800, ya en el bundle) y feedback
// táctil. Todo CSS puro (transform/box-shadow/border = capa de compositor,
// sin reflow, sin librerías) y degradado con prefers-reduced-motion.
//
// Reglas de marca respetadas: dark-first, dorado #c9a84c SOLO acento, sin
// emojis, verde/rojo reservados a resultado/live, nada de blur pesado (el
// 87% de la audiencia es Android de gama media).
//
// El único !important está acotado a `.zl-scope main` para ganar al background
// inline que cada página trae de antes; el resto se adopta clase a clase.

const ZL_CSS = `
:root{
  --zl-bg:#070C16;
  --zl-bg-grad:
    radial-gradient(120% 68% at 50% -14%, rgba(201,168,76,.10), rgba(201,168,76,.03) 26%, transparent 56%),
    radial-gradient(100% 60% at 50% 116%, rgba(30,57,92,.30), transparent 60%),
    linear-gradient(180deg,#070C16 0%,#0A1120 55%,#0B1522 100%);

  --zl-surface-top:#14202F;
  --zl-surface-bot:#0D1826;
  --zl-raised:#122032;
  --zl-gold-wash:rgba(201,168,76,.09);

  --zl-hairline:rgba(255,255,255,.07);
  --zl-line:rgba(201,168,76,.16);
  --zl-line-strong:rgba(201,168,76,.30);
  --zl-lip:rgba(255,255,255,.06);
  --zl-sep:rgba(255,255,255,.055);
  --zl-gold-border:linear-gradient(135deg,rgba(201,168,76,.85),rgba(201,168,76,.12) 52%,rgba(232,212,139,.7));

  --zl-gold:#c9a84c; --zl-gold-hi:#e8d48b; --zl-gold-deep:#a8863a; --zl-gold-ink:#0A1422;

  --zl-text:#F5F8FD; --zl-body:#C7D2E0; --zl-muted:#94A3B8; --zl-dim:#64748B;

  --zl-live:#e2683c; --zl-live-glow:rgba(226,104,60,.5);
  --zl-win:#35c26e; --zl-loss:#e0574f; --zl-draw:#7A8699;

  --zl-sh-card:inset 0 1px 0 var(--zl-lip), 0 4px 14px -6px rgba(0,0,0,.5);
  --zl-sh-raised:inset 0 1px 0 rgba(255,255,255,.07), 0 14px 32px -14px rgba(0,0,0,.66);
  --zl-sh-hover:inset 0 1px 0 var(--zl-lip), 0 12px 26px -10px rgba(0,0,0,.6);
  --zl-glow-gold:0 0 24px rgba(201,168,76,.08);
  --zl-sh-cta:0 6px 16px -6px rgba(201,168,76,.45);

  --zl-r-sm:10px; --zl-r-md:14px; --zl-r-lg:18px; --zl-r-pill:999px;
  --zl-gap:28px; --zl-pad:16px;
  --zl-ease:cubic-bezier(.2,.7,.2,1);
}

/* ===== ATMOSFERA: el foco de palco. Se ve al instante en las 5 pantallas. ===== */
.zl-scope main{position:relative;isolation:isolate;background:var(--zl-bg-grad) !important;background-color:var(--zl-bg) !important}
.zl-scope main::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(120% 62% at 50% -12%, rgba(201,168,76,.06), transparent 55%),
    radial-gradient(95% 55% at 50% 114%, rgba(30,57,92,.22), transparent 62%)}
.zl-scope main>*{position:relative;z-index:1}

/* ===== TIPOGRAFIA: de "todo peso 500" a jerarquia editorial. ===== */
.zl-eyebrow{display:inline-flex;align-items:center;font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:var(--zl-gold);margin:0}
.zl-eyebrow::before{content:"";width:16px;height:2px;margin-right:9px;border-radius:2px;background:linear-gradient(90deg,var(--zl-gold),transparent)}
.zl-h1{margin:4px 0 2px;font-size:clamp(30px,6.2vw,40px);font-weight:800;letter-spacing:-0.9px;line-height:1.05;color:var(--zl-text)}
.zl-sub{margin:0;font-size:14px;font-weight:500;line-height:1.45;color:var(--zl-muted)}
.zl-h2{position:relative;margin:0 0 10px;padding-bottom:7px;font-size:19px;font-weight:700;letter-spacing:-0.2px;color:var(--zl-text)}
.zl-h2::after{content:"";position:absolute;left:0;bottom:0;width:28px;height:3px;border-radius:3px;background:linear-gradient(90deg,var(--zl-gold),var(--zl-gold-hi))}
.zl-h3{margin:0;font-size:16px;font-weight:600;color:var(--zl-text)}
.zl-label{font-size:11px;font-weight:600;letter-spacing:.9px;text-transform:uppercase;color:var(--zl-muted)}
.zl-num{font-variant-numeric:tabular-nums;font-weight:600}

/* ===== SUPERFICIES: de wireframe plano a panel solido con luz superior. ===== */
.zl-card{background:linear-gradient(180deg,var(--zl-surface-top),var(--zl-surface-bot));border:1px solid var(--zl-hairline);border-radius:var(--zl-r-md);box-shadow:var(--zl-sh-card);padding:var(--zl-pad)}
.zl-card--raised{background:linear-gradient(180deg,var(--zl-gold-wash),transparent 42%),var(--zl-raised);border:1px solid var(--zl-line);border-radius:var(--zl-r-lg);box-shadow:var(--zl-sh-raised);padding:var(--zl-pad)}
.zl-card--featured{position:relative;border:1px solid transparent;border-radius:var(--zl-r-lg);padding:var(--zl-pad);
  background:linear-gradient(180deg,rgba(201,168,76,.10),transparent 46%) padding-box,linear-gradient(var(--zl-raised),var(--zl-raised)) padding-box,var(--zl-gold-border) border-box;
  box-shadow:var(--zl-sh-raised),var(--zl-glow-gold)}
.zl-card--featured::before{content:"";position:absolute;top:0;left:16px;right:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.6),transparent)}
.zl-card--live{border-color:rgba(226,104,60,.42);box-shadow:var(--zl-sh-card),0 0 22px rgba(226,104,60,.10)}
.zl-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:var(--zl-r-pill);background:rgba(201,168,76,.10);border:1px solid var(--zl-line);font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--zl-muted)}
.zl-row{border-top:1px solid var(--zl-sep)}

/* ===== CTA dorado unico (antes repetido inline en 6+ sitios). ===== */
.zl-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;
  background:linear-gradient(135deg,var(--zl-gold),var(--zl-gold-hi));color:var(--zl-gold-ink);
  font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px;text-decoration:none;box-shadow:var(--zl-sh-cta)}
.zl-cta[disabled]{opacity:.7;cursor:default}

/* ===== MOTION: feedback tactil que antes no existia (87% movil). Solo compositor. ===== */
.zl-card,.zl-card--raised,.zl-card--featured,.zl-cta,.zl-chip{transition:transform .16s var(--zl-ease),box-shadow .16s var(--zl-ease),border-color .16s var(--zl-ease)}
@media (hover:hover){
  .zl-tap:hover{transform:translateY(-2px);box-shadow:var(--zl-sh-hover);border-color:var(--zl-line-strong)}
  .zl-tap:hover .zl-chev{transform:translateX(2px)}
  .zl-cta:hover{transform:translateY(-1px);filter:brightness(1.03)}
}
.zl-tap:active{transform:scale(.985);transition-duration:.09s}
.zl-cta:active{transform:scale(.97);box-shadow:0 3px 10px -6px rgba(201,168,76,.5);transition-duration:.09s}
.zl-chev{display:inline-block;transition:transform .16s var(--zl-ease)}

/* ===== LIVE: unico bucle infinito (anillo, sin blur). ===== */
@keyframes zl-live-ring{0%{box-shadow:0 0 0 0 var(--zl-live-glow)}70%{box-shadow:0 0 0 6px rgba(226,104,60,0)}100%{box-shadow:0 0 0 0 rgba(226,104,60,0)}}
.zl-live-dot{width:7px;height:7px;border-radius:999px;background:var(--zl-live);animation:zl-live-ring 1.8s ease-out infinite;flex-shrink:0}

/* ===== CELEBRACION one-shot: reclamar racha / ganar Futcoins (el 20% que importa). ===== */
@keyframes zl-reward-flash{0%{box-shadow:0 0 0 0 rgba(201,168,76,.55)}100%{box-shadow:0 0 0 14px rgba(201,168,76,0)}}
.zl-reward{animation:zl-reward-flash .6s ease-out}
@keyframes zl-gain-rise{0%{opacity:0;transform:translateY(6px)}30%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
.zl-gain{animation:zl-gain-rise 1.4s ease-out forwards;color:var(--zl-gold);font-weight:700}

/* ===== REDUCED MOTION: todo estatico, nada parpadea. ===== */
@media (prefers-reduced-motion: reduce){
  .zl-card,.zl-card--raised,.zl-card--featured,.zl-cta,.zl-chip,.zl-chev{transition:none}
  .zl-tap:hover,.zl-tap:active,.zl-cta:hover,.zl-cta:active{transform:none}
  .zl-live-dot,.zl-reward,.zl-gain{animation:none}
  .zl-gain{opacity:1;transform:none}
}
`;

export default function LigasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="zl-scope">
      <style dangerouslySetInnerHTML={{ __html: ZL_CSS }} />
      {children}
    </div>
  );
}
