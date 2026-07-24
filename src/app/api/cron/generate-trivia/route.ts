// src/app/api/cron/generate-trivia/route.ts
//
// Cron diario: genera preguntas de trivia con Claude (verificadas por doble
// pase) y las ACUMULA en el banco persistente. El banco crece cada día, así la
// trivia tiende a "infinita" sin repetir. Mismo patrón de auth que el resto de
// crons (Bearer CRON_SECRET o ?secret=).

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { recordHeartbeat } from "@/lib/ops/store";
import { sendOpsAlert } from "@/lib/ops/alert";
import { generateQuestions } from "@/lib/trivia/generator";
import { addToBank, getQuestionBank } from "@/lib/trivia/store";
import { FALLBACK_QUESTIONS } from "@/data/trivia-fallback";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Ligas para el foco rotativo de la trivia (slugs válidos del catálogo, seguibles
// por el usuario → el sesgo por-liga del /start las casa con fav_ligas). Orden
// pan-LATAM.
const LEAGUE_FOCUS: { slug: string; name: string }[] = [
  { slug: "ligapro-ecuador", name: "la LigaPro / Serie A de Ecuador" },
  { slug: "libertadores", name: "la CONMEBOL Libertadores" },
  { slug: "liga-mx", name: "la Liga MX de México" },
  { slug: "laliga", name: "LaLiga de España" },
  { slug: "sudamericana", name: "la CONMEBOL Sudamericana" },
  { slug: "liga-futve", name: "la Liga FUTVE de Venezuela" },
  { slug: "primera-a-colombia", name: "la Primera A de Colombia" },
  { slug: "liga-argentina", name: "la Liga Profesional Argentina" },
  { slug: "brasileirao", name: "el Brasileirão de Brasil" },
  { slug: "premier-league", name: "la Premier League de Inglaterra" },
  { slug: "champions-league", name: "la UEFA Champions League" },
];

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const count = Math.min(
    40,
    Math.max(8, Number(url.searchParams.get("count")) || 30),
  );

  // Siembra del banco con las preguntas verificadas a mano (la primera vez).
  let bank = await getQuestionBank();
  if (bank.length < FALLBACK_QUESTIONS.length) {
    await addToBank(FALLBACK_QUESTIONS);
    bank = await getQuestionBank();
  }

  // Foco de la tanda de hoy: un día GENERAL (Mundiales/leyendas/reglas), el
  // siguiente enfocado en una LIGA concreta (rotando por la lista). Así el banco
  // acumula preguntas etiquetadas de cada liga para el sesgo por-liga del /start,
  // manteniendo UNA sola tanda por run (respeta maxDuration 120s). ?league=slug
  // fuerza una liga (para sembrar una concreta a mano).
  const dayNum = Math.floor(Date.now() / 86_400_000);
  const leagueParam = url.searchParams.get("league");
  const focus = leagueParam
    ? LEAGUE_FOCUS.find((l) => l.slug === leagueParam) ?? null
    : dayNum % 2 === 0
      ? null
      : LEAGUE_FOCUS[Math.floor(dayNum / 2) % LEAGUE_FOCUS.length];

  // Genera preguntas nuevas evitando todo lo que ya hay en el banco.
  const avoid = bank.map((q) => q.question);
  const questions = await generateQuestions(count, avoid, focus);
  const added = await addToBank(questions);
  const bankSize = (await getQuestionBank()).length;

  try {
    revalidatePath("/trivia");
  } catch {
    /* noop */
  }

  // El heartbeat refleja si la generación funcionó: `added` puede ser 0
  // legítimamente (todo duplicado), por eso la señal de salud es `generated > 0`,
  // no `added > 0`.
  const healthy = questions.length > 0;

  // Si Claude no generó NADA, el banco deja de crecer y las preguntas se
  // repetirán en pocos días. Aviso (con throttle) en vez de fallo silencioso.
  if (!healthy) {
    await sendOpsAlert({
      key: "trivia_gen_zero",
      severity: "warning",
      title: "Trivia diaria sin preguntas nuevas",
      body: `generate-trivia generó 0 preguntas (banco: ${bankSize}). Revisa saldo/key de Anthropic — si sigue así el banco se repite.`,
      repeatMinutes: 360,
      url: "/admin/monitor",
    });
  }

  await recordHeartbeat("generate-trivia", healthy, { generated: questions.length, added, bankSize });

  return NextResponse.json({
    ok: healthy,
    focus: focus?.slug ?? "general", // liga enfocada esta tanda (o general)
    generated: questions.length, // pasaron generación + verificación
    added, // nuevas (no duplicadas) que entraron al banco
    bankSize, // tamaño real del banco tras añadir
  });
}
