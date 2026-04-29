import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const slug = process.argv[2];
if (!slug) {
  console.error("Uso: node scripts/fetch-photos.mjs <slug>");
  process.exit(1);
}

const json = JSON.parse(readFileSync(`data/teams/${slug}.json`, "utf-8"));
const squad = json.wc_2026?.likely_squad ?? [];

const ALIAS = {
  // Algunos jugadores tienen slug Wiki distinto al full_name. Listar aquí.
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
          wiki: data.content_urls?.desktop?.page,
        };
      }
    } catch {}
  }
  return null;
}

const results = [];
for (const p of squad) {
  process.stderr.write(`${p.full_name.padEnd(28)}`);
  const ph = await fetchPhoto(p.full_name);
  results.push({ id: p.id, full_name: p.full_name, ...ph });
  process.stderr.write(ph ? " ✓\n" : " ✗ NOT FOUND\n");
  await new Promise((r) => setTimeout(r, 200));
}

mkdirSync("scripts/output", { recursive: true });
const outPath = `scripts/output/${slug}-photos.json`;
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.error(`\n→ Guardado en ${outPath}`);
console.error(`Total: ${results.length} · Encontrados: ${results.filter(r => r.photo_url).length}`);
