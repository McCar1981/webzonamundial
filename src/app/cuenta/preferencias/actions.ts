"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updatePreferencesAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const flag = (k: string) => formData.get(k) === "1";

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      email_digest: flag("email_digest"),
      push_news: flag("push_news"),
      push_matches: flag("push_matches"),
      push_leagues: flag("push_leagues"),
      push_creators: flag("push_creators"),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[preferences] update error:", error.message);
    return { ok: false, error: "Error guardando preferencias" };
  }

  revalidatePath("/cuenta/preferencias");
  return { ok: true };
}
