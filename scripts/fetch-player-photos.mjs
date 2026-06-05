#!/usr/bin/env node
// scripts/fetch-player-photos.mjs
//
// Recorre data/teams/*.json y, para cada jugador sin photo_url, consulta
// la API de Wikipedia con HEURÍSTICA ESTRICTA:
//
//   1. Búsqueda en es.wikipedia + en.wikipedia
//   2. Solo acepta páginas cuyo extract menciona "futbolist"/"footballer"
//      Y el equipo/club esperado o el país de la convocatoria.
//   3. Descarta fotos cuyo path tenga keywords sospechosos (logo, mapa,
//      bandera, monumento, etc.)
//   4. Verifica que la imagen viene de upload.wikimedia.org
//
// Uso:
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/fetch-player-photos.mjs
//   ... --team brasil --dry-run

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "data", "teams");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const TEAM_FILTER = (() => {
  const idx = args.indexOf("--team");
  return idx >= 0 ? args[idx + 1] : null;
})();

const USER_AGENT =
  "ZonaMundial/1.0 (https://zonamundial.app; gol@zonamundial.app) bot/player-photo-resolver";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/* Country/team context — usado para validar que la página es del jugador     */
/* correcto, no de un homónimo random.                                         */
/* -------------------------------------------------------------------------- */

const COUNTRY_KEYWORDS = {
  bosnia: ["bosnia", "bosnio", "bosnian"],
  brasil: ["brasil", "brazil", "brasileño", "brazilian", "selección brasileña"],
  haiti: ["haití", "haiti", "haitiano", "haitian"],
  "costa-de-marfil": ["costa de marfil", "ivory coast", "marfileño", "ivorian"],
  japon: ["japón", "japan", "japonés", "japanese", "selección japonesa"],
  suecia: ["suecia", "sweden", "sueco", "swedish"],
  belgica: ["bélgica", "belgium", "belga", "belgian"],
  "nueva-zelanda": ["nueva zelanda", "new zealand", "neozelandés", "kiwi"],
  francia: ["francia", "france", "francés", "french", "selección francesa"],
  austria: ["austria", "austríaco", "austrian"],
  "corea-del-sur": ["corea", "korea", "coreano", "korean"],
  portugal: ["portugal", "portugués", "portuguese"],
  alemania: ["alemania", "germany", "alemán", "german", "selección alemana"],
  inglaterra: ["inglaterra", "england", "inglés", "english", "british"],
  croacia: ["croacia", "croatia", "croata", "croatian"],
  escocia: ["escocia", "scotland", "escocés", "scottish"],
  espana: ["españa", "spain", "español", "spanish", "selección española"],
  noruega: ["noruega", "norway", "noruego", "norwegian"],
  "paises-bajos": ["países bajos", "netherlands", "holanda", "neerlandés", "dutch"],
  suiza: ["suiza", "switzerland", "suizo", "swiss"],
  "republica-checa": ["chequia", "república checa", "czech", "checo", "czechia"],
  turquia: ["turquía", "turkey", "turco", "turkish"],
  argentina: ["argentina", "argentino", "argentinian", "argentine"],
  colombia: ["colombia", "colombiano", "colombian"],
  ecuador: ["ecuador", "ecuatoriano", "ecuadorian"],
  paraguay: ["paraguay", "paraguayo", "paraguayan"],
  uruguay: ["uruguay", "uruguayo", "uruguayan"],
  canada: ["canadá", "canada", "canadiense", "canadian"],
  "estados-unidos": ["estados unidos", "united states", "estadounidense", "american", "usa"],
  mexico: ["méxico", "mexico", "mexicano", "mexican"],
  curazao: ["curazao", "curaçao", "curacao", "curazoleño"],
  panama: ["panamá", "panama", "panameño", "panamanian"],
  sudafrica: ["sudáfrica", "south africa", "sudafricano", "south african"],
  argelia: ["argelia", "algeria", "argelino", "algerian"],
  "cabo-verde": ["cabo verde", "cape verde", "caboverdiano", "cape verdean"],
  egipto: ["egipto", "egypt", "egipcio", "egyptian"],
  ghana: ["ghana", "ghanés", "ghanaian"],
  marruecos: ["marruecos", "morocco", "marroquí", "moroccan"],
  "rd-congo": ["congo", "rd congo", "dr congo", "congolese", "congoleño"],
  senegal: ["senegal", "senegalés", "senegalese"],
  tunez: ["túnez", "tunisia", "tunecino", "tunisian"],
  "arabia-saudi": ["arabia saudí", "saudi arabia", "saudí", "saudi"],
  australia: ["australia", "australiano", "australian"],
  irak: ["irak", "iraq", "iraquí", "iraqi"],
  jordania: ["jordania", "jordan", "jordano", "jordanian"],
  uzbekistan: ["uzbekistán", "uzbekistan", "uzbeko", "uzbek"],
  qatar: ["qatar", "catarí", "qatari"],
  iran: ["irán", "iran", "iraní", "iranian"],
};

