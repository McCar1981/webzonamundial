import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
