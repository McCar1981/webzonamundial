"use client";

// Celebración de GOL en 3D (WebGL / Three.js). Cámara detrás de la portería:
//   1) la RED 3D aparece (malla de rombos con volumen, tintada del color de la
//      selección) sobre un fondo OPACO desde el primer frame (NUNCA se ve el
//      match center detrás);
//   2) el balón REAL entra en PRIMER PLANO (grande, de frente) y vuela HACIA la
//      red ALEJÁNDOSE (perspectiva = profundidad, no por un lateral);
//   3) al impactar, la RED SE HUNDE y ONDEA físicamente (embudo + onda radial
//      amortiguada) y el balón queda ANIDADO en el hueco;
//   4) destello del color del equipo + ¡GOOOL! + goleador.
// Three.js se carga por import() dinámico (code-split): solo pesa al haber gol.
// prefers-reduced-motion o WebGL no disponible → fallback estático (sin canvas).
// Portal a document.body para ocupar el viewport ENTERO.

import { useEffect, useRef, useState } from "react";
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

const TOTAL = 5.4; // s — duración de la animación 3D (la barra se desmonta a ~6.8s)

function hexRgb01(hex: string): [number, number, number] {
  const h = (hex || "#c9a84c").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0.79, 0.66, 0.3];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// ───────────────────────── escena 3D (Three.js) ─────────────────────────