const FOOTBALL_KEYWORDS = [
  "futbolista",
  "futbolístico",
  "fútbol profesional",
  "fútbol asociación",
  "footballer",
  "association football",
  "soccer player",
  "professional football",
  "jugador de fútbol",
];

/* -------------------------------------------------------------------------- */
/* Filename blacklist                                                         */
/* -------------------------------------------------------------------------- */

const BAD_PATH_TOKENS = [
  "logo",
  "flag_",
  "_flag",
  "coat_of_arms",
  "stadium",
  "bento_box",
  "shield",
  "crest",
  "emblema",
  "escudo",
  "trofeo",
  "trophy",
  "_ball",
  "ball_",
  "_field",
  "field_",
  "pitch",
  "icon_",
  "_icon",
  "monument",
  "fermatta",
  "tsarsko_selo",
  "luther",
  "qualification_map",
  "_map.svg",
  "_map.png",
  "_map.jpg",
  "monument_for",
  "angouleme",
  "stade_oceane",
  "kashima_shrine",
  "selha",
];

function looksLikePlayerPhoto(url) {
  if (!url) return false;
  if (!/upload\.wikimedia\.org/i.test(url)) return false;
  const u = url.toLowerCase();
  return !BAD_PATH_TOKENS.some((b) => u.includes(b));
}

/* -------------------------------------------------------------------------- */
/* Wikipedia API                                                               */
/* -------------------------------------------------------------------------- */

async function api(url) {
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) return null;
  return resp.json();
}

async function searchWiki(query, lang) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "5");
  const data = await api(url);
  return data?.query?.search ?? [];
}

/** Trae pageimage + extract de 250 chars + categories */
async function pageDetails(title, lang) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("prop", "pageimages|extracts|categories");
  url.searchParams.set("piprop", "original");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("exchars", "500");
  url.searchParams.set("cllimit", "max");
  url.searchParams.set("titles", title);
  const data = await api(url);
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page) return null;
  return {
    title: page.title,
    extract: (page.extract || "").toLowerCase(),
    categories: (page.categories || []).map((c) => c.title.toLowerCase()),
    photoUrl: page.original?.source || null,
  };
}

const stripAccents = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Verifica que el TÍTULO de la página Wiki contenga el nombre o el
 *  apellido principal del jugador buscado. Esto evita matches con
 *  homónimos (Léo Pereira ↛ Vanessa Pereira). */
function titleMatchesPlayer(pageTitle, playerName) {
  if (!pageTitle || !playerName) return false;
  const t = stripAccents(pageTitle).replace(/[^\w\s]/g, "");
  const tokens = stripAccents(playerName)
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((tok) => tok.length >= 3);
  if (tokens.length === 0) return false;
  // Todos los tokens significativos del nombre deben aparecer en el título.
  return tokens.every((tok) => t.includes(tok));
}

function isFootballerPage(page, countrySlug, playerName) {
  if (!page) return false;

  // 1) Match estricto del nombre en el título.
  if (!titleMatchesPlayer(page.title, playerName)) return false;

  // 2) La página debe ser de un futbolista.
  const text = page.extract + " " + page.categories.join(" ");
  const hasFootball = FOOTBALL_KEYWORDS.some((k) => text.includes(k));
  if (!hasFootball) return false;

  // 3) Match país (si lo tenemos en el mapa).
  const ctx = COUNTRY_KEYWORDS[countrySlug];
  if (ctx) {
    const hasCountry = ctx.some((k) => text.includes(k));
    if (!hasCountry) return false;
  }
  return true;
}

