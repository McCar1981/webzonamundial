"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { getCreadorBySlug } from "@/data/creadores";
import { getSeleccionBySlug } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import {
  isValidIsoDate,
  isAdult,
  validateCountry,
  validateFavTeam,
  validateFavCreator,
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
  const fav_creatorRaw = (formData.get("fav_creator") as string | null)?.trim() || null;
  const localeRaw = (formData.get("locale") as string | null)?.trim() ?? "es";
  const locale = localeRaw === "en" ? "en" : "es";
  const birth_date = (formData.get("birth_date") as string | null)?.trim() || null;

  // Validar birth_date: ISO real + mayoría de edad (18+)
  if (!isValidIsoDate(birth_date)) {
    return { ok: false, error: "Fecha de nacimiento inválida" };
  }
  if (birth_date && !isAdult(birth_date)) {
    return {
      ok: false,
      error:
        "Para optar a premios debes ser mayor de 18 años. Si no lo eres, deja la fecha vacía y continúa.",
    };
  }

  // Perfil actual: el pre-registro web ya guardó país/selección/creador
  // (trigger handle_new_user). Sin este merge, un campo que el usuario no
  // re-seleccionara en el wizard se escribía como NULL y machacaba el dato
  // bueno del registro — p.ej. la selección favorita desaparecía y el email
  // de bienvenida salía sin esa fila.
  const { data: existing } = await supabase
    .from("profiles")
    .select("country, fav_team, fav_creator, birth_date")
    .eq("id", user.id)
    .maybeSingle();

  // Validar contra catálogo — valores no encontrados se descartan y, si el
  // formulario vino vacío, se conserva lo que ya hubiera en el perfil.
  const country = validateCountry(countryRaw) ?? existing?.country ?? null;
  const fav_team = validateFavTeam(fav_teamRaw) ?? existing?.fav_team ?? null;
  const fav_creator =
    validateFavCreator(fav_creatorRaw) ?? existing?.fav_creator ?? null;
  const birthDateFinal = birth_date ?? existing?.birth_date ?? null;

  // upsert + select: con update() a secas, si la fila de profiles no
  // existía (trigger caído o usuario anterior al trigger) se afectaban 0
  // filas SIN error → devolvíamos ok:true, mandábamos el email de
  // bienvenida y onboarded_at nunca quedaba marcado, así que el wizard
  // volvía a aparecer en cada login pidiendo todo "otra vez". El select
  // confirma que la fila quedó escrita de verdad.
  const { data: saved, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username,
        country,
        fav_team,
        fav_creator,
        locale,
        birth_date: birthDateFinal,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("id")
    .maybeSingle();

  if (error || !saved) {
    if (
      error &&
      (error.message.includes("duplicate") || error.message.includes("unique"))
    ) {
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
    const creatorName = fav_creator ? getCreadorBySlug(fav_creator)?.nombre ?? null : null;
    const countryName = country
      ? COUNTRIES.find((c) => c.code === country)?.name ?? null
      : null;
    void sendWelcomeEmail({
      to: user.email,
      username,
      countryName,
      teamName,
      creatorName,
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
  // siempre puede ir a /cuenta luego. upsert: si la fila de profiles no
  // existe, update() afectaría 0 filas en silencio y el wizard volvería
  // a salir en cada login.
  await supabase
    .from("profiles")
    .upsert(
      { id: user.id, onboarded_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  // Respetar el destino pedido antes de loguearse (p. ej. volver a la peña
  // del bar para completar la unión). Same-origin only: nunca open-redirect.
  // Defensa doble: startsWith("/") + !startsWith("//") bloquea protocol-relative.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
}
