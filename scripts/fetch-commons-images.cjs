// scripts/fetch-commons-images.cjs
//
// Rellena las galerías de imágenes de las fichas BIBLIA con fotos FIABLES de
// cada jugador, resolviéndolo primero en WIKIDATA (verificando que es futbolista
// y de la selección correcta) y tomando imágenes de su CATEGORÍA de Wikimedia
// Commons. La pertenencia a la categoría garantiza que la foto ES del jugador
// (nada de iglesias, DJs homónimos, estatuas ajenas ni fotos de otro deporte).
//
// Por qué este método y no la búsqueda por texto: buscar "Wesley Brazil" en
// Commons devolvía iglesias "Wesley Methodist Church"; "Cristiano Ronaldo"
// devolvía estatuas; homónimos devolvían a otra persona. La categoría de Commons
// del propio jugador elimina todo eso de raíz.
//
// SEGURO POR DEFECTO: DRY-RUN. Escribe scripts/commons-images-report.json para
// revisar. NO toca las fichas hasta --apply.
//
// Preferimos fotos de SELECCIÓN; si no hay ninguna en la categoría, caemos a una
// foto del jugador (aunque sea de club) para no dejarlo sin imagen — pero SIEMPRE
// es él. El pool de país es OPT-IN (--country) y desaconsejado.
//
// Uso:
//   node scripts/fetch-commons-images.cjs                 # dry-run, 48 equipos
//   node scripts/fetch-commons-images.cjs --team=brasil   # un solo equipo
//   node scripts/fetch-commons-images.cjs --reset         # limpia photos/image_pool
//   node scripts/fetch-commons-images.cjs --per-player=6
//   node scripts/fetch-commons-images.cjs --apply         # ESCRIBE en las fichas

const fs = require("fs");
const path = require("path");

// ---- Flags -------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const val = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : def;
};

const APPLY = flag("apply");
const RESET = flag("reset");
const COUNTRY = flag("country");
const ONLY_TEAM = val("team", null);
const PER_PLAYER = parseInt(val("per-player", "6"), 10);
const PER_COUNTRY = parseInt(val("per-country", "10"), 10);
const DELAY_MS = parseInt(val("delay", "150"), 10);

const TEAMS_DIR = "data/teams";
const REPORT = "scripts/commons-images-report.json";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const UA = "ZonaMundial-image-fetch/2.0 (https://zonamundial.com; biblia mundial 2026)";

// ISO 3166 (el que guardan las fichas) → Qid de Wikidata del país/selección.
const ISO2QID = {
  de: "Q183", sa: "Q851", dz: "Q262", ar: "Q414", au: "Q408", at: "Q40",
  be: "Q31", ba: "Q225", br: "Q155", cv: "Q1011", ca: "Q16", co: "Q739",
  kr: "Q884", ci: "Q1008", hr: "Q224", cw: "Q25279", ec: "Q736", eg: "Q79",
  "gb-sct": "Q22", es: "Q29", us: "Q30", fr: "Q142", gh: "Q117", ht: "Q790",
  "gb-eng": "Q21", iq: "Q796", ir: "Q794", jp: "Q17", jo: "Q810", ma: "Q1028",
  mx: "Q96", no: "Q20", nz: "Q664", nl: "Q55", pa: "Q804", py: "Q733",
  pt: "Q45", qa: "Q846", cd: "Q974", cz: "Q213", sn: "Q1041", za: "Q258",
  se: "Q34", ch: "Q39", tn: "Q948", tr: "Q43", uy: "Q77", uz: "Q265",
};
// Selecciones británicas: sus jugadores suelen tener nacionalidad Reino Unido.
const UK = "Q145";
const UK_NATIONS = new Set(["gb-sct", "gb-eng"]);

// Ocupación "futbolista" / deporte "fútbol asociación" en Wikidata.
const OCC_FOOTBALLER = "Q937857";
const SPORT_FOOTBALL = "Q2736";

