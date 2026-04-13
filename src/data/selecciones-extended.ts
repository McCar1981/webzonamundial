import type { Seleccion } from './selecciones';
import { getSeleccionBySlug } from './selecciones';

export interface Jugador {
  nombre: string;
  club: string;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  golesIntl: number;
  internacionalidades: number;
}

export interface PalmaresItem {
  year: number;
  result: string;
  host: string;
  hostFlag: string;
}

export interface PartidoIconico {
  rival: string;
  rivalFlag: string;
  result: string;
  year: number;
  stage: string;
  context: string;
}

export interface ProximoPartido {
  rival: string;
  rivalFlag: string;
  date: string;
  time: string;
  venue: string;
}

export interface EstadisticasMundial {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
}

export interface CuerpoTecnico {
  dt: string;
  capitan: string;
  estrella: string;
}

export interface SedeEntrenamiento {
  ciudad: string;
  pais: string;
}

export interface SeleccionExtendedBase {
  historia?: string;
  clasificacion?: string;
  datosClave?: string;
  jugadoresClave?: Jugador[];
  cuerpoTecnico?: CuerpoTecnico;
  estadisticasMundial?: EstadisticasMundial;
  palmares?: PalmaresItem[];
  partidosIronicos?: PartidoIconico[];
  curiosidades?: string[];
  proximosPartidos?: ProximoPartido[];
  sedeEntrenamiento?: SedeEntrenamiento;
}

export type SeleccionExtended = Seleccion & Required<SeleccionExtendedBase>;

