// src/lib/match-center/sound.ts
//
// Motor de SONIDO del Match Center, sintetizado con Web Audio API (sin archivos
// de audio, cero peso, cero red). Produce efectos de partido: rugido de gol con
// bocina, silbato del árbitro, pitido de tarjeta y campanilla de cambio.
//
// Igual que la voz, vive solo en el cliente. La interfaz es deliberadamente
// simple para poder cambiar la implementación (p.ej. muestras reales) más
// adelante sin tocar la UI.

type Ctx = AudioContext;

export interface MatchSound {
  available(): boolean;
  enabled(): boolean;
  setEnabled(on: boolean): void;
  /** Debe llamarse desde un gesto del usuario para desbloquear el audio. */
  resume(): void;
  goal(): void;
  whistle(long?: boolean): void;
  card(): void;
  sub(): void;
  save(): void;
  /** Arranca el murmullo continuo del público (ambiente). */
  startAmbient(): void;
  /** Ajusta la intensidad del ambiente 0..1 según el momentum. */
  setAmbient(level: number): void;
  /** Detiene el ambiente. */
  stopAmbient(): void;
}

class WebAudioSound implements MatchSound {
  private ctx: Ctx | null = null;
  private on = false;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambientSrc: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  available(): boolean {
    if (typeof window === "undefined") return false;
    return typeof (window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext) !== "undefined";
  }

  enabled(): boolean {
    return this.on;
  }

  setEnabled(on: boolean): void {
    this.on = on;
    if (on) this.resume();
  }

  resume(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  private ensure(): Ctx | null {
    if (this.ctx) return this.ctx;
    if (!this.available()) return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    // Buffer de ruido reutilizable (2 s) para la masa de público.
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return this.ctx;
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, glideTo?: number): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Rugido de público: ruido filtrado con envolvente de crecida. */
  private crowd(peak: number, attack: number, hold: number, release: number, when = 0): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t0 = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(420, t0);
    bp.frequency.linearRampToValueAtTime(900, t0 + attack);
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.setValueAtTime(peak, t0 + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + attack + hold + release + 0.05);
  }

  goal(): void {
    if (!this.on) return;
    // Rugido enorme + doble bocina de estadio.
    this.crowd(0.7, 0.25, 1.1, 1.4);
    this.blip(196, 0.5, "sawtooth", 0.28, 0.05, 200);
    this.blip(262, 0.5, "sawtooth", 0.26, 0.07);
    this.blip(196, 0.7, "sawtooth", 0.3, 0.62, 200);
    this.blip(330, 0.7, "sawtooth", 0.24, 0.64);
  }

  whistle(long = false): void {
    if (!this.on) return;
    const dur = long ? 0.7 : 0.32;
    // Silbato: dos tonos altos con leve trino.
    this.blip(2300, dur, "square", 0.14, 0, 2500);
    this.blip(3050, dur, "square", 0.09, 0, 3250);
  }

  card(): void {
    if (!this.on) return;
    this.blip(140, 0.18, "square", 0.22);
    this.blip(110, 0.22, "square", 0.18, 0.16);
  }

  sub(): void {
    if (!this.on) return;
    this.blip(880, 0.16, "sine", 0.16);
    this.blip(1320, 0.22, "sine", 0.14, 0.14);
  }

  save(): void {
    if (!this.on) return;
    this.crowd(0.28, 0.12, 0.18, 0.5);
  }

  startAmbient(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer || this.ambientSrc) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    lp.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.value = 0.04;
    src.connect(lp).connect(g).connect(this.master);
    src.start();
    this.ambientSrc = src;
    this.ambientGain = g;
  }

  setAmbient(level: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambientGain) return;
    const lv = Math.max(0, Math.min(1, level));
    // Base baja + crece con el momentum (intensidad de la jugada).
    const target = this.on ? 0.03 + lv * 0.13 : 0;
    this.ambientGain.gain.setTargetAtTime(target, ctx.currentTime, 0.6);
  }

  stopAmbient(): void {
    try {
      this.ambientSrc?.stop();
    } catch {
      /* ya detenido */
    }
    this.ambientSrc = null;
    this.ambientGain = null;
  }
}

class NoopSound implements MatchSound {
  available(): boolean { return false; }
  enabled(): boolean { return false; }
  setEnabled(): void {}
  resume(): void {}
  goal(): void {}
  whistle(): void {}
  card(): void {}
  sub(): void {}
  save(): void {}
  startAmbient(): void {}
  setAmbient(): void {}
  stopAmbient(): void {}
}

export function createSound(): MatchSound {
  if (typeof window === "undefined") return new NoopSound();
  const s = new WebAudioSound();
  return s.available() ? s : new NoopSound();
}
