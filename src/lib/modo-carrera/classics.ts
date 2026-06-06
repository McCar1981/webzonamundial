// src/lib/modo-carrera/classics.ts
//
// CLÁSICOS DEL FÚTBOL. Reorienta las rivalidades del Modo Carrera hacia los
// duelos históricos de selecciones (Brasil-Alemania, Argentina-Portugal, etc.).
// Cuando el partido del calendario coincide con uno de estos cruces, la UI lo
// presenta con marco de "Clásico" y un titular épico, subiendo la tensión.
//
// Lógica pura: solo compara los slugs de las dos selecciones (sin orden).

/** Par de slugs + etiqueta del clásico (la etiqueta es independiente del orden). */
interface Classic {
  a: string;
  b: string;
  label: string;
}

const CLASSICS: Classic[] = [
  { a: "brasil", b: "argentina", label: "El Superclásico de las Américas" },
  { a: "brasil", b: "alemania", label: "Revancha del 7-1" },
  { a: "argentina", b: "alemania", label: "El clásico de las finales" },
  { a: "argentina", b: "inglaterra", label: "La rivalidad eterna" },
  { a: "argentina", b: "portugal", label: "Messi contra el legado" },
  { a: "espana", b: "portugal", label: "El Clásico Ibérico" },
  { a: "espana", b: "argentina", label: "Madre Patria contra la Albiceleste" },
  { a: "francia", b: "alemania", label: "El duelo de Europa" },
  { a: "francia", b: "brasil", label: "El clásico mundialista" },
  { a: "francia", b: "argentina", label: "La final de Qatar" },
  { a: "inglaterra", b: "alemania", label: "La gran rivalidad europea" },
  { a: "paises-bajos", b: "alemania", label: "El clásico de los Países Bajos" },
  { a: "paises-bajos", b: "espana", label: "Revancha de la final 2010" },
  { a: "uruguay", b: "brasil", label: "El Maracanazo" },
  { a: "uruguay", b: "argentina", label: "El Clásico del Río de la Plata" },
  { a: "portugal", b: "francia", label: "Duelo de campeones de Europa" },
  { a: "croacia", b: "francia", label: "Revancha de la final 2018" },
  { a: "colombia", b: "argentina", label: "El clásico sudamericano" },
  { a: "mexico", b: "estados-unidos", label: "El Clásico de la CONCACAF" },
];

/** Etiqueta del clásico entre dos selecciones (sin importar el orden), o null. */
export function classicLabel(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a || !b) return null;
  const c = CLASSICS.find(
    (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a),
  );
  return c ? c.label : null;
}

/** ¿Este cruce es un clásico histórico? */
export function isClassic(a: string | null | undefined, b: string | null | undefined): boolean {
  return classicLabel(a, b) !== null;
}
