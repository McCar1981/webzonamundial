// Genera el pack de 150 prompts de cromos (nano banana / Gemini) inspirados en
// los 72 partidos de FASE DE GRUPOS del Mundial 2026.
//
// Fuente de verdad del calendario: src/data/matches.ts
// Colores nacionales reales: data/teams/*.json (flag.colors)
//
// Reglas duras (decididas con el usuario):
//  - Sistema de rarezas: Legendario / Oro / Plata.
//  - Cobertura: 1 cromo por cada uno de los 72 partidos + extras temáticos,
//    con los partidos más atractivos pesando más (edición especial).
//  - Jugadores ANÓNIMOS: sin rostro reconocible, camiseta de color nacional
//    SIN logos. NUNCA escudos de federación (no hay derechos).
//
// Uso: node scripts/generate-cromos-prompts.mjs
// Salida: PROMPTS_CROMOS_FASE_GRUPOS.md (raíz del repo)

import { readFileSync, writeFileSync, readdirSync } from "node:fs";

// ── 1. Cargar partidos de fase de grupos desde matches.ts ────────────────────
const raw = readFileSync("src/data/matches.ts", "utf8");
const objs = raw.match(/\{\s*"i":[\s\S]*?\}/g) || [];
const ALL = objs.map((o) => JSON.parse(o));
const MATCHES = ALL.filter((m) => m.p === "Fase de grupos"); // 72

// ── 2. Mapa iso2 -> colores nacionales (data/teams/*.json) ───────────────────
const COLORS = {};
for (const f of readdirSync("data/teams").filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(readFileSync("data/teams/" + f, "utf8"));
  const c = (j.flag && j.flag.colors) || {};
  COLORS[j.iso] = {
    name: j.name_es,
    primary: c.primary || "#888888",
    secondary: c.secondary || "#FFFFFF",
    tertiary: c.tertiary || c.secondary || "#222222",
  };
}
const col = (iso) => COLORS[iso] || { name: iso, primary: "#888888", secondary: "#FFFFFF", tertiary: "#222222" };
const paleta = (iso) => {
  const c = col(iso);
  return `${c.primary} y ${c.secondary}${c.tertiary && c.tertiary !== c.secondary ? " con detalles " + c.tertiary : ""}`;
};

// ── 3. Tiers de selección + bonus de partido (atractivo) ─────────────────────
const TIER = {
  // gigantes (5)
  br: 5, ar: 5, fr: 5, es: 5, de: 5, "gb-eng": 5, pt: 5, nl: 5,
  // fuertes (4)
  be: 4, hr: 4, uy: 4, ma: 4, co: 4, jp: 4, sn: 4, ch: 4, kr: 4, us: 4, mx: 4,
  // medios (3)
  ec: 3, eg: 3, no: 3, at: 3, dz: 3, za: 3, "gb-sct": 3, ir: 3, au: 3, tr: 3,
  se: 3, ca: 3, qa: 3, sa: 3, tn: 3, py: 3, pa: 3, gh: 3, ci: 3, cd: 3,
  // modestos (2)
  cz: 2, ba: 2, iq: 2, uz: 2, jo: 2, nz: 2, ht: 2, cv: 2, cw: 2,
};
const tier = (iso) => TIER[iso] || 2;

// Bonus por id de partido (inaugural, clásicos, revanchas, anfitrión)
const BONUS = {
  1: 6,   // México–Sudáfrica · INAUGURAL
  7: 3,   // Brasil–Marruecos · revancha cuartos 2022
  17: 3,  // Francia–Senegal · revancha 2002
  21: 3,  // Inglaterra–Croacia · revancha semifinal 2018
  19: 2,  // Argentina–Argelia · debut del campeón
  66: 2,  // Uruguay–España · clásico atlántico
  71: 2,  // Colombia–Portugal
  56: 1,  // Ecuador–Alemania
  49: 1,  // Escocia–Brasil
};
const HOSTS = new Set(["mx", "us", "ca"]);

