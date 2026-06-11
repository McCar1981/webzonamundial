"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isValidIsoDate,
  isAdult,
  validateCountry,
  validateFavTeam,
  validateFavCreator,
} from "@/lib/profile-validation";

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

  const countryRaw = (formData.get("country") as string | null)?.trim() || null;
  const fav_teamRaw = (formData.get("fav_team") as string | null)?.trim() || null;
  const fav_creatorRaw = (formData.get("fav_creator") as string | null)?.trim() || null;
  const localeRaw = (formData.get("locale") as string | null)?.trim() ?? "es";
  const locale = localeRaw === "en" ? "en" : "es";
  const birth_date = (formData.get("birth_date") as string | null)?.trim() || null;

  // Validar birth_date: ISO real + mayoría de edad (18+)
  if (!isValidIsoDate(birth_date)) {
    return { ok: false, error: "Fecha de nacimiento inválida" };
  }
  if (birth_date && !isAdult(birth_date)) {
    return { ok: false, error: "Debes ser mayor de edad (18+) para registrar la fecha de nacimiento" };
  }

  // Validar contra catálogo — valores no encontrados se descartan (null)
  const country = validateCountry(countryRaw);
  const fav_team = validateFavTeam(fav_teamRaw);
  const fav_creator = validateFavCreator(fav_creatorRaw);

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

/**
 * Cambia el email del usuario autenticado.
 *
 * Seguridad: exige que la sesión sea reciente (last_sign_in_at < 10 min)
 * para mitigar secuestro de cuenta en dispositivos ajenos donde la
 * sesión quedó abierta.
 */
const REAUTH_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

export async function updateEmailAction(formData: FormData): Promise<ActionResult> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  // Reautenticación: el último sign-in debe ser reciente.
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).getTime()
    : Date.now();
  if (Date.now() - lastSignIn > REAUTH_WINDOW_MS) {
    return {
      ok: false,
      error:
        "Por seguridad, cierra sesión y vuelve a entrar antes de cambiar tu email.",
    };
  }

  const newEmailRaw = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const currentEmail = user.email ?? "";

  // Validaciones básicas
  if (!newEmailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailRaw)) {
    return { ok: false, error: "Email inválido" };
  }
  if (newEmailRaw === currentEmail.toLowerCase()) {
    return { ok: false, error: "Es el mismo email actual" };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmailRaw });
  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    error:
      "Te enviamos un email a la nueva dirección. Confírmalo para activar el cambio.",
  };
}

export async function deleteAccountAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Borrar el usuario de auth.users requiere service_role.
  // En lugar de un self-fetch frágil (que puede fallar si
  // NEXT_PUBLIC_SITE_URL está mal o las cookies no viajan),
  // creamos el admin client directamente en esta server action.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userEmail = user.email ?? "";

  // 1. Borrado explícito GDPR — tablas sin FK cascade a auth.users
  if (userEmail) {
    const { error: unsubErr } = await admin
      .from("email_subscriptions")
      .delete()
      .eq("email", userEmail);
    if (unsubErr) {
      console.warn("[deleteAccountAction] email_subscriptions cleanup:", unsubErr.message);
    }
  }

  const { error: prefErr } = await admin
    .from("user_preferences")
    .delete()
    .eq("user_id", user.id);
  if (prefErr) {
    console.warn("[deleteAccountAction] user_preferences cleanup:", prefErr.message);
  }

  // 2. Limpieza de avatares en storage
  try {
    const { data: list } = await admin.storage.from("avatars").list(user.id);
    if (list && list.length > 0) {
      const paths = list.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("avatars").remove(paths);
    }
  } catch (err) {
    console.warn("[deleteAccountAction] avatar cleanup failed:", (err as Error).message);
  }

  // 3. Borrar de auth.users (cascade limpia profiles, predictions, etc.)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccountAction] deleteUser error:", error.message);
    throw new Error("Error eliminando la cuenta");
  }

  // 4. Limpiar sesión + redirect a home
  await supabase.auth.signOut();
  redirect("/");
}
