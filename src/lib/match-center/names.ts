// src/lib/match-center/names.ts
//
// Nombres de jugadores para la SIMULACIÓN, AHORA POR SELECCIÓN: cada equipo
// extrae apellidos culturalmente coherentes con su país (México suena mexicano,
// Japón japonés, etc.). En modo en vivo los nombres llegan reales desde
// api-football; esto solo aplica a la simulación previa al Mundial.
//
// La selección es determinista: se alimenta del RNG sembrado del partido.

// --- Pools regionales de apellidos ---
const POOLS: Record<string, string[]> = {
  latin: [
    "García", "Hernández", "Martínez", "López", "González", "Rodríguez", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz",
    "Morales", "Ortiz", "Gutiérrez", "Chávez", "Ramos", "Vargas", "Castillo",
    "Reyes", "Medina", "Fuentes", "Vega", "Rojas", "Núñez", "Acosta", "Herrera",
  ],
  brazil: [
    "Silva", "Santos", "Souza", "Oliveira", "Pereira", "Lima", "Carvalho", "Ribeiro",
    "Almeida", "Costa", "Gomes", "Martins", "Rocha", "Fernandes", "Barbosa", "Araújo",
    "Vieira", "Cardoso", "Teixeira", "Moreira", "Nascimento", "Correia", "Pinto",
  ],
  english: [
    "Smith", "Jones", "Williams", "Brown", "Taylor", "Walker", "Wright", "Evans",
    "Wilson", "Thompson", "White", "Harris", "Clarke", "Roberts", "Robinson",
    "Lewis", "Hughes", "Edwards", "Hall", "Wood", "Bennett", "Cooper", "Foster",
  ],
  french: [
    "Martin", "Bernard", "Dubois", "Moreau", "Laurent", "Lefebvre", "Petit", "Durand",
    "Leroy", "Mercier", "Girard", "Bonnet", "Fontaine", "Rousseau", "Faure", "Garnier",
    "Chevalier", "Robert", "Richard", "Henry", "Lemaire", "Renard", "Dupont",
  ],
  german: [
    "Müller", "Schmidt", "Schneider", "Wagner", "Becker", "Hoffmann", "Koch", "Bauer",
    "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
    "Braun", "Krüger", "Hofmann", "Lang", "Werner", "Krause", "Lehmann", "Fischer",
  ],
  italian: [
    "Rossi", "Russo", "Esposito", "Romano", "Greco", "Conti", "Bruno", "Ferrari",
    "Ricci", "Marino", "Gallo", "Costa", "Lombardi", "Moretti", "Barbieri", "Fontana",
    "Caruso", "Mariani", "Rinaldi", "Colombo", "Galli", "De Luca", "Ferraro",
  ],
  iberian: [
    "García", "Fernández", "González", "Rodríguez", "López", "Martínez", "Sánchez",
    "Pérez", "Gómez", "Ruiz", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero",
    "Navarro", "Torres", "Gil", "Serrano", "Blanco", "Molina", "Castro", "Ortega",
  ],
  dutch: [
    "De Jong", "Van Dijk", "Bakker", "Janssen", "Visser", "Smit", "Meijer", "De Vries",
    "Mulder", "Bos", "Vos", "Peters", "Hendriks", "Van den Berg", "Dekker", "Brouwer",
    "De Boer", "Willems", "Van der Linden", "Kuiper", "Post", "Schouten",
  ],
  slavic: [
    "Kovač", "Novák", "Horvat", "Petrović", "Jovanović", "Marković", "Nikolić",
    "Đorđević", "Pavlović", "Kovačević", "Ilić", "Stanković", "Modrić", "Rakitić",
    "Perišić", "Vlašić", "Kovačić", "Brozović", "Lovren", "Vida",
  ],
  scandi: [
    "Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson",
    "Hansen", "Nielsen", "Jensen", "Larsen", "Pedersen", "Berg", "Lund", "Haaland",
    "Solberg", "Dahl", "Moe", "Bakke", "Strand",
  ],
  japanese: [
    "Tanaka", "Suzuki", "Sato", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura",
    "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Matsumoto", "Inoue", "Kimura",
    "Hayashi", "Shimizu", "Mori", "Ikeda", "Endo", "Mitoma", "Kubo",
  ],
  korean: [
    "Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim",
    "Han", "Oh", "Seo", "Shin", "Kwon", "Hwang", "Ahn", "Son", "Hong", "Yoo",
  ],
  arabic: [
    "Al-Ahmadi", "Al-Dawsari", "Al-Faraj", "Hassan", "Mahmoud", "Haddad", "Khalil",
    "Mansour", "Nasser", "Salem", "Saleh", "Aziz", "Karim", "Rashid", "Hamdi",
    "Ziyech", "Hakimi", "Amrabat", "Salah", "Trezeguet", "Elneny", "Hegazi",
  ],
  african: [
    "Okafor", "Adebayo", "Mensah", "Traoré", "Diop", "Koné", "Ndiaye", "Osei",
    "Mané", "Sarr", "Kanté", "Bailly", "Partey", "Kudus", "Lookman", "Boateng",
    "Aurier", "Zaha", "Tchouaméni", "Camara", "Diallo", "Cissé", "Touré",
  ],
  global: [
    "Silva", "García", "Smith", "Müller", "Rossi", "Tanaka", "Kim", "Hassan",
    "Traoré", "Novák", "Andersson", "De Jong", "Martin", "López", "Costa", "Wright",
    "Petrović", "Nielsen", "Yamamoto", "Mensah", "Ferrari", "Dubois", "Vargas",
  ],
};

