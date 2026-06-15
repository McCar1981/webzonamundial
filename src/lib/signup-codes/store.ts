// src/lib/signup-codes/store.ts
//
// Códigos de captación (campaña / embajador / sponsor). Capa de datos
// server-only: TODO el acceso va con el service-role client (las tablas
// signup_codes / signup_code_redemptions tienen RLS sin policies, igual que
// coin_ledger). Ver scripts/sql/2026-39-signup-codes.sql.
//
// Estrategia paralela a los creadores: el usuario se registra con un código y
// se reparte recompensa en Fútcoins al nuevo usuario y al dueño del código.

import "server-only";
import { adminClient } from "@/lib/predictions/admin";

/** Normaliza un código a MAYÚSCULAS y solo [A-Z0-9-]. "" si queda vacío. */
export function normalizeSignupCode(input: string | null | undefined): string {
  return (input ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

export interface SignupCodeRow {
  code: string;
  label: string | null;
  owner_user_id: string | null;
  reward_new_user: number;
  reward_owner: number;
  active: boolean;
  max_uses: number | null;
  uses_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Datos públicos de un código (para mostrar el bono en el formulario). */
export interface PublicCodeInfo {
  valid: boolean;
  code: string;
  label: string | null;
  rewardNewUser: number;
}

export type RedeemStatus = "ok" | "already" | "invalid" | "exhausted" | "error";

export interface RedeemResult {
  status: RedeemStatus;
  awardedNewUser: number;
  awardedOwner: number;
}

/**
 * Valida un código y devuelve SOLO lo público (sin dueño): si existe, está
 * activo y no agotado, y cuántas Fútcoins de bienvenida da. Se usa en el
 * formulario/landing para enseñar el bono ANTES de registrarse.
 */
export async function getPublicCodeInfo(input: string): Promise<PublicCodeInfo> {
  const code = normalizeSignupCode(input);
  if (!code) return { valid: false, code: "", label: null, rewardNewUser: 0 };
  try {
    const admin = adminClient();
    const { data } = await admin
      .from("signup_codes")
      .select("code,label,reward_new_user,active,max_uses,uses_count")
      .eq("code", code)
      .maybeSingle();
    const row = data as
      | Pick<SignupCodeRow, "code" | "label" | "reward_new_user" | "active" | "max_uses" | "uses_count">
      | null;
    if (!row || !row.active) return { valid: false, code, label: null, rewardNewUser: 0 };
    if (row.max_uses != null && row.uses_count >= row.max_uses) {
      return { valid: false, code, label: row.label, rewardNewUser: 0 };
    }
    return { valid: true, code, label: row.label, rewardNewUser: row.reward_new_user };
  } catch {
    return { valid: false, code, label: null, rewardNewUser: 0 };
  }
}

/**
 * Canjea el código para un usuario ya autenticado (tras confirmar la cuenta).
 * Es ATÓMICO e IDEMPOTENTE vía la RPC redeem_signup_code: una sola fila de
 * canje por usuario garantiza que las Fútcoins se abonan exactamente una vez.
 * Best-effort: cualquier fallo devuelve status 'error' sin lanzar.
 */
export async function redeemSignupCode(userId: string, code: string): Promise<RedeemResult> {
  const norm = normalizeSignupCode(code);
  if (!userId || !norm) return { status: "invalid", awardedNewUser: 0, awardedOwner: 0 };
  try {
    const admin = adminClient();
    const { data, error } = await admin.rpc("redeem_signup_code", {
      p_user_id: userId,
      p_code: norm,
    });
    if (error) {
      console.error("[signup-codes] redeem rpc error:", error.message);
      return { status: "error", awardedNewUser: 0, awardedOwner: 0 };
    }
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : null;
    const status = (row?.status as RedeemStatus) ?? "error";
    return {
      status,
      awardedNewUser: Number(row?.awarded_new_user ?? 0),
      awardedOwner: Number(row?.awarded_owner ?? 0),
    };
  } catch (e) {
    console.error("[signup-codes] redeem threw:", e instanceof Error ? e.message : e);
    return { status: "error", awardedNewUser: 0, awardedOwner: 0 };
  }
}

// ───────────────────────────── Admin CRUD ──────────────────────────────────

export interface CodeWithOwner extends SignupCodeRow {
  owner_email: string | null;
}

/** Lista todos los códigos (más recientes primero) con el email del dueño. */
export async function listCodes(): Promise<CodeWithOwner[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("signup_codes")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as SignupCodeRow[];

  // Resolver email del dueño (si lo hay) vía RPC, sin exponer auth.users.
  const out: CodeWithOwner[] = [];
  for (const r of rows) {
    let owner_email: string | null = null;
    if (r.owner_user_id) {
      const { data: em } = await admin.rpc("get_email_by_user_id", { p_user_id: r.owner_user_id });
      owner_email = typeof em === "string" ? em : null;
    }
    out.push({ ...r, owner_email });
  }
  return out;
}

/** Resuelve el user_id de un email (dueño del código). null si no tiene cuenta. */
export async function resolveOwnerByEmail(email: string): Promise<string | null> {
  const clean = email.trim().toLowerCase();
  if (!clean) return null;
  const admin = adminClient();
  const { data } = await admin.rpc("get_user_id_by_email", { p_email: clean });
  return typeof data === "string" && data ? data : null;
}

export interface CodeUpsertInput {
  code: string;
  label: string | null;
  owner_user_id: string | null;
  reward_new_user: number;
  reward_owner: number;
  active: boolean;
  max_uses: number | null;
  notes: string | null;
}

/** Crea un código nuevo. Falla si el código ya existe. */
export async function createCode(
  input: CodeUpsertInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeSignupCode(input.code);
  if (code.length < 3) return { ok: false, error: "El código debe tener al menos 3 caracteres válidos (A-Z, 0-9, guion)." };
  const admin = adminClient();
  const { error } = await admin.from("signup_codes").insert({
    code,
    label: input.label,
    owner_user_id: input.owner_user_id,
    reward_new_user: input.reward_new_user,
    reward_owner: input.reward_owner,
    active: input.active,
    max_uses: input.max_uses,
    notes: input.notes,
  });
  if (error) {
    if (/duplicate key|already exists|unique/i.test(error.message)) {
      return { ok: false, error: `El código ${code} ya existe.` };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Actualiza campos editables de un código existente (no cambia el code). */
export async function updateCode(
  code: string,
  patch: Partial<Omit<CodeUpsertInput, "code">>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const norm = normalizeSignupCode(code);
  if (!norm) return { ok: false, error: "Código no válido." };
  const admin = adminClient();
  const { error } = await admin
    .from("signup_codes")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("code", norm);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Activa/desactiva un código (no lo borra: conserva métricas y canjes). */
export async function setCodeActive(
  code: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateCode(code, { active });
}
