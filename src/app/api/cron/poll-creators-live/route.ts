// GET /api/cron/poll-creators-live
//
// Polls Twitch cada 2 min para saber qu\u00e9 creators de ZonaMundial est\u00e1n
// en directo. Persiste el resultado en KV via writeLiveStore.
//
// Auth: Authorization: Bearer ${CRON_SECRET} o ?secret=...
//
// El cron de Vercel/GitHub Actions lo dispara con la frecuencia que
// configuremos. Plan Hobby de Vercel permite 1/min, suficiente.

import { NextRequest, NextResponse } from "next/server";
import { CREADORES } from "@/data/creadores";
import { getLiveStreams } from "@/lib/creators-live/twitch";
import {
  buildLiveCreator,
  writeLiveStore,
  type LiveCreator,
} from "@/lib/creators-live/store";
import { notifyLiveCreators } from "@/lib/creators-live/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  // 1. Build mapa twitchUser \u2192 creator del repo (solo los que tienen Twitch).
  type CreatorRef = {
    slug: string;
    nombre: string;
    imagen: string;
    paisFlag: string;
    twitchUser: string;
  };
  const byTwitchUser = new Map<string, CreatorRef>();
  for (const c of CREADORES) {
    const twitchRed = c.redes.find((r) => r.plataforma === "twitch");
    if (!twitchRed) continue;
    const user = twitchRed.usuario.toLowerCase().trim();
    if (!user) continue;
    byTwitchUser.set(user, {
      slug: c.slug,
      nombre: c.nombre,
      imagen: c.imagen,
      paisFlag: c.paisFlag,
      twitchUser: user,
    });
  }

  const usernames = Array.from(byTwitchUser.keys());
  if (usernames.length === 0) {
    await writeLiveStore({
      updatedAt: new Date().toISOString(),
      live: [],
    });
    return NextResponse.json({
      ok: true,
      tracked: 0,
      live: 0,
      note: "No creators with twitchUser configured",
    });
  }

  // 2. Llamar a Twitch.
  const streams = await getLiveStreams(usernames);

  // 3. Mapear streams a LiveCreator y filtrar los que tenemos en el repo.
  const live: LiveCreator[] = [];
  for (const s of streams) {
    const creator = byTwitchUser.get(s.userLogin);
    if (!creator) continue;
    live.push(
      buildLiveCreator({
        creatorSlug: creator.slug,
        creatorNombre: creator.nombre,
        creatorImagen: creator.imagen,
        creatorPaisFlag: creator.paisFlag,
        twitchUser: creator.twitchUser,
        stream: s,
      }),
    );
  }

  // 4. Persistir.
  await writeLiveStore({
    updatedAt: new Date().toISOString(),
    live,
  });

  // 5. Notificaciones push: por cada creator live, manda push a los
  //    suscritos a category="creators" (channel=push) si NO está en
  //    cooldown de 4h. El helper gestiona el cooldown vía KV.
  //    Si falla, NO debe romper la respuesta del cron.
  let notifStats: Awaited<ReturnType<typeof notifyLiveCreators>> | null = null;
  if (live.length > 0) {
    try {
      notifStats = await notifyLiveCreators(live);
    } catch (err) {
      console.error(
        "[creators-live] notifyLiveCreators threw:",
        (err as Error).message,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    tracked: usernames.length,
    live: live.length,
    creators: live.map((l) => ({ slug: l.slug, viewerCount: l.viewerCount })),
    notifs: notifStats,
  });
}
