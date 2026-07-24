// src/lib/draft/types.ts
// Tipos del minijuego Draft Mundial

export type DraftPosicion =
  | "GOL"
  | "LD"
  | "ZAG"
  | "LE"
  | "VOL"
  | "MEI"
  | "EXT"
  | "CA"
  | "PD"
  | "PI"
  | "MCD";

export interface DraftJugador {
  id: string;
  nombre: string;
  posicion: DraftPosicion;
  fuerza: number; // 1-99
  perfil: string;
}

export interface DraftPlantilla {
  id: string;
  seleccion: string;
  seleccionSlug: string;
  year: number;
  torneo: string;
  bandera: string;
  jugadores: DraftJugador[];
  /** Slug de la liga a la que pertenece el club (Draft de Ligas). Vacío en las
   *  plantillas históricas de selecciones. Sesga el draft a la liga del usuario. */
  liga?: string | null;
}

export type FormacionKey =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "4-2-4"
  | "3-5-2"
  | "5-3-2"
  | "4-5-1"
  | "3-4-3";

export type Estilo = "defensivo" | "equilibrado" | "ofensivo";
export type Modo = "clasico" | "almanaque" | "contrarreloj";

export interface DraftResultado {
  puntaje: number;
  calificacion: "Bronce" | "Plata" | "Oro" | "Platino" | "Leyenda";
  fuerza: number;
  balance: number;
  coherencia: number;
  bonusEstilo: number;
}

export interface JugadorSeleccionado extends DraftJugador {
  seleccion: string;
  year: number;
  bandera: string;
}

export type GamePhase =
  | "setup"      // elegir formación, estilo, modo
  | "tirada"     // mostrar botón de tirar
  | "seleccion"  // mostrar plantilla y elegir jugador
  | "simulacion" // animación de simulación
  | "campana"    // simular Mundial (grupos + eliminatorias)
  | "resultado"; // mostrar carta / resultado final

export interface GameState {
  phase: GamePhase;
  formacion: FormacionKey;
  estilo: Estilo;
  modo: Modo;
  posicionesPendientes: DraftPosicion[];
  equipo: Partial<Record<DraftPosicion, JugadorSeleccionado>>;
  tiradaActual: {
    plantilla: DraftPlantilla;
    posicion: DraftPosicion;
  } | null;
  resultado: DraftResultado | null;
  tiempoRestante: number | null; // para modo contrarreloj
}
