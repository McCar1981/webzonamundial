// src/lib/cromos/trades.ts
//
// Intercambio P2P de cromos duplicados: ofertas, aceptación y transferencia.

import { adminClient } from "@/lib/predictions/admin";
import { CROMOS, type Cromo } from "./catalog";
import { getUserCollection } from "./collection";

export interface TradeOfferInput {
  creatorId: string;
  offeredCromoIds: number[];
  wantedCromoIds: number[];
  message?: string;
}

export interface TradeOffer {
  id: string;
  creatorId: string;
  creatorName: string | null;
  creatorAvatar: string | null;
  status: string;
  message: string | null;
  createdAt: string;
  offered: Cromo[];
  wanted: Cromo[];
}

const VALID_CROMO_IDS = new Set(CROMOS.map((c) => c.id));
const MAX_TRADE_ITEMS = 12;

export async function createTradeOffer(input: TradeOfferInput): Promise<{ id: string } | { error: string }> {
  const admin = adminClient();

  // Normaliza la entrada del cliente: deduplica y descarta ids que no existen en
  // el catálogo (antes se insertaban tal cual, sin validar).
  const offered = [...new Set(input.offeredCromoIds)].filter((id) => VALID_CROMO_IDS.has(id));
  const wanted = [...new Set(input.wantedCromoIds)].filter((id) => VALID_CROMO_IDS.has(id));

  if (offered.length === 0 || wanted.length === 0) {
    return { error: "empty_offer" };
  }
  if (offered.length > MAX_TRADE_ITEMS || wanted.length > MAX_TRADE_ITEMS) {
    return { error: "too_many_items" };
  }
  // Un mismo cromo no puede estar a la vez en ofrecidos y deseados.
  if (offered.some((id) => wanted.includes(id))) {
    return { error: "offered_wanted_overlap" };
  }

  // Validar que el creador posee todos los cromos ofrecidos.
  const collection = await getUserCollection(input.creatorId);
  if (offered.some((id) => !collection.ownedIds.has(id))) {
    return { error: "not_owner_of_offered" };
  }

  const { data, error } = await admin
    .from("cromo_trade_offers")
    .insert({
      creator_id: input.creatorId,
      message: input.message?.slice(0, 200) ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[cromos] createTradeOffer failed:", error?.message);
    return { error: "create_failed" };
  }

  const offerId = (data as { id: string }).id;

  const { error: offeredErr } = await admin.from("cromo_trade_offered").insert(
    offered.map((id) => ({ offer_id: offerId, cromo_id: id })),
  );
  const { error: wantedErr } = await admin.from("cromo_trade_wanted").insert(
    wanted.map((id) => ({ offer_id: offerId, cromo_id: id })),
  );

  // Si fallan los detalles, no dejes una oferta a medias (sin ofrecidos/deseados).
  if (offeredErr || wantedErr) {
    await admin.from("cromo_trade_offers").delete().eq("id", offerId);
    console.error("[cromos] createTradeOffer items failed:", offeredErr?.message, wantedErr?.message);
    return { error: "create_failed" };
  }

  return { id: offerId };
}

export async function listTradeOffers(limit = 50): Promise<TradeOffer[]> {
  const admin = adminClient();
  const { data } = await admin
    .from("cromo_trade_offers")
    .select("id,creator_id,status,message,created_at,profiles:creator_id(username,avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  const offers = (data as {
    id: string;
    creator_id: string;
    status: string;
    message: string | null;
    created_at: string;
    profiles: { username: string | null; avatar_url: string | null }[] | null;
  }[]).map((o) => ({
    ...o,
    profile: o.profiles?.[0] ?? null,
  }));

  const ids = offers.map((o) => o.id);
  const [offeredRows, wantedRows] = await Promise.all([
    admin.from("cromo_trade_offered").select("offer_id,cromo_id").in("offer_id", ids),
    admin.from("cromo_trade_wanted").select("offer_id,cromo_id").in("offer_id", ids),
  ]);

  const offeredMap = new Map<string, number[]>();
  for (const r of (offeredRows.data ?? []) as { offer_id: string; cromo_id: number }[]) {
    offeredMap.set(r.offer_id, [...(offeredMap.get(r.offer_id) ?? []), r.cromo_id]);
  }

  const wantedMap = new Map<string, number[]>();
  for (const r of (wantedRows.data ?? []) as { offer_id: string; cromo_id: number }[]) {
    wantedMap.set(r.offer_id, [...(wantedMap.get(r.offer_id) ?? []), r.cromo_id]);
  }

  const cromoMap = new Map(CROMOS.map((c) => [c.id, c]));

  return offers.map((o) => ({
    id: o.id,
    creatorId: o.creator_id,
    creatorName: o.profile?.username ?? null,
    creatorAvatar: o.profile?.avatar_url ?? null,
    status: o.status,
    message: o.message,
    createdAt: o.created_at,
    offered: (offeredMap.get(o.id) ?? []).map((id) => cromoMap.get(id)!).filter(Boolean),
    wanted: (wantedMap.get(o.id) ?? []).map((id) => cromoMap.get(id)!).filter(Boolean),
  }));
}

export async function acceptTradeOffer(
  offerId: string,
  acceptorId: string,
): Promise<{ ok: true } | { error: string }> {
  const admin = adminClient();

  // Toda la aceptación + transferencia ocurre de forma ATÓMICA en una única RPC
  // transaccional (accept_cromo_trade) con SELECT ... FOR UPDATE sobre la oferta y
  // las filas a mover. Eso cierra: la doble-aceptación (que duplicaba cromos), la
  // duplicación por varias ofertas sobre la misma carta, y la destrucción de un
  // cromo cuando el receptor ya lo posee. Ver scripts/sql/2026-37-cromos-trade-accept-rpc.sql.
  const { data, error } = await admin.rpc("accept_cromo_trade", {
    p_offer_id: offerId,
    p_acceptor: acceptorId,
  });

  if (error) {
    console.error("[cromos] acceptTradeOffer rpc failed:", error.message);
    return { error: "accept_failed" };
  }

  const code = typeof data === "string" ? data : "accept_failed";
  return code === "ok" ? { ok: true } : { error: code };
}

export async function cancelTradeOffer(
  offerId: string,
  userId: string,
): Promise<{ ok: true } | { error: string }> {
  const admin = adminClient();
  const { data } = await admin
    .from("cromo_trade_offers")
    .select("creator_id,status")
    .eq("id", offerId)
    .maybeSingle();

  if (!data) return { error: "offer_not_found" };
  const o = data as { creator_id: string; status: string };
  if (o.creator_id !== userId) return { error: "not_your_offer" };
  if (o.status !== "active") return { error: "not_active" };

  await admin.from("cromo_trade_offers").update({ status: "cancelled" }).eq("id", offerId);
  return { ok: true };
}