// Archivos que NO son una foto válida del jugador/equipo.
const BLOCK = [
  "logo", "flag", "bandera", "crest", "escudo", "badge", "coat of arms",
  "map", "mapa", "karte", "stadium", "estadio", "signature", "firma", "autograph",
  "icon", "icono", "kit", "jersey", "camiseta", "shirt", "trophy", "diagram",
  "chart", "location", "statue", "estatua", "escultura", "sculpture", "bust",
  "busto", "museo", "museu", "museum", "wax", "mural", "graffiti", "stamp",
  "sello", "coin", "moneda", "banknote", "plaque", "placa", "tomb", "grave",
  "mosaic", "painting", "drawing", "cartoon", "comic", "cr7",
  // Transporte (aviones chárter mal etiquetados en la categoría del equipo).
  "aircraft", "airplane", "aeroplane", "airline", "airlines", "airport",
  "boeing", "airbus", "heathrow", "avion", "aeropuerto", "plane",
  // Infografías / rankings / tablas / entradas (suelen ser PNG, pero por si acaso).
  "weltrangliste", "ranking", "platzierung", "platzierungen", "tabelle", "table",
  "statistik", "statistics", "perioden", "alter", "elo rating", "infographic",
  "ticket", "eintrittskarte", "entrada", "billet", "abschied",
  // Monumentos / huellas / placas conmemorativas.
  "plattfuesse", "plattfusse", "fussabdr", "handabdr", "walk of fame", "denkmal",
  "gedenk", "memorial", "balkon", "wappen", "verband", "etoiles", "sterne",
  // Selección FEMENINA (Carlos: nada de equipos femeninos en estas fichas).
  "women", "woman", "womens", "femenin", "femenina", "femenino", "feminin",
  "feminina", "frauen", "damen", "ladies", "mujeres", "female", "girls",
];

// Año (4 dígitos) presente en el título, o null. Boundaries para no confundir con
// números de fichero (p.ej. "Sdm_4680" o fechas pegadas tipo "20180626").
function yearInTitle(title) {
  const m = norm(title).match(/(?:^|[^0-9])((?:19|20)\d\d)(?:[^0-9]|$)/);
  return m ? parseInt(m[1], 10) : null;
}
// ¿El título sugiere una foto ANTIGUA? Carlos quiere imágenes ACTUALES de las
// selecciones. Por defecto descartamos cualquier año < 2020. Sin año → se conserva.
// `floor` permite relajarlo en el último recurso (búsqueda de estrellas, 2018+).
function isOldByTitle(title, floor = 2020) {
  const y = yearInTitle(title);
  return y !== null && y < floor;
}

// ¿El título contiene un año RECIENTE (2020-2026)? Para las fotos de EQUIPO
// usamos la fórmula de Carlos ("selección <país> 2026"): exigimos señal de año
// reciente para garantizar material ACTUAL de la selección.
function hasRecentYear(title) {
  const s = norm(title);
  return /(?:^|[^0-9])(202[0-6])(?:[^0-9]|$)/.test(s);
}

// ¿Es una foto de GRUPO/EQUIPO (varios jugadores, nadie destaca)? Carlos: en la
// galería de un JUGADOR la imagen tiene que ser una donde ESE jugador destaque,
// no la formación entera, el himno ni la foto de plantilla. Estas señales mandan
// la foto al banco de EQUIPO (team_photos), nunca a la galería del jugador.
const GROUP_SIGNAL = [
  "national football team", "national association football", "national_football_team",
  "line-up", "lineup", "line up", "line-ups", "starting xi", "starting eleven",
  "squad", "team photo", "team photograph", "group photo", "group photograph",
  "teamfoto", "mannschaft", "seleccionado", "plantilla", "formacion", "formación",
  "himno", "anthem", "entonacion", "entonación", "national anthem", "alineacion",
  "alineación", "once inicial", "team line", "players of",
  // Calentamiento / fotos de varios jugadores (nadie destaca).
  "players warming", "warming up", "warm-up", "warm up", "players warm",
];
function isGroupPhoto(title) {
  const s = norm(title);
  return GROUP_SIGNAL.some((x) => s.includes(x));
}

// ¿Es categoría/foto JUVENIL (sub-20, U17, etc.)? No es la selección absoluta.
const YOUTH_SIGNAL = [
  "sub-20", "sub 20", "sub20", "sub-17", "sub 17", "sub17", "sub-23", "sub 23",
  "sub23", "sub-15", "sub-19", "u-20", "u20", "u-17", "u17", "u-23", "u23",
  "u-19", "u19", "u-21", "u21", "under-", "under ", "youth", "juvenil",
  "sudamericano sub", "olympic", "olimpic", "olimpico",
];
function isYouth(title) {
  const s = norm(title);
  return YOUTH_SIGNAL.some((x) => s.includes(x));
}

