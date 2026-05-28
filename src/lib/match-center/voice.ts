// src/lib/match-center/voice.ts
//
// Capa de VOZ (TTS) con providers intercambiables. Hoy: Web Speech API del
// navegador (gratis, voces en español). Cerca del Mundial se enchufa ElevenLabs
// implementando la misma interfaz VoiceProvider, sin tocar la UI.
//
// Uso desde el cliente: const speaker = createSpeaker(); speaker.speak("...").

export interface SpeakOptions {
  /** Prioridad alta = interrumpe lo que se esté diciendo (goles, finales). */
  priority?: boolean;
}

export interface VoiceProvider {
  readonly id: string;
  isAvailable(): boolean;
  speak(text: string, opts?: SpeakOptions): void;
  cancel(): void;
}

// --- Provider Web Speech API ---
class WebSpeechProvider implements VoiceProvider {
  readonly id = "web";
  private voice: SpeechSynthesisVoice | null = null;
  private picked = false;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private pickVoice() {
    if (this.picked || !this.isAvailable()) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return; // aún no cargadas
    // Preferimos español; latino si está disponible.
    this.voice =
      voices.find((v) => /es[-_](419|MX|US|AR|CO)/i.test(v.lang)) ||
      voices.find((v) => /^es/i.test(v.lang)) ||
      null;
    this.picked = true;
  }

  speak(text: string, opts?: SpeakOptions) {
    if (!this.isAvailable() || !text) return;
    this.pickVoice();
    const synth = window.speechSynthesis;
    if (opts?.priority) synth.cancel();
    // Evita backlog: si hay mucho en cola, prioriza lo nuevo.
    if (!opts?.priority && synth.speaking && synth.pending) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.lang = this.voice?.lang || "es-ES";
    u.rate = 1.08;
    u.pitch = 1.0;
    u.volume = 1.0;
    try {
      synth.speak(u);
    } catch {
      /* noop */
    }
  }

  cancel() {
    if (this.isAvailable()) window.speechSynthesis.cancel();
  }
}

// --- Provider ElevenLabs (placeholder para fase Mundial) ---
// Implementará VoiceProvider llamando a un endpoint /api/match-center/tts que
// haga streaming del audio de ElevenLabs. Mantiene la MISMA interfaz, así que
// activarlo es solo cambiar el provider en createSpeaker().
class NoopProvider implements VoiceProvider {
  readonly id = "noop";
  isAvailable() {
    return false;
  }
  speak() {
    /* noop */
  }
  cancel() {
    /* noop */
  }
}

export type VoiceProviderId = "web" | "elevenlabs";

export interface Speaker {
  enabled: boolean;
  provider: VoiceProvider;
  setEnabled(on: boolean): void;
  speak(text: string, opts?: SpeakOptions): void;
  cancel(): void;
  available(): boolean;
}

export function createSpeaker(providerId: VoiceProviderId = "web"): Speaker {
  let provider: VoiceProvider;
  if (providerId === "web") provider = new WebSpeechProvider();
  else provider = new NoopProvider(); // ElevenLabs: futuro

  const speaker: Speaker = {
    enabled: false,
    provider,
    setEnabled(on: boolean) {
      this.enabled = on;
      if (!on) provider.cancel();
    },
    speak(text: string, opts?: SpeakOptions) {
      if (!this.enabled) return;
      provider.speak(text, opts);
    },
    cancel() {
      provider.cancel();
    },
    available() {
      return provider.isAvailable();
    },
  };
  return speaker;
}
