// src/lib/modo-carrera/vestuario.ts
//
// VIDA DE VESTUARIO (lógica pura, sin React ni servidor). Entre partido y partido
// "salta" un evento de vestuario: una situación humana real de una selección
// (un suplente descontento, una filtración a la prensa, el debate veteranía vs
// cantera, la fatiga de una concentración larga…). El DT elige cómo gestionarlo y
// esa decisión impacta DE VERDAD en:
//   · la MORAL del vestuario (que alimenta el rendimiento del equipo), y
//   · la CONFIANZA de la federación y los stats de reputación del DT.
//
// Cada opción es un arquetipo de gestión con un `id` fijo; los efectos numéricos
// viven en engine.ts (DECISION_EFFECTS), de modo que aquí solo se redacta la
// situación y se eligen los tonos que aplican. La decisión se resuelve con el
// mismo pipeline que las ruedas de prensa (applyDecision).
//
// Realismo (lo que pidió el usuario): TODO existe en el fútbol de selecciones. No
// hay mecánicas de club ni ofertas entre selecciones: solo gestión de grupo.

import type { NarrativeEntry } from "./types";
import { FANTASY_ROSTERS, type RosterPlayer } from "@/data/fantasy-rosters";

/** Probabilidad de que salte un evento de vestuario entre partidos. */
const VESTUARIO_CHANCE = 0.45;

type Choice = NonNullable<NarrativeEntry["choices"]>[number];

/** Contexto del momento de la carrera que da forma al evento de vestuario. */
export interface DressingRoomInfo {
  nationSlug: string | null;
  nationName: string;
  dtName: string;
  /** Moral actual del vestuario (0-100): condiciona qué situaciones surgen. */
  morale: number;
  /** Capitán designado (si lo hay), para personalizar algún evento. */
  captain?: string | null;
  /** Número de temporada y orden del próximo partido (para un id estable). */
  season: number;
  matchIdx: number;
}

// ─── Arquetipos de gestión (el `effect` es una pista; los números, en engine) ──
const dialogo = (label: string): Choice => ({
  id: "dialogo",
  label,
  effect: "Hablas las cosas: el grupo lo agradece y baja la tensión.",
});
const autoridad = (label: string): Choice => ({
  id: "autoridad",
  label,
  effect: "Impones tu ley: la federación lo respalda, el vestuario se tensa.",
});
const ceder = (label: string): Choice => ({
  id: "ceder",
  label,
  effect: "Cedes ante el jugador: ganas su moral, pierdes algo de autoridad.",
});
const unidad = (label: string): Choice => ({
  id: "unidad",
  label,
  effect: "Apelas a la unidad del grupo: sube la moral colectiva.",
});
const investigar = (label: string): Choice => ({
  id: "investigar",
  label,
  effect: "Cortas por lo sano: refuerzas la disciplina, enfrías el ambiente.",
});
const restar = (label: string): Choice => ({
  id: "restar",
  label,
  effect: "Le quitas hierro: el foco mediático se calma.",
});
const veterania = (label: string): Choice => ({
  id: "veterania",
  label,
  effect: "Tiras de oficio: prestigio y galones, menos savia nueva.",
});
const juventud = (label: string): Choice => ({
  id: "juventud",
  label,
  effect: "Apuestas por la cantera: ilusión y proyecto a futuro.",
});
const equilibrio = (label: string): Choice => ({
  id: "equilibrio",
  label,
  effect: "Mezclas veteranía y juventud: lectura táctica fina.",
});
const rotar = (label: string): Choice => ({
  id: "rotar",
  label,
  effect: "Das descanso: piernas frescas para lo que viene.",
});
const exigirFisico = (label: string): Choice => ({
  id: "exigir_fisico",
  label,
  effect: "Aprietas en los entrenos: más disciplina, grupo cansado.",
});
const motivar = (label: string): Choice => ({
  id: "motivar",
  label,
  effect: "Enciendes la charla: la moral se dispara.",
});

/** Un nombre del roster de la selección (o un genérico si no hay datos). */
function pickPlayer(nationSlug: string | null, fallback: string): string {
  const roster: RosterPlayer[] = FANTASY_ROSTERS[nationSlug ?? ""] ?? [];
  if (roster.length === 0) return fallback;
  return roster[Math.floor(Math.random() * roster.length)].name;
}

type Scenario = (info: DressingRoomInfo) => { body: string; choices: Choice[] };

