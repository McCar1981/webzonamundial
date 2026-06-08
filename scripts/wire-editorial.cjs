const fs = require("fs");
const path = require("path");

const ROOT = "src/app/historia";
const slugs = [
  "campeones","eras","goles","records","curiosidades","polemicas","momentos",
  "partidos-legendarios","hat-tricks","notables","sociopolitica","jugadores",
  "entrenadores","arbitros","best-xi","estadios","mascotas","balones",
  "camisetas","economia","cancelados","buscar","quiz","selecciones","goleadores",
];

const IMPORT = 'import EditorialBlock from "@/components/historia/EditorialBlock";';

let ok = 0;
const problems = [];

for (const slug of slugs) {
  const file = path.join(ROOT, slug, "page.tsx");
  let src = fs.readFileSync(file, "utf8");

  if (src.includes("EditorialBlock")) {
    problems.push(`${slug}: already wired, skipped`);
    continue;
  }

  // 1) Insert import after the last top-level import line.
  const lines = src.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
    if (/^export\s/.test(lines[i])) break;
  }
  if (lastImport === -1) { problems.push(`${slug}: no import line found`); continue; }
  lines.splice(lastImport + 1, 0, IMPORT);
  src = lines.join("\n");

  // 2) Insert component before the LAST </> (root fragment close of the export).
  const idx = src.lastIndexOf("</>");
  if (idx === -1) { problems.push(`${slug}: no </> found`); continue; }
  // Guard: after the last </> only ");" and "}" remain (it is the return root).
  const tail = src.slice(idx + 3).replace(/\s/g, "");
  if (tail !== ");}" && tail !== ");};") {
    problems.push(`${slug}: tail after </> is "${tail}" (not return root) — skipped`);
    continue;
  }
  src = src.slice(0, idx) + `  <EditorialBlock slug="${slug}" />\n    ` + src.slice(idx);

  fs.writeFileSync(file, src, "utf8");
  ok++;
}

console.log(`Wired OK: ${ok}/${slugs.length}`);
if (problems.length) console.log("ISSUES:\n  " + problems.join("\n  "));
