/**
 * Cron endpoint: pulls fresh World Cup news from GNews, deduplicates,
 * builds drafts and appends them to data/noticias-ingested.json.
 *
 * On Vercel Cron this is invoked with `Authorization: Bearer ${CRON_SECRET}`.
 * In dev / locally you can hit it manually with the same header.
 *
 * Drafts are NEVER auto-published — they sit in the JSON file with
 * `status: "draft"` until a human (or a future LLM step) reviews them
 * and either rewrites the body or moves them to the static NOTICIAS array.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestNews, titleFingerprint, type IngestResult } from "@/lib/noticias-ingest";
import { applyRewrite } from "@/lib/noticias-rewriter";
import { enrichDraft, enrichEnabled } from "@/lib/noticias-enrich";
import { WORLD_CUP_QUERIES, HOT_QUERY_KEYS, COLD_QUERY_KEYS, type WorldCupQueryKey } from "@/lib/gnews";
import {
  readIngestStore,
  writeIngestStore,
  getStorePath,
  acquireStoreLock,
  releaseStoreLock,
} from "@/lib/noticias-store";
import { randomUUID } from "node:crypto";
import { broadcastPush } from "@/lib/push-notifications";
import type { DraftNoticia } from "@/lib/noticias-ingest";

export async function GET(req: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
  // También aceptamos ?secret=XXX como query param para poder
  // invocar el cron manualmente desde el navegador (debug). El
  // secret nunca se logea ni se devuelve en la respuesta.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const querySecret = new URL(req.url).searchParams.get("secret");
    const queryOk = querySecret === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Lock distribuido: solo una ingesta escribe el store a la vez. Si el cron
  // horario y un run manual se cruzan, sin esto el segundo write pisa al primero
  // y se pierden publicadas. Si no conseguimos el lock, otra ingesta está en
  // curso → nos saltamos este tick (no es error; el cron reintenta).
  const lockToken = randomUUID();
  const gotLock = await acquireStoreLock(lockToken);
  if (!gotLock) {
    return NextResponse.json({
      ok: true,
      skipped: "locked",
      message: "otra ingesta en curso; este tick se omite",
    });
  }

  try {
  const store = await readIngestStore();
  const knownHashes = new Set(store.drafts.map((d) => d.sourceUrlHash));

  // ----- Cap diario de publicación (alto valor, no a escala) -----
  // Solo publicamos como MÁXIMO NEWS_DAILY_CAP noticias por día natural (UTC),
  // y solo las que pasen el crítico de calidad. Algunos días saldrán menos, o
  // ninguna: es lo correcto durante la revisión de AdSense.
  const DAILY_PUBLISH_CAP = parseInt(process.env.NEWS_DAILY_CAP || "30", 10);
  const todayUTC = new Date().toISOString().slice(0, 10);
  const publishedToday = store.drafts.filter(
    (d) => d.status === "published" && (d.ingestedAt ?? "").slice(0, 10) === todayUTC,
  ).length;
  let publishedThisRun = 0;
  const capReached = () => publishedToday + publishedThisRun >= DAILY_PUBLISH_CAP;

  // Títulos ya publicados (para que el crítico detecte duplicados de ángulo).
  const recentTitles = store.drafts
    .filter((d) => d.status === "published")
    .sort((a, b) => (b.ingestedAt ?? "").localeCompare(a.ingestedAt ?? ""))
    .slice(0, 40)
    .map((d) => d.title);

  // Candidatos a evaluar por tick. Cada candidato = 1 reescritura + 1 llamada
  // al crítico. El número que finalmente se PUBLICA lo limita el crítico y el
  // cap diario (NEWS_DAILY_CAP), no este valor. Evaluamos algunos de más para
  // que el crítico tenga de dónde elegir, ya que rechaza la mayoría.
  const url = new URL(req.url);
  const skipRewrite = url.searchParams.get("rewrite") === "0";
  const rewriteLimit = parseInt(
    url.searchParams.get("rewriteLimit") ||
      process.env.NEWS_REWRITE_LIMIT ||
      "5",
    10,
  );
  // Selección de queries por tick, SESGADA hacia beats calientes (ver
  // HOT_QUERY_KEYS / COLD_QUERY_KEYS en gnews.ts). El diagnóstico del crítico
  // mostró que la rotación plana caía en beats fríos (sedes, entradas, FIFA) y
  // metía relleno (Netflix, guías de trenes) que el crítico rechaza por baja
  // originalidad. Ahora cada tick toma MAYORÍA de beats calientes
  // (convocatorias, lesiones, cracks, selecciones top) + 1 frío para cobertura
  // residual, rotando por hora para cubrir todo a lo largo del día sin inundar
  // el feed de paja.
  const QUERIES_PER_TICK = parseInt(process.env.NEWS_QUERIES_PER_TICK || "5", 10);
  const COLD_PER_TICK = Math.min(
    QUERIES_PER_TICK,
    parseInt(process.env.NEWS_COLD_PER_TICK || "1", 10),
  );
  const hotPerTick = Math.max(0, QUERIES_PER_TICK - COLD_PER_TICK);
  const hourSeed = new Date().getUTCHours();
  const queries: WorldCupQueryKey[] = [];
  const seenQueries = new Set<WorldCupQueryKey>();
  const pushQuery = (k: WorldCupQueryKey) => {
    if (!seenQueries.has(k)) {
      seenQueries.add(k);
      queries.push(k);
    }
  };
  // Override manual de beats: ?beats=squad,injuries,stars fuerza esos beats
  // (ignora la rotación por hora). Útil para ponerse al día rápido tras una
  // caída: la rotación normal depende de getUTCHours(), así que disparar varios
  // runs la misma hora repetiría los mismos beats. Con ?beats puedo apuntar a
  // los calientes ahora mismo. Solo se aceptan claves válidas de WORLD_CUP_QUERIES.
  const beatsParam = url.searchParams.get("beats");
  if (beatsParam) {
    const valid = new Set(Object.keys(WORLD_CUP_QUERIES));
    for (const k of beatsParam.split(",").map((s) => s.trim())) {
      if (valid.has(k)) pushQuery(k as WorldCupQueryKey);
    }
  }
  // Si no hubo override válido, rotación normal sesgada a beats calientes.
  if (queries.length === 0) {
    // Beats calientes: rotan por hora a lo largo de HOT_QUERY_KEYS.
    for (let i = 0; i < hotPerTick; i++) {
      pushQuery(HOT_QUERY_KEYS[(hourSeed + i) % HOT_QUERY_KEYS.length]);
    }
    // Beats fríos: cobertura residual, rotando por hora.
    for (let i = 0; i < COLD_PER_TICK; i++) {
      pushQuery(COLD_QUERY_KEYS[(hourSeed + i) % COLD_QUERY_KEYS.length]);
    }
  }

  // ----- Backfill histórico (recuperación de credibilidad) -----
  // ?backfill=<días> (máx 30, límite del GNews Free) reconstruye el feed
  // barriendo los últimos N días en ventanas deslizantes. Cada pieza conserva
  // su FECHA REAL (ingestedAt = publishedAt del medio, marcada como backfilled)
  // para que aparezca en su día real en el feed — NO todas hoy. Entran como
  // borradores; este run reescribe unas pocas y el cron horario publica el
  // resto gradualmente (Fase 2), respetando el cap diario.
  //
  // Coste en cuota: WINDOWS × BEATS_PER_WINDOW requests. Con 30 días, ventana
  // de 5 días y 3 beats/ventana = 6×3 = 18 requests. El GNews Free son 100/día,
  // así que dispáralo cuando el cron horario no esté quemando la cuota.
  const backfillDays = Math.min(
    parseInt(url.searchParams.get("backfill") || "0", 10) || 0,
    30,
  );
  let result: IngestResult;
  if (backfillDays > 0) {
    const WINDOW_DAYS = Math.max(
      1,
      parseInt(process.env.NEWS_BACKFILL_WINDOW_DAYS || "5", 10),
    );
    const BEATS_PER_WINDOW = Math.max(
      1,
      parseInt(process.env.NEWS_BACKFILL_BEATS_PER_WINDOW || "3", 10),
    );
    const allBeats: WorldCupQueryKey[] = [...HOT_QUERY_KEYS, ...COLD_QUERY_KEYS];
    // Huellas de título ya conocidas, para dedup de "misma noticia, otro medio"
    // a lo largo de todas las ventanas del barrido.
    const knownFingerprints = new Set<string>(
      store.drafts.map((d) => titleFingerprint(d.title)).filter(Boolean),
    );
    const combined: IngestResult = { fetched: 0, drafts: [], duplicates: 0, errors: [] };
    const now = Date.now();
    const DAY_MS = 86_400_000;
    let win = 0;
    for (let startDay = 0; startDay < backfillDays; startDay += WINDOW_DAYS) {
      const to = new Date(now - startDay * DAY_MS).toISOString();
      const from = new Date(
        now - Math.min(startDay + WINDOW_DAYS, backfillDays) * DAY_MS,
      ).toISOString();
      // Rotar beats por ventana para cubrir distintos temas sin agotar la cuota.
      const beatsThisWindow: WorldCupQueryKey[] = [];
      for (let b = 0; b < BEATS_PER_WINDOW; b++) {
        beatsThisWindow.push(allBeats[(win * BEATS_PER_WINDOW + b) % allBeats.length]);
      }
      const r = await ingestNews({
        knownHashes,
        knownFingerprints,
        queries: beatsThisWindow,
        maxPerQuery: 10,
        from,
        to,
        useRealDateAsIngestedAt: true,
      });
      combined.fetched += r.fetched;
      combined.drafts.push(...r.drafts);
      combined.duplicates += r.duplicates;
      combined.errors.push(...r.errors);
      win += 1;
      // Throttle entre ventanas (cada ventana es una llamada distinta a
      // ingestNews, que solo throttlea entre beats internos). GNews Free ~1/s.
      await new Promise((res) => setTimeout(res, 1100));
    }
    result = combined;
  } else {
    result = await ingestNews({
      knownHashes,
      queries,
      maxPerQuery: 10,
    });
  }

  const rewriteEnabled = !!process.env.ANTHROPIC_API_KEY && !skipRewrite;

  let rewritten = 0;
  let rewriteFailed = 0;
  let abortedByTimeout = false;
  let pendingDraftsRetried = 0;
  // Tracking de drafts que pasan a "published" en este tick.
  // Los usamos para disparar web push tras la revalidación.
  const newlyPublished: DraftNoticia[] = [];
  // Diagnóstico: por cada draft que SE EVALÚA pero NO se publica, guardamos el
  // veredicto del crítico (las 5 notas + media + duplicado + motivos). Así la
  // respuesta del cron muestra POR QUÉ se rechaza cada noticia, sin depender de
  // los logs de runtime de Vercel. `critic: null` => la llamada a la IA falló o
  // el JSON no parseó (eso NO es un rechazo de calidad, es un fallo técnico).
  const criticRejections: Array<{
    title: string;
    status: DraftNoticia["status"];
    duplicate: boolean | null;
    avg: number | null;
    scores: Record<string, number> | null;
    motivos: string;
  }> = [];
  function recordRejection(d: DraftNoticia) {
    const v = d.critic;
    const scores = v
      ? {
          relevancia: v.relevancia,
          originalidad: v.originalidad_valor,
          profundidad: v.profundidad,
          precision: v.precision_factual,
          utilidad: v.utilidad_lector,
        }
      : null;
    const avg = v
      ? Math.round(
          ((v.relevancia +
            v.originalidad_valor +
            v.profundidad +
            v.precision_factual +
            v.utilidad_lector) /
            5) *
            10,
        ) / 10
      : null;
    criticRejections.push({
      title: d.title,
      status: d.status,
      duplicate: v ? v.es_duplicado : null,
      avg,
      scores,
      motivos: v?.motivos ?? "sin veredicto del crítico (fallo de IA o de parseo JSON)",
    });
  }
  // Soft deadline: stop the rewrite loop ~50s into the request to leave
  // ~10s of headroom under Vercel Hobby's 60s function cap. Any drafts not
  // rewritten remain status: "draft" and will be picked up on the next tick.
  const deadlineMs = Date.now() + 50_000;
  // Phase 1 (rewriting brand-new drafts) gets only the FIRST slice of the
  // budget so it can never starve Phase 2. Before this, high news volume made
  // Phase 1 burn the whole 50s every tick (`abortedByTimeout: true`), so
  // Phase 2 — the path that republishes already-vetted pending drafts — never
  // ran and nothing got published for two days. Phase 2 keeps the full
  // deadlineMs and now always receives the remaining budget.
  const phase1DeadlineMs = Date.now() + 30_000;

  // FASE 1: Reescribir drafts NUEVOS (recién ingestados de GNews).
  if (rewriteEnabled) {
    const cap = rewriteLimit > 0 ? Math.min(rewriteLimit, result.drafts.length) : result.drafts.length;
    for (let i = 0; i < cap; i++) {
      // Hand off to Phase 2 once Phase 1's sub-window is spent. This is an
      // expected handoff, NOT a hard timeout, so we don't set abortedByTimeout
      // (that flag is reserved for running out the full request budget).
      if (Date.now() > phase1DeadlineMs) {
        break;
      }
      // Cap diario: si ya alcanzamos el máximo de publicaciones del día, no
      // seguimos reescribiendo (ahorra llamadas al modelo). Los drafts quedan
      // en "draft" y se reintentarán otro día con cupo.
      if (capReached()) break;
      try {
        // Enriquecer el material fuente (descarga el artículo original si el
        // snippet de GNews es pobre). Auto-skip si ya es rico; fallback al
        // snippet ante cualquier fallo. Acotado por timeout.
        const enriched = await enrichDraft(result.drafts[i]);
        result.drafts[i] = await applyRewrite(enriched, { recentTitles });
        if (result.drafts[i].status === "published") {
          rewritten += 1;
          publishedThisRun += 1;
          recentTitles.unshift(result.drafts[i].title);
          newlyPublished.push(result.drafts[i]);
        } else {
          recordRejection(result.drafts[i]);
        }
      } catch (err) {
        rewriteFailed += 1;
        console.error("[cron] rewrite failed (new)", (err as Error).message);
      }
    }
  }

  store.drafts.push(...result.drafts);

  // FASE 2: Reescribir drafts ANTIGUOS que quedaron en status:"draft"
  // (p.ej. por fallos transitorios de Claude). Sin esto, los drafts
  // huérfanos nunca se publican. Tomamos los más recientes primero
  // para que la página de noticias quede fresca.
  if (rewriteEnabled) {
    const pendingDrafts = store.drafts.filter((d) => d.status === "draft");
    // Iteramos sobre los más recientes (final del array, recién pusheados
    // al inicio + drafts pendientes viejos).
    const slotsLeft =
      rewriteLimit > 0 ? Math.max(0, rewriteLimit - rewritten - rewriteFailed) : pendingDrafts.length;
    const retryCap = Math.min(slotsLeft, pendingDrafts.length);
    // Los más nuevos primero (mayor probabilidad de relevancia).
    pendingDrafts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    for (let i = 0; i < retryCap; i++) {
      if (Date.now() > deadlineMs) {
        abortedByTimeout = true;
        break;
      }
      if (capReached()) break;
      try {
        const enriched = await enrichDraft(pendingDrafts[i]);
        const updated = await applyRewrite(enriched, { recentTitles });
        // Reemplazar el draft viejo en store.drafts (match por sourceUrlHash).
        const idx = store.drafts.findIndex((d) => d.sourceUrlHash === pendingDrafts[i].sourceUrlHash);
        if (idx >= 0) {
          // Si se publica AHORA, refrescar ingestedAt para que aparezca arriba
          // del feed (tiebreaker cuando comparte `date` con otras). Sin esto,
          // los drafts viejos retried mantenían su ingestedAt original y se
          // quedaban hundidos detrás de noticias estáticas del mismo día.
          // EXCEPCIÓN: las piezas de backfill conservan su fecha REAL (no se
          // refrescan), porque su gracia es aparecer en su día histórico.
          if (updated.status === "published" && !updated.backfilled) {
            updated.ingestedAt = new Date().toISOString();
          }
          store.drafts[idx] = updated;
          if (updated.status === "published") {
            rewritten += 1;
            pendingDraftsRetried += 1;
            publishedThisRun += 1;
            recentTitles.unshift(updated.title);
            newlyPublished.push(updated);
          } else {
            recordRejection(updated);
          }
        }
      } catch (err) {
        rewriteFailed += 1;
        console.error("[cron] rewrite failed (retry)", (err as Error).message);
      }
    }
  }
  // Trim the store WITHOUT ever evicting published articles. The old logic
  // (slice(-300)) kept the most-recently-pushed entries, but raw drafts are
  // always appended last, so published articles — being older — were the first
  // to be evicted. That silently drained the public feed (publishedCount fell
  // 51 → 1 over two days). We now keep every published article and only trim
  // surplus draft/review entries, oldest first.
  const MAX_STORE = 300;
  if (store.drafts.length > MAX_STORE) {
    const publishedDrafts = store.drafts.filter((d) => d.status === "published");
    const otherDrafts = store.drafts.filter((d) => d.status !== "published");
    const slotsForOthers = Math.max(0, MAX_STORE - publishedDrafts.length);
    store.drafts = [...otherDrafts.slice(-slotsForOthers), ...publishedDrafts];
  }
  store.generatedAt = new Date().toISOString();
  await writeIngestStore(store);

  // Force ISR cache invalidation so new articles appear immediately on the
  // public site (next request will re-render hub + every article page).
  try {
    revalidatePath("/noticias");
    revalidatePath("/noticias/[slug]", "page");
    revalidatePath("/noticias/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch (err) {
    console.error("[cron] revalidate failed", (err as Error).message);
  }

  // Broadcast Web Push: enviar notificación a todos los suscriptores
  // por cada noticia publicada en este tick.
  // - Si publicamos varias en el mismo tick, mandamos una sola push
  //   (la más reciente) para no abrumar al user.
  // - Si no hay nuevas o no hay VAPID configurado, no hace nada.
  let pushTotal = 0;
  let pushSent = 0;
  let pushGone = 0;
  let pushFailed = 0;
  if (newlyPublished.length > 0) {
    // Tomamos la última publicada (la más relevante del tick).
    const featured = newlyPublished[newlyPublished.length - 1];
    try {
      const result = await broadcastPush({
        kind: "news",
        payload: {
          title:
            newlyPublished.length === 1
              ? "📰 Nueva noticia en ZonaMundial"
              : `📰 ${newlyPublished.length} nuevas noticias`,
          body: featured.title,
          url: `/noticias/${featured.slug}`,
          tag: "news",
          icon: "/img/email/logo-zonamundial.png",
          image: featured.realImage ?? undefined,
        },
      });
      pushTotal = result.total;
      pushSent = result.sent;
      pushGone = result.gone;
      pushFailed = result.failed;
    } catch (err) {
      console.error("[cron] push broadcast failed", (err as Error).message);
    }
  }

  const published = store.drafts.filter((d) => d.status === "published").length;

  return NextResponse.json({
    ok: true,
    queries: queries.length,
    queriesUsed: queries,
    fetched: result.fetched,
    new: result.drafts.length,
    duplicates: result.duplicates,
    rewritten,
    pendingDraftsRetried,
    rewriteFailed,
    rewriteEnabled,
    enrichEnabled: enrichEnabled(),
    backfillDays,
    abortedByTimeout,
    dailyCap: DAILY_PUBLISH_CAP,
    publishedTodayBefore: publishedToday,
    publishedThisRun,
    capReached: capReached(),
    errors: result.errors,
    // Diagnóstico del crítico: cuántos rechazó y por qué (últimos 15 del tick).
    // Si criticRejectedCount > 0 con rewritten = 0, el cuello de botella es el
    // gate de calidad, no el throughput. Revisa `motivos` y `scores` para ver
    // si el umbral (NEWS_CRITIC_MIN_CRITICA / NEWS_CRITIC_MIN_MEDIA) es el problema.
    criticRejectedCount: criticRejections.length,
    criticRejections: criticRejections.slice(-15),
    totalStored: store.drafts.length,
    publishedCount: published,
    push: {
      newlyPublished: newlyPublished.length,
      total: pushTotal,
      sent: pushSent,
      gone: pushGone,
      failed: pushFailed,
    },
    storePath: getStorePath(),
  });
  } finally {
    // Liberar siempre el lock, pase lo que pase, para no bloquear el siguiente tick.
    await releaseStoreLock(lockToken);
  }
}

// Force dynamic so Vercel Cron always hits a fresh execution
export const dynamic = "force-dynamic";
// Allow up to 5 min for fetch + rewrite (Vercel Pro plan; on Hobby cap is 60s)
export const maxDuration = 300;
