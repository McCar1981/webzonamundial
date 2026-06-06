// src/lib/bars/store.ts
//
// Capa de datos del módulo "Porras Digitales para Bares" (FASE 1).
//
// Clave de diseño: la porra de un bar ES una liga de predicciones. Al crear un
// bar se crea su `prediction_league` (bars.league_id) y el ranking del bar se
// calcula con leagueLeaderboard() ya existente — sin duplicar scoring.
//
// Server-only: usa el cliente admin (SERVICE ROLE) para lecturas públicas
// (página/ranking/TV del bar) y escrituras cruzadas (unir cliente, contar
// escaneos, registrar eventos), igual que el resto de stores del proyecto.

import { adminClient } from "@/lib/predictions/admin";
import { leagueCode } from "@/lib/predictions/gamification";
import { leagueLeaderboard, type LeagueStanding } from "@/lib/predictions/gamification-store";
import { DEFAULT_THEME_ID } from "./themes";
import { DEFAULT_PLAN_ID } from "./plans";

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface BarRow {
  id: string;
  owner_user_id: string;
  league_id: string | null;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  welcome_message: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  theme_id: string;
  cta_label: string;
  status: string;   // draft | published | paused
  plan_id: string;  // arranque | completo | pro
  created_at: string;
  updated_at: string;
}

export interface QrSource {
  id: string;
  bar_id: string;
  code: string;
  source_type: string;
  label: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  scans_count: number;
}

export interface BarPrize {
  id: string;
  bar_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prize_type: string;       // principal | semanal | final
  valid_until: string | null;
  conditions: string | null;
  status: string;           // active | delivered | expired
  winner_user_id: string | null;
  delivered_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "bar";
}

function randomCode(len = 7): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alpha[Math.floor(Math.random() * alpha.length)];
  return out;
}

async function uniqueSlug(base: string): Promise<string> {
  const admin = adminClient();
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const { data } = await admin.from("bars").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${randomCode(3).toLowerCase()}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uniqueQrCode(): Promise<string> {
  const admin = adminClient();
  let code = randomCode(7);
  for (let i = 0; i < 6; i++) {
    const { data } = await admin.from("bar_qr_sources").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
    code = randomCode(7);
  }
  return randomCode(10);
}

// ─── Lecturas ────────────────────────────────────────────────────────────────
export async function getBarBySlug(slug: string): Promise<BarRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*").eq("slug", slug).maybeSingle();
  return (data as BarRow | null) ?? null;
}

export async function getBarByOwner(uid: string): Promise<BarRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*")
    .eq("owner_user_id", uid).order("created_at", { ascending: true }).limit(1).maybeSingle();
  return (data as BarRow | null) ?? null;
}

export async function getBarById(id: string): Promise<BarRow | null> {
  const admin = adminClient();
  const { data } = await admin.from("bars").select("*").eq("id", id).maybeSingle();
  return (data as BarRow | null) ?? null;
}

export async function listQrSources(barId: string): Promise<QrSource[]> {
  const admin = adminClient();
  const { data } = await admin.from("bar_qr_sources").select("*")
    .eq("bar_id", barId).order("created_at", { ascending: true });
  return (data as QrSource[] | null) ?? [];
}

export async function getMainQr(barId: string): Promise<QrSource | null> {
  const admin = adminClient();
  const { data } = await admin.from("bar_qr_sources").select("*")
    .eq("bar_id", barId).eq("source_type", "main").maybeSingle();
  return (data as QrSource | null) ?? null;
}

export async function listPrizes(barId: string): Promise<BarPrize[]> {
  const admin = adminClient();
  const { data } = await admin.from("bar_prizes").select("*")
    .eq("bar_id", barId).order("created_at", { ascending: true });
  return (data as BarPrize[] | null) ?? [];
}

