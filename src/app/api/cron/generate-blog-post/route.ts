// GET /api/cron/generate-blog-post
//
// Cron que cada 2-3 d\u00edas genera un nuevo post de blog con Claude,
// lo guarda en KV y dispara push + email a los suscritos a la
// categor\u00eda 'blog-posts' en notification_preferences.
//
// Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=...
//
// Idempotente para mismo slug: si genera un post cuyo slug ya existe,
// no duplica (gracias a appendAutoPost).

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { buildBlogPost } from "@/lib/blog/generator";
import { appendAutoPost, getAllUsedSlugs, getRecentTitles } from "@/lib/blog/store";
import { broadcastPush } from "@/lib/push-notifications";
import { listActiveSubscribers, buildUnsubscribeToken } from "@/lib/email-subscriptions";
import { sendEmail, brandedEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE = "https://zonamundial.app";

export async function GET(req: NextRequest) {
  // Auth.
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

  // Opcional: ?topic=... para forzar un tema en concreto desde debug.
  const topic =
    new URL(req.url).searchParams.get("topic") ?? undefined;

  // 1. Generar.
  const [usedSlugs, recentTitles] = await Promise.all([
    getAllUsedSlugs(),
    getRecentTitles(20),
  ]);
  const post = await buildBlogPost({ topic, usedSlugs, recentTitles });
  if (!post) {
    return NextResponse.json(
      { ok: false, error: "generation_failed" },
      { status: 500 },
    );
  }

  // 2. Persistir.
  const { added, total } = await appendAutoPost(post);
  if (!added) {
    return NextResponse.json({
      ok: true,
      skipped: "duplicate_slug",
      slug: post.slug,
      total,
    });
  }

  // 3. Revalidar p\u00e1ginas para que aparezca al instante.
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
    revalidatePath("/blog/rss.xml");
    revalidatePath("/sitemap.xml");
  } catch (err) {
    console.error("[blog-cron] revalidate failed:", (err as Error).message);
  }

  // 4. Disparar push a los suscritos a 'blog-posts'.
  let pushSent = 0;
  let pushFailed = 0;
  try {
    const pushResult = await broadcastPush({
      kind: "blog-posts",
      payload: {
        title: `\ud83d\udcdd ${post.title}`,
        body: post.dek.slice(0, 140),
        url: `/blog/${post.slug}`,
        tag: "blog-posts",
        icon: "/img/email/logo-zonamundial.png",
      },
    });
    pushSent = pushResult.sent;
    pushFailed = pushResult.failed + pushResult.gone;
  } catch (err) {
    console.error("[blog-cron] push broadcast failed:", (err as Error).message);
  }

  // 5. Disparar email a los suscritos a 'blog-posts' por canal email.
  let emailSent = 0;
  let emailFailed = 0;
  try {
    const result = await sendBlogPostEmail(post);
    emailSent = result.sent;
    emailFailed = result.failed;
  } catch (err) {
    console.error("[blog-cron] email broadcast failed:", (err as Error).message);
  }

  return NextResponse.json({
    ok: true,
    slug: post.slug,
    title: post.title,
    totalAutoPosts: total,
    push: { sent: pushSent, failed: pushFailed },
    email: { sent: emailSent, failed: emailFailed },
  });
}

/**
 * Env\u00eda un email con el nuevo post a quienes tengan la categor\u00eda
 * 'blog-posts' habilitada por canal 'email' en notification_preferences.
 *
 * Fallback: si un usuario tiene email_subscriptions activo pero NO tiene
 * notification_preferences para esta categor\u00eda, NO le enviamos (opt-in
 * expl\u00edcito por categor\u00eda \u2014 evitamos spam).
 */
async function sendBlogPostEmail(post: {
  slug: string;
  title: string;
  dek: string;
  description: string;
  ogImage: string;
  category: string;
}): Promise<{ sent: number; failed: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { sent: 0, failed: 0 };

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // user_ids con preference category=blog-posts & channel=email & enabled.
  const { data: prefs, error: prefsErr } = await admin
    .from("notification_preferences")
    .select("user_id")
    .eq("category", "blog-posts")
    .eq("channel", "email")
    .eq("enabled", true);
  if (prefsErr) {
    console.error("[blog-cron] prefs query failed:", prefsErr.message);
    return { sent: 0, failed: 0 };
  }
  const userIds = (prefs ?? [])
    .map((r) => r.user_id as string | null)
    .filter(Boolean) as string[];

  if (userIds.length === 0) return { sent: 0, failed: 0 };

  // Resolver email de cada user. Reutilizamos email_subscriptions porque
  // ya tiene email plano sin necesidad de tocar auth.users.
  const subs = await listActiveSubscribers({
    kind: "daily-digest",
    limit: 1000,
  });
  const emailByUser = new Map<string, { id: string; email: string }>();
  for (const s of subs.rows) {
    if (s.user_id) {
      emailByUser.set(s.user_id, { id: s.id, email: s.email });
    }
  }

  let sent = 0;
  let failed = 0;
  for (const uid of userIds) {
    const target = emailByUser.get(uid);
    if (!target) continue;
    try {
      const token = buildUnsubscribeToken({
        email: target.email,
        kind: "daily-digest",
      });
      const unsubUrl = `${SITE}/api/notifications/digest/unsubscribe?token=${token}`;
      const postUrl = `${SITE}/blog/${post.slug}`;
      const ok = await sendEmail({
        to: target.email,
        subject: `\ud83d\udcdd ${post.title}`,
        html: brandedEmail({
          preheader: post.dek.slice(0, 100),
          heading: post.title,
          bodyHtml: `
            <p style="margin:0 0 18px;color:#3D3D5C;font-size:15px;line-height:1.6;">
              ${escapeHtml(post.dek)}
            </p>
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;line-height:1.6;padding-top:14px;border-top:1px solid #e5e7eb;margin-top:24px;">
              Recibes este email porque est\u00e1s suscrito a 'Nuevos posts del blog' en ZonaMundial.<br>
              <a href="${unsubUrl}" style="color:#C9A84C;text-decoration:underline;">Darse de baja</a> \u00b7
              <a href="${SITE}/cuenta/notificaciones" style="color:#C9A84C;text-decoration:underline;">Gestionar notificaciones</a>
            </p>
          `,
          ctaLabel: "Leer el post completo",
          ctaHref: postUrl,
        }),
      });
      if (ok) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