const SELECCIONES_EXTENDED_BASE: Record<string, SeleccionExtendedBase> = {
  argentina: {
    historia: 'Argentina es una de las selecciones más laureadas de la historia. Conquistó el mundo en 1978, 1986 y 2022, y ha sido subcampeón en 1930, 1990 y 2014. Su legado está marcado por genios como Diego Maradona y Lionel Messi.',
    clasificacion: 'Campeón vigente y clasificado como uno de los principales referentes de CONMEBOL. Obtuvo su plaza de manera directa por el alto rendimiento en las eliminatorias sudamericanas.',
    datosClave: 'Es la selección que más veces ha levantado la Copa del Mundo en el siglo XXI junto a Francia, con el título de Qatar 2022.',
    jugadoresClave: [
      { nombre: 'Lionel Messi', club: 'Inter Miami', posicion: 'DEL', golesIntl: 112, internacionalidades: 187 },
      { nombre: 'Emiliano Martínez', club: 'Aston Villa', posicion: 'POR', golesIntl: 0, internacionalidades: 54 },
      { nombre: 'Julián Álvarez', club: 'Atlético de Madrid', posicion: 'DEL', golesIntl: 11, internacionalidades: 38 },
    ],
    cuerpoTecnico: { dt: 'Lionel Scaloni', capitan: 'Lionel Messi', estrella: 'Lionel Messi' },
    estadisticasMundial: { pj: 88, pg: 49, pe: 16, pp: 23, gf: 152, gc: 91 },
    palmares: [
      { year: 1978, result: 'Campeón', host: 'Argentina', hostFlag: 'ar' },
      { year: 1986, result: 'Campeón', host: 'México', hostFlag: 'mx' },
      { year: 2022, result: 'Campeón', host: 'Qatar', hostFlag: 'qa' },
      { year: 1930, result: 'Subcampeón', host: 'Uruguay', hostFlag: 'uy' },
      { year: 1990, result: 'Subcampeón', host: 'Italia', hostFlag: 'it' },
      { year: 2014, result: 'Subcampeón', host: 'Brasil', hostFlag: 'br' },
      { year: 2006, result: 'Cuartos de final', host: 'Alemania', hostFlag: 'de' },
      { year: 1998, result: 'Cuartos de final', host: 'Francia', hostFlag: 'fr' },
    ],
    partidosIronicos: [
      { rival: 'Inglaterra', rivalFlag: 'gb-eng', result: '2-1', year: 1986, stage: 'Cuartos de final', context: 'El mítico partido de los dos goles de Maradona: la "Mano de Dios" y el "Gol del Siglo".' },
      { rival: 'Francia', rivalFlag: 'fr', result: '3-3 (4-2 pen)', year: 2022, stage: 'Final', context: 'Una de las finales más emocionantes de la historia, definida por penales con actuación estelar de Messi y Dibu Martínez.' },
      { rival: 'Países Bajos', rivalFlag: 'nl', result: '2-2 (4-3 pen)', year: 2022, stage: 'Cuartos de final', context: 'Partido dramático en Lusail con repunte holandés en el último minuto y villancico incluido por Weghorst.' },
    ],
    curiosidades: [
      'Argentina ha disputado 3 finales en las últimas 4 décadas.',
      'Es el país con más premios "Balón de Oro" de la FIFA en su historia.',
      'Su arquero Emiliano Martínez ganó el Guante de Oro en Qatar 2022.',
      'La selección albiceleste lidera el ranking FIFA previo al Mundial 2026.'
    ],
    sedeEntrenamiento: { ciudad: 'Miami', pais: 'Estados Unidos' },
  },
  brasil: {
    historia: 'Brasil es la única selección con 5 títulos mundiales (1958, 1962, 1970, 1994 y 2002). Ha sido sinónimo de fútbol arte y ha producido leyendas como Pelé, Garrincha, Ronaldo y Ronaldinho.',
    clasificacion: 'Clasificó de manera directa como una de las potencias de CONMEBOL, liderando las eliminatorias sudamericanas con solvencia.',
    datosClave: 'Nunca ha quedado fuera de un Mundial y es la única selección que ha conquistado el torneo en 3 continentes distintos.',
    jugadoresClave: [
      { nombre: 'Vinicius Jr.', club: 'Real Madrid', posicion: 'DEL', golesIntl: 6, internacionalidades: 35 },
      { nombre: 'Rodrygo', club: 'Real Madrid', posicion: 'DEL', golesIntl: 7, internacionalidades: 32 },
      { nombre: 'Marquinhos', club: 'PSG', posicion: 'DEF', golesIntl: 7, internacionalidades: 89 },
    ],
    cuerpoTecnico: { dt: 'Carlo Ancelotti', capitan: 'Marquinhos', estrella: 'Vinicius Jr.' },
    estadisticasMundial: { pj: 114, pg: 76, pe: 19, pp: 19, gf: 237, gc: 108 },
    palmares: [
      { year: 1958, result: 'Campeón', host: 'Suecia', hostFlag: 'se' },
      { year: 1962, result: 'Campeón', host: 'Chile', hostFlag: 'cl' },
      { year: 1970, result: 'Campeón', host: 'México', hostFlag: 'mx' },
      { year: 1994, result: 'Campeón', host: 'Estados Unidos', hostFlag: 'us' },
      { year: 2002, result: 'Campeón', host: 'Corea del Sur / Japón', hostFlag: 'kr' },
      { year: 1950, result: 'Subcampeón', host: 'Brasil', hostFlag: 'br' },
      { year: 1998, result: 'Subcampeón', host: 'Francia', hostFlag: 'fr' },
    ],
    partidosIronicos: [
      { rival: 'Suecia', rivalFlag: 'se', result: '5-2', year: 1958, stage: 'Final', context: 'Pelé, con 17 años, anunció su llegada al mundo con un doblete en la final.' },
      { rival: 'Italia', rivalFlag: 'it', result: '0-0 (3-2 pen)', year: 1994, stage: 'Final', context: 'Romário y Dunga lideraron el cuarto título en una definición por penales.' },
      { rival: 'Alemania', rivalFlag: 'de', result: '1-7', year: 2014, stage: 'Semifinales', context: 'La histórica derrota en Mineirao, una de las más dolorosas de su historia.' },
    ],
    curiosidades: [
      'Brasil ha ganado al menos 1 título en cada década desde 1958 hasta 2002.',
      'Pelé es el único jugador con 3 Copas del Mundo ganadas.',
      'La canarinha nunca ha perdido un partido inaugural de Mundial.',
      'Ronaldo Nazario es el máximo goleador histórico de Brasil en Mundiales con 15 goles.'
    ],
    sedeEntrenamiento: { ciudad: 'Orlando', pais: 'Estados Unidos' },
  },
  espana: {
    historia: 'España conquistó su primera Copa del Mundo en 2010 en Sudáfrica, consolidando una generación única que también ganó dos Eurocopas consecutivas. Conocida por su estilo de toque y posesión.',
    clasificacion: 'Obtuvo su plaza de forma directa a través del proceso clasificatorio de UEFA, dominando su grupo con solidez defensiva y control del balón.',
    datosClave: 'Fue la primera selección europea en ganar un Mundial fuera de su continente.',
    jugadoresClave: [
      { nombre: 'Lamine Yamal', club: 'FC Barcelona', posicion: 'DEL', golesIntl: 4, internacionalidades: 15 },
      { nombre: 'Rodri', club: 'Manchester City', posicion: 'MED', golesIntl: 4, internacionalidades: 56 },
      { nombre: 'Dani Carvajal', club: 'Real Madrid', posicion: 'DEF', golesIntl: 1, internacionalidades: 49 },
    ],
    cuerpoTecnico: { dt: 'Luis de la Fuente', capitan: 'Álvaro Morata', estrella: 'Lamine Yamal' },
    estadisticasMundial: { pj: 67, pg: 31, pe: 17, pp: 19, gf: 108, gc: 75 },
    palmares: [
      { year: 2010, result: 'Campeón', host: 'Sudáfrica', hostFlag: 'za' },
      { year: 1950, result: 'Cuarto puesto', host: 'Brasil', hostFlag: 'br' },
      { year: 1986, result: 'Cuartos de final', host: 'México', hostFlag: 'mx' },
      { year: 1994, result: 'Cuartos de final', host: 'Estados Unidos', hostFlag: 'us' },
      { year: 2002, result: 'Cuartos de final', host: 'Corea / Japón', hostFlag: 'kr' },
    ],
    partidosIronicos: [
      { rival: 'Países Bajos', rivalFlag: 'nl', result: '1-0', year: 2010, stage: 'Final', context: 'Iniesta marcó en la prórroga para darle a España su único título mundialista.' },
      { rival: 'Rusia', rivalFlag: 'ru', result: '1-1 (3-4 pen)', year: 2018, stage: 'Octavos de final', context: 'Eliminación inesperada en penales tras una eliminatoria donde España dominó posesión.' },
      { rival: 'Marruecos', rivalFlag: 'ma', result: '0-0 (0-3 pen)', year: 2022, stage: 'Octavos de final', context: 'Eliminación dolorosa en penales ante Marruecos, que no falló ningún lanzamiento.' },
    ],
    curiosidades: [
      'La Roja ganó 3 títulos consecutivos entre 2008 y 2012 (2 Eurocopas y 1 Mundial).',
      'Iker Casillas fue nombrado mejor portero del Mundial 2010.',
      'Andrés Iniesta anotó el gol más importante de la historia reciente española.'
    ],
    sedeEntrenamiento: { ciudad: 'Los Ángeles', pais: 'Estados Unidos' },
  },
  francia: {
    historia: 'Francia ha sido campeona del mundo en 1998 y 2018, y finalista en 2022. Es una de las selecciones más potentes de las últimas décadas, con una cantera inagotable de talento.',
    clasificacion: 'Clasificó de manera directa por UEFA tras un proceso sólido en el que destacó su potencia ofensiva y solidez defensiva.',
    datosClave: 'Kylian Mbappé se convirtió en el segundo jugador en marcar un hat-trick en una final de Mundial desde 1966.',
    jugadoresClave: [
      { nombre: 'Kylian Mbappé', club: 'Real Madrid', posicion: 'DEL', golesIntl: 48, internacionalidades: 84 },
      { nombre: 'Aurélien Tchouaméni', club: 'Real Madrid', posicion: 'MED', golesIntl: 4, internacionalidades: 40 },
      { nombre: 'Dayot Upamecano', club: 'Bayern Múnich', posicion: 'DEF', golesIntl: 2, internacionalidades: 29 },
    ],
    cuerpoTecnico: { dt: 'Didier Deschamps', capitan: 'Kylian Mbappé', estrella: 'Kylian Mbappé' },
    estadisticasMundial: { pj: 73, pg: 41, pe: 15, pp: 17, gf: 136, gc: 77 },
    palmares: [
      { year: 1998, result: 'Campeón', host: 'Francia', hostFlag: 'fr' },
      { year: 2018, result: 'Campeón', host: 'Rusia', hostFlag: 'ru' },
      { year: 2022, result: 'Subcampeón', host: 'Qatar', hostFlag: 'qa' },
      { year: 2006, result: 'Subcampeón', host: 'Alemania', hostFlag: 'de' },
      { year: 1958, result: 'Tercero', host: 'Suecia', hostFlag: 'se' },
      { year: 1986, result: 'Tercero', host: 'México', hostFlag: 'mx' },
    ],
    partidosIronicos: [
      { rival: 'Brasil', rivalFlag: 'br', result: '3-0', year: 1998, stage: 'Final', context: 'Zidane anotó dos goles de cabeza para coronar a Francia en su casa.' },
      { rival: 'Croacia', rivalFlag: 'hr', result: '4-2', year: 2018, stage: 'Final', context: 'Francia se consagró en Moscú con goles de Mbappé, Griezmann y Pogba.' },
      { rival: 'Argentina', rivalFlag: 'ar', result: '3-3 (2-4 pen)', year: 2022, stage: 'Final', context: 'Una final épica que perdieron en penales a pesar del hat-trick de Mbappé.' },
    ],
    curiosidades: [
      'Didier Deschamps fue campeón como jugador (1998) y como DT (2018).',
      'Francia tiene la plantilla más joven en promedio de las potencias europeas.',
      'Zinedine Zidane fue elegido mejor jugador del Mundial 2006 a pesar de la expulsión en la final.'
    ],
    sedeEntrenamiento: { ciudad: 'Dallas', pais: 'Estados Unidos' },
  },
  alemania: {
    historia: 'Alemania es una de las selecciones más consistentes de la historia, con 4 títulos mundiales (1954, 1974, 1990 y 2014). Ha llegado al menos a semifinales en la mayoría de sus participaciones.',
    clasificacion: 'Se clasificó de manera directa por UEFA después de un proceso clasificatorio sólido, aunque con algunas dudas generadas en torneos recientes.',
    datosClave: 'Es la selección con más presencias en semifinales de la historia de los Mundiales.',
    jugadoresClave: [
      { nombre: 'Jamal Musiala', club: 'Bayern Múnich', posicion: 'MED', golesIntl: 8, internacionalidades: 32 },
      { nombre: 'Florian Wirtz', club: 'Bayer Leverkusen', posicion: 'MED', golesIntl: 6, internacionalidades: 24 },
      { nombre: 'Joshua Kimmich', club: 'Bayern Múnich', posicion: 'DEF', golesIntl: 6, internacionalidades: 91 },
    ],
    cuerpoTecnico: { dt: 'Julian Nagelsmann', capitan: 'Joshua Kimmich', estrella: 'Jamal Musiala' },
    estadisticasMundial: { pj: 112, pg: 68, pe: 21, pp: 23, gf: 232, gc: 130 },
    palmares: [
      { year: 1954, result: 'Campeón', host: 'Suiza', hostFlag: 'ch' },
      { year: 1974, result: 'Campeón', host: 'Alemania Occidental', hostFlag: 'de' },
      { year: 1990, result: 'Campeón', host: 'Italia', hostFlag: 'it' },
      { year: 2014, result: 'Campeón', host: 'Brasil', hostFlag: 'br' },
      { year: 1966, result: 'Subcampeón', host: 'Inglaterra', hostFlag: 'gb-eng' },
      { year: 1982, result: 'Subcampeón', host: 'España', hostFlag: 'es' },
      { year: 1986, result: 'Subcampeón', host: 'México', hostFlag: 'mx' },
      { year: 2002, result: 'Subcampeón', host: 'Corea / Japón', hostFlag: 'kr' },
    ],
    partidosIronicos: [
      { rival: 'Argentina', rivalFlag: 'ar', result: '1-0', year: 2014, stage: 'Final', context: 'Götze anotó el gol de la victoria en la prórroga para el cuarto título alemán.' },
      { rival: 'Brasil', rivalFlag: 'br', result: '7-1', year: 2014, stage: 'Semifinales', context: 'El Mineirazo, una paliza histórica en casa de Brasil rumbo a la final.' },
      { rival: 'Hungría', rivalFlag: 'hu', result: '3-2', year: 1954, stage: 'Final', context: 'El Milagro de Berna: remontada épica tras ir perdiendo 2-0.' },
    ],
    curiosidades: [
      'Alemania ha llegado a 8 finales mundiales, más que ninguna otra selección europea.',
      'Miroslav Klose es el máximo goleador histórico de los Mundiales con 16 tantos.',
      'Gerd Müller anotó 10 goles en México 1970.'
    ],
    sedeEntrenamiento: { ciudad: 'Nueva York / Nueva Jersey', pais: 'Estados Unidos' },
  },
  mexico: {
    historia: 'México es una de las selecciones más queridas y con mayor tradición de CONCACAF. Ha disputado 17 Mundiales y es anfitrión en tres ocasiones históricas (1970, 1986 y 2026).',
    clasificacion: 'Se clasificó automáticamente como uno de los tres países anfitriones del Mundial 2026 junto a Estados Unidos y Canadá.',
    datosClave: 'Es el único país que ha organizado el Mundial en tres ocasiones distintas.',
    jugadoresClave: [
      { nombre: 'Santiago Giménez', club: 'AC Milan', posicion: 'DEL', golesIntl: 5, internacionalidades: 26 },
      { nombre: 'Edson Álvarez', club: 'West Ham', posicion: 'DEF', golesIntl: 4, internacionalidades: 78 },
      { nombre: 'Luis Chávez', club: 'Dynamo Moscú', posicion: 'MED', golesIntl: 3, internacionalidades: 35 },
    ],
    cuerpoTecnico: { dt: 'Javier Aguirre', capitan: 'Edson Álvarez', estrella: 'Santiago Giménez' },
    estadisticasMundial: { pj: 60, pg: 17, pe: 14, pp: 29, gf: 62, gc: 101 },
    palmares: [
      { year: 1970, result: 'Cuartos de final', host: 'México', hostFlag: 'mx' },
      { year: 1986, result: 'Cuartos de final', host: 'México', hostFlag: 'mx' },
      { year: 1970, result: 'Anfitrión', host: 'México', hostFlag: 'mx' },
      { year: 1986, result: 'Anfitrión', host: 'México', hostFlag: 'mx' },
    ],
    partidosIronicos: [
      { rival: 'Alemania', rivalFlag: 'de', result: '0-0 (1-4 pen)', year: 1986, stage: 'Cuartos de final', context: 'Partido vibrante en el Azteca que se definió en penales a favor de Alemania.' },
      { rival: 'Argentina', rivalFlag: 'ar', result: '2-3', year: 2006, stage: 'Octavos de final', context: 'El famoso "pase de nocaut" de Maxi Rodríguez en tiempo extra.' },
    ],
    curiosidades: [
      'México ha alcanzado los octavos de final en los últimos 8 Mundiales consecutivos.',
      'El Estadio Azteca será el único estadio en albergar 3 inauguraciones de Mundial.',
      'Hugo Sánchez es considerado el mejor jugador mexicano de la historia.'
    ],
    sedeEntrenamiento: { ciudad: 'Ciudad de México', pais: 'México' },
  },
  'estados-unidos': {
    historia: 'Estados Unidos ha crecido enormemente en el fútbol desde los 90. Fue semifinalista en el primer Mundial de 1930 y anfitrión en 1994. En 2026 busca dar un salto de calidad definitivo.',
    clasificacion: 'Se clasificó automáticamente como anfitrión del Mundial 2026, junto con México y Canadá.',
    datosClave: 'La MLS y el crecimiento de la Premier League han impulsado una generación de futbolistas estadounidenses en Europa.',
    jugadoresClave: [
      { nombre: 'Christian Pulisic', club: 'AC Milan', posicion: 'DEL', golesIntl: 30, internacionalidades: 71 },
      { nombre: 'Giovanni Reyna', club: 'Borussia Dortmund', posicion: 'MED', golesIntl: 8, internacionalidades: 32 },
      { nombre: 'Folarin Balogun', club: 'Monaco', posicion: 'DEL', golesIntl: 3, internacionalidades: 12 },
    ],
    cuerpoTecnico: { dt: 'Mauricio Pochettino', capitan: 'Christian Pulisic', estrella: 'Christian Pulisic' },
    estadisticasMundial: { pj: 37, pg: 9, pe: 8, pp: 20, gf: 40, gc: 66 },
    palmares: [
      { year: 1930, result: 'Semifinales', host: 'Uruguay', hostFlag: 'uy' },
      { year: 2002, result: 'Cuartos de final', host: 'Corea / Japón', hostFlag: 'kr' },
      { year: 1994, result: 'Octavos de final', host: 'Estados Unidos', hostFlag: 'us' },
    ],
    partidosIronicos: [
      { rival: 'Inglaterra', rivalFlag: 'gb-eng', result: '1-1', year: 2010, stage: 'Fase de grupos', context: 'El empate sorpresivo de Estados Unidos ante Inglaterra con un error del portero Green.' },
    ],
    curiosidades: [
      'Estados Unidos 1994 fue el Mundial con mayor asistencia de público en la historia.',
      'Landon Donovan es el máximo goleador histórico del seleccionado.',
      'Christian Pulisic fue el primer estadounidense en ganar la Champions League.'
    ],
    sedeEntrenamiento: { ciudad: 'Kansas City', pais: 'Estados Unidos' },
  },
  canada: {
    historia: 'Canadá ha experimentado un boom futbolístico en la última década. Participó en Qatar 2022 tras 36 años de ausencia y en 2026 será anfitrión, buscando superar la fase de grupos por primera vez.',
    clasificacion: 'Se clasificó automáticamente como uno de los tres países anfitriones del Mundial 2026.',
    datosClave: 'Alphonso Davies es la figura indiscutible y el primer canadiense en ganar la Champions League.',
    jugadoresClave: [
      { nombre: 'Alphonso Davies', club: 'Bayern Múnich', posicion: 'DEF', golesIntl: 15, internacionalidades: 48 },
      { nombre: 'Jonathan David', club: 'Lille', posicion: 'DEL', golesIntl: 26, internacionalidades: 55 },
      { nombre: 'Cyle Larin', club: 'Mallorca', posicion: 'DEL', golesIntl: 29, internacionalidades: 72 },
    ],
    cuerpoTecnico: { dt: 'Jesse Marsch', capitan: 'Alphonso Davies', estrella: 'Alphonso Davies' },
    estadisticasMundial: { pj: 6, pg: 0, pe: 0, pp: 6, gf: 2, gc: 13 },
    palmares: [
      { year: 2022, result: 'Fase de grupos', host: 'Qatar', hostFlag: 'qa' },
      { year: 1986, result: 'Fase de grupos', host: 'México', hostFlag: 'mx' },
    ],
    partidosIronicos: [
      { rival: 'Bélgica', rivalFlag: 'be', result: '1-0', year: 2022, stage: 'Fase de grupos', context: 'Davies falló un penal tempranero y Canadá quedó eliminado pese a buena actuación.' },
    ],
    curiosidades: [
      'Canadá fue campeón de la CONCACAF Nations League 2024.',
      'Jonathan David es el máximo goleador histórico de la selección canadiense.',
      'El hockey sigue siendo el deporte rey, pero el fútbol crece a pasos agigantados.'
    ],
    sedeEntrenamiento: { ciudad: 'Toronto', pais: 'Canadá' },
  },
  inglaterra: {
    historia: 'Inglaterra ganó su único Mundial en casa en 1966. Tras décadas de sequía, la generación actual ha devuelto la ilusión con finales en Eurocopa y semifinales en Rusia 2018 y Qatar 2022.',
    clasificacion: 'Clasificó de manera directa por UEFA dominando su grupo con un futbol ofensivo y una base joven de altísimo nivel.',
    datosClave: 'Harry Kane es el máximo goleador histórico de la selección inglesa.',
    jugadoresClave: [
      { nombre: 'Jude Bellingham', club: 'Real Madrid', posicion: 'MED', golesIntl: 5, internacionalidades: 36 },
      { nombre: 'Bukayo Saka', club: 'Arsenal', posicion: 'DEL', golesIntl: 12, internacionalidades: 43 },
      { nombre: 'Declan Rice', club: 'Arsenal', posicion: 'MED', golesIntl: 5, internacionalidades: 62 },
    ],
    cuerpoTecnico: { dt: 'Thomas Tuchel', capitan: 'Harry Kane', estrella: 'Jude Bellingham' },
    estadisticasMundial: { pj: 74, pg: 32, pe: 22, pp: 20, gf: 104, gc: 82 },
    palmares: [
      { year: 1966, result: 'Campeón', host: 'Inglaterra', hostFlag: 'gb-eng' },
      { year: 1990, result: 'Cuarto puesto', host: 'Italia', hostFlag: 'it' },
      { year: 2018, result: 'Cuarto puesto', host: 'Rusia', hostFlag: 'ru' },
      { year: 1954, result: 'Cuartos de final', host: 'Suiza', hostFlag: 'ch' },
      { year: 1962, result: 'Cuartos de final', host: 'Chile', hostFlag: 'cl' },
      { year: 1970, result: 'Cuartos de final', host: 'México', hostFlag: 'mx' },
      { year: 1986, result: 'Cuartos de final', host: 'México', hostFlag: 'mx' },
      { year: 2002, result: 'Cuartos de final', host: 'Corea / Japón', hostFlag: 'kr' },
      { year: 2006, result: 'Cuartos de final', host: 'Alemania', hostFlag: 'de' },
    ],
    partidosIronicos: [
      { rival: 'Alemania', rivalFlag: 'de', result: '4-2', year: 1966, stage: 'Final', context: 'El polémico gol de Hurst en Wembley le dio el único título a Inglaterra.' },
      { rival: 'Francia', rivalFlag: 'fr', result: '1-2', year: 2022, stage: 'Cuartos de final', context: 'Kane falló un penal clave que costó la eliminación ante Francia.' },
    ],
    curiosidades: [
      'Geoff Hurst es el único jugador que ha marcado hat-trick en una final de Mundial.',
      'La Premier League aporta la mayoría de los jugadores de la selección.',
      'Inglaterra nunca ha ganado la Eurocopa, aunque llegó a la final en 2020 y 2024.'
    ],
    sedeEntrenamiento: { ciudad: 'Philadelphia', pais: 'Estados Unidos' },
  },
  portugal: {
    historia: 'Portugal ha sido una potencia emergente en el siglo XXI. Fue campeón de Europa en 2016 y de la Nations League en 2019. En Mundiales, su mejor actuación fueron semifinales en 1966 y cuartos en 2006.',
    clasificacion: 'Se clasificó de manera directa por UEFA con una campaña sólida liderada por su generación dorada.',
    datosClave: 'Cristiano Ronaldo es el jugador con más partidos internacionales y más goles en la historia del fútbol masculino.',
    jugadoresClave: [
      { nombre: 'Cristiano Ronaldo', club: 'Al-Nassr', posicion: 'DEL', golesIntl: 135, internacionalidades: 217 },
      { nombre: 'Bernardo Silva', club: 'Manchester City', posicion: 'MED', golesIntl: 11, internacionalidades: 95 },
      { nombre: 'Bruno Fernandes', club: 'Manchester United', posicion: 'MED', golesIntl: 25, internacionalidades: 72 },
    ],
    cuerpoTecnico: { dt: 'Roberto Martínez', capitan: 'Cristiano Ronaldo', estrella: 'Cristiano Ronaldo' },
    estadisticasMundial: { pj: 35, pg: 17, pe: 6, pp: 12, gf: 61, gc: 45 },
    palmares: [
      { year: 1966, result: 'Tercero', host: 'Inglaterra', hostFlag: 'gb-eng' },
      { year: 2006, result: 'Cuarto puesto', host: 'Alemania', hostFlag: 'de' },
      { year: 1986, result: 'Octavos de final', host: 'México', hostFlag: 'mx' },
    ],
    partidosIronicos: [
      { rival: 'España', rivalFlag: 'es', result: '3-3', year: 2018, stage: 'Fase de grupos', context: 'Hat-trick de Ronaldo incluyendo un tiro libre espectacular para empatar en el último minuto.' },
      { rival: 'Uruguay', rivalFlag: 'uy', result: '1-2', year: 2018, stage: 'Octavos de final', context: 'Cavani anotó un doblete que eliminó a Portugal en Sochi.' },
    ],
    curiosidades: [
      'Eusébio fue el goleador del Mundial 1966 con 9 goles.',
      'Portugal ganó la Eurocopa 2016 sin ganar ningún partido en el tiempo reglamentario en la fase eliminatoria.',
      'Rúben Dias y Gonçalo Inácio lideran la nueva generación de defensas portugueses.'
    ],
    sedeEntrenamiento: { ciudad: 'Boston', pais: 'Estados Unidos' },
  },
  uruguay: {
    historia: 'Uruguay es una selección histórica con 2 títulos mundiales (1930 y 1950) y 15 Copas América. Fue la primera campeona del mundo y la que más títulos oficiales FIFA tiene por habitante.',
    clasificacion: 'Clasificó de manera directa por CONMEBOL con una eliminatoria donde destacó su solidez defensiva y garra charrúa.',
    datosClave: 'El Estadio Centenario de Montevideo fue sede del primer Mundial de la historia en 1930.',
    jugadoresClave: [
      { nombre: 'Federico Valverde', club: 'Real Madrid', posicion: 'MED', golesIntl: 7, internacionalidades: 62 },
      { nombre: 'Darwin Núñez', club: 'Liverpool', posicion: 'DEL', golesIntl: 14, internacionalidades: 28 },
      { nombre: 'Ronald Araújo', club: 'FC Barcelona', posicion: 'DEF', golesIntl: 1, internacionalidades: 21 },
    ],
    cuerpoTecnico: { dt: 'Marcelo Bielsa', capitan: 'José María Giménez', estrella: 'Federico Valverde' },
    estadisticasMundial: { pj: 59, pg: 25, pe: 13, pp: 21, gf: 89, gc: 78 },
    palmares: [
      { year: 1930, result: 'Campeón', host: 'Uruguay', hostFlag: 'uy' },
      { year: 1950, result: 'Campeón', host: 'Brasil', hostFlag: 'br' },
      { year: 1954, result: 'Cuarto puesto', host: 'Suiza', hostFlag: 'ch' },
      { year: 1970, result: 'Cuarto puesto', host: 'México', hostFlag: 'mx' },
      { year: 2010, result: 'Cuarto puesto', host: 'Sudáfrica', hostFlag: 'za' },
    ],
    partidosIronicos: [
      { rival: 'Brasil', rivalFlag: 'br', result: '2-1', year: 1950, stage: 'Final', context: 'El Maracanazo: Ghiggia silenció a 200.000 brasileños en la final del Mundial.' },
      { rival: 'Ghana', rivalFlag: 'gh', result: '1-1 (4-2 pen)', year: 2010, stage: 'Cuartos de final', context: 'Infame mano de Suárez en la línea y definición por penales para llegar a semifinales.' },
    ],
    curiosidades: [
      'Uruguay tiene 4 estrellas en su escudo: 2 Mundiales y 2 Juegos Olímpicos de 1924 y 1928.',
      'Es la selección con menor población que ha sido campeona del mundo.',
      'Luis Suárez es el máximo goleador histórico de la Celeste.'
    ],
    sedeEntrenamiento: { ciudad: 'Miami', pais: 'Estados Unidos' },
  },
  japon: {
    historia: 'Japón ha crecido de forma constante desde su debut en 1998. Ha llegado a octavos de final en varias ediciones y es la selección más fuerte de Asia en la última década.',
    clasificacion: 'Se clasificó de manera directa por la AFC liderando su grupo en las eliminatorias asiáticas con un juego colectivo muy ordenado.',
    datosClave: 'Japón sorprendió al mundo en Qatar 2022 al vencer a Alemania y España en la fase de grupos.',
    jugadoresClave: [
      { nombre: 'Takefusa Kubo', club: 'Real Sociedad', posicion: 'MED', golesIntl: 6, internacionalidades: 42 },
      { nombre: 'Daichi Kamada', club: 'Crystal Palace', posicion: 'MED', golesIntl: 9, internacionalidades: 38 },
      { nombre: 'Wataru Endo', club: 'Liverpool', posicion: 'MED', golesIntl: 2, internacionalidades: 62 },
    ],
    cuerpoTecnico: { dt: 'Hajime Moriyasu', capitan: 'Wataru Endo', estrella: 'Takefusa Kubo' },
    estadisticasMundial: { pj: 25, pg: 8, pe: 6, pp: 11, gf: 28, gc: 35 },
    palmares: [
      { year: 2002, result: 'Octavos de final', host: 'Corea / Japón', hostFlag: 'jp' },
      { year: 2010, result: 'Octavos de final', host: 'Sudáfrica', hostFlag: 'za' },
      { year: 2018, result: 'Octavos de final', host: 'Rusia', hostFlag: 'ru' },
      { year: 2022, result: 'Octavos de final', host: 'Qatar', hostFlag: 'qa' },
    ],
    partidosIronicos: [
      { rival: 'Alemania', rivalFlag: 'de', result: '2-1', year: 2022, stage: 'Fase de grupos', context: 'Remontada épica con goles de Doan y Asano para un triunfo histórico.' },
      { rival: 'España', rivalFlag: 'es', result: '2-1', year: 2022, stage: 'Fase de grupos', context: 'Victoria agónica que le permitió ganar el grupo ante una de las favoritas.' },
      { rival: 'Bélgica', rivalFlag: 'be', result: '2-3', year: 2018, stage: 'Octavos de final', context: 'Japón iba ganando 2-0 pero Bélgica remontó con un gol agónico de Chadli en el último minuto.' },
    ],
    curiosidades: [
      'Japón ha ganado el premio Fair Play de la FIFA en múltiples ediciones.',
      'Su técnico Hajime Moriyasu fue jugador de la selección en Francia 1998.',
      'La J-League es considerada una de las mejores ligas de Asia.'
    ],
    sedeEntrenamiento: { ciudad: 'San Francisco', pais: 'Estados Unidos' },
  },
  marruecos: {
    historia: 'Marruecos hizo historia en Qatar 2022 al convertirse en la primera selección africana y árabe en llegar a semifinales de un Mundial. Su campaña dejó una huella imborrable en el continente.',
    clasificacion: 'Se clasificó de manera directa por la CAF tras un proceso impecable donde mostró una defensa de hierro y un juego colectivo ejemplar.',
    datosClave: 'En Qatar 2022 eliminó a España y Portugal antes de caer ante Francia en semifinales.',
    jugadoresClave: [
      { nombre: 'Achraf Hakimi', club: 'PSG', posicion: 'DEF', golesIntl: 8, internacionalidades: 75 },
      { nombre: 'Youssef En-Nesyri', club: 'Fenerbahçe', posicion: 'DEL', golesIntl: 22, internacionalidades: 72 },
      { nombre: 'Sofyan Amrabat', club: 'Manchester United', posicion: 'MED', golesIntl: 0, internacionalidades: 55 },
    ],
    cuerpoTecnico: { dt: 'Walid Regragui', capitan: 'Romain Saïss', estrella: 'Achraf Hakimi' },
    estadisticasMundial: { pj: 23, pg: 6, pe: 7, pp: 10, gf: 22, gc: 28 },
    palmares: [
      { year: 2022, result: 'Semifinales', host: 'Qatar', hostFlag: 'qa' },
      { year: 1986, result: 'Octavos de final', host: 'México', hostFlag: 'mx' },
    ],
    partidosIronicos: [
      { rival: 'España', rivalFlag: 'es', result: '0-0 (3-0 pen)', year: 2022, stage: 'Octavos de final', context: 'Penales perfectos para eliminar a España en una noche histórica en El Rayán.' },
      { rival: 'Portugal', rivalFlag: 'pt', result: '1-0', year: 2022, stage: 'Cuartos de final', context: 'En-Nesyri anotó de cabeza y Marruecos selló su pase a semifinales.' },
    ],
    curiosidades: [
      'Marruecos fue la primera selección africana en ganar un grupo en un Mundial.',
      'Su portero Bono fue figura clave en la campaña de Qatar 2022.',
      'Walid Regragui es el primer técnico marroquí en llevar a la selección a semifinales.'
    ],
    sedeEntrenamiento: { ciudad: 'Houston', pais: 'Estados Unidos' },
  },
};

