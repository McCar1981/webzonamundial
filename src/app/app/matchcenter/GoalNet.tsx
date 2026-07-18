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
  /** Código de bandera (ISO-2) de la selección que marca, p.ej. "es". */
  flag?: string;
  player?: string;
  ownGoal?: boolean;
  /** Cambia en cada gol: fuerza el remontaje y reinicia la animación. */
  fxKey: number;
}

const TOTAL = 7.0; // s — la ACCIÓN (balón+impacto) es ágil (~2.6s) pero el rótulo
                   // ¡GOOOL!+país+goleador se MANTIENE legible hasta ~7s (se desmonta a ~7.3s)

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
  colorHex: string,
) {
  // setStyle interpreta el hex como sRGB (color-managed): el tinte del equipo
  // sale fiel (el constructor numérico lo trataría como lineal y desviaría el color).
  const TEAM = new THREE.Color();
  try { TEAM.setStyle(colorHex || "#c9a84c"); } catch { TEAM.setStyle("#c9a84c"); }
  // componentes sRGB 0-255 del color (para los gradientes dibujados en canvas 2D)
  const _h = (colorHex || "#c9a84c").replace("#", "");
  const _f = _h.length === 3 ? _h.split("").map((c) => c + c).join("") : _h;
  const _n = parseInt(_f, 16);
  const SR = (_n >> 16) & 255, SG = (_n >> 8) & 255, SB = _n & 255;
  const W0 = canvas.clientWidth || window.innerWidth;
  const H0 = canvas.clientHeight || window.innerHeight;

  // En móviles densos (dpr alto) capamos el pixelRatio y quitamos el antialias
  // (el propio downsampling ya suaviza): baja mucho el fillrate sin verse peor.
  const dpr = window.devicePixelRatio || 1;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 1.5, alpha: false });
  renderer.setPixelRatio(Math.min(dpr, 1.5));
  renderer.setSize(W0, H0, false);
  // GRADO de imagen: tone mapping cinematográfico (rolloff de altas luces) →
  // los blancos de la red y los destellos dejan de quemarse "sucio" = look de
  // plató de TV en vez de "render plano". Coste GPU cero (curva del pase actual).
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080d); // OPACO desde el frame 0
  scene.fog = new THREE.Fog(0x05080d, 6, 13);

  const cam = new THREE.PerspectiveCamera(42, W0 / H0, 0.1, 100);
  cam.position.set(0, 1.9, 5.4);
  cam.lookAt(0, -0.55, -0.6);

  scene.add(new THREE.AmbientLight(0x4a587f, 0.55));
  const key = new THREE.PointLight(0xffffff, 60, 22); key.position.set(2.6, 3.4, 3.0); scene.add(key);
  const rim = new THREE.PointLight(0xbcd0ff, 30, 24); rim.position.set(-3, -1.5, 3.2); scene.add(rim);
  const teamLight = new THREE.PointLight(0xffffff, 42, 26); teamLight.color.copy(TEAM); teamLight.position.set(0, 0.2, 3.0); scene.add(teamLight);

  const disposables: Array<{ dispose: () => void }> = [];

  // fondo: plano oscuro con aro del color del equipo (profundidad de la portería)
  function bgTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const x = c.getContext("2d")!;
    const r = SR, gg = SG, b = SB;
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

  // textura de RED realista: cada cuerda con SOMBRA + cuerpo + BRILLO (aspecto de
  // soga 3D) y NUDOS en los cruces, sobre una membrana muy tenue.
  function netTexture() {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, S, S);
    x.fillStyle = "rgba(255,255,255,0.09)"; x.fillRect(0, 0, S, S);   // membrana más visible
    x.lineCap = "round";
    const diag = (dir: 1 | -1) => {
      for (let i = -1; i <= 2; i++) {
        const x0 = i * S, y0 = dir > 0 ? 0 : S, x1 = (i + 1) * S, y1 = dir > 0 ? S : 0;
        x.strokeStyle = "rgba(0,0,0,0.35)"; x.lineWidth = 10;                // sombra (cuerda gruesa)
        x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
        x.strokeStyle = "rgba(234,240,252,0.97)"; x.lineWidth = 6;           // cuerpo
        x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
        x.strokeStyle = "rgba(255,255,255,1)"; x.lineWidth = 2.4;            // brillo
        x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      }
    };
    diag(1); diag(-1);
    // NUDOS gruesos en los cruces de la rejilla diamante (con sombra + brillo)
    for (const [kx, ky] of [[0, 0], [S, 0], [0, S], [S, S], [S / 2, S / 2]]) {
      x.fillStyle = "rgba(0,0,0,0.3)"; x.beginPath(); x.arc(kx, ky, 6.5, 0, Math.PI * 2); x.fill();
      x.fillStyle = "rgba(255,255,255,0.98)"; x.beginPath(); x.arc(kx, ky, 5, 0, Math.PI * 2); x.fill();
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  const netTex = netTexture();
  // 48×48 = 2401 vértices (antes 96×96 = 9409): ~4× menos trabajo de deformación
  // y de normales por frame. El embudo+onda son de baja frecuencia → se ve igual.
  const NW = 15, NH = 15, SX = 48, SY = 48;
  netTex.repeat.set(NW / 0.55, NH / 0.55); // celdas algo más grandes → la red "rombo" se lee mejor
  const netGeo = new THREE.PlaneGeometry(NW, NH, SX, SY);
  // Lambert (no PBR): fragment shader mucho más barato a pantalla completa con
  // varias luces; para una red tintada difusa el resultado es casi idéntico.
  const netMat = new THREE.MeshLambertMaterial({
    map: netTex, transparent: true, side: THREE.DoubleSide,
    color: new THREE.Color(0xffffff).lerp(TEAM, 0.1),
    emissive: TEAM.clone().multiplyScalar(0.06),
    alphaTest: 0.02, depthWrite: false,
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
  const ballGeo = new THREE.PlaneGeometry(800 / 600, 1); // imagen 800×600 (4:3): plano con su MISMA proporción → balón REDONDO (no ovalado)
  const ballMat = new THREE.MeshBasicMaterial({ map: ballTex, transparent: true, depthWrite: false });
  const ball = new THREE.Mesh(ballGeo, ballMat); scene.add(ball);
  ball.renderOrder = 5; // SIEMPRE delante de la red (la red lo frena, no lo traspasa)
  disposables.push(ballGeo, ballMat, ballTex);

  // ESTELA/COMETA del balón en vuelo: sprites "fantasma" de la imagen rezagados
  // (motion-blur de cámara lenta) + RIM aditivo detrás (lo separa del fondo, deja
  // de parecer pegatina). Reutilizan ballTex/glowTex → cero VRAM nueva.
  const TRAIL = 4;
  const ghostOpa = [0.34, 0.22, 0.13, 0.07];
  const ghosts: InstanceType<typeof THREE.Sprite>[] = [];
  for (let i = 0; i < TRAIL; i++) {
    const gm = new THREE.SpriteMaterial({ map: ballTex, transparent: true, depthWrite: false, opacity: 0 });
    const g = new THREE.Sprite(gm); g.renderOrder = 4; g.visible = false; scene.add(g);
    ghosts.push(g); disposables.push(gm);
  }
  const ballRimMat = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0xffffff).lerp(TEAM, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const ballRim = new THREE.Sprite(ballRimMat); ballRim.renderOrder = 4; scene.add(ballRim);
  disposables.push(ballRimMat);

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
  const confetti = new THREE.Points(confGeo, confMat); confetti.position.set(0, -0.1, 0.3); confetti.renderOrder = 6; scene.add(confetti);
  disposables.push(confGeo, confMat, confTexture);

  // FLASHES de cámaras del estadio en las gradas del fondo: puntos blancos que
  // parpadean (destellos secos), con PICO en el gol → "estadio vivo" de TV.
  const FN = 140;
  const flashGeo = new THREE.BufferGeometry();
  const flashPos = new Float32Array(FN * 3);
  const flashCol = new Float32Array(FN * 3);
  const flashFreq: number[] = [], flashPhase: number[] = [];
  for (let i = 0; i < FN; i++) {
    flashPos[i * 3] = (Math.random() - 0.5) * 16;        // ancho de las gradas
    flashPos[i * 3 + 1] = 0.6 + Math.random() * 7.2;     // por encima de la portería
    flashPos[i * 3 + 2] = -3.6 - Math.random() * 0.6;    // detrás de la red, delante del fondo
    flashFreq.push(6 + Math.random() * 14);
    flashPhase.push(Math.random() * Math.PI * 2);
  }
  flashGeo.setAttribute("position", new THREE.BufferAttribute(flashPos, 3));
  flashGeo.setAttribute("color", new THREE.BufferAttribute(flashCol, 3));
  const flashMat = new THREE.PointsMaterial({ size: 0.14, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const stadiumFlash = new THREE.Points(flashGeo, flashMat); scene.add(stadiumFlash);
  disposables.push(flashGeo, flashMat);
  function flashesAt(t: number) {
    const td = t - IMPACT;
    const env = td < 0 ? 0.16 + 0.1 * clamp01(t / 0.6) : Math.max(0.12, Math.exp(-1.1 * td));
    const col = flashGeo.attributes.color.array as Float32Array;
    for (let i = 0; i < FN; i++) {
      const s = Math.sin(t * flashFreq[i] + flashPhase[i]);
      const v = (s > 0 ? Math.pow(s, 16) : 0) * env; // destello seco
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
    }
    flashGeo.attributes.color.needsUpdate = true;
  }

  const IMPACT = 1.0; // s (escena corta: impacto pronto, todo termina ~2.6s)
  const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  function confettiAt(t: number) {
    const td = t - IMPACT;
    if (td < 0) { confMat.opacity = 0; return; }
    confMat.opacity = Math.max(0, 1 - td / 1.7);
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
    if (td < 0) return;   // antes del impacto la red está PLANA (z=0): nada que hacer
    if (td > 1.8) return; // ya asentada: la red mantiene su forma; no recalcular durante el hold de ~7s
    const st = netState(td);
    const pos = netGeo.attributes.position.array as Float32Array;
    const sig2 = 2 * 1.15 * 1.15, omega = 13.0, kWave = 2.6, sigR2 = 2 * 2.6 * 2.6;
    for (let i = 0; i < vcount; i++) {
      const x = basePos[i * 3], y = basePos[i * 3 + 1];
      const r = Math.hypot(x, y + 0.12);
      pos[i * 3 + 2] = -st.pocket * Math.exp(-(r * r) / sig2)
        + st.ripple * Math.sin(omega * td - r * kWave) * Math.exp(-(r * r) / sigR2) * 0.5;
    }
    netGeo.attributes.position.needsUpdate = true;
    netGeo.computeVertexNormals();
  }
  // Pose del balón (posición + escala) en CUALQUIER instante → la reusan el balón
  // y los fantasmas de la estela (calculados a tiempos rezagados).
  const TBALL = 0.32;
  function ballPose(tt: number): { vis: boolean; x: number; y: number; z: number; s: number } {
    if (tt < TBALL) return { vis: false, x: 0, y: 0, z: 0, s: 1 };
    if (tt <= IMPACT) {
      const e = easeOut(clamp01((tt - TBALL) / (IMPACT - TBALL)));
      return { vis: true, x: 0, y: -1.6 + 1.6 * e, z: 5.0 + (0.2 - 5.0) * e, s: 1.7 + (0.95 - 1.7) * e }; // CENTRO, z=0.2 DELANTE
    }
    const p = clamp01((tt - IMPACT) / 0.45);
    return { vis: true, x: 0, y: -0.12 * p, z: 0.2 - 0.05 * p, s: 0.95 + (0.8 - 0.95) * p }; // la red lo FRENA, queda delante
  }
  function ballAt(t: number) {
    const po = ballPose(t);
    ball.visible = po.vis;
    if (po.vis) {
      ball.position.set(po.x, po.y, po.z); ball.scale.set(po.s, po.s, 1);
      if (t <= IMPACT) {
        const p = clamp01((t - TBALL) / (IMPACT - TBALL));
        ballMat.opacity = clamp01(p * 5); ball.rotation.z = -p * 7.5;
      } else {
        ballMat.opacity = 1; ball.rotation.z = -7.5 - clamp01((t - IMPACT) / 0.45) * 1.4;
      }
    }
    // ESTELA: fantasmas rezagados, solo en VUELO (antes del impacto)
    const flight = t > TBALL && t < IMPACT;
    for (let i = 0; i < TRAIL; i++) {
      const g = ghosts[i];
      const gp = flight ? ballPose(t - (i + 1) * 0.045) : { vis: false, x: 0, y: 0, z: 0, s: 1 };
      g.visible = gp.vis;
      if (gp.vis) {
        g.position.set(gp.x, gp.y, gp.z);
        g.scale.set(gp.s * (4 / 3), gp.s, 1);
        ghosts[i].material.opacity = ghostOpa[i] * clamp01((t - 0.42) / 0.18);
      }
    }
    // RIM aditivo detrás del balón: sutil en vuelo, florece al llegar a la red
    const td = t - IMPACT;
    if (po.vis) {
      ballRim.position.set(po.x, po.y, po.z - 0.12);
      ballRim.scale.set(po.s * 2.4, po.s * 2.4, 1);
      ballRimMat.opacity = flight ? 0.18 * clamp01((t - 0.42) / 0.2) : (td >= 0 ? 0.12 + 0.45 * Math.exp(-1.6 * td) : 0);
    } else {
      ballRimMat.opacity = 0;
    }
  }
  function revealNet(t: number) {
    const e = easeOut(clamp01(t / 0.35));
    net.scale.setScalar(0.2 + 0.8 * e); netMat.opacity = e;
  }
  function glowAt(t: number) {
    const td = t - IMPACT;
    if (td < 0) { glowMat.opacity = 0; return; }
    // bloom fake: floración corta y brillante en el impacto + halo que decae
    glowMat.opacity = Math.min(1.15, 1.0 * Math.exp(-3.2 * td) + 0.6 * Math.exp(-18 * td));
    const s = 6 + 6 * (1 - Math.exp(-4 * td)); glow.scale.set(s, s, 1);
  }

  function render(t: number) {
    revealNet(t); deform(t); ballAt(t); glowAt(t); confettiAt(t); flashesAt(t);
    // red con VIDA durante el hold: balanceo suave del CONJUNTO (cuelga por
    // gravedad). Barato: no recalcula vértices/normales, solo mueve la malla.
    if (t > 1.5) {
      const s = t - 1.5;
      net.rotation.z = 0.014 * Math.sin(s * 1.7) * Math.exp(-0.1 * s);
      net.position.x = 0.025 * Math.sin(s * 1.15);
    }
    const td = t - IMPACT;
    teamLight.intensity = 42 + (td > 0 && td < 0.16 ? 130 : 0);
    // bloom fake: la RED "florece" (emissive pulsado) justo en el impacto
    netMat.emissive.copy(TEAM).multiplyScalar(0.06 + (td > 0 ? 0.55 * Math.exp(-12 * td) : 0));
    // cámara: dolly + KICK del balonazo (handheld) + micro-handheld en el hold
    const dolly = 5.4 - 0.55 * easeOut(clamp01(td / 0.8));
    let kx = 0, ky = 0, roll = 0;
    if (td > 0 && td < 0.45) {
      const k = Math.exp(-9 * td);
      kx = 0.18 * k * Math.sin(60 * td);
      ky = -0.12 * k * Math.cos(55 * td);
      roll = 0.035 * k * Math.sin(60 * td);
    }
    const hand = t > 0.5 ? 0.012 : 0; // micro-handheld muy sutil durante el hold
    cam.position.set(kx + hand * Math.sin(t * 1.7), ky + hand * Math.cos(t * 1.3), dolly);
    cam.lookAt(0, -0.55, -0.6);
    cam.rotation.z += roll;
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
  animation:gnet3dFade 7.2s ease forwards}
@keyframes gnet3dFade{0%{opacity:1}88%{opacity:1}100%{opacity:0}}
.gnet3d-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
/* FOGONAZO de exposición a pantalla completa en el impacto (mezcla screen sobre
   el canvas) — el frame-firma del gol. Sincronizado con IMPACT (~1.0s). */
.gnet3d-flash{position:absolute;inset:0;mix-blend-mode:screen;opacity:0;
  background:radial-gradient(circle at 50% 46%, rgba(255,255,255,.98), rgba(var(--teamrgb),.5) 50%, rgba(var(--teamrgb),0) 78%);
  animation:gnet3dFlash .34s ease-out 1s both}
@keyframes gnet3dFlash{0%{opacity:0}18%{opacity:.85}100%{opacity:0}}
.gnet3d-text{position:absolute;left:50%;top:62%;transform:translate(-50%,-50%);width:94vw;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
/* ¡GOOOL! METÁLICO (relleno cromado con banda del color del equipo) + barrido. */
.gnet3d-word{font-weight:900;letter-spacing:2px;line-height:.84;font-size:clamp(54px,16vw,140px);
  background-image:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.95) 50%,transparent 58%),linear-gradient(180deg,#fff 0%,#dfe6f2 40%,rgb(var(--teamrgb)) 52%,#dfe6f2 64%,#fff 100%);
  background-size:280% 100%,100% 100%;background-position:160% 0,0 0;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;
  filter:drop-shadow(0 6px 22px rgba(0,0,0,.6)) drop-shadow(0 0 28px rgba(var(--teamrgb),.85));
  opacity:0;animation:gnet3dWord .6s cubic-bezier(.2,1.5,.35,1) 1.1s both, gnet3dSheen 1.1s ease 1.5s both}
@keyframes gnet3dWord{0%{transform:scale(.35) rotate(-4deg);opacity:0}60%{transform:scale(1.12) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes gnet3dSheen{0%{background-position:160% 0,0 0}100%{background-position:-60% 0,0 0}}
/* LOWER-THIRD estilo retransmisión: barra con franja del color del equipo,
   bandera ONDEANDO + país (grande) + goleador, entrada por WIPE. */
.gnet3d-lower{position:relative;display:inline-flex;align-items:center;gap:12px;padding:9px 18px 9px 16px;border-radius:11px;overflow:hidden;
  background:linear-gradient(180deg, rgba(20,17,10,.93), rgba(10,9,6,.93));border:1px solid rgba(255,255,255,.14);box-shadow:0 14px 40px rgba(0,0,0,.55);
  opacity:0;animation:gnet3dBar .55s cubic-bezier(.2,1,.3,1) 1.4s both}
.gnet3d-lower::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:rgb(var(--teamrgb));box-shadow:0 0 14px rgba(var(--teamrgb),.9)}
.gnet3d-flag{width:clamp(34px,8vw,52px);height:auto;border-radius:4px;box-shadow:0 3px 10px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.5);transform-origin:center;animation:gnet3dWave 2.6s ease-in-out 1.7s infinite}
.gnet3d-info{display:flex;flex-direction:column;align-items:flex-start;line-height:1.05}
.gnet3d-country{font-weight:900;font-size:clamp(22px,6vw,42px);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.6);letter-spacing:.5px}
.gnet3d-scorer{font-weight:800;font-size:clamp(11px,3vw,16px);letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.82)}
@keyframes gnet3dBar{0%{opacity:0;clip-path:inset(0 100% 0 0);transform:translateY(10px)}100%{opacity:1;clip-path:inset(0 0 0 0);transform:translateY(0)}}
@keyframes gnet3dWave{0%,100%{transform:skewX(0) scaleY(1)}25%{transform:skewX(-5deg) scaleY(.97)}50%{transform:skewX(3deg) scaleY(1.03)}75%{transform:skewX(-2deg) scaleY(.99)}}
/* LETTERBOX cinematográfico (entra y se queda; se va con el contenedor). */
.gnet3d-lb{position:absolute;left:0;right:0;height:0;background:#04060b;z-index:1;animation:gnet3dLetter .6s ease .2s forwards}
.gnet3d-lb.t{top:0}.gnet3d-lb.b{bottom:0}
@keyframes gnet3dLetter{0%{height:0}100%{height:5.5vh}}
/* Fallback (sin WebGL/three): el rótulo no espera al delay de la animación 3D. */
.gnet3d--nofx .gnet3d-word{animation-delay:.1s}
.gnet3d--nofx .gnet3d-lower{animation-delay:.25s}
@media (prefers-reduced-motion: reduce){
  .gnet3d{animation:gnet3dFade 6.5s ease forwards!important}
  .gnet3d-flash,.gnet3d-lb{display:none!important}
  .gnet3d-flag{animation:none!important}
  .gnet3d-word{animation:gnet3dWord .3s ease 0s both!important}
  .gnet3d-lower{animation:gnet3dBar .3s ease 0s both!important}
}
`;

export default function GoalNet({ teamName, color, flag, player, ownGoal, fxKey }: GoalNetProps) {
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
    window.addEventListener("resize", onResize); // antes del await: no se pierde una rotación durante la carga
    // Si no hay WebGL/three, adelanta el texto del fallback (no esperar al delay de la animación 3D).
    const showFallbackText = () => {
      canvasRef.current?.closest(".gnet3d")?.classList.add("gnet3d--nofx");
    };

    (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        showFallbackText();
        return; // sin three → fallback CSS (fondo+texto)
      }
      if (disposed || !canvasRef.current) return;
      try {
        sceneObj = buildScene(THREE, canvasRef.current, color);
      } catch {
        showFallbackText();
        return; // WebGL no disponible → fallback
      }
      // SPEED-RAMP (bullet-time): congela ~110ms el instante del impacto. Es un
      // remapeo escalar del reloj → lo HEREDAN red, balón, confeti y deformación
      // sin tocarlos. FREEZE_AT debe coincidir con IMPACT (1.0) de la escena.
      const FREEZE_AT = 1.0, FREEZE_DUR = 0.11;
      const warp = (rt: number) =>
        rt <= FREEZE_AT ? rt : rt < FREEZE_AT + FREEZE_DUR ? FREEZE_AT : rt - FREEZE_DUR;
      const loop = (ts: number) => {
        if (disposed) return;
        if (startTs == null) startTs = ts;
        const rt = (ts - startTs) / 1000;
        try { sceneObj!.render(Math.min(warp(rt), TOTAL)); } catch { /* noop */ }
        if (rt < TOTAL + FREEZE_DUR + 0.15) raf = requestAnimationFrame(loop);
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

  const scorer = ownGoal
    ? `En propia${player ? ` · ${lastName(player)}` : ""}`
    : (player ? lastName(player) : "");
  const teamrgb = hexRgb01(color).map((v) => Math.round(v * 255)).join(",");

  const node = (
    <div key={fxKey} className="gnet3d" style={{ ["--teamrgb" as string]: teamrgb }}>
      <style>{GN_CSS}</style>
      <canvas ref={canvasRef} className="gnet3d-cv" />
      <div className="gnet3d-flash" />
      <div className="gnet3d-lb t" />
      <div className="gnet3d-lb b" />
      <div className="gnet3d-text">
        <div className="gnet3d-word">{ownGoal ? "¡GOL!" : "¡GOOOL!"}</div>
        <div className="gnet3d-lower">
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="gnet3d-flag" src={`https://flagcdn.com/w320/${flag}.png`} alt="" />
          )}
          <div className="gnet3d-info">
            <span className="gnet3d-country">{teamName}</span>
            {scorer && <span className="gnet3d-scorer">{scorer}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, target);
}