// Señales de que una foto es de SELECCIÓN (no de club). "Club World Cup" NO
// cuenta como selección, por eso se excluye explícitamente.
const NATIONAL_SIGNAL = [
  "national team", "national football", "seleccion", "world cup", "copa del mundo",
  "uefa euro", "eurocopa", "nations league", "copa america", "qualifier",
  "qualification", "eliminatori", "friendly", "amistoso", "concacaf",
  "conmebol", "afcon", "africa cup", "asian cup", "gold cup", "olympic",
  "wc20", "wc22", "wc26", "wm20", "wm22", "wm26",
];
function isNationalTitle(t, countryNorm) {
  const s = norm(t);
  if (s.includes("club world cup")) return false; // es competición de clubes
  if (NATIONAL_SIGNAL.some((x) => s.includes(x))) return true;
  // "<País> vs", "vs <País>", "<País> 1-2 ..." → partido de selección
  return countryNorm && s.includes(countryNorm);
}

// ---- Utilidades --------------------------------------------------------------
function norm(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function fileBase(url) {
  try {
    const last = decodeURIComponent(url.split("/").pop() || "");
    return norm(last.replace(/^\d+px-/, ""));
  } catch { return ""; }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(base, params, tries = 4) {
  const url = `${base}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      // 429 = rate limit: espera larga (creciente) para que la ventana se libere.
      if (res.status === 429) throw new Error("HTTP 429");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) { console.error("  ! API:", err.message); return null; }
      const is429 = /429/.test(err.message);
      await sleep((is429 ? 2500 : 600) * (i + 1));
    }
  }
  return null;
}

// ---- Wikidata: resolver el jugador correcto ----------------------------------
async function resolvePlayer(name, countryQid, extraOk) {
  const sd = await api(WIKIDATA, {
    action: "wbsearchentities", search: name, language: "en", type: "item", limit: "20",
  });
  const ids = (sd?.search || []).map((c) => c.id);
  if (!ids.length) return null;
  // Lotes de 50 como máximo; aquí siempre <=20.
  const ed = await api(WIKIDATA, {
    action: "wbgetentities", ids: ids.join("|"), props: "claims|descriptions",
  });
  const ents = ed?.entities || {};
  const okCountry = new Set([countryQid, ...(extraOk || [])].filter(Boolean));

  let fallback = null; // futbolista cuyo país no pudimos confirmar
  for (const id of ids) {
    const e = ents[id];
    if (!e || !e.claims) continue;
    const cl = e.claims;
    const occ = (cl.P106 || []).map((c) => c.mainsnak?.datavalue?.value?.id);
    const sport = (cl.P641 || []).map((c) => c.mainsnak?.datavalue?.value?.id);
    const isFb = occ.includes(OCC_FOOTBALLER) || sport.includes(SPORT_FOOTBALL);
    if (!isFb) continue;
    const cit = (cl.P27 || []).map((c) => c.mainsnak?.datavalue?.value?.id);
    const sportCountry = (cl.P1532 || []).map((c) => c.mainsnak?.datavalue?.value?.id);
    const matches = [...cit, ...sportCountry].some((q) => okCountry.has(q));
    const cat = cl.P373?.[0]?.mainsnak?.datavalue?.value || null;
    const img = cl.P18?.[0]?.mainsnak?.datavalue?.value || null;
    if (matches) return { id, cat, img, desc: e.descriptions?.en?.value || "" };
    if (!fallback) fallback = { id, cat, img, desc: e.descriptions?.en?.value || "", weak: true };
  }
  // Si solo había UN futbolista candidato, aceptamos aunque no confirmáramos país.
  return fallback;
}

// ¿Es horizontal (apaisada)? Las notificaciones recortan a apaisado: una foto
// vertical pierde la cabeza. Exigimos ancho >= 1.2·alto.
const HORIZONTAL_RATIO = 1.2;
function isHorizontal(w, h) {
  return w && h && w / h >= HORIZONTAL_RATIO;
}

// ---- Commons: imágenes de una categoría --------------------------------------
// Devuelve {title, thumb, w, h} de los ficheros DIRECTOS de la categoría, ya
// filtrados (jpeg/png, no bloqueados). El tamaño es el ORIGINAL (para orientación).
async function categoryThumbs(cat, limit = 80) {
  const cm = await api(COMMONS, {
    action: "query", list: "categorymembers",
    cmtitle: `Category:${cat}`, cmtype: "file", cmlimit: String(limit),
  });
  const titles = (cm?.query?.categorymembers || []).map((m) => m.title);
  if (!titles.length) return [];
  const out = [];
  // imageinfo admite hasta 50 títulos por petición.
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const ii = await api(COMMONS, {
      action: "query", titles: batch.join("|"),
      prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: "600",
    });
    const pages = ii?.query?.pages ? Object.values(ii.query.pages) : [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info) continue;
      if (!/^image\/(jpeg|png)$/.test(info.mime || "")) continue;
      if (BLOCK.some((b) => norm(p.title).includes(b))) continue;
      if (info.thumburl) out.push({ title: p.title, thumb: info.thumburl, w: info.width, h: info.height });
    }
  }
  return out;
}
async function fileThumb(filename) {
  const ii = await api(COMMONS, {
    action: "query", titles: `File:${filename}`,
    prop: "imageinfo", iiprop: "url|mime", iiurlwidth: "400",
  });
  const pages = ii?.query?.pages ? Object.values(ii.query.pages) : [];
  const info = pages[0]?.imageinfo?.[0];
  return info?.thumburl || null;
}

// Miembros de una categoría: type="file" (ficheros) o type="subcat" (subcategorías).
// Devuelve títulos crudos (con prefijo "File:" o "Category:").
async function categoryMembers(cat, type, limit) {
  const cm = await api(COMMONS, {
    action: "query", list: "categorymembers",
    cmtitle: `Category:${cat}`, cmtype: type, cmlimit: String(limit),
  });
  return (cm?.query?.categorymembers || []).map((m) => m.title);
}

// imageinfo (url|mime|size) para una lista de títulos "File:…", en lotes de 50.
// Devuelve {title, thumb, w, h} ya filtrados (jpeg/png, no bloqueados).
async function imageInfoBatch(fileTitles) {
  const out = [];
  for (let i = 0; i < fileTitles.length; i += 50) {
    const batch = fileTitles.slice(i, i + 50);
    const ii = await api(COMMONS, {
      action: "query", titles: batch.join("|"),
      prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: "600",
    });
    const pages = ii?.query?.pages ? Object.values(ii.query.pages) : [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info) continue;
      if (!/^image\/(jpeg|png)$/.test(info.mime || "")) continue;
      if (BLOCK.some((b) => norm(p.title).includes(b))) continue;
      if (info.thumburl) out.push({ title: p.title, thumb: info.thumburl, w: info.width, h: info.height });
    }
    await sleep(DELAY_MS);
  }
  return out;
}

// POOL NACIONAL: recorre el ÁRBOL de la categoría de la selección (BFS hasta 3
// niveles) donde la CAMISETA NACIONAL está garantizada. Las fotos buenas están
// ANIDADAS: "History of … → Matches/Celebrations/Group photographs/line-ups" y
// "Players of … → <subcat por jugador>". De aquí salen (a) las fotos de cada
// jugador con su selección y (b) las fotos de equipo. Solo horizontales.
// Volumen del pool MUY contenido: Commons limita por ráfaga (HTTP 429) y, con el
// nuevo método (jugador desde SU categoría + equipo por búsqueda de año), el pool
// apenas aporta — solo cubre a las estrellas cuyas fotos nacionales están en
// subcats. Por eso recortamos el BFS para no agotar el rate-limit.
const POOL_DEPTH = 2;       // niveles de BFS bajo la raíz
const POOL_MAX_CATS = 18;   // categorías a visitar como tope (coste/tiempo)
const POOL_CAP = 200;       // tope de ficheros únicos con imageinfo
// Subcategorías que NO son la selección ABSOLUTA masculina actual.
const CAT_SKIP = [
  "kit", "logo", "jersey", "stamp", "under-", "under ", "u-1", "u-2", "u1", "u2",
  "women", "femenin", "youth", "junior", "futsal", "beach", "olympic", "amputee",
  "deaf", "esports", "by year", "history", "managers", "kits", "crest",
];
function catSkip(name) {
  const s = norm(name);
  return CAT_SKIP.some((x) => s.includes(x));
}
async function nationalPool(nameEn) {
  const roots = [
    `${nameEn} national association football team`,
    `${nameEn} national football team`,
  ];
  const fileTitles = new Set();
  const visited = new Set();
  // BFS: cola de {cat, depth}
  const queue = roots.map((c) => ({ cat: c, depth: 0 }));
  let catCount = 0;
  while (queue.length && fileTitles.size < POOL_CAP && catCount < POOL_MAX_CATS) {
    const { cat, depth } = queue.shift();
    const key = norm(cat);
    if (visited.has(key)) continue;
    visited.add(key);
    catCount++;
    const files = await categoryMembers(cat, "file", 200);
    files.forEach((t) => fileTitles.add(t));
    await sleep(DELAY_MS);
    if (depth < POOL_DEPTH) {
      const subs = await categoryMembers(cat, "subcat", 100);
      await sleep(DELAY_MS);
      for (const sc of subs) {
        const scName = sc.replace(/^Category:/, "");
        if (catSkip(scName) || visited.has(norm(scName))) continue;
        queue.push({ cat: scName, depth: depth + 1 });
      }
    }
  }
  const titles = [...fileTitles].slice(0, POOL_CAP);
  const infos = await imageInfoBatch(titles);
  return infos.filter((c) => isHorizontal(c.w, c.h));
}

// FOTOS DE EQUIPO con la fórmula de Carlos: "selección <país> 2026" (y años
// recientes). En vez de volcar el árbol entero de la categoría (que traía fotos
// de los años 20-80, aviones chárter y placas), BUSCAMOS en Commons por la
// selección + año reciente y exigimos que el título lleve un año 2020-2026.
// Resultado: material ACTUAL (grupo/once/celebración) de la selección.
const TEAM_YEARS = ["2026", "2025", "2024", "2023", "2022"];
async function teamPhotosByYear(nameEn, countryNorm) {
  const seen = new Set();
  const out = [];
  // Acepta un fichero de equipo (grupo/once/celebración) ACTUAL. Para equipo SÍ
  // queremos fotos de grupo, así que NO excluimos isGroupPhoto. No exigimos año
  // en el título (muchas buenas no lo llevan); solo descartamos las marcadas como
  // antiguas (<2020) o juveniles. BLOCK ya quita femenino, kits, escudos y ruido.
  const accept = (title, w, h) => {
    if (BLOCK.some((b) => norm(title).includes(b))) return false;
    if (isOldByTitle(title)) return false;
    if (isYouth(title)) return false;
    if (!isNationalTitle(title, countryNorm)) return false;
    if (!isHorizontal(w, h)) return false;
    const k = fileBase(title);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  };

  // (1) BÚSQUEDA "selección <país> <año>" (fórmula de Carlos).
  for (const y of TEAM_YEARS) {
    if (out.length >= POOL_CAP) break;
    const sr = await api(COMMONS, {
      action: "query", generator: "search", gsrnamespace: "6",
      gsrsearch: `${nameEn} national football team ${y}`, gsrlimit: "40",
      prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: "600",
    });
    await sleep(DELAY_MS);
    const pages = sr?.query?.pages ? Object.values(sr.query.pages) : [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info || !/^image\/jpeg$/.test(info.mime || "")) continue;
      if (accept(p.title, info.width, info.height)) {
        out.push({ title: p.title, thumb: info.thumburl, w: info.width, h: info.height });
      }
    }
  }

  // (2) SUPLEMENTO desde la CATEGORÍA de la selección: ficheros directos + los de
  //     sus subcats recientes (2022+). Recupera selecciones poco indexadas en la
  //     búsqueda (Croacia, etc.). La camiseta nacional la garantiza la categoría.
  const roots = [
    `${nameEn} national football team`,
    `${nameEn} national association football team`,
  ];
  for (const root of roots) {
    if (out.length >= PER_COUNTRY * 3) break;
    const direct = await imageInfoBatch(await categoryMembers(root, "file", 120));
    await sleep(DELAY_MS);
    for (const c of direct) {
      if (accept(c.title, c.w, c.h)) out.push(c);
    }
    const yrCats = await recentSubcats(root, 2022).catch(() => []);
    for (const yc of yrCats) {
      if (out.length >= PER_COUNTRY * 3) break;
      const infos = await imageInfoBatch(await categoryMembers(yc, "file", 80));
      await sleep(DELAY_MS);
      for (const c of infos) {
        if (accept(c.title, c.w, c.h)) out.push(c);
      }
    }
  }
  return out;
}

// BÚSQUEDA POR JUGADOR (fórmula de Carlos: "la búsqueda es fácil"). Para las
// estrellas cuyas fotos nacionales están en subcats y no caen en el pool ligero
// (p.ej. Messi). Exige el APELLIDO en el título (que el jugador DESTAQUE) +
// camiseta NACIONAL (no club) + horizontal + nada de grupo/antiguo/juvenil.
async function searchPlayerPhotos(queryName, tokens, countryNorm) {
  const sr = await api(COMMONS, {
    action: "query", generator: "search", gsrnamespace: "6",
    gsrsearch: queryName, gsrlimit: "30",
    prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: "600",
  });
  const pages = sr?.query?.pages ? Object.values(sr.query.pages) : [];
  const surname = tokens[tokens.length - 1] || "";
  const out = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    if (!/^image\/jpeg$/.test(info.mime || "")) continue;
    if (BLOCK.some((b) => norm(p.title).includes(b))) continue;
    // La consulta ya acotó a los archivos del jugador: basta el APELLIDO en el
    // título (sus archivos suelen decir solo "Messi", no el nombre completo).
    if (!surname || !norm(p.title).includes(surname)) continue;
    if (!isNationalTitle(p.title, countryNorm)) continue;   // camiseta nacional, no club
    // Último recurso: aceptamos era Mundial 2018+ (color, acción) para no dejar a
    // las estrellas sin foto; sigue lejos del B/N de los años 20-80 que Carlos veta.
    if (isGroupPhoto(p.title) || isOldByTitle(p.title, 2018) || isYouth(p.title)) continue;
    if (!isHorizontal(info.width, info.height)) continue;
    out.push({ title: p.title, thumb: info.thumburl, w: info.width, h: info.height });
  }
  return out;
}

// Subcategorías RECIENTES (año >= floor) de una categoría, descendiendo un nivel
// extra dentro de contenedores "… by year" (ahí viven las fotos buenas de las
// estrellas: "Lionel Messi" → "by year" → "Lionel Messi in 2022"). También
// admite subcats con señal nacional (p.ej. "X at the 2022 World Cup").
async function recentSubcats(cat, floor) {
  const result = [];
  const subs = (await categoryMembers(cat, "subcat", 60)).map((s) => s.replace(/^Category:/, ""));
  await sleep(DELAY_MS);
  for (const sc of subs) {
    // "… by year" es un CONTENEDOR: hay que ENTRAR (aunque esté en CAT_SKIP) para
    // sacar los años recientes; el resto sí se filtra por catSkip.
    if (norm(sc).includes("by year")) {
      const ys = (await categoryMembers(sc, "subcat", 80)).map((s) => s.replace(/^Category:/, ""));
      await sleep(DELAY_MS);
      for (const y of ys) {
        const yr = yearInTitle(y);
        if (yr && yr >= floor && !catSkip(y)) result.push(y);
      }
      continue;
    }
    if (catSkip(sc)) continue;
    const yr = yearInTitle(sc);
    if ((yr && yr >= floor) || isNationalTitle(sc, "")) result.push(sc);
  }
  return result;
}

// Tokens del nombre para cruzar contra los títulos del pool. Quita partículas
// ("de", "da", "dos", "van"…) y nombres de pila muy cortos para evitar ruido.
const NAME_STOP = new Set(["de", "da", "do", "dos", "das", "del", "van", "von", "el", "la", "al", "bin", "ben"]);
function nameTokens(fullName) {
  return norm(fullName).split(/\s+/).filter((w) => w.length >= 3 && !NAME_STOP.has(w));
}
// ¿El título del fichero menciona al jugador? Exige el APELLIDO (último token) y,
// si hay nombre de pila, también alguno de los otros tokens cuando el apellido es
// común. Conservador: preferimos no asignar a asignar mal.
function titleMatchesPlayer(title, tokens) {
  if (!tokens.length) return false;
  const s = norm(title);
  const surname = tokens[tokens.length - 1];
  if (!s.includes(surname)) return false;
  if (tokens.length === 1) return true;
  // apellido + (nombre de pila o segundo apellido) para reducir homónimos
  return tokens.slice(0, -1).some((t) => s.includes(t)) || surname.length >= 7;
}

function dedupeCap(urls, cap) {
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    if (!u) continue;
    const k = fileBase(u);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(u);
    if (out.length >= cap) break;
  }
  return out;
}

// ---- Recolección por equipo --------------------------------------------------
async function collectForTeam(slug) {
  const file = path.join(TEAMS_DIR, `${slug}.json`);
  const team = JSON.parse(fs.readFileSync(file, "utf8"));
  const wc = team.wc_2026 || {};
  const nameEn = team.name_en || team.name_es || slug;
  const iso = (team.iso || "").toLowerCase();
  const countryQid = ISO2QID[iso] || null;
  const countryNorm = norm(nameEn);
  const extraOk = UK_NATIONS.has(iso) ? [UK] : [];

  const report = { slug, name: nameEn, players: [], country: [] };

  // 1) POOL NACIONAL (una sola vez por equipo): todas las fotos horizontales de
  //    la selección, recorriendo el árbol de su categoría. Camiseta nacional
  //    garantizada. De aquí salen jugador y equipo.
  process.stdout.write(`  · [pool] ${nameEn} … `);
  let pool = [];
  try { pool = await nationalPool(nameEn); }
  catch (err) { console.log(`error pool (${err.message})`); }
  console.log(`${pool.length} foto(s) H en pool nacional`);
  const usedInTeam = new Set();

  // 2) Por jugador: cruzar el pool por nombre (camiseta nacional). Si no hay
  //    nada en el pool, intentar su categoría de Commons SOLO con señal nacional.
  for (const p of wc.likely_squad || []) {
    const fullName = p.full_name || p.display_name;
    if (!fullName) continue;
    process.stdout.write(`  · ${fullName} … `);
    const tokens = nameTokens(fullName);
    const currentBase = p.photo_url ? fileBase(p.photo_url) : "";

    // El jugador tiene que DESTACAR (Carlos): exige su apellido en el título y
    // descarta fotos de grupo/formación/himno y fotos antiguas.
    const playerOk = (c) =>
      titleMatchesPlayer(c.title, tokens) &&
      !isGroupPhoto(c.title) && !isOldByTitle(c.title) && !isYouth(c.title);
    const fromPool = pool.filter(playerOk);
    let usable = fromPool;
    let source = `pool:${fromPool.length}`;
    let wd = null;

    // Suplir desde su categoría de Commons si el pool no dio suficiente.
    if (usable.length < PER_PLAYER) {
      const r = await resolvePlayer(fullName, countryQid, extraOk);
      await sleep(DELAY_MS);
      wd = r?.id || null;
      if (r?.cat) {
        // (a) ficheros directos de la categoría del jugador con señal nacional
        const thumbs = await categoryThumbs(r.cat);
        await sleep(DELAY_MS);
        // La categoría ya garantiza que ES el jugador; aquí solo exigimos
        // horizontal + señal nacional + que NO sea foto de grupo ni antigua,
        // para que el jugador destaque.
        let extra = thumbs
          .filter((c) => isHorizontal(c.w, c.h))
          .filter((c) => isNationalTitle(c.title, countryNorm))
          .filter((c) => !isGroupPhoto(c.title) && !isOldByTitle(c.title) && !isYouth(c.title));
        source += `+cat:${extra.length}`;

        // (b) DESCENSO POR AÑOS: las fotos nacionales de las estrellas viven en
        //     "<Jugador> by year" → "<Jugador> in 2022/2023/…". Bajamos a los
        //     años recientes (2018+) y exigimos, por fichero, señal NACIONAL +
        //     horizontal + nada de grupo/antiguo/juvenil. Así Messi/Ronaldo dejan
        //     de salir a cero. (BLOCK ya filtra femenino y ruido).
        if (usable.length + extra.length < PER_PLAYER) {
          const yrCats = await recentSubcats(r.cat, 2018);
          let subN = 0;
          for (const yc of yrCats) {
            if (usable.length + extra.length >= PER_PLAYER) break;
            const files = await categoryMembers(yc, "file", 80);
            await sleep(DELAY_MS);
            const infos = (await imageInfoBatch(files))
              .filter((c) => isHorizontal(c.w, c.h))
              .filter((c) => isNationalTitle(c.title, countryNorm))
              .filter((c) => !isGroupPhoto(c.title) && !isOldByTitle(c.title, 2018) && !isYouth(c.title));
            extra = [...extra, ...infos];
            subN += infos.length;
          }
          if (subN) source += `+yr:${subN}`;
        }
        usable = [...usable, ...extra];
      }
    }

    // Fallback de BÚSQUEDA por nombre si aún faltan (cubre estrellas tipo Messi).
    if (usable.length < PER_PLAYER) {
      const queryName = p.display_name || fullName;
      const found = await searchPlayerPhotos(queryName, tokens, countryNorm);
      await sleep(DELAY_MS);
      if (found.length) { usable = [...usable, ...found]; source += `+srch:${found.length}`; }
    }

    const picked = dedupeCap(
      usable.filter((c) => fileBase(c.thumb) !== currentBase).map((c) => c.thumb),
      PER_PLAYER,
    );
    picked.forEach((u) => usedInTeam.add(fileBase(u)));
    console.log(picked.length ? `${picked.length} foto(s) [${source}]` : `0${wd ? ` (${wd})` : ""}`);
    if (picked.length > 0) {
      report.players.push({ full_name: fullName, wikidata: wd, source, add: picked });
    }
  }

  // 3) Fotos de EQUIPO (grupo/once/celebración) para "alineaciones" (favorito) y
  //    "final" (ganador). Fórmula de Carlos: "selección <país> 2026" → búsqueda
  //    por año reciente (2022-2026), no el árbol histórico. Solo ACTUALES.
  {
    process.stdout.write(`  · [equipo] ${nameEn} … `);
    let teamInfos = [];
    try { teamInfos = await teamPhotosByYear(nameEn, countryNorm); }
    catch (err) { console.log(`error equipo (${err.message})`); }
    const teamPics = dedupeCap(teamInfos.map((c) => c.thumb), PER_COUNTRY);
    console.log(`${teamPics.length} foto(s) H (recientes)`);
    report.team = { add: teamPics };
  }

  // Pool de país (OPT-IN, desaconsejado).
  if (COUNTRY) {
    process.stdout.write(`  · [país] ${nameEn} … `);
    const cm = await api(COMMONS, {
      action: "query", generator: "search", gsrnamespace: "6",
      gsrsearch: `${nameEn} national football team supporters`, gsrlimit: String(PER_COUNTRY * 3),
      prop: "imageinfo", iiprop: "url|mime", iiurlwidth: "400",
    });
    const pages = cm?.query?.pages ? Object.values(cm.query.pages) : [];
    const urls = [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info || !/^image\/(jpeg|png)$/.test(info.mime || "")) continue;
      if (BLOCK.some((b) => norm(p.title).includes(b))) continue;
      if (info.thumburl) urls.push(info.thumburl);
    }
    const picked = dedupeCap(urls, PER_COUNTRY);
    console.log(`${picked.length} imagen(es)`);
    report.country = { add: picked };
  }

  return { file, team, report };
}

function applyToTeam(team, report) {
  const wc = team.wc_2026 || (team.wc_2026 = {});
  if (RESET) {
    for (const p of wc.likely_squad || []) p.photos = [];
    wc.team_photos = [];
    delete wc.image_pool; // pool viejo (jugadores retirados / fotos antiguas): fuera
  }
  const byName = new Map();
  for (const p of wc.likely_squad || []) {
    byName.set(norm(p.full_name || p.display_name || ""), p);
  }
  for (const r of report.players || []) {
    const p = byName.get(norm(r.full_name));
    if (!p) continue;
    p.photos = dedupeCap([...(p.photos || []), ...r.add], PER_PLAYER);
  }
  if (report.team && report.team.add) {
    wc.team_photos = dedupeCap([...(wc.team_photos || []), ...report.team.add], PER_COUNTRY);
  }
}

// ---- Main --------------------------------------------------------------------
(async () => {
  if (typeof fetch !== "function") {
    console.error("Se requiere Node 18+ (fetch global). Tienes:", process.version);
    process.exit(1);
  }
  const slugs = ONLY_TEAM
    ? ONLY_TEAM.split(",")
    : fs.readdirSync(TEAMS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

  console.log(
    `Commons/Wikidata fetch · ${slugs.length} equipo(s) · ${APPLY ? "APPLY (escribe)" : "DRY-RUN"}` +
      ` · per-player=${PER_PLAYER}${RESET ? " · RESET" : ""}${COUNTRY ? " · +país" : ""}`,
  );

  const fullReport = [];
  for (const slug of slugs) {
    console.log(`\n[${slug}]`);
    let collected;
    try { collected = await collectForTeam(slug); }
    catch (err) { console.error(`  ! ${slug}: ${err.message}`); continue; }
    fullReport.push(collected.report);
    if (APPLY) {
      applyToTeam(collected.team, collected.report);
      fs.writeFileSync(collected.file, JSON.stringify(collected.team, null, 2) + "\n", "utf8");
      console.log(`  ✓ escrito ${collected.file}`);
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(fullReport, null, 2) + "\n", "utf8");
  const players = fullReport.reduce((n, r) => n + (r.players?.length || 0), 0);
  const photos = fullReport.reduce((n, r) => n + (r.players || []).reduce((m, p) => m + p.add.length, 0), 0);
  console.log(
    `\nListo. Informe → ${REPORT}` +
      `\n  jugadores con foto: ${players} · fotos totales: ${photos}` +
      (APPLY ? "" : "\n  (dry-run: revisa el informe y vuelve a ejecutar con --apply)"),
  );
})();