function matchScore(m) {
  let s = tier(m.hf) + tier(m.af);
  s += BONUS[m.i] || 0;
  if (HOSTS.has(m.hf) || HOSTS.has(m.af)) s += 2; // morbo anfitrión
  return s;
}

// ── 4. Construir las 150 cartas ──────────────────────────────────────────────
const fmtDate = (d) => {
  const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const dt = new Date(d + "T12:00:00");
  const mes = d.split("-")[1] === "06" ? "jun" : "jul";
  return `${dias[dt.getDay()]} ${parseInt(d.split("-")[2])} ${mes}`;
};

// Escenas variadas (jugadores anónimos) para no repetir composición
const SCENES_PARTIDO = [
  "dos futbolistas anónimos saltan a disputar un balón aéreo, choque de hombros y camisetas al viento",
  "un delantero anónimo remata de volea con la pierna estirada, estela de movimiento y césped levantado",
  "un atacante anónimo encara y regatea a un defensa, polvo dorado y barrida de luz",
  "un portero anónimo vuela en estirada hacia la escuadra, balón congelado a milímetros de sus guantes",
  "dos jugadores anónimos corren a la par en plena carrera, tensión y zancada explosiva",
  "un mediocampista anónimo golpea el balón de larga distancia, ondas de impacto alrededor del pie",
  "un defensa anónimo despeja de cabeza saltando sobre un rival, gotas de sudor iluminadas",
  "un delantero anónimo celebra de rodillas con los brazos abiertos, confeti de luz cayendo",
];
const SCENES_ESPECIAL = [
  "héroe anónimo en pose épica de medio cuerpo, balón flotando, aura de partículas doradas y rayos de luz volumétrica",
  "instante decisivo: futbolista anónimo conectando el balón en el aire, explosión de energía dorada congelada",
  "dos capitanes anónimos enfrentados cara a cara antes del saque, atmósfera de duelo titánico bajo focos",
  "futbolista anónimo emergiendo entre humo y chispas doradas, silueta poderosa y heroica",
];

const RAR = {
  Legendario: { badge: "🔶", accent: "halo dorado intenso, partículas brillantes y acabado holográfico iridiscente", marco: "Marco ornamental de oro macizo muy recargado" },
  Oro: { badge: "🟡", accent: "brillo dorado cálido y reflejos foil suaves", marco: "Marco dorado #c9a84c estilo foil" },
  Plata: { badge: "⚪", accent: "brillo plateado frío #c0c8d4 con finos detalles dorados", marco: "Marco plateado con filo dorado" },
};
const COMMON_NEG =
  "SIN texto, SIN números, SIN letras ni tipografía, SIN logotipos, SIN escudos de federación, SIN marcas comerciales, SIN banderas con emblemas (solo campos de color), SIN rostros reconocibles, SIN marca de agua.";

function promptPartido(m, rar, idx, especial) {
  const h = col(m.hf), a = col(m.af);
  const scene = especial
    ? SCENES_ESPECIAL[idx % SCENES_ESPECIAL.length]
    : SCENES_PARTIDO[idx % SCENES_PARTIDO.length];
  const r = RAR[rar];
  const tipo = especial ? "EDICIÓN ESPECIAL" : "edición " + rar;
  return (
    `Cromo coleccionable de fútbol premium en formato retrato vertical (relación 5:7), ${tipo}. ` +
    `Diseño dividido en diagonal: a la izquierda un campo de color con la paleta de ${h.name} (${paleta(m.hf)}), ` +
    `a la derecha un campo de color con la paleta de ${a.name} (${paleta(m.af)}). ` +
    `Escena central dinámica: ${scene}; ` +
    `los futbolistas visten camisetas lisas de los colores nacionales, SIN ningún logo, escudo ni marca, y NO tienen rostro reconocible. ` +
    `Al fondo, silueta del estadio (${m.vn}, ${m.vc}) con focos encendidos y luz volumétrica. ` +
    `${r.marco} con ${r.accent}, esquinas con destellos. Fondo azul noche #060B14 con acentos dorados #c9a84c. ` +
    `Iluminación cinematográfica dramática, alto contraste, render 8K ultradetallado. ${COMMON_NEG}`
  );
}

