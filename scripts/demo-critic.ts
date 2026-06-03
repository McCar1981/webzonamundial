/**
 * Demo del crítico de calidad (Fase 1).
 *
 * Ejecuta el evaluador sobre dos artículos de ejemplo — uno de ALTO valor
 * (corto y denso) y uno de BAJO valor (off-topic / relleno) — e imprime el
 * veredicto y la decisión de publicar.
 *
 * Uso (necesita la API key de Anthropic):
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/demo-critic.ts
 */

import { evaluateArticle, shouldPublish } from "../src/lib/noticias-critic";
import type { NoticiaBlock } from "../src/data/noticias";

const PASA = {
  title: "Países Bajos deja fuera a Frimpong de su lista para el Mundial 2026",
  source:
    "El seleccionador de Países Bajos, Ronald Koeman, ha publicado la lista de 26 jugadores para el Mundial 2026. La gran ausencia es el lateral Jeremie Frimpong, que se queda fuera pese a su buena temporada. Entran los habituales Virgil van Dijk, Frenkie de Jong y Cody Gakpo.",
  body: [
    { type: "p", text: "Ronald Koeman ha sacudido la previa del Mundial 2026 al dejar fuera a Jeremie Frimpong de la lista de 26 de Países Bajos. El lateral, una de las sorpresas de la temporada, no entra en la convocatoria pese a sus números." },
    { type: "p", text: "El técnico mantiene el bloque de confianza: Virgil van Dijk como capitán y eje defensivo, Frenkie de Jong en la medular y Cody Gakpo en ataque. La decisión sobre Frimpong abre el debate sobre el perfil de carrilero que quiere Koeman para el torneo." },
    { type: "p", text: "Países Bajos llega como una de las selecciones a seguir. La ausencia de Frimpong refuerza la apuesta por perfiles más defensivos en la banda, una lectura táctica que marcará su fase de grupos." },
    { type: "callout", title: "Lo que viene", text: "La lista definitiva se cerrará antes del debut. Koeman aún puede ajustar por lesiones de última hora." },
  ] as NoticiaBlock[],
};

const RECHAZA = {
  title: "Un futbolista del Mundial 2026 aparece en un reality de televisión",
  source:
    "Un exjugador participará en la nueva edición de un programa de telerrealidad que se estrena este verano. El programa no tiene relación con el fútbol.",
  body: [
    { type: "p", text: "El Mundial 2026 será el torneo más grande de la historia con 48 selecciones, 16 sedes y 104 partidos repartidos entre Estados Unidos, México y Canadá. Pero hoy hablamos de televisión." },
    { type: "p", text: "Como es sabido, el Mundial se celebra cada cuatro años desde 1930, cuando Uruguay ganó la primera edición. Desde entonces el fútbol ha crecido enormemente y los jugadores son figuras mediáticas." },
    { type: "p", text: "En este contexto, un futbolista aparecerá en un reality. No se han confirmado más detalles ni su relación con ninguna selección del torneo." },
    { type: "p", text: "El formato de 48 equipos del Mundial 2026 reparte a las selecciones en 12 grupos de cuatro. Esto no tiene relación con el reality, pero conviene recordarlo." },
    { type: "callout", title: "Conclusión", text: "Habrá que esperar para saber más sobre esta participación televisiva." },
  ] as NoticiaBlock[],
};

async function run(label: string, c: typeof PASA) {
  const verdict = await evaluateArticle({
    title: c.title,
    body: c.body,
    sourceText: c.source,
    recentTitles: [],
  });
  const pass = shouldPublish(verdict);
  console.log(`\n===== ${label} =====`);
  console.log("Título:", c.title);
  console.log("Veredicto:", JSON.stringify(verdict, null, 2));
  console.log("¿PUBLICAR (regla del proyecto)? →", pass ? "✅ SÍ" : "❌ NO");
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Falta ANTHROPIC_API_KEY. Ejecuta:\n  ANTHROPIC_API_KEY=sk-... npx tsx scripts/demo-critic.ts");
    process.exit(1);
  }
  await run("CASO 1 (esperado: PASA)", PASA);
  await run("CASO 2 (esperado: RECHAZA)", RECHAZA);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
