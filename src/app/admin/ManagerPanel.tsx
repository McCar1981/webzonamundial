// Panel del MANAGER (agencia) — server component, SOLO LECTURA.
//
// Ve la remuneración económica de TODOS los creadores del programa: bono
// devengado / pagado / pendiente, premium generado y su revenue share,
// patrocinadores cerrados, y los totales. No tiene ninguna acción de edición
// ni acceso al resto del admin (no recibe la cookie de admin: el middleware le
// bloquea /admin/creadores, /admin/founders, etc.).

import Link from "next/link";
import {
  bonusForMonth,
  currentMadridMonth,
  formatEur,
  getAllCreators,
  getMonthlySeries,
  getPayments,
  getPremiumRevenue,
  getProgramStats,
  getSponsors,
  mesLabel,
  sumPayments,
  totalBonusDevengado,
  type CreatorManagerRow,
  type CreatorStats,
  type MonthlyPoint,
} from "@/lib/creators/program";
import LogoutButton from "@/components/admin/LogoutButton";

function withCurrentMonth(months: MonthlyPoint[], mes: string, registrosMes: number): MonthlyPoint[] {
  // Reemplaza el mes en curso con el valor AJUSTADO (no solo lo añade), para que
  // el bono devengado refleje el ajuste manual de registros.
  return [...months.filter((m) => m.mes !== mes), { mes, registros: registrosMes }];
}

const EMPTY_STATS: CreatorStats = {
  slug: "",
  registros_total: 0,
  registros_mes: 0,
  registros_hoy: 0,
  registros_7d: 0,
  registros_7d_prev: 0,
  premium_total: 0,
};

