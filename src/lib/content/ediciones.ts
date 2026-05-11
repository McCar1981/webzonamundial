// ZonaMundial — Loader de ediciones del Mundial
// Lee los JSON de content/historia/ediciones en build time (SSG)

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { EdicionMundial } from '@/types/edicion';
import type { RegistrosHistoricos } from '@/types/registros';

const CONTENT_DIR = join(process.cwd(), 'content', 'historia', 'ediciones');
const REGISTROS_PATH = join(process.cwd(), 'content', 'historia', 'registros-historicos.json');
const BALONES_PATH = join(process.cwd(), 'content', 'historia', 'balones.json');
const MASCOTAS_PATH = join(process.cwd(), 'content', 'historia', 'mascotas.json');
const ESTADIOS_PATH = join(process.cwd(), 'content', 'historia', 'estadios.json');
const JUGADORES_PATH = join(process.cwd(), 'content', 'historia', 'jugadores-legendarios.json');
const SELECCIONES_HIST_PATH = join(process.cwd(), 'content', 'historia', 'selecciones-historicas.json');
const ARBITROS_PATH = join(process.cwd(), 'content', 'historia', 'arbitros-legendarios.json');
const CANCELADOS_PATH = join(process.cwd(), 'content', 'historia', 'cancelados.json');
const POLEMICAS_PATH = join(process.cwd(), 'content', 'historia', 'polemicas.json');
const GOLES_LEG_PATH = join(process.cwd(), 'content', 'historia', 'goles-legendarios.json');
const TROFEOS_PATH = join(process.cwd(), 'content', 'historia', 'trofeos.json');
const PREMIOS_PATH = join(process.cwd(), 'content', 'historia', 'premios.json');
const ERAS_PATH = join(process.cwd(), 'content', 'historia', 'eras.json');
const ENTRENADORES_PATH = join(process.cwd(), 'content', 'historia', 'entrenadores-legendarios.json');
const PARTIDOS_LEG_PATH = join(process.cwd(), 'content', 'historia', 'partidos-legendarios.json');
const CONFEDERACIONES_PATH = join(process.cwd(), 'content', 'historia', 'confederaciones.json');
const CAMISETAS_PATH = join(process.cwd(), 'content', 'historia', 'camisetas-iconicas.json');
const MOMENTOS_PATH = join(process.cwd(), 'content', 'historia', 'momentos.json');
const SOCIOPOL_PATH = join(process.cwd(), 'content', 'historia', 'sociopolitica.json');
const NOTABLES_PATH = join(process.cwd(), 'content', 'historia', 'selecciones-notables.json');
const BESTXI_PATH = join(process.cwd(), 'content', 'historia', 'best-xi.json');
const SEDES2026_PATH = join(process.cwd(), 'content', 'historia', 'sedes-2026.json');
const HATTRICKS_PATH = join(process.cwd(), 'content', 'historia', 'hat-tricks-historicos.json');
const ECONOMIA_PATH = join(process.cwd(), 'content', 'historia', 'economia.json');
const QUIZ_PATH = join(process.cwd(), 'content', 'historia', 'quiz.json');

export interface SeleccionNotable {
  slug: string;
  pais: string;
  iso2: string;
  iso3: string;
  subtitulo: string;
  mejorDesempeno: string;
  subcampeon: number[];
  tercerPuesto: number[];
  biografia: string;
  estrellasIconicas: string[];
  datoClave: string;
}

export interface JugadorBestXI {
  posicion: string;
  nombre: string;
  seleccion: { pais: string; iso2: string };
  mundiales: number[];
  datoClave: string;
}

export interface BestXIEpoca {
  epoca: string;
  subtitulo: string;
  jugadores: string[];
}

export interface BestXIData {
  bestXIAllTime: {
    titulo: string;
    subtitulo: string;
    formacion: string;
    jugadores: JugadorBestXI[];
  };
  bestXIPorEpoca: BestXIEpoca[];
}

