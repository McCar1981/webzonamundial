// src/lib/friendlies/photoFilter.ts
//
// Defensa permanente del BANCO DE FOTOS DE EQUIPO (wc_2026.team_photos) contra
// la contaminación del scraper de Wikimedia Commons.
//
// El push de FINAL ("¡Gana X!") y el de ALINEACIONES usan team_photos como "foto
// del equipo". El scraper metía fotos de partidos CONTRA otro país (que a menudo
// muestran al RIVAL), fotos de otra selección y basura (aviones con librea,
// tormentas de satélite, seguridad del Super Bowl, calles de La Haya, perros…).
// El push de Alemania vs Curaçao mostró a Japón porque las 2 fotos de Alemania
// eran del partido "Germany 1-2 Japan". El PR #189 lo limpió A MANO (−181 fotos)
// pero NO añadió protección: si el scraper vuelve a correr, reintroduce el bug.
//
// Este módulo es PURO (sin fs ni red) para poder testearlo. La decisión central
// `keepTeamPhoto()` mira SOLO el nombre del archivo (decodificado) de la URL.
//
// REGLA, en una frase: conservamos una foto solo si el EQUIPO DUEÑO de la ficha
// es claramente el SUJETO de la imagen; si aparece una selección DISTINTA como
// sujeto (o es basura evidente), se descarta. El respaldo del motor (retrato de
// un jugador del propio país, camiseta nacional) ya es seguro: todas las fichas
// tienen fotos de jugadores. Mejor quedarse corto (perder una foto buena) que
// mostrar al país equivocado.

// ── Normalización ────────────────────────────────────────────────────────────

/** minúsculas, sin acentos, todo lo no alfanumérico -> espacio, colapsado. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** minúsculas + sin acentos pero CONSERVA separadores de marcador (- – — : ;)
 *  para detectar resultados tipo "1-2", "5 – 0", "2;1". */
