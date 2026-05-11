// ZonaMundial — Tipos para ediciones del Mundial 1930-2026
// Coinciden 1:1 con schemas/edicion.schema.json

export const CONFEDERACIONES = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'] as const;
export type Confederacion = (typeof CONFEDERACIONES)[number];

export const ERAS = [
  'pionera',
  'entreguerras',
  'posguerra',
  'clasica',
  'moderna',
  'global',
  'contemporanea',
] as const;
export type Era = (typeof ERAS)[number];

export const SISTEMAS_ELIMINATORIA = [
  'liguilla',
  '16vos',
  'octavos',
  'cuartos',
  'liguilla-final',
  'grupo-final',
] as const;
export type SistemaEliminatoria = (typeof SISTEMAS_ELIMINATORIA)[number];

export const CATEGORIAS_CURIOSIDAD = [
  'politica',
  'tragedia',
  'hito',
  'balon',
  'mascota',
  'estadio',
  'arbitro',
  'jugador',
  'misc',
] as const;
export type CategoriaCuriosidad = (typeof CATEGORIAS_CURIOSIDAD)[number];

export interface SeleccionRef {
  pais: string;
  iso2: string;
  iso3: string;
  banderaUrl?: string;
}

export interface MetaEdicion {
  edicion: number;
  anio: number;
  slug: string;
  tituloOficial: string;
  nombreCorto: string;
  era: Era;
  cancelado?: boolean;
}

export interface PaisSede {
  nombre: string;
  iso2: string;
  iso3: string;
  banderaUrl: string;
}

export interface Sede {
  paises: PaisSede[];
  ciudades: string[];
  estadios?: string[];
}

export interface FechasEdicion {
  inicio: string;
  final: string;
  duracionDias?: number;
}

export interface FormatoEdicion {
  numEquipos: 13 | 15 | 16 | 24 | 32 | 48;
  numPartidos: number;
  sistemaEliminatoria: SistemaEliminatoria;
  numGrupos?: number;
  equiposPorGrupo?: number;
}

export interface Goleador {
  jugador: string;
  minuto: string;
  tipo?: 'normal' | 'penal' | 'autogol' | 'cabeza' | 'tiro-libre';
}

export interface Tarjeta {
  jugador: string;
  seleccion?: string;
  minuto: string;
  tipo: 'amarilla' | 'roja' | 'doble-amarilla';
}

export interface PenalShot {
  jugador: string;
  seleccion?: string;
  resultado: 'gol' | 'fallado' | 'atajado';
}

export interface Penales {
  resultado?: string;
  secuencia?: PenalShot[];
}

export interface Partido {
  fecha: string;
  ciudad?: string;
  estadio?: string;
  local: SeleccionRef;
  visitante: SeleccionRef;
  marcador: string;
  asistencia?: number;
  arbitro?: string;
  goleadores?: Goleador[];
  tarjetas?: Tarjeta[];
  penales?: Penales;
  VAR?: boolean;
}

export interface JugadorPlantilla {
  dorsal?: number;
  nombre: string;
  posicion: 'GK' | 'DEF' | 'MID' | 'FWD';
  clubOrigen?: string;
  edad?: number;
  capitan?: boolean;
  partidosJugados?: number;
  goles?: number;
}

export interface FasesKO {
  octavos?: Partido[];
  cuartos?: Partido[];
  semifinales?: Partido[];
}

export interface HatTrick {
  jugador: string;
  seleccion: SeleccionRef;
  fase: string;
  rival: SeleccionRef;
  goles?: number;
  marcador?: string;
}

export interface RecordEdicion {
  categoria:
    | 'seleccion'
    | 'jugador'
    | 'arbitro'
    | 'entrenador'
    | 'asistencia'
    | 'disciplinario'
    | 'racha'
    | 'balon'
    | 'tecnologia'
    | 'tactica'
    | 'estadio'
    | 'mascota'
    | 'tv'
    | 'hito'
    | 'politica'
    | 'tragedia'
    | 'misc';
  descripcion: string;
  valor?: string;
}

export interface ResultadosEdicion {
  campeon: SeleccionRef;
  subcampeon: SeleccionRef;
  tercero?: SeleccionRef;
  cuarto?: SeleccionRef;
}

export interface EstadisticasEdicion {
  totalGoles: number;
  promedioGolesPartido: number;
  asistenciaTotal?: number;
  asistenciaPromedio?: number;
  golesFaseGrupos?: number;
  golesFaseKO?: number;
}

export interface IdentidadVisual {
  logoUrl?: string;
  mascota?: string;
  balon?: string;
  eslogan?: string;
  colorPrincipal?: string;
}

export interface TopGoleadorEdicion {
  nombre: string;
  seleccion: SeleccionRef;
  goles: number;
  botaOro?: boolean;
}

export interface PremiosEdicion {
  balonOro?: string;
  guanteOro?: string;
  mejorJoven?: string;
  fairPlay?: SeleccionRef;
}

export interface ContextoHistorico {
  resumen?: string;
  eventos?: string[];
}

export interface CuriosidadInline {
  categoria: CategoriaCuriosidad;
  texto: string;
}

export interface Fuente {
  nombre: string;
  url: string;
  fechaConsulta?: string;
}

export interface EdicionMundial {
  meta: MetaEdicion;
  proximo?: boolean;
  sede: Sede;
  fechas: FechasEdicion;
  formato: FormatoEdicion;
  resultados?: ResultadosEdicion;
  estadisticas: EstadisticasEdicion;
  identidadVisual: IdentidadVisual;
  partidoInaugural?: Partido;
  partidoFinal?: Partido;
  partido3?: Partido;
  topGoleadores?: TopGoleadorEdicion[];
  premios?: PremiosEdicion;
  plantillaCampeon?: JugadorPlantilla[];
  plantillaSubcampeon?: JugadorPlantilla[];
  fasesKO?: FasesKO;
  hatTricks?: HatTrick[];
  recordsEdicion?: RecordEdicion[];
  contextoHistorico?: ContextoHistorico;
  curiosidades?: CuriosidadInline[];
  fuentes: Fuente[];
}