function promptGrupo(g, teams, rar) {
  const lista = teams.map((iso) => `${col(iso).name} (${paleta(iso)})`).join("; ");
  const r = RAR[rar];
  return (
    `Cromo coleccionable de fútbol premium en formato retrato vertical (relación 5:7), edición ${rar}, portada de grupo. ` +
    `Composición tipo mosaico vertical de cuatro franjas con las paletas nacionales de las cuatro selecciones del grupo: ${lista}. ` +
    `En cada franja, una camiseta lisa flotante del color correspondiente SIN logo ni escudo y un balón de fútbol genérico. ` +
    `${r.marco} con ${r.accent}, fondo azul noche #060B14, partículas doradas, luz cenital dramática. ` +
    `Estética premium de álbum coleccionable, render 8K. ${COMMON_NEG}`
  );
}

function promptSede(v, rar) {
  const r = RAR[rar];
  return (
    `Cromo coleccionable de fútbol premium en formato retrato vertical (relación 5:7), edición ${rar}, carta de sede. ` +
    `Retrato cinematográfico del estadio ${v.name} en ${v.city}: arquitectura imponente del recinto al anochecer (hora azul), ` +
    `focos encendidos proyectando haces de luz volumétrica sobre el césped impecable, gradas llenas en bokeh dorado, niebla ligera y partículas en el aire. ` +
    `SIN jugadores en primer plano. ${r.marco} con ${r.accent}, fondo azul noche #060B14 con acentos dorados #c9a84c. ` +
    `Fotografía deportiva premium, gran profundidad de campo, alto contraste, 8K. ${COMMON_NEG}`
  );
}

// 4a. cartas base (72) + especiales (top 50)
const ranked = [...MATCHES].sort((x, y) => matchScore(y) - matchScore(x));
const top50 = new Set(ranked.slice(0, 50).map((m) => m.i));

const cards = [];
let sCount = 0;
MATCHES.forEach((m, i) => {
  cards.push({ kind: "partido", m, score: matchScore(m) });
});
ranked.slice(0, 50).forEach((m) => {
  cards.push({ kind: "especial", m, score: matchScore(m) + 3 });
});

// 4b. grupos (12)
const GROUPS = {};
for (const m of MATCHES) {
  GROUPS[m.g] = GROUPS[m.g] || new Set();
  GROUPS[m.g].add(m.hf); GROUPS[m.g].add(m.af);
}
const groupKeys = Object.keys(GROUPS).sort();
for (const g of groupKeys) {
  cards.push({ kind: "grupo", g, teams: [...GROUPS[g]], score: 8 });
}

// 4c. sedes (16 únicas de fase de grupos)
const VEN = new Map();
for (const m of MATCHES) if (!VEN.has(m.vn)) VEN.set(m.vn, { name: m.vn, city: m.vc });
const ICONIC = new Set(["Estadio Azteca", "MetLife Stadium", "SoFi Stadium", "AT&T Stadium"]);
for (const [, v] of VEN) cards.push({ kind: "sede", v, score: ICONIC.has(v.name) ? 7 : 4 });

// ── 5. Asignar rareza global (18 Legendario / 42 Oro / 90 Plata) ─────────────
if (cards.length !== 150) throw new Error("Se generaron " + cards.length + " cartas, no 150");
const order = [...cards].sort((a, b) => b.score - a.score);
order.forEach((c, idx) => {
  c.rarity = idx < 18 ? "Legendario" : idx < 60 ? "Oro" : "Plata";
});

// ── 6. Emitir markdown ───────────────────────────────────────────────────────
const counts = { Legendario: 0, Oro: 0, Plata: 0 };
cards.forEach((c) => counts[c.rarity]++);

