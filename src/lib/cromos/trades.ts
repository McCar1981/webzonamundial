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

export async function createTradeOffer(input: TradeOfferInput): Promise<{ id: string } | { error: string }> {
  const admin = adminClient();

  // Validar que el creador posee todos los cromos ofrecidos
  const collection = await getUserCollection(input.creatorId);
  const missingOffered = input.offeredCromoIds.filter((id) => !collection.ownedIds.has(id));
  if (missingOffered.length > 0) {
    return { error: "not_owner_of_offered" };
  }

  // Validar que hay al menos un cromo ofrecido y uno solicitado
  if (input.offeredCromoIds.length === 0 || input.wantedCromoIds.length === 0) {
    return { error: "empty_offer" };
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

  await admin.from("cromo_trade_offered").insert(
    input.offeredCromoIds.map((id) => ({ offer_id: offerId, cromo_id: id })),
  );
  await admin.from("cromo_trade_wanted").insert(
    input.wantedCromoIds.map((id) => ({ offer_id: offerId, cromo_id: id })),
  );

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

  // Leer oferta
  const { data: offer } = await admin
    .from("cromo_trade_offers")
    .select("id,creator_id,status")
    .eq("id", offerId)
    .eq("status", "active")
    .maybeSingle();

  if (!offer) return { error: "offer_not_found" };
  const { creator_id: creatorId } = offer as { creator_id: string };
  if (creatorId === acceptorId) return { error: "cannot_accept_own" };

  // Leer cromos ofrecidos y queridos
  const [offeredRows, wantedRows] = await Promise.all([
    admin.from("cromo_trade_offered").select("cromo_id").eq("offer_id", offerId),
    admin.from("cromo_trade_wanted").select("cromo_id").eq("offer_id", offerId),
  ]);

  const offeredIds = ((offeredRows.data ?? []) as { cromo_id: number }[]).map((r) => r.cromo_id);
  const wantedIds = ((wantedRows.data ?? []) as { cromo_id: number }[]).map((r) => r.cromo_id);

  // Validar posesiones
  const creatorCollection = await getUserCollection(creatorId);
  const acceptorCollection = await getUserCollection(acceptorId);

  const creatorMissingOffered = offeredIds.filter((id) => !creatorCollection.ownedIds.has(id));
  if (creatorMissingOffered.length > 0) return { error: "creator_missing_offered" };

  const acceptorMissingWanted = wantedIds.filter((id) => !acceptorCollection.ownedIds.has(id));
  if (acceptorMissingWanted.length > 0) return { error: "acceptor_missing_wanted" };

  // Marcar oferta como aceptada
  const { error: updateErr } = await admin
    .from("cromo_trade_offers")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: acceptorId })
    .eq("id", offerId)
    .eq("status", "active");

  if (updateErr) {
    return { error: "already_accepted" };
  }

  // Transferir cromos
  // 1. Creator -> Acceptor (offeredIds)
  for (const cromoId of offeredIds) {
    const { error: deleteErr } = await admin
      .from("user_cromos")
      .delete()
      .eq("user_id", creatorId)
      .eq("cromo_id", cromoId);
    if (deleteErr) throw deleteErr;

    const { error: insertErr } = await admin
      .from("user_cromos")
      .upsert(
        { user_id: acceptorId, cromo_id: cromoId, source: "trade" },
        { onConflict: "user_id,cromo_id", ignoreDuplicates: true },
      );
    if (insertErr) throw insertErr;
  }

  // 2. Acceptor -> Creator (wantedIds)
  for (const cromoId of wantedIds) {
    const { error: deleteErr } = await admin
      .from("user_cromos")
      .delete()
      .eq("user_id", acceptorId)
      .eq("cromo_id", cromoId);
    if (deleteErr) throw deleteErr;

    const { error: insertErr } = await admin
      .from("user_cromos")
      .upsert(
        { user_id: creatorId, cromo_id: cromoId, source: "trade" },
        { onConflict: "user_id,cromo_id", ignoreDuplicates: true },
      );
    if (insertErr) throw insertErr;
  }

  return { ok: true };
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
