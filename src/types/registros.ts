// ZonaMundial — Tipos para registros históricos absolutos del Mundial

import type { SeleccionRef } from "./edicion";

export interface GoleadorAllTime {
  nombre: string;
  seleccion: SeleccionRef;
  goles: number;
  mundiales: number[];
}

export interface JugadorMundiales {
  nombre: string;
  seleccion: SeleccionRef;
  mundiales: number;
  anios: number[];
}

export interface JugadorPartidos {
  nombre: string;
  seleccion: SeleccionRef;
  partidos: number;
}

export interface SeleccionHistorica {
  pais: string;
  iso2: string;
  iso3: string;
  participaciones: number;
  campeonatos: number;
  subcampeonatos: number;
  podios: number;
  puntos: number;
  anios: number[];
}

export interface DTMundiales {
  nombre: string;
  mundiales: number;
  selecciones: string[];
}

export interface CampeonDual {
  nombre: string;
  campeonJugador: number[];
  campeonDT: number[];
  seleccion: string;
}

export interface RecordAbsoluto {
  categoria: string;
  titulo: string;
  valor: string;
  detalle: string;
  vigente: boolean;
}

export interface RegistrosHistoricos {
  actualizadoEn: string;
  topGoleadoresAllTime: GoleadorAllTime[];
  masMundialesJugados: JugadorMundiales[];
  masPartidosJugados: JugadorPartidos[];
  tablaHistoricaSelecciones: SeleccionHistorica[];
  dtMasMundiales: DTMundiales[];
  campeonesComoJugadorYDT: CampeonDual[];
  recordsAbsolutos: RecordAbsoluto[];
  fuentes: { nombre: string; url: string }[];
}
