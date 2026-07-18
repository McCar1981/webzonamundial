"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { subscribe } from "@/lib/email-subscriptions";
import { getSeleccionBySlug } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import {
  isValidIsoDate,
  isAdult,
  validateCountry,
  validateFavTeam,
} from "@/lib/profile-validation";

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

  const countryRaw = (formData.get("country") as string | null)?.trim() || null;
  const fav_teamRaw = (formData.get("fav_team") as string | null)?.trim() || null;
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

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      country,
      fav_team,
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

  // Email de BIENVENIDA (no es un paso del registro: el usuario ya tiene
  // sesión). Lleva el resumen de su registro, incluido el creador si lo
  // eligió. Fire-and-forget: si SMTP falla no rompemos el onboarding.
  // Convertimos los slugs a nombres legibles antes de enviarlo.
  if (user.email) {
    const teamName = fav_team ? getSeleccionBySlug(fav_team)?.nombre ?? null : null;
    const countryName = country
      ? COUNTRIES.find((c) => c.code === country)?.name ?? null
      : null;
    void sendWelcomeEmail({
      to: user.email,
      username,
      countryName,
      teamName,
    });
    // Alta en el digest diario con el user_id REAL. Es lo que habilita que el
    // digest y los emails por-usuario (recordatorio de racha) lleguen al
    // usuario: sin esta fila con user_id, el canal email queda mudo (los OAuth
    // no pasan por la auto-suscripción de /api/registro). Idempotente + RGPD
    // (baja en el footer y en /cuenta/notificaciones).
    void subscribe({
      email: user.email,
      userId: user.id,
      kind: "daily-digest",
      source: "onboarding",
    });
  }

  revalidatePath("/");
  return { ok: true };
}

export async function skipOnboardingAction(next?: string) {
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

  // Bienvenida + alta en el digest TAMBIÉN para quien salta el wizard: sin
  // esto, el que pulsa "Saltar" se quedaba sin NINGÚN email de ciclo de vida
  // (ni bienvenida ni digest). Best-effort: un fallo de email no rompe el skip.
  if (user.email) {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      const username =
        (prof?.username as string | null)?.trim() || user.email.split("@")[0];
      await sendWelcomeEmail({ to: user.email, username });
      await subscribe({
        email: user.email,
        userId: user.id,
        kind: "daily-digest",
        source: "onboarding-skip",
      });
    } catch {
      // no-op: la bienvenida/alta es best-effort, no debe bloquear el skip
    }
  }

  // Respetar el destino pedido antes de loguearse (p. ej. volver a la peña
  // del bar para completar la unión). Same-origin only: nunca open-redirect.
  // Defensa doble: startsWith("/") + !startsWith("//") bloquea protocol-relative.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
}