function estimateStats(mundiales: number): EstadisticasMundial {
  // Simple heuristic based on appearances
  const pj = Math.max(3, mundiales * 4 + Math.floor(Math.random() * 8));
  const pg = Math.floor(pj * 0.35);
  const pe = Math.floor(pj * 0.25);
  const pp = pj - pg - pe;
  const gf = pg * 2 + Math.floor(pj * 0.4);
  const gc = pp * 2 + Math.floor(pj * 0.5);
  return { pj, pg, pe, pp, gf, gc };
}

function getConfederationCuriosity(conf: string): string {
  switch (conf) {
    case 'UEFA':
      return 'Europa aporta 16 selecciones al Mundial 2026, el mayor contingente de su historia.';
    case 'CONMEBOL':
      return 'CONMEBOL tiene 6 plazas directas más 1 repescante, una presencia histórica para Sudamérica.';
    case 'CONCACAF':
      return 'CONCACAF alberga el Mundial por tercera vez y cuenta con 6 plazas en esta edición.';
    case 'CAF':
      return 'África estará representada por 9 selecciones, consolidando el crecimiento del fútbol africano.';
    case 'AFC':
      return 'Asia aporta 8 selecciones al torneo, su mayor representación hasta la fecha.';
    case 'OFC':
      return 'OFC tendrá una plaza garantizada por primera vez en la historia de la Copa del Mundo.';
    default:
      return 'Participa en su primera edición del Mundial de Fútbol.';
  }
}

