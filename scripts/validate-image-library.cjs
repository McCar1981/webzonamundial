// scripts/validate-image-library.cjs
//
// Resumen de cobertura de la biblioteca de imágenes tras el scraper. Cuenta, por
// selección: jugadores con foto, fotos de equipo (team_photos) y avisa de fichas
// vacías o que aún conserven el image_pool viejo. No toca nada (solo lee).
//
// Uso: node scripts/validate-image-library.cjs

const fs = require("fs");
const path = require("path");

const TEAMS_DIR = "data/teams";
const slugs = fs.readdirSync(TEAMS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

let totPlayers = 0, totWithPhoto = 0, totTeamPhotos = 0, withOldPool = 0;
const weak = [];
for (const slug of slugs) {
  const t = JSON.parse(fs.readFileSync(path.join(TEAMS_DIR, `${slug}.json`), "utf8"));
  const wc = t.wc_2026 || {};
  const squad = wc.likely_squad || [];
  const withPhoto = squad.filter((p) => (p.photos && p.photos.length) || p.photo_url).length;
  const teamPhotos = (wc.team_photos || []).length;
  totPlayers += squad.length;
  totWithPhoto += withPhoto;
  totTeamPhotos += teamPhotos;
  if (wc.image_pool) withOldPool++;
  const cov = squad.length ? Math.round((withPhoto / squad.length) * 100) : 0;
  if (teamPhotos < 4 || cov < 50) weak.push({ slug, withPhoto, squad: squad.length, cov, teamPhotos });
  console.log(`${slug.padEnd(22)} jugadores ${String(withPhoto).padStart(2)}/${String(squad.length).padStart(2)} (${cov}%)  equipo ${teamPhotos}${wc.image_pool ? "  ⚠ image_pool viejo" : ""}`);
}

console.log(`\nTOTAL · ${slugs.length} selecciones`);
console.log(`  jugadores con foto: ${totWithPhoto}/${totPlayers} (${Math.round((totWithPhoto / totPlayers) * 100)}%)`);
console.log(`  fotos de equipo:    ${totTeamPhotos}`);
if (withOldPool) console.log(`  ⚠ fichas con image_pool viejo aún: ${withOldPool}`);
if (weak.length) {
  console.log(`\nDébiles (equipo<4 o cobertura<50%):`);
  for (const w of weak) console.log(`  ${w.slug.padEnd(22)} ${w.cov}% jugadores · ${w.teamPhotos} equipo`);
}