let md = "";
md += "# 150 Cromos · Fase de Grupos Mundial 2026 — Pack de prompts (nano banana / Gemini)\n\n";
md += "Generado por `scripts/generate-cromos-prompts.mjs`. Fuente de partidos: `src/data/matches.ts`. ";
md += "Colores nacionales reales: `data/teams/*.json`.\n\n";
md += "## Cómo usar\n";
md += "1. Abre **Gemini** y activa **nano banana** (Gemini 2.5 Flash Image).\n";
md += "2. Pega el prompt de cada carta tal cual. Pide explícitamente **formato vertical 5:7** si la herramienta lo permite.\n";
md += "3. Reglas duras aplicadas a TODOS los prompts: jugadores **anónimos** (sin rostro), camisetas **sin logos**, **nunca escudos** de federación (no hay derechos), sin texto (el texto lo pone la web).\n\n";
md += "## Sistema de rarezas\n";
md += `- 🔶 **Legendario** — ${counts.Legendario} cartas (duelos top + ediciones especiales de los grandes).\n`;
md += `- 🟡 **Oro** — ${counts.Oro} cartas.\n`;
md += `- ⚪ **Plata** — ${counts.Plata} cartas.\n\n`;
md += "## Composición de la colección\n";
md += "- **72** Cromo de Partido (1 por cada partido de fase de grupos, J1·J2·J3).\n";
md += "- **50** Edición Especial (los 50 partidos más atractivos, segunda carta premium).\n";
md += "- **12** Carta de Grupo (A–L).\n";
md += "- **16** Carta de Sede (estadios que albergan partidos de grupos).\n\n";
md += "---\n\n";

// Índice de paleta por sección, numeración 001..150 en el orden de creación
const pad = (n) => String(n).padStart(3, "0");
let n = 0;
const section = (title) => { md += `\n## ${title}\n\n`; };

const byKind = (k) => cards.filter((c) => c.kind === k);

section("Serie 1 · Cromo de Partido (72)");
let pIdx = 0;
for (const c of byKind("partido")) {
  n++;
  const m = c.m, r = RAR[c.rarity];
  md += `### ${pad(n)} · ${r.badge} ${c.rarity} · Partido — Jornada ${m.j}\n`;
  md += `**${col(m.hf).name} vs ${col(m.af).name}** · ${m.vn}, ${m.vc} · ${fmtDate(m.d)}\n\n`;
  md += `> ${promptPartido(m, c.rarity, pIdx++, false)}\n\n`;
}

section("Serie 2 · Edición Especial (50 partidos más atractivos)");
let eIdx = 0;
for (const c of byKind("especial")) {
  n++;
  const m = c.m, r = RAR[c.rarity];
  md += `### ${pad(n)} · ${r.badge} ${c.rarity} · Edición Especial — Jornada ${m.j}\n`;
  md += `**${col(m.hf).name} vs ${col(m.af).name}** · ${m.vn}, ${m.vc} · ${fmtDate(m.d)}\n\n`;
  md += `> ${promptPartido(m, c.rarity, eIdx++, true)}\n\n`;
}

section("Serie 3 · Carta de Grupo (12)");
for (const c of byKind("grupo")) {
  n++;
  const r = RAR[c.rarity];
  md += `### ${pad(n)} · ${r.badge} ${c.rarity} · Grupo ${c.g}\n`;
  md += `**${c.teams.map((t) => col(t).name).join(" · ")}**\n\n`;
  md += `> ${promptGrupo(c.g, c.teams, c.rarity)}\n\n`;
}

section("Serie 4 · Carta de Sede (16)");
for (const c of byKind("sede")) {
  n++;
  const r = RAR[c.rarity];
  md += `### ${pad(n)} · ${r.badge} ${c.rarity} · Sede\n`;
  md += `**${c.v.name}** · ${c.v.city}\n\n`;
  md += `> ${promptSede(c.v, c.rarity)}\n\n`;
}

writeFileSync("PROMPTS_CROMOS_FASE_GRUPOS.md", md, "utf8");
console.log(`OK · ${n} cartas escritas en PROMPTS_CROMOS_FASE_GRUPOS.md`);
console.log(`Rarezas → Legendario ${counts.Legendario} · Oro ${counts.Oro} · Plata ${counts.Plata}`);
