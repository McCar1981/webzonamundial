"use server";

// Acciones del panel del CREADOR (/admin raíz).
// Autorización: sesión Supabase cuyo email esté vinculado y activo en
// creator_program. El slug se toma SIEMPRE del vínculo del servidor, nunca
// del formulario.

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { creatorsAdminClient, getCreatorByEmail } from "@/lib/creators/program";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const MAX_LEADS_ABIERTOS = 20;

export async function submitSponsorLead(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, error: "Sesión caducada. Vuelve a entrar." };

    const creator = await getCreatorByEmail(user.email);
    if (!creator || !creator.active) {
      return { ok: false, error: "Tu cuenta no está vinculada al programa de creadores." };
    }

    const empresa = String(formData.get("empresa") ?? "").trim().slice(0, 120);
    const contacto = String(formData.get("contacto") ?? "").trim().slice(0, 160);
    const notas = String(formData.get("notas") ?? "").trim().slice(0, 600);
    if (empresa.length < 2) return { ok: false, error: "Indica el nombre de la marca." };

    const admin = creatorsAdminClient();

    // Tope suave de leads abiertos para evitar spam accidental.
    const { count } = await admin
      .from("creator_sponsors")
      .select("id", { count: "exact", head: true })
      .eq("creator_slug", creator.slug)
      .in("estado", ["propuesto", "en_conversacion"]);
    if ((count ?? 0) >= MAX_LEADS_ABIERTOS) {
      return { ok: false, error: "Tienes demasiadas propuestas abiertas. Escríbenos directamente." };
    }

    const { error } = await admin.from("creator_sponsors").insert({
      creator_slug: creator.slug,
      empresa,
      contacto: contacto || null,
      notas: notas || null,
      estado: "propuesto",
    });
    if (error) return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo." };

    revalidatePath("/admin");
    revalidatePath("/admin/creadores");
    return { ok: true };
  } catch {
    return { ok: false, error: "Error inesperado. Inténtalo de nuevo." };
  }
}
