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

// Voz preferida: narrador MASCULINO en español. La Web Speech API no expone el
// género, así que se reconoce por los nombres de voz habituales por plataforma
// (Windows: Álvaro/Raúl/Pablo; iOS/macOS: Jorge/Diego/Carlos/Juan; Android
// suele dar solo "Google español", neutra). Si ninguna pista cuadra, se evita
// al menos caer en una voz femenina conocida; el resto del carácter "narrador"
// lo aportan tono (pitch grave) y ritmo. El salto de calidad real vendrá con
// el provider ElevenLabs (placeholder más abajo).
const MALE_VOICE_RE =
  /\b(álvaro|alvaro|jorge|diego|carlos|juan|pablo|ra[uú]l|andr[eé]s|enrique|miguel|tom[aá]s|gonzalo|male|hombre)\b/i;
const FEMALE_VOICE_RE =
  /\b(m[oó]nica|paulina|helena|laura|luc[ií]a|elvira|sabina|marisol|isabela|camila|francisca|soledad|ximena|female|mujer)\b/i;

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
    const spanish = voices.filter((v) => /^es/i.test(v.lang));
    // Orden: masculina conocida > desconocida > femenina conocida; a igualdad,
    // acento latino primero (es-419/MX/US/AR/CO), como antes.
    const genderRank = (v: SpeechSynthesisVoice) =>
      MALE_VOICE_RE.test(v.name) ? 0 : FEMALE_VOICE_RE.test(v.name) ? 2 : 1;
    const accentRank = (v: SpeechSynthesisVoice) =>
      /es[-_](419|MX|US|AR|CO)/i.test(v.lang) ? 0 : 1;
    this.voice =
      [...spanish].sort(
        (a, b) => genderRank(a) - genderRank(b) || accentRank(a) - accentRank(b),
      )[0] ?? null;
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
    // Tono de narrador deportivo: voz algo más grave y ritmo vivo.
    u.rate = 1.12;
    u.pitch = 0.9;
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
