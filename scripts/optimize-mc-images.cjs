// Optimiza los PNG de Modo Carrera: redimensiona por categoría y recomprime con
// paleta + dithering (evita banding). Sustituye solo si reduce tamaño. Idempotente.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const root = "public/img/modo-carrera";

// Máximo lado largo (px) por categoría, deducido por ruta/nombre.
function maxDim(rel) {
  const p = rel.split(path.sep).join("/");
  if (p.includes("icons/badges/")) return 256; // se ven a 64px
  if (p.includes("icons/")) return 512; // iconos pequeños
  if (p.includes("coach/")) return 800; // retrato (spec 600x800)
  if (/(onboarding|hub-bg|prensa-bg|prensa-podio|vitrina)/.test(p)) return 1600; // fondos
  if (p.includes("periodico-texture")) return 1280; // textura
  if (/(card-texture|card-back)/.test(p)) return 900; // carta
  if (/trofeos\/trofeo/.test(p)) return 900; // trofeos recortados
  return 1200;
}

function walk(d) {
  let r = [];
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    const s = fs.statSync(fp);
    if (s.isDirectory()) r = r.concat(walk(fp));
    else if (/\.png$/i.test(f)) r.push(fp);
  }
  return r;
}

(async () => {
  const files = walk(root);
  let before = 0;
  let after = 0;
  for (const f of files) {
    const rel = path.relative(root, f);
    const sz0 = fs.statSync(f).size;
    const m = await sharp(f).metadata();
    const cap = maxDim(rel);
    const long = Math.max(m.width, m.height);
    let pipe = sharp(f);
    if (long > cap) {
      pipe = pipe.resize({
        width: m.width >= m.height ? cap : null,
        height: m.height > m.width ? cap : null,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    const buf = await pipe
      .png({ palette: true, quality: 85, dither: 1, effort: 10, compressionLevel: 9 })
      .toBuffer();
    if (buf.length < sz0) fs.writeFileSync(f, buf);
    const sz1 = fs.statSync(f).size;
    before += sz0;
    after += sz1;
    const pct = ((1 - sz1 / sz0) * 100).toFixed(0);
    console.log(`${(sz0 / 1024).toFixed(0).padStart(5)}KB -> ${(sz1 / 1024).toFixed(0).padStart(5)}KB (-${pct}%)  ${rel}`);
  }
  console.log("------------------------------------------");
  console.log(`TOTAL: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB  (-${((1 - after / before) * 100).toFixed(0)}%)`);
})();