function normKeepSep(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\-–—:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Modelo de "nación" ───────────────────────────────────────────────────────

export interface Nation {
  /** clave estable (slug de la ficha dueña, o etiqueta para naciones externas). */
  key: string;
  /** agujas normalizadas; pueden ser multipalabra ("south korea"). */
  needles: string[];
  /** raíces (prefijos) para gentilicios: "argentin" -> argentino/argentina/argentine. */
  stems: string[];
}

/** raíz de gentilicio: variante de UNA palabra, >=6 y acabada en vocal -> sin la
 *  vocal final ("argentina"->"argentin", "mexico"->"mexic", "croatia"->"croati"). */
function deriveStem(variant: string): string | null {
  if (variant.includes(" ")) return null;
  if (variant.length < 6) return null;
  if (/[aeiou]$/.test(variant)) {
    const stem = variant.slice(0, -1);
    return stem.length >= 5 ? stem : null;
  }
  return null;
}

export function makeNation(key: string, variants: string[]): Nation {
  const needles = [...new Set(variants.map(norm).filter((v) => v.length >= 3))];
  const stems = [
    ...new Set(
      needles.map(deriveStem).filter((s): s is string => !!s),
    ),
  ];
  return { key, needles, stems };
}

/** Un token (palabra suelta) corresponde a esta nación (incluye gentilicios por
 *  prefijo: "iran"->"iranian", "argentin"->"argentino"). */
function tokenHitsNation(token: string, nation: Nation): boolean {
  for (const n of nation.needles) {
    if (n.includes(" ")) continue; // multipalabra se trata aparte
    if (token === n || token.startsWith(n)) return true;
  }
  for (const st of nation.stems) {
    if (token.startsWith(st)) return true;
  }
  return false;
}

// ── Marcadores de "sujeto = equipo" ──────────────────────────────────────────
// Palabras que indican que la foto retrata al EQUIPO (alineación, plantilla,
// celebración, afición…). Se comparan como SUBCADENA del token, así "algeriafans"
// (un solo token) cuenta como afición y "nationalmannschaft" como equipo.
const MARKER_STEMS = [
  "lineup", "squad", "seleccion", "national", "mannschaft",
  "player", "jugador", "personnel", "celebrat", "celebrando",
  "festej", "fans", "support", "aficion", "hincha",
  "warmup", "warming", "training", "coach", "arrival",
  "llegada", "caravana", "campeon", "champion", "huddl",
  "goal", "footballer", "goleador", "marea", "equipo",
];

function isMarkerToken(tokens: string[], i: number): boolean {
  const t = tokens[i];
  if (MARKER_STEMS.some((m) => t.includes(m))) return true;
  // "line up" / "line-up" (queda como dos tokens tras normalizar)
  if (t === "line" && tokens[i + 1] === "up") return true;
  if (t === "up" && tokens[i - 1] === "line") return true;
  return false;
}

// ── Basura evidente (aviones, tormentas, calles, sedes, tiendas, perros…) ─────
// Subcadenas sobre el nombre normalizado. Calibrado para NO tocar ninguna de las
// 74 fotos legítimas curadas a mano en el PR #189.
const JUNK_SUBSTRINGS = [
  // aviones / librea / aerolíneas
  "livery", "a320", "a330", "a340", "a350", "a380", "boeing", "airbus",
  "aircraft", "airplane", "aeroplane", "airline", "airways", "aeromexico",
  "airport",
  // meteorología / satélite
  "storm", "hurricane", "cyclone", "typhoon", "tornado", "blizzard",
  "satellite", "modis",
  // eventos ajenos / seguridad
  "super bowl", "superbowl", "homeland security", "nfl",
  "police", "policia", "seguridad", "security", "marines", " navy",
  // miniaturas / mapas
  "thumbnail", "skyline",
  // tiendas / patrocinio / sedes / edificios
  "official shop", "sponsorship", "patrocinador", "sponsors",
  "sede", "headquarters", "embassy",
  // calles (caso "La Haya")
  "the hague", "marktweg", "mazirellaan",
  // locales / animales
  "restaurant", "restaurante", "dogs", "perro", "puppy",
  // otros deportes / objetos (no es la selección de fútbol jugando)
  "beachsoccer", "beach soccer", "futsal", "maillot",
];

function looksLikeJunk(s: string): boolean {
  // " dog" con espacio para no pegar con "dogan", "bulldog" inexistentes, etc.
  if (/\bdog\b/.test(s)) return true;
  return JUNK_SUBSTRINGS.some((j) => s.includes(j));
}

// ── VIP / dignatarios (políticos, jefes de Estado, autoridades) ──────────────
// Fotos del equipo CON un político o autoridad (primer ministro, presidente,
// secretario, gobernador, embajador…). Técnicamente sale la selección, pero un
// político en un push deportivo da problema de imagen y reputación → fuera. El
// push cae al retrato de un jugador (camiseta nacional), que es lo que queremos.
// Casos reales: "Sánchez se reunió con los futbolistas de la selección española",
// "Fumio Kishida with Japan National Football Team", "First Minister meets with
// Scottish National Football Team", "Luncheon … at the presidential office".
//
// Frases multipalabra (subcadena sobre el nombre normalizado con espacios).
const VIP_PHRASES = [
  "se reunio", "se reune", "first minister", "prime minister", "primer ministro",
  "meets with", "presidential", "presidencial", "white house", "casa blanca",
  "head of state", "jefe de estado", "luncheon", "pena nieto", "official visit",
  "state visit", "visita oficial", "visita de estado",
];
// Tokens EXACTOS (cargos/VIP que casi nunca son apellido de futbolista). NO se
// incluyen "king"/"queen"/"prince"/"royal"/"mayor"/"premier" por chocar con
// apellidos (Joshua King) o con "Premier League".
const VIP_TOKENS = new Set([
  "president", "presidente", "presidenta", "minister", "ministro", "ministra",
  "secretary", "secretario", "secretaria", "chancellor", "canciller",
  "governor", "gobernador", "senator", "senador", "potus", "ambassador",
  "embajador", "embajadora", "alcalde", "kishida", "mayorkas", "aliyev",
]);
function looksLikeVip(s: string, tokens: string[]): boolean {
  if (VIP_PHRASES.some((p) => s.includes(p))) return true;
  return tokens.some((t) => VIP_TOKENS.has(t));
}

// ── Decisión ─────────────────────────────────────────────────────────────────

const SCORE_RE = /\b\d{1,2}\s*[-–—:;]\s*\d{1,2}\b/;
const ABBREV_MATCH_RE = /\b[A-Z]{2,4}[-–&][A-Z]{2,4}\b/;

interface Occ { key: string; idx: number; }

/** Posiciones de cada mención de nación en los tokens (palabra suelta + multipalabra). */
function findOccurrences(tokens: string[], nations: Nation[]): Occ[] {
  const occ: Occ[] = [];
  for (let i = 0; i < tokens.length; i++) {
    for (const nation of nations) {
      if (tokenHitsNation(tokens[i], nation)) occ.push({ key: nation.key, idx: i });
    }
  }
  for (const nation of nations) {
    for (const needle of nation.needles) {
      if (!needle.includes(" ")) continue;
      const w = needle.split(" ");
      for (let i = 0; i + w.length <= tokens.length; i++) {
        let ok = true;
        for (let k = 0; k < w.length; k++) {
          if (!(tokens[i + k] === w[k] || tokens[i + k].startsWith(w[k]))) { ok = false; break; }
        }
        if (ok) occ.push({ key: nation.key, idx: i });
      }
    }
  }
  return occ;
}

/** Claves de las naciones mencionadas en el nombre de archivo de una URL.
 *  Útil para auditar (¿hay una selección distinta de la dueña?). */
export function mentionedNations(url: string, nations: Nation[]): string[] {
  let fileRaw: string;
  try { fileRaw = decodeURIComponent(url.split("/").pop() || url); }
  catch { fileRaw = url.split("/").pop() || url; }
  const tokens = norm(fileRaw).split(" ").filter(Boolean);
  return [...new Set(findOccurrences(tokens, nations).map((o) => o.key))];
}

/**
 * ¿Conservar esta URL como foto de equipo de la ficha `ownerKey`?
 * Devuelve true = conservar, false = descartar.
 *
 * @param url       URL completa de la foto (se usa solo el nombre de archivo).
 * @param ownerKey  clave de la nación dueña de la ficha (su slug).
 * @param nations   TODAS las naciones (las 48 + externas), construidas una vez.
 */
export function keepTeamPhoto(url: string, ownerKey: string, nations: Nation[]): boolean {
  if (!url) return false;

  // Nombre de archivo decodificado (original, para detectar siglas en mayúsculas).
  let fileRaw: string;
  try {
    fileRaw = decodeURIComponent(url.split("/").pop() || url);
  } catch {
    fileRaw = url.split("/").pop() || url;
  }

  const s = norm(fileRaw);
  if (!s) return false;

  // 1) Basura evidente -> fuera.
  if (looksLikeJunk(s)) return false;

  const tokens = s.split(" ").filter(Boolean);

  // 1b) Político / VIP con el equipo -> fuera (no es contenido deportivo).
  if (looksLikeVip(s, tokens)) return false;

  // 2) Localiza cada mención de nación (dueña y rivales) con su posición.
  const occ = findOccurrences(tokens, nations);

  const ownerOcc = occ.filter((o) => o.key === ownerKey);
  const rivalKeys = new Set(occ.filter((o) => o.key !== ownerKey).map((o) => o.key));
  const ownerCount = ownerOcc.length;
  const hasRival = rivalKeys.size > 0;
  // Siglas de partido "AUS-JOR", "KOR-QAT", "IRN-IRQ". Se prueba con los "_" de
  // Commons convertidos en espacio (si no, el "_" cuenta como carácter de palabra
  // y rompe el \b final).
  const abbrevMatch = ABBREV_MATCH_RE.test(fileRaw.replace(/_/g, " "));

  // 3) Sin ninguna OTRA nación y sin sigla de partido: es foto del dueño o
  //    genérica del equipo (la basura ya se filtró) -> conservar.
  if (!hasRival && !abbrevMatch) return true;

  // 4) ¿Qué nación "posee" cada marcador? La más cercana, mirando primero a la
  //    IZQUIERDA (<=2 tokens, mismo token incluido) y, si no hay, UN token a la
  //    DERECHA. Cubre el inglés "A vs B - B lineup" (nación a la izquierda) y el
  //    español "seleccionado argentino" / "selección española" (gentilicio a la
  //    derecha del sustantivo).
  const nationAt = (j: number): "owner" | "rival" | null => {
    const here = occ.filter((o) => o.idx === j);
    if (here.length === 0) return null;
    return here.some((o) => o.key === ownerKey) ? "owner" : "rival";
  };
  const ownerByMarker = (markerIdx: number): "owner" | "rival" | null => {
    for (let d = 0; d <= 2; d++) {
      const j = markerIdx - d;
      if (j < 0) break;
      const who = nationAt(j);
      if (who) return who;
    }
    return markerIdx + 1 < tokens.length ? nationAt(markerIdx + 1) : null;
  };

  let ownerAdj = false;
  let rivalAdj = false;
  for (let i = 0; i < tokens.length; i++) {
    if (!isMarkerToken(tokens, i)) continue;
    const who = ownerByMarker(i);
    if (who === "owner") ownerAdj = true;
    else if (who === "rival") rivalAdj = true;
  }

  // 5) ¿Es una foto de PARTIDO (enfrentamiento) y no una mención incidental?
  const sd = normKeepSep(fileRaw);
  const hasScore = SCORE_RE.test(sd);
  const hasVsToken = tokens.some((t) => t === "vs" || t === "v" || t === "x");
  // dos naciones DISTINTAS pegadas (<=2 tokens de separación): "Norway Italy",
  // "Sweden - Serbia", "Colombia vs Brasil", "Iran and Spain".
  const sorted = [...occ].sort((a, b) => a.idx - b.idx);
  let adjacentTwoNations = false;
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k].key !== sorted[k - 1].key && sorted[k].idx - sorted[k - 1].idx <= 2) {
      adjacentTwoNations = true;
      break;
    }
  }
  const isMatchup = hasScore || hasVsToken || adjacentTwoNations;

  // 6) Decisión final.
  if (isMatchup || abbrevMatch) {
    // Partido entre el dueño y un rival (o entre dos rivales). Solo conservamos
    // si el DUEÑO está claramente RE-NOMBRADO como sujeto: aparece >=2 veces
    // (una en el marcador del partido + otra junto al marcador de foto) y ningún
    // rival posee el marcador. Así "Germany 1-2 Japan - Germany lineup" se queda
    // y "Germany 1-2 Japan - Japan celebration" se va.
    return ownerAdj && !rivalAdj && ownerCount >= 2;
  }
  // Mención incidental de otra nación (sede/rival nombrado de pasada), sin ser un
  // partido: conservamos si el dueño es el sujeto y ningún rival lo es. Cubre
  // "Japan National Football Team after Qatar World Cup" (Qatar = sede).
  return ownerAdj && !rivalAdj;
}

