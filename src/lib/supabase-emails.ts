// src/lib/supabase-emails.ts
//
// Lista los emails de TODOS los usuarios reales para envíos masivos (newsletter).
// Los emails viven en auth.users (Supabase Auth), NO en profiles (que no tiene
// columna email), así que se leen con el cliente admin (service role) vía
// auth.admin.listUsers, que pagina por número de página (perPage máx. 1000).
// Solo se incluyen usuarios con email confirmado.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — supabase-emails requires server-only admin",
    );
  }
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

/**
 * Emails (minúsculas, únicos) de todos los usuarios con email confirmado.
 * ~2.500 usuarios = 3 páginas de 1000. MAX_PAGES es un cortafuegos defensivo.
 */
export async function listSupabaseUserEmails(): Promise<string[]> {
  const admin = getAdmin();
  const emails: string[] = [];
  const perPage = 1000; // máximo que admite listUsers
  const MAX_PAGES = 60; // backstop (~60k usuarios)

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    for (const u of data.users) {
      // Solo usuarios con email válido y confirmado (no invitados a medias).
      if (u.email && u.email_confirmed_at) {
        emails.push(u.email.toLowerCase().trim());
      }
    }
    if (data.users.length < perPage) break; // última página
    if (page === MAX_PAGES) {
      console.error("[supabase-emails] alcanzado MAX_PAGES; lista posiblemente incompleta");
    }
  }
  return Array.from(new Set(emails));
}
