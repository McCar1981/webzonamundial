// Comprueba que los arrays de ICONOS declarados en un .tsx y los arrays de i18n
// con los que se emparejan POR ÍNDICE tienen la misma longitud en los dos idiomas.
//
// POR QUÉ EXISTE
// Este desajuste tumbó la home 8 días con un HTTP 500: el i18n tenía 12 entradas
// y el meta del .tsx 10, así que `meta[i].color` reventó el render. Ni tsc ni el
// build de Vercel lo detectan — es un fallo de RENDER, y el build compila igual.
//
// QUÉ VIGILA EXACTAMENTE
// Solo los sitios donde el valor indexado se usa como COMPONENTE (`<Icon />`)
// SIN guarda. Ahí un undefined lanza "Element type is invalid" y se lleva por
// delante la página entera, no solo la sección.
//
// NO vigila:
//   - `{ICONS[i]}` renderizado como hijo: React ignora undefined, no rompe.
//   - `ICONS[i] || ICONS[0]` y `ARR[i]?.prop`: ya llevan guarda.
//   - ModulesGridSection: ya filtra con `.filter((_, i) => meta[i])`.
//
// Uso: npx tsx scripts/check-pareo-indices.ts   (sale 1 si hay desajuste)

import { homeSections } from "../src/i18n/home-sections";

type Caso = {
  descripcion: string;
  fichero: string;
  /** Nº de elementos del array de iconos declarado en el .tsx. */
  iconos: number;
  /** El array de i18n sobre el que se hace .map(). */
  ruta: (s: any) => unknown[] | undefined;
};

const CASOS: Caso[] = [
  {
    descripcion: "StatsHowSection · STEP_ICONS ↔ statsHow.steps",
    fichero: "src/app/_home/sections/StatsHowSection.tsx:204",
    iconos: 3,
    ruta: (s) => s.statsHow?.steps,
  },
  {
    descripcion: "WaitlistSection · BENEFIT_ICONS ↔ waitlist.benefits",
    fichero: "src/app/_home/sections/WaitlistSection.tsx:290",
    iconos: 3,
    ruta: (s) => s.waitlist?.benefits,
  },
  {
    descripcion: "AlbumDominaSection · BENEFIT_ICONS ↔ album.benefits",
    fichero: "src/app/_home/sections/AlbumDominaSection.tsx:169",
    iconos: 3,
    ruta: (s) => s.album?.benefits,
  },
];

const LOCALES = ["es", "en"] as const;

let fallos = 0;

for (const caso of CASOS) {
  const largos = LOCALES.map((locale) => {
    const seccion = (homeSections as any)[locale];
    const arr = seccion ? caso.ruta(seccion) : undefined;
    return { locale, n: Array.isArray(arr) ? arr.length : null };
  });

  // Si el array desapareció, el caso se quedó obsoleto: eso también hay que
  // saberlo, porque significa que este check dejó de vigilar ese sitio.
  const perdidos = largos.filter((l) => l.n === null);
  if (perdidos.length === LOCALES.length) {
    console.log(`  X  ${caso.descripcion}`);
    console.log(`     ${caso.fichero}`);
    console.log(`     el array de i18n ya no existe — este check dejó de vigilar el sitio`);
    fallos++;
    continue;
  }

  // El peligro es que el array MAPEADO (i18n) sea MÁS LARGO que el de iconos:
  // los índices sobrantes leen undefined y `<Icon />` revienta. Que sobren
  // iconos es inofensivo (quedan sin usar), pero lo avisamos como ruido.
  const excesos = largos.filter((l) => l.n !== null && l.n > caso.iconos);
  const sobrantes = largos.filter((l) => l.n !== null && l.n < caso.iconos);

  if (excesos.length > 0) {
    console.log(`  X  ${caso.descripcion}`);
    console.log(`     ${caso.fichero}`);
    console.log(
      `     iconos = ${caso.iconos} · ${largos.map((l) => `${l.locale} = ${l.n}`).join(" · ")}`,
    );
    console.log(`     -> índice(s) sin icono: <Icon /> será undefined y tumbará la PÁGINA`);
    fallos++;
  } else if (sobrantes.length > 0) {
    console.log(`  ~  ${caso.descripcion}`);
    console.log(
      `     iconos = ${caso.iconos} · ${largos.map((l) => `${l.locale} = ${l.n}`).join(" · ")} — sobran iconos sin usar (inofensivo)`,
    );
  } else {
    console.log(`  ok ${caso.descripcion}  (${caso.iconos})`);
  }
}

console.log("");
if (fallos > 0) {
  console.log(`${fallos} desajuste(s). Esto tumba la página entera, no solo la sección.`);
  process.exit(1);
}
console.log("Todos los pareos por índice cuadran en es y en.");
