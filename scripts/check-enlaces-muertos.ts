// Busca enlaces internos que lleven a un 404: href="/loquesea" apuntando a una
// ruta que ya no existe en src/app.
//
// POR QUÉ EXISTE
// El pivote del Mundial a Ligas ha ido retirando rutas. Cada ruta retirada deja
// atrás enlaces en menús, footers, tarjetas y emails que nadie vuelve a mirar.
// Un enlace muerto no rompe el build ni el typecheck: solo manda al usuario a
// un 404, y eso solo se descubre haciendo clic.
//
// Uso: npx tsx scripts/check-enlaces-muertos.ts

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const RAIZ = join(__dirname, "..");
const SRC = join(RAIZ, "src");
const APP = join(SRC, "app");

/* ── 1. Qué rutas EXISTEN de verdad ─────────────────────────────────────── */

type Ruta = { patron: string; dinamica: boolean };

function recogerRutas(dir: string, prefijo = ""): Ruta[] {
  const out: Ruta[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (!statSync(ruta).isDirectory()) {
      // page.tsx / route.ts marcan que el prefijo actual es servible.
      if (/^(page|route)\.(tsx?|jsx?)$/.test(entrada)) {
        out.push({ patron: prefijo || "/", dinamica: prefijo.includes("[") });
      }
      continue;
    }
    // Carpetas privadas (_algo) y de test no generan ruta.
    if (entrada.startsWith("_") || entrada.startsWith(".")) continue;
    // Route groups (algo) no aparecen en la URL.
    const segmento = /^\(.+\)$/.test(entrada) ? "" : `/${entrada}`;
    out.push(...recogerRutas(ruta, prefijo + segmento));
  }
  return out;
}

