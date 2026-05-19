// src/lib/creators-live/twitch.ts
//
// Cliente Twitch Helix API server-only. Solo se invoca desde el cron
// /api/cron/poll-creators-live. Las p\u00e1ginas p\u00fablicas leen del KV store,
// nunca llaman a Twitch directamente (anti rate-limit + sub-50ms).
//
// Setup (Vercel env vars):
//   TWITCH_CLIENT_ID     \u2192 https://dev.twitch.tv/console (Create app)
//   TWITCH_CLIENT_SECRET \u2192 idem (Manage \u2192 New Secret)

interface TokenCache {
  token: string;
  expiresAtMs: number;
}

let _tokenCache: TokenCache | null = null;

/** Obtiene App Access Token via client credentials. Cachea hasta 50 min. */
async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAtMs > now + 60_000) {
    return _tokenCache.token;
  }
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("[twitch] TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET missing");
    return null;
  }
  try {
    const resp = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });
    if (!resp.ok) {
      console.error("[twitch] token request failed:", resp.status);
      return null;
    }
    const data = (await resp.json()) as { access_token: string; expires_in: number };
    _tokenCache = {
      token: data.access_token,
      expiresAtMs: now + data.expires_in * 1000,
    };
    return data.access_token;
  } catch (err) {
    console.error("[twitch] token request threw:", (err as Error).message);
    return null;
  }
}

export interface TwitchLiveStream {
  userLogin: string;
  userName: string;
  title: string;
  gameName: string;
  thumbnailUrl: string;
  viewerCount: number;
  startedAt: string;
}

/**
 * Devuelve los streams EN VIVO de la lista de usernames dada.
 * Si ninguno est\u00e1 en vivo, devuelve [].
 *
 * Twitch limita a 100 usernames por llamada \u2014 si pasas m\u00e1s, hace chunks.
 */
export async function getLiveStreams(
  userLogins: string[],
): Promise<TwitchLiveStream[]> {
  if (userLogins.length === 0) return [];
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return [];

  const token = await getAccessToken();
  if (!token) return [];

  // Chunk de 100 por safety.
  const chunks: string[][] = [];
  for (let i = 0; i < userLogins.length; i += 100) {
    chunks.push(userLogins.slice(i, i + 100));
  }

  const all: TwitchLiveStream[] = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams();
    for (const login of chunk) params.append("user_login", login.toLowerCase());

    try {
      const resp = await fetch(
        `https://api.twitch.tv/helix/streams?${params.toString()}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );
      if (!resp.ok) {
        console.error("[twitch] streams request failed:", resp.status);
        continue;
      }
      const data = (await resp.json()) as {
        data?: Array<{
          user_login: string;
          user_name: string;
          title: string;
          game_name: string;
          thumbnail_url: string;
          viewer_count: number;
          started_at: string;
        }>;
      };
      for (const s of data.data ?? []) {
        all.push({
          userLogin: s.user_login.toLowerCase(),
          userName: s.user_name,
          title: s.title,
          gameName: s.game_name,
          // thumbnailUrl viene como template con {width}x{height}.
          thumbnailUrl: s.thumbnail_url
            .replace("{width}", "1280")
            .replace("{height}", "720"),
          viewerCount: s.viewer_count,
          startedAt: s.started_at,
        });
      }
    } catch (err) {
      console.error("[twitch] streams request threw:", (err as Error).message);
    }
  }

  return all;
}
