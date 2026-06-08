const fs = require("fs");
const path = require("path");

const ROOT = "src/app/historia";
const slugs = [
  "campeones","eras","goles","records","curiosidades","polemicas","momentos",
  "partidos-legendarios","hat-tricks","notables","sociopolitica","jugadores",
  "entrenadores","arbitros","best-xi","estadios","mascotas","balones",
  "camisetas","economia","cancelados","buscar","quiz","selecciones","goleadores",
  "2026","confederaciones","premios","trofeos","comparar-jugadores",
  "sedes-2026","comparar","visualizaciones",
];

const LINE = 'import EditorialBlock from "@/components/historia/EditorialBlock";';

let ok = 0;
const problems = [];

for (const slug of slugs) {
  const file = path.join(ROOT, slug, "page.tsx");
  let lines = fs.readFileSync(file, "utf8").split("\n");

  // 1) remove the (possibly misplaced) import line wherever it is.
  lines = lines.filter((l) => l.trim() !== LINE.trim());

  // 2) insert it immediately BEFORE the first top-level import statement.
  let firstImport = lines.findIndex((l) => /^import\s/.test(l));
  if (firstImport === -1) { problems.push(`${slug}: no import found`); continue; }
  lines.splice(firstImport, 0, LINE);

  fs.writeFileSync(file, lines.join("\n"), "utf8");
  ok++;
}

console.log(`Fixed: ${ok}/${slugs.length}`);
if (problems.length) console.log("ISSUES:\n  " + problems.join("\n  "));
