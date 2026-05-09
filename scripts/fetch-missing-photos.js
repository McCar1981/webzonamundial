// scripts/fetch-missing-photos.js
// Completa los `photo_url` faltantes en data/teams/*.json usando la API de Wikipedia.
// Edita los JSONs textualmente preservando formato original (no reformatea con JSON.stringify).
//
// USO:
//   node --use-system-ca scripts/fetch-missing-photos.js
//   node --use-system-ca scripts/fetch-missing-photos.js --dry-run
//   node --use-system-ca scripts/fetch-missing-photos.js --only=mexico,estados-unidos
//   node --use-system-ca scripts/fetch-missing-photos.js --fix-kits-only

const fs = require('fs');
const path = require('path');

const TEAMS_DIR = 'data/teams';
const UA = 'ZonaMundial/1.0 (https://zonamundial.app; business.dev@sprintmarkt.com)';
const THUMB_SIZE = 330;
const SLEEP_MS = 80;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FIX_KITS_ONLY = args.includes('--fix-kits-only');
const ONLY = args.find(a => a.startsWith('--only='))?.split('=')[1]?.split(',') || null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLACKLIST_KEYWORDS = [
  'Choir_dress', 'Higher_Prelates', 'Logo', 'logo.svg', 'Flag_of_',
  'Coat_of_arms', 'Joueur_de_foot.jpg', 'No_image',
];

function isBlacklisted(url) {
  const filename = decodeURIComponent(url.split('/').pop().replace(/^\d+px-/, ''));
  return BLACKLIST_KEYWORDS.some(kw => filename.includes(kw)) ||
         filename === 'Joueur_de_foot.jpg';
}

async function fetchPageImage(lang, title) {
  const url = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'pageimages',
    pithumbsize: String(THUMB_SIZE),
    pilicense: 'free',
    titles: title,
    redirects: '1',
    origin: '*',
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || !page.thumbnail?.source) return null;
  if (isBlacklisted(page.thumbnail.source)) return null;
  return page.thumbnail.source;
}

async function findPhoto(player) {
  const candidates = [player.full_name, player.display_name].filter((v, i, a) => v && a.indexOf(v) === i);
  for (const name of candidates) {
    let photo = await fetchPageImage('es', name);
    if (photo) return photo;
    await sleep(SLEEP_MS);
    photo = await fetchPageImage('en', name);
    if (photo) return photo;
    await sleep(SLEEP_MS);
  }
  return null;
}

// ===== EDICIÓN TEXTUAL DEL JSON =====
//
// Para cada player, busca el bloque `{ ... "id": "<player.id>", ... }` y añade
// la propiedad photo_url justo antes del cierre del objeto, manteniendo el
// formato e indentación originales.

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addPhotoUrlToPlayer(text, playerId, photoUrl) {
  // Encuentra el bloque que contiene "id": "<playerId>"
  // Asume formato: línea con "id": "<id>", y todo el objeto entre {…}
  const idPattern = new RegExp(`"id"\\s*:\\s*"${escapeRegExp(playerId)}"`, 'g');
  const match = idPattern.exec(text);
  if (!match) return null;
  // Encuentra el { que abre este objeto y el } que lo cierra
  let openBrace = -1;
  for (let i = match.index; i >= 0; i--) {
    if (text[i] === '{') { openBrace = i; break; }
    // Si encontramos un } o ] sin haber visto su par, este id está dentro
    // de un objeto/array más profundo — seguimos retrocediendo.
  }
  if (openBrace === -1) return null;
  // Avanza desde openBrace para encontrar el } que cierra ESTE objeto
  let depth = 0;
  let closeBrace = -1;
  for (let i = openBrace; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) { closeBrace = i; break; }
    }
  }
  if (closeBrace === -1) return null;

  // Verifica que ya no tenga photo_url
  const objText = text.slice(openBrace, closeBrace + 1);
  if (objText.includes('"photo_url"')) return null;

  // Detecta si el objeto está en una sola línea (formato compacto) o multi-línea
  const isInline = !objText.includes('\n');

  // Encuentra la posición justo después del último valor (antes del whitespace que precede al })
  let insertAt = closeBrace - 1;
  while (insertAt > openBrace && /\s/.test(text[insertAt])) insertAt--;
  insertAt++;

  const closingWS = text.slice(insertAt, closeBrace);

  let insertion;
  if (isInline) {
    // Objeto en una sola línea: insertar inline sin saltos
    insertion = `, "photo_url": "${photoUrl}"`;
  } else {
    // Objeto multi-línea: detectar indentación y añadir línea nueva
    const idLine = text.lastIndexOf('\n', match.index);
    const indent = text.slice(idLine + 1, match.index).match(/^[ \t]*/)?.[0] || '        ';
    insertion = `,\n${indent}"photo_url": "${photoUrl}"`;
  }
  return text.slice(0, insertAt) + insertion + closingWS + text.slice(closeBrace);
}