export function buildFallbackExtended(seleccion: Seleccion): SeleccionExtendedBase {
  const { nombre, mundiales, mejorResultado, confederacion, esAnfitrion, rankingFIFA } = seleccion;

  const historia = mundiales > 0
    ? `${nombre} cuenta con ${mundiales} participaciones en la historia de los Mundiales. Su mejor resultado fue ${mejorResultado.toLowerCase()}. Se prepara con ilusión para el Mundial 2026.`
    : `${nombre} hará su debut absoluto en una Copa del Mundo en 2026, una cita histórica para su fútbol.`;

  const clasificacion = esAnfitrion
    ? `${nombre} se clasificó automáticamente como uno de los países anfitriones del Mundial 2026.`
    : `${nombre} obtuvo su plaza para el Mundial 2026 a través del proceso clasificatorio de ${confederacion}.`;

  const datosClave = rankingFIFA && rankingFIFA <= 20
    ? `Se encuentra entre las 20 mejores selecciones del ranking FIFA.`
    : getConfederationCuriosity(confederacion);

  const genericPlayers: Jugador[] = [
    { nombre: 'Capitán', club: 'Club Principal', posicion: 'MED', golesIntl: 5, internacionalidades: 45 },
    { nombre: 'Portero titular', club: 'Club Europeo', posicion: 'POR', golesIntl: 0, internacionalidades: 32 },
    { nombre: 'Delantero estrella', club: 'Club Internacional', posicion: 'DEL', golesIntl: 12, internacionalidades: 28 },
  ];

  return {
    historia,
    clasificacion,
    datosClave,
    jugadoresClave: genericPlayers,
    cuerpoTecnico: { dt: 'Cuerpo técnico nacional', capitan: 'Capitán', estrella: 'Figura destacada' },
    estadisticasMundial: estimateStats(mundiales),
    palmares: [],
    partidosIronicos: [],
    curiosidades: [
      getConfederationCuriosity(confederacion),
      mundiales > 0 ? `Ha jugado ${mundiales} ediciones de la Copa del Mundo.` : 'Será su primera experiencia mundialista.',
    ],
    proximosPartidos: [],
    sedeEntrenamiento: { ciudad: 'Por confirmar', pais: 'Estados Unidos' },
  };
}

export function getExtendedSeleccion(slug: string): SeleccionExtended | undefined {
  const base = getSeleccionBySlug(slug);
  if (!base) return undefined;

  const enriched = SELECCIONES_EXTENDED_BASE[slug] ?? buildFallbackExtended(base);

  return {
    ...base,
    historia: enriched.historia ?? '',
    clasificacion: enriched.clasificacion ?? '',
    datosClave: enriched.datosClave ?? '',
    jugadoresClave: enriched.jugadoresClave ?? [],
    cuerpoTecnico: enriched.cuerpoTecnico ?? { dt: '', capitan: '', estrella: '' },
    estadisticasMundial: enriched.estadisticasMundial ?? { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
    palmares: enriched.palmares ?? [],
    partidosIronicos: enriched.partidosIronicos ?? [],
    curiosidades: enriched.curiosidades ?? [],
    proximosPartidos: enriched.proximosPartidos ?? [],
    sedeEntrenamiento: enriched.sedeEntrenamiento ?? { ciudad: '', pais: '' },
  };
}
