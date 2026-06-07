// src/lib/trivia/identity.ts
//
// Resuelve la identidad del jugador para la trivia: usuario de Supabase si hay
// sesión, si no el anonId que envía el cliente. Compartido por /start (excluir
// preguntas ya vistas) y /finish (registrar ranking + marcar vistas).

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface TriviaIdentity {
  userId: string; // "" si no hay identidad (ni login ni anonId)
  /** Id de Supabase SOLO si el usuario está autenticado ("" si es invitado/anon).
   *  Es el único caso en que se puede abonar la billetera (tabla profiles). */
  authUserId: string;
  name: string;
}

export async function resolveIdentity(
  bodyName?: string,
  anonId?: string,
): Promise<TriviaIdentity> {
  let userId = "";
  let authUserId = "";
  let name = (bodyName || "").trim().slice(0, 24);

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      authUserId = user.id;
      if (!name) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        name =
          (profile?.username as string) || user.email?.split("@")[0] || "Jugador";
      }
    }
  } catch {
    /* sin sesión supabase → anon */
  }

  if (!userId) {
    userId = (anonId || "").trim().slice(0, 40);
    if (userId) name = name || "Anónimo";
  }

  return { userId, authUserId, name };
}