/** Ranking del bar = clasificación de su liga de predicciones (reuso total). */
export async function barLeaderboard(bar: BarRow): Promise<LeagueStanding[]> {
  if (!bar.league_id) return [];
  return leagueLeaderboard(bar.league_id);
}

export async function participantCount(barId: string): Promise<number> {
  const admin = adminClient();
  const { count } = await admin.from("bar_participants")
    .select("user_id", { count: "exact", head: true }).eq("bar_id", barId);
  return count ?? 0;
}

// ─── Escrituras ──────────────────────────────────────────────────────────────
export interface CreateBarInput {
  name: string;
  city?: string;
  themeId?: string;
}

/** Crea el bar + su liga de predicciones + el QR principal, y une al dueño. */
export async function createBar(uid: string, input: CreateBarInput): Promise<BarRow> {
  const admin = adminClient();
  const name = input.name.trim().slice(0, 80) || "Mi bar";
  const slug = await uniqueSlug(slugify(name));

  // 1) La porra = una liga de predicciones (hereda scoring/ranking).
  let code = leagueCode(`bar:${uid}:${Date.now()}`);
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await admin.from("prediction_leagues").select("id").eq("code", code).maybeSingle();
    if (!exists) break;
    code = leagueCode(`bar:${uid}:${Date.now()}:${i}`);
  }
  const { data: league, error: lErr } = await admin.from("prediction_leagues")
    .insert({ name: `Porra ${name}`.slice(0, 60), code, owner_id: uid }).select("id").single();
  if (lErr) throw lErr;
  const leagueId = (league as { id: string }).id;
  await admin.from("prediction_league_members").insert({ league_id: leagueId, user_id: uid });

  // 2) El bar.
  const { data: bar, error: bErr } = await admin.from("bars").insert({
    owner_user_id: uid, league_id: leagueId, name, slug,
    city: input.city?.trim().slice(0, 80) || null,
    theme_id: input.themeId || DEFAULT_THEME_ID, plan_id: DEFAULT_PLAN_ID, status: "draft",
  }).select("*").single();
  if (bErr) throw bErr;
  const row = bar as BarRow;

  // 3) QR principal con tracking.
  const qr = await uniqueQrCode();
  await admin.from("bar_qr_sources").insert({
    bar_id: row.id, code: qr, source_type: "main", label: "Principal",
    utm_source: "qr", utm_medium: "bar", utm_campaign: "mundial2026", utm_content: "main",
  });

  // 4) Atribución del propio dueño como participante.
  await admin.from("bar_participants")
    .upsert({ bar_id: row.id, user_id: uid, source: "manual" }, { onConflict: "bar_id,user_id" });

  return row;
}

const EDITABLE_FIELDS = [
  "name", "logo_url", "cover_url", "description", "welcome_message",
  "address", "city", "phone", "instagram", "website",
  "theme_id", "cta_label", "status",
] as const;

/** Actualiza campos editables del bar del dueño. Ignora claves no permitidas. */
export async function updateBar(uid: string, patch: Record<string, unknown>): Promise<BarRow | null> {
  const admin = adminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of EDITABLE_FIELDS) {
    if (k in patch && patch[k] !== undefined) update[k] = patch[k];
  }
  const { data } = await admin.from("bars").update(update)
    .eq("owner_user_id", uid).select("*").maybeSingle();
  return (data as BarRow | null) ?? null;
}

export interface JoinResult { ok: boolean; alreadyMember: boolean; barId: string; }

