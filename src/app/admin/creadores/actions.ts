"use server";

// Acciones del dashboard ADMIN del programa de creadores.
// Autorización: cookie admin firmada (zm_admin). El middleware ya protege
// /admin/creadores, pero revalidamos aquí por defensa en profundidad (las
// server actions son endpoints públicos por sí mismas).

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { creatorsAdminClient } from "@/lib/creators/program";
import type { ActionResult } from "../actions";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,29}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!cookie && (await isValidAdminCookie(cookie));
}

function num(formData: FormData, key: string): number {
  return Number(String(formData.get(key) ?? "").replace(",", "."));
}

function parseCreatorFields(formData: FormData): { fields: Record<string, unknown> } | { error: string } {
  const display_name = String(formData.get("display_name") ?? "").trim().slice(0, 80);
  if (display_name.length < 2) return { error: "El nombre es obligatorio." };

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  if (emailRaw && !EMAIL_RE.test(emailRaw)) return { error: "Email de acceso no válido." };

  const nivel = num(formData, "nivel");
  if (![2, 3, 4].includes(nivel)) return { error: "Nivel no válido (2–4)." };

  const rev_share_pct = num(formData, "rev_share_pct");
  if (!Number.isFinite(rev_share_pct) || rev_share_pct < 0 || rev_share_pct > 100) {
    return { error: "Revenue share fuera de rango (0–100)." };
  }

  const bonus_threshold = num(formData, "bonus_threshold");
  if (!Number.isInteger(bonus_threshold) || bonus_threshold < 1) {
    return { error: "El umbral de registros debe ser un entero positivo." };
  }

  const bonus_unit_eur = num(formData, "bonus_unit_eur");
  if (!Number.isFinite(bonus_unit_eur) || bonus_unit_eur <= 0) {
    return { error: "El importe del bono debe ser mayor que 0." };
  }

  const bonus_cap_eur = num(formData, "bonus_cap_eur");
  if (!Number.isFinite(bonus_cap_eur) || bonus_cap_eur < 0) {
    return { error: "El techo mensual no puede ser negativo." };
  }

  // Ajuste manual de registros (offset, puede ser negativo). Ausente = 0.
  const registros_ajuste = num(formData, "registros_ajuste");
  if (!Number.isInteger(registros_ajuste) || Math.abs(registros_ajuste) > 100000) {
    return { error: "Ajuste de registros no válido (entero, máx ±100000)." };
  }

  return {
    fields: {
      display_name,
      email: emailRaw || null,
      nivel,
      rev_share_pct,
      bonus_threshold,
      bonus_unit_eur,
      bonus_cap_eur,
      audience_label: String(formData.get("audience_label") ?? "").trim().slice(0, 40) || null,
      registros_ajuste,
      active: formData.get("active") === "on",
      notes: String(formData.get("notes") ?? "").trim().slice(0, 600) || null,
    },
  };
}

function dbError(message: string): ActionResult {
  if (message.includes("duplicate") || message.includes("unique")) {
    return { ok: false, error: "Ya existe un creador con ese slug o ese email." };
  }
  return { ok: false, error: `Error de base de datos: ${message}` };
}

function revalidate() {
  revalidatePath("/admin");
  revalidatePath("/admin/creadores");
}

export async function createCreator(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "Slug no válido (minúsculas, números y guiones, 2–30)." };
  }
  const parsed = parseCreatorFields(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const admin = creatorsAdminClient();
  const { error } = await admin.from("creator_program").insert({ slug, ...parsed.fields });
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

export async function updateCreator(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const slug = String(formData.get("original_slug") ?? "").trim();
  if (!slug) return { ok: false, error: "Falta el creador a editar." };
  const parsed = parseCreatorFields(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const admin = creatorsAdminClient();
  const { error } = await admin
    .from("creator_program")
    .update({ ...parsed.fields, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

export async function recordPayment(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const creator_slug = String(formData.get("creator_slug") ?? "").trim();
  if (!creator_slug) return { ok: false, error: "Falta el creador." };

  const concepto = String(formData.get("concepto") ?? "bono");
  if (!["bono", "revenue_share", "patrocinio", "otro"].includes(concepto)) {
    return { ok: false, error: "Concepto no válido." };
  }

  const amount_eur = num(formData, "amount_eur");
  if (!Number.isFinite(amount_eur) || amount_eur <= 0) {
    return { ok: false, error: "Importe no válido." };
  }

  const periodoRaw = String(formData.get("periodo") ?? "").trim();
  if (periodoRaw && !/^\d{4}-\d{2}$/.test(periodoRaw)) {
    return { ok: false, error: "Periodo no válido (formato AAAA-MM)." };
  }

  const admin = creatorsAdminClient();
  const { error } = await admin.from("creator_payments").insert({
    creator_slug,
    concepto,
    periodo: periodoRaw || null,
    amount_eur,
    note: String(formData.get("note") ?? "").trim().slice(0, 300) || null,
  });
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

export async function deletePayment(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Falta el pago." };

  const admin = creatorsAdminClient();
  const { error } = await admin.from("creator_payments").delete().eq("id", id);
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

export async function updateSponsor(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Falta el patrocinador." };

  const estado = String(formData.get("estado") ?? "");
  if (!["propuesto", "en_conversacion", "cerrado", "descartado"].includes(estado)) {
    return { ok: false, error: "Estado no válido." };
  }

  const valorRaw = String(formData.get("valor_eur") ?? "").trim();
  let valor_eur: number | null = null;
  if (valorRaw) {
    valor_eur = Number(valorRaw.replace(",", "."));
    if (!Number.isFinite(valor_eur) || valor_eur < 0) {
      return { ok: false, error: "Valor del deal no válido." };
    }
  }

  const admin = creatorsAdminClient();
  const { error } = await admin
    .from("creator_sponsors")
    .update({
      estado,
      valor_eur,
      notas: String(formData.get("notas") ?? "").trim().slice(0, 600) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

export async function addSponsor(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const creator_slug = String(formData.get("creator_slug") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim().slice(0, 120);
  if (!creator_slug || empresa.length < 2) {
    return { ok: false, error: "Faltan datos del patrocinador." };
  }

  const admin = creatorsAdminClient();
  const { error } = await admin.from("creator_sponsors").insert({
    creator_slug,
    empresa,
    contacto: String(formData.get("contacto") ?? "").trim().slice(0, 160) || null,
    estado: "propuesto",
  });
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

// ── Managers (rol que ve la remuneración de todos los creadores, read-only) ──

export async function addManager(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Email no válido." };
  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || null;

  const admin = creatorsAdminClient();
  const { error } = await admin
    .from("creator_managers")
    .upsert({ email, name, active: true }, { onConflict: "email" });
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}

export async function removeManager(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Falta el email." };

  const admin = creatorsAdminClient();
  const { error } = await admin.from("creator_managers").delete().eq("email", email);
  if (error) return dbError(error.message);

  revalidate();
  return { ok: true };
}