// Devuelve { render(t), resize(), dispose() }. Toda la geometría/material/
// textura se libera en dispose() para no fugar memoria GPU al cambiar de gol.
function buildScene(
  THREE: typeof import("three"),
  canvas: HTMLCanvasElement,
  team: [number, number, number],
) {
  const TEAM = new THREE.Color(team[0], team[1], team[2]);
  const W0 = canvas.clientWidth || window.innerWidth;
  const H0 = canvas.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W0, H0, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080d); // OPACO desde el frame 0
  scene.fog = new THREE.Fog(0x05080d, 6, 13);

  const cam = new THREE.PerspectiveCamera(42, W0 / H0, 0.1, 100);
  cam.position.set(0, 1.9, 5.4);
  cam.lookAt(0, -0.55, -0.6);

  scene.add(new THREE.AmbientLight(0x4a587f, 0.55));
  const key = new THREE.PointLight(0xffffff, 60, 22); key.position.set(2.6, 3.4, 3.0); scene.add(key);
  const rim = new THREE.PointLight(0xbcd0ff, 30, 24); rim.position.set(-3, -1.5, 3.2); scene.add(rim);
  const teamLight = new THREE.PointLight(TEAM.getHex(), 42, 26); teamLight.position.set(0, 0.2, 3.0); scene.add(teamLight);

  const disposables: Array<{ dispose: () => void }> = [];

  // fondo: plano oscuro con aro del color del equipo (profundidad de la portería)
  function bgTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const x = c.getContext("2d")!;
    const r = (TEAM.r * 255) | 0, gg = (TEAM.g * 255) | 0, b = (TEAM.b * 255) | 0;
    const g = x.createRadialGradient(256, 250, 8, 256, 250, 330);
    g.addColorStop(0, "rgba(6,9,14,1)");
    g.addColorStop(0.42, `rgba(${(r * 0.55) | 0},${(gg * 0.5) | 0},${(b * 0.5) | 0},1)`);
    g.addColorStop(1, "rgba(3,5,9,1)");
    x.fillStyle = "#04070c"; x.fillRect(0, 0, 512, 512);
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }
  const bgGeo = new THREE.PlaneGeometry(40, 40);
  const bgMat = new THREE.MeshBasicMaterial({ map: bgTexture() });
  const bgPlane = new THREE.Mesh(bgGeo, bgMat); bgPlane.position.z = -4; scene.add(bgPlane);
  disposables.push(bgGeo, bgMat, bgMat.map!);

  // textura de RED (rombos) + membrana muy tenue (para sombrear el pliegue)
  function netTexture() {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, S, S);
    x.fillStyle = "rgba(255,255,255,0.06)"; x.fillRect(0, 0, S, S);
    x.strokeStyle = "rgba(255,255,255,0.95)"; x.lineWidth = 6; x.lineCap = "round";
    for (let i = -1; i <= 2; i++) {
      x.beginPath(); x.moveTo(i * S, 0); x.lineTo((i + 1) * S, S); x.stroke();
      x.beginPath(); x.moveTo(i * S, S); x.lineTo((i + 1) * S, 0); x.stroke();
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  const netTex = netTexture();
  const NW = 15, NH = 15, SX = 96, SY = 96;
  netTex.repeat.set(NW / 0.42, NH / 0.42);
  const netGeo = new THREE.PlaneGeometry(NW, NH, SX, SY);
  const netMat = new THREE.MeshStandardMaterial({
    map: netTex, transparent: true, side: THREE.DoubleSide,
    color: new THREE.Color(0xffffff).lerp(TEAM, 0.1),
    emissive: TEAM.clone().multiplyScalar(0.06),
    roughness: 0.55, metalness: 0, alphaTest: 0.02, depthWrite: false,
  });
  const net = new THREE.Mesh(netGeo, netMat); scene.add(net);
  disposables.push(netGeo, netMat, netTex);
  const basePos = (netGeo.attributes.position.array as Float32Array).slice();
  const vcount = netGeo.attributes.position.count;

  // halo aditivo del gol
  function radialTex() {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }
  const glowTex = radialTex();
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: TEAM, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const glow = new THREE.Sprite(glowMat); glow.scale.set(7, 7, 1); glow.position.set(0, 0, 0.4); scene.add(glow);
  disposables.push(glowMat, glowTex);

  // balón (billboard con la imagen real)
  const loader = new THREE.TextureLoader();
  const ballTex = loader.load("/img/matchcenter/balon.png");
  ballTex.colorSpace = THREE.SRGBColorSpace;
  const ballGeo = new THREE.PlaneGeometry(1, 1);
  const ballMat = new THREE.MeshBasicMaterial({ map: ballTex, transparent: true, depthWrite: false });
  const ball = new THREE.Mesh(ballGeo, ballMat); scene.add(ball);
  disposables.push(ballGeo, ballMat, ballTex);

  // confeti de celebración (color de la selección + blanco + dorado)
  const CN = 160;
  const confGeo = new THREE.BufferGeometry();
  const confPos = new Float32Array(CN * 3);
  const confCol = new Float32Array(CN * 3);
  const confVel: Array<{ x: number; y: number; z: number }> = [];
  const confBase: Array<{ x: number; y: number; z: number }> = [];
  const white = new THREE.Color(0xffffff), gold = new THREE.Color(0xffd76a);
  for (let i = 0; i < CN; i++) {
    const ang = Math.random() * Math.PI * 2, sp = 2.5 + Math.random() * 4.5;
    confVel.push({ x: Math.cos(ang) * sp * 0.7, y: 2.5 + Math.random() * 4.5, z: 1 + Math.random() * 2.5 });
    confBase.push({ x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 0.8, z: 0.2 });
    const c = Math.random() < 0.5 ? TEAM : (Math.random() < 0.5 ? white : gold);
    confCol[i * 3] = c.r; confCol[i * 3 + 1] = c.g; confCol[i * 3 + 2] = c.b;
    confPos[i * 3] = confBase[i].x; confPos[i * 3 + 1] = confBase[i].y; confPos[i * 3 + 2] = confBase[i].z;
  }
  confGeo.setAttribute("position", new THREE.BufferAttribute(confPos, 3));
  confGeo.setAttribute("color", new THREE.BufferAttribute(confCol, 3));
  const confCanvas = document.createElement("canvas"); confCanvas.width = confCanvas.height = 32;
  const ccx = confCanvas.getContext("2d")!; ccx.fillStyle = "#fff"; ccx.fillRect(6, 4, 20, 24);
  const confTexture = new THREE.CanvasTexture(confCanvas);
  const confMat = new THREE.PointsMaterial({ size: 0.42, map: confTexture, vertexColors: true, transparent: true, depthWrite: false, opacity: 0 });
  const confetti = new THREE.Points(confGeo, confMat); confetti.position.set(0, -0.1, 0.3); scene.add(confetti);
  disposables.push(confGeo, confMat, confTexture);

  const IMPACT = 1.45;
  const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  function confettiAt(t: number) {
    const td = t - IMPACT;
    if (td < 0) { confMat.opacity = 0; return; }
    confMat.opacity = Math.max(0, 1 - td / 2.6);
    const p = confGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < CN; i++) {
      const v = confVel[i], b = confBase[i];
      p[i * 3] = b.x + v.x * td;
      p[i * 3 + 1] = b.y + v.y * td - 4.4 * td * td; // gravedad
      p[i * 3 + 2] = b.z + v.z * td * 0.4;
    }
    confGeo.attributes.position.needsUpdate = true;
  }

  function netState(td: number) {
    if (td < 0) return { pocket: 0, ripple: 0 };
    const decay = Math.exp(-2.4 * td);
    const pocket = 0.9 + 2.1 * decay * Math.cos(8.5 * td);
    const ripple = 1.5 * decay;
    return { pocket, ripple };
  }
  function deform(t: number) {
    const td = t - IMPACT;
    const st = netState(td);
    const pos = netGeo.attributes.position.array as Float32Array;
    const sig2 = 2 * 1.15 * 1.15, omega = 13.0, kWave = 2.6, sigR2 = 2 * 2.6 * 2.6;
    for (let i = 0; i < vcount; i++) {
      const x = basePos[i * 3], y = basePos[i * 3 + 1];
      const r = Math.hypot(x, y + 0.12);
      let z = 0;
      if (td > 0) {
        z -= st.pocket * Math.exp(-(r * r) / sig2);
        z += st.ripple * Math.sin(omega * td - r * kWave) * Math.exp(-(r * r) / sigR2) * 0.5;
      }
      pos[i * 3 + 2] = z;
    }
    netGeo.attributes.position.needsUpdate = true;
    netGeo.computeVertexNormals();
  }
  function ballAt(t: number) {
    const tStart = 0.55;
    if (t < tStart) { ball.visible = false; return; }
    ball.visible = true;
    if (t <= IMPACT) {
      const p = clamp01((t - tStart) / (IMPACT - tStart)), e = easeOut(p);
      ball.position.set(0, -1.6 + 1.6 * e, 5.0 + (0.05 - 5.0) * e);
      const s = 1.7 + (0.95 - 1.7) * e; ball.scale.set(s, s, 1);
      ballMat.opacity = clamp01(p * 5); ball.rotation.z = -p * 7.5;
    } else {
      const p = clamp01((t - IMPACT) / 0.7);
      ball.position.set(0, -0.15 * p, 0.05 + (-0.55 - 0.05) * p);
      const s = 0.95 + (0.62 - 0.95) * p; ball.scale.set(s, s, 1);
      ball.rotation.z = -7.5 - p * 2.2; ballMat.opacity = 1;
    }
  }
  function revealNet(t: number) {
    const e = easeOut(clamp01(t / 0.55));
    net.scale.setScalar(0.2 + 0.8 * e); netMat.opacity = e;
  }
  function glowAt(t: number) {
    const td = t - IMPACT;
    if (td < 0) { glowMat.opacity = 0; return; }
    glowMat.opacity = 0.9 * Math.exp(-3.2 * td);
    const s = 6 + 6 * (1 - Math.exp(-4 * td)); glow.scale.set(s, s, 1);
  }

  function render(t: number) {
    revealNet(t); deform(t); ballAt(t); glowAt(t); confettiAt(t);
    teamLight.intensity = 42 + (t > IMPACT && t < IMPACT + 0.16 ? 130 : 0);
    // dolly: empuje suave de cámara hacia la red en el impacto (energía)
    cam.position.z = 5.4 - 0.55 * easeOut(clamp01((t - IMPACT) / 1.2));
    cam.lookAt(0, -0.55, -0.6);
    renderer.render(scene, cam);
  }
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  function dispose() {
    for (const d of disposables) { try { d.dispose(); } catch { /* noop */ } }
    try { renderer.dispose(); } catch { /* noop */ }
    try { renderer.forceContextLoss(); } catch { /* noop */ }
  }
  return { render, resize, dispose };
}