// ── Construcción del conjunto de naciones ────────────────────────────────────

/** Alias cortos para selecciones con nombre multipalabra, para que también se
 *  detecten escritas de forma abreviada en los nombres de archivo de Commons. */
const OWNER_ALIASES: Record<string, string[]> = {
  "arabia-saudi": ["saudi", "saudi arabia", "arabia"],
  "austria": ["autriche", "osterreich", "österreich"],
  "belgica": ["belgium", "belgique", "belgien", "belgie", "belxica"],
  "corea-del-sur": ["korea", "south korea", "corea"],
  "costa-de-marfil": ["ivory coast", "cote d ivoire", "marfil", "ivorian"],
  "estados-unidos": ["usa", "united states", "u s a"],
  "nueva-zelanda": ["new zealand", "zealand", "all whites"],
  "paises-bajos": ["netherlands", "holland", "dutch", "nederland", "holanda"],
  "rd-congo": ["congo", "dr congo", "democratic republic of the congo"],
  "republica-checa": ["czech", "czechia", "czech republic", "chequia"],
};

/** Naciones EXTERNAS a las 48 (defensa contra partidos vs no-clasificados y
 *  rivales históricos). No son nunca "dueñas"; solo se usan para detectar al
 *  RIVAL. Se mantiene como complemento de las fichas BIBLIA, no las sustituye. */
