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
// Las TASAS (cuántas Fútcoins por acción) viven en earn.ts; este módulo solo se
// ocupa de PERSISTIR el abono en la fuente de verdad.

import { adminClient } from "@/lib/predictions/admin";
import { addSeasonXp } from "@/lib/predictions/gamification-store";

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
  opts: { seasonXp?: boolean } = {},
): Promise<WalletGrant> {
  const c = Math.max(0, Math.round(coins));
  const x = Math.max(0, Math.round(xp));
  const admin = adminClient();
  const { data } = await admin.from("profiles").select("coins,xp").eq("id", uid).maybeSingle();
  const prof = (data ?? {}) as { coins?: number; xp?: number };
  const newCoins = (prof.coins ?? 0) + c;
  const newXp = (prof.xp ?? 0) + x;
  await admin.from("profiles").update({ coins: newCoins, xp: newXp }).eq("id", uid);
  if (x > 0 && opts.seasonXp !== false) await addSeasonXp(uid, x).catch(() => {});
  return { coinsAwarded: c, xpAwarded: x, coins: newCoins, xp: newXp };
}
