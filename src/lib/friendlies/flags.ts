// src/lib/friendlies/flags.ts
//
// Bandera (emoji) de una selección para los push de amistosos. En un push del
// sistema operativo el título es texto plano: la ÚNICA forma de mostrar una
// bandera junto al nombre es el emoji de indicador regional, que Android/iOS
// renderizan como la bandera real del país. (En la UI web seguimos usando SVG.)
//
// El ISO de las 48 del Mundial sale de la ficha BIBLIA (teamInfo.iso). Para el
// resto de selecciones que juegan amistosos (rivales no clasificados) usamos el
// mapa NAME_TO_ISO con el nombre EN INGLÉS tal y como lo sirve api-football.

// alpha-2 -> emoji indicador regional. Soporta las subdivisiones británicas
// (Inglaterra/Escocia/Gales) que BIBLIA guarda como gb-eng/gb-sct/gb-wls.
const SUBDIVISION: Record<string, string> = {
  "gb-eng": "gbeng",
  "gb-sct": "gbsct",
  "gb-wls": "gbwls",
};

function tagSeq(code: string): string {
  return [...code].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join("");
}

export function flagEmoji(iso: string | null | undefined): string {
  if (!iso) return "";
  const k = iso.toLowerCase();
  if (SUBDIVISION[k]) {
    return String.fromCodePoint(0x1f3f4) + tagSeq(SUBDIVISION[k]) + String.fromCodePoint(0xe007f);
  }
  const cc = k.slice(0, 2);
  if (!/^[a-z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(0x1f1e6 + cc.charCodeAt(0) - 97, 0x1f1e6 + cc.charCodeAt(1) - 97);
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Nombre de selección (inglés, como lo da api-football) -> ISO alpha-2. Cubre
// las 211 federaciones FIFA + alias frecuentes ("USA", "Ivory Coast", "Korea
// Republic"...). Las claves se normalizan al cargar, así que da igual el caso.
const NAME_TO_ISO_RAW: Record<string, string> = {
  // UEFA
  Albania: "al", Andorra: "ad", Armenia: "am", Austria: "at", Azerbaijan: "az",
  Belarus: "by", Belgium: "be", "Bosnia and Herzegovina": "ba", Bulgaria: "bg",
  Croatia: "hr", Cyprus: "cy", "Czech Republic": "cz", Czechia: "cz", Denmark: "dk",
  England: "gb-eng", Estonia: "ee", "Faroe Islands": "fo", Finland: "fi", France: "fr",
  Georgia: "ge", Germany: "de", Gibraltar: "gi", Greece: "gr", Hungary: "hu",
  Iceland: "is", Israel: "il", Italy: "it", Kazakhstan: "kz", Kosovo: "xk",
  Latvia: "lv", Liechtenstein: "li", Lithuania: "lt", Luxembourg: "lu", Malta: "mt",
  Moldova: "md", Montenegro: "me", Netherlands: "nl", "North Macedonia": "mk",
  "Northern Ireland": "gb", Norway: "no", Poland: "pl", Portugal: "pt",
  "Republic of Ireland": "ie", Ireland: "ie", Romania: "ro", Russia: "ru",
  "San Marino": "sm", Scotland: "gb-sct", Serbia: "rs", Slovakia: "sk", Slovenia: "si",
  Spain: "es", Sweden: "se", Switzerland: "ch", Turkey: "tr", "Türkiye": "tr",
  Ukraine: "ua", Wales: "gb-wls",
  // CONMEBOL
  Argentina: "ar", Bolivia: "bo", Brazil: "br", Chile: "cl", Colombia: "co",
  Ecuador: "ec", Paraguay: "py", Peru: "pe", Uruguay: "uy", Venezuela: "ve",
  // CONCACAF
  "Antigua and Barbuda": "ag", Aruba: "aw", Bahamas: "bs", Barbados: "bb",
  Belize: "bz", Bermuda: "bm", "British Virgin Islands": "vg", Canada: "ca",
  "Cayman Islands": "ky", "Costa Rica": "cr", Cuba: "cu", Curacao: "cw",
  Dominica: "dm", "Dominican Republic": "do", "El Salvador": "sv", Grenada: "gd",
  Guatemala: "gt", Guyana: "gy", Haiti: "ht", Honduras: "hn", Jamaica: "jm",
  Mexico: "mx", Montserrat: "ms", Nicaragua: "ni", Panama: "pa",
  "Puerto Rico": "pr", "Saint Kitts and Nevis": "kn", "Saint Lucia": "lc",
  "Saint Vincent and the Grenadines": "vc", Suriname: "sr",
  "Trinidad and Tobago": "tt", "Turks and Caicos Islands": "tc",
  "United States": "us", USA: "us", "US Virgin Islands": "vi",
  // CONMEBOL/CONCACAF aliases handled above
  // CAF
  Algeria: "dz", Angola: "ao", Benin: "bj", Botswana: "bw", "Burkina Faso": "bf",
  Burundi: "bi", Cameroon: "cm", "Cape Verde": "cv", "Cape Verde Islands": "cv",
  "Central African Republic": "cf", Chad: "td", Comoros: "km", Congo: "cg",
  "Congo DR": "cd", "DR Congo": "cd", "Ivory Coast": "ci", "Cote d'Ivoire": "ci",
  Djibouti: "dj", Egypt: "eg", "Equatorial Guinea": "gq", Eritrea: "er",
  Eswatini: "sz", Ethiopia: "et", Gabon: "ga", Gambia: "gm", Ghana: "gh",
  Guinea: "gn", "Guinea-Bissau": "gw", Kenya: "ke", Lesotho: "ls", Liberia: "lr",
  Libya: "ly", Madagascar: "mg", Malawi: "mw", Mali: "ml", Mauritania: "mr",
  Mauritius: "mu", Morocco: "ma", Mozambique: "mz", Namibia: "na", Niger: "ne",
  Nigeria: "ng", Rwanda: "rw", "Sao Tome and Principe": "st", Senegal: "sn",
  Seychelles: "sc", "Sierra Leone": "sl", Somalia: "so", "South Africa": "za",
  "South Sudan": "ss", Sudan: "sd", Tanzania: "tz", Togo: "tg", Tunisia: "tn",
  Uganda: "ug", Zambia: "zm", Zimbabwe: "zw",
  // AFC
  Afghanistan: "af", Australia: "au", Bahrain: "bh", Bangladesh: "bd", Bhutan: "bt",
  Brunei: "bn", Cambodia: "kh", China: "cn", "Chinese Taipei": "tw", "Hong Kong": "hk",
  India: "in", Indonesia: "id", Iran: "ir", Iraq: "iq", Japan: "jp", Jordan: "jo",
  Kuwait: "kw", Kyrgyzstan: "kg", Laos: "la", Lebanon: "lb", Macau: "mo",
  Malaysia: "my", Maldives: "mv", Mongolia: "mn", Myanmar: "mm", Nepal: "np",
  "North Korea": "kp", "Korea DPR": "kp", Oman: "om", Pakistan: "pk", Palestine: "ps",
  Philippines: "ph", Qatar: "qa", "Saudi Arabia": "sa", Singapore: "sg",
  "South Korea": "kr", "Korea Republic": "kr", "Sri Lanka": "lk", Syria: "sy",
  Tajikistan: "tj", Thailand: "th", "Timor-Leste": "tl", Turkmenistan: "tm",
  "United Arab Emirates": "ae", UAE: "ae", Uzbekistan: "uz", Vietnam: "vn", Yemen: "ye",
  // OFC
  "American Samoa": "as", "Cook Islands": "ck", Fiji: "fj", "New Caledonia": "nc",
  "New Zealand": "nz", "Papua New Guinea": "pg", Samoa: "ws", "Solomon Islands": "sb",
  Tahiti: "pf", Tonga: "to", Vanuatu: "vu",
};

let normalizedMap: Record<string, string> | null = null;
function nameMap(): Record<string, string> {
  if (!normalizedMap) {
    normalizedMap = {};
    for (const [name, iso] of Object.entries(NAME_TO_ISO_RAW)) {
      normalizedMap[norm(name)] = iso;
    }
  }
  return normalizedMap;
}

/** ISO alpha-2 (o gb-eng/sct/wls) a partir del nombre inglés de api-football. */
export function isoFromName(name: string): string | null {
  if (!name) return null;
  return nameMap()[norm(name)] ?? null;
}
