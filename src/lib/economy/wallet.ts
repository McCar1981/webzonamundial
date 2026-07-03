// src/lib/economy/wallet.ts
//
// Billetera ÚNICA del universo ZM. Las Fútcoins (y el XP de progresión) viven en
// una sola fuente de verdad: la tabla `profiles` de Supabase (columnas coins/xp).
//
// Este módulo es deliberadamente NEUTRAL: cualquier juego (trivia, predicciones,
// fantasy, modo carrera, álbum…) acredita aquí sus recompensas en vez de llevar
// un saldo propio. Así "+X Fútcoins" significa lo mismo en toda la app y el saldo
// que ve el usuario es el mismo en el hub, en /cuenta y dentro de cada módulo.
//
// Las TASAS de INGRESO (cuántas Fútcoins por acción) viven en earn.ts y las de
// GASTO (precios de los sumideros) en spend.ts; este módulo solo PERSISTE el
// abono (grantCoins) y el cobro (spendCoins) en la fuente de verdad.

import { adminClient } from "@/lib/predictions/admin";
import { addSeasonXp } from "@/lib/predictions/gamification-store";

/** Módulo del universo ZM que GENERA un abono. Etiqueta el ledger para poder
 *  rankear "quién va primero" en cada módulo, todos en la misma moneda. */
export type CoinModule =
  | "predicciones"
  | "trivia"
  | "fantasy"
  | "modo-carrera"
  | "micro"
  | "draft-mundial"
  | "otros";

export interface WalletGrant {
  /** Fútcoins efectivamente acreditadas en esta operación. */
  coinsAwarded: number;
  /** XP de progresión efectivamente acreditado en esta operación. */
  xpAwarded: number;
  /** Saldo de Fútcoins resultante. */
  coins: number;
  /** XP total resultante. */
  xp: number;
}

export interface WalletSpend {
  /** true si el cobro se aplicó; false si el saldo era insuficiente. */
  ok: boolean;
  /** Saldo de Fútcoins resultante (el actual, sin cambios, si ok=false). */
  coins: number;
  /** Código de error cuando ok=false (insufficient_coins). */
  error?: "insufficient_coins";
}

/**
 * Acredita Fútcoins + XP a la billetera única de un usuario AUTENTICADO (uid = id
 * de Supabase; los invitados/anon no tienen fila en `profiles` y no se les puede
 * abonar). El XP de progresión también alimenta la pista de temporada del Battle
 * Pass, igual que en predicciones: así jugar a la trivia hace avanzar el pase.
 */
export async function grantCoins(
  uid: string,
  coins: number,
  xp: number,
  opts: { seasonXp?: boolean; module?: CoinModule } = {},
): Promise<WalletGrant> {
  const c = Math.max(0, Math.round(coins));
  const x = Math.max(0, Math.round(xp));
  const admin = adminClient();

  // Incremento ATÓMICO vía RPC (migración 2026-17): una sola sentencia UPDATE que
  // serializa la fila, así dos abonos simultáneos del mismo usuario no se pisan.
  let newCoins: number;
  let newXp: number;
  const { data: rpc, error: rpcErr } = await admin.rpc("increment_wallet", {
    p_uid: uid,
    p_coins: c,
    p_xp: x,
  });
  const row = Array.isArray(rpc) ? (rpc[0] as { coins?: number; xp?: number } | undefined) : null;
  if (!rpcErr && row && typeof row.coins === "number") {
    newCoins = row.coins;
    newXp = row.xp ?? 0;
  } else {
    // Fallback leer-sumar-escribir (no atómico) por si la migración aún no se ha
    // aplicado. Mantiene el comportamiento previo para no romper el abono.
    const { data } = await admin.from("profiles").select("coins,xp").eq("id", uid).maybeSingle();
    const prof = (data ?? {}) as { coins?: number; xp?: number };
    newCoins = (prof.coins ?? 0) + c;
    newXp = (prof.xp ?? 0) + x;
    await admin.from("profiles").update({ coins: newCoins, xp: newXp }).eq("id", uid);
  }

  if (x > 0 && opts.seasonXp !== false) await addSeasonXp(uid, x).catch(() => {});

  // Ledger (append-only): registra de QUÉ módulo salió este abono para los
  // rankings por módulo. Best-effort: si falla, el saldo ya quedó acreditado y el
  // ranking global (por profiles.coins) no depende de esto. Solo registramos si
  // hubo algo que ganar y se etiquetó un módulo.
  if ((c > 0 || x > 0) && opts.module) {
    await admin
      .from("coin_ledger")
      .insert({ user_id: uid, module: opts.module, coins: c, xp: x })
      .then(() => {}, () => {});
  }
  return { coinsAwarded: c, xpAwarded: x, coins: newCoins, xp: newXp };
}

/**
 * COBRA Fútcoins de la billetera única (el reverso de grantCoins). Es la PUERTA
 * ÚNICA de gasto del universo ZM: cualquier sumidero (boosts/cosméticos de
 * predicciones, pistas de trivia, chips extra de fantasy, refills de carrera…)
 * debe debitar AQUÍ en vez de tocar profiles.coins por su cuenta.
 *
 * El cobro es ATÓMICO y SEGURO ante concurrencia vía la RPC spend_wallet
 * (migración 2026-18): la comprobación de saldo y la deducción ocurren en la
 * misma sentencia, así dos compras simultáneas no pueden sobregastar (saldo
 * negativo). Si el saldo no alcanza, devuelve ok=false sin cobrar nada.
 *
 * IMPORTANTE: el GASTO no toca el XP ni la pista de temporada — el XP es
 * progresión y no se "consume". Solo se mueven Fútcoins.
 */
export async function spendCoins(uid: string, coins: number): Promise<WalletSpend> {
  const amount = Math.max(0, Math.round(coins));
  const admin = adminClient();

  const { data: rpc, error: rpcErr } = await admin.rpc("spend_wallet", {
    p_uid: uid,
    p_amount: amount,
  });
  const row = Array.isArray(rpc) ? (rpc[0] as { coins?: number } | undefined) : null;
  if (!rpcErr) {
    // RPC aplicada: si devolvió fila, el cobro se hizo; si no, saldo insuficiente.
    if (row && typeof row.coins === "number") return { ok: true, coins: row.coins };
    const { data } = await admin.from("profiles").select("coins").eq("id", uid).maybeSingle();
    const cur = ((data ?? {}) as { coins?: number }).coins ?? 0;
    return { ok: false, coins: cur, error: "insufficient_coins" };
  }

  // Fallback leer-comprobar-escribir (no atómico) por si la migración 2026-18 aún
  // no se aplicó. Conserva la semántica: nunca deja el saldo negativo.
  const { data } = await admin.from("profiles").select("coins").eq("id", uid).maybeSingle();
  const cur = ((data ?? {}) as { coins?: number }).coins ?? 0;
  if (cur < amount) return { ok: false, coins: cur, error: "insufficient_coins" };
  const newCoins = cur - amount;
  await admin.from("profiles").update({ coins: newCoins }).eq("id", uid);
  return { ok: true, coins: newCoins };
}

/** Saldo actual de Fútcoins del usuario (profiles.coins). Fail-soft a 0 — solo
 *  lectura para pintar el saldo en la UI. */
export async function getWalletBalance(uid: string): Promise<number> {
  try {
    const admin = adminClient();
    const { data } = await admin.from("profiles").select("coins").eq("id", uid).maybeSingle();
    return (data as { coins?: number } | null)?.coins ?? 0;
  } catch {
    return 0;
  }
}
