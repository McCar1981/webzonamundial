// src/lib/pro/admin.ts
//
// Cliente Supabase con SERVICE ROLE KEY (bypassa RLS). Solo servidor.
// Lo usan el store de suscripciones Pro (escrituras desde el webhook de
// Stripe) y la sincronización de profiles.is_premium.

import { createClient } from "@supabase/supabase-js";

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing — pro admin ops require server-only admin");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
