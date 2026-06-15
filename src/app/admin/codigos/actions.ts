"use server";

// Acciones del panel ADMIN de códigos de captación (/admin/codigos).
// Autorización: cookie admin firmada (zm_admin). El middleware ya protege
// /admin/codigos, pero revalidamos aquí por defensa en profundidad (las
// server actions son endpoints públicos por sí mismas).

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import {
  createCode,
  updateCode,
  setCodeActive,
  resolveOwnerByEmail,
  normalizeSignupCode,
} from "@/lib/signup-codes/store";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(): Promise<boolean> {
  const cookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!cookie && (await isValidAdminCookie(cookie));
}

function intField(formData: FormData, key: string, fallback: number): number {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return fallback;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? n : fallback;
}

function nullableInt(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Resuelve owner_user_id a partir del email del dueño (o null si no hay). */
async function resolveOwner(
  formData: FormData,
): Promise<{ owner_user_id: string | null } | { error: string }> {
  const email = String(formData.get("owner_email") ?? "").trim().toLowerCase();
  if (!email) return { owner_user_id: null };
  if (!EMAIL_RE.test(email)) return { error: "El email del dueño no es válido." };
  const id = await resolveOwnerByEmail(email);
  if (!id) {
    return {
      error: `No hay ninguna cuenta ZM con el email ${email}. El dueño debe registrarse primero para poder cobrar Fútcoins.`,
    };
  }
  return { owner_user_id: id };
}

function parseRewards(formData: FormData): { reward_new_user: number; reward_owner: number } | { error: string } {
  const reward_new_user = intField(formData, "reward_new_user", 0);
  const reward_owner = intField(formData, "reward_owner", 0);
  if (reward_new_user < 0 || reward_new_user > 100000) return { error: "El bono al nuevo usuario debe estar entre 0 y 100000." };
  if (reward_owner < 0 || reward_owner > 100000) return { error: "El bono al dueño debe estar entre 0 y 100000." };
  return { reward_new_user, reward_owner };
}

export async function createCodeAction(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Sesión admin caducada." };

  const code = normalizeSignupCode(String(formData.get("code") ?? ""));
  if (code.length < 3) return { ok: false, error: "El código debe tener al menos 3 caracteres (A-Z, 0-9, guion)." };

  const owner = await resolveOwner(formData);
  if ("error" in owner) return { ok: false, error: owner.error };

  const rewards = parseRewards(formData);
  if ("error" in rewards) return { ok: false, error: rewards.error };

  const res = await createCode({
    code,
    label: String(formData.get("label") ?? "").trim().slice(0, 80) || null,
    owner_user_id: owner.owner_user_id,
    reward_new_user: rewards.reward_new_user,
    reward_owner: rewards.reward_owner,
    active: formData.get("active") === "on",
    max_uses: nullableInt(formData, "max_uses"),
    notes: String(formData.get("notes") ?? "").trim().slice(0, 600) || null,
  });
  if (!res.ok) return res;

  revalidatePath("/admin/codigos");
  return { ok: true };
}

export async function updateCodeAction(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Sesión admin caducada." };

  const code = normalizeSignupCode(String(formData.get("code") ?? ""));
  if (!code) return { ok: false, error: "Código no válido." };

  const owner = await resolveOwner(formData);
  if ("error" in owner) return { ok: false, error: owner.error };

  const rewards = parseRewards(formData);
  if ("error" in rewards) return { ok: false, error: rewards.error };

  const res = await updateCode(code, {
    label: String(formData.get("label") ?? "").trim().slice(0, 80) || null,
    owner_user_id: owner.owner_user_id,
    reward_new_user: rewards.reward_new_user,
    reward_owner: rewards.reward_owner,
    active: formData.get("active") === "on",
    max_uses: nullableInt(formData, "max_uses"),
    notes: String(formData.get("notes") ?? "").trim().slice(0, 600) || null,
  });
  if (!res.ok) return res;

  revalidatePath("/admin/codigos");
  return { ok: true };
}

export async function toggleCodeAction(formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Sesión admin caducada." };
  const code = normalizeSignupCode(String(formData.get("code") ?? ""));
  if (!code) return { ok: false, error: "Código no válido." };
  const active = String(formData.get("next_active") ?? "") === "true";
  const res = await setCodeActive(code, active);
  if (!res.ok) return res;
  revalidatePath("/admin/codigos");
  return { ok: true };
}