export const EXTRA_NATIONS: Array<{ key: string; variants: string[] }> = [
  { key: "x-serbia", variants: ["serbia", "serbian", "serbija"] },
  { key: "x-albania", variants: ["albania", "albanian"] },
  { key: "x-wales", variants: ["wales", "welsh", "gales"] },
  { key: "x-italy", variants: ["italy", "italia", "italian", "italie", "italien"] },
  { key: "x-finland", variants: ["finland", "finlandia", "finnish", "suomi"] },
  { key: "x-bulgaria", variants: ["bulgaria", "bulgarian"] },
  { key: "x-poland", variants: ["poland", "polonia", "polish", "polen", "polska"] },
  { key: "x-peru", variants: ["peru", "peruano", "peruvian", "peruana"] },
  { key: "x-israel", variants: ["israel", "israeli"] },
  { key: "x-bahrain", variants: ["bahrain", "bahraini"] },
  { key: "x-syria", variants: ["syria", "syrian", "siria"] },
  { key: "x-uae", variants: ["uae", "united arab emirates", "emirates"] },
  { key: "x-mali", variants: ["mali", "malian"] },
  { key: "x-china", variants: ["china", "chinese", "chino", "chinos"] },
  { key: "x-salvador", variants: ["el salvador", "salvador", "salvadoran"] },
  { key: "x-eq-guinea", variants: ["equatorial guinea", "guinea ecuatorial", "guinea"] },
  { key: "x-antigua", variants: ["antigua and barbuda", "antigua", "barbuda"] },
  { key: "x-philippines", variants: ["philippine", "philippines", "filipinas"] },
  { key: "x-galicia", variants: ["galicia", "galiza"] },
  { key: "x-dominica", variants: ["dominica", "dominican"] },
  { key: "x-australia-u", variants: ["socceroos", "olyroos"] },
  // red de seguridad genérica (no exhaustiva)
  { key: "x-russia", variants: ["russia", "rusia", "russian"] },
  { key: "x-ukraine", variants: ["ukraine", "ucrania", "ukrainian"] },
  { key: "x-romania", variants: ["romania", "rumania", "romanian"] },
  { key: "x-greece", variants: ["greece", "grecia", "greek"] },
  { key: "x-denmark", variants: ["denmark", "dinamarca", "danish"] },
  { key: "x-ireland", variants: ["ireland", "irlanda", "irish"] },
  { key: "x-hungary", variants: ["hungary", "hungria", "hungarian"] },
  { key: "x-slovakia", variants: ["slovakia", "eslovaquia", "slovak"] },
  { key: "x-slovenia", variants: ["slovenia", "eslovenia", "slovenian"] },
  { key: "x-nigeria", variants: ["nigeria", "nigerian"] },
  { key: "x-cameroon", variants: ["cameroon", "camerun", "cameroonian"] },
  { key: "x-chile", variants: ["chile", "chilean", "chilena"] },
  { key: "x-bolivia", variants: ["bolivia", "bolivian"] },
  { key: "x-venezuela", variants: ["venezuela", "venezolana", "venezuelan"] },
];

export interface TeamLike {
  slug: string;
  name_es?: string;
  name_en?: string;
  name_local?: string;
}

/** Construye TODAS las naciones (las 48 de las fichas + las externas) una vez. */
export function buildNations(teams: TeamLike[]): Nation[] {
  const nations: Nation[] = [];
  for (const t of teams) {
    const variants = [t.name_es, t.name_en, t.name_local, ...(OWNER_ALIASES[t.slug] ?? [])]
      .filter((v): v is string => !!v);
    nations.push(makeNation(t.slug, variants));
  }
  for (const e of EXTRA_NATIONS) nations.push(makeNation(e.key, e.variants));
  return nations;
}