const RUTAS = recogerRutas(APP);
const ESTATICAS = new Set(RUTAS.filter((r) => !r.dinamica).map((r) => r.patron));
const DINAMICAS = RUTAS.filter((r) => r.dinamica).map((r) =>
  // /ligas/[slug]/fantasy -> ^/ligas/[^/]+/fantasy$   ([...x] traga varios)
  new RegExp(
    "^" +
      r.patron
        .replace(/\[\.\.\..+?\]/g, ".+")
        .replace(/\[.+?\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$",
  ),
);

/* ── 2. Redirects declarados en next.config.js ──────────────────────────── */

const REDIRECTS = new Set<string>();
const REDIRECTS_COMODIN: RegExp[] = [];
const configPath = ["next.config.js", "next.config.mjs", "next.config.ts"]
  .map((f) => join(RAIZ, f))
  .find((p) => existsSync(p));

// Solo valen los `source:` de redirects() y rewrites(). Los de headers() NO:
// ahí vive la regla `/(.*)` de las cabeceras de seguridad, que casa con todo y
// daría por buena cualquier URL inventada (la autoprueba de abajo pilló justo
// esto cuando el script leía el fichero entero).
function bloquesDeRedireccion(cfg: string): string {
  let out = "";
  for (const nombre of ["redirects", "rewrites"]) {
    const re = new RegExp(`async\\s+${nombre}\\s*\\(`);
    const m = re.exec(cfg);
    if (!m) continue;
    let i = cfg.indexOf("{", m.index + m[0].length);
    if (i < 0) continue;
    let d = 1;
    const ini = i;
    i++;
    while (i < cfg.length && d > 0) {
      if (cfg[i] === "{") d++;
      else if (cfg[i] === "}") d--;
      i++;
    }
    out += cfg.slice(ini, i) + "\n";
  }
  return out;
}

if (configPath) {
  const cfg = bloquesDeRedireccion(readFileSync(configPath, "utf8"));
  for (const m of cfg.matchAll(/source:\s*["'`]([^"'`]+)["'`]/g)) {
    const s = m[1];
    if (s.includes(":") || s.includes("*")) {
      REDIRECTS_COMODIN.push(
        new RegExp("^" + s.replace(/:[^/]+\*/g, ".+").replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/") + "$"),
      );
    } else {
      REDIRECTS.add(s);
    }
  }
}

/* ── 3. Qué enlaces se usan ─────────────────────────────────────────────── */

function ficheros(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === "node_modules" || e.startsWith(".")) continue;
      ficheros(p, acc);
    } else if (/\.(tsx?|jsx?)$/.test(e)) {
      acc.push(p);
    }
  }
  return acc;
}

// href="/x", href={"/x"}, href={`/x`}, router.push("/x"), redirect("/x")
const PATRONES = [
  /href=["'](\/[^"'{}\s]*)["']/g,
  /href=\{["'`](\/[^"'`${}\s]*)["'`]\}/g,
  /(?:router\.(?:push|replace)|redirect|permanentRedirect)\(\s*["'`](\/[^"'`${}\s]*)["'`]/g,
];

type Uso = { url: string; fichero: string; linea: number };
const usos: Uso[] = [];

for (const f of ficheros(SRC)) {
  const texto = readFileSync(f, "utf8");
  const lineas = texto.split(/\r?\n/);
  lineas.forEach((linea, i) => {
    for (const patron of PATRONES) {
      patron.lastIndex = 0;
      for (const m of linea.matchAll(patron)) {
        usos.push({ url: m[1], fichero: relative(RAIZ, f).split(sep).join("/"), linea: i + 1 });
      }
    }
  });
}

/* ── 4. Cruzar ──────────────────────────────────────────────────────────── */

// Ficheros servidos tal cual desde /public (imágenes, iconos, robots...).
const PUBLIC = join(RAIZ, "public");

function existeEnPublic(url: string): boolean {
  const limpio = url.split("?")[0].split("#")[0];
  return existsSync(join(PUBLIC, limpio));
}

function resuelve(url: string): boolean {
  const limpio = url.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  if (ESTATICAS.has(limpio)) return true;
  if (DINAMICAS.some((re) => re.test(limpio))) return true;
  if (REDIRECTS.has(limpio) || REDIRECTS_COMODIN.some((re) => re.test(limpio))) return true;
  if (existeEnPublic(limpio)) return true;
  return false;
}

// AUTOPRUEBA. Un "ningún enlace roto" solo vale si el detector sabe decir que
// no: si el resolutor se rompiera (por un cambio en la estructura de src/app,
// por ejemplo), daría todo por bueno y este check pasaría a ser decorativo.
{
  const debeFallar = "/esta-ruta-no-existe-jamas-zzz9";
  const debePasar = "/ligas";
  if (resuelve(debeFallar)) {
    console.error(`Autoprueba KO: "${debeFallar}" se da por válida. El resolutor no discrimina.`);
    process.exit(2);
  }
  if (!resuelve(debePasar)) {
    console.error(`Autoprueba KO: "${debePasar}" se da por rota. El resolutor no ve las rutas reales.`);
    process.exit(2);
  }
}

const rotos = new Map<string, Uso[]>();
for (const uso of usos) {
  if (uso.url.startsWith("//")) continue; // protocol-relative, es externo
  if (!resuelve(uso.url)) {
    const lista = rotos.get(uso.url) ?? [];
    lista.push(uso);
    rotos.set(uso.url, lista);
  }
}

/* ── 5. Informe ─────────────────────────────────────────────────────────── */

console.log(`Rutas servibles: ${ESTATICAS.size} estáticas + ${DINAMICAS.length} dinámicas`);
console.log(`Redirects en config: ${REDIRECTS.size} exactos + ${REDIRECTS_COMODIN.length} con comodín`);
console.log(`Enlaces internos encontrados: ${usos.length}`);
console.log("");

if (rotos.size === 0) {
  console.log("Ningún enlace interno roto.");
  process.exit(0);
}

const orden = [...rotos.entries()].sort((a, b) => b[1].length - a[1].length);
console.log(`${rotos.size} destino(s) sin ruta ni redirect:`);
console.log("");
for (const [url, lista] of orden) {
  console.log(`  ${url}   (${lista.length} enlace${lista.length > 1 ? "s" : ""})`);
  for (const u of lista.slice(0, 6)) {
    console.log(`      ${u.fichero}:${u.linea}`);
  }
  if (lista.length > 6) console.log(`      … y ${lista.length - 6} más`);
}
console.log("");
console.log("Revisa uno a uno: puede haber falsos positivos (rutas generadas,");
console.log("rewrites en middleware). Confirma antes de tocar nada.");
