// src/lib/predictions/admin.ts
//
// Cliente Supabase con SERVICE ROLE KEY (bypassa RLS). Solo servidor.
// Lo comparten el store de predicciones y el de gamificación para escrituras
// cruzadas (resolución, ligas, duelos, otorgar XP/monedas).

import { createClient } from "@supabase/supabase-js";

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing — predictions admin ops require server-only admin");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
