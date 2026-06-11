// src/data/calendario.ts
//
// ⚠️ ARCHIVO GENERADO — NO EDITAR A MANO.
// Fuente de verdad: src/data/matches.ts (1:1 con el Excel oficial FIFA).
// Regenerar con:  node scripts/generate-calendario.mjs
//
// "fecha" está en ISO 8601 UTC (matches.ts guarda hora ET; aquí ya convertida).

export interface Partido {
  id: string;
  matchId: number; // = Match.i de matches.ts; clave del LiveMap (/api/calendario/live)
  grupo: string;
  jornada: number;
  fecha: string; // ISO 8601 UTC
  estadio: string;
  ciudad: string;
  homeSlug: string;
  awaySlug: string;
}

export const CALENDARIO: Partido[] = [
  // =============================================
  // GRUPO A: mexico, sudafrica, corea-del-sur, republica-checa
  // =============================================
  // Jornada 1
  { id: "A1", matchId: 1, grupo: "A", jornada: 1, fecha: "2026-06-11T19:00:00Z", estadio: "Estadio Azteca", ciudad: "Ciudad de México", homeSlug: "mexico", awaySlug: "sudafrica" },
  { id: "A2", matchId: 2, grupo: "A", jornada: 1, fecha: "2026-06-12T02:00:00Z", estadio: "Estadio Akron", ciudad: "Guadalajara", homeSlug: "corea-del-sur", awaySlug: "republica-checa" },
  // Jornada 2
  { id: "A3", matchId: 25, grupo: "A", jornada: 2, fecha: "2026-06-18T16:00:00Z", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta", homeSlug: "republica-checa", awaySlug: "sudafrica" },
  { id: "A4", matchId: 28, grupo: "A", jornada: 2, fecha: "2026-06-19T01:00:00Z", estadio: "Estadio Akron", ciudad: "Guadalajara", homeSlug: "mexico", awaySlug: "corea-del-sur" },
  // Jornada 3
  { id: "A5", matchId: 53, grupo: "A", jornada: 3, fecha: "2026-06-25T01:00:00Z", estadio: "Estadio Azteca", ciudad: "Ciudad de México", homeSlug: "republica-checa", awaySlug: "mexico" },
  { id: "A6", matchId: 54, grupo: "A", jornada: 3, fecha: "2026-06-25T01:00:00Z", estadio: "Estadio BBVA", ciudad: "Monterrey", homeSlug: "sudafrica", awaySlug: "corea-del-sur" },

  // =============================================
  // GRUPO B: canada, bosnia, qatar, suiza
  // =============================================
  // Jornada 1
  { id: "B1", matchId: 3, grupo: "B", jornada: 1, fecha: "2026-06-12T19:00:00Z", estadio: "BMO Field", ciudad: "Toronto", homeSlug: "canada", awaySlug: "bosnia" },
  { id: "B2", matchId: 8, grupo: "B", jornada: 1, fecha: "2026-06-13T19:00:00Z", estadio: "Levi's Stadium", ciudad: "Bay Area", homeSlug: "qatar", awaySlug: "suiza" },
  // Jornada 2
  { id: "B3", matchId: 26, grupo: "B", jornada: 2, fecha: "2026-06-18T19:00:00Z", estadio: "SoFi Stadium", ciudad: "Los Ángeles", homeSlug: "suiza", awaySlug: "bosnia" },
  { id: "B4", matchId: 27, grupo: "B", jornada: 2, fecha: "2026-06-18T22:00:00Z", estadio: "BC Place", ciudad: "Vancouver", homeSlug: "canada", awaySlug: "qatar" },
  // Jornada 3
  { id: "B5", matchId: 51, grupo: "B", jornada: 3, fecha: "2026-06-24T19:00:00Z", estadio: "BC Place", ciudad: "Vancouver", homeSlug: "suiza", awaySlug: "canada" },
  { id: "B6", matchId: 52, grupo: "B", jornada: 3, fecha: "2026-06-24T19:00:00Z", estadio: "Lumen Field", ciudad: "Seattle", homeSlug: "bosnia", awaySlug: "qatar" },

  // =============================================
  // GRUPO C: brasil, marruecos, haiti, escocia
  // =============================================
  // Jornada 1
  { id: "C1", matchId: 7, grupo: "C", jornada: 1, fecha: "2026-06-13T22:00:00Z", estadio: "MetLife Stadium", ciudad: "Nueva York/NJ", homeSlug: "brasil", awaySlug: "marruecos" },
  { id: "C2", matchId: 5, grupo: "C", jornada: 1, fecha: "2026-06-14T01:00:00Z", estadio: "Gillette Stadium", ciudad: "Boston", homeSlug: "haiti", awaySlug: "escocia" },
  // Jornada 2
  { id: "C3", matchId: 30, grupo: "C", jornada: 2, fecha: "2026-06-19T22:00:00Z", estadio: "Gillette Stadium", ciudad: "Boston", homeSlug: "escocia", awaySlug: "marruecos" },
  { id: "C4", matchId: 29, grupo: "C", jornada: 2, fecha: "2026-06-20T01:00:00Z", estadio: "Lincoln Financial Field", ciudad: "Filadelfia", homeSlug: "brasil", awaySlug: "haiti" },
  // Jornada 3
  { id: "C5", matchId: 49, grupo: "C", jornada: 3, fecha: "2026-06-24T22:00:00Z", estadio: "Hard Rock Stadium", ciudad: "Miami", homeSlug: "escocia", awaySlug: "brasil" },
  { id: "C6", matchId: 50, grupo: "C", jornada: 3, fecha: "2026-06-24T22:00:00Z", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta", homeSlug: "marruecos", awaySlug: "haiti" },

  // =============================================
  // GRUPO D: estados-unidos, paraguay, australia, turquia
  // =============================================
  // Jornada 1
  { id: "D1", matchId: 4, grupo: "D", jornada: 1, fecha: "2026-06-13T01:00:00Z", estadio: "SoFi Stadium", ciudad: "Los Ángeles", homeSlug: "estados-unidos", awaySlug: "paraguay" },
  { id: "D2", matchId: 6, grupo: "D", jornada: 1, fecha: "2026-06-14T03:59:00Z", estadio: "BC Place", ciudad: "Vancouver", homeSlug: "australia", awaySlug: "turquia" },
  // Jornada 2
  { id: "D3", matchId: 32, grupo: "D", jornada: 2, fecha: "2026-06-19T19:00:00Z", estadio: "Lumen Field", ciudad: "Seattle", homeSlug: "estados-unidos", awaySlug: "australia" },
  { id: "D4", matchId: 31, grupo: "D", jornada: 2, fecha: "2026-06-20T03:59:00Z", estadio: "Levi's Stadium", ciudad: "Bay Area", homeSlug: "turquia", awaySlug: "paraguay" },
  // Jornada 3
  { id: "D5", matchId: 59, grupo: "D", jornada: 3, fecha: "2026-06-26T02:00:00Z", estadio: "SoFi Stadium", ciudad: "Los Ángeles", homeSlug: "turquia", awaySlug: "estados-unidos" },
  { id: "D6", matchId: 60, grupo: "D", jornada: 3, fecha: "2026-06-26T02:00:00Z", estadio: "Levi's Stadium", ciudad: "Bay Area", homeSlug: "paraguay", awaySlug: "australia" },

  // =============================================
  // GRUPO E: alemania, curazao, costa-de-marfil, ecuador
  // =============================================
  // Jornada 1
  { id: "E1", matchId: 10, grupo: "E", jornada: 1, fecha: "2026-06-14T17:00:00Z", estadio: "NRG Stadium", ciudad: "Houston", homeSlug: "alemania", awaySlug: "curazao" },
  { id: "E2", matchId: 9, grupo: "E", jornada: 1, fecha: "2026-06-14T23:00:00Z", estadio: "Lincoln Financial Field", ciudad: "Filadelfia", homeSlug: "costa-de-marfil", awaySlug: "ecuador" },
  // Jornada 2
  { id: "E3", matchId: 33, grupo: "E", jornada: 2, fecha: "2026-06-20T20:00:00Z", estadio: "BMO Field", ciudad: "Toronto", homeSlug: "alemania", awaySlug: "costa-de-marfil" },
  { id: "E4", matchId: 34, grupo: "E", jornada: 2, fecha: "2026-06-21T00:00:00Z", estadio: "Arrowhead Stadium", ciudad: "Kansas City", homeSlug: "ecuador", awaySlug: "curazao" },
  // Jornada 3
  { id: "E5", matchId: 55, grupo: "E", jornada: 3, fecha: "2026-06-25T20:00:00Z", estadio: "Lincoln Financial Field", ciudad: "Filadelfia", homeSlug: "curazao", awaySlug: "costa-de-marfil" },
  { id: "E6", matchId: 56, grupo: "E", jornada: 3, fecha: "2026-06-25T20:00:00Z", estadio: "MetLife Stadium", ciudad: "Nueva York/NJ", homeSlug: "ecuador", awaySlug: "alemania" },

  // =============================================
  // GRUPO F: paises-bajos, japon, suecia, tunez
  // =============================================
  // Jornada 1
  { id: "F1", matchId: 11, grupo: "F", jornada: 1, fecha: "2026-06-14T20:00:00Z", estadio: "AT&T Stadium", ciudad: "Dallas", homeSlug: "paises-bajos", awaySlug: "japon" },
  { id: "F2", matchId: 12, grupo: "F", jornada: 1, fecha: "2026-06-15T02:00:00Z", estadio: "Estadio BBVA", ciudad: "Monterrey", homeSlug: "suecia", awaySlug: "tunez" },
  // Jornada 2
  { id: "F3", matchId: 35, grupo: "F", jornada: 2, fecha: "2026-06-20T17:00:00Z", estadio: "NRG Stadium", ciudad: "Houston", homeSlug: "paises-bajos", awaySlug: "suecia" },
  { id: "F4", matchId: 36, grupo: "F", jornada: 2, fecha: "2026-06-21T03:59:00Z", estadio: "Estadio BBVA", ciudad: "Monterrey", homeSlug: "tunez", awaySlug: "japon" },
  // Jornada 3
  { id: "F5", matchId: 57, grupo: "F", jornada: 3, fecha: "2026-06-25T23:00:00Z", estadio: "AT&T Stadium", ciudad: "Dallas", homeSlug: "japon", awaySlug: "suecia" },
  { id: "F6", matchId: 58, grupo: "F", jornada: 3, fecha: "2026-06-25T23:00:00Z", estadio: "Arrowhead Stadium", ciudad: "Kansas City", homeSlug: "tunez", awaySlug: "paises-bajos" },

  // =============================================
  // GRUPO G: belgica, egipto, iran, nueva-zelanda
  // =============================================
  // Jornada 1
  { id: "G1", matchId: 16, grupo: "G", jornada: 1, fecha: "2026-06-15T19:00:00Z", estadio: "Lumen Field", ciudad: "Seattle", homeSlug: "belgica", awaySlug: "egipto" },
  { id: "G2", matchId: 15, grupo: "G", jornada: 1, fecha: "2026-06-16T01:00:00Z", estadio: "SoFi Stadium", ciudad: "Los Ángeles", homeSlug: "iran", awaySlug: "nueva-zelanda" },
  // Jornada 2
  { id: "G3", matchId: 39, grupo: "G", jornada: 2, fecha: "2026-06-21T19:00:00Z", estadio: "SoFi Stadium", ciudad: "Los Ángeles", homeSlug: "belgica", awaySlug: "iran" },
  { id: "G4", matchId: 40, grupo: "G", jornada: 2, fecha: "2026-06-22T01:00:00Z", estadio: "BC Place", ciudad: "Vancouver", homeSlug: "nueva-zelanda", awaySlug: "egipto" },
  // Jornada 3
  { id: "G5", matchId: 63, grupo: "G", jornada: 3, fecha: "2026-06-27T03:00:00Z", estadio: "Lumen Field", ciudad: "Seattle", homeSlug: "egipto", awaySlug: "iran" },
  { id: "G6", matchId: 64, grupo: "G", jornada: 3, fecha: "2026-06-27T03:00:00Z", estadio: "BC Place", ciudad: "Vancouver", homeSlug: "nueva-zelanda", awaySlug: "belgica" },

  // =============================================
  // GRUPO H: espana, cabo-verde, arabia-saudi, uruguay
  // =============================================
  // Jornada 1
  { id: "H1", matchId: 14, grupo: "H", jornada: 1, fecha: "2026-06-15T16:00:00Z", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta", homeSlug: "espana", awaySlug: "cabo-verde" },
  { id: "H2", matchId: 13, grupo: "H", jornada: 1, fecha: "2026-06-15T22:00:00Z", estadio: "Hard Rock Stadium", ciudad: "Miami", homeSlug: "arabia-saudi", awaySlug: "uruguay" },
  // Jornada 2
  { id: "H3", matchId: 38, grupo: "H", jornada: 2, fecha: "2026-06-21T16:00:00Z", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta", homeSlug: "espana", awaySlug: "arabia-saudi" },
  { id: "H4", matchId: 37, grupo: "H", jornada: 2, fecha: "2026-06-21T22:00:00Z", estadio: "Hard Rock Stadium", ciudad: "Miami", homeSlug: "uruguay", awaySlug: "cabo-verde" },
  // Jornada 3
  { id: "H5", matchId: 65, grupo: "H", jornada: 3, fecha: "2026-06-27T00:00:00Z", estadio: "NRG Stadium", ciudad: "Houston", homeSlug: "cabo-verde", awaySlug: "arabia-saudi" },
  { id: "H6", matchId: 66, grupo: "H", jornada: 3, fecha: "2026-06-27T00:00:00Z", estadio: "Estadio Akron", ciudad: "Guadalajara", homeSlug: "uruguay", awaySlug: "espana" },

  // =============================================
  // GRUPO I: francia, senegal, irak, noruega
  // =============================================
  // Jornada 1
  { id: "I1", matchId: 17, grupo: "I", jornada: 1, fecha: "2026-06-16T19:00:00Z", estadio: "MetLife Stadium", ciudad: "Nueva York/NJ", homeSlug: "francia", awaySlug: "senegal" },
  { id: "I2", matchId: 18, grupo: "I", jornada: 1, fecha: "2026-06-16T22:00:00Z", estadio: "Gillette Stadium", ciudad: "Boston", homeSlug: "irak", awaySlug: "noruega" },
  // Jornada 2
  { id: "I3", matchId: 42, grupo: "I", jornada: 2, fecha: "2026-06-22T21:00:00Z", estadio: "Lincoln Financial Field", ciudad: "Filadelfia", homeSlug: "francia", awaySlug: "irak" },
  { id: "I4", matchId: 41, grupo: "I", jornada: 2, fecha: "2026-06-23T00:00:00Z", estadio: "MetLife Stadium", ciudad: "Nueva York/NJ", homeSlug: "noruega", awaySlug: "senegal" },
  // Jornada 3
  { id: "I5", matchId: 61, grupo: "I", jornada: 3, fecha: "2026-06-26T19:00:00Z", estadio: "Gillette Stadium", ciudad: "Boston", homeSlug: "noruega", awaySlug: "francia" },
  { id: "I6", matchId: 62, grupo: "I", jornada: 3, fecha: "2026-06-26T19:00:00Z", estadio: "BMO Field", ciudad: "Toronto", homeSlug: "senegal", awaySlug: "irak" },

  // =============================================
  // GRUPO J: argentina, argelia, austria, jordania
  // =============================================
  // Jornada 1
  { id: "J1", matchId: 19, grupo: "J", jornada: 1, fecha: "2026-06-17T01:00:00Z", estadio: "Arrowhead Stadium", ciudad: "Kansas City", homeSlug: "argentina", awaySlug: "argelia" },
  { id: "J2", matchId: 20, grupo: "J", jornada: 1, fecha: "2026-06-17T03:59:00Z", estadio: "Levi's Stadium", ciudad: "Bay Area", homeSlug: "austria", awaySlug: "jordania" },
  // Jornada 2
  { id: "J3", matchId: 43, grupo: "J", jornada: 2, fecha: "2026-06-22T17:00:00Z", estadio: "AT&T Stadium", ciudad: "Dallas", homeSlug: "argentina", awaySlug: "austria" },
  { id: "J4", matchId: 44, grupo: "J", jornada: 2, fecha: "2026-06-23T03:00:00Z", estadio: "Levi's Stadium", ciudad: "Bay Area", homeSlug: "jordania", awaySlug: "argelia" },
  // Jornada 3
  { id: "J5", matchId: 69, grupo: "J", jornada: 3, fecha: "2026-06-28T02:00:00Z", estadio: "Arrowhead Stadium", ciudad: "Kansas City", homeSlug: "argelia", awaySlug: "austria" },
  { id: "J6", matchId: 70, grupo: "J", jornada: 3, fecha: "2026-06-28T02:00:00Z", estadio: "AT&T Stadium", ciudad: "Dallas", homeSlug: "jordania", awaySlug: "argentina" },

  // =============================================
  // GRUPO K: portugal, rd-congo, uzbekistan, colombia
  // =============================================
  // Jornada 1
  { id: "K1", matchId: 23, grupo: "K", jornada: 1, fecha: "2026-06-17T17:00:00Z", estadio: "NRG Stadium", ciudad: "Houston", homeSlug: "portugal", awaySlug: "rd-congo" },
  { id: "K2", matchId: 24, grupo: "K", jornada: 1, fecha: "2026-06-18T02:00:00Z", estadio: "Estadio Azteca", ciudad: "Ciudad de México", homeSlug: "uzbekistan", awaySlug: "colombia" },
  // Jornada 2
  { id: "K3", matchId: 47, grupo: "K", jornada: 2, fecha: "2026-06-23T17:00:00Z", estadio: "NRG Stadium", ciudad: "Houston", homeSlug: "portugal", awaySlug: "uzbekistan" },
  { id: "K4", matchId: 48, grupo: "K", jornada: 2, fecha: "2026-06-24T02:00:00Z", estadio: "Estadio Akron", ciudad: "Guadalajara", homeSlug: "colombia", awaySlug: "rd-congo" },
  // Jornada 3
  { id: "K5", matchId: 71, grupo: "K", jornada: 3, fecha: "2026-06-27T23:30:00Z", estadio: "Hard Rock Stadium", ciudad: "Miami", homeSlug: "colombia", awaySlug: "portugal" },
  { id: "K6", matchId: 72, grupo: "K", jornada: 3, fecha: "2026-06-27T23:30:00Z", estadio: "Mercedes-Benz Stadium", ciudad: "Atlanta", homeSlug: "rd-congo", awaySlug: "uzbekistan" },

  // =============================================
  // GRUPO L: inglaterra, croacia, ghana, panama
  // =============================================
  // Jornada 1
  { id: "L1", matchId: 21, grupo: "L", jornada: 1, fecha: "2026-06-17T20:00:00Z", estadio: "AT&T Stadium", ciudad: "Dallas", homeSlug: "inglaterra", awaySlug: "croacia" },
  { id: "L2", matchId: 22, grupo: "L", jornada: 1, fecha: "2026-06-17T23:00:00Z", estadio: "BMO Field", ciudad: "Toronto", homeSlug: "ghana", awaySlug: "panama" },
  // Jornada 2
  { id: "L3", matchId: 45, grupo: "L", jornada: 2, fecha: "2026-06-23T20:00:00Z", estadio: "Gillette Stadium", ciudad: "Boston", homeSlug: "inglaterra", awaySlug: "ghana" },
  { id: "L4", matchId: 46, grupo: "L", jornada: 2, fecha: "2026-06-23T23:00:00Z", estadio: "BMO Field", ciudad: "Toronto", homeSlug: "panama", awaySlug: "croacia" },
  // Jornada 3
  { id: "L5", matchId: 67, grupo: "L", jornada: 3, fecha: "2026-06-27T21:00:00Z", estadio: "MetLife Stadium", ciudad: "Nueva York/NJ", homeSlug: "panama", awaySlug: "inglaterra" },
  { id: "L6", matchId: 68, grupo: "L", jornada: 3, fecha: "2026-06-27T21:00:00Z", estadio: "Lincoln Financial Field", ciudad: "Filadelfia", homeSlug: "croacia", awaySlug: "ghana" },
];

/** Devuelve todos los partidos de un grupo, ordenados por jornada. */
export function getPartidosByGrupo(grupo: string): Partido[] {
  return CALENDARIO.filter((p) => p.grupo === grupo).sort(
    (a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha),
  );
}

/** Partidos de un grupo en una jornada concreta. */
export function getPartidosByJornada(grupo: string, jornada: number): Partido[] {
  return CALENDARIO.filter((p) => p.grupo === grupo && p.jornada === jornada);
}

/** Devuelve todos los partidos de una fecha concreta (formato "YYYY-MM-DD"). */
export function getPartidosByFecha(fecha: string): Partido[] {
  return CALENDARIO.filter((p) => p.fecha.startsWith(fecha));
}

/** Devuelve todos los partidos en los que participa una selección (por slug). */
export function getPartidosByEquipo(slug: string): Partido[] {
  return CALENDARIO.filter(
    (p) => p.homeSlug === slug || p.awaySlug === slug,
  );
}

export function getPartidosByEstadio(estadio: string): Partido[] {
  return CALENDARIO.filter(
    (p) => p.estadio.toLowerCase().includes(estadio.toLowerCase()),
  );
}

export function getPartidosByCiudad(ciudad: string): Partido[] {
  return CALENDARIO.filter(
    (p) => p.ciudad.toLowerCase().includes(ciudad.toLowerCase()),
  );
}
