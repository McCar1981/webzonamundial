// Panel del CREADOR — server component.
//
// Todo se renderiza en servidor con datos en vivo de Supabase (vía las
// funciones service-role de lib/creators/program). El objetivo del diseño es
// EMPUJAR a monetizar: dinero pendiente arriba del todo, progreso al próximo
// bloque de €150, ranking entre creadores y consejos accionables.

import Link from "next/link";
import {
  bonusForMonth,
  bonusHistory,
  formatEur,
  getAllCreators,
  getDailySeries,
  getMonthlySeries,
  getPayments,
  getPremiumRevenue,
  getProgramStats,
  getSponsors,
  mesLabel,
  currentMadridMonth,
  sumPayments,
  totalBonusDevengado,
  type CreatorProgramRow,
  type CreatorStats,
} from "@/lib/creators/program";
import { buildTips } from "@/lib/creators/tips";
import { getCreadorBySlug } from "@/data/creadores";
import CopyLinkButton from "./CopyLinkButton";
import SponsorLeadForm from "./SponsorLeadForm";

const NIVEL_LABEL: Record<number, string> = {
  2: "Nivel 2 · Estándar",
  3: "Nivel 3 · Avanzado",
  4: "Nivel 4 · Élite",
};

const ESTADO_SPONSOR: Record<string, { label: string; cls: string }> = {
  propuesto: { label: "Propuesto", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  en_conversacion: { label: "En conversación", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  cerrado: { label: "Cerrado ✓", cls: "bg-green-500/15 text-green-300 border-green-500/30" },
  descartado: { label: "Descartado", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

export default async function CreatorPanel({ creator }: { creator: CreatorProgramRow }) {
  const [statsMap, daily, months, premium, payments, sponsors, allCreators] = await Promise.all([
    getProgramStats(),
    getDailySeries(creator.slug, 14),
    getMonthlySeries(creator.slug),
    getPremiumRevenue(creator.slug),
    getPayments(creator.slug),
    getSponsors(creator.slug),
    getAllCreators(),
  ]);

  const stats: CreatorStats = statsMap.get(creator.slug) ?? {
    slug: creator.slug,
    registros_total: 0,
    registros_mes: 0,
    registros_hoy: 0,
    registros_7d: 0,
    registros_7d_prev: 0,
    premium_total: 0,
  };

  const mesActual = currentMadridMonth();
  const bonusMes = bonusForMonth(stats.registros_mes, creator);
  // El mes en curso usa el valor AJUSTADO (reemplaza el real en la serie), para
  // que el bono refleje el ajuste manual de registros y no los registros reales.
  const mesesAjustados = [
    ...months.filter((m) => m.mes !== mesActual),
    { mes: mesActual, registros: stats.registros_mes },
  ];
  const devengadoBono = totalBonusDevengado(mesesAjustados, creator);
  const pagadoBono = sumPayments(payments, "bono");
  const pagadoTotal = sumPayments(payments);
  const pendienteBono = Math.max(0, devengadoBono - pagadoBono);

  const sharePremiumMes = (premium.ingresos_mes_eur * creator.rev_share_pct) / 100;
  const sponsorsAbiertos = sponsors.filter((s) => s.estado === "propuesto" || s.estado === "en_conversacion").length;
  const sponsorsCerradosEur = sponsors
    .filter((s) => s.estado === "cerrado")
    .reduce((acc, s) => acc + (s.valor_eur ?? 0), 0);

  const tips = buildTips({
    creator,
    stats,
    bonusMes,
    daily,
    sponsorsAbiertos,
    premiumSharePctLabel: `${creator.rev_share_pct}%`,
  });

  // Ranking del mes entre creadores activos.
  const ranking = allCreators
    .filter((c) => c.active)
    .map((c) => ({
      slug: c.slug,
      nombre: c.display_name,
      mes: statsMap.get(c.slug)?.registros_mes ?? 0,
    }))
    .sort((a, b) => b.mes - a.mes);
  const miPos = ranking.findIndex((r) => r.slug === creator.slug);
  const gapAlSiguiente = miPos > 0 ? ranking[miPos - 1].mes - ranking[miPos].mes + 1 : 0;

  const catalogo = getCreadorBySlug(creator.slug);
  const landingUrl = `https://www.zonamundial.app/registro/${creator.slug}`;
  const shareText = encodeURIComponent(
    `Juega el Mundial 2026 conmigo en ZonaMundial ⚽🏆 Predicciones, fantasy y retos: ${landingUrl}`
  );

  const trend7d =
    stats.registros_7d_prev > 0
      ? Math.round(((stats.registros_7d - stats.registros_7d_prev) / stats.registros_7d_prev) * 100)
      : null;

  const progresoPct = bonusMes.techoAlcanzado
    ? 100
    : Math.min(100, Math.round(((stats.registros_mes % creator.bonus_threshold) / creator.bonus_threshold) * 100));

  // Histórico con el mes en curso ajustado (coherente con el devengado/pendiente).
  const histBonus = bonusHistory(mesesAjustados, creator).reverse();

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Cabecera ─────────────────────────────────────────────── */}
        <header className="flex items-center gap-4 mb-8">
          {catalogo?.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={catalogo.imagen}
              alt={creator.display_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C9A84C]/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#0F1D32] border border-[#1E293B] flex items-center justify-center text-2xl font-black text-[#C9A84C]">
              {creator.display_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
              Hola, <span className="text-[#C9A84C]">{creator.display_name}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
              <span className="rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C] px-2.5 py-0.5 font-bold">
                {NIVEL_LABEL[creator.nivel] ?? `Nivel ${creator.nivel}`}
              </span>
              <span className="text-gray-400">
                Revenue share {creator.rev_share_pct}% · Bono {formatEur(creator.bonus_unit_eur)} /{" "}
                {creator.bonus_threshold} registros (techo {formatEur(creator.bonus_cap_eur)}/mes)
              </span>
            </div>
          </div>
        </header>

        {/* ── Dinero: lo primero que ve ───────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#C9A84C]/15 to-transparent p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Bono pendiente de pago</div>
            <div className="text-3xl font-black text-[#C9A84C] mt-1">{formatEur(pendienteBono)}</div>
            <div className="text-xs text-gray-400 mt-1">se liquida a mes vencido</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Bono devengado (campaña)</div>
            <div className="text-3xl font-black mt-1">{formatEur(devengadoBono)}</div>
            <div className="text-xs text-gray-400 mt-1">por registros atribuidos</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Ya cobrado</div>
            <div className="text-3xl font-black mt-1">{formatEur(pagadoTotal)}</div>
            <div className="text-xs text-gray-400 mt-1">todos los conceptos</div>
          </div>
        </section>

        {/* ── Progreso del mes hacia el próximo bloque ─────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <h2 className="font-bold">
              Bono de {mesLabel(mesActual)}:{" "}
              <span className="text-[#C9A84C]">{formatEur(bonusMes.devengado)}</span>
              <span className="text-gray-500 text-sm font-normal"> / techo {formatEur(creator.bonus_cap_eur)}</span>
            </h2>
            <div className="text-sm text-gray-300">
              {bonusMes.techoAlcanzado ? (
                <span className="text-green-400 font-bold">🔥 Techo alcanzado — enorme</span>
              ) : (
                <>
                  Te faltan <strong className="text-white">{bonusMes.faltanParaSiguiente}</strong> registros para
                  otros <strong className="text-[#C9A84C]">{formatEur(creator.bonus_unit_eur)}</strong>
                </>
              )}
            </div>
          </div>
          <div className="h-3 rounded-full bg-[#0B1825] border border-[#1E293B] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progresoPct}%`,
                background: "linear-gradient(90deg, #A8893D, #C9A84C, #E8D48B)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>
              {stats.registros_mes} registros este mes · bloques cobrados: {bonusMes.bloques}/{bonusMes.bloquesMax}
            </span>
            <span>{creator.bonus_threshold} por bloque</span>
          </div>
        </section>

        {/* ── Tu enlace: la acción nº1 ─────────────────────────────── */}
        <section className="rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#0F1D32] to-[#0B1825] p-5 mb-6">
          <h2 className="font-bold mb-1">Tu enlace de registro</h2>
          <p className="text-xs text-gray-400 mb-3">
            Cada cuenta creada desde tu landing (o que te elige al registrarse) cuenta para tu bono y tu revenue
            share.
          </p>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              readOnly
              value={landingUrl}
              className="w-full rounded-xl bg-[#0B1825] border border-[#1E293B] text-gray-200 text-sm px-4 py-2.5 font-mono"
            />
            <CopyLinkButton url={landingUrl} />
          </div>
          <div className="flex gap-3 mt-3 text-sm flex-wrap">
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:border-green-500/50 transition-all"
            >
              WhatsApp
            </a>
            <a
              href={`https://x.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:border-sky-500/50 transition-all"
            >
              X / Twitter
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(landingUrl)}&text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:border-sky-400/50 transition-all"
            >
              Telegram
            </a>
            {catalogo && (
              <Link
                href={`/registro/${creator.slug}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:border-[#C9A84C]/50 transition-all"
              >
                Ver mi landing →
              </Link>
            )}
          </div>
        </section>

        {/* ── Números de la comunidad ──────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat label="Registros totales" value={String(stats.registros_total)} />
          <Stat label="Este mes" value={String(stats.registros_mes)} />
          <Stat label="Hoy" value={String(stats.registros_hoy)} />
          <Stat
            label="Últimos 7 días"
            value={String(stats.registros_7d)}
            extra={
              trend7d == null ? undefined : (
                <span className={trend7d >= 0 ? "text-green-400" : "text-red-400"}>
                  {trend7d >= 0 ? "▲" : "▼"} {Math.abs(trend7d)}% vs semana anterior
                </span>
              )
            }
          />
          <Stat
            label="Premium de tu comunidad"
            value={String(stats.premium_total)}
            extra={
              stats.registros_total > 0 ? (
                <span>conversión {((stats.premium_total / stats.registros_total) * 100).toFixed(1)}%</span>
              ) : undefined
            }
          />
          <Stat label="Suscripciones Pro activas" value={String(premium.subs_activas)} />
          <Stat label="Premium / mes (comunidad)" value={formatEur(premium.ingresos_mes_eur)} />
          <Stat
            label={`Tu ${creator.rev_share_pct}% estimado / mes`}
            value={formatEur(sharePremiumMes)}
            gold
          />
        </section>

        {/* ── Gráfico 14 días ──────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <h2 className="font-bold mb-4">Registros · últimos 14 días</h2>
          <DailyChart daily={daily} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ── Ranking de creadores (mes) ─────────────────────────── */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold mb-1">Ranking del mes</h2>
            <p className="text-xs text-gray-400 mb-4">
              {miPos === 0
                ? "Vas líder. Que no te pillen. 👑"
                : gapAlSiguiente > 0
                  ? `Estás a ${gapAlSiguiente} registros de adelantar a ${ranking[miPos - 1].nombre}.`
                  : "Registros atribuidos este mes."}
            </p>
            <ol className="space-y-2">
              {ranking.map((r, i) => (
                <li
                  key={r.slug}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                    r.slug === creator.slug
                      ? "border border-[#C9A84C]/50 bg-[#C9A84C]/10 font-bold"
                      : "border border-white/5 bg-white/[0.03]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-center">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</span>
                    {r.nombre}
                    {r.slug === creator.slug && <span className="text-[#C9A84C] text-xs">(tú)</span>}
                  </span>
                  <span className="font-mono">{r.mes}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Consejos para monetizar ────────────────────────────── */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold mb-4">Para ganar más esta semana</h2>
            <div className="space-y-3">
              {tips.map((t) => (
                <div key={t.titulo} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="font-bold text-sm mb-1">
                    <span className="mr-2">{t.emoji}</span>
                    {t.titulo}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{t.cuerpo}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Patrocinadores ───────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
            <h2 className="font-bold">Patrocinadores que has traído</h2>
            {sponsorsCerradosEur > 0 && (
              <span className="text-sm text-green-400 font-bold">
                {formatEur(sponsorsCerradosEur)} cerrados · tu 70% ≈ {formatEur(sponsorsCerradosEur * 0.7)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Las marcas que aportas tú se reparten <strong className="text-gray-200">70/30 a tu favor</strong>.
            Proponla aquí y la trabajamos juntos.
          </p>
          {sponsors.length > 0 && (
            <ul className="space-y-2 mb-5">
              {sponsors.map((s) => {
                const est = ESTADO_SPONSOR[s.estado] ?? ESTADO_SPONSOR.propuesto;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{s.empresa}</div>
                      {s.notas && <div className="text-xs text-gray-500 truncate">{s.notas}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.valor_eur != null && s.estado === "cerrado" && (
                        <span className="text-xs font-mono text-green-300">{formatEur(s.valor_eur)}</span>
                      )}
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${est.cls}`}>
                        {est.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <SponsorLeadForm />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* ── Histórico del bono ─────────────────────────────────── */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold mb-4">Bono mes a mes</h2>
            {histBonus.length === 0 ? (
              <p className="text-sm text-gray-500">Aún sin registros atribuidos.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left pb-2 font-semibold">Mes</th>
                    <th className="text-right pb-2 font-semibold">Registros</th>
                    <th className="text-right pb-2 font-semibold">Bono</th>
                  </tr>
                </thead>
                <tbody>
                  {histBonus.map((h) => (
                    <tr key={h.mes} className="border-t border-white/5">
                      <td className="py-2">{mesLabel(h.mes)}</td>
                      <td className="py-2 text-right font-mono">{h.registros}</td>
                      <td className="py-2 text-right font-mono text-[#C9A84C] font-bold">
                        {formatEur(h.bonus.devengado)}
                        {h.bonus.techoAlcanzado && " 🔝"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* ── Pagos recibidos ────────────────────────────────────── */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold mb-4">Pagos recibidos</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">
                Todavía no hay pagos registrados. El bono se liquida una vez al mes.
              </p>
            ) : (
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-bold capitalize">{p.concepto.replace("_", " ")}</span>
                      {p.periodo && <span className="text-gray-500 text-xs"> · {mesLabel(p.periodo)}</span>}
                      {p.note && <div className="text-xs text-gray-500">{p.note}</div>}
                    </div>
                    <span className="font-mono font-bold text-green-400">{formatEur(p.amount_eur)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="text-center text-xs text-gray-600 pb-8">
          Datos en vivo de ZonaMundial · El bono se liquida a mes vencido (mes natural, hora de Madrid) ·
          Dudas: <a className="underline" href="mailto:business.dev@sprintmarkt.com">business.dev@sprintmarkt.com</a>
        </footer>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  extra,
  gold,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        gold ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className={`text-2xl font-black ${gold ? "text-[#C9A84C]" : ""}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {extra && <div className="text-xs mt-1">{extra}</div>}
    </div>
  );
}

function DailyChart({ daily }: { daily: { dia: string; registros: number }[] }) {
  const W = 560;
  const H = 120;
  const PAD = 4;
  const LABEL_H = 16;
  const n = Math.max(daily.length, 1);
  const max = Math.max(...daily.map((d) => d.registros), 1);
  const barW = (W - PAD * 2) / n;

  return (
    <svg viewBox={`0 0 ${W} ${H + LABEL_H}`} className="w-full" role="img" aria-label="Registros por día">
      {daily.map((d, i) => {
        const h = Math.max(d.registros > 0 ? 3 : 1, Math.round((d.registros / max) * (H - 14)));
        const x = PAD + i * barW;
        return (
          <g key={d.dia}>
            <rect
              x={x + barW * 0.15}
              y={H - h}
              width={barW * 0.7}
              height={h}
              rx={3}
              fill={d.registros > 0 ? "#C9A84C" : "#1E293B"}
            >
              <title>{`${d.dia}: ${d.registros} registros`}</title>
            </rect>
            {d.registros > 0 && (
              <text
                x={x + barW / 2}
                y={H - h - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#E8D48B"
                fontWeight="bold"
              >
                {d.registros}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H + 12}
              textAnchor="middle"
              fontSize="9"
              fill="#64748B"
            >
              {d.dia.slice(8)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