export interface Sede2026 {
  ciudad: string;
  pais: string;
  iso2: string;
  estadio: string;
  capacidad: number;
  partidosAlbergados: number;
  rolEspecial?: string;
  datoClave: string;
}

export interface Sedes2026Data {
  sedes: Sede2026[];
  datoCierre: string;
}

export interface HatTrickHistorico {
  anio: number;
  edicionSlug: string;
  jugador: string;
  iso2: string;
  rival: string;
  fase: string;
  marcador: string;
  goles: number;
  datoClave: string;
}

export interface PremioEconomico {
  anio: number;
  edicionSlug: string;
  premioCampeon: number;
  premioTotal: number;
  moneda: string;
  datoClave: string;
}

export interface QuizPregunta {
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

let notablesCache: SeleccionNotable[] | null = null;
let bestXICache: BestXIData | null = null;
let sedes2026Cache: Sedes2026Data | null = null;
let hatTricksCache: { destacados: HatTrickHistorico[]; estadisticas: Record<string, unknown>; datoIntroductorio: string } | null = null;
let economiaCache: { premiosPorEdicion: PremioEconomico[]; datosGenerales: Record<string, unknown>; datoIntroductorio: string } | null = null;
let quizCache: QuizPregunta[] | null = null;

export function getAllSeleccionesNotables(): SeleccionNotable[] {
  if (notablesCache) return notablesCache;
  const raw = readFileSync(NOTABLES_PATH, 'utf-8');
  notablesCache = (JSON.parse(raw) as { selecciones: SeleccionNotable[] }).selecciones;
  return notablesCache;
}

export function getBestXI(): BestXIData {
  if (bestXICache) return bestXICache;
  const raw = readFileSync(BESTXI_PATH, 'utf-8');
  bestXICache = JSON.parse(raw) as BestXIData;
  return bestXICache;
}

export function getSedes2026(): Sedes2026Data {
  if (sedes2026Cache) return sedes2026Cache;
  const raw = readFileSync(SEDES2026_PATH, 'utf-8');
  sedes2026Cache = JSON.parse(raw) as Sedes2026Data;
  return sedes2026Cache;
}

export function getHatTricks(): { destacados: HatTrickHistorico[]; estadisticas: Record<string, unknown>; datoIntroductorio: string } {
  if (hatTricksCache) return hatTricksCache;
  const raw = readFileSync(HATTRICKS_PATH, 'utf-8');
  hatTricksCache = JSON.parse(raw);
  return hatTricksCache!;
}

export function getEconomia(): { premiosPorEdicion: PremioEconomico[]; datosGenerales: Record<string, unknown>; datoIntroductorio: string } {
  if (economiaCache) return economiaCache;
  const raw = readFileSync(ECONOMIA_PATH, 'utf-8');
  economiaCache = JSON.parse(raw);
  return economiaCache!;
}

export function getQuiz(): QuizPregunta[] {
  if (quizCache) return quizCache;
  const raw = readFileSync(QUIZ_PATH, 'utf-8');
  quizCache = (JSON.parse(raw) as { preguntas: QuizPregunta[] }).preguntas;
  return quizCache;
}

export interface CamisetaIconica {
  ranking: number;
  anio: number;
  edicionSlug: string;
  seleccion: { pais: string; iso2: string };
  titulo: string;
  subtitulo: string;
  descripcion: string;
}

export interface MomentoMundial {
  ranking: number;
  anio: number;
  edicionSlug: string;
  tipo: string;
  titulo: string;
  descripcion: string;
}

export interface EventoSociopolitico {
  anio: number;
  edicionSlug: string | null;
  categoria: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
}

let camisetasCache: CamisetaIconica[] | null = null;
let momentosCache: MomentoMundial[] | null = null;
let sociopolCache: EventoSociopolitico[] | null = null;

export function getAllCamisetas(): CamisetaIconica[] {
  if (camisetasCache) return camisetasCache;
  const raw = readFileSync(CAMISETAS_PATH, 'utf-8');
  camisetasCache = (JSON.parse(raw) as { camisetas: CamisetaIconica[] }).camisetas;
  return camisetasCache;
}

export function getAllMomentos(): MomentoMundial[] {
  if (momentosCache) return momentosCache;
  const raw = readFileSync(MOMENTOS_PATH, 'utf-8');
  momentosCache = (JSON.parse(raw) as { momentos: MomentoMundial[] }).momentos;
  return momentosCache;
}

export function getAllSociopolitica(): EventoSociopolitico[] {
  if (sociopolCache) return sociopolCache;
  const raw = readFileSync(SOCIOPOL_PATH, 'utf-8');
  sociopolCache = (JSON.parse(raw) as { eventos: EventoSociopolitico[] }).eventos;
  return sociopolCache;
}

export interface EntrenadorLegendario {
  slug: string;
  nombre: string;
  pais: string;
  iso2: string;
  anios: string;
  mundialesDirigidos: number[];
  titulos: number[];
  subtitulo: string;
  datoClave: string;
  anecdotas: string[];
}

export interface PartidoLegendario {
  ranking: number;
  anio: number;
  edicionSlug: string;
  titulo: string;
  subtitulo: string;
  estadio: string;
  fecha: string;
  datoClave: string;
}

export interface Confederacion {
  slug: string;
  codigo: string;
  nombre: string;
  fundacion: number;
  selecciones: number;
  titulosMundiales: number;
  selccionesCampeonas: string[];
  subtitulo: string;
  biografia: string;
  datoClave: string;
  color: string;
}

let entrenadoresCache: EntrenadorLegendario[] | null = null;
let partidosLegCache: PartidoLegendario[] | null = null;
let confederacionesCache: Confederacion[] | null = null;

export function getAllEntrenadores(): EntrenadorLegendario[] {
  if (entrenadoresCache) return entrenadoresCache;
  const raw = readFileSync(ENTRENADORES_PATH, 'utf-8');
  entrenadoresCache = (JSON.parse(raw) as { entrenadores: EntrenadorLegendario[] }).entrenadores;
  return entrenadoresCache;
}

export function getAllPartidosLegendarios(): PartidoLegendario[] {
  if (partidosLegCache) return partidosLegCache;
  const raw = readFileSync(PARTIDOS_LEG_PATH, 'utf-8');
  partidosLegCache = (JSON.parse(raw) as { partidos: PartidoLegendario[] }).partidos;
  return partidosLegCache;
}

export function getAllConfederaciones(): Confederacion[] {
  if (confederacionesCache) return confederacionesCache;
  const raw = readFileSync(CONFEDERACIONES_PATH, 'utf-8');
  confederacionesCache = (JSON.parse(raw) as { confederaciones: Confederacion[] }).confederaciones;
  return confederacionesCache;
}

export function getConfederacionBySlug(slug: string): Confederacion | null {
  return getAllConfederaciones().find((c) => c.slug === slug) ?? null;
}

export interface PremioEdicion {
  anio: number;
  edicionSlug: string;
  balonOro?: string;
  botaOro?: string;
  guanteOro?: string;
  mejorJoven?: string;
  fairPlay?: string;
  datoClave: string;
}

export interface PremioRanking {
  jugador: string;
  veces: number;
  anios: number[];
  goles?: number;
  seleccion: { pais: string; iso2: string };
}

export interface GuanteRanking {
  jugador: string;
  anio: number;
  seleccion: { pais: string; iso2: string };
  datoClave: string;
}

export interface PremiosData {
  premiosPorEdicion: PremioEdicion[];
  rankingsAllTime: {
    balonesOro: PremioRanking[];
    botasOro: PremioRanking[];
    guantesOro: GuanteRanking[];
  };
}

export interface Era {
  slug: string;
  nombre: string;
  anios: string;
  ediciones: string[];
  subtitulo: string;
  descripcion: string;
  datoClave: string;
  color: string;
}

let premiosCache: PremiosData | null = null;
let erasCache: Era[] | null = null;

export function getPremios(): PremiosData {
  if (premiosCache) return premiosCache;
  const raw = readFileSync(PREMIOS_PATH, 'utf-8');
  premiosCache = JSON.parse(raw) as PremiosData;
  return premiosCache;
}

export function getAllEras(): Era[] {
  if (erasCache) return erasCache;
  const raw = readFileSync(ERAS_PATH, 'utf-8');
  erasCache = (JSON.parse(raw) as { eras: Era[] }).eras;
  return erasCache;
}

export function getEraBySlug(slug: string): Era | null {
  return getAllEras().find((e) => e.slug === slug) ?? null;
}

export interface EstadioMitico {
  nombre: string;
  ciudad: string;
  pais: string;
  iso2: string;
  capacidad: number;
  inauguracion: number;
  mundiales: number[];
  datoClave: string;
  momentoEpico: string;
}

export interface JugadorLegendario {
  slug: string;
  nombre: string;
  nombreCompleto: string;
  seleccion: { pais: string; iso2: string; iso3: string };
  posicion: string;
  anios: string;
  mundialesJugados: number[];
  titulos: number;
  anioTitulos: number[];
  partidos: number;
  goles: number;
  subtitulo: string;
  biografia: string;
  logros: string[];
  anecdotas: string[];
  fuentes?: { nombre: string; url: string }[];
}

export interface SeleccionHistoricaPerfil {
  slug: string;
  pais: string;
  iso2: string;
  iso3: string;
  titulos: number;
  aniosTitulos: number[];
  subcampeonatos: number;
  aniosSubcampeon: number[];
  podios: number;
  participaciones: number;
  subtitulo: string;
  biografia: string;
  edadDoradaInicio: number;
  edadDoradaFin: number;
  estrellasIconicas: string[];
  tecnicosCampeones: string[];
  datoClave: string;
  trofeos: string;
}

export interface ArbitroLegendario {
  nombre: string;
  pais: string;
  iso2: string;
  anios: string;
  mundialesPitados: number[];
  finalesPitadas: number[];
  subtitulo: string;
  datoClave: string;
  anecdotas: string[];
}

export interface MundialCancelado {
  anio: number;
  edicionPlanificada: number;
  sedeCandidata: string[];
  decisionFinal: string;
  motivo: string;
  fechasInvasion?: string;
  fechasFinGuerra?: string;
  datoClave: string;
  anecdotas: string[];
}

export interface PolemicaArbitral {
  anio: number;
  edicionSlug: string;
  titulo: string;
  partido: string;
  minuto: string;
  subtitulo: string;
  descripcion: string;
  consecuencia: string;
  vigencia: string;
}

export interface GolLegendario {
  ranking: number;
  jugador: string;
  seleccion: { pais: string; iso2: string; iso3: string };
  anio: number | null;
  edicionSlug: string | null;
  rival: { pais: string; iso2: string; iso3: string };
  minuto: string;
  fase: string;
  marcador: string;
  subtitulo: string;
  descripcion: string;
}

export interface Trofeo {
  nombre: string;
  vigencia: string;
  diseñador: string;
  material: string;
  altura: string;
  peso: string;
  valor: string;
  subtitulo: string;
  descripcion: string;
  anecdotas: string[];
}

let jugadoresCache: JugadorLegendario[] | null = null;
let seleccionesHistCache: SeleccionHistoricaPerfil[] | null = null;
let arbitrosCache: ArbitroLegendario[] | null = null;
let canceladosCache: MundialCancelado[] | null = null;
let polemicasCache: PolemicaArbitral[] | null = null;
let golesLegCache: GolLegendario[] | null = null;
let trofeosCache: Trofeo[] | null = null;

export function getAllJugadoresLegendarios(): JugadorLegendario[] {
  if (jugadoresCache) return jugadoresCache;
  const raw = readFileSync(JUGADORES_PATH, 'utf-8');
  jugadoresCache = (JSON.parse(raw) as { jugadores: JugadorLegendario[] }).jugadores;
  return jugadoresCache;
}

export function getJugadorBySlug(slug: string): JugadorLegendario | null {
  return getAllJugadoresLegendarios().find((j) => j.slug === slug) ?? null;
}

export function getAllSeleccionesHistoricas(): SeleccionHistoricaPerfil[] {
  if (seleccionesHistCache) return seleccionesHistCache;
  const raw = readFileSync(SELECCIONES_HIST_PATH, 'utf-8');
  seleccionesHistCache = (JSON.parse(raw) as { selecciones: SeleccionHistoricaPerfil[] }).selecciones;
  return seleccionesHistCache;
}

export function getSeleccionHistBySlug(slug: string): SeleccionHistoricaPerfil | null {
  return getAllSeleccionesHistoricas().find((s) => s.slug === slug) ?? null;
}

export function getAllArbitros(): ArbitroLegendario[] {
  if (arbitrosCache) return arbitrosCache;
  const raw = readFileSync(ARBITROS_PATH, 'utf-8');
  arbitrosCache = (JSON.parse(raw) as { arbitros: ArbitroLegendario[] }).arbitros;
  return arbitrosCache;
}

export function getCancelados(): { cancelados: MundialCancelado[]; datoCierre: string } {
  if (canceladosCache) {
    return { cancelados: canceladosCache, datoCierre: '' };
  }
  const raw = readFileSync(CANCELADOS_PATH, 'utf-8');
  const data = JSON.parse(raw) as { cancelados: MundialCancelado[]; datoCierre: string };
  canceladosCache = data.cancelados;
  return data;
}

export function getAllPolemicas(): PolemicaArbitral[] {
  if (polemicasCache) return polemicasCache;
  const raw = readFileSync(POLEMICAS_PATH, 'utf-8');
  polemicasCache = (JSON.parse(raw) as { polemicas: PolemicaArbitral[] }).polemicas;
  return polemicasCache;
}

export function getAllGolesLegendarios(): GolLegendario[] {
  if (golesLegCache) return golesLegCache;
  const raw = readFileSync(GOLES_LEG_PATH, 'utf-8');
  golesLegCache = (JSON.parse(raw) as { goles: GolLegendario[] }).goles;
  return golesLegCache;
}

export function getAllTrofeos(): Trofeo[] {
  if (trofeosCache) return trofeosCache;
  const raw = readFileSync(TROFEOS_PATH, 'utf-8');
  trofeosCache = (JSON.parse(raw) as { trofeos: Trofeo[] }).trofeos;
  return trofeosCache;
}

export interface Balon {
  anio: number;
  edicionSlug: string;
  nombre: string;
  fabricante: string;
  paneles: number;
  color: string;
  datoClave: string;
}

export interface Mascota {
  anio: number;
  edicionSlug: string;
  nombre: string;
  tipo: string;
  diseñador: string;
  datoClave: string;
}

let balonesCache: Balon[] | null = null;
let mascotasCache: Mascota[] | null = null;
let estadiosCache: EstadioMitico[] | null = null;

export function getAllBalones(): Balon[] {
  if (balonesCache) return balonesCache;
  const raw = readFileSync(BALONES_PATH, 'utf-8');
  balonesCache = (JSON.parse(raw) as { balones: Balon[] }).balones;
  return balonesCache;
}

export function getAllMascotas(): Mascota[] {
  if (mascotasCache) return mascotasCache;
  const raw = readFileSync(MASCOTAS_PATH, 'utf-8');
  mascotasCache = (JSON.parse(raw) as { mascotas: Mascota[] }).mascotas;
  return mascotasCache;
}

export function getAllEstadios(): EstadioMitico[] {
  if (estadiosCache) return estadiosCache;
  const raw = readFileSync(ESTADIOS_PATH, 'utf-8');
  estadiosCache = (JSON.parse(raw) as { estadios: EstadioMitico[] }).estadios;
  return estadiosCache;
}

let registrosCache: RegistrosHistoricos | null = null;

export function getRegistrosHistoricos(): RegistrosHistoricos {
  if (registrosCache) return registrosCache;
  const raw = readFileSync(REGISTROS_PATH, 'utf-8');
  registrosCache = JSON.parse(raw) as RegistrosHistoricos;
  return registrosCache;
}

let cache: EdicionMundial[] | null = null;

export function getAllEdiciones(): EdicionMundial[] {
  if (cache) return cache;
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
  const ediciones = files.map((f) => {
    const raw = readFileSync(join(CONTENT_DIR, f), 'utf-8');
    return JSON.parse(raw) as EdicionMundial;
  });
  ediciones.sort((a, b) => a.meta.anio - b.meta.anio);
  cache = ediciones;
  return ediciones;
}

export function getEdicionBySlug(slug: string): EdicionMundial | null {
  return getAllEdiciones().find((e) => e.meta.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return getAllEdiciones().map((e) => e.meta.slug);
}

export interface PalmaresItem {
  pais: string;
  iso2: string;
  iso3: string;
  banderaUrl?: string;
  count: number;
  anios: number[];
}

export function getPalmares(): PalmaresItem[] {
  const counts = new Map<string, PalmaresItem>();
  for (const e of getAllEdiciones()) {
    if (!e.resultados?.campeon) continue;
    const c = e.resultados.campeon;
    const existing = counts.get(c.iso3);
    if (existing) {
      existing.count++;
      existing.anios.push(e.meta.anio);
    } else {
      counts.set(c.iso3, {
        pais: c.pais,
        iso2: c.iso2,
        iso3: c.iso3,
        banderaUrl: c.banderaUrl,
        count: 1,
        anios: [e.meta.anio],
      });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.pais.localeCompare(b.pais));
}

export interface ResumenGlobal {
  totalEdicionesJugadas: number;
  totalGoles: number;
  totalPartidos: number;
  asistenciaTotal: number;
  paisesAnfitriones: number;
}

export interface CuriosidadAgregada {
  edicionAnio: number;
  edicionSlug: string;
  edicionNombre: string;
  categoria: string;
  texto: string;
}

export function getAllCuriosidades(): CuriosidadAgregada[] {
  const ediciones = getAllEdiciones();
  const out: CuriosidadAgregada[] = [];
  for (const e of ediciones) {
    if (!e.curiosidades) continue;
    for (const c of e.curiosidades) {
      out.push({
        edicionAnio: e.meta.anio,
        edicionSlug: e.meta.slug,
        edicionNombre: e.meta.nombreCorto,
        categoria: c.categoria,
        texto: c.texto,
      });
    }
  }
  return out.sort((a, b) => a.edicionAnio - b.edicionAnio);
}

export function getResumenGlobal(): ResumenGlobal {
  const ediciones = getAllEdiciones().filter((e) => !e.proximo);
  const totalGoles = ediciones.reduce((s, e) => s + e.estadisticas.totalGoles, 0);
  const totalPartidos = ediciones.reduce((s, e) => s + e.formato.numPartidos, 0);
  const asistenciaTotal = ediciones.reduce(
    (s, e) => s + (e.estadisticas.asistenciaTotal ?? 0),
    0
  );
  const paises = new Set<string>();
  for (const e of ediciones) for (const p of e.sede.paises) paises.add(p.iso3);
  return {
    totalEdicionesJugadas: ediciones.length,
    totalGoles,
    totalPartidos,
    asistenciaTotal,
    paisesAnfitriones: paises.size,
  };
}
