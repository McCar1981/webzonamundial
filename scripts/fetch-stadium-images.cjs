// scripts/fetch-stadium-images.cjs
//
// Construye el BANCO DE ESTADIOS del Mundial 2026 (data/stadiums.json) con fotos
// HORIZONTALES de cada sede, tomadas de su CATEGORÍA de Wikimedia Commons (la
// pertenencia a la categoría garantiza que la foto ES del estadio).
//
// Lo usa el motor de push en MEDIO TIEMPO: "foto del estadio donde se disputa el
// juego" (regla de Carlos). El partido trae el nombre del estadio como texto
// (meta.venue); aquí guardamos alias (nombre comercial, nombre Mundial sin
// patrocinador, ciudad) para poder casarlo.
//
// SEGURO POR DEFECTO: DRY-RUN. Escribe el informe y NO toca data/ hasta --apply.
//
// Uso:
//   node scripts/fetch-stadium-images.cjs            # dry-run
//   node scripts/fetch-stadium-images.cjs --apply    # escribe data/stadiums.json
//   node scripts/fetch-stadium-images.cjs --insecure # proxy MITM (TLS)

const fs = require("fs");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n, d) => { const h = args.find((a) => a.startsWith(`--${n}=`)); return h ? h.split("=")[1] : d; };

const APPLY = flag("apply");
if (flag("insecure")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("⚠ --insecure: verificación TLS desactivada (solo para proxy MITM).");
}
const PER_STADIUM = parseInt(val("per", "8"), 10);
const DELAY_MS = parseInt(val("delay", "150"), 10);

const OUT = "data/stadiums.json";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const UA = "ZonaMundial-stadium-fetch/1.0 (https://zonamundial.com; mundial 2026)";

// Las 16 sedes del Mundial 2026. commons = categoría de Commons del estadio.
// aliases = nombre comercial + nombre Mundial (sin patrocinador) + ciudad, para
// casar contra el texto del partido (meta.venue) venga como venga.
const STADIA = [
  { key: "metlife", commons: "MetLife Stadium", city: "East Rutherford", country_iso: "us",
    aliases: ["MetLife Stadium", "New York New Jersey Stadium", "New York/New Jersey Stadium", "East Rutherford", "MetLife"] },
  { key: "att-dallas", commons: "AT&T Stadium", city: "Arlington", country_iso: "us",
    aliases: ["AT&T Stadium", "Dallas Stadium", "AT&T", "Arlington"] },
  { key: "nrg-houston", commons: "NRG Stadium", city: "Houston", country_iso: "us",
    aliases: ["NRG Stadium", "Houston Stadium", "NRG", "Houston"] },
  { key: "arrowhead-kc", commons: "Arrowhead Stadium", city: "Kansas City", country_iso: "us",
    aliases: ["Arrowhead Stadium", "Kansas City Stadium", "GEHA Field", "Arrowhead", "Kansas City"] },
  { key: "mercedes-atlanta", commons: "Mercedes-Benz Stadium", city: "Atlanta", country_iso: "us",
    aliases: ["Mercedes-Benz Stadium", "Atlanta Stadium", "Mercedes-Benz", "Atlanta"] },
  { key: "hardrock-miami", commons: "Hard Rock Stadium", city: "Miami Gardens", country_iso: "us",
    aliases: ["Hard Rock Stadium", "Miami Stadium", "Hard Rock", "Miami", "Miami Gardens"] },
  { key: "lincoln-philadelphia", commons: "Lincoln Financial Field", city: "Philadelphia", country_iso: "us",
    aliases: ["Lincoln Financial Field", "Philadelphia Stadium", "Lincoln Financial", "Philadelphia"] },
  { key: "gillette-boston", commons: "Gillette Stadium", city: "Foxborough", country_iso: "us",
    aliases: ["Gillette Stadium", "Boston Stadium", "Gillette", "Foxborough", "Boston"] },
  { key: "lumen-seattle", commons: "Lumen Field", city: "Seattle", country_iso: "us",
    aliases: ["Lumen Field", "Seattle Stadium", "CenturyLink Field", "Lumen", "Seattle"] },
  { key: "levis-bayarea", commons: "Levi's Stadium", city: "Santa Clara", country_iso: "us",
    aliases: ["Levi's Stadium", "San Francisco Bay Area Stadium", "Bay Area Stadium", "Levi's", "Santa Clara", "San Francisco"] },
  { key: "sofi-la", commons: "SoFi Stadium", city: "Inglewood", country_iso: "us",
    aliases: ["SoFi Stadium", "Los Angeles Stadium", "SoFi", "Inglewood", "Los Angeles"] },
  { key: "azteca-mexico", commons: "Estadio Azteca", city: "Ciudad de México", country_iso: "mx",
    aliases: ["Estadio Azteca", "Estadio Banorte", "Estadio Ciudad de México", "Azteca", "Mexico City", "Ciudad de México"] },
  { key: "akron-guadalajara", commons: "Estadio Omnilife", city: "Guadalajara", country_iso: "mx",
    aliases: ["Estadio Akron", "Estadio Chivas", "Estadio Guadalajara", "Estadio Omnilife", "Akron", "Guadalajara", "Zapopan"] },
  { key: "bbva-monterrey", commons: "Estadio BBVA Bancomer", city: "Monterrey", country_iso: "mx",
    aliases: ["Estadio BBVA", "Estadio BBVA Bancomer", "Estadio Monterrey", "BBVA", "Monterrey", "Guadalupe"] },
  { key: "bmo-toronto", commons: "BMO Field", city: "Toronto", country_iso: "ca",
    aliases: ["BMO Field", "Toronto Stadium", "BMO", "Toronto"] },
  { key: "bcplace-vancouver", commons: "BC Place", city: "Vancouver", country_iso: "ca",
    aliases: ["BC Place", "Vancouver Stadium", "BC Place Stadium", "Vancouver"] },
];

