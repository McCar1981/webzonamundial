// GET /api/cron/test-critic
//
// Endpoint de EVIDENCIA (requisito: ver el listón calibrado antes de fiarse del
// gate). Ejecuta el MISMO crítico (evaluateArticle) sobre dos casos reales y
// devuelve el JSON puntuado + el veredicto de shouldPublish:
//
//   A) RECHAZAR — una reescritura "fina" estilo GNews: bien escrita pero
//      refrito de bajo valor (reformula un titular, sin análisis ni datos
//      propios). Debe caer por originalidad/profundidad.
//   B) PASAR — una previa de grupo generada con buildEvergreenPost a partir de
//      un dossier de datos verificados, evaluada con el dossier como sourceText.
//      Debe superar el listón por sustancia y precisión factual.
//
// Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=XXX.
// Parámetros: ?group=C (grupo para el caso PASA; por defecto "C").
//
// Pensado para disparar EN PRODUCCIÓN (donde existe ANTHROPIC_API_KEY/KV) y
// pegar el JSON resultante. No persiste nada.

import { NextRequest, NextResponse } from "next/server";
import { evaluateArticle, shouldPublish, CRITIC_MIN_CRITICA, CRITIC_MIN_MEDIA } from "@/lib/noticias-critic";
import type { NoticiaBlock } from "@/data/noticias";
import { buildGroupDossier } from "@/lib/evergreen/dossier";
import { buildEvergreenPost } from "@/lib/evergreen/generator";
import { blogBodyToNoticiaBlocks } from "@/lib/blog/critic-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// --- Caso A: reescritura fina estilo GNews que DEBERÍA RECHAZAR -------------
// Texto correcto y publicable a primera vista, pero refrito: reformula el
// titular de una fuente, sin análisis, datos ni perspectiva propia.
const GNEWS_REJECT_TITLE =
  "Mbappé asegura que el Real Madrid llega motivado al próximo partido";

const GNEWS_REJECT_BODY: NoticiaBlock[] = [
  {
    type: "p",
    text: "Kylian Mbappé ha declarado que el Real Madrid afronta con ilusión y motivación su próximo encuentro. El delantero francés se mostró optimista de cara al duelo que disputará el conjunto blanco este fin de semana.",
  },
  {
    type: "p",
    text: "El futbolista subrayó la importancia de seguir sumando victorias y aseguró que el equipo trabaja para dar lo mejor de sí. Sus palabras llegan tras la última sesión de entrenamiento del club.",
  },
  {
    type: "p",
    text: "El Real Madrid buscará los tres puntos en un partido que se prevé igualado. La afición espera una nueva exhibición del conjunto que dirige su entrenador.",
  },
  {
    type: "p",
    text: "Mbappé, una de las grandes figuras del equipo, confía en mantener su buen momento goleador. El club no ha facilitado más detalles sobre la convocatoria.",
  },
];

const GNEWS_REJECT_SOURCE =
  "Mbappé: 'Llegamos motivados al próximo partido y queremos ganar'. El delantero del Real Madrid habló tras el entrenamiento y se mostró optimista. (titular y entradilla de una agencia)";

async function runRejectCase() {
  const verdict = await evaluateArticle({
    title: GNEWS_REJECT_TITLE,
    body: GNEWS_REJECT_BODY,
    sourceText: GNEWS_REJECT_SOURCE,
    recentTitles: [],
  });
  return {
    label: "A_should_REJECT (refrito GNews)",
    title: GNEWS_REJECT_TITLE,
    verdict,
    shouldPublish: shouldPublish(verdict),
    expected: "publicar=false",
  };
}

async function runPassCase(groupLetra: string) {
  // 1. Dossier de datos verificados (solo hechos del repo + forma reciente).
  const dossier = await buildGroupDossier(groupLetra);

  // 2. Redactor perenne genera la previa a partir SOLO del dossier.
  const post = await buildEvergreenPost({ dossier, category: "analisis" });
  if (!post) {
    return {
      label: "B_should_PASS (previa de grupo)",
      error: "generation_failed",
    };
  }

  // 3. Crítico: el dossier es el sourceText para verificar precisión factual.
  const verdict = await evaluateArticle({
    title: post.title,
    body: blogBodyToNoticiaBlocks(post.body),
    sourceText: dossier.dossier,
    recentTitles: [],
  });

  return {
    label: "B_should_PASS (previa de grupo)",
    title: post.title,
    slug: post.slug,
    bodyBlocks: post.body.length,
    verdict,
    shouldPublish: shouldPublish(verdict),
    expected: "publicar=true",
  };
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    if (!headerOk && querySecret !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const groupLetra = (new URL(req.url).searchParams.get("group") || "C").toUpperCase();

  const [reject, pass] = await Promise.all([
    runRejectCase().catch((err) => ({ label: "A_should_REJECT", error: (err as Error).message })),
    runPassCase(groupLetra).catch((err) => ({ label: "B_should_PASS", error: (err as Error).message })),
  ]);

  return NextResponse.json({
    ok: true,
    thresholds: { CRITIC_MIN_CRITICA, CRITIC_MIN_MEDIA },
    note: "El gate exige relevancia/originalidad/precision >= MIN_CRITICA, media >= MIN_MEDIA y no duplicado. 'publicar' del modelo es solo asesor.",
    cases: [reject, pass],
  });
}
