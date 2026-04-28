"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server Actions del área /cuenta.
 *
 * Diseño:
 *   - Cada acción valida sesión vía supabase.auth.getUser() (no
 *     confiamos en el form data — el user_id viene SIEMPRE de la
 *     sesión cookie).
 *   - RLS garantiza que aunque pasaras otro id, no podrías escribir
 *     en otro perfil. Defensa en profundidad.
 *   - Devuelven { ok: true } | { error: string } para que el client
 *     component muestre feedback inline.
 */

interface ActionResult {
  ok: boolean;
  error?: string;
}

function sanitizeUsername(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

function isValidIsoDate(input: string | null): boolean {
  if (!input) return true; // vacío = no birth_date
  return /^\d{4}-\d{2}-\d{2}$/.test(input);
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const usernameRaw = (formData.get("username") as string | null)?.trim() ?? "";
  const username = sanitizeUsername(usernameRaw);
  if (username.length < 3) {
    return { ok: false, error: "El username debe tener al menos 3 caracteres (a-z, 0-9, _)" };
  }

  const country = ((formData.get("country") as string | null)?.trim() || null) as string | null;
  const fav_team = ((formData.get("fav_team") as string | null)?.trim() || null) as string | null;
  const fav_creator = ((formData.get("fav_creator") as string | null)?.trim() || null) as string | null;
  const localeRaw = (formData.get("locale") as string | null)?.trim() ?? "es";
  const locale = localeRaw === "en" ? "en" : "es";
  const birth_date = (formData.get("birth_date") as string | null)?.trim() || null;

  if (!isValidIsoDate(birth_date)) {
    return { ok: false, error: "Fecha de nacimiento inválida (formato YYYY-MM-DD)" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      country,
      fav_team,
      fav_creator,
      locale,
      birth_date,
    })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { ok: false, error: "Ese username ya está en uso" };
    }
    return { ok: false, error: "Error guardando el perfil. Inténtalo de nuevo." };
  }

  revalidatePath("/cuenta");
  return { ok: true };
}

export async function markOnboardedAction(): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Error completando onboarding" };

  revalidatePath("/cuenta");
  return { ok: true };
}

export async function deleteAccountAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Borrar el usuario de auth.users requiere service_role. Lo
  // delegamos a un endpoint server-only que sí tiene la clave.
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/account/delete`,
    {
      method: "POST",
      headers: { "x-user-id": user.id },
      // Pasamos cookies para que la request quede ligada al usuario.
      // En App Router las cookies no se reenvían por defecto en fetch
      // server-side, así que el endpoint también valida con el cliente
      // SSR de Supabase.
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Error eliminando la cuenta");
  }

  // Limpiar sesión + redirect a home
  await supabase.auth.signOut();
  redirect("/");
}
