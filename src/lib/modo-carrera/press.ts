// src/lib/modo-carrera/press.ts
//
// RUEDA DE PRENSA post-partido (lógica pura, sin React ni servidor). Tras un
// encuentro, "puede saltar" una rueda de prensa cuyo CONTENIDO depende del
// resultado real: goleada, derrota, eliminación, título… El DT elige el TONO de
// su respuesta y eso impacta de verdad en:
//   · la MORAL del vestuario (que alimenta el rendimiento del equipo), y
//   · la CONFIANZA de la federación/público (que decide la continuidad del DT).
//
// Las opciones son arquetipos de tono con un `id` fijo; los efectos numéricos de
// cada tono viven en engine.ts (DECISION_EFFECTS), de modo que aquí solo se
// redacta la pregunta y se eligen los tonos que aplican al contexto del partido.
//
// Diseño clave (lo que pidió el usuario): explotar la POLÉMICA. La opción
// soberbia/provocadora dispara la moral del grupo (mejor rendimiento) pero pasa
// factura en la confianza pública: riesgo alto, recompensa alta.

import type { NarrativeEntry, MatchOutcome, TournamentStage } from "./types";

/** Probabilidad de que salte una rueda de prensa tras un partido NO notable. */
const PRESS_CHANCE_NORMAL = 0.5;

type Choice = NonNullable<NarrativeEntry["choices"]>[number];

/** Datos del partido recién disputado que contextualizan la rueda de prensa. */
export interface PressInfo {
  outcome: MatchOutcome;
  gf: number;
  ga: number;
  stage: TournamentStage;
  opponentName: string;
  nationName: string;
  dtName: string;
  champion: boolean;
  eliminated: boolean;
  /** Número de temporada y orden del partido (para un id estable de la entrada). */
  season: number;
  matchIdx: number;
}

// ─── Arquetipos de tono (el `effect` es una pista vaga; los números, en engine) ──
const humildad = (label: string): Choice => ({
  id: "humildad",
  label,
  effect: "Vestuario sereno y federación tranquila.",
});
const euforia = (label: string): Choice => ({
  id: "euforia",
  label,
  effect: "Subes la moral y los focos; las expectativas crecen.",
});
const soberbia = (label: string): Choice => ({
  id: "soberbia",
  label,
  effect: "Enciendes al grupo, pero la federación se incomoda. Riesgo alto.",
});
const autocritica = (label: string): Choice => ({
  id: "autocritica",
  label,
  effect: "Asumes el golpe con madurez: la federación lo valora.",
});
const proteger = (label: string): Choice => ({
  id: "proteger",
  label,
  effect: "El vestuario se siente respaldado; tu imagen pública se resiente.",
});
const senalar = (label: string): Choice => ({
  id: "senalar",
  label,
  effect: "Exiges en público: la moral del grupo cae, pero marcas autoridad.",
});

/**
 * Construye la rueda de prensa que corresponde al resultado, o null si esta vez
 * no salta. Siempre salta tras partidos NOTABLES (eliminatoria, título,
 * eliminación, derrota o goleada); en fase de grupos rutinaria, al 50%.
 */
export function buildPressConference(info: PressInfo): NarrativeEntry | null {
  const margin = Math.abs(info.gf - info.ga);
  const notable =
    info.champion ||
    info.eliminated ||
    info.outcome === "D" ||
    margin >= 3 ||
    ["octavos", "cuartos", "semifinal", "final"].includes(info.stage);
  if (!notable && Math.random() >= PRESS_CHANCE_NORMAL) return null;

  let body: string;
  let choices: Choice[];

  if (info.champion) {
    body = `Sala de prensa a reventar tras la final. Te preguntan qué significa este título para ${info.nationName}. ${info.dtName}, ¿qué respondes?`;
    choices = [
      humildad("Este título es de los jugadores y de toda la afición. Yo solo sumo."),
      euforia("Lo hemos merecido. Hemos sido los mejores del torneo."),
      soberbia("Éramos los mejores y lo hemos demostrado. Que tiemblen los demás."),
    ];
  } else if (info.eliminated) {
    body = `Eliminación dolorosa ante ${info.opponentName}. La sala aprieta: ¿quién es el responsable? ${info.dtName}, ¿asumes el golpe?`;
    choices = [
      autocritica("La responsabilidad es mía. Los jugadores lo dieron todo."),
      proteger("Doy la cara por mi grupo. Nadie toca a mis jugadores."),
      senalar("Faltó actitud y entrega de algunos. Hay que decirlo claro."),
    ];
  } else if (info.outcome === "D") {
    body = `Derrota ante ${info.opponentName}. Te preguntan qué ha fallado en ${info.nationName}. ¿Cómo lo gestionas?`;
    choices = [
      autocritica("Asumo el error. Lo corregiremos cuanto antes."),
      proteger("No voy a señalar a nadie. Este equipo merece respeto."),
      senalar("Hubo jugadores que no estuvieron a la altura. Y lo saben."),
    ];
  } else if (info.outcome === "V" && margin >= 3) {
    body = `Goleada a ${info.opponentName} (${info.gf}-${info.ga}). Te preguntan si ${info.nationName} ya es favorita. ¿Qué dices?`;
    choices = [
      humildad("Pies en el suelo. Solo es un partido más."),
      euforia("Hemos dado un golpe sobre la mesa. Vamos con todo."),
      soberbia("Que tomen nota: vamos a comernos a todos. Esto empieza ahora."),
    ];
  } else if (info.outcome === "V") {
    body = `Triunfo ante ${info.opponentName}. ¿Cuál es tu mensaje al vestuario y a la afición?`;
    choices = [
      humildad("Paso a paso. Toca seguir trabajando con humildad."),
      euforia("Estamos en racha y se nota. Vamos a por más."),
    ];
  } else {
    body = `Empate ante ${info.opponentName}. Te piden lectura del partido. ${info.dtName}, ¿cómo lo ves?`;
    choices = [
      humildad("Un punto que suma. Hay que valorarlo y seguir."),
      soberbia("Merecíamos ganar. El rival vino a especular y aun así fuimos superiores."),
    ];
  }

  return {
    id: `prensa-s${info.season}-${info.matchIdx}`,
    kind: "rueda_prensa",
    body,
    createdAt: new Date().toISOString(),
    chosen: null,
    choices,
  };
}
