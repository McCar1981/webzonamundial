/**
 * convert-png-to-webp.mjs
 * Convierte PNGs decorativos de /public a WebP y (opcionalmente) reescribe las
 * referencias en el código de .png -> .webp.
 *
 * EXCLUYE:
 *   - public/icons/**      (iconos PWA + favicons: el manifest exige PNG)
 *   - public/img/email/**  (clientes de correo no soportan WebP de forma fiable)
 *
 * Uso:
 *   node scripts/convert-png-to-webp.mjs              # solo convierte + reporte (no toca código)
 *   node scripts/convert-png-to-webp.mjs --rewrite    # además reescribe refs .png->.webp en src/ y content/
 *   node scripts/convert-png-to-webp.mjs --delete     # además borra los PNG ya convertidos
 *
 * Flags combinables. La conversión NO borra el original salvo --delete.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const EXCLUDE_DIRS = [
  path.join(PUBLIC, "icons"),
  path.join(PUBLIC, "img", "email"),
];

const REWRITE = process.argv.includes("--rewrite");
const DELETE = process.argv.includes("--delete");
const QUALITY = 85;

function isExcluded(file) {
  return EXCLUDE_DIRS.some((d) => file.startsWith(d + path.sep));
}

async function walk(dir, acc = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, acc);
    else if (entry.isFile() && /\.png$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

function fmt(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

async function main() {
  const all = (await walk(PUBLIC)).filter((f) => !isExcluded(f));
  console.log(`PNGs candidatos (excluyendo icons/ y img/email/): ${all.length}\n`);

  let beforeTotal = 0;
  let afterTotal = 0;
  const converted = [];

  for (const png of all) {
    const webp = png.replace(/\.png$/i, ".webp");
    const srcStat = await fs.stat(png);
    beforeTotal += srcStat.size;

    await sharp(png).webp({ quality: QUALITY, effort: 5 }).toFile(webp);

    const outStat = await fs.stat(webp);
    afterTotal += outStat.size;
    converted.push({ png, webp });

    const rel = path.relative(PUBLIC, png);
    const pct = (100 * (1 - outStat.size / srcStat.size)).toFixed(0);
    console.log(`  ${rel}  ${fmt(srcStat.size)} -> ${fmt(outStat.size)}  (-${pct}%)`);
  }

  console.log(`\n=== TOTAL ===`);
  console.log(`Antes (PNG):  ${fmt(beforeTotal)}`);
  console.log(`Después(WebP):${fmt(afterTotal)}`);
  console.log(`Ahorro:       ${fmt(beforeTotal - afterTotal)} (-${(100 * (1 - afterTotal / beforeTotal)).toFixed(0)}%)`);

  if (REWRITE) {
    console.log(`\n=== Reescribiendo referencias .png -> .webp ===`);
    const webExts = [".tsx", ".ts", ".jsx", ".js", ".css", ".json", ".md", ".mdx"];
    const codeDirs = [path.join(ROOT, "src"), path.join(ROOT, "content")];
    const webPaths = converted.map(({ png }) => "/" + path.relative(PUBLIC, png).split(path.sep).join("/"));

    const codeFiles = [];
    for (const d of codeDirs) {
      try {
        await walkCode(d, webExts, codeFiles);
      } catch {}
    }

    let edits = 0;
    for (const file of codeFiles) {
      let content = await fs.readFile(file, "utf8");
      let changed = false;
      for (const wp of webPaths) {
        if (content.includes(wp)) {
          content = content.split(wp).join(wp.replace(/\.png$/i, ".webp"));
          changed = true;
        }
      }
      if (changed) {
        await fs.writeFile(file, content);
        edits++;
        console.log(`  editado: ${path.relative(ROOT, file)}`);
      }
    }
    console.log(`Archivos de código editados: ${edits}`);
  }

  if (DELETE) {
    console.log(`\n=== Respaldo + retiro de PNG originales (solo NO referenciados) ===`);

    // 1) Reúne todo el texto de código para detectar referencias.
    const webExts = [".tsx", ".ts", ".jsx", ".js", ".css", ".json", ".md", ".mdx"];
    const codeDirs = [path.join(ROOT, "src"), path.join(ROOT, "content")];
    const codeFiles = [];
    for (const d of codeDirs) {
      try {
        await walkCode(d, webExts, codeFiles);
      } catch {}
    }
    let allCode = "";
    for (const f of codeFiles) allCode += "\n" + (await fs.readFile(f, "utf8"));

    // 2) Prefijos de directorio usados en rutas DINÁMICAS (`...${x}....png`).
    //    Protege cualquier PNG bajo esos prefijos (no podemos garantizar que
    //    todas las variantes tengan webp / hay lógica de fallback).
    const dynPrefixes = new Set();
    const dynRe = /["'`]([^"'`]*?\/)[^"'`/]*\$\{[^"'`]*?\.png["'`]/g;
    let m;
    while ((m = dynRe.exec(allCode)) !== null) dynPrefixes.add(m[1]);
    console.log("Prefijos dinámicos protegidos:", [...dynPrefixes].join(", ") || "(ninguno)");

    const BACKUP = path.join(ROOT, "_png-backup");
    let movedCount = 0;
    let movedBytes = 0;
    let protectedCount = 0;

    for (const { png } of converted) {
      const webPath = "/" + path.relative(PUBLIC, png).split(path.sep).join("/");
      const referencedStatic = allCode.includes(webPath); // aún citado como .png
      const referencedDynamic = [...dynPrefixes].some((p) => webPath.startsWith(p));
      if (referencedStatic || referencedDynamic) {
        protectedCount++;
        continue;
      }
      // Mover a backup preservando estructura.
      const dest = path.join(BACKUP, path.relative(PUBLIC, png));
      await fs.mkdir(path.dirname(dest), { recursive: true });
      const st = await fs.stat(png);
      await fs.rename(png, dest);
      movedBytes += st.size;
      movedCount++;
    }

    console.log(`Respaldados+retirados de public/: ${movedCount}  (${fmt(movedBytes)})`);
    console.log(`Protegidos (referenciados/dinámicos, siguen en public/): ${protectedCount}`);
    console.log(`Backup en: ${path.relative(ROOT, BACKUP)}/  (recuperable, gitignored)`);
  }
}

async function walkCode(dir, exts, acc) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkCode(full, exts, acc);
    else if (exts.includes(path.extname(entry.name).toLowerCase())) acc.push(full);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
