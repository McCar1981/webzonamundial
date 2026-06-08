const fs = require("fs");
const path = require("path");

const ROOT = "src/app/historia";
// Files with trailing helper components; main export is the ONLY one that
// returns a fragment, so "\n    </>\n  );" is unique per file.
const slugs = [
  "2026","confederaciones","premios","trofeos","comparar-jugadores",
  "sedes-2026","comparar","visualizaciones",
];

const IMPORT = 'import EditorialBlock from "@/components/historia/EditorialBlock";';
const ANCHOR = "\n    </>\n  );";

let ok = 0;
const problems = [];

for (const slug of slugs) {
  const file = path.join(ROOT, slug, "page.tsx");
  let src = fs.readFileSync(file, "utf8");

  if (src.includes("EditorialBlock")) { problems.push(`${slug}: already wired`); continue; }

  // import after last top-level import line
  const lines = src.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
    if (/^export\s/.test(lines[i])) break;
  }
  if (lastImport === -1) { problems.push(`${slug}: no import`); continue; }
  lines.splice(lastImport + 1, 0, IMPORT);
  src = lines.join("\n");

  // unique anchor check
  const count = src.split(ANCHOR).length - 1;
  if (count !== 1) { problems.push(`${slug}: anchor count=${count} (expected 1)`); continue; }

  src = src.replace(ANCHOR, `\n      <EditorialBlock slug="${slug}" />\n    </>\n  );`);
  fs.writeFileSync(file, src, "utf8");
  ok++;
}

console.log(`Wired OK: ${ok}/${slugs.length}`);
if (problems.length) console.log("ISSUES:\n  " + problems.join("\n  "));
