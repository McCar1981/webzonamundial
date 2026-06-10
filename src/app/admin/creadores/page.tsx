// /admin/creadores — dashboard ADMIN del programa de creadores.
// Protegido por middleware (cookie zm_admin). Desde aquí Carlos:
//   * ve registros/premium/bonos de cada creador y los totales del programa,
//   * da de alta creadores y edita sus condiciones (nivel, %, umbral, techo),
//   * vincula el email de acceso de cada creador a su panel /admin,
//   * registra pagos (bono mensual, revenue share…) y gestiona patrocinadores.

import type { Metadata } from "next";
import Link from "next/link";
import {
  bonusForMonth,
  formatEur,
  getAllCreators,
  getMonthlySeries,
  getPayments,
  getProgramStats,
  getSponsors,
  mesLabel,
  currentMadridMonth,
  previousMadridMonth,
  sumPayments,
  totalBonusDevengado,
  type CreatorPaymentRow,
  type CreatorProgramRow,
  type CreatorSponsorRow,
  type CreatorStats,
  type MonthlyPoint,
} from "@/lib/creators/program";
import AdminForm from "./AdminForm";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  addSponsor,
  createCreator,
  deletePayment,
  recordPayment,
  updateCreator,
  updateSponsor,
} from "./actions";

export const metadata: Metadata = {
  title: "Programa de creadores · Admin ZonaMundial",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const INPUT =
  "rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm px-3 py-2 " +
  "focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40 placeholder:text-gray-600";
const LABEL = "text-[11px] font-bold text-gray-400 uppercase tracking-wider";

const ESTADOS_SPONSOR = [
  ["propuesto", "Propuesto"],
  ["en_conversacion", "En conversación"],
  ["cerrado", "Cerrado"],
  ["descartado", "Descartado"],
] as const;

interface CreatorBundle {
  creator: CreatorProgramRow;
  stats: CreatorStats;
  months: MonthlyPoint[];
  payments: CreatorPaymentRow[];
  sponsors: CreatorSponsorRow[];
}

export default async function AdminCreadoresPage() {
  let creators: CreatorProgramRow[];
  let statsMap: Map<string, CreatorStats>;
  let allPayments: CreatorPaymentRow[];
  let allSponsors: CreatorSponsorRow[];
  let monthsBySlug: Map<string, MonthlyPoint[]>;

  try {
    [creators, statsMap, allPayments, allSponsors] = await Promise.all([
      getAllCreators(),
      getProgramStats(),
      getPayments(),
      getSponsors(),
    ]);
    const monthly = await Promise.all(creators.map((c) => getMonthlySeries(c.slug)));
    monthsBySlug = new Map(creators.map((c, i) => [c.slug, monthly[i]]));
  } catch (e) {
    return <SetupNotice message={(e as Error).message} />;
  }

  const mesActual = currentMadridMonth();
  const mesAnterior = previousMadridMonth();

  const bundles: CreatorBundle[] = creators.map((c) => ({
    creator: c,
    stats: statsMap.get(c.slug) ?? {
      slug: c.slug,
      registros_total: 0,
      registros_mes: 0,
      registros_hoy: 0,
      registros_7d: 0,
      registros_7d_prev: 0,
      premium_total: 0,
    },
    months: monthsBySlug.get(c.slug) ?? [],
    payments: allPayments.filter((p) => p.creator_slug === c.slug),
    sponsors: allSponsors.filter((s) => s.creator_slug === c.slug),
  }));

  const activos = bundles.filter((b) => b.creator.active);
  const totRegistros = activos.reduce((a, b) => a + b.stats.registros_total, 0);
  const totMes = activos.reduce((a, b) => a + b.stats.registros_mes, 0);
  const totPremium = activos.reduce((a, b) => a + b.stats.premium_total, 0);
  const totBonoMes = activos.reduce(
    (a, b) => a + bonusForMonth(b.stats.registros_mes, b.creator).devengado,
    0
  );
  const totPagado = sumPayments(allPayments);
  const totPendienteBono = bundles.reduce((a, b) => {
    const dev = totalBonusDevengado(withCurrentMonth(b.months, mesActual, b.stats.registros_mes), b.creator);
    return a + Math.max(0, dev - sumPayments(b.payments, "bono"));
  }, 0);
  const sponsorsAbiertos = allSponsors.filter(
    (s) => s.estado === "propuesto" || s.estado === "en_conversacion"
  ).length;
  const sponsorsCerradosEur = allSponsors
    .filter((s) => s.estado === "cerrado")
    .reduce((a, s) => a + (s.valor_eur ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AdminHeader
          title="Programa de creadores"
          current="/admin/creadores"
          description="Registros y premium en vivo desde Supabase (atribución por fav_creator). El bono se calcula por mes natural (hora de Madrid) con techo por nivel. Los creadores entran en /admin con la cuenta del email vinculado."
        />

        {/* Totales del programa */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Card label="Registros atribuidos" value={String(totRegistros)} />
          <Card label={`Este mes (${mesLabel(mesActual)})`} value={String(totMes)} />
          <Card label="Premium de comunidades" value={String(totPremium)} />
          <Card label="Bono devengado este mes" value={formatEur(totBonoMes)} gold />
          <Card label="Bono pendiente de pago" value={formatEur(totPendienteBono)} gold />
          <Card label="Pagado (campaña)" value={formatEur(totPagado)} />
          <Card label="Sponsors abiertos" value={String(sponsorsAbiertos)} />
          <Card label="Sponsors cerrados" value={formatEur(sponsorsCerradosEur)} />
        </section>

        {/* Creadores */}
        <section className="space-y-4 mb-12">
          {bundles.map((b) => (
            <CreatorCard key={b.creator.slug} bundle={b} mesActual={mesActual} mesAnterior={mesAnterior} />
          ))}
        </section>

        {/* Alta de creador */}
        <section className="rounded-2xl border border-[#C9A84C]/25 bg-white/5 p-5 mb-10">
          <h2 className="font-bold mb-1">Añadir creador</h2>
          <p className="text-xs text-gray-400 mb-4">
            El slug debe coincidir con el de su landing (<code>/registro/[slug]</code>) y con{" "}
            <code>fav_creator</code>. Si el slug no existe en el catálogo web (
            <code>src/data/creadores.ts</code>), tendrá panel pero no landing pública.
          </p>
          <AdminForm action={createCreator} submitLabel="Crear creador" resetOnSuccess className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <Field label="Slug *">
                <input name="slug" required placeholder="niku" className={INPUT} />
              </Field>
              <Field label="Nombre *">
                <input name="display_name" required placeholder="Niku" className={INPUT} />
              </Field>
              <Field label="Email de acceso">
                <input name="email" type="email" placeholder="creador@email.com" className={INPUT} />
              </Field>
              <Field label="Audiencia">
                <input name="audience_label" placeholder="300K" className={INPUT} />
              </Field>
              <Field label="Nivel">
                <select name="nivel" defaultValue="2" className={INPUT}>
                  <option value="2">N2 · Estándar</option>
                  <option value="3">N3 · Avanzado</option>
                  <option value="4">N4 · Élite</option>
                </select>
              </Field>
              <Field label="Rev share %">
                <input name="rev_share_pct" type="number" step="0.5" min="0" max="100" defaultValue="40" className={INPUT} />
              </Field>
              <Field label="Registros / bono">
                <input name="bonus_threshold" type="number" min="1" defaultValue="250" className={INPUT} />
              </Field>
              <Field label="Techo mensual €">
                <input name="bonus_cap_eur" type="number" step="50" min="0" defaultValue="600" className={INPUT} />
              </Field>
            </div>
            <input type="hidden" name="bonus_unit_eur" value="150" />
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-3">
              <input type="checkbox" name="active" defaultChecked className="accent-[#C9A84C]" /> Activo
            </label>
          </AdminForm>
        </section>

        <footer className="text-center text-xs text-gray-600 pb-8">
          Tip: el panel del creador vive en <code>/admin</code> — entra él con su cuenta (email vinculado
          arriba). Tu acceso de gestión sigue en <code>/admin/login</code>.
        </footer>
      </div>
    </div>
  );
}

function withCurrentMonth(months: MonthlyPoint[], mesActual: string, registrosMes: number): MonthlyPoint[] {
  return months.some((m) => m.mes === mesActual) ? months : [...months, { mes: mesActual, registros: registrosMes }];
}

function Card({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${gold ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-white/10 bg-white/5"}`}>
      <div className={`text-2xl font-black ${gold ? "text-[#C9A84C]" : ""}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

function CreatorCard({
  bundle,
  mesActual,
  mesAnterior,
}: {
  bundle: CreatorBundle;
  mesActual: string;
  mesAnterior: string;
}) {
  const { creator: c, stats, months, payments, sponsors } = bundle;
  const bonusMes = bonusForMonth(stats.registros_mes, c);
  const devengado = totalBonusDevengado(withCurrentMonth(months, mesActual, stats.registros_mes), c);
  const pagadoBono = sumPayments(payments, "bono");
  const pendiente = Math.max(0, devengado - pagadoBono);

  const prevMonthRegistros = months.find((m) => m.mes === mesAnterior)?.registros ?? 0;
  const bonusPrev = bonusForMonth(prevMonthRegistros, c);
  const prevYaPagado = payments.some((p) => p.concepto === "bono" && p.periodo === mesAnterior);

  return (
    <details className={`rounded-2xl border ${c.active ? "border-white/10" : "border-red-500/30 opacity-70"} bg-white/5 overflow-hidden`}>
      <summary className="cursor-pointer list-none p-4 sm:px-5 hover:bg-white/[0.03] transition-all">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-black text-lg truncate">{c.display_name}</span>
            <span className="rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 text-[11px] font-bold shrink-0">
              N{c.nivel} · {c.rev_share_pct}%
            </span>
            {!c.active && (
              <span className="rounded-full border border-red-500/40 bg-red-500/10 text-red-300 px-2 py-0.5 text-[11px] font-bold">
                Inactivo
              </span>
            )}
            {!c.email && c.active && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 px-2 py-0.5 text-[11px] font-bold">
                ⚠ sin email de acceso
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <Mini label="mes" value={String(stats.registros_mes)} />
            <Mini label="total" value={String(stats.registros_total)} />
            <Mini label="premium" value={String(stats.premium_total)} />
            <Mini label="bono mes" value={formatEur(bonusMes.devengado)} gold />
            <Mini label="pendiente" value={formatEur(pendiente)} gold />
          </div>
        </div>
      </summary>

      <div className="border-t border-white/10 p-4 sm:p-5 space-y-6">
        {/* Condiciones */}
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-3">Condiciones y acceso</h3>
          <AdminForm action={updateCreator} submitLabel="Guardar cambios" className="space-y-3">
            <input type="hidden" name="original_slug" value={c.slug} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <Field label="Nombre">
                <input name="display_name" defaultValue={c.display_name} className={INPUT} />
              </Field>
              <Field label="Email de acceso">
                <input name="email" type="email" defaultValue={c.email ?? ""} placeholder="sin acceso" className={INPUT} />
              </Field>
              <Field label="Audiencia">
                <input name="audience_label" defaultValue={c.audience_label ?? ""} className={INPUT} />
              </Field>
              <Field label="Nivel">
                <select name="nivel" defaultValue={String(c.nivel)} className={INPUT}>
                  <option value="2">N2 · Estándar</option>
                  <option value="3">N3 · Avanzado</option>
                  <option value="4">N4 · Élite</option>
                </select>
              </Field>
              <Field label="Rev share %">
                <input name="rev_share_pct" type="number" step="0.5" min="0" max="100" defaultValue={String(c.rev_share_pct)} className={INPUT} />
              </Field>
              <Field label="Registros / bono">
                <input name="bonus_threshold" type="number" min="1" defaultValue={String(c.bonus_threshold)} className={INPUT} />
              </Field>
              <Field label="Bono € / bloque">
                <input name="bonus_unit_eur" type="number" step="10" min="1" defaultValue={String(c.bonus_unit_eur)} className={INPUT} />
              </Field>
              <Field label="Techo mensual €">
                <input name="bonus_cap_eur" type="number" step="50" min="0" defaultValue={String(c.bonus_cap_eur)} className={INPUT} />
              </Field>
            </div>
            <Field label="Notas internas">
              <textarea name="notes" rows={2} defaultValue={c.notes ?? ""} className={`${INPUT} w-full`} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-300 my-3">
              <input type="checkbox" name="active" defaultChecked={c.active} className="accent-[#C9A84C]" />
              Activo en el programa (desactivar lo saca del ranking y le corta el acceso)
            </label>
          </AdminForm>
        </div>

        {/* Pagos */}
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-1">Pagos</h3>
          <p className="text-xs text-gray-500 mb-3">
            Bono devengado campaña: <strong className="text-gray-300">{formatEur(devengado)}</strong> · bono
            pagado: <strong className="text-gray-300">{formatEur(pagadoBono)}</strong> · pendiente:{" "}
            <strong className="text-[#C9A84C]">{formatEur(pendiente)}</strong>
          </p>

          {bonusPrev.devengado > 0 && !prevYaPagado && (
            <AdminForm
              action={recordPayment}
              submitLabel={`Liquidar bono de ${mesLabel(mesAnterior)}: ${formatEur(bonusPrev.devengado)}`}
              className="mb-3"
            >
              <input type="hidden" name="creator_slug" value={c.slug} />
              <input type="hidden" name="concepto" value="bono" />
              <input type="hidden" name="periodo" value={mesAnterior} />
              <input type="hidden" name="amount_eur" value={String(bonusPrev.devengado)} />
              <input type="hidden" name="note" value={`Bono ${mesLabel(mesAnterior)} · ${prevMonthRegistros} registros`} />
            </AdminForm>
          )}

          {payments.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <strong className="capitalize">{p.concepto.replace("_", " ")}</strong>
                    {p.periodo && <span className="text-gray-500"> · {mesLabel(p.periodo)}</span>}
                    {p.note && <span className="text-gray-500 text-xs"> · {p.note}</span>}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-green-400">{formatEur(p.amount_eur)}</span>
                    <AdminForm action={deletePayment} submitLabel="✕" danger confirmText={`¿Borrar el pago de ${formatEur(p.amount_eur)} a ${c.display_name}?`} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                    </AdminForm>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <AdminForm action={recordPayment} submitLabel="Registrar pago" resetOnSuccess className="flex items-end gap-3 flex-wrap">
            <input type="hidden" name="creator_slug" value={c.slug} />
            <Field label="Concepto">
              <select name="concepto" defaultValue="bono" className={INPUT}>
                <option value="bono">Bono</option>
                <option value="revenue_share">Revenue share</option>
                <option value="patrocinio">Patrocinio</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <Field label="Periodo (AAAA-MM)">
              <input name="periodo" placeholder={mesAnterior} className={INPUT} />
            </Field>
            <Field label="Importe €">
              <input name="amount_eur" type="number" step="0.01" min="0.01" required className={INPUT} />
            </Field>
            <Field label="Nota">
              <input name="note" placeholder="opcional" className={INPUT} />
            </Field>
          </AdminForm>
        </div>

        {/* Patrocinadores */}
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-3">Patrocinadores aportados (70/30 a su favor)</h3>
          {sponsors.length > 0 && (
            <ul className="space-y-2 mb-3">
              {sponsors.map((s) => (
                <li key={s.id} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                  <AdminForm action={updateSponsor} submitLabel="Guardar" className="flex items-end gap-3 flex-wrap">
                    <input type="hidden" name="id" value={s.id} />
                    <div className="min-w-[140px]">
                      <div className="font-bold text-sm">{s.empresa}</div>
                      {s.contacto && <div className="text-xs text-gray-500">{s.contacto}</div>}
                    </div>
                    <Field label="Estado">
                      <select name="estado" defaultValue={s.estado} className={INPUT}>
                        {ESTADOS_SPONSOR.map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Valor del deal €">
                      <input name="valor_eur" type="number" step="100" min="0" defaultValue={s.valor_eur ?? ""} className={INPUT} />
                    </Field>
                    <Field label="Notas">
                      <input name="notas" defaultValue={s.notas ?? ""} className={INPUT} />
                    </Field>
                  </AdminForm>
                </li>
              ))}
            </ul>
          )}
          <AdminForm action={addSponsor} submitLabel="Añadir patrocinador" resetOnSuccess className="flex items-end gap-3 flex-wrap">
            <input type="hidden" name="creator_slug" value={c.slug} />
            <Field label="Marca / empresa">
              <input name="empresa" required className={INPUT} />
            </Field>
            <Field label="Contacto">
              <input name="contacto" className={INPUT} />
            </Field>
          </AdminForm>
        </div>
      </div>
    </details>
  );
}

function Mini({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <span className="text-right">
      <span className={`font-mono font-bold ${gold ? "text-[#C9A84C]" : "text-gray-200"}`}>{value}</span>
      <span className="block text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
    </span>
  );
}

function SetupNotice({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#060B14] text-white flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
        <h1 className="font-bold text-amber-300 mb-2">Falta inicializar el programa de creadores</h1>
        <p className="text-sm text-gray-300 mb-3">
          Ejecuta la migración <code className="text-amber-200">scripts/sql/2026-27-creator-program.sql</code>{" "}
          en el editor SQL de Supabase (también está en <code>SQL-PENDIENTES/04</code>) y recarga esta página.
        </p>
        <p className="text-xs text-gray-500 font-mono break-all">{message}</p>
      </div>
    </div>
  );
}
