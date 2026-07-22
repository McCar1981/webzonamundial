// src/lib/ligas/player-visuals.ts
//
// Piezas VISUALES de la ficha cinematográfica: color de ambiente del club (para
// el héroe) y bandera por nacionalidad. api-football NO da el color del club, así
// que hay un mapa curado de los grandes; para el resto, solo oro (elegante por
// defecto). La bandera se deriva de la nacionalidad (nombre en inglés de
// api-football) a código ISO-2 para flagcdn.

export interface ClubColor { club: string; deep: string }

// Clave = id de equipo de api-football. Color principal + un tono profundo para
// el degradado. Ampliable; lo no listado cae al oro por defecto.
const CLUB_COLORS: Record<number, ClubColor> = {
  529: { club: "#a50044", deep: "#3d0019" }, // Barcelona
  541: { club: "#8fb4ff", deep: "#1b2a52" }, // Real Madrid
  530: { club: "#cb3524", deep: "#4a0f0a" }, // Atlético de Madrid
  85: { club: "#e30613", deep: "#0a1c4b" }, // Paris Saint-Germain
  9568: { club: "#f15a9a", deep: "#8a1d55" }, // Inter Miami
  50: { club: "#6cabdd", deep: "#123a5a" }, // Manchester City
  33: { club: "#da291c", deep: "#4a0d08" }, // Manchester United
  40: { club: "#c8102e", deep: "#3d040c" }, // Liverpool
  49: { club: "#034694", deep: "#04203f" }, // Chelsea
  42: { club: "#ef0107", deep: "#4a0203" }, // Arsenal
  157: { club: "#dc052d", deep: "#4a0210" }, // Bayern Múnich
  165: { club: "#f5d020", deep: "#111111" }, // Borussia Dortmund
  496: { club: "#c9c9c9", deep: "#111111" }, // Juventus
  489: { club: "#fb090b", deep: "#0a0a0a" }, // AC Milan
  505: { club: "#0a52a1", deep: "#04182f" }, // Inter
  492: { club: "#12a0d7", deep: "#082c3a" }, // Napoli
  435: { club: "#e2231a", deep: "#4a0a06" }, // River Plate
  451: { club: "#0a4ea2", deep: "#0a2140" }, // Boca Juniors
};

export function clubColor(teamId: number | null | undefined): ClubColor | null {
  return teamId != null ? (CLUB_COLORS[teamId] ?? null) : null;
}

// Nacionalidad (inglés, como la da api-football) -> ISO-3166 alpha-2 (flagcdn).
const NAT_FLAG: Record<string, string> = {
  Argentina: "ar", Bolivia: "bo", Brazil: "br", Chile: "cl", Colombia: "co",
  "Costa Rica": "cr", Cuba: "cu", "Dominican Republic": "do", Ecuador: "ec",
  "El Salvador": "sv", Guatemala: "gt", Honduras: "hn", Mexico: "mx",
  Nicaragua: "ni", Panama: "pa", Paraguay: "py", Peru: "pe", "Puerto Rico": "pr",
  Uruguay: "uy", Venezuela: "ve", "United States": "us", USA: "us", Canada: "ca", Jamaica: "jm",
  Spain: "es", Portugal: "pt", France: "fr", Italy: "it", Germany: "de",
  England: "gb-eng", Scotland: "gb-sct", Wales: "gb-wls", "Northern Ireland": "gb-nir",
  Ireland: "ie", Netherlands: "nl", Belgium: "be", Croatia: "hr", Serbia: "rs",
  Switzerland: "ch", Austria: "at", Poland: "pl", Sweden: "se", Norway: "no",
  Denmark: "dk", Ukraine: "ua", Russia: "ru", Turkey: "tr", Greece: "gr",
  "Czech Republic": "cz", "Czechia": "cz", Hungary: "hu", Romania: "ro", Slovakia: "sk",
  Slovenia: "si", Bulgaria: "bg", Iceland: "is", Finland: "fi", Albania: "al",
  "Bosnia and Herzegovina": "ba", "North Macedonia": "mk", Montenegro: "me", Kosovo: "xk",
  Morocco: "ma", Algeria: "dz", Tunisia: "tn", Egypt: "eg", Senegal: "sn",
  "Ivory Coast": "ci", "Cote d'Ivoire": "ci", Nigeria: "ng", Ghana: "gh",
  Cameroon: "cm", Mali: "ml", "Democratic Republic of the Congo": "cd", Guinea: "gn",
  "South Africa": "za", Japan: "jp", "South Korea": "kr", "Korea Republic": "kr",
  Australia: "au", "Saudi Arabia": "sa", Iran: "ir", Qatar: "qa", China: "cn",
};

export function nationalityFlagCode(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  return NAT_FLAG[nationality.trim()] ?? null;
}

/** URL de bandera flagcdn (o null si no hay código). Alto 30px @2x para nitidez. */
export function flagUrl(nationality: string | null | undefined, w = 40): string | null {
  const code = nationalityFlagCode(nationality);
  return code ? `https://flagcdn.com/w${w}/${code}.png` : null;
}