// ─── Catálogo de situaciones de vestuario ────────────────────────────────────
const SCENARIOS: Scenario[] = [
  // 1) Estrella suplente descontenta.
  (info) => {
    const p = pickPlayer(info.nationSlug, "una de tus figuras");
    return {
      body: `${p} ha pedido hablar contigo a solas: no entiende por qué no es titular y avisa de que su paciencia tiene límite. ${info.dtName}, ¿cómo lo gestionas?`,
      choices: [
        dialogo(`Le explico cara a cara su rol y lo que espero de él.`),
        autoridad(`Aquí decido yo. El que no esté, que se gane el puesto.`),
        ceder(`Le garantizo minutos en el próximo partido.`),
      ],
    };
  },
  // 2) Filtración a la prensa desde el vestuario.
  (info) => ({
    body: `Salta una filtración: detalles de la última charla técnica de ${info.nationName} aparecen en la portada de un diario. El vestuario sospecha. ¿Qué haces?`,
    choices: [
      investigar(`Reúno al grupo y dejo claro que esto se acaba hoy.`),
      restar(`Le quito importancia en público: aquí no pasa nada.`),
      unidad(`Pido lealtad y cierro filas: somos una piña.`),
    ],
  }),
  // 3) Debate veteranía vs cantera.
  (info) => {
    const joven = pickPlayer(info.nationSlug, "una promesa");
    return {
      body: `El debate divide al cuerpo técnico: tirar de los veteranos de siempre o dar galones a ${joven} y la nueva hornada de ${info.nationName}. ¿Por quién apuestas?`,
      choices: [
        veterania(`Por los de siempre: la experiencia gana torneos.`),
        juventud(`Por la cantera: es el momento de la nueva generación.`),
        equilibrio(`Mezclo ambos: veteranía con sangre joven.`),
      ],
    };
  },
  // 4) Fatiga acumulada en una concentración larga.
  (info) => ({
    body: `El grupo llega cargado tras semanas de concentración y la enfermería avisa de sobrecargas. ${info.dtName}, ¿cómo manejas la fatiga del vestuario?`,
    choices: [
      rotar(`Doy descanso y rotación: lo primero es llegar frescos.`),
      exigirFisico(`Aprieto en los entrenos: se gana sufriendo.`),
      motivar(`Charla y desconexión: les recargo la cabeza.`),
    ],
  }),
  // 5) Tensión por el brazalete de capitán.
  (info) => {
    const líder = info.captain?.trim() || pickPlayer(info.nationSlug, "un referente");
    return {
      body: `Hay ruido por el liderazgo: parte del vestuario reclama más voz para ${líder} y otros piden mano dura. ¿Cómo ordenas la jerarquía?`,
      choices: [
        dialogo(`Hablo con los referentes y reparto responsabilidades.`),
        autoridad(`Dejo claro quién manda: el orden lo pongo yo.`),
        unidad(`Refuerzo el grupo por encima de los nombres.`),
      ],
    };
  },
  // 6) Promesa juvenil que reclama minutos.
  (info) => {
    const joven = pickPlayer(info.nationSlug, "el chaval del momento");
    return {
      body: `${joven} es la sensación del país y la prensa pide a gritos verlo de inicio en ${info.nationName}. El chico está ansioso. ¿Qué decides?`,
      choices: [
        juventud(`Lo lanzo de titular: es su momento.`),
        veterania(`Aún no: que se foguee desde el banquillo.`),
        dialogo(`Hablo con él: paciencia y trabajo, su hora llegará.`),
      ],
    };
  },
];

/**
 * Construye un evento de vestuario para el periodo entre partidos, o null si esta
 * vez no salta. La moral inclina la baraja: con la moral baja es más probable que
 * surja un conflicto (suplente, filtración, liderazgo); con la moral alta, debates
 * de gestión más "tranquilos" (cantera, fatiga, promesa).
 */
export function buildDressingRoomEvent(info: DressingRoomInfo): NarrativeEntry | null {
  if (Math.random() >= VESTUARIO_CHANCE) return null;

  // Sesgo por moral: <55 tiende a conflictos; el resto, a debates de gestión.
  const conflictIdx = [0, 1, 4];
  const calmIdx = [2, 3, 5];
  const pickFrom = info.morale < 55 && Math.random() < 0.7 ? conflictIdx : calmIdx;
  const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  const { body, choices } = SCENARIOS[idx](info);

  return {
    id: `vestuario-s${info.season}-${info.matchIdx}`,
    kind: "evento",
    body,
    createdAt: new Date().toISOString(),
    chosen: null,
    choices,
  };
}
