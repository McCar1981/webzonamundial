// src/lib/predictions/cosmetics-store.ts
//
// Capa de datos (Supabase) de los cosméticos (mejora G: sumidero de monedas).
// Usa el cliente admin (service role): la compra descuenta monedas y otorga el
// cosmético en una operación que el usuario no puede auto-otorgarse. Las APIs
// autentican primero y pasan el userId verificado.
//
// NO importa store.ts ni gamification-store.ts (evita ciclos): solo admin + la
// lógica pura de cosmetics.ts / gamification.ts. El COBRO va por la puerta única
// del universo (spendCoins de economy/wallet), igual que cualquier otro sumidero.

import { adminClient } from "./admin";
import { levelForXp } from "./gamification";
import { spendCoins, grantCoins } from "@/lib/economy/wallet";
import {
  COSMETICS, COSMETIC_KINDS, EQUIP_COLUMN, canBuyCosmetic, cosmeticDef,
  resolveCosmetics, type CosmeticDisplay, type CosmeticKind,
} from "./cosmetics";

// ─── Estado para la tienda de cosméticos (UI propia del usuario) ─────────────
export interface CosmeticItemView {
  id: string;
  kind: CosmeticKind;
  name: string;
  description: string;
  cost: number;
  min_level: number;
  value: string;
  gradient?: string;
  glow?: string;
  owned: boolean;
  equipped: boolean;
  can_buy: boolean;     // nivel suficiente y no comprado
}
export interface CosmeticsState {
  coins: number;
  level: number;
  items: CosmeticItemView[];
  equipped: { frame: string | null; name_color: string | null; title: string | null };
}

interface EquipRow {
  xp: number;
  coins: number;
  cosmetic_frame: string | null;
  cosmetic_name_color: string | null;
  cosmetic_title: string | null;
}

async function readEquip(uid: string): Promise<EquipRow> {
  const admin = adminClient();
  const { data } = await admin
    .from("profiles")
    .select("xp,coins,cosmetic_frame,cosmetic_name_color,cosmetic_title")
    .eq("id", uid).maybeSingle();
  const p = (data ?? {}) as Partial<EquipRow>;
  return {
    xp: p.xp ?? 0,
    coins: p.coins ?? 0,
    cosmetic_frame: p.cosmetic_frame ?? null,
    cosmetic_name_color: p.cosmetic_name_color ?? null,
    cosmetic_title: p.cosmetic_title ?? null,
  };
}

async function readOwned(uid: string): Promise<Set<string>> {
  const admin = adminClient();
  const { data } = await admin
    .from("prediction_cosmetics_owned").select("cosmetic_id").eq("user_id", uid);
  return new Set((data ?? []).map((r) => (r as { cosmetic_id: string }).cosmetic_id));
}

export async function getCosmeticsState(uid: string): Promise<CosmeticsState> {
  const prof = await readEquip(uid);
  const owned = await readOwned(uid);
  const equippedIds = new Set(
    [prof.cosmetic_frame, prof.cosmetic_name_color, prof.cosmetic_title].filter(Boolean) as string[],
  );
  const items: CosmeticItemView[] = COSMETICS.map((c) => ({
    id: c.id, kind: c.kind, name: c.name, description: c.description, cost: c.cost,
    min_level: c.minLevel, value: c.value, gradient: c.gradient, glow: c.glow,
    owned: owned.has(c.id),
    equipped: equippedIds.has(c.id),
    can_buy: canBuyCosmetic(c, prof.xp, owned),
  }));
  return {
    coins: prof.coins,
    level: levelForXp(prof.xp),
    items,
    equipped: {
      frame: prof.cosmetic_frame,
      name_color: prof.cosmetic_name_color,
      title: prof.cosmetic_title,
    },
  };
}

export interface CosmeticBuyResult { ok: boolean; error?: string; coins?: number }
/**
 * Compra un cosmético: valida que exista, que el usuario tenga el nivel mínimo,
 * que no lo posea ya y que tenga monedas suficientes. Descuenta las monedas y
 * registra la propiedad. Idempotente por la PK (user_id, cosmetic_id).
 */
export async function buyCosmetic(uid: string, cosmeticId: string): Promise<CosmeticBuyResult> {
  const def = cosmeticDef(cosmeticId);
  if (!def) return { ok: false, error: "cosmetic_not_found" };

  const admin = adminClient();
  const prof = await readEquip(uid);
  if (levelForXp(prof.xp) < def.minLevel) return { ok: false, error: "level_required" };

  const owned = await readOwned(uid);
  if (owned.has(def.id)) return { ok: false, error: "already_owned" };

  // Cobro ATÓMICO por la puerta única (anti-sobregasto en compras concurrentes).
  const spent = await spendCoins(uid, def.cost);
  if (!spent.ok) return { ok: false, error: "insufficient_coins", coins: spent.coins };

  // Registrar la propiedad (PK protege contra doble compra concurrente). Si la
  // fila ya existía, devolvemos las Fútcoins cobradas: no se paga dos veces.
  const { error: ownErr } = await admin
    .from("prediction_cosmetics_owned")
    .insert({ user_id: uid, cosmetic_id: def.id });
  if (ownErr) {
    await grantCoins(uid, def.cost, 0, { seasonXp: false }).catch(() => {});
    return { ok: false, error: "already_owned", coins: spent.coins + def.cost };
  }
  return { ok: true, coins: spent.coins };
}

export interface CosmeticEquipResult { ok: boolean; error?: string }
/**
 * Equipa (o desequipa con id=null) el cosmético de un tipo. Valida que el
 * usuario lo posea y que el tipo coincida. Escribe la columna de profiles.
 */
export async function equipCosmetic(uid: string, kind: CosmeticKind, cosmeticId: string | null): Promise<CosmeticEquipResult> {
  if (!COSMETIC_KINDS.includes(kind)) return { ok: false, error: "invalid_kind" };
  const column = EQUIP_COLUMN[kind];

  if (cosmeticId !== null) {
    const def = cosmeticDef(cosmeticId);
    if (!def || def.kind !== kind) return { ok: false, error: "cosmetic_not_found" };
    const owned = await readOwned(uid);
    if (!owned.has(def.id)) return { ok: false, error: "not_owned" };
  }

  const admin = adminClient();
  await admin.from("profiles").update({ [column]: cosmeticId }).eq("id", uid);
  return { ok: true };
}

/**
 * Resuelve los cosméticos EQUIPADOS de un conjunto de usuarios a sus valores
 * visuales, para pintarlos en rankings y ligas. Una sola query a profiles.
 */
export async function cosmeticsByUser(userIds: string[]): Promise<Map<string, CosmeticDisplay>> {
  const out = new Map<string, CosmeticDisplay>();
  if (!userIds.length) return out;
  const admin = adminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,cosmetic_frame,cosmetic_name_color,cosmetic_title")
    .in("id", userIds);
  for (const row of (data ?? []) as {
    id: string; cosmetic_frame: string | null; cosmetic_name_color: string | null; cosmetic_title: string | null;
  }[]) {
    out.set(row.id, resolveCosmetics(row));
  }
  return out;
}
