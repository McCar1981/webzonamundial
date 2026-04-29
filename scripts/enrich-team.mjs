// Enriquece un equipo con fotos Wikipedia: jugadores + coach + captain + star_player.
// Idempotente: si ya tiene photo_url, lo deja como está.
// Uso: node scripts/enrich-team.mjs <slug>

import { readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2];
if (!slug) {
  console.error("Uso: node scripts/enrich-team.mjs <slug>");
  process.exit(1);
}

// Aliases para nombres con desambiguación o slug Wiki distinto al full_name.
// Se va ampliando con cada selección que falle.
const ALIAS = {
  "Walter Benítez": "Walter Damián Benítez",
  "Nicolás González": "Nicolás Iván González",
  "Lionel Andrés Messi": "Lionel Messi",
};

async function fetchPhoto(fullName) {
  const candidate = ALIAS[fullName] ?? fullName;
  const slug = encodeURIComponent(candidate.replace(/\s+/g, "_"));
  const urls = [
    `https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "ZonaMundial/1.0 (https://zonamundial.app)",
          Accept: "application/json",
        },
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (data.thumbnail?.source) {
        return {
          photo_url: data.thumbnail.source,
          page: data.content_urls?.desktop?.page,
        };
      }
    } catch {}
  }
  return null;
}

async function enrichEntity(entity, label, name) {
  if (!entity) return { found: false, skipped: true };
  if (entity.photo_url) return { found: true, skipped: true };
  const ph = await fetchPhoto(name);
  if (ph) {
    entity.photo_url = ph.photo_url;
    if (ph.page) {
      entity.photo_credit = { source: "Wikipedia Commons", page: ph.page };
    }
    process.stderr.write(`  ✓ ${label}: ${name}\n`);
    return { found: true };
  }
  process.stderr.write(`  ✗ ${label}: ${name} (no encontrado)\n`);
  return { found: false };
}

const teamPath = `data/teams/${slug}.json`;
const team = JSON.parse(readFileSync(teamPath, "utf-8"));

console.error(`\n=== Enriqueciendo ${slug.toUpperCase()} ===\n`);

// Coach
if (team.wc_2026?.coach?.name) {
  await enrichEntity(team.wc_2026.coach, "DT", team.wc_2026.coach.name);
  await sleep(200);
}
// Captain
if (team.wc_2026?.captain?.name) {
  await enrichEntity(team.wc_2026.captain, "Capitán", team.wc_2026.captain.name);
  await sleep(200);
}
// Star player
if (team.wc_2026?.star_player?.name) {
  await enrichEntity(team.wc_2026.star_player, "Estrella", team.wc_2026.star_player.name);
  await sleep(200);
}

// Players
const squad = team.wc_2026?.likely_squad ?? [];
let found = 0;
let total = 0;
for (const p of squad) {
  total++;
  if (p.photo_url) {
    found++;
    continue;
  }
  const r = await enrichEntity(p, "Jugador", p.full_name);
  if (r.found) found++;
  await sleep(180);
}

writeFileSync(teamPath, JSON.stringify(team, null, 2) + "\n");
console.error(`\n→ ${slug}: ${found}/${total} jugadores con foto. Guardado en ${teamPath}\n`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
