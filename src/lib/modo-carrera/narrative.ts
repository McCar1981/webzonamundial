// src/lib/modo-carrera/narrative.ts
//
// Narrativa viva (Pilar 6) — capa COMPARTIDA cliente/servidor.
//   · NarrativeContext: el contexto del DT que alimenta la generación.
//   · templateEntry(): generador determinista por PLANTILLAS, sin IA. Sirve de
//     respaldo (cuando no hay ANTHROPIC_API_KEY o la API falla) y de modo
//     offline para el invitado.
//
// El generador con Claude vive en narrative-generator.ts (solo servidor) y, ante
// cualquier fallo, recurre a templateEntry() — así la narrativa NUNCA se rompe.

import type { NarrativeEntry, NarrativeKind } from "./types";

/** Tipos de narrativa que el usuario puede solicitar manualmente. */
export const REQUESTABLE_KINDS: NarrativeKind[] = ["briefing", "titular", "rueda_prensa"];

/** Contexto resuelto del DT (nombres ya legibles, no slugs/ids). */
export interface NarrativeContext {
  dtName: string;
  /** Etiqueta legible de la filosofía (p.ej. "Posesión"). */
  philosophyName: string;
  /** Nombre legible de la selección dirigida. */
  nationName: string;
  overall: number;
  season: number;
  morale: number;
  reputationTotal: number;
}

/** Id único para una entrada de narrativa. */
export function narrativeId(kind: NarrativeKind): string {
  return `nar_${kind}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Plantillas por tipo ─────────────────────────────────────────────────────
function briefingBody(c: NarrativeContext): string {
  return pick([
    `Semana de trabajo en la concentración de ${c.nationName}. ${c.dtName} insiste en su idea — ${c.philosophyName.toLowerCase()} — mientras el grupo afina detalles. Moral del vestuario: ${c.morale}/100.`,
    `${c.dtName} reúne al cuerpo técnico de ${c.nationName}. El mensaje es claro: ${c.philosophyName.toLowerCase()} y máxima concentración. Con un overall de ${c.overall}, el proyecto sigue creciendo.`,
    `Día de pizarra en ${c.nationName}. ${c.dtName} repasa los conceptos de su ${c.philosophyName.toLowerCase()} de cara a los próximos compromisos de la temporada ${c.season}.`,
  ]);
}

function titularBody(c: NarrativeContext): string {
  return pick([
    `"${c.dtName} pone a ${c.nationName} a soñar con su ${c.philosophyName.toLowerCase()}"`,
    `"${c.nationName} encuentra rumbo: la mano de ${c.dtName} se nota"`,
    `"Temporada ${c.season}: ${c.dtName} quiere dejar huella en ${c.nationName}"`,
    `"La prensa rinde a ${c.dtName}: su idea convence en ${c.nationName}"`,
  ]);
}

function ruedaPrensaBody(c: NarrativeContext): string {
  return pick([
    `La sala de prensa está llena. Un periodista pregunta a ${c.dtName} por las aspiraciones de ${c.nationName} esta temporada. ¿Qué respondes?`,
    `Micrófonos encendidos. Te piden que definas el objetivo de ${c.nationName}. ${c.dtName}, ¿cuál es tu mensaje?`,
    `La presión mediática aprieta. Un reportero cuestiona tu ${c.philosophyName.toLowerCase()}. ¿Cómo lo defiendes?`,
  ]);
}

function eventoBody(c: NarrativeContext): string {
  return pick([
    `Debate de convocatoria en ${c.nationName}: la prensa cuestiona a quién deja fuera ${c.dtName}. La lista siempre genera ruido.`,
    `Pequeña polémica en el entorno de ${c.nationName}. ${c.dtName} deberá gestionar el ruido externo con mano firme.`,
    `Buenas noticias en la cantera de ${c.nationName}: una joven promesa irrumpe con fuerza en los entrenamientos y pide paso a la absoluta.`,
  ]);
}

/** Opciones para una rueda de prensa (decisión del usuario). */
function ruedaPrensaChoices(): NonNullable<NarrativeEntry["choices"]> {
  return [
    { id: "calma", label: "Pido calma: foco en el trabajo, partido a partido.", effect: "Disciplina del grupo, presión contenida." },
    { id: "ambicion", label: "Prometo pelear por todo. Vamos a por el título.", effect: "Impacto mediático alto, expectativas por las nubes." },
    { id: "cantera", label: "Confío en los jóvenes: la cantera es el futuro.", effect: "Ilusión y respaldo a la base." },
  ];
}

/**
 * Genera una entrada de narrativa POR PLANTILLA (sin IA). Determinista en forma,
 * con ligera variación de texto. Es el respaldo universal del generador con IA.
 */
export function templateEntry(kind: NarrativeKind, c: NarrativeContext): NarrativeEntry {
  const base: NarrativeEntry = {
    id: narrativeId(kind),
    kind,
    body: "",
    createdAt: new Date().toISOString(),
    chosen: null,
  };

  switch (kind) {
    case "briefing":
      return { ...base, body: briefingBody(c) };
    case "titular":
      return { ...base, body: titularBody(c) };
    case "rueda_prensa":
      return { ...base, body: ruedaPrensaBody(c), choices: ruedaPrensaChoices() };
    case "evento":
    default:
      return { ...base, body: eventoBody(c) };
  }
}