// --- Mapa de código de bandera (flagcdn) -> pool regional ---
const FLAG_TO_POOL: Record<string, keyof typeof POOLS> = {
  // Norteamérica / anfitriones
  mx: "latin", us: "english", ca: "english",
  // Sudamérica
  br: "brazil", ar: "latin", uy: "latin", co: "latin", cl: "latin", pe: "latin",
  ec: "latin", py: "latin", bo: "latin", ve: "latin",
  // Reino Unido / Irlanda
  "gb-eng": "english", "gb-sct": "english", "gb-wls": "english", "gb-nir": "english", ie: "english",
  // Europa occidental
  fr: "french", be: "french",
  de: "german", at: "german", ch: "german",
  it: "italian",
  es: "iberian", pt: "brazil",
  nl: "dutch",
  // Europa norte
  se: "scandi", no: "scandi", dk: "scandi", is: "scandi", fi: "scandi",
  // Europa este / Balcanes
  hr: "slavic", rs: "slavic", pl: "slavic", cz: "slavic", sk: "slavic", si: "slavic",
  ua: "slavic", ru: "slavic", ba: "slavic", bg: "slavic", ro: "slavic",
  // Asia
  jp: "japanese", kr: "korean",
  sa: "arabic", qa: "arabic", ir: "arabic", iq: "arabic", ae: "arabic", jo: "arabic",
  // África / Magreb
  ma: "arabic", eg: "arabic", tn: "arabic", dz: "arabic",
  sn: "african", gh: "african", ng: "african", ci: "african", cm: "african",
  ml: "african", za: "african",
};

const FIRST_INITIALS = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "J.", "L.", "M.", "N.", "O.", "P.", "R.", "S.", "T.", "V."];

function poolFor(flag?: string): string[] {
  if (flag && FLAG_TO_POOL[flag]) return POOLS[FLAG_TO_POOL[flag]];
  return POOLS.global;
}

/**
 * Devuelve `count` nombres distintos ("X. Apellido") apropiados al país del
 * equipo (según su código de bandera), usando el RNG dado.
 */
export function pickRoster(rng: () => number, count: number, flag?: string): string[] {
  const base = poolFor(flag);
  const pool = [...base];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool.push(...base);
    const idx = Math.floor(rng() * pool.length);
    const surname = pool.splice(idx, 1)[0];
    const ini = FIRST_INITIALS[Math.floor(rng() * FIRST_INITIALS.length)];
    out.push(`${ini} ${surname}`);
  }
  return out;
}

/** Solo el apellido (para etiqueta corta sobre el jugador en la cancha). */
export function lastName(full: string): string {
  const parts = full.trim().split(/\s+/);
  // Apellidos compuestos ("Van Dijk", "De Luca"): conserva la partícula.
  if (parts.length >= 3 && /^(van|de|der|del|al-?|da|di|le|la)$/i.test(parts[1])) {
    return parts.slice(1).join(" ");
  }
  return parts[parts.length - 1] || full;
}
