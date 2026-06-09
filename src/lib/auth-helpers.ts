import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { kv } from "@vercel/kv";

/**
 * Fail-closed cron guard.
 *
 * - Si CRON_SECRET no está configurado → 401 (no abre nunca).
 * - Solo acepta `Authorization: Bearer <CRON_SECRET>` (nunca query string).
 * - Comparación en tiempo constante (timing-safe).
 *
 * Uso al inicio de cada handler de cron:
 *   const denied = requireCron(req);
 *   if (denied) return denied;
 */
export function requireCron(req: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 401 });
  }

  const auth = req.headers.get("authorization") || "";
  const prefix = "Bearer ";
  if (!auth.startsWith(prefix)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = auth.slice(prefix.length);
  // Timing-safe comparison: equal-length buffers
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return null; // OK
}

/**
 * Rate-limit por userId usando KV (fixed-window).
 *
 * @param userId   ID del usuario (de sesión)
 * @param key      Namespace del endpoint (ej: "ia-coach:analyze")
 * @param limit    Máximo de peticiones permitidas en la ventana
 * @param windowSeconds  Duración de la ventana en segundos
 * @returns {limited: true} si se excedió el límite
 */
export async function rateLimitByUser(
  userId: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ limited: boolean; remaining: number }> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { limited: false, remaining: limit }; // degrada sin KV
  }
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const kvKey = `ratelimit:${key}:${userId}:${windowStart}`;

  try {
    const current = (await kv.get<number>(kvKey)) || 0;
    if (current >= limit) {
      return { limited: true, remaining: 0 };
    }
    await kv.set(kvKey, current + 1, { ex: windowSeconds });
    return { limited: false, remaining: limit - current - 1 };
  } catch {
    return { limited: false, remaining: limit }; // degrada en error KV
  }
}

/**
 * Server-side helper: requiere sesión activa.
 *
 * Si no hay sesión, redirige a /login?next=<ruta_actual_codificada>
 * Si hay sesión, devuelve el user.
 *
 * Uso típico en Server Components o Server Actions:
 *   const user = await requireUser("/cuenta");
 */
export async function requireUser(redirectFrom: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectFrom)}`);
  }

  return user;
}

export interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
  fav_team: string | null;
  fav_creator: string | null;
  locale: "es" | "en";
  birth_date: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Lee el profile del usuario autenticado. */
export async function getOwnProfile(): Promise<{
  user: { id: string; email: string | null };
  profile: ProfileRow | null;
}> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("not_authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile as ProfileRow | null,
  };
}

/**
 * Versión soft de getOwnProfile pensada para Route Handlers (API).
 * Devuelve null si no hay sesión activa en lugar de tirar/redirigir.
 * Usar en endpoints que tienen que responder JSON 401 al cliente.
 */
export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * Como getCurrentUser pero además resuelve el nombre de registro (profiles.username)
 * para que la IA pueda dirigirse al usuario por su nombre. Devuelve null si no hay
 * sesión. El nombre puede ser null si el usuario aún no completó el onboarding.
 *
 * Server-only: el nombre se obtiene de la sesión autenticada, NUNCA del cliente,
 * así no se puede falsear el saludo personalizado.
 */
export async function getCurrentUserWithName(): Promise<
  { id: string; email: string | null; name: string | null } | null
> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let name: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    const raw = (profile as { username?: string | null } | null)?.username ?? null;
    name = typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
  } catch {
    /* degrada: saludo genérico si la lectura del perfil falla */
  }

  return { id: user.id, email: user.email ?? null, name };
}
