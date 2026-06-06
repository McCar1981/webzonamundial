// scripts/fetch-commons-images.cjs
//
// Rellena (semi)automáticamente las galerías de imágenes de las fichas BIBLIA
// desde Wikimedia Commons, para dar VARIEDAD a la imagen de los push:
//   - Player.photos[]      → fotos adicionales del jugador (además de photo_url).
//   - wc_2026.image_pool[] → pool del país (selección, afición, acción).
//
// SEGURO POR DEFECTO: hace un DRY-RUN y escribe un informe en
// scripts/commons-images-report.json para que lo revises. NO toca las fichas
// hasta que pasas --apply.
//
// Uso:
//   node scripts/fetch-commons-images.cjs                  # dry-run, 48 equipos
//   node scripts/fetch-commons-images.cjs --team=belgica   # un solo equipo
//   node scripts/fetch-commons-images.cjs --players-only    # solo jugadores
//   node scripts/fetch-commons-images.cjs --country-only    # solo pool de país
//   node scripts/fetch-commons-images.cjs --per-player=4 --per-country=10
//   node scripts/fetch-commons-images.cjs --apply           # ESCRIBE en las fichas
//
// Política de buen ciudadano: User-Agent identificable, peticiones secuenciales
// con una pequeña pausa. No fabrica URLs: todo sale de la API real de Commons.

const fs = require("fs");
const path = require("path");

// ---- Configuración por flags -------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const val = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : def;
};

const APPLY = flag("apply");
// --insecure: salta la verificación del certificado TLS. ÚSALO SOLO si estás
// detrás de un proxy corporativo que intercepta HTTPS (error
// UNABLE_TO_VERIFY_LEAF_SIGNATURE). En una red normal NO hace falta.
if (flag("insecure")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("⚠ --insecure: verificación TLS desactivada (solo para proxy MITM).");
}
const PLAYERS_ONLY = flag("players-only");
const COUNTRY_ONLY = flag("country-only");
const ONLY_TEAM = val("team", null);
const PER_PLAYER = parseInt(val("per-player", "4"), 10);
const PER_COUNTRY = parseInt(val("per-country", "10"), 10);
const DELAY_MS = parseInt(val("delay", "200"), 10);

const TEAMS_DIR = "data/teams";
const REPORT = "scripts/commons-images-report.json";
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "ZonaMundial-image-fetch/1.0 (https://zonamundial.com; amistosos push)";

// Palabras que descartan un archivo (no es una foto útil de persona/afición).
const BLOCK = [
  "logo", "flag", "bandera", "crest", "escudo", "badge", "coat of arms",
  "map", "mapa", "stadium", "estadio", "signature", "firma", "icon", "icono",
  "kit", "jersey", "camiseta", "shirt", "trophy", "diagram", "chart", "location",
];

// ---- Utilidades --------------------------------------------------------------
function norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function fileBase(url) {
  // Nombre del archivo de Commons a partir de una URL de upload.wikimedia.
  try {
    const last = decodeURIComponent(url.split("/").pop() || "");
    return norm(last.replace(/^\d+px-/, ""));
  } catch {
    return "";
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiQuery(params, tries = 3) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) {
        console.error("  ! API error:", err.message);
        return null;
      }
      await sleep(400 * (i + 1));
    }
  }
  return null;
}

/** Busca archivos (namespace 6) en Commons y devuelve candidatos con thumb. */
async function searchImages(query, limit) {
  const data = await apiQuery({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: String(Math.max(limit * 3, 12)), // pedimos de más para poder filtrar
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "400",
  });
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    if (!/^image\/(jpeg|png)$/.test(ii.mime || "")) continue;
    const title = norm(p.title);
    if (BLOCK.some((b) => title.includes(b))) continue;
    out.push({
      title: p.title,
      thumb: ii.thumburl || null,
      page: ii.descriptionurl || null,
    });
  }
  return out;
}

