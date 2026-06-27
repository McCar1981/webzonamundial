// Programa de Creadores — capa de datos del panel /admin.
//
// Todo el acceso va con el service-role client DESPUÉS de autorizar en la capa
// de aplicación (cookie admin firmada o sesión Supabase cuyo email coincide
// con creator_program.email). Las tablas creator_* tienen RLS sin policies:
// solo service_role puede leerlas, por eso este módulo es server-only.
//
// Modelo de ingresos (doc ZonaMundial_Modelo_Ingresos_Creadores):
//   CAPA 2 — revenue share 35–50% según nivel del creador.
//   CAPA 3 — bono de `bonus_unit_eur` (€150) por cada `bonus_threshold`
//            registros atribuidos EN EL MES, con techo mensual por nivel
//            (N2 €600 / N3 €750 / N4 €900). Se liquida una vez al mes.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface CreatorProgramRow {
  slug: string;
  display_name: string;
  email: string | null;
  nivel: number;
  rev_share_pct: number;
  bonus_threshold: number;
  bonus_unit_eur: number;
  bonus_cap_eur: number;
  audience_label: string | null;
  /** Offset manual aplicado al total y al mes (puede ser negativo). 0 = sin ajuste. */
  registros_ajuste: number;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorStats {
  slug: string;
  registros_total: number;
  registros_mes: number;
  registros_hoy: number;
  registros_7d: number;
  registros_7d_prev: number;
  premium_total: number;
}

export interface CreatorPaymentRow {
  id: string;
  creator_slug: string;
  concepto: "bono" | "revenue_share" | "patrocinio" | "otro";
  periodo: string | null;
  amount_eur: number;
  note: string | null;
  paid_at: string;
}

export interface CreatorSponsorRow {
  id: string;
  creator_slug: string;
  empresa: string;
  contacto: string | null;
  estado: "propuesto" | "en_conversacion" | "cerrado" | "descartado";
  valor_eur: number | null;
  notas: string | null;
  created_at: string;
}

export interface DailyPoint {
  dia: string; // YYYY-MM-DD
  registros: number;
  premium: number;
}

export interface MonthlyPoint {
  mes: string; // YYYY-MM
  registros: number;
}

export interface PremiumRevenue {
  subs_activas: number;
  ingresos_mes_eur: number; // equivalente mensual (yearly prorrateado /12)
}

export function creatorsAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — el panel de creadores requiere el admin client server-only"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// NUMERIC llega como string desde PostgREST; normalizamos a number una vez.
function mapCreator(row: Record<string, unknown>): CreatorProgramRow {
  return {
    slug: String(row.slug),
    display_name: String(row.display_name),
    email: (row.email as string | null) ?? null,
    nivel: Number(row.nivel),
    rev_share_pct: Number(row.rev_share_pct),
    bonus_threshold: Number(row.bonus_threshold),
    bonus_unit_eur: Number(row.bonus_unit_eur),
    bonus_cap_eur: Number(row.bonus_cap_eur),
    audience_label: (row.audience_label as string | null) ?? null,
    registros_ajuste: Number(row.registros_ajuste ?? 0),
    active: Boolean(row.active),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapPayment(row: Record<string, unknown>): CreatorPaymentRow {
  return {
    id: String(row.id),
    creator_slug: String(row.creator_slug),
    concepto: row.concepto as CreatorPaymentRow["concepto"],
    periodo: (row.periodo as string | null) ?? null,
    amount_eur: Number(row.amount_eur),
    note: (row.note as string | null) ?? null,
    paid_at: String(row.paid_at),
  };
}

function mapSponsor(row: Record<string, unknown>): CreatorSponsorRow {
  return {
    id: String(row.id),
    creator_slug: String(row.creator_slug),
    empresa: String(row.empresa),
    contacto: (row.contacto as string | null) ?? null,
    estado: row.estado as CreatorSponsorRow["estado"],
    valor_eur: row.valor_eur == null ? null : Number(row.valor_eur),
    notas: (row.notas as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

export async function getAllCreators(): Promise<CreatorProgramRow[]> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin
    .from("creator_program")
    .select("*")
    .order("nivel", { ascending: false })
    .order("display_name");
  if (error) throw new Error(`creator_program select: ${error.message}`);
  return (data ?? []).map(mapCreator);
}

export async function getCreatorByEmail(email: string): Promise<CreatorProgramRow | null> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin
    .from("creator_program")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(`creator_program by email: ${error.message}`);
  return data ? mapCreator(data) : null;
}

// ---------------------------------------------------------------------------
// Managers — rol que ve la remuneración de TODOS los creadores (read-only).
// ---------------------------------------------------------------------------

export interface CreatorManagerRow {
  email: string;
  name: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

function mapManager(row: Record<string, unknown>): CreatorManagerRow {
  return {
    email: String(row.email),
    name: (row.name as string | null) ?? null,
    active: Boolean(row.active),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

export async function getManagerByEmail(email: string): Promise<CreatorManagerRow | null> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin
    .from("creator_managers")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(`creator_managers by email: ${error.message}`);
  return data ? mapManager(data) : null;
}

export async function getAllManagers(): Promise<CreatorManagerRow[]> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin
    .from("creator_managers")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`creator_managers select: ${error.message}`);
  return (data ?? []).map(mapManager);
}

export async function getProgramStats(): Promise<Map<string, CreatorStats>> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin.rpc("creator_program_stats");
  if (error) throw new Error(`creator_program_stats: ${error.message}`);
  const map = new Map<string, CreatorStats>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(String(row.slug), {
      slug: String(row.slug),
      registros_total: Number(row.registros_total ?? 0),
      registros_mes: Number(row.registros_mes ?? 0),
      registros_hoy: Number(row.registros_hoy ?? 0),
      registros_7d: Number(row.registros_7d ?? 0),
      registros_7d_prev: Number(row.registros_7d_prev ?? 0),
      premium_total: Number(row.premium_total ?? 0),
    });
  }
  return map;
}

export async function getDailySeries(slug: string, days = 14): Promise<DailyPoint[]> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin.rpc("creator_registros_diarios", {
    p_slug: slug,
    p_days: days,
  });
  if (error) throw new Error(`creator_registros_diarios: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    dia: String(r.dia),
    registros: Number(r.registros ?? 0),
    premium: Number(r.premium ?? 0),
  }));
}

export async function getMonthlySeries(slug: string): Promise<MonthlyPoint[]> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin.rpc("creator_registros_mensuales", { p_slug: slug });
  if (error) throw new Error(`creator_registros_mensuales: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    mes: String(r.mes),
    registros: Number(r.registros ?? 0),
  }));
}