function fixKitFrontUrl(text, slug) {
  const placeholderPattern = /"front_url"\s*:\s*"\[PLACEHOLDER:[^"]*\]"/;
  const match = text.match(placeholderPattern);
  if (!match) return null;
  const realPath = `/img/kits/2026/home/${slug}.png`;
  if (!fs.existsSync('public' + realPath)) return null;
  return text.replace(placeholderPattern, `"front_url": "${realPath}"`);
}

async function main() {
  const files = fs.readdirSync(TEAMS_DIR).filter(f => f.endsWith('.json'));
  const filtered = ONLY ? files.filter(f => ONLY.includes(f.replace('.json', ''))) : files;
  console.log(`Procesando ${filtered.length} JSONs (DRY_RUN=${DRY_RUN}${FIX_KITS_ONLY ? ', FIX_KITS_ONLY' : ''})${ONLY ? ' filtrados: '+ONLY.join(',') : ''}`);

  const stats = { teams: 0, players: 0, found: 0, skipped: 0, kitsFixed: 0 };

  for (const f of filtered) {
    const fp = path.join(TEAMS_DIR, f);
    let text = fs.readFileSync(fp, 'utf8');
    const d = JSON.parse(text);
    let modified = false;

    // 1. Arreglar kit front_url placeholder
    const fixed = fixKitFrontUrl(text, d.slug);
    if (fixed) {
      text = fixed;
      modified = true;
      stats.kitsFixed++;
      console.log(`[${d.slug}] 🎽 Kit front_url arreglado → /img/kits/2026/home/${d.slug}.png`);
    }

    if (FIX_KITS_ONLY) {
      if (modified && !DRY_RUN) fs.writeFileSync(fp, text);
      continue;
    }

    // 2. Añadir photo_url a jugadores que no la tienen
    const squad = d.wc_2026?.likely_squad || [];
    const missing = squad.filter(p => !p.photo_url && p.id);
    if (missing.length === 0) {
      if (modified && !DRY_RUN) fs.writeFileSync(fp, text);
      continue;
    }

    console.log(`\n[${d.slug}] ${missing.length} jugadores sin foto`);
    stats.teams++;
    let teamFound = 0;

    for (const p of missing) {
      stats.players++;
      const name = p.display_name || p.full_name;
      process.stdout.write(`  ${name.padEnd(35)}`);
      try {
        const url = await findPhoto(p);
        if (url) {
          const newText = addPhotoUrlToPlayer(text, p.id, url);
          if (newText) {
            text = newText;
            modified = true;
            teamFound++;
            stats.found++;
            process.stdout.write(' ✓\n');
          } else {
            process.stdout.write(' ✗ patch failed\n');
            stats.skipped++;
          }
        } else {
          process.stdout.write(' ·\n');
          stats.skipped++;
        }
      } catch (e) {
        process.stdout.write(' ✗ ' + e.message + '\n');
        stats.skipped++;
      }
    }

    if (modified && !DRY_RUN) {
      fs.writeFileSync(fp, text);
      console.log(`  💾 ${d.slug} guardado (${teamFound} fotos añadidas)`);
    } else if (modified && DRY_RUN) {
      console.log(`  (dry-run) habría guardado ${d.slug} con ${teamFound} fotos`);
    }
  }

  console.log('\n=== STATS ===');
  console.log(`Kits arreglados: ${stats.kitsFixed}`);
  console.log(`Equipos procesados: ${stats.teams}`);
  console.log(`Jugadores consultados: ${stats.players}`);
  console.log(`Fotos encontradas: ${stats.found} (${(stats.found / Math.max(stats.players,1) * 100).toFixed(1)}%)`);
  console.log(`Sin resultado: ${stats.skipped}`);
}

main().catch(e => { console.error(e); process.exit(1); });