const GN_CSS = `
.gnet3d{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;
  background:radial-gradient(circle at 50% 44%, rgba(var(--teamrgb),.18), #05080d 62%), #05080d;
  animation:gnet3dFade 6.6s ease forwards}
@keyframes gnet3dFade{0%{opacity:1}86%{opacity:1}100%{opacity:0}}
.gnet3d-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
.gnet3d-text{position:absolute;left:50%;top:63%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
.gnet3d-word{font-weight:900;letter-spacing:2px;line-height:.84;font-size:clamp(54px,16vw,140px);color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.65),0 0 34px rgba(var(--teamrgb),.95);opacity:0;animation:gnet3dWord .7s cubic-bezier(.2,1.5,.35,1) 1.85s both}
@keyframes gnet3dWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.gnet3d-name{font-weight:900;font-size:clamp(22px,5.5vw,40px);color:#fff;text-shadow:0 3px 14px rgba(0,0,0,.65);opacity:0;animation:gnet3dUp .6s ease 2.2s both}
.gnet3d-sub{font-weight:800;font-size:clamp(12px,3vw,18px);letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.92);opacity:0;animation:gnet3dUp .6s ease 2.35s both}
@keyframes gnet3dUp{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}
@media (prefers-reduced-motion: reduce){
  .gnet3d{animation:gnet3dFade 4.5s ease forwards!important}
  .gnet3d-word{animation:gnet3dWord .3s ease 0s both!important}
  .gnet3d-name,.gnet3d-sub{animation:gnet3dUp .3s ease 0s both!important}
}
`;