export async function getPremiumRevenue(slug: string): Promise<PremiumRevenue> {
  const admin = creatorsAdminClient();
  const { data, error } = await admin.rpc("creator_premium_revenue", { p_slug: slug });
  if (error) throw new Error(`creator_premium_revenue: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  return {
    subs_activas: Number(row?.subs_activas ?? 0),
    ingresos_mes_eur: Number(row?.ingresos_mes_cents ?? 0) / 100,
  };
}

export async function getPayments(slug?: string): Promise<CreatorPaymentRow[]> {
  const admin = creatorsAdminClient();
  let query = admin.from("creator_payments").select("*").order("paid_at", { ascending: false });
  if (slug) query = query.eq("creator_slug", slug);
  const { data, error } = await query;
  if (error) throw new Error(`creator_payments select: ${error.message}`);
  return (data ?? []).map(mapPayment);
}

export async function getSponsors(slug?: string): Promise<CreatorSponsorRow[]> {
  const admin = creatorsAdminClient();
  let query = admin.from("creator_sponsors").select("*").order("created_at", { ascending: false });
  if (slug) query = query.eq("creator_slug", slug);
  const { data, error } = await query;
  if (error) throw new Error(`creator_sponsors select: ${error.message}`);
  return (data ?? []).map(mapSponsor);
}

// ---------------------------------------------------------------------------
// Matemática del bono (CAPA 3) — pura, testeable.
// ---------------------------------------------------------------------------

export interface MonthBonus {
  /** Bloques de bono cobrables este mes (con techo aplicado). */
  bloques: number;
  /** € devengados este mes (bloques × unidad, nunca por encima del techo). */
  devengado: number;
  /** Registros que faltan para el siguiente bloque (0 si techo alcanzado). */
  faltanParaSiguiente: number;
  /** true si ya no puede devengar más bono este mes. */
  techoAlcanzado: boolean;
  /** Bloques máximos que permite el techo mensual. */
  bloquesMax: number;
}

export function bonusForMonth(registrosDelMes: number, c: CreatorProgramRow): MonthBonus {
  const bloquesMax = c.bonus_unit_eur > 0 ? Math.floor(c.bonus_cap_eur / c.bonus_unit_eur) : 0;
  const bloquesSinTecho = Math.floor(registrosDelMes / c.bonus_threshold);
  const bloques = Math.min(bloquesSinTecho, bloquesMax);
  const techoAlcanzado = bloques >= bloquesMax;
  return {
    bloques,
    devengado: bloques * c.bonus_unit_eur,
    faltanParaSiguiente: techoAlcanzado
      ? 0
      : c.bonus_threshold - (registrosDelMes % c.bonus_threshold),
    techoAlcanzado,
    bloquesMax,
  };
}

export interface BonusHistoryRow extends MonthlyPoint {
  bonus: MonthBonus;
}

/** Histórico del bono mes a mes con las condiciones ACTUALES del creador. */
export function bonusHistory(months: MonthlyPoint[], c: CreatorProgramRow): BonusHistoryRow[] {
  return months.map((m) => ({ ...m, bonus: bonusForMonth(m.registros, c) }));
}

/** Total devengado en bonos (toda la campaña) con las condiciones actuales. */
export function totalBonusDevengado(months: MonthlyPoint[], c: CreatorProgramRow): number {
  return months.reduce((acc, m) => acc + bonusForMonth(m.registros, c).devengado, 0);
}

export function sumPayments(payments: CreatorPaymentRow[], concepto?: CreatorPaymentRow["concepto"]): number {
  return payments
    .filter((p) => (concepto ? p.concepto === concepto : true))
    .reduce((acc, p) => acc + p.amount_eur, 0);
}

/** 'YYYY-MM' del mes actual y anterior en hora de Madrid (cierre de mes natural). */
export function currentMadridMonth(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export function previousMadridMonth(): string {
  const [y, m] = currentMadridMonth().split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const MES_LABELS: Record<string, string> = {
  "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
  "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
  "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre",
};

export function mesLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return `${MES_LABELS[m] ?? m} ${y}`;
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}