function dedupeCap(urls, cap) {
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    if (!u) continue;
    const key = fileBase(u);
    if (seen.has(key)) continue;
    seen.add(key);
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

  const report = { slug, name: nameEn, players: [], country: [] };

  // -- Jugadores --
  if (!COUNTRY_ONLY) {
    const squad = wc.likely_squad || [];
    for (const p of squad) {
      const fullName = p.full_name || p.display_name;
      if (!fullName) continue;
      const surname = norm(fullName).split(/\s+/).filter(Boolean).pop();
      const currentBase = p.photo_url ? fileBase(p.photo_url) : "";
      process.stdout.write(`  · ${fullName} … `);
      const found = await searchImages(`${fullName} ${nameEn} footballer`, PER_PLAYER);
      await sleep(DELAY_MS);
      // Filtro fuerte: el apellido debe aparecer en el título (evita falsos).
      const candidates = found
        .filter((c) => surname && norm(c.title).includes(surname))
        .filter((c) => c.thumb && fileBase(c.thumb) !== currentBase);
      const picked = dedupeCap(candidates.map((c) => c.thumb), PER_PLAYER);
      console.log(`${picked.length} foto(s)`);
      if (picked.length > 0) {
        report.players.push({
          full_name: fullName,
          current: p.photo_url || null,
          add: picked,
          candidates: candidates.slice(0, PER_PLAYER).map((c) => ({ title: c.title, page: c.page })),
        });
      }
    }
  }

  // -- Pool de país --
  if (!PLAYERS_ONLY) {
    process.stdout.write(`  · [país] ${nameEn} … `);
    const q1 = await searchImages(`${nameEn} national football team`, PER_COUNTRY);
    await sleep(DELAY_MS);
    const q2 = await searchImages(`${nameEn} football supporters fans`, PER_COUNTRY);
    await sleep(DELAY_MS);
    const merged = [...q1, ...q2].filter((c) => c.thumb);
    const picked = dedupeCap(merged.map((c) => c.thumb), PER_COUNTRY);
    console.log(`${picked.length} imagen(es)`);
    report.country = {
      add: picked,
      candidates: merged.slice(0, PER_COUNTRY).map((c) => ({ title: c.title, page: c.page })),
    };
  }

  return { file, team, report };
}

function applyToTeam(team, report) {
  const wc = team.wc_2026 || (team.wc_2026 = {});
  // Jugadores → photos[]
  const byName = new Map();
  for (const p of wc.likely_squad || []) {
    byName.set(norm(p.full_name || p.display_name || ""), p);
  }
  for (const r of report.players || []) {
    const p = byName.get(norm(r.full_name));
    if (!p) continue;
    p.photos = dedupeCap([...(p.photos || []), ...r.add], PER_PLAYER);
  }
  // País → image_pool[]
  if (report.country && report.country.add) {
    wc.image_pool = dedupeCap([...(wc.image_pool || []), ...report.country.add], PER_COUNTRY);
  }
}

// ---- Main --------------------------------------------------------------------
(async () => {
  if (typeof fetch !== "function") {
    console.error("Se requiere Node 18+ (fetch global). Tienes:", process.version);
    process.exit(1);
  }

  const slugs = ONLY_TEAM
    ? [ONLY_TEAM]
    : fs.readdirSync(TEAMS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

  console.log(
    `Commons fetch · ${slugs.length} equipo(s) · ${APPLY ? "APPLY (escribe fichas)" : "DRY-RUN (solo informe)"}` +
      ` · per-player=${PER_PLAYER} per-country=${PER_COUNTRY}`,
  );

  const fullReport = [];
  for (const slug of slugs) {
    console.log(`\n[${slug}]`);
    let collected;
    try {
      collected = await collectForTeam(slug);
    } catch (err) {
      console.error(`  ! ${slug}: ${err.message}`);
      continue;
    }
    fullReport.push(collected.report);
    if (APPLY) {
      applyToTeam(collected.team, collected.report);
      fs.writeFileSync(collected.file, JSON.stringify(collected.team, null, 2) + "\n", "utf8");
      console.log(`  ✓ escrito ${collected.file}`);
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(fullReport, null, 2) + "\n", "utf8");
  const players = fullReport.reduce((n, r) => n + (r.players?.length || 0), 0);
  const countryImgs = fullReport.reduce((n, r) => n + (r.country?.add?.length || 0), 0);
  console.log(
    `\nListo. Informe → ${REPORT}` +
      `\n  jugadores con fotos nuevas: ${players} · imágenes de país: ${countryImgs}` +
      (APPLY ? "" : "\n  (dry-run: revisa el informe y vuelve a ejecutar con --apply)"),
  );
})();