// Para estadios SÍ queremos fotos del recinto; bloqueamos lo que no es una foto
// del estadio (logos, mapas, planos, esquemas de asientos, banderas…).
const BLOCK = [
  "logo", "map", "mapa", "plan", "diagram", "chart", "seating", "seat map",
  "blueprint", "icon", "icono", "flag", "bandera", "crest", "escudo", "badge",
  "signature", "stamp", "sello", "ticket", "panorama crop", "schematic",
];

const HORIZONTAL_RATIO = 1.2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function norm(s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function fileBase(url) { try { return norm(decodeURIComponent(url.split("/").pop() || "").replace(/^\d+px-/, "")); } catch { return ""; } }
function isHorizontal(w, h) { return w && h && w / h >= HORIZONTAL_RATIO; }

async function api(params, tries = 3) {
  const url = `${COMMONS}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) { console.error("  ! API:", err.message); return null; }
      await sleep(400 * (i + 1));
    }
  }
  return null;
}

async function categoryMembers(cat, type, limit) {
  const cm = await api({ action: "query", list: "categorymembers", cmtitle: `Category:${cat}`, cmtype: type, cmlimit: String(limit) });
  return (cm?.query?.categorymembers || []).map((m) => m.title);
}

async function imageInfoBatch(fileTitles) {
  const out = [];
  for (let i = 0; i < fileTitles.length; i += 50) {
    const batch = fileTitles.slice(i, i + 50);
    const ii = await api({ action: "query", titles: batch.join("|"), prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: "800" });
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

function dedupeCap(items, cap) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = fileBase(it.thumb);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
    if (out.length >= cap) break;
  }
  return out;
}

// Recoge fotos del estadio: ficheros directos + subcategorías de un nivel
// (p.ej. "Exterior of …", "Interior of …", "Aerial views of …").
async function stadiumPhotos(commonsCat) {
  const titles = new Set();
  (await categoryMembers(commonsCat, "file", 200)).forEach((t) => titles.add(t));
  await sleep(DELAY_MS);
  const subs = await categoryMembers(commonsCat, "subcat", 30);
  await sleep(DELAY_MS);
  for (const sc of subs) {
    if (titles.size >= 300) break;
    const name = sc.replace(/^Category:/, "");
    if (/logo|map|plan|construction/i.test(name)) continue;
    (await categoryMembers(name, "file", 60)).forEach((t) => titles.add(t));
    await sleep(DELAY_MS);
  }
  const infos = await imageInfoBatch([...titles]);
  return infos.filter((c) => isHorizontal(c.w, c.h));
}

(async () => {
  if (typeof fetch !== "function") { console.error("Node 18+ requerido."); process.exit(1); }
  console.log(`Banco de estadios · ${STADIA.length} sedes · ${APPLY ? "APPLY" : "DRY-RUN"} · per=${PER_STADIUM}`);
  const result = [];
  for (const s of STADIA) {
    process.stdout.write(`  · ${s.commons} … `);
    let photos = [];
    try { photos = await stadiumPhotos(s.commons); }
    catch (err) { console.log(`error (${err.message})`); }
    const picked = dedupeCap(photos, PER_STADIUM).map((c) => c.thumb);
    console.log(`${picked.length} foto(s) H`);
    result.push({ key: s.key, commons: s.commons, city: s.city, country_iso: s.country_iso, aliases: s.aliases, photos: picked });
  }
  const total = result.reduce((n, s) => n + s.photos.length, 0);
  if (APPLY) {
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
    console.log(`\n✓ escrito ${OUT} · ${result.length} sedes · ${total} fotos`);
  } else {
    fs.writeFileSync("scripts/stadiums-report.json", JSON.stringify(result, null, 2) + "\n", "utf8");
    console.log(`\nDRY-RUN · informe → scripts/stadiums-report.json · ${total} fotos (vuelve con --apply)`);
  }
})();
