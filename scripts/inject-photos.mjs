import { readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2];
if (!slug) { console.error("Uso: node scripts/inject-photos.mjs <slug>"); process.exit(1); }

const photos = JSON.parse(readFileSync(`scripts/output/${slug}-photos.json`, "utf-8"));
const teamPath = `data/teams/${slug}.json`;
const team = JSON.parse(readFileSync(teamPath, "utf-8"));

const photoMap = new Map(photos.filter(p => p.photo_url).map(p => [p.id, { url: p.photo_url, wiki: p.wiki }]));

for (const player of team.wc_2026.likely_squad) {
  const ph = photoMap.get(player.id);
  if (ph) {
    player.photo_url = ph.url;
    if (ph.wiki) player.photo_credit = { source: "Wikipedia Commons", page: ph.wiki };
  }
}

writeFileSync(teamPath, JSON.stringify(team, null, 2) + "\n");
console.log(`✓ Inyectadas ${photoMap.size} fotos en ${teamPath}`);