/** Une un usuario a la porra del bar (idempotente) y registra atribución. */
export async function joinBarPorra(
  uid: string, bar: BarRow, opts: { source?: string; qrSourceId?: string | null } = {},
): Promise<JoinResult> {
  const admin = adminClient();
  if (!bar.league_id) return { ok: false, alreadyMember: false, barId: bar.id };

  const { data: existing } = await admin.from("bar_participants")
    .select("user_id").eq("bar_id", bar.id).eq("user_id", uid).maybeSingle();
  const alreadyMember = !!existing;

  await admin.from("prediction_league_members")
    .upsert({ league_id: bar.league_id, user_id: uid }, { onConflict: "league_id,user_id" });
  await admin.from("bar_participants").upsert({
    bar_id: bar.id, user_id: uid,
    source: opts.source ?? "qr", qr_source_id: opts.qrSourceId ?? null,
  }, { onConflict: "bar_id,user_id" });

  if (!alreadyMember) {
    await logEvent(bar.id, "bar_user_joined", { user_id: uid, qr_source_id: opts.qrSourceId ?? null });
  }
  return { ok: true, alreadyMember, barId: bar.id };
}

/** Resuelve un código QR: devuelve la URL de destino y cuenta el escaneo. */
export async function resolveQrScan(code: string): Promise<{ bar: BarRow; qr: QrSource } | null> {
  const admin = adminClient();
  const { data: qr } = await admin.from("bar_qr_sources").select("*").eq("code", code).maybeSingle();
  if (!qr) return null;
  const q = qr as QrSource;
  const bar = await getBarById(q.bar_id);
  if (!bar) return null;

  await admin.from("bar_qr_sources").update({ scans_count: q.scans_count + 1 }).eq("id", q.id);
  await logEvent(bar.id, "bar_qr_scan", { qr_source_id: q.id, source_type: q.source_type });
  return { bar, qr: q };
}

// ─── Premios ─────────────────────────────────────────────────────────────────
export interface PrizeInput {
  title: string; description?: string; prizeType?: string; conditions?: string; validUntil?: string | null;
}

export async function createPrize(uid: string, barId: string, input: PrizeInput): Promise<BarPrize | null> {
  const admin = adminClient();
  const bar = await getBarById(barId);
  if (!bar || bar.owner_user_id !== uid) return null;
  const { data } = await admin.from("bar_prizes").insert({
    bar_id: barId, title: input.title.trim().slice(0, 120),
    description: input.description?.trim() || null, prize_type: input.prizeType || "principal",
    conditions: input.conditions?.trim() || null, valid_until: input.validUntil || null,
  }).select("*").single();
  return (data as BarPrize | null) ?? null;
}

export async function deletePrize(uid: string, barId: string, prizeId: string): Promise<boolean> {
  const admin = adminClient();
  const bar = await getBarById(barId);
  if (!bar || bar.owner_user_id !== uid) return false;
  await admin.from("bar_prizes").delete().eq("id", prizeId).eq("bar_id", barId);
  return true;
}

// ─── Eventos / estadísticas ──────────────────────────────────────────────────
export async function logEvent(
  barId: string, eventType: string, meta: Record<string, unknown> = {},
): Promise<void> {
  const admin = adminClient();
  const userId = (meta.user_id as string | undefined) ?? null;
  const qrSourceId = (meta.qr_source_id as string | undefined) ?? null;
  await admin.from("bar_events").insert({
    bar_id: barId, event_type: eventType, user_id: userId, qr_source_id: qrSourceId, meta,
  });
}

export interface BarStats {
  participants: number;
  scans: number;
  predictions: number;
  joins: number;
}

export async function barStats(barId: string): Promise<BarStats> {
  const admin = adminClient();
  const [participants, scans, predictions, joins] = await Promise.all([
    participantCount(barId),
    admin.from("bar_events").select("id", { count: "exact", head: true })
      .eq("bar_id", barId).eq("event_type", "bar_qr_scan").then((r) => r.count ?? 0),
    admin.from("bar_events").select("id", { count: "exact", head: true })
      .eq("bar_id", barId).eq("event_type", "bar_prediction_completed").then((r) => r.count ?? 0),
    admin.from("bar_events").select("id", { count: "exact", head: true })
      .eq("bar_id", barId).eq("event_type", "bar_user_joined").then((r) => r.count ?? 0),
  ]);
  return { participants, scans, predictions, joins };
}
