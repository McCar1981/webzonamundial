// src/lib/stories/current-user.ts
//
// Wrapper tolerante de getCurrentUser para las rutas de Stories.
//
// getCurrentUser() LANZA si faltan las env vars de Supabase (caso del entorno
// local, donde NEXT_PUBLIC_SUPABASE_ANON_KEY está vacía). En Stories queremos
// que el feed/visor funcionen como anónimo en ese caso (modo demo), no un 500.
// En producción las env existen, así que se comporta igual que getCurrentUser.

import { getCurrentUser } from "@/lib/auth-helpers";

export async function safeCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}
