"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  error?: string;
}

function sanitizeUsername(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

/**
 * Guarda perfil + marca onboarded_at en una sola tx.
 * Tras éxito redirige a / (home) — el wizard ya no debe volver a verse.
 */
export async function completeOnboardingAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const usernameRaw = (formData.get("username") as string | null)?.trim() ?? "";
  const username = sanitizeUsername(usernameRaw);
  if (username.length < 3) {
    return {
      ok: false,
      error: "El nombre de usuario debe tener al menos 3 caracteres válidos.",
    };
  }

  const country =
    ((formData.get("country") as string | null)?.trim() || null) as string | null;
  const fav_team =
    ((formData.get("fav_team") as string | null)?.trim() || null) as string | null;
  const fav_creator =
    ((formData.get("fav_creator") as string | null)?.trim() || null) as string | null;
  const localeRaw = (formData.get("locale") as string | null)?.trim() ?? "es";
  const locale = localeRaw === "en" ? "en" : "es";
  const birth_date = (formData.get("birth_date") as string | null)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      country,
      fav_team,
      fav_creator,
      locale,
      birth_date,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { ok: false, error: "Ese nombre de usuario ya está en uso." };
    }
    return { ok: false, error: "Error guardando tu perfil. Inténtalo de nuevo." };
  }

  // Crear preferencias por defecto si aún no existen
  await supabase.from("user_preferences").upsert(
    { user_id: user.id },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  revalidatePath("/");
  return { ok: true };
}

export async function skipOnboardingAction() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Marcar como onboarded sin pedir datos adicionales. El usuario
  // siempre puede ir a /cuenta luego.
  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/");
}
