// src/lib/anon-id.ts
//
// Identidad anónima estable por dispositivo (cliente), para features que no
// exigen login: presencia/reacciones del "Estadio en Vivo". Mismo formato que
// el anonId de Trivia ("anon-<alfanumérico>"), persistido en localStorage.

const KEY = "zm_anon";

export function ensureAnonId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = "anon-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage bloqueado (modo privado): id efímero de sesión.
    return "anon-" + Math.random().toString(36).slice(2);
  }
}