async function findPlayerPhoto(name, countrySlug) {
  // Genera variantes de query, prioridad descendente.
  // Estrategias: "<name> futbolista", "<name> <country>", "<name> footballer", etc.
  const ctxWord = COUNTRY_KEYWORDS[countrySlug]?.[0] ?? "";
  const queries = [
    { q: `${name} futbolista ${ctxWord}`, lang: "es" },
    { q: `${name} ${ctxWord}`, lang: "es" },
    { q: `${name} futbolista`, lang: "es" },
    { q: `${name} footballer`, lang: "en" },
    { q: `${name} soccer player`, lang: "en" },
  ];

  for (const a of queries) {
    const results = await searchWiki(a.q, a.lang);
    await sleep(180);
    if (results.length === 0) continue;

    for (let i = 0; i < Math.min(3, results.length); i++) {
      const r = results[i];
      const details = await pageDetails(r.title, a.lang);
      await sleep(180);
      if (!details) continue;
      if (!isFootballerPage(details, countrySlug, name)) {
        if (VERBOSE) console.log(`     ✗ "${r.title}" no es futbolista de ${countrySlug}`);
        continue;
      }
      if (!looksLikePlayerPhoto(details.photoUrl)) {
        if (VERBOSE) console.log(`     ✗ "${r.title}" foto sospechosa: ${details.photoUrl}`);
        continue;
      }
      return {
        url: details.photoUrl,
        title: details.title,
        lang: a.lang,
      };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function processTeam(slug) {
  const filepath = path.join(ROOT, `${slug}.json`);
  if (!fs.existsSync(filepath)) return null;
  const json = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const squad = json.wc_2026?.likely_squad;
  if (!Array.isArray(squad) || squad.length === 0) return null;

  const announced = json.wc_2026?.squad_announced === true;
  if (!announced) {
    return { slug, skipped: true, reason: "no_announced" };
  }

  let found = 0;
  let notFound = 0;
  let already = 0;

  for (const p of squad) {
    if (p.photo_url) {
      already++;
      continue;
    }
    const name = p.full_name || p.display_name;
    if (!name) {
      notFound++;
      continue;
    }
    process.stdout.write(`  · ${name.padEnd(30)} ... `);
    const photo = await findPlayerPhoto(name, slug);
    if (photo) {
      p.photo_url = photo.url;
      found++;
      process.stdout.write(`OK [${photo.title}]\n`);
    } else {
      notFound++;
      process.stdout.write(`no foto\n`);
    }
    await sleep(120);
  }

  if (!DRY_RUN) {
    fs.writeFileSync(filepath, JSON.stringify(json, null, 2) + "\n", "utf8");
  }
  return { slug, already, found, notFound, total: squad.length };
}

const TEAMS = TEAM_FILTER
  ? [TEAM_FILTER]
  : fs
      .readdirSync(ROOT)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));

console.log(
  `Buscando fotos en Wikipedia (heurística estricta)${DRY_RUN ? " [DRY RUN]" : ""}...\n`,
);

const summary = [];
for (const t of TEAMS) {
  const res = await processTeam(t);
  if (res?.skipped) continue;
  if (res) {
    console.log(
      `\n[${t}] → ya tenía: ${res.already} · encontradas: ${res.found} · sin foto: ${res.notFound}\n`,
    );
    summary.push(res);
  }
}

console.log("\nResumen final:");
console.log(
  "team".padEnd(20) +
    "already".padStart(10) +
    "found".padStart(8) +
    "notFound".padStart(10) +
    "total".padStart(8),
);
for (const r of summary) {
  console.log(
    r.slug.padEnd(20) +
      String(r.already).padStart(10) +
      String(r.found).padStart(8) +
      String(r.notFound).padStart(10) +
      String(r.total).padStart(8),
  );
}
