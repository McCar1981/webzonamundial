// scripts/prune-images.cjs
//
// Quita de las fichas BIBLIA las imágenes que Carlos marcó como descarte en el
// visor (scripts/build-image-review.cjs → "Exportar descartes"). Elimina las URLs
// indicadas tanto de wc_2026.image_pool[] como de Player.photos[].
//
// Uso:
//   1) Pega el JSON exportado por el visor en scripts/discards.json
//      Formato: { "belgica": ["url1","url2"], "argentina": ["..."] }
//   2) Revisar (no escribe):
//        node scripts/prune-images.cjs --from=scripts/discards.json
//   3) Aplicar:
//        node scripts/prune-images.cjs --from=scripts/discards.json --apply

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n, d) => {
  const h = args.find((a) => a.startsWith(`--${n}=`));
  return h ? h.split("=")[1] : d;
};

const APPLY = flag("apply");
const FROM = val("from", "scripts/discards.json");
const TEAMS_DIR = "data/teams";

if (!fs.existsSync(FROM)) {
  console.error(`No existe ${FROM}. Exporta los descartes desde el visor y guárdalos ahí.`);
  process.exit(1);
}

const discards = JSON.parse(fs.readFileSync(FROM, "utf8"));
const slugs = Object.keys(discards);
if (slugs.length === 0) {
  console.log("No hay descartes en el archivo. Nada que hacer.");
  process.exit(0);
}

console.log(`Prune · ${slugs.length} país(es) · ${APPLY ? "APPLY (escribe)" : "DRY-RUN"}`);

let removedTotal = 0;
for (const slug of slugs) {
  const file = path.join(TEAMS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`  ! ${slug}: ficha no encontrada, salto`);
    continue;
  }
  const drop = new Set(discards[slug] || []);
  if (drop.size === 0) continue;
  const t = JSON.parse(fs.readFileSync(file, "utf8"));
  const wc = t.wc_2026 || {};
  let removed = 0;

  if (Array.isArray(wc.image_pool)) {
    const before = wc.image_pool.length;
    wc.image_pool = wc.image_pool.filter((u) => !drop.has(u));
    removed += before - wc.image_pool.length;
  }
  for (const p of wc.likely_squad || []) {
    if (Array.isArray(p.photos)) {
      const before = p.photos.length;
      p.photos = p.photos.filter((u) => !drop.has(u));
      removed += before - p.photos.length;
    }
  }

  removedTotal += removed;
  console.log(`  ${slug}: -${removed} imagen(es)`);
  if (APPLY && removed > 0) {
    fs.writeFileSync(file, JSON.stringify(t, null, 2) + "\n", "utf8");
  }
}

console.log(
  `\nTotal: ${removedTotal} imagen(es) ${APPLY ? "eliminadas" : "a eliminar"}` +
    (APPLY ? "" : "\n(dry-run: revisa y vuelve a ejecutar con --apply)"),
);