export default async function ManagerPanel({ manager }: { manager: CreatorManagerRow }) {
  const mesActual = currentMadridMonth();

  let creators, statsMap, allPayments, allSponsors;
  try {
    [creators, statsMap, allPayments, allSponsors] = await Promise.all([
      getAllCreators(),
      getProgramStats(),
      getPayments(),
      getSponsors(),
    ]);
  } catch (e) {
    return <SetupNotice message={(e as Error).message} />;
  }

  const activos = creators.filter((c) => c.active);
  const [monthlyByCreator, premiumByCreator] = await Promise.all([
    Promise.all(activos.map((c) => getMonthlySeries(c.slug))),
    Promise.all(activos.map((c) => getPremiumRevenue(c.slug))),
  ]);

  const rows = activos.map((c, i) => {
    const stats = statsMap.get(c.slug) ?? { ...EMPTY_STATS, slug: c.slug };
    const months = monthlyByCreator[i];
    const premium = premiumByCreator[i];
    const payments = allPayments.filter((p) => p.creator_slug === c.slug);
    const sponsors = allSponsors.filter((s) => s.creator_slug === c.slug);

    const bonoMes = bonusForMonth(stats.registros_mes, c).devengado;
    const devengado = totalBonusDevengado(withCurrentMonth(months, mesActual, stats.registros_mes), c);
    const pagadoBono = sumPayments(payments, "bono");
    const pendiente = Math.max(0, devengado - pagadoBono);
    const pagadoTotal = sumPayments(payments);
    const shareMes = (premium.ingresos_mes_eur * c.rev_share_pct) / 100;
    const sponsorsCerrados = sponsors
      .filter((s) => s.estado === "cerrado")
      .reduce((a, s) => a + (s.valor_eur ?? 0), 0);

    return {
      creator: c,
      stats,
      bonoMes,
      devengado,
      pagadoBono,
      pendiente,
      pagadoTotal,
      premiumSubs: premium.subs_activas,
      shareMes,
      sponsorsCerrados,
    };
  });

  const tot = rows.reduce(
    (a, r) => ({
      registros: a.registros + r.stats.registros_total,
      mes: a.mes + r.stats.registros_mes,
      premium: a.premium + r.stats.premium_total,
      bonoMes: a.bonoMes + r.bonoMes,
      pendiente: a.pendiente + r.pendiente,
      pagado: a.pagado + r.pagadoTotal,
      share: a.share + r.shareMes,
      sponsors: a.sponsors + r.sponsorsCerrados,
    }),
    { registros: 0, mes: 0, premium: 0, bonoMes: 0, pendiente: 0, pagado: 0, share: 0, sponsors: 0 },
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Remuneración de <span className="text-[#C9A84C]">creadores</span>
            </h1>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-gray-300">
              Manager · solo lectura
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Hola{manager.name ? `, ${manager.name}` : ""}. Vista económica de toda la cartera —{" "}
            {mesLabel(mesActual)}. Datos en vivo.
          </p>
        </header>

        {/* Totales */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card label="Bono devengado este mes" value={formatEur(tot.bonoMes)} gold />
          <Card label="Bono pendiente de pago" value={formatEur(tot.pendiente)} gold />
          <Card label="Pagado (campaña)" value={formatEur(tot.pagado)} />
          <Card label="Rev. share premium / mes" value={formatEur(tot.share)} />
          <Card label="Registros totales" value={String(tot.registros)} />
          <Card label={`Registros (${mesLabel(mesActual)})`} value={String(tot.mes)} />
          <Card label="Premium de comunidades" value={String(tot.premium)} />
          <Card label="Patrocinios cerrados" value={formatEur(tot.sponsors)} />
        </section>

        {/* Tabla por creador */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-3 py-3">Creador</th>
                <th className="px-3 py-3 text-right">Reg. mes</th>
                <th className="px-3 py-3 text-right">Reg. total</th>
                <th className="px-3 py-3 text-right">Premium</th>
                <th className="px-3 py-3 text-right">Rev. share/mes</th>
                <th className="px-3 py-3 text-right">Bono mes</th>
                <th className="px-3 py-3 text-right">Pendiente</th>
                <th className="px-3 py-3 text-right">Pagado</th>
                <th className="px-3 py-3 text-right">Patrocinios</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.creator.slug} className="border-t border-white/5">
                  <td className="px-3 py-3">
                    <div className="font-bold">{r.creator.display_name}</div>
                    <div className="text-[11px] text-gray-500">
                      N{r.creator.nivel} · {r.creator.rev_share_pct}% · bono {formatEur(r.creator.bonus_unit_eur)}/
                      {r.creator.bonus_threshold}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{r.stats.registros_mes}</td>
                  <td className="px-3 py-3 text-right font-mono">{r.stats.registros_total}</td>
                  <td className="px-3 py-3 text-right font-mono">{r.stats.premium_total}</td>
                  <td className="px-3 py-3 text-right font-mono">{formatEur(r.shareMes)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[#C9A84C] font-bold">{formatEur(r.bonoMes)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[#C9A84C]">{formatEur(r.pendiente)}</td>
                  <td className="px-3 py-3 text-right font-mono text-green-400">{formatEur(r.pagadoTotal)}</td>
                  <td className="px-3 py-3 text-right font-mono">{formatEur(r.sponsorsCerrados)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                    Aún no hay creadores activos en el programa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="mt-8 flex items-center gap-4 text-sm">
          <Link href="/app" className="text-gray-400 hover:text-white underline">
            ← Volver a la app
          </Link>
          <LogoutButton />
          <span className="text-xs text-gray-600">
            Vista de manager · sin acceso a la configuración del programa
          </span>
        </footer>
      </div>
    </div>
  );
}

function Card({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${gold ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-white/10 bg-white/5"}`}>
      <div className={`text-2xl font-black ${gold ? "text-[#C9A84C]" : ""}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function SetupNotice({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
        <h1 className="font-bold text-amber-300 mb-2">No se pudo cargar la remuneración</h1>
        <p className="text-sm text-gray-300 mb-3">
          Puede que falte ejecutar alguna migración del programa de creadores. Avisa al administrador.
        </p>
        <p className="text-xs text-gray-500 font-mono break-all">{message}</p>
      </div>
    </div>
  );
}
