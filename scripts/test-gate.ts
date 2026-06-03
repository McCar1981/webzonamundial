/**
 * Test DETERMINISTA del gate de publicación (shouldPublish).
 *
 * NO llama a ningún modelo ni a la red: alimenta veredictos del crítico
 * hechos a mano (como los que devolvería Claude) y comprueba que la REGLA
 * del proyecto decide bien. Esto valida la parte que controla qué se publica
 * —los umbrales— sin depender de ANTHROPIC_API_KEY ni de producción.
 *
 * Uso:
 *   npx tsx scripts/test-gate.ts
 */

import {
  shouldPublish,
  CRITIC_MIN_CRITICA,
  CRITIC_MIN_MEDIA,
  type CriticVerdict,
} from "../src/lib/noticias-critic";

type Case = {
  name: string;
  verdict: CriticVerdict | null;
  expected: boolean;
};

const v = (
  relevancia: number,
  originalidad_valor: number,
  profundidad: number,
  precision_factual: number,
  utilidad_lector: number,
  es_duplicado = false,
): CriticVerdict => ({
  relevancia,
  originalidad_valor,
  profundidad,
  precision_factual,
  utilidad_lector,
  es_duplicado,
  publicar: true, // el modelo "asesora" true; la regla del proyecto manda
  motivos: "",
});

const CASES: Case[] = [
  {
    name: "Previa de grupo con datos (densa, precisa)",
    verdict: v(5, 5, 5, 5, 5),
    expected: true,
  },
  {
    name: "Pieza solida en el limite (todo 4)",
    verdict: v(4, 4, 4, 4, 4),
    expected: true,
  },
  {
    name: "Refrito GNews (reformula titular, sin valor propio)",
    verdict: v(4, 2, 2, 5, 2),
    expected: false, // originalidad 2 < MIN_CRITICA
  },
  {
    name: "Relleno: criticas OK pero profundidad 1 hunde la media",
    verdict: v(4, 4, 1, 4, 4),
    expected: false, // media 3.4 < MIN_MEDIA
  },
  {
    name: "Datos sin respaldo en la fuente (precision baja)",
    verdict: v(5, 5, 5, 3, 5),
    expected: false, // precision_factual 3 < MIN_CRITICA (gate factual)
  },
  {
    name: "Off-topic / clickbait (relevancia baja)",
    verdict: v(2, 4, 4, 5, 4),
    expected: false, // relevancia 2 < MIN_CRITICA
  },
  {
    name: "Cae por duplicado aunque puntue alto",
    verdict: v(5, 5, 5, 5, 5, true),
    expected: false,
  },
  {
    name: "Sin veredicto del critico (null)",
    verdict: null,
    expected: false,
  },
];

function main() {
  console.log(
    `Umbrales activos → MIN_CRITICA=${CRITIC_MIN_CRITICA} (relevancia/originalidad/precision), MIN_MEDIA=${CRITIC_MIN_MEDIA}\n`,
  );
  let ok = 0;
  let fail = 0;
  for (const c of CASES) {
    const got = shouldPublish(c.verdict);
    const pass = got === c.expected;
    if (pass) ok += 1;
    else fail += 1;
    const dims = c.verdict
      ? `[${c.verdict.relevancia},${c.verdict.originalidad_valor},${c.verdict.profundidad},${c.verdict.precision_factual},${c.verdict.utilidad_lector}]${c.verdict.es_duplicado ? " DUP" : ""}`
      : "null";
    console.log(
      `${pass ? "OK " : "XX "} ${c.name}\n     dims=${dims}  publicar=${got}  esperado=${c.expected}`,
    );
  }
  console.log(`\nResultado: ${ok} OK, ${fail} fallos.`);
  if (fail > 0) process.exit(1);
}

main();
