// src/lib/pro/subscriptions.ts
//
// Capa de datos de la suscripción Pro (tabla pro_subscriptions, Supabase).
// Server-only. Las escrituras llegan SIEMPRE desde el webhook de Stripe
// (cliente admin); el resto de la app solo lee a través de isPro()/
// getEntitlements() en entitlement.ts.
//
// `profiles.is_premium` se mantiene sincronizada aquí como caché
// desnormalizada del estado de la suscripción: es la columna que ya leen
// Predicciones (isPremium) y los leaderboards para pintar la estrella.

import { adminClient } from "./admin";
import { clearEntitlementsCache } from "./cache";

export type ProPlan = "monthly" | "yearly";
export type ProStatus = "active" | "trialing" | "past_due" | "canceled";

export interface ProSubscriptionRow {
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: ProPlan;
  status: ProStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  currency: string | null;
  amount: number | null;
  created_at: string;
  updated_at: string;
}

/** ¿La suscripción da acceso Pro AHORA? past_due conserva el acceso hasta
 *  que venza el periodo ya pagado (gracia para reintentos de cobro). */
export function subscriptionIsActive(sub: Pick<ProSubscriptionRow, "status" | "current_period_end"> | null): boolean {
  if (!sub) return false;
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (sub.status === "past_due") {
    if (!sub.current_period_end) return false;
    return new Date(sub.current_period_end).getTime() > Date.now();
  }
  return false;
}

/** Lee la suscripción de un usuario (o null si nunca tuvo). */
export async function getSubscription(userId: string): Promise<ProSubscriptionRow | null> {
  if (!userId) return null;
  const admin = adminClient();
  const { data } = await admin
    .from("pro_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ProSubscriptionRow | null) ?? null;
}

/** Lookup inverso para eventos de webhook que solo traen el customer id. */
export async function getSubscriptionByCustomerId(customerId: string): Promise<ProSubscriptionRow | null> {
  if (!customerId) return null;
  const admin = adminClient();
  const { data } = await admin
    .from("pro_subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data as ProSubscriptionRow | null) ?? null;
}

export interface UpsertSubscriptionInput {
  userId: string;
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan: ProPlan;
  status: ProStatus;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  currency?: string | null;
  amount?: number | null;
}

/**
 * Crea/actualiza la suscripción de un usuario y sincroniza
 * profiles.is_premium + invalida la caché KV de entitlements.
 * Idempotente: el webhook puede entregar el mismo evento varias veces.
 */
export async function upsertSubscription(input: UpsertSubscriptionInput): Promise<void> {
  const admin = adminClient();
  const { error } = await admin.from("pro_subscriptions").upsert(
    {
      user_id: input.userId,
      email: input.email.toLowerCase().trim(),
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      plan: input.plan,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      currency: input.currency ?? null,
      amount: input.amount ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`pro_subscriptions upsert failed: ${error.message}`);

  await syncIsPremiumFlag(input.userId);
  await clearEntitlementsCache(input.userId);
}

/**
 * Actualiza solo el estado vivo (eventos subscription.updated/deleted).
 * Devuelve false si no existe fila para ese subscription id (evento huérfano).
 */
export async function updateSubscriptionStatus(opts: {
  stripeSubscriptionId: string;
  status: ProStatus;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<boolean> {
  const admin = adminClient();
  const { data, error } = await admin
    .from("pro_subscriptions")
    .update({
      status: opts.status,
      ...(opts.currentPeriodEnd !== undefined ? { current_period_end: opts.currentPeriodEnd } : {}),
      ...(opts.cancelAtPeriodEnd !== undefined ? { cancel_at_period_end: opts.cancelAtPeriodEnd } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", opts.stripeSubscriptionId)
    .select("user_id")
    .maybeSingle();
  if (error) throw new Error(`pro_subscriptions update failed: ${error.message}`);
  if (!data) return false;

  const userId = (data as { user_id: string }).user_id;
  await syncIsPremiumFlag(userId);
  await clearEntitlementsCache(userId);
  return true;
}

/** Recalcula profiles.is_premium desde el estado actual de la suscripción. */
async function syncIsPremiumFlag(userId: string): Promise<void> {
  const sub = await getSubscription(userId);
  const admin = adminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_premium: subscriptionIsActive(sub) })
    .eq("id", userId);
  if (error) {
    // No tiramos: la fuente de verdad (pro_subscriptions) ya quedó bien y
    // isPro() no depende de esta caché. Solo lo dejamos registrado.
    console.warn("[pro] no pude sincronizar profiles.is_premium", userId, error.message);
  }
}
