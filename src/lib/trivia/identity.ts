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
  /** Email de Supabase del usuario autenticado ("" si es invitado/anon).
   *  Lo necesita el gate Pro (isPro) para resolver entitlements por email. */
  authEmail: string;
  name: string;
}

/**
 * Valida que un anonId tenga EXACTAMENTE el formato que genera el cliente
 * (`anon-<alfanumérico>`, ver ensureAnonId en TriviaGame.tsx).
 *
 * Es una defensa de seguridad, no una validación cosmética: el `userId` de un
 * usuario autenticado es su UUID de Supabase (con guiones) y viaja en el ranking
 * público. Sin esta comprobación, un atacante podía mandar `anonId = <UUID de la
 * víctima>` y, al cerrar la partida, sumar puntos a las stats de esa víctima e
 * incluso renombrarla en el leaderboard. El prefijo obligatorio "anon-" y la
 * ausencia de guiones internos hacen imposible colisionar con un UUID real.
 */
export function isValidAnonId(raw: string): boolean {
  return /^anon-[a-z0-9]{6,64}$/i.test(raw);
}

export async function resolveIdentity(
  bodyName?: string,
  anonId?: string,
): Promise<TriviaIdentity> {
  let userId = "";
  let authUserId = "";
  let authEmail = "";
  let name = (bodyName || "").trim().slice(0, 24);

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      authUserId = user.id;
      authEmail = user.email ?? "";
      // Para un usuario AUTENTICADO el nombre del ranking sale SIEMPRE de su
      // perfil, nunca del nombre que manda el cliente: así un alias viejo cacheado
      // en localStorage (zm_trivia_name) no puede suplantar al username real de la
      // cuenta (p. ej. mostrar "Mccar81" cuando la cuenta es "sprintmarkt").
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      name =
        (profile?.username as string) || user.email?.split("@")[0] || "Jugador";
    }
  } catch {
    /* sin sesión supabase → anon */
  }

  if (!userId) {
    const raw = (anonId || "").trim();
    // Solo aceptamos el anonId si tiene el formato del cliente. Cualquier otra
    // cosa (incluido el UUID de otro usuario) se descarta → identidad vacía, que
    // /finish trata como "no registrar en ranking".
    if (isValidAnonId(raw)) {
      userId = raw;
      name = name || "Anónimo";
    }
  }

  return { userId, authUserId, authEmail, name };
}
