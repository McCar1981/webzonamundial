// src/lib/bracket/teams.ts
// 48 selecciones REALES clasificadas al Mundial 2026, derivadas de src/data/matches.ts.
//
// Fuente única de verdad: matches.ts (fixtures oficiales). Si se corrige un grupo
// allí, el bracket se actualiza solo. Cada equipo lleva:
//   - id (ISO upper) — clave estable para state.picks
//   - name — display ES
//   - iso — código flagcdn (lowercase, soporta gb-eng / gb-sct)
//   - slug — slug BIBLIA (puede no existir si no hay ficha)
//   - group — letra A-L
//   - color — color primario para nodo radial / chip clásico

export type ConfedId = "UEFA" | "CONMEBOL" | "CONCACAF" | "AFC" | "CAF" | "OFC";

export interface BracketTeam {
  id: string;
  name: string;
  iso: string;
  slug: string;
  group: string;
  color: string;
  confed: ConfedId;
}

// 48 equipos en orden de grupos (A1..A4, B1..B4, ..., L1..L4).
// Orden dentro del grupo respeta el "cabeza de serie" implícito de matches.ts.
export const BRACKET_TEAMS: BracketTeam[] = [
  // Grupo A
  { id: "MEX", name: "México",         iso: "mx",     slug: "mexico",         group: "A", color: "#0E5C36", confed: "CONCACAF" },
  { id: "ZAF", name: "Sudáfrica",      iso: "za",     slug: "sudafrica",      group: "A", color: "#007A4D", confed: "CAF" },
  { id: "KOR", name: "Corea del Sur",  iso: "kr",     slug: "corea-del-sur",  group: "A", color: "#003478", confed: "AFC" },
  { id: "CZE", name: "Rep. Checa",     iso: "cz",     slug: "chequia",        group: "A", color: "#11457E", confed: "UEFA" },
  // Grupo B
  { id: "CAN", name: "Canadá",         iso: "ca",     slug: "canada",         group: "B", color: "#FF0000", confed: "CONCACAF" },
  { id: "QAT", name: "Qatar",          iso: "qa",     slug: "qatar",          group: "B", color: "#8A1538", confed: "AFC" },
  { id: "BIH", name: "Bosnia",         iso: "ba",     slug: "bosnia",         group: "B", color: "#002395", confed: "UEFA" },
  { id: "SUI", name: "Suiza",          iso: "ch",     slug: "suiza",          group: "B", color: "#DA291C", confed: "UEFA" },
  // Grupo C
  { id: "BRA", name: "Brasil",         iso: "br",     slug: "brasil",         group: "C", color: "#009C3B", confed: "CONMEBOL" },
  { id: "HAI", name: "Haití",          iso: "ht",     slug: "haiti",          group: "C", color: "#00209F", confed: "CONCACAF" },
  { id: "MAR", name: "Marruecos",      iso: "ma",     slug: "marruecos",      group: "C", color: "#C1272D", confed: "CAF" },
  { id: "SCO", name: "Escocia",        iso: "gb-sct", slug: "escocia",        group: "C", color: "#0065BD", confed: "UEFA" },
  // Grupo D
  { id: "USA", name: "Estados Unidos", iso: "us",     slug: "estados-unidos", group: "D", color: "#3C3B6E", confed: "CONCACAF" },
  { id: "AUS", name: "Australia",      iso: "au",     slug: "australia",      group: "D", color: "#FFCD00", confed: "AFC" },
  { id: "PAR", name: "Paraguay",       iso: "py",     slug: "paraguay",       group: "D", color: "#0038A8", confed: "CONMEBOL" },
  { id: "TUR", name: "Turquía",        iso: "tr",     slug: "turquia",        group: "D", color: "#E30A17", confed: "UEFA" },
  // Grupo E
  { id: "GER", name: "Alemania",       iso: "de",     slug: "alemania",       group: "E", color: "#1A1A1A", confed: "UEFA" },
  { id: "CIV", name: "Costa de Marfil",iso: "ci",     slug: "costa-de-marfil",group: "E", color: "#F77F00", confed: "CAF" },
  { id: "CUW", name: "Curazao",        iso: "cw",     slug: "curazao",        group: "E", color: "#002F87", confed: "CONCACAF" },
  { id: "ECU", name: "Ecuador",        iso: "ec",     slug: "ecuador",        group: "E", color: "#FFCE00", confed: "CONMEBOL" },
  // Grupo F
  { id: "NED", name: "Países Bajos",   iso: "nl",     slug: "paises-bajos",   group: "F", color: "#F36C21", confed: "UEFA" },
  { id: "TUN", name: "Túnez",          iso: "tn",     slug: "tunez",          group: "F", color: "#E70013", confed: "CAF" },
  { id: "JPN", name: "Japón",          iso: "jp",     slug: "japon",          group: "F", color: "#BC002D", confed: "AFC" },
  { id: "SWE", name: "Suecia",         iso: "se",     slug: "suecia",         group: "F", color: "#006AA7", confed: "UEFA" },
  // Grupo G
  { id: "BEL", name: "Bélgica",        iso: "be",     slug: "belgica",        group: "G", color: "#EF3340", confed: "UEFA" },
  { id: "NZL", name: "Nueva Zelanda",  iso: "nz",     slug: "nueva-zelanda",  group: "G", color: "#0A1F3D", confed: "OFC" },
  { id: "EGY", name: "Egipto",         iso: "eg",     slug: "egipto",         group: "G", color: "#CE1126", confed: "CAF" },
  { id: "IRN", name: "Irán",           iso: "ir",     slug: "iran",           group: "G", color: "#239F40", confed: "AFC" },
  // Grupo H
  { id: "ESP", name: "España",         iso: "es",     slug: "espana",         group: "H", color: "#C60B1E", confed: "UEFA" },
  { id: "CPV", name: "Cabo Verde",     iso: "cv",     slug: "cabo-verde",     group: "H", color: "#003893", confed: "CAF" },
  { id: "URU", name: "Uruguay",        iso: "uy",     slug: "uruguay",        group: "H", color: "#7CB9E8", confed: "CONMEBOL" },
  { id: "KSA", name: "Arabia Saudí",   iso: "sa",     slug: "arabia-saudi",   group: "H", color: "#006C35", confed: "AFC" },
  // Grupo I
  { id: "FRA", name: "Francia",        iso: "fr",     slug: "francia",        group: "I", color: "#0055A4", confed: "UEFA" },
  { id: "SEN", name: "Senegal",        iso: "sn",     slug: "senegal",        group: "I", color: "#00853F", confed: "CAF" },
  { id: "NOR", name: "Noruega",        iso: "no",     slug: "noruega",        group: "I", color: "#EF2B2D", confed: "UEFA" },
  { id: "IRQ", name: "Irak",           iso: "iq",     slug: "irak",           group: "I", color: "#CE1126", confed: "AFC" },
  // Grupo J
  { id: "ARG", name: "Argentina",      iso: "ar",     slug: "argentina",      group: "J", color: "#75AADB", confed: "CONMEBOL" },
  { id: "ALG", name: "Argelia",        iso: "dz",     slug: "argelia",        group: "J", color: "#006633", confed: "CAF" },
  { id: "AUT", name: "Austria",        iso: "at",     slug: "austria",        group: "J", color: "#ED2939", confed: "UEFA" },
  { id: "JOR", name: "Jordania",       iso: "jo",     slug: "jordania",       group: "J", color: "#000000", confed: "AFC" },
  // Grupo K
  { id: "POR", name: "Portugal",       iso: "pt",     slug: "portugal",       group: "K", color: "#006600", confed: "UEFA" },
  { id: "UZB", name: "Uzbekistán",     iso: "uz",     slug: "uzbekistan",     group: "K", color: "#0099B5", confed: "AFC" },
  { id: "COL", name: "Colombia",       iso: "co",     slug: "colombia",       group: "K", color: "#FCD116", confed: "CONMEBOL" },
  { id: "COD", name: "RD Congo",       iso: "cd",     slug: "rd-congo",       group: "K", color: "#007FFF", confed: "CAF" },
  // Grupo L
  { id: "ENG", name: "Inglaterra",     iso: "gb-eng", slug: "inglaterra",     group: "L", color: "#FFFFFF", confed: "UEFA" },
  { id: "CRO", name: "Croacia",        iso: "hr",     slug: "croacia",        group: "L", color: "#FF0000", confed: "UEFA" },
  { id: "GHA", name: "Ghana",          iso: "gh",     slug: "ghana",          group: "L", color: "#CE1126", confed: "CAF" },
  { id: "PAN", name: "Panamá",         iso: "pa",     slug: "panama",         group: "L", color: "#005AA7", confed: "CONCACAF" },
];

// Lookup helpers
export const TEAM_BY_ID: Record<string, BracketTeam> = Object.fromEntries(
  BRACKET_TEAMS.map((t) => [t.id, t])
);

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export function teamsOfGroup(group: string): BracketTeam[] {
  return BRACKET_TEAMS.filter((t) => t.group === group);
}

// Sanity check (build-time): exactamente 48, exactamente 4 por grupo.
if (BRACKET_TEAMS.length !== 48) {
  throw new Error(`[bracket/teams] esperaba 48 selecciones, hay ${BRACKET_TEAMS.length}`);
}
for (const g of GROUPS) {
  const n = teamsOfGroup(g).length;
  if (n !== 4) throw new Error(`[bracket/teams] grupo ${g} tiene ${n} selecciones (esperado 4)`);
}