export default function GoalNet({ teamName, color, player, ownGoal, fxKey }: GoalNetProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setTarget(document.body);
  }, []);

  useEffect(() => {
    if (!target) return;
    if (typeof window !== "undefined" && window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // fallback: solo fondo opaco + texto (sin WebGL)
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;
    let startTs: number | null = null;
    let sceneObj: { render: (t: number) => void; resize: () => void; dispose: () => void } | null = null;
    const onResize = () => { if (sceneObj) sceneObj.resize(); };

    (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return; // sin three → fallback CSS (fondo+texto)
      }
      if (disposed || !canvasRef.current) return;
      try {
        sceneObj = buildScene(THREE, canvasRef.current, hexRgb01(color));
      } catch {
        return; // WebGL no disponible → fallback
      }
      window.addEventListener("resize", onResize);
      const loop = (ts: number) => {
        if (disposed) return;
        if (startTs == null) startTs = ts;
        const t = (ts - startTs) / 1000;
        try { sceneObj!.render(Math.min(t, TOTAL)); } catch { /* noop */ }
        if (t < TOTAL + 0.15) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (sceneObj) sceneObj.dispose();
    };
  }, [target, fxKey, color]);

  if (!target) return null;

  const name = ownGoal ? teamName : player ? lastName(player) : "Gol";
  const sub = ownGoal ? `En propia${player ? ` · ${lastName(player)}` : ""}` : teamName;
  const teamrgb = hexRgb01(color).map((v) => Math.round(v * 255)).join(",");

  const node = (
    <div key={fxKey} className="gnet3d" style={{ ["--teamrgb" as string]: teamrgb }}>
      <style>{GN_CSS}</style>
      <canvas ref={canvasRef} className="gnet3d-cv" />
      <div className="gnet3d-text">
        <div className="gnet3d-word">{ownGoal ? "¡GOL!" : "¡GOOOL!"}</div>
        <div className="gnet3d-name">{name}</div>
        <div className="gnet3d-sub">{sub}</div>
      </div>
    </div>
  );

  return createPortal(node, target);
}
